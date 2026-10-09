const express = require('express');
const path = require('path');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const publicDir = path.join(__dirname, 'public');
app.use(express.static(publicDir));

// Pakistan In-Stream Mobile Checkout API
app.post('/api/checkout/initiate', (req, res) => {
  const { gateway, totalAmountPkr, customerPhone } = req.body || {};
  const orderNumber = 'ORD-' + Math.floor(1000 + Math.random() * 9000);
  res.json({
    success: true,
    orderNumber,
    gateway: gateway || 'JAZZCASH',
    amountPkr: totalAmountPkr || 69900,
    phone: customerPhone || '03001234567',
    message: 'Mobile wallet prompt dispatched successfully',
    status: 'AWAITING_USSD_PIN',
    timestamp: new Date().toISOString(),
  });
});

app.post('/api/webhooks/jazzcash', (req, res) => {
  res.json({ status: 'CONFIRMED', gateway: 'JazzCash', receivedAt: new Date().toISOString() });
});

app.post('/api/webhooks/easypaisa', (req, res) => {
  res.json({ status: 'CONFIRMED', gateway: 'EasyPaisa', receivedAt: new Date().toISOString() });
});

// Catch-all: serve index.html for all frontend routes
app.get('*', (req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

module.exports = app;
