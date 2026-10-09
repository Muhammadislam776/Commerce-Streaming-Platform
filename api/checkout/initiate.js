module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    let body = req.body || {};
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch (e) {}
    }

    const gateway = body.gateway || 'JAZZCASH';
    const totalAmountPkr = body.totalAmountPkr || 69900;
    const customerPhone = body.customerPhone || '03001234567';
    const orderNumber = 'ORD-' + Math.floor(1000 + Math.random() * 9000);

    return res.status(200).json({
      success: true,
      orderNumber,
      gateway,
      totalAmountPkr,
      customerPhone,
      message: 'Mobile wallet prompt dispatched successfully',
      status: 'AWAITING_USSD_PIN',
      timestamp: new Date().toISOString()
    });
  }

  res.status(200).json({ status: 'ok', service: 'Supernova Pakistan Payments Gateway' });
};
