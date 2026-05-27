import { api, toast, formatPrice } from '/js/app.js';

let currentView = 'dashboard';
let currentOrderPeriod = 'today';
let editingProductId = null;

// ─── Auth ─────────────────────────────────────────────────────────────────────
async function checkAuth() {
  try {
    await api('/api/admin/dashboard');
    showApp();
    loadView('dashboard');
  } catch (e) {
    showLogin();
  }
}

function showLogin() {
  document.getElementById('login-view').classList.remove('hidden');
  document.getElementById('admin-app').classList.add('hidden');
}

function showApp() {
  document.getElementById('login-view').classList.add('hidden');
  document.getElementById('admin-app').classList.remove('hidden');
}

document.getElementById('login-form').addEventListener('submit', async e => {
  e.preventDefault();
  const password = document.getElementById('admin-password').value;
  const btn = document.getElementById('login-btn');
  const errEl = document.getElementById('login-error');

  btn.textContent = 'Signing in…';
  btn.disabled = true;
  errEl.classList.add('hidden');

  try {
    await api('/api/admin/login', { method: 'POST', body: JSON.stringify({ password }) });
    showApp();
    loadView('dashboard');
  } catch (err) {
    errEl.textContent = err.status === 401 ? 'Incorrect password.' : 'Something went wrong.';
    errEl.classList.remove('hidden');
  } finally {
    btn.textContent = 'Sign In';
    btn.disabled = false;
  }
});

document.getElementById('logout-btn').addEventListener('click', async () => {
  await api('/api/admin/logout', { method: 'POST' }).catch(() => {});
  showLogin();
});

// ─── View switching ───────────────────────────────────────────────────────────
function loadView(name) {
  currentView = name;
  document.querySelectorAll('[id^="view-"]').forEach(v => v.classList.add('hidden'));
  document.getElementById(`view-${name}`)?.classList.remove('hidden');
  document.querySelectorAll('.admin-nav-btn[data-view]').forEach(btn =>
    btn.classList.toggle('active', btn.dataset.view === name)
  );
  if (name === 'dashboard') loadDashboard();
  else if (name === 'orders') loadOrders(currentOrderPeriod);
  else if (name === 'products') loadProducts();
}

document.querySelectorAll('.admin-nav-btn[data-view]').forEach(btn =>
  btn.addEventListener('click', () => loadView(btn.dataset.view))
);

// ─── Dashboard ────────────────────────────────────────────────────────────────
async function loadDashboard() {
  try {
    const data = await api('/api/admin/dashboard');
    document.getElementById('stat-orders-today').textContent = data.today.orders;
    document.getElementById('stat-remaining').textContent = `${data.today.orders_remaining} remaining today`;
    document.getElementById('stat-revenue-today').textContent = formatPrice(data.today.revenue_cents);
    document.getElementById('stat-orders-week').textContent = data.week.orders;
    document.getElementById('stat-revenue-week').textContent = formatPrice(data.week.revenue_cents) + ' this week';

    const acceptEl = document.getElementById('stat-accepting');
    const acceptCard = document.getElementById('stat-accepting-card');
    if (data.today.accepting_orders) {
      acceptEl.textContent = '✅ Open';
      acceptCard.style.borderLeftColor = '#16a34a';
    } else {
      acceptEl.textContent = '🚫 Sold Out';
      acceptCard.style.borderLeftColor = '#dc2626';
    }

    renderChart(data.last_7_days || []);
    await loadDashboardOrders();
  } catch {
    toast('Failed to load dashboard', 'error');
  }
}

