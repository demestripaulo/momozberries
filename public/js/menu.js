import { api, cart, updateCartBadge, checkAvailability, toast, formatPrice } from '/js/app.js';
import { track } from '/js/analytics.js';

// ─── Substitution definitions ────────────────────────────────────────────────
const SUBS = {
  vegan: [
    { id: 'vegan_crema',   label: '🌱 Coconut cream (no dairy crema)' },
    { id: 'vegan_cheese',  label: '🌱 Cashew cream cheese' },
    { id: 'vegan_choc',    label: '🌱 Dark vegan chocolate' },
    { id: 'vegan_milk',    label: '🌱 Coconut condensed milk' },
  ],
  gf: [
    { id: 'gf_oreo',    label: '🌾 GF chocolate cookies (no Oreos)' },
    { id: 'gf_biscoff', label: '🌾 GF ginger snaps (no Biscoff)' },
    { id: 'gf_granola', label: '🌾 Certified GF oat granola' },
  ],
  keto: [
    { id: 'keto_milk',    label: '💜 Sugar-free sweetener + heavy cream' },
    { id: 'keto_granola', label: '💜 Almond & pecan keto clusters' },
    { id: 'keto_cookies', label: '💜 Keto almond flour cookies' },
    { id: 'keto_portion', label: '💜 Less strawberries, more cream base' },
  ],
};

let allProducts = [];
let activeFilter = 'all';
let currentProduct = null;
let selectedSubs = [];
let qty = 1;

// ─── Rendering ───────────────────────────────────────────────────────────────
function badgesFor(p) {
  const out = [];
  if (p.is_high_protein) out.push('<span class="badge badge-protein">⚡ High-Protein</span>');
  if (p.dietary_tags?.includes('gluten-free') || p.is_gf_available) {
    out.push('<span class="badge badge-gf">GF Available</span>');
  }
  if (p.dietary_tags?.includes('vegan-option') || p.is_vegan_available) {
    out.push('<span class="badge badge-vegan">Vegan Option</span>');
  }
  if (p.is_keto_available) out.push('<span class="badge badge-keto">Keto Option</span>');
  if (p.is_seasonal) out.push('<span class="badge badge-seasonal">Seasonal</span>');
  if (p.dietary_tags?.includes('bundle')) out.push('<span class="badge badge-bundle">Bundle</span>');
  return out.join('');
}

function renderGrid(products) {
  const grid = document.getElementById('product-grid');
  if (!products.length) {
    grid.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:var(--muted);padding:48px 0">No products match this filter.</p>';
    return;
  }
  grid.innerHTML = products.map((p, i) => `
    <article
      class="product-card"
      role="listitem"
      data-id="${p.id}"
      tabindex="0"
      aria-label="${p.name}, ${formatPrice(p.price_cents)}"
      style="animation:fadeUp .4s ${i * 0.05}s both"
    >
      <div class="product-card-img">
        <img src="${p.photo_url}" alt="${p.name}" width="300" height="218" loading="lazy">
        <div class="badge-row">${badgesFor(p)}</div>
      </div>
      <div class="product-card-body">
        <div class="product-card-name">${p.name}</div>
        <div class="product-card-desc">${p.description}</div>
        <div class="product-card-footer">
          <span class="product-price">${formatPrice(p.price_cents)}</span>
          <button class="btn-add" aria-label="View details for ${p.name}">Add to Cart</button>
        </div>
      </div>
    </article>`).join('');

  track('view_item_list', {
    items: products.map(p => ({ item_id: p.id, item_name: p.name, price: p.price_cents / 100 })),
  });

  grid.querySelectorAll('.product-card').forEach(card => {
    const open = () => {
      const p = allProducts.find(p => p.id === card.dataset.id);
      if (p) openModal(p);
    };
    card.addEventListener('click', open);
    card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
  });
}

function filterProducts() {
  if (activeFilter === 'all') return allProducts;
  return allProducts.filter(p => {
    switch (activeFilter) {
      case 'high-protein': return p.is_high_protein;
      case 'vegan':        return p.is_vegan_available;
      case 'gf':           return p.is_gf_available;
      case 'keto':         return p.is_keto_available;
      case 'seasonal':     return p.is_seasonal;
      default:             return true;
    }
  });
}

// ─── Filters ──────────────────────────────────────────────────────────────────
document.querySelectorAll('.filter-pill').forEach(pill => {
  pill.addEventListener('click', () => {
    document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
    activeFilter = pill.dataset.filter;
    renderGrid(filterProducts());
  });
});

// ─── Modal ────────────────────────────────────────────────────────────────────
const overlay   = document.getElementById('product-modal');
const modalEl   = document.getElementById('modal-content');

