import { WebSocketServer, WebSocket } from 'ws';
import Redis from 'ioredis';
import { IncomingMessage } from 'http';

export interface SyncMessage<T = any> {
  type: 'PIN_PRODUCT' | 'UNPIN_PRODUCT' | 'CHAT_MESSAGE' | 'REACTION' | 'VIEWER_COUNT' | 'INVENTORY_ALERT' | 'HEARTBEAT';
  eventId: string;
  payload: T;
  timestamp: number;
}

export interface ClientSession {
  ws: WebSocket;
  userId: string;
  eventId: string;
  isHost: boolean;
  lastPing: number;
}

export class LiveSyncServer {
  private wss: WebSocketServer;
  private redisPub: Redis;
  private redisSub: Redis;
  private rooms: Map<string, Set<ClientSession>> = new Map();
  private reactionBatcher: Map<string, Record<string, number>> = new Map();

  constructor(port: number, redisUrl: string) {
    this.redisPub = new Redis(redisUrl);
    this.redisSub = new Redis(redisUrl);
    this.wss = new WebSocketServer({ port });

    this.setupRedisSubscriptions();
    this.setupWebSocketHandlers();
    this.startBatchDispatchers();
  }

  private setupRedisSubscriptions(): void {
    // Subscribe to multi-node cluster events
    this.redisSub.psubscribe('event:*:broadcast', (err) => {
      if (err) console.error('[RedisSub] Subscription error:', err);
      else console.log('[RedisSub] Subscribed to pattern event:*:broadcast');
    });

    this.redisSub.on('pmessage', (_pattern, channel, message) => {
      const match = channel.match(/^event:(.+):broadcast$/);
      if (!match) return;
      const eventId = match[1];
      const parsed: SyncMessage = JSON.parse(message);
      this.broadcastToLocalRoom(eventId, parsed);
    });
  }

  private setupWebSocketHandlers(): void {
    this.wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
      const url = new URL(req.url || '', 'http://localhost');
      const eventId = url.searchParams.get('eventId');
      const userId = url.searchParams.get('userId') || `anon_${Math.random().toString(36).substring(7)}`;
      const isHost = url.searchParams.get('role') === 'host';

      if (!eventId) {
        ws.close(1008, 'Missing eventId');
        return;
      }

      const session: ClientSession = {
        ws,
        userId,
        eventId,
        isHost,
        lastPing: Date.now(),
      };

      if (!this.rooms.has(eventId)) {
        this.rooms.set(eventId, new Set());
      }
      this.rooms.get(eventId)!.add(session);

      // Increment Redis viewer count
      this.redisPub.pfadd(`viewers:${eventId}`, userId);
      this.publishViewerCount(eventId);

      ws.on('message', async (raw: string) => {
        try {
          const msg: SyncMessage = JSON.parse(raw.toString());
          await this.handleClientMessage(session, msg);
        } catch (err) {
          ws.send(JSON.stringify({ type: 'ERROR', message: 'Malformed JSON payload' }));
        }
      });

      ws.on('close', () => {
        const room = this.rooms.get(eventId);
        if (room) {
          room.delete(session);
          if (room.size === 0) this.rooms.delete(eventId);
        }
        this.publishViewerCount(eventId);
      });
    });
  }

  /**
   * Process incoming client actions
   */
  private async handleClientMessage(session: ClientSession, msg: SyncMessage): Promise<void> {
    switch (msg.type) {
      case 'PIN_PRODUCT': {
        // Enforce host-only permissions
        if (!session.isHost) {
          session.ws.send(JSON.stringify({ type: 'ERROR', message: 'Unauthorized: Only host can pin products' }));
          return;
        }

        const payload = {
          ...msg,
          timestamp: Date.now(),
        };

        // Persist current active pin to Redis for instant hydration of new viewers
        await this.redisPub.set(`active_pin:${session.eventId}`, JSON.stringify(payload.payload));

        // Publish to distributed Redis cluster
        await this.redisPub.publish(`event:${session.eventId}:broadcast`, JSON.stringify(payload));
        break;
      }

      case 'UNPIN_PRODUCT': {
        if (!session.isHost) return;
        await this.redisPub.del(`active_pin:${session.eventId}`);
        await this.redisPub.publish(`event:${session.eventId}:broadcast`, JSON.stringify(msg));
        break;
      }

      case 'CHAT_MESSAGE': {
        // Broadcast filtered chat
        await this.redisPub.publish(`event:${session.eventId}:broadcast`, JSON.stringify(msg));
        break;
      }

      case 'REACTION': {
        // Aggregate high-frequency reactions in memory (e.g. 10,000 taps/sec)
        const eventBatch = this.reactionBatcher.get(session.eventId) || {};
        const reactionType = msg.payload?.reaction || '❤️';
        eventBatch[reactionType] = (eventBatch[reactionType] || 0) + 1;
        this.reactionBatcher.set(session.eventId, eventBatch);
        break;
      }

      case 'HEARTBEAT': {
        session.lastPing = Date.now();
        break;
      }
    }
  }

  /**
   * Broadcast message to all WebSocket connections on this server node
   */
  private broadcastToLocalRoom(eventId: string, message: SyncMessage): void {
    const clients = this.rooms.get(eventId);
    if (!clients) return;

    const data = JSON.stringify(message);
    for (const client of clients) {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(data);
      }
    }
  }

  /**
   * Periodically flush batched reactions every 250ms to prevent client render chokes
   */
  private startBatchDispatchers(): void {
    setInterval(() => {
      for (const [eventId, batch] of this.reactionBatcher.entries()) {
        if (Object.keys(batch).length > 0) {
          const broadcastMsg: SyncMessage = {
            type: 'REACTION',
            eventId,
            payload: { reactions: { ...batch } },
            timestamp: Date.now(),
          };
          this.redisPub.publish(`event:${eventId}:broadcast`, JSON.stringify(broadcastMsg));
          this.reactionBatcher.set(eventId, {});
        }
      }
    }, 250);
  }

  private async publishViewerCount(eventId: string): Promise<void> {
    const count = await this.redisPub.pfcount(`viewers:${eventId}`);
    const msg: SyncMessage = {
      type: 'VIEWER_COUNT',
      eventId,
      payload: { count },
      timestamp: Date.now(),
    };
    await this.redisPub.publish(`event:${eventId}:broadcast`, JSON.stringify(msg));
  }
}