function renderChart(days) {
  const chart = document.getElementById('dash-chart');
  if (!chart) return;
  if (!days.length) {
    chart.innerHTML = '<p style="color:var(--muted);font-size:.84rem;text-align:center;width:100%">No order data yet</p>';
    return;
  }
  const max = Math.max(...days.map(d => d.count), 1);
  chart.innerHTML = days.map(d => {
    const pct = Math.round((d.count / max) * 88);
    const label = new Date(d.day + 'T12:00:00Z').toLocaleDateString('en-US', { weekday: 'short' });
    return `<div class="chart-col">
      <div style="font-size:.68rem;color:var(--muted);text-align:center">${d.count}</div>
      <div class="chart-bar" style="height:${pct}%" title="${d.count} orders on ${d.day}"></div>
      <div class="chart-lbl">${label}</div>
    </div>`;
  }).join('');
}

async function loadDashboardOrders() {
  const tbody = document.getElementById('dash-orders-body');
  try {
    const { orders } = await api('/api/admin/orders?period=today');
    if (!orders.length) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--muted);padding:22px">No orders today yet</td></tr>';
      return;
    }
    tbody.innerHTML = orders.map(o => orderRowHtml(o, 6)).join('');
    attachStatusListeners(tbody);
  } catch {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--muted)">Failed to load</td></tr>';
  }
}

document.getElementById('refresh-orders-btn')?.addEventListener('click', loadDashboardOrders);

// ─── Orders ───────────────────────────────────────────────────────────────────
async function loadOrders(period = 'today') {
  currentOrderPeriod = period;
  const tbody = document.getElementById('orders-body');
  tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:var(--muted);padding:22px">Loading…</td></tr>';
  try {
    const { orders } = await api(`/api/admin/orders?period=${period}`);
    if (!orders.length) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:var(--muted);padding:22px">No orders found</td></tr>';
      return;
    }
    tbody.innerHTML = orders.map(o => orderRowHtml(o, 8)).join('');
    attachStatusListeners(tbody);
  } catch {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:var(--muted)">Failed to load orders</td></tr>';
  }
}

function orderRowHtml(o, cols) {
  const pickupMap = { morning: '10am–12pm', afternoon: '12pm–3pm', evening: '3pm–6pm' };
  const shortId = o.id.substring(0, 8).toUpperCase();
  const items = (o.items_json || '').substring(0, 45) + ((o.items_json || '').length > 45 ? '…' : '');
  const time = o.created_at
    ? new Date(o.created_at.endsWith('Z') ? o.created_at : o.created_at + 'Z')
        .toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    : '—';

  const opts = ['pending', 'ready', 'picked_up', 'cancelled']
    .map(s => `<option value="${s}" ${s === o.status ? 'selected' : ''}>${s.replace('_', ' ')}</option>`)
    .join('');

  const commonCells = `
    <td><code style="font-size:.76rem">#${shortId}</code></td>
    <td>${esc(o.customer_name || o.customer_email || 'Guest')}</td>
    <td style="max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(items)}</td>`;

  if (cols === 6) {
    return `<tr>${commonCells}
      <td><strong>${formatPrice(o.total_cents)}</strong></td>
      <td>${pickupMap[o.pickup_time] || '—'}</td>
      <td><select class="status-select" data-id="${o.id}">${opts}</select></td>
    </tr>`;
  }
  return `<tr>${commonCells}
    <td style="max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:.79rem;color:var(--muted)">${esc(o.order_notes || '—')}</td>
    <td><strong>${formatPrice(o.total_cents)}</strong></td>
    <td>${pickupMap[o.pickup_time] || '—'}</td>
    <td style="color:var(--muted);font-size:.8rem">${time}</td>
    <td><select class="status-select" data-id="${o.id}">${opts}</select></td>
  </tr>`;
}

function attachStatusListeners(container) {
  container.querySelectorAll('.status-select').forEach(sel => {
    sel.addEventListener('change', async () => {
      const { id, value: status } = { id: sel.dataset.id, value: sel.value };
      try {
        await api(`/api/admin/orders/${id}/status`, { method: 'POST', body: JSON.stringify({ status }) });
        toast(`Order marked: ${status.replace('_', ' ')}`, 'success');
      } catch {
        toast('Failed to update status', 'error');
        loadOrders(currentOrderPeriod);
      }
    });
  });
}

