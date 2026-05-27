import { jsonResponse, handleOptions } from '../utils/cors.js';
import { createToken, requireAuth } from '../utils/auth.js';

function sanitize(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/[<>&"']/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#x27;' }[c]))
    .trim()
    .substring(0, 2000);
}

// ─── AUTH ────────────────────────────────────────────────────────────────────

export async function handleLogin(request, env) {
  if (request.method === 'OPTIONS') return handleOptions(request);
  if (request.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405, request);

  let body;
  try { body = await request.json(); }
  catch { return jsonResponse({ error: 'Invalid JSON' }, 400, request); }

  if (!body.password) return jsonResponse({ error: 'Password required' }, 400, request);

  if (body.password !== env.ADMIN_PASSWORD) {
    return jsonResponse({ error: 'Invalid password' }, 401, request);
  }

  const exp = Math.floor(Date.now() / 1000) + 8 * 3600;
  const token = await createToken({ admin: true, exp }, env.JWT_SECRET);
  const expiresAt = new Date(exp * 1000).toISOString().replace('T', ' ').substring(0, 19);

  await env.DB.prepare(
    'INSERT INTO admin_sessions (token, expires_at) VALUES (?, ?)'
  ).bind(token, expiresAt).run();

  return new Response(JSON.stringify({ success: true, token }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': `admin_token=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=28800`,
    },
  });
}

export async function handleLogout(request, env) {
  if (request.method === 'OPTIONS') return handleOptions(request);

  const cookie = request.headers.get('Cookie') || '';
  const tokenMatch = cookie.match(/admin_token=([^;]+)/);
  if (tokenMatch) {
    await env.DB.prepare('DELETE FROM admin_sessions WHERE token = ?').bind(tokenMatch[1]).run();
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': 'admin_token=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0',
    },
  });
}

// ─── DASHBOARD ───────────────────────────────────────────────────────────────

export async function handleDashboard(request, env) {
  if (request.method === 'OPTIONS') return handleOptions(request);

  const auth = await requireAuth(request, env);
  if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401, request);

  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });
  const limit = parseInt(env.DAILY_ORDER_LIMIT || '50', 10);

  const [todayStats, weekStats, dailyLimit, last7Days] = await Promise.all([
    env.DB.prepare(
      `SELECT COUNT(*) as count, COALESCE(SUM(total_cents),0) as revenue
       FROM orders WHERE date(created_at) = ? AND status != 'cancelled'`
    ).bind(today).first(),

    env.DB.prepare(
      `SELECT COUNT(*) as count, COALESCE(SUM(total_cents),0) as revenue
       FROM orders WHERE created_at >= datetime('now', '-7 days') AND status != 'cancelled'`
    ).first(),

    env.DB.prepare(
      'SELECT orders_count, accepting_orders FROM daily_limits WHERE date = ?'
    ).bind(today).first(),

    env.DB.prepare(
      `SELECT date(created_at) as day, COUNT(*) as count,
              COALESCE(SUM(total_cents),0) as revenue
       FROM orders WHERE created_at >= datetime('now', '-7 days')
       GROUP BY day ORDER BY day ASC`
    ).all(),
  ]);

  return jsonResponse({
    today: {
      orders: todayStats?.count || 0,
      revenue_cents: todayStats?.revenue || 0,
      orders_remaining: limit - (dailyLimit?.orders_count || 0),
      accepting_orders: Boolean(dailyLimit?.accepting_orders ?? 1),
    },
    week: {
      orders: weekStats?.count || 0,
      revenue_cents: weekStats?.revenue || 0,
    },
    last_7_days: last7Days.results || [],
    limit,
  }, 200, request);
}

// ─── ORDERS ──────────────────────────────────────────────────────────────────

