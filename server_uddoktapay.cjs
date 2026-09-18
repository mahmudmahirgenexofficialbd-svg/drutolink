const rawBaseUrl = (process.env.UDDOKTAPAY_BASE_URL || 'https://sandbox.uddoktapay.com').replace(/\/$/, '');
const UDDOKTAPAY_BASE_URL = /\/api$/i.test(rawBaseUrl) ? rawBaseUrl : `${rawBaseUrl}/api`;
const UDDOKTAPAY_API_KEY = process.env.UDDOKTAPAY_API_KEY;

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
    body: JSON.stringify(body),
  };
}

async function uddoktaRequest(path, payload) {
  if (!UDDOKTAPAY_API_KEY) {
    throw new Error('UDDOKTAPAY_API_KEY is not configured on the server.');
  }

  const response = await fetch(`${UDDOKTAPAY_BASE_URL}/${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'RT-UDDOKTAPAY-API-KEY': UDDOKTAPAY_API_KEY,
    },
    body: JSON.stringify(payload),
  });

  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error(`UddoktaPay returned a non-JSON response (HTTP ${response.status}).`);
  }

  if (!response.ok || data?.status === false) {
    throw new Error(data?.message || `UddoktaPay request failed (HTTP ${response.status}).`);
  }

  return data;
}

function validateCreateBody(body) {
  const fullName = String(body?.full_name || '').trim();
  const email = String(body?.email || '').trim();
  const orderId = String(body?.order_id || '').trim();
  const amount = Number(body?.amount);

  if (!fullName) throw new Error('full_name is required.');
  if (!email || !email.includes('@')) throw new Error('A valid email is required.');
  if (!orderId) throw new Error('order_id is required.');
  if (!Number.isFinite(amount) || amount <= 0) throw new Error('A valid amount is required.');

  return { fullName, email, orderId, amount: amount.toFixed(2) };
}

async function createCharge(body) {
  const { fullName, email, orderId, amount } = validateCreateBody(body);
  const origin = String(body?.origin || '').replace(/\/$/, '');
  if (!/^https?:\/\//i.test(origin)) throw new Error('A valid site origin is required.');

  return uddoktaRequest('checkout-v2', {
    full_name: fullName,
    email,
    amount,
    metadata: JSON.stringify({
      order_id: orderId,
      source: 'DrutoLink',
    }),
    redirect_url: `${origin}/?payment=success`,
    return_type: 'GET',
    cancel_url: `${origin}/?payment=cancelled`,
    webhook_url: `${origin}/api/uddoktapay/webhook`,
  });
}

async function verifyPayment(body) {
  const invoiceId = String(body?.invoice_id || '').trim();
  if (!invoiceId) throw new Error('invoice_id is required.');
  return uddoktaRequest('verify-payment', { invoice_id: invoiceId });
}

module.exports = { json, createCharge, verifyPayment };