document.querySelectorAll('.tab-btn[data-period]').forEach(btn =>
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn[data-period]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    loadOrders(btn.dataset.period);
  })
);
document.getElementById('orders-refresh-btn')?.addEventListener('click', () => loadOrders(currentOrderPeriod));

// ─── Products ─────────────────────────────────────────────────────────────────
let cachedProducts = [];

async function loadProducts() {
  const tbody = document.getElementById('products-body');
  tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:var(--muted);padding:22px">Loading…</td></tr>';
  try {
    const { products } = await api('/api/admin/products');
    cachedProducts = products;
    tbody.innerHTML = products.length
      ? products.map(productRowHtml).join('')
      : '<tr><td colspan="8" style="text-align:center;color:var(--muted);padding:22px">No products yet</td></tr>';

    tbody.querySelectorAll('[data-edit]').forEach(btn =>
      btn.addEventListener('click', () => {
        const p = cachedProducts.find(x => x.id === btn.dataset.edit);
        if (p) openProductModal(p);
      })
    );
    tbody.querySelectorAll('[data-archive]').forEach(btn =>
      btn.addEventListener('click', () => archiveProduct(btn.dataset.archive, btn))
    );
  } catch {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:var(--muted)">Failed to load products</td></tr>';
  }
}

function productRowHtml(p) {
  const viabilityText = { profitable: '🟢 Profitable', borderline: '🟡 Borderline', not_worth_it: '🔴 Low margin' };
  const viabilityClass = { profitable: 'm-profitable', borderline: 'm-borderline', not_worth_it: 'm-not_worth_it' };
  const tags = (p.dietary_tags || []).slice(0, 2).map(t =>
    `<span class="badge" style="background:var(--cream-dk);color:var(--text);font-size:.62rem">${t}</span>`
  ).join(' ');

  return `<tr style="${!p.is_active ? 'opacity:.45' : ''}">
    <td><div class="product-thumb"><img src="${esc(p.photo_url || '')}" alt="" width="44" height="44" loading="lazy"></div></td>
    <td style="font-weight:600;max-width:160px">${esc(p.name)}</td>
    <td>${formatPrice(p.price_cents)}</td>
    <td>${formatPrice(p.cogs_cents)}</td>
    <td><span class="margin-badge ${viabilityClass[p.viability] || ''}">${p.margin_pct}% ${viabilityText[p.viability] || ''}</span></td>
    <td>${tags || '—'}</td>
    <td><span class="status-badge ${p.is_active ? 's-ready' : 's-cancelled'}">${p.is_active ? 'Active' : 'Archived'}</span></td>
    <td style="white-space:nowrap;display:flex;gap:5px">
      <button class="btn-sm btn-edit" data-edit="${p.id}">Edit</button>
      ${p.is_active ? `<button class="btn-sm btn-archive" data-archive="${p.id}">Archive</button>` : ''}
    </td>
  </tr>`;
}

async function archiveProduct(id, btn) {
  if (!confirm('Archive this product? It will be hidden from the menu.')) return;
  btn.disabled = true;
  try {
    await api(`/api/admin/products/${id}`, { method: 'DELETE' });
    toast('Product archived', 'success');
    loadProducts();
  } catch {
    toast('Failed to archive', 'error');
    btn.disabled = false;
  }
}

