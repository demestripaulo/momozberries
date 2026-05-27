import { jsonResponse, handleOptions } from '../utils/cors.js';

export async function handleAvailability(request, env) {
  if (request.method === 'OPTIONS') return handleOptions(request);

  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });
  const limit = parseInt(env.DAILY_ORDER_LIMIT || '50', 10);

  let record = await env.DB.prepare(
    'SELECT orders_count, accepting_orders FROM daily_limits WHERE date = ?'
  ).bind(today).first();

  if (!record) {
    await env.DB.prepare(
      'INSERT OR IGNORE INTO daily_limits (date, orders_count, accepting_orders) VALUES (?, 0, 1)'
    ).bind(today).run();
    record = { orders_count: 0, accepting_orders: 1 };
  }

  return jsonResponse({
    accepting_orders: Boolean(record.accepting_orders),
    orders_count: record.orders_count,
    orders_remaining: Math.max(0, limit - record.orders_count),
    limit,
    date: today,
  }, 200, request);
}
