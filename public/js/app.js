// Shared utilities: Cart, API, toasts, availability banner

const API_BASE = ''; // same origin — Cloudflare Pages routes /api/* to the Worker

// ─── API helper ──────────────────────────────────────────────────────────────
export async function api(path, opts = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...opts,
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', ...opts.headers },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    const e = new Error(err.error || err.message || 'Request failed');
    e.status = res.status;
    e.data = err;
    throw e;
  }
  return res.json();
}

// ─── Cart ─────────────────────────────────────────────────────────────────────
const CART_KEY = 'momoz_cart_v1';

class Cart {
  constructor() {
    this._items = this._load();
  }

  _load() {
    try { return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); }
    catch { return []; }
  }

  _save() {
    localStorage.setItem(CART_KEY, JSON.stringify(this._items));
    window.dispatchEvent(new CustomEvent('cart-updated', { detail: this.summary() }));
  }

  items() { return [...this._items]; }

  add(product, qty = 1, substitutions = []) {
    const key = `${product.id}|${[...substitutions].sort().join(',')}`;
    const existing = this._items.find(i => i.key === key);
    if (existing) {
      existing.qty = Math.min(10, existing.qty + qty);
    } else {
      this._items.push({
        key,
        productId: product.id,
        name: product.name,
        price_cents: product.price_cents,
        photo_url: product.photo_url,
        qty,
        substitutions: [...substitutions],
      });
    }
    this._save();
  }

  setQty(key, qty) {
    const clamped = Math.max(0, Math.min(10, Math.round(qty)));
    if (clamped === 0) {
      this._items = this._items.filter(i => i.key !== key);
    } else {
      const item = this._items.find(i => i.key === key);
      if (item) item.qty = clamped;
    }
    this._save();
  }

  remove(key) {
    this._items = this._items.filter(i => i.key !== key);
    this._save();
  }

  clear() {
    this._items = [];
    this._save();
  }

  summary() {
    return {
      count: this._items.reduce((s, i) => s + i.qty, 0),
      total: this._items.reduce((s, i) => s + i.price_cents * i.qty, 0),
    };
  }
}

export const cart = new Cart();
export const clearCart = () => cart.clear();

// ─── Formatting ───────────────────────────────────────────────────────────────
export function formatPrice(cents) {
  return '$' + (cents / 100).toFixed(2);
}

// ─── Toast notifications ──────────────────────────────────────────────────────
export function toast(msg, type = 'info') {
  const wrap = document.getElementById('toast-wrap');
  if (!wrap) return;
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.setAttribute('role', 'status');
  el.textContent = msg;
  wrap.appendChild(el);
  setTimeout(() => el.remove(), 3400);
}

// ─── Cart badge ───────────────────────────────────────────────────────────────
export function updateCartBadge() {
  const { count, total } = cart.summary();

  document.querySelectorAll('#nav-cart-count').forEach(el => {
    el.textContent = count > 0 ? String(count) : '';
  });

  const floating = document.getElementById('floating-cart');
  if (!floating) return;

  floating.classList.toggle('visible', count > 0);
  const countEl = document.getElementById('floating-cart-count');
  const totalEl = document.getElementById('floating-cart-total');
  if (countEl) countEl.textContent = `${count} item${count !== 1 ? 's' : ''}`;
  if (totalEl) totalEl.textContent = count > 0 ? '· ' + formatPrice(total) : '';
}

// ─── Availability banner ──────────────────────────────────────────────────────
export async function checkAvailability() {
  const banner = document.getElementById('avail-banner');
  if (!banner) return null;
  try {
    const data = await api('/api/availability');
    if (!data.accepting_orders) {
      banner.className = 'avail-banner sold-out';
      banner.innerHTML =
        '🚫 <strong>Sold out for today!</strong> We restock every morning. ' +
        'Follow <a href="https://instagram.com/momozberriez" target="_blank" rel="noopener" ' +
        'style="color:var(--rose);text-decoration:underline">@momozberriez</a> for updates.';
      document.getElementById('sold-out-msg')?.classList.remove('hidden');
      document.getElementById('product-grid')?.classList.add('hidden');
    } else {
      banner.innerHTML =
        `🍓 We accept only <span class="avail-badge">50 orders/day</span> ` +
        `— pickup only — South Gate, CA. ` +
        `<strong>${data.orders_remaining} order${data.orders_remaining !== 1 ? 's' : ''} remaining today!</strong>`;
    }
    return data;
  } catch {
    // Non-fatal — keep default banner text
    return null;
  }
}
