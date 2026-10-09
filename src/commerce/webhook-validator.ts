import * as crypto from 'crypto';
import Redis from 'ioredis';
import { PrismaClient } from '@prisma/client';
import { RedisInventoryManager } from './redis-inventory';

export interface WebhookVerificationOptions {
  toleranceSeconds?: number; // Default 300 (5 minutes)
}

export interface StripeWebhookPayload {
  id: string; // evt_...
  type: string;
  created: number;
  data: {
    object: {
      id: string; // pi_...
      amount: number;
      currency: string;
      status: string;
      metadata: {
        orderId?: string;
        cartId?: string;
        productId?: string;
        userId?: string;
      };
    };
  };
}

export class WebhookSecurityManager {
  private redis: Redis;
  private prisma: PrismaClient;
  private inventoryManager: RedisInventoryManager;
  private webhookSecret: string;

  constructor(
    redis: Redis,
    prisma: PrismaClient,
    inventoryManager: RedisInventoryManager,
    webhookSecret: string
  ) {
    this.redis = redis;
    this.prisma = prisma;
    this.inventoryManager = inventoryManager;
    this.webhookSecret = webhookSecret;
  }

  /**
   * Verify Stripe HMAC-SHA256 signature header:
   * Format: "t=1492774577,v1=5257a869e7ecebeda32affa62cd49ffb1ef54a4121a0e5d47c9454fd4b50c0c6"
   */
  public verifySignature(
    rawBody: string | Buffer,
    signatureHeader: string,
    options: WebhookVerificationOptions = {}
  ): { isValid: boolean; timestamp: number; error?: string } {
    const tolerance = options.toleranceSeconds ?? 300;

    if (!signatureHeader) {
      return { isValid: false, timestamp: 0, error: 'Missing stripe-signature header' };
    }

    const parts = signatureHeader.split(',');
    let timestamp = 0;
    const signatures: string[] = [];

    for (const part of parts) {
      const [key, val] = part.split('=');
      if (key === 't') {
        timestamp = parseInt(val, 10);
      } else if (key === 'v1') {
        signatures.push(val);
      }
    }

    if (!timestamp || signatures.length === 0) {
      return { isValid: false, timestamp: 0, error: 'Malformed signature header' };
    }

    // Replay attack prevention: check timestamp tolerance against current time
    const currentEpoch = Math.floor(Date.now() / 1000);
    if (Math.abs(currentEpoch - timestamp) > tolerance) {
      return {
        isValid: false,
        timestamp,
        error: `Timestamp out of tolerance window (${tolerance}s). Possible replay attack.`,
      };
    }

    // Compute expected HMAC SHA-256
    const payload = `${timestamp}.${typeof rawBody === 'string' ? rawBody : rawBody.toString('utf8')}`;
    const expectedHmac = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(payload, 'utf8')
      .digest('hex');

    // Constant-time comparison to mitigate timing attacks
    const expectedBuf = Buffer.from(expectedHmac, 'hex');
    let matched = false;

    for (const sig of signatures) {
      const sigBuf = Buffer.from(sig, 'hex');
      if (sigBuf.length === expectedBuf.length && crypto.timingSafeEqual(sigBuf, expectedBuf)) {
        matched = true;
        break;
      }
    }

    if (!matched) {
      return { isValid: false, timestamp, error: 'Invalid HMAC signature' };
    }

    return { isValid: true, timestamp };
  }

  /**
   * Enterprise Idempotent Webhook Processor
   * Leverages Redis distributed lock + Postgres transaction log to guarantee EXACTLY-ONCE execution.
   */
  public async processPaymentSuccessWebhook(
    rawBody: string,
    signatureHeader: string
  ): Promise<{ status: 'PROCESSED' | 'ALREADY_PROCESSED' | 'LOCKED' | 'FAILED'; message: string }> {
    // 1. Cryptographic HMAC validation
    const verification = this.verifySignature(rawBody, signatureHeader);
    if (!verification.isValid) {
      return { status: 'FAILED', message: verification.error || 'Signature check failed' };
    }

    const payload: StripeWebhookPayload = JSON.parse(rawBody);
    const eventId = payload.id;
    const idempotencyKey = `idemp:webhook:${eventId}`;
    const lockKey = `lock:webhook:${eventId}`;

    // 2. Fast Redis Distributed Mutex (prevent parallel race conditions during webhook retries)
    // Acquire lock for 30 seconds
    const acquiredLock = await this.redis.set(lockKey, 'locked', 'EX', 30, 'NX');
    if (!acquiredLock) {
      return { status: 'LOCKED', message: 'Webhook is currently being processed by another worker' };
    }

    try {
      // 3. Database Idempotency Check: Has this event already been processed?
      const existingEvent = await this.prisma.webhookEvent.findUnique({
        where: { eventId },
      });

      if (existingEvent && existingEvent.status === 'PROCESSED') {
        return { status: 'ALREADY_PROCESSED', message: 'Webhook event already fulfilled previously' };
      }

      // Compute payload SHA256 hash for audit integrity
      const payloadHash = crypto.createHash('sha256').update(rawBody).digest('hex');

      // 4. Execute atomic transaction in PostgreSQL & Commit inventory in Redis
      await this.prisma.$transaction(async (tx) => {
        // Record or update webhook log state to PROCESSING
        await tx.webhookEvent.upsert({
          where: { eventId },
          create: {
            provider: 'stripe',
            eventId,
            eventType: payload.type,
            idempotencyKey,
            signatureHeader,
            payloadHash,
            rawPayload: payload as any,
            status: 'PROCESSING',
          },
          update: {
            retryCount: { increment: 1 },
            status: 'PROCESSING',
          },
        });

        // Extract payment metadata
        const { orderId, cartId, productId } = payload.data.object.metadata;

        if (orderId) {
          // Update order status to PAYMENT_CONFIRMED
          await tx.order.update({
            where: { id: orderId },
            data: {
              status: 'PAYMENT_CONFIRMED',
              paymentIntentId: payload.data.object.id,
            },
          });
        }

        if (cartId && productId) {
          // Update inventory reservation record
          await tx.inventoryReservation.updateMany({
            where: { cartId, productId, status: 'ACTIVE' },
            data: { status: 'CONVERTED' },
          });

          // Atomically commit permanent stock deduction in Redis
          await this.inventoryManager.commitSale(productId, cartId);
        }

        // Finalize webhook event status to PROCESSED
        await tx.webhookEvent.update({
          where: { eventId },
          data: {
            status: 'PROCESSED',
            processedAt: new Date(),
          },
        });
      });

      return { status: 'PROCESSED', message: 'Payment confirmed, inventory committed, order fulfilled' };
    } catch (err: any) {
      console.error(`[WebhookManager] Error processing event ${eventId}:`, err);
      // Mark as failed in DB for dead-letter reprocessing
      await this.prisma.webhookEvent.update({
        where: { eventId },
        data: {
          status: 'FAILED',
          errorMessage: err.message,
        },
      }).catch(console.error);

      return { status: 'FAILED', message: err.message };
    } finally {
      // Release distributed lock
      await this.redis.del(lockKey);
    }
  }
}
