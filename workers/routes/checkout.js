import { jsonResponse, handleOptions } from '../utils/cors.js';
import { createCheckoutSession } from '../utils/stripe.js';

function sanitize(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/[<>&"']/g, c => (
    { '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#x27;' }[c]
  )).trim().substring(0, 500);
}

export async function handleCreateCheckout(request, env) {
  if (request.method === 'OPTIONS') return handleOptions(request);
  if (request.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405, request);

  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });
  const limitRecord = await env.DB.prepare(
    'SELECT accepting_orders FROM daily_limits WHERE date = ?'
  ).bind(today).first();

  if (limitRecord && !limitRecord.accepting_orders) {
    return jsonResponse(
      { error: 'sold_out', message: "Sold out for today! Come back tomorrow 🍓" },
      400, request
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON' }, 400, request);
  }

  const { items, orderNotes, customerEmail, substitutions, utm } = body;

  if (!Array.isArray(items) || items.length === 0) {
    return jsonResponse({ error: 'Cart is empty' }, 400, request);
  }

  // Validate all items exist in DB
  const productIds = [...new Set(items.map(i => i.productId))];
  const placeholders = productIds.map(() => '?').join(',');
  const { results: products } = await env.DB.prepare(
    `SELECT id, stripe_price_id, name, price_cents FROM products WHERE id IN (${placeholders}) AND is_active = 1`
  ).bind(...productIds).all();

  const productMap = Object.fromEntries(products.map(p => [p.id, p]));

  // Check for unconfigured Stripe price IDs
  const unconfigured = products.filter(p =>
    !p.stripe_price_id || p.stripe_price_id.startsWith('price_') && p.stripe_price_id.length < 30
  );
  if (unconfigured.length > 0) {
    return jsonResponse({
      error: 'stripe_not_configured',
      message: 'Stripe price IDs not configured yet. Run: npm run stripe:setup',
    }, 400, request);
  }

  const lineItems = [];
  const metaItems = [];

  for (const item of items) {
    const product = productMap[item.productId];
    if (!product) return jsonResponse({ error: `Product not found: ${item.productId}` }, 400, request);

    const qty = Math.max(1, Math.min(10, parseInt(item.quantity, 10) || 1));
    lineItems.push({ priceId: product.stripe_price_id, quantity: qty });

    const subStr = item.substitutions ? ` [${item.substitutions}]` : '';
    metaItems.push(`${product.name} x${qty}${subStr}`);
  }

  const metadata = {
    items_summary: metaItems.join(' | ').substring(0, 500),
    substitutions: sanitize(JSON.stringify(substitutions || {})),
    order_notes: sanitize(orderNotes || ''),
    utm_source:   sanitize(utm?.utm_source || ''),
    utm_medium:   sanitize(utm?.utm_medium || ''),
    utm_campaign: sanitize(utm?.utm_campaign || ''),
  };

  try {
    const session = await createCheckoutSession(env, {
      lineItems,
      metadata,
      successUrl: `${env.SITE_URL}/order-success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${env.SITE_URL}/cart.html`,
      customerEmail: customerEmail ? sanitize(customerEmail) : undefined,
    });

    return jsonResponse({ url: session.url, sessionId: session.id }, 200, request);
  } catch (err) {
    console.error('Stripe error:', err.message);
    return jsonResponse({ error: 'checkout_failed', message: err.message }, 500, request);
  }
}
