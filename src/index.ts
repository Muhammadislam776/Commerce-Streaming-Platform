/**
 * Project Supernova - Live Commerce Streaming Platform
 * Root TypeScript exports and orchestrator
 */

export * from './commerce/pakistan-payments';
export * from './commerce/redis-inventory';
export * from './commerce/webhook-validator';
export * from './realtime/websocket-server';
export * from './realtime/webrtc-sfu-client';
export * from './ai/catalog-rag';
export * from './data/mockProducts';

// Default HTTP request handler in case Vercel invokes this file
export default function handler(req: any, res: any) {
  if (res && res.writeHead) {
    res.writeHead(302, { Location: '/' });
    res.end();
  } else if (res && res.redirect) {
    res.redirect('/');
  }
}
