import { handleAvailability } from './routes/availability.js';
import { handleProducts } from './routes/products.js';
import { handleCreateCheckout } from './routes/checkout.js';
import { handleWebhook } from './routes/webhook.js';
import { handleCatalog } from './routes/catalog.js';
import {
  handleLogin,
  handleLogout,
  handleDashboard,
  handleAdminOrders,
  handleUpdateOrderStatus,
  handleAdminProducts,
  handleCreateProduct,
  handleUpdateProduct,
  handleArchiveProduct,
} from './routes/admin.js';
import { jsonResponse, handleOptions } from './utils/cors.js';

export default {
  // ─── HTTP handler ──────────────────────────────────────────────────────────
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    if (method === 'OPTIONS') return handleOptions(request);

    // Public
    if (path === '/api/availability')              return handleAvailability(request, env);
    if (path === '/api/products')                  return handleProducts(request, env);
    if (path === '/api/create-checkout-session')   return handleCreateCheckout(request, env);
    if (path === '/api/webhook')                   return handleWebhook(request, env);
    if (path === '/api/catalog.json')              return handleCatalog(request, env);

    // Admin auth (no token required)
    if (path === '/api/admin/login')               return handleLogin(request, env);
    if (path === '/api/admin/logout')              return handleLogout(request, env);

    // Admin dashboard + orders
    if (path === '/api/admin/dashboard')           return handleDashboard(request, env);
    if (path === '/api/admin/orders' && method === 'GET')
                                                   return handleAdminOrders(request, env);

    // Admin products (collection)
    if (path === '/api/admin/products' && method === 'GET')
                                                   return handleAdminProducts(request, env);
    if (path === '/api/admin/products' && method === 'POST')
                                                   return handleCreateProduct(request, env);

    // Admin orders — parameterized  /api/admin/orders/:id/status
    const orderStatusMatch = path.match(/^\/api\/admin\/orders\/([^/]+)\/status$/);
    if (orderStatusMatch && method === 'POST') {
      return handleUpdateOrderStatus(request, env, orderStatusMatch[1]);
    }

    // Admin products — parameterized  /api/admin/products/:id
    const productMatch = path.match(/^\/api\/admin\/products\/([^/]+)$/);
    if (productMatch) {
      if (method === 'PUT')    return handleUpdateProduct(request, env, productMatch[1]);
      if (method === 'DELETE') return handleArchiveProduct(request, env, productMatch[1]);
    }

    return jsonResponse({ error: 'Not found' }, 404, request);
  },

  // ─── Cron: reset daily limits at 8 AM UTC (midnight PT) ───────────────────
  async scheduled(event, env, ctx) {
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });

    await env.DB.prepare(`
      INSERT INTO daily_limits (date, orders_count, accepting_orders)
      VALUES (?, 0, 1)
      ON CONFLICT(date) DO UPDATE SET
        orders_count = 0,
        accepting_orders = 1
    `).bind(today).run();

    // Purge expired admin sessions
    await env.DB.prepare(
      `DELETE FROM admin_sessions WHERE expires_at < datetime('now')`
    ).run();

    console.log(`[cron] Daily reset complete for ${today}`);
  },
};
