const STRIPE_API = 'https://api.stripe.com/v1';

export async function createCheckoutSession(env, {
  lineItems, metadata, successUrl, cancelUrl, customerEmail,
}) {
  const params = new URLSearchParams();
  params.append('mode', 'payment');
  params.append('success_url', successUrl);
  params.append('cancel_url', cancelUrl);

  if (customerEmail) params.append('customer_email', customerEmail);

  lineItems.forEach((item, i) => {
    params.append(`line_items[${i}][price]`, item.priceId);
    params.append(`line_items[${i}][quantity]`, String(item.quantity));
  });

  params.append('custom_fields[0][key]', 'pickup_time');
  params.append('custom_fields[0][label][type]', 'custom');
  params.append('custom_fields[0][label][custom]', 'Pickup Time Preference');
  params.append('custom_fields[0][type]', 'dropdown');
  params.append('custom_fields[0][dropdown][options][0][label]', 'Morning (10am–12pm)');
  params.append('custom_fields[0][dropdown][options][0][value]', 'morning');
  params.append('custom_fields[0][dropdown][options][1][label]', 'Afternoon (12pm–3pm)');
  params.append('custom_fields[0][dropdown][options][1][value]', 'afternoon');
  params.append('custom_fields[0][dropdown][options][2][label]', 'Evening (3pm–6pm)');
  params.append('custom_fields[0][dropdown][options][2][value]', 'evening');

  Object.entries(metadata).forEach(([k, v]) => {
    params.append(`metadata[${k}]`, String(v).substring(0, 500));
  });

  const res = await fetch(`${STRIPE_API}/checkout/sessions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Stripe-Version': '2024-06-20',
    },
    body: params.toString(),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || `Stripe ${res.status}`);
  return data;
}

export async function verifyWebhookSignature(rawBody, sigHeader, secret) {
  const elements = sigHeader.split(',');
  const timestampEl = elements.find(e => e.startsWith('t='));
  if (!timestampEl) return false;

  const timestamp = timestampEl.substring(2);
  const signatures = elements.filter(e => e.startsWith('v1=')).map(e => e.substring(3));
  if (!signatures.length) return false;

  // Reject events older than 5 minutes
  if (Math.abs(Date.now() / 1000 - parseInt(timestamp, 10)) > 300) return false;

  const signedPayload = `${timestamp}.${rawBody}`;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signedPayload));
  const expected = Array.from(new Uint8Array(mac))
    .map(b => b.toString(16).padStart(2, '0')).join('');

  // Constant-time comparison
  return signatures.some(sig => {
    if (sig.length !== expected.length) return false;
    let diff = 0;
    for (let i = 0; i < sig.length; i++) diff |= sig.charCodeAt(i) ^ expected.charCodeAt(i);
    return diff === 0;
  });
}