// ─── Product modal ────────────────────────────────────────────────────────────
function openProductModal(product = null) {
  editingProductId = product?.id || null;
  document.getElementById('product-modal-title').textContent = product ? 'Edit Product' : 'New Product';
  document.getElementById('product-form').reset();
  document.getElementById('pf-id').value = product?.id || '';

  if (product) {
    document.getElementById('pf-name').value     = product.name || '';
    document.getElementById('pf-price').value    = (product.price_cents / 100).toFixed(2);
    document.getElementById('pf-desc').value     = product.description || '';
    document.getElementById('pf-photo').value    = product.photo_url || '';
    document.getElementById('pf-calories').value = product.calories || '';
    document.getElementById('pf-protein').value  = product.protein_g || '';
    document.getElementById('pf-carbs').value    = product.carbs_g || '';
    document.getElementById('pf-high-protein').checked = !!product.is_high_protein;
    document.getElementById('pf-vegan').checked  = !!product.is_vegan_available;
    document.getElementById('pf-gf').checked     = !!product.is_gf_available;
    document.getElementById('pf-keto').checked   = !!product.is_keto_available;
    document.getElementById('pf-seasonal').checked = !!product.is_seasonal;
  }

  // Ingredient rows
  document.getElementById('ingredient-rows').innerHTML = '';
  const ings = product?.ingredients?.length ? product.ingredients : [null];
  ings.forEach(addIngredientRow);

  updateProfitPanel();
  document.getElementById('product-modal').classList.add('open');
  document.getElementById('pf-name').focus();
}

function closeProductModal() {
  document.getElementById('product-modal').classList.remove('open');
  editingProductId = null;
}

function addIngredientRow(ing = null) {
  const row = document.createElement('div');
  row.className = 'ingredient-row';
  const units = ['lb', 'oz', 'cup', 'tbsp', 'tsp', 'unit', 'g', 'ml'];
  row.innerHTML = `
    <input type="text"   class="form-input ing-name"   placeholder="Fresh strawberries" value="${esc(ing?.name || '')}" maxlength="80">
    <input type="number" class="form-input ing-amount" placeholder="0.25" value="${ing?.amount_per_serving ?? ''}" min="0" step="0.001">
    <select class="form-input ing-unit">
      ${units.map(u => `<option ${(ing?.unit || 'unit') === u ? 'selected' : ''}>${u}</option>`).join('')}
    </select>
    <input type="number" class="form-input ing-cost" placeholder="2.49" value="${ing ? (ing.unit_cost_cents / 100).toFixed(2) : ''}" min="0" step="0.01">
    <div class="form-input ing-cps" style="background:var(--cream);color:var(--burgundy);font-weight:700;text-align:center;cursor:default">$0.00</div>
    <button type="button" class="ing-remove" style="color:var(--muted);font-size:1.05rem;padding:4px" title="Remove ingredient" aria-label="Remove ingredient">✕</button>`;

  row.querySelector('.ing-remove').addEventListener('click', () => { row.remove(); updateProfitPanel(); });
  row.querySelectorAll('input,select').forEach(el => el.addEventListener('input', () => { syncRowCost(row); updateProfitPanel(); }));
  document.getElementById('ingredient-rows').appendChild(row);
  syncRowCost(row);
}

function syncRowCost(row) {
  const amount = parseFloat(row.querySelector('.ing-amount').value) || 0;
  const cost   = parseFloat(row.querySelector('.ing-cost').value)   || 0;
  row.querySelector('.ing-cps').textContent = '$' + (amount * cost).toFixed(2);
}

function updateProfitPanel() {
  let totalCogs = 0;
  document.querySelectorAll('#ingredient-rows .ingredient-row').forEach(row => {
    totalCogs += (parseFloat(row.querySelector('.ing-amount').value) || 0)
              *  (parseFloat(row.querySelector('.ing-cost').value)   || 0);
  });

  const price  = parseFloat(document.getElementById('pf-price').value) || 0;
  const margin = price > 0 ? ((price - totalCogs) / price * 100) : 0;

  document.getElementById('pa-cogs').textContent   = '$' + totalCogs.toFixed(2);
  document.getElementById('pa-min').textContent    = '$' + (totalCogs * 3).toFixed(2);
  document.getElementById('pa-std').textContent    = '$' + (totalCogs * 4).toFixed(2);
  document.getElementById('pa-price').textContent  = price > 0 ? '$' + price.toFixed(2) : '—';
  document.getElementById('pa-margin').textContent = price > 0 ? Math.round(margin) + '%' : '—';

  const viab = document.getElementById('pa-viability');
  if (!price || !totalCogs) {
    viab.textContent = '⬜ Enter price and ingredients to see viability';
    viab.style.color = 'var(--muted)';
  } else if (margin >= 50) {
    viab.textContent = '🟢 Profitable — great margin!';
    viab.style.color = '#166534';
  } else if (margin >= 30) {
    viab.textContent = '🟡 Borderline — consider raising your price';
    viab.style.color = '#854d0e';
  } else {
    viab.textContent = '🔴 Not Worth Producing — price is too low';
    viab.style.color = '#991b1b';
  }
}

