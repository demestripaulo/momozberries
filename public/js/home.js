import { api, cart, updateCartBadge, checkAvailability, formatPrice } from '/js/app.js';

function badgesFor(p) {
  const out = [];
  if (p.is_high_protein) out.push('<span class="badge badge-protein">⚡ High-Protein</span>');
  if (p.dietary_tags?.includes('gluten-free')) out.push('<span class="badge badge-gf">GF</span>');
  if (p.dietary_tags?.includes('vegan-option') || p.dietary_tags?.includes('vegetarian')) {
    out.push('<span class="badge badge-vegan">Vegan</span>');
  }
  if (p.is_seasonal) out.push('<span class="badge badge-seasonal">Seasonal</span>');
  return out.join('');
}

function renderCard(p) {
  return `
    <a href="/menu.html" class="product-card" role="listitem" aria-label="View ${p.name} on the menu">
      <div class="product-card-img">
        <img src="${p.photo_url}" alt="${p.name}" width="300" height="218" loading="lazy">
        <div class="badge-row">${badgesFor(p)}</div>
      </div>
      <div class="product-card-body">
        <div class="product-card-name">${p.name}</div>
        <div class="product-card-desc">${p.description}</div>
        <div class="product-card-footer">
          <span class="product-price">${formatPrice(p.price_cents)}</span>
          <span class="btn-add">Order →</span>
        </div>
      </div>
    </a>`;
}

async function loadFeatured() {
  const grid = document.getElementById('featured-grid');
  if (!grid) return;
  try {
    const { products } = await api('/api/products');
    const featured = products.filter(p => p.is_active).slice(0, 3);
    grid.innerHTML = featured.length
      ? featured.map(renderCard).join('')
      : '<p style="grid-column:1/-1;text-align:center;color:var(--muted);padding:32px 0">Menu coming soon — follow <a href="https://instagram.com/momozberriez">@momozberriez</a> for updates!</p>';
  } catch {
    if (grid) grid.innerHTML =
      '<p style="grid-column:1/-1;text-align:center;color:var(--muted);padding:32px 0">Could not load menu right now.</p>';
  }
}

// Run on load
updateCartBadge();
checkAvailability();
loadFeatured();
window.addEventListener('cart-updated', updateCartBadge);
