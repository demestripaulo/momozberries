import { api, cart, updateCartBadge, toast, formatPrice } from '/js/app.js';
import { track, getUTM } from '/js/analytics.js';

const itemsEl    = document.getElementById('cart-items');
const emptyEl    = document.getElementById('cart-empty');
const summaryEl  = document.getElementById('cart-summary');
const subtotalEl = document.getElementById('cart-subtotal');
const totalEl    = document.getElementById('cart-total');
const notesEl    = document.getElementById('order-notes');
const charsEl    = document.getElementById('notes-chars');
const checkoutBtn = document.getElementById('checkout-btn');

function render() {
  const items = cart.items();
  const { count, total } = cart.summary();

  updateCartBadge();

  if (!items.length) {
    emptyEl.classList.remove('hidden');
    itemsEl.innerHTML = '';
    summaryEl.classList.add('hidden');
    return;
  }

  emptyEl.classList.add('hidden');
  summaryEl.classList.remove('hidden');

  itemsEl.innerHTML = items.map(item => `
    <div class="cart-item" role="listitem" data-key="${escHtml(item.key)}">
      <div class="cart-item-img">
        <img src="${escHtml(item.photo_url)}" alt="${escHtml(item.name)}" width="76" height="76" loading="lazy">
      </div>
      <div class="cart-item-info">
        <div class="cart-item-name">${escHtml(item.name)}</div>
        ${item.substitutions.length
          ? `<div class="cart-item-subs">Subs: ${item.substitutions.map(escHtml).join(', ')}</div>`
          : ''}
        <div class="cart-item-qty-row">
          <button class="cqb" data-key="${escHtml(item.key)}" data-delta="-1" aria-label="Decrease quantity">−</button>
          <span aria-live="polite">${item.qty}</span>
          <button class="cqb" data-key="${escHtml(item.key)}" data-delta="1" aria-label="Increase quantity">+</button>
          <span style="color:var(--muted);font-size:.78rem">${formatPrice(item.price_cents)} each</span>
        </div>
      </div>
      <span class="cart-item-price">${formatPrice(item.price_cents * item.qty)}</span>
      <button class="cart-remove" data-key="${escHtml(item.key)}" aria-label="Remove ${escHtml(item.name)} from cart">✕</button>
    </div>`).join('');

  subtotalEl.textContent = formatPrice(total);
  totalEl.textContent = formatPrice(total);

  // Qty buttons
  itemsEl.querySelectorAll('.cqb').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = cart.items().find(i => i.key === btn.dataset.key);
      if (item) cart.setQty(btn.dataset.key, item.qty + parseInt(btn.dataset.delta, 10));
    });
  });

  // Remove buttons
  itemsEl.querySelectorAll('.cart-remove').forEach(btn => {
    btn.addEventListener('click', () => {
      cart.remove(btn.dataset.key);
    });
  });
}

function escHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
  );
}

// Notes char counter
notesEl?.addEventListener('input', () => {
  if (charsEl) charsEl.textContent = notesEl.value.length;
});

// Checkout
checkoutBtn?.addEventListener('click', async () => {
  const items = cart.items();
  if (!items.length) { toast('Cart is empty', 'error'); return; }

  checkoutBtn.textContent = '⏳ Creating checkout…';
  checkoutBtn.disabled = true;

  try {
    const { total } = cart.summary();
    track('begin_checkout', { value_cents: total, num_items: items.reduce((s, i) => s + i.qty, 0) });

    const payload = {
      items: items.map(i => ({
        productId: i.productId,
        quantity: i.qty,
        substitutions: i.substitutions.join(', '),
      })),
      orderNotes: notesEl?.value?.trim() || '',
      substitutions: Object.fromEntries(
        items.map(i => [i.productId, i.substitutions])
      ),
      utm: getUTM(),
    };

    const { url } = await api('/api/create-checkout-session', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    window.location.href = url;
  } catch (err) {
    const msg = err.data?.error === 'sold_out'
      ? "Sold out for today! Come back tomorrow 🍓"
      : err.data?.error === 'stripe_not_configured'
      ? "Stripe not set up yet. Run: npm run stripe:setup"
      : err.message || 'Checkout failed — please try again.';
    toast(msg, 'error');
    checkoutBtn.textContent = '🔒 Proceed to Checkout';
    checkoutBtn.disabled = false;
  }
});

// Re-render when cart changes (from any tab)
window.addEventListener('cart-updated', render);
render();