function openModal(p) {
  currentProduct = p;
  selectedSubs = [];
  qty = 1;

  document.getElementById('modal-img').src = p.photo_url;
  document.getElementById('modal-img').alt = p.name;
  document.getElementById('modal-name').textContent = p.name;
  document.getElementById('modal-price').textContent = formatPrice(p.price_cents);
  document.getElementById('modal-desc').textContent = p.description;
  document.getElementById('modal-cal').textContent    = p.calories ? `${p.calories}` : '—';
  document.getElementById('modal-protein').textContent = p.protein_g ? `${p.protein_g}g` : '—';
  document.getElementById('modal-carbs').textContent   = p.carbs_g ? `${p.carbs_g}g` : '—';
  document.getElementById('modal-fat').textContent     = p.fat_g ? `${p.fat_g}g` : '—';

  // Substitution pills
  const subsWrap = document.getElementById('modal-subs');
  const subSect  = document.getElementById('modal-subs-section');
  const availSubs = [
    ...(p.is_vegan_available ? SUBS.vegan : []),
    ...(p.is_gf_available    ? SUBS.gf   : []),
    ...(p.is_keto_available  ? SUBS.keto : []),
  ];
  if (availSubs.length) {
    subSect.classList.remove('hidden');
    subsWrap.innerHTML = availSubs.map(s =>
      `<button type="button" class="sub-pill" data-sub="${s.id}">${s.label}</button>`
    ).join('');
    subsWrap.querySelectorAll('.sub-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        btn.classList.toggle('active');
        const sid = btn.dataset.sub;
        if (selectedSubs.includes(sid)) selectedSubs = selectedSubs.filter(s => s !== sid);
        else selectedSubs.push(sid);
      });
    });
  } else {
    subSect.classList.add('hidden');
  }

  updateQtyDisplay();
  overlay.classList.add('open');
  overlay.setAttribute('aria-hidden', 'false');
  document.getElementById('modal-close-btn').focus();
  document.body.style.overflow = 'hidden';

  track('view_item', { id: p.id, name: p.name, price_cents: p.price_cents });
}

function closeModal() {
  overlay.classList.remove('open');
  overlay.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  currentProduct = null;
}

function updateQtyDisplay() {
  document.getElementById('qty-val').textContent = qty;
  if (currentProduct) {
    document.getElementById('modal-subtotal').textContent =
      `Subtotal: ${formatPrice(currentProduct.price_cents * qty)}`;
  }
}

document.getElementById('qty-minus').addEventListener('click', () => {
  if (qty > 1) { qty--; updateQtyDisplay(); }
});
document.getElementById('qty-plus').addEventListener('click', () => {
  if (qty < 10) { qty++; updateQtyDisplay(); }
});

document.getElementById('modal-close-btn').addEventListener('click', closeModal);
overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

document.getElementById('add-to-cart-btn').addEventListener('click', () => {
  if (!currentProduct) return;
  track('add_to_cart', { id: currentProduct.id, name: currentProduct.name, price_cents: currentProduct.price_cents, qty });
  cart.add(currentProduct, qty, selectedSubs);
  toast(`${currentProduct.name} added to cart! 🛒`, 'success');
  closeModal();
  updateCartBadge();
});

function injectProductListJsonLd(products) {
  const items = products.map((p, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    item: {
      '@type': 'Product',
      name: p.name,
      description: p.description,
      image: p.photo_url.startsWith('http') ? p.photo_url : `https://momozberriez.pages.dev${p.photo_url}`,
      brand: { '@type': 'Brand', name: "Momo'z Berriez" },
      offers: {
        '@type': 'Offer',
        price: (p.price_cents / 100).toFixed(2),
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
        seller: { '@type': 'Organization', name: "Momo'z Berriez" },
      },
    },
  }));
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify({ '@context': 'https://schema.org', '@type': 'ItemList', name: 'Menu', itemListElement: items });
  document.head.appendChild(script);
}

// ─── Load products ────────────────────────────────────────────────────────────
async function load() {
  try {
    const avail = await checkAvailability();
    const { products } = await api('/api/products');
    allProducts = products;

    if (!avail?.accepting_orders) return; // sold-out overlay already shown

    document.getElementById('product-grid').classList.remove('hidden');
    renderGrid(allProducts);
    injectProductListJsonLd(allProducts);
  } catch {
    document.getElementById('product-grid').innerHTML =
      '<p style="grid-column:1/-1;text-align:center;color:var(--muted);padding:48px 0">Could not load products right now.</p>';
  }
}

updateCartBadge();
load();
window.addEventListener('cart-updated', updateCartBadge);
