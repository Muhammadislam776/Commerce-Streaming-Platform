/**
 * Project Supernova - Next-Gen Live Commerce Local Development Server
 * Native Node.js HTTP + Server-Sent Events (SSE) server with Pakistan Payment Gateways.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = 8085;
const STATIC_DIR = path.join(__dirname, 'public');

// Simulated Live State
let liveState = {
  eventId: 'evt_supernova_paris_2026',
  title: 'Maison Horlogère - Exclusive Live Drop',
  viewers: 14890,
  peakViewers: 15420,
  stockAvailable: 14,
  totalStock: 50,
  streamLatencyMs: 185,
  mode: 'WEBRTC_SFU',
  reservations: new Map(),
  processedWebhooks: new Set(),
  orders: new Map(),
};

// Secret Hash Keys for Pakistan Payment Gateways
const JAZZCASH_HASH_KEY = process.env.JAZZCASH_HASH_KEY || 'sec_jazzcash_hash_key_2026';
const EASYPAISA_HASH_KEY = process.env.EASYPAISA_HASH_KEY || 'sec_easypaisa_hash_key_2026';
const SAFEPAY_WEBHOOK_SECRET = process.env.SAFEPAY_WEBHOOK_SECRET || 'sec_safepay_webhook_secret_2026';

// Multilingual Catalog RAG Knowledge Base
const catalogRAG = {
  specs: {
    en: 'The Aura Titanium Chrono features Grade 5 aerospace titanium, 100m water resistance, screw-down crown, and a 42-hour kinetic automatic reserve with a 5-year international warranty.',
    es: 'El Aura Chrono incluye titanio de grado 5 aeroespacial, resistencia al agua de 100m y garantía internacional de 5 años.',
    ur: 'جی ہاں، یہ گھڑی گریڈ 5 ایرواسپیس ٹائٹینیم اور 100 میٹر واٹر ریزسٹنس کے ساتھ 5 سال کی انٹرنیشنل وارنٹی رکھتی ہے۔',
    fr: 'Le chronographe Aura Titanium utilise du titane aéronautique Grade 5, étanche à 100m, garanti 5 ans dans le monde entier.',
    ar: 'ساعة أورا تيتانيوم مصنوعة من تيتانيوم درجة 5 ومقاومة للماء حتى 100 متر مع ضمان دولي لمدة 5 سنوات.',
  },
};

// SSE Listeners
const sseClients = new Set();

function broadcastSSE(eventType, data) {
  const payload = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of sseClients) {
    client.write(payload);
  }
}

// Background simulation: viewer counts & telemetry
setInterval(() => {
  liveState.viewers += Math.floor(Math.random() * 25 - 12);
  liveState.streamLatencyMs = Math.floor(180 + Math.random() * 15);
  broadcastSSE('telemetry', {
    viewers: liveState.viewers,
    latencyMs: liveState.streamLatencyMs,
    stock: liveState.stockAvailable,
  });
}, 3000);

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, stripe-signature, x-sfpy-signature');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // 1. Root: Serve Live Room Prototype
  if (url.pathname === '/' || url.pathname === '/index.html' || url.pathname === '/live-room-preview.html') {
    const filePath = path.join(STATIC_DIR, 'live-room-preview.html');
    fs.readFile(filePath, (err, content) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Error loading live-room-preview.html');
      } else {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(content);
      }
    });
    return;
  }

  // 2. Real-Time Server-Sent Events (SSE) Stream
  if (url.pathname === '/api/live/stream') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });
    res.write(`data: ${JSON.stringify({ message: 'Connected to Supernova Live Stream' })}\n\n`);
    sseClients.add(res);

    req.on('close', () => {
      sseClients.delete(res);
    });
    return;
  }

  // 3. API: Status & Telemetry
  if (url.pathname === '/api/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        status: 'ONLINE',
        platform: 'Project Supernova v1.0',
        activeViewers: liveState.viewers,
        availableStock: liveState.stockAvailable,
        mode: liveState.mode,
        streamLatencyMs: liveState.streamLatencyMs,
      })
    );
    return;
  }

  // 4. API: Local Pakistan Payments Checkout Initiation
  // POST /api/checkout/initiate (Supports JAZZCASH, EASYPAISA, SAFEPAY)
  if (url.pathname === '/api/checkout/initiate' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      try {
        const data = JSON.parse(body || '{}');
        const {
          gateway = 'JAZZCASH',
          totalAmountPkr = 69900,
          customerPhone = '03001234567',
          cnicLast6Digits = '123456',
          idempotencyKey = `idemp_${Date.now()}`,
        } = data;

        // Idempotency check
        if (liveState.orders.has(idempotencyKey)) {
          const existing = liveState.orders.get(idempotencyKey);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ...existing, message: 'Idempotent cache hit' }));
          return;
        }

        const orderNumber = `ORD-${Date.now().toString().slice(-4)}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

        let gatewayPayload = {};

        if (gateway === 'JAZZCASH') {
          // JazzCash MWALLET payload & HMAC-SHA256 signature
          const now = new Date();
          const pad = (n) => n.toString().padStart(2, '0');
          const pp_TxnDateTime = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
          const pp_Amount = Math.round(totalAmountPkr * 100).toString();

          gatewayPayload = {
            pp_Version: '1.1',
            pp_TxnType: 'MWALLET',
            pp_MerchantID: 'MC12345',
            pp_Password: 'sample_password',
            pp_TxnRefNo: `T${orderNumber.replace(/[^A-Za-z0-9]/g, '')}`,
            pp_Amount,
            pp_TxnCurrency: 'PKR',
            pp_TxnDateTime,
            pp_BillReference: orderNumber,
            pp_Description: `Project Supernova Live Drop: ${orderNumber}`,
            pp_MobileNumber: customerPhone.replace(/[^0-9]/g, ''),
            pp_CNIC: cnicLast6Digits,
          };

          // Sort alphabetically & compute HMAC
          const sortedKeys = Object.keys(gatewayPayload).sort();
          const stringToHash = `${JAZZCASH_HASH_KEY}&${sortedKeys.map((k) => gatewayPayload[k]).join('&')}`;
          gatewayPayload.pp_SecureHash = crypto
            .createHmac('sha256', JAZZCASH_HASH_KEY)
            .update(stringToHash, 'utf8')
            .digest('hex')
            .toUpperCase();
        } else if (gateway === 'EASYPAISA') {
          const raw = `10042|${orderNumber}|${totalAmountPkr.toFixed(2)}|PKR|${EASYPAISA_HASH_KEY}`;
          const hash = crypto.createHash('sha256').update(raw).digest('hex');
          gatewayPayload = {
            storeId: '10042',
            orderId: orderNumber,
            transactionAmount: totalAmountPkr.toFixed(2),
            mobileAccountNo: customerPhone,
            hash,
          };
        } else {
          gatewayPayload = {
            gateway: 'SAFEPAY',
            token: `sfp_tok_${crypto.randomBytes(12).toString('hex')}`,
            checkoutUrl: `https://sandbox.api.getsafepay.com/checkout?beacon=mock`,
          };
        }

        const orderRecord = {
          status: 'INITIATED',
          orderNumber,
          gateway,
          amountPkr: totalAmountPkr,
          customerPhone,
          payload: gatewayPayload,
        };

        liveState.orders.set(idempotencyKey, orderRecord);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(orderRecord));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // 5. API: JazzCash IPN Webhook Receiver
  // POST /api/webhooks/jazzcash
  if (url.pathname === '/api/webhooks/jazzcash' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const orderNumber = payload.pp_BillReference || payload.pp_TxnRefNo || 'ORD-9481';
        const receivedHash = payload.pp_SecureHash;

        // Verify HMAC if provided
        if (receivedHash) {
          const sortedKeys = Object.keys(payload).filter((k) => k !== 'pp_SecureHash').sort();
          const stringToHash = `${JAZZCASH_HASH_KEY}&${sortedKeys.map((k) => payload[k]).join('&')}`;
          const expectedHash = crypto
            .createHmac('sha256', JAZZCASH_HASH_KEY)
            .update(stringToHash, 'utf8')
            .digest('hex')
            .toUpperCase();

          const matches = crypto.timingSafeEqual(
            Buffer.from(receivedHash.toUpperCase(), 'utf8'),
            Buffer.from(expectedHash, 'utf8')
          );

          if (!matches) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Invalid HMAC signature' }));
            return;
          }
        }

        // Decrement stock
        if (liveState.stockAvailable > 0) {
          liveState.stockAvailable -= 1;
        }

        // Broadcast glowing social proof notification over the video stream via SSE
        const phone = payload.pp_MobileNumber || '03001234567';
        broadcastSSE('live_purchase', {
          customerName: `Ali from Lahore (03**-***${phone.slice(-4)})`,
          product: 'Aura Chrono 44mm Titanium',
          amount: 'Rs. 69,900',
          gateway: 'JazzCash',
          orderNumber,
        });

        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('OK');
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end(e.message);
      }
    });
    return;
  }

  // 6. API: EasyPaisa IPN Webhook Receiver
  // POST /api/webhooks/easypaisa
  if (url.pathname === '/api/webhooks/easypaisa' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const orderNumber = payload.orderId || 'ORD-1092';

        if (liveState.stockAvailable > 0) {
          liveState.stockAvailable -= 1;
        }

        broadcastSSE('live_purchase', {
          customerName: 'Fatima from Karachi',
          product: 'Aura Chrono 44mm Titanium',
          amount: 'Rs. 69,900',
          gateway: 'EasyPaisa',
          orderNumber,
        });

        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('OK');
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end(e.message);
      }
    });
    return;
  }

  // Fallback 404
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🌟 PROJECT SUPERNOVA - PAKISTAN PAYMENTS ONLINE 🌟`);
  console.log(`=======================================================`);
  console.log(`> Interactive Live Room UI: http://localhost:${PORT}`);
  console.log(`> Pakistan Checkout API:    http://localhost:${PORT}/api/checkout/initiate`);
  console.log(`> JazzCash Webhook IPN:     http://localhost:${PORT}/api/webhooks/jazzcash`);
  console.log(`> EasyPaisa Webhook IPN:    http://localhost:${PORT}/api/webhooks/easypaisa`);
  console.log(`=======================================================`);
});
