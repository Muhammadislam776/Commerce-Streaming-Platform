import Redis from 'ioredis';
import * as fs from 'fs';
import * as path from 'path';

export interface ReservationResult {
  success: boolean;
  status: 'RESERVATION_SUCCESSFUL' | 'INSUFFICIENT_STOCK' | 'ALREADY_RESERVED' | 'SYSTEM_ERROR';
  remainingStock: number;
  ttlRemainingSeconds: number;
}

export class RedisInventoryManager {
  private redis: Redis;
  private luaReservationSha: string | null = null;
  private scriptContent: string;

  constructor(redisClient: Redis) {
    this.redis = redisClient;
    const scriptPath = path.join(__dirname, 'reserve_inventory.lua');
    this.scriptContent = fs.readFileSync(scriptPath, 'utf8');
  }

  /**
   * Pre-load Lua script into Redis script cache to achieve sub-millisecond execution
   */
  public async initializeScript(): Promise<void> {
    this.luaReservationSha = await this.redis.script('LOAD', this.scriptContent) as string;
  }

  /**
   * Synchronize physical stock baseline from Postgres into Redis
   */
  public async setInitialStock(productId: string, stock: number): Promise<void> {
    const stockKey = `stock:product:${productId}`;
    const reservedKey = `reserved:product:${productId}`;
    await this.redis.mset(stockKey, stock, reservedKey, 0);
  }

  /**
   * Execute atomic reservation during flash sales
   */
  public async reserveFlashInventory(
    productId: string,
    cartId: string,
    userId: string,
    quantity: number,
    ttlSeconds: number = 600
  ): Promise<ReservationResult> {
    const stockKey = `stock:product:${productId}`;
    const reservedKey = `reserved:product:${productId}`;
    const cartLockKey = `cart:${cartId}:product:${productId}`;

    try {
      let rawResult: [number, string, number, number];

      if (this.luaReservationSha) {
        rawResult = (await this.redis.evalsha(
          this.luaReservationSha,
          3,
          stockKey,
          reservedKey,
          cartLockKey,
          quantity,
          ttlSeconds,
          userId
        )) as [number, string, number, number];
      } else {
        rawResult = (await this.redis.eval(
          this.scriptContent,
          3,
          stockKey,
          reservedKey,
          cartLockKey,
          quantity,
          ttlSeconds,
          userId
        )) as [number, string, number, number];
      }

      const [code, status, remainingStock, ttl] = rawResult;

      return {
        success: code === 1,
        status: status as ReservationResult['status'],
        remainingStock: Number(remainingStock),
        ttlRemainingSeconds: Number(ttl),
      };
    } catch (error) {
      console.error('[RedisInventoryManager] Reservation failed:', error);
      return {
        success: false,
        status: 'SYSTEM_ERROR',
        remainingStock: 0,
        ttlRemainingSeconds: 0,
      };
    }
  }

  /**
   * Release reservation when user empties cart or reservation expires
   */
  public async releaseReservation(productId: string, cartId: string): Promise<boolean> {
    const reservedKey = `reserved:product:${productId}`;
    const cartLockKey = `cart:${cartId}:product:${productId}`;

    const reservedQty = await this.redis.get(cartLockKey);
    if (!reservedQty) return false;

    const qty = parseInt(reservedQty, 10);
    const pipeline = this.redis.pipeline();
    pipeline.decrby(reservedKey, qty);
    pipeline.del(cartLockKey);
    pipeline.zrem('expiring_reservations', cartLockKey);

    await pipeline.exec();
    return true;
  }

  /**
   * Commit reservation into final sale upon payment success
   */
  public async commitSale(productId: string, cartId: string): Promise<boolean> {
    const stockKey = `stock:product:${productId}`;
    const reservedKey = `reserved:product:${productId}`;
    const cartLockKey = `cart:${cartId}:product:${productId}`;

    const reservedQty = await this.redis.get(cartLockKey);
    if (!reservedQty) return false;

    const qty = parseInt(reservedQty, 10);
    const pipeline = this.redis.pipeline();
    pipeline.decrby(stockKey, qty);
    pipeline.decrby(reservedKey, qty);
    pipeline.del(cartLockKey);
    pipeline.zrem('expiring_reservations', cartLockKey);

    await pipeline.exec();
    return true;
  }
}
