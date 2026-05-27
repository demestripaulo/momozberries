import { verifyWebhookSignature } from '../utils/stripe.js';

export async function handleWebhook(request, env) {
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  const signature = request.headers.get('Stripe-Signature');
  if (!signature) return new Response('Missing Stripe-Signature header', { status: 400 });

  const rawBody = await request.text();

  const valid = await verifyWebhookSignature(rawBody, signature, env.STRIPE_WEBHOOK_SECRET);
  if (!valid) return new Response('Invalid signature', { status: 400 });

  let event;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });
    const dailyLimit = parseInt(env.DAILY_ORDER_LIMIT || '50', 10);

    // Increment daily order count
    const current = await env.DB.prepare(
      'SELECT orders_count FROM daily_limits WHERE date = ?'
    ).bind(today).first();

    const newCount = (current?.orders_count || 0) + 1;
    const stillAccepting = newCount < dailyLimit ? 1 : 0;

    await env.DB.prepare(`
      INSERT INTO daily_limits (date, orders_count, accepting_orders)
      VALUES (?, ?, ?)
      ON CONFLICT(date) DO UPDATE SET
        orders_count = excluded.orders_count,
        accepting_orders = excluded.accepting_orders
    `).bind(today, newCount, stillAccepting).run();

    // Extract pickup time from custom fields
    const pickupField = session.custom_fields?.find(f => f.key === 'pickup_time');
    const pickupTime = pickupField?.dropdown?.value || null;

    // Save order to D1
    await env.DB.prepare(`
      INSERT OR IGNORE INTO orders
        (id, stripe_session_id, customer_email, customer_name,
         items_json, substitutions, total_cents, pickup_time, order_notes, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `).bind(
      crypto.randomUUID().replace(/-/g, ''),
      session.id,
      session.customer_details?.email || null,
      session.customer_details?.name || null,
      session.metadata?.items_summary || '[]',
      session.metadata?.substitutions || '{}',
      session.amount_total || 0,
      pickupTime,
      session.metadata?.order_notes || null,
    ).run();
  }

  return new Response('ok', { status: 200 });
}
