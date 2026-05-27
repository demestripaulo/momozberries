import { jsonResponse } from '../utils/cors.js';

const SITE_URL = 'https://momozberriez.pages.dev';
const BRAND = "Momo'z Berriez";
const GOOGLE_CATEGORY = 'Food, Beverages & Tobacco > Food Items > Desserts';

export async function handleCatalog(request, env) {
  const products = await env.DB.prepare(
    `SELECT id, name, description, price_cents, photo_url, dietary_tags FROM products WHERE is_active = 1`
  ).all();

  const rows = (products.results || []).map(p => ({
    id: p.id,
    title: `${p.name} – ${BRAND}`,
    description: (p.description || '').replace(/"/g, "'"),
    availability: 'in stock',
    condition: 'new',
    price: `${(p.price_cents / 100).toFixed(2)} USD`,
    link: `${SITE_URL}/menu.html`,
    image_link: p.photo_url.startsWith('http') ? p.photo_url : `${SITE_URL}${p.photo_url}`,
    brand: BRAND,
    google_product_category: GOOGLE_CATEGORY,
  }));

  const fmt = new URL(request.url).searchParams.get('format');

  if (fmt === 'csv') {
    const header = 'id,title,description,availability,condition,price,link,image_link,brand,google_product_category';
    const lines = rows.map(r =>
      [r.id, r.title, r.description, r.availability, r.condition, r.price,
       r.link, r.image_link, r.brand, r.google_product_category]
        .map(v => `"${String(v).replace(/"/g, '""')}"`)
        .join(',')
    );
    return new Response([header, ...lines].join('\n'), {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="momozberriez-catalog.csv"',
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  return jsonResponse({ products: rows }, 200, request, {
    'Cache-Control': 'public, max-age=3600',
  });
}
