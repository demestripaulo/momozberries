import { jsonResponse, handleOptions } from '../utils/cors.js';

export async function handleProducts(request, env) {
  if (request.method === 'OPTIONS') return handleOptions(request);

  const { results } = await env.DB.prepare(
    'SELECT * FROM products WHERE is_active = 1 ORDER BY created_at ASC'
  ).all();

  const products = results.map(p => ({
    ...p,
    price_dollars: (p.price_cents / 100).toFixed(2),
    dietary_tags: JSON.parse(p.dietary_tags || '[]'),
    is_high_protein: Boolean(p.is_high_protein),
    is_vegan_available: Boolean(p.is_vegan_available),
    is_gf_available: Boolean(p.is_gf_available),
    is_keto_available: Boolean(p.is_keto_available),
    is_seasonal: Boolean(p.is_seasonal),
    is_active: Boolean(p.is_active),
  }));

  return jsonResponse({ products }, 200, request);
}