export async function handleAdminOrders(request, env) {
  if (request.method === 'OPTIONS') return handleOptions(request);

  const auth = await requireAuth(request, env);
  if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401, request);

  const url = new URL(request.url);
  const period = url.searchParams.get('period') || 'today';

  const whereMap = {
    today: `WHERE date(created_at) = date('now', 'localtime')`,
    week: `WHERE created_at >= datetime('now', '-7 days')`,
    all: '',
  };
  const where = whereMap[period] || whereMap.today;

  const { results } = await env.DB.prepare(
    `SELECT * FROM orders ${where} ORDER BY created_at DESC LIMIT 200`
  ).all();

  return jsonResponse({ orders: results }, 200, request);
}

export async function handleUpdateOrderStatus(request, env, orderId) {
  if (request.method === 'OPTIONS') return handleOptions(request);

  const auth = await requireAuth(request, env);
  if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401, request);

  let body;
  try { body = await request.json(); }
  catch { return jsonResponse({ error: 'Invalid JSON' }, 400, request); }

  const validStatuses = ['pending', 'ready', 'picked_up', 'cancelled'];
  if (!validStatuses.includes(body.status)) {
    return jsonResponse({ error: 'Invalid status' }, 400, request);
  }

  await env.DB.prepare('UPDATE orders SET status = ? WHERE id = ?')
    .bind(body.status, orderId).run();

  return jsonResponse({ success: true }, 200, request);
}

// ─── PRODUCTS ────────────────────────────────────────────────────────────────

export async function handleAdminProducts(request, env) {
  if (request.method === 'OPTIONS') return handleOptions(request);

  const auth = await requireAuth(request, env);
  if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401, request);

  const { results: products } = await env.DB.prepare(
    'SELECT * FROM products ORDER BY is_active DESC, created_at ASC'
  ).all();

  const enriched = await Promise.all(products.map(async p => {
    const { results: ingredients } = await env.DB.prepare(
      'SELECT * FROM ingredients WHERE product_id = ?'
    ).bind(p.id).all();

    const cogsCents = ingredients.reduce(
      (sum, ing) => sum + Math.round(ing.unit_cost_cents * ing.amount_per_serving), 0
    );

    const margin = p.price_cents > 0
      ? Math.round((p.price_cents - cogsCents) / p.price_cents * 100)
      : 0;

    const suggestedMin = cogsCents * 3;
    const suggestedStd = cogsCents * 4;

    let viability = 'not_worth_it';
    if (margin >= 50) viability = 'profitable';
    else if (margin >= 30) viability = 'borderline';

    return {
      ...p,
      price_dollars: (p.price_cents / 100).toFixed(2),
      dietary_tags: JSON.parse(p.dietary_tags || '[]'),
      is_high_protein: Boolean(p.is_high_protein),
      is_vegan_available: Boolean(p.is_vegan_available),
      is_gf_available: Boolean(p.is_gf_available),
      is_keto_available: Boolean(p.is_keto_available),
      is_seasonal: Boolean(p.is_seasonal),
      is_active: Boolean(p.is_active),
      ingredients,
      cogs_cents: cogsCents,
      cogs_dollars: (cogsCents / 100).toFixed(2),
      margin_pct: margin,
      suggested_min_cents: suggestedMin,
      suggested_std_cents: suggestedStd,
      viability,
    };
  }));

  return jsonResponse({ products: enriched }, 200, request);
}