document.getElementById('add-ingredient-btn').addEventListener('click', () => addIngredientRow());
document.getElementById('pf-price').addEventListener('input', updateProfitPanel);
document.getElementById('product-modal-close').addEventListener('click', closeProductModal);
document.getElementById('cancel-product-btn').addEventListener('click', closeProductModal);
document.getElementById('product-modal').addEventListener('click', e => {
  if (e.target === document.getElementById('product-modal')) closeProductModal();
});
document.getElementById('new-product-btn').addEventListener('click', () => openProductModal());

document.getElementById('product-form').addEventListener('submit', async e => {
  e.preventDefault();
  const btn = document.getElementById('save-product-btn');
  btn.textContent = 'Saving…';
  btn.disabled = true;

  const ingredients = [...document.querySelectorAll('#ingredient-rows .ingredient-row')]
    .map(row => ({
      name:      row.querySelector('.ing-name').value.trim(),
      amount:    parseFloat(row.querySelector('.ing-amount').value) || 0,
      unit:      row.querySelector('.ing-unit').value,
      unit_cost: parseFloat(row.querySelector('.ing-cost').value) || 0,
    }))
    .filter(i => i.name);

  const tags = [];
  if (document.getElementById('pf-high-protein').checked) tags.push('high-protein');
  if (document.getElementById('pf-vegan').checked)        tags.push('vegan-option');
  if (document.getElementById('pf-gf').checked)           tags.push('gf-option');
  if (document.getElementById('pf-keto').checked)         tags.push('keto-option');
  if (document.getElementById('pf-seasonal').checked)     tags.push('seasonal');

  const body = {
    name:              document.getElementById('pf-name').value,
    description:       document.getElementById('pf-desc').value,
    price:             document.getElementById('pf-price').value,
    photo_url:         document.getElementById('pf-photo').value,
    calories:          document.getElementById('pf-calories').value,
    protein_g:         document.getElementById('pf-protein').value,
    carbs_g:           document.getElementById('pf-carbs').value,
    is_high_protein:   document.getElementById('pf-high-protein').checked,
    is_vegan_available:document.getElementById('pf-vegan').checked,
    is_gf_available:   document.getElementById('pf-gf').checked,
    is_keto_available: document.getElementById('pf-keto').checked,
    is_seasonal:       document.getElementById('pf-seasonal').checked,
    dietary_tags: tags,
    ingredients,
  };

  try {
    if (editingProductId) {
      await api(`/api/admin/products/${editingProductId}`, { method: 'PUT', body: JSON.stringify(body) });
      toast('Product updated ✓', 'success');
    } else {
      await api('/api/admin/products', { method: 'POST', body: JSON.stringify(body) });
      toast('Product created! ✓', 'success');
    }
    closeProductModal();
    loadProducts();
  } catch (err) {
    toast(err.message || 'Failed to save product', 'error');
  } finally {
    btn.textContent = 'Save Product';
    btn.disabled = false;
  }
});

// ─── Utilities ────────────────────────────────────────────────────────────────
function esc(str) {
  return String(str ?? '').replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
  );
}

// ─── Boot ─────────────────────────────────────────────────────────────────────
checkAuth();