export async function handleCreateProduct(request, env) {
  if (request.method === 'OPTIONS') return handleOptions(request);

  const auth = await requireAuth(request, env);
  if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401, request);

  let body;
  try { body = await request.json(); }
  catch { return jsonResponse({ error: 'Invalid JSON' }, 400, request); }

  if (!body.name || !body.price) {
    return jsonResponse({ error: 'name and price are required' }, 400, request);
  }

  const id = 'prod_' + crypto.randomUUID().replace(/-/g, '').substring(0, 16);
  const price_cents = Math.round(parseFloat(body.price) * 100);

  await env.DB.prepare(`
    INSERT INTO products
      (id, name, description, price_cents, stripe_price_id, photo_url,
       calories, protein_g, carbs_g, fat_g,
       is_high_protein, is_vegan_available, is_gf_available, is_keto_available,
       is_seasonal, dietary_tags, is_active)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,1)
  `).bind(
    id,
    sanitize(body.name),
    sanitize(body.description || ''),
    price_cents,
    body.stripe_price_id || null,
    sanitize(body.photo_url || ''),
    parseInt(body.calories || 0, 10),
    parseFloat(body.protein_g || 0),
    parseFloat(body.carbs_g || 0),
    parseFloat(body.fat_g || 0),
    body.is_high_protein ? 1 : 0,
    body.is_vegan_available ? 1 : 0,
    body.is_gf_available ? 1 : 0,
    body.is_keto_available ? 1 : 0,
    body.is_seasonal ? 1 : 0,
    JSON.stringify(body.dietary_tags || []),
  ).run();

  if (Array.isArray(body.ingredients)) {
    for (const ing of body.ingredients) {
      await env.DB.prepare(`
        INSERT INTO ingredients (id, product_id, name, unit, unit_cost_cents, amount_per_serving)
        VALUES (?,?,?,?,?,?)
      `).bind(
        'ing_' + crypto.randomUUID().replace(/-/g, '').substring(0, 16),
        id,
        sanitize(ing.name || ''),
        sanitize(ing.unit || 'unit'),
        Math.round(parseFloat(ing.unit_cost || 0) * 100),
        parseFloat(ing.amount || 0),
      ).run();
    }
  }

  return jsonResponse({ success: true, id }, 201, request);
}

export async function handleUpdateProduct(request, env, productId) {
  if (request.method === 'OPTIONS') return handleOptions(request);

  const auth = await requireAuth(request, env);
  if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401, request);

  let body;
  try { body = await request.json(); }
  catch { return jsonResponse({ error: 'Invalid JSON' }, 400, request); }

  const price_cents = Math.round(parseFloat(body.price || 0) * 100);

  await env.DB.prepare(`
    UPDATE products SET
      name = ?, description = ?, price_cents = ?, photo_url = ?,
      calories = ?, protein_g = ?, carbs_g = ?, fat_g = ?,
      is_high_protein = ?, is_vegan_available = ?, is_gf_available = ?,
      is_keto_available = ?, is_seasonal = ?, dietary_tags = ?
    WHERE id = ?
  `).bind(
    sanitize(body.name || ''),
    sanitize(body.description || ''),
    price_cents,
    sanitize(body.photo_url || ''),
    parseInt(body.calories || 0, 10),
    parseFloat(body.protein_g || 0),
    parseFloat(body.carbs_g || 0),
    parseFloat(body.fat_g || 0),
    body.is_high_protein ? 1 : 0,
    body.is_vegan_available ? 1 : 0,
    body.is_gf_available ? 1 : 0,
    body.is_keto_available ? 1 : 0,
    body.is_seasonal ? 1 : 0,
    JSON.stringify(body.dietary_tags || []),
    productId,
  ).run();

  if (Array.isArray(body.ingredients)) {
    await env.DB.prepare('DELETE FROM ingredients WHERE product_id = ?').bind(productId).run();
    for (const ing of body.ingredients) {
      await env.DB.prepare(`
        INSERT INTO ingredients (id, product_id, name, unit, unit_cost_cents, amount_per_serving)
        VALUES (?,?,?,?,?,?)
      `).bind(
        'ing_' + crypto.randomUUID().replace(/-/g, '').substring(0, 16),
        productId,
        sanitize(ing.name || ''),
        sanitize(ing.unit || 'unit'),
        Math.round(parseFloat(ing.unit_cost || 0) * 100),
        parseFloat(ing.amount || 0),
      ).run();
    }
  }

  return jsonResponse({ success: true }, 200, request);
}

export async function handleArchiveProduct(request, env, productId) {
  if (request.method === 'OPTIONS') return handleOptions(request);

  const auth = await requireAuth(request, env);
  if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401, request);

  await env.DB.prepare('UPDATE products SET is_active = 0 WHERE id = ?').bind(productId).run();
  return jsonResponse({ success: true }, 200, request);
}
