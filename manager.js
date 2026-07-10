import { supabase } from './supabase.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

function statusBadge(stock) {
  if (stock > 50)  return '<span class="badge badge-green">In Stock</span>';
  if (stock > 10)  return '<span class="badge badge-yellow">Low Stock</span>';
  return '<span class="badge badge-red">Critical</span>';
}

function fmt(n) { return Number(n).toLocaleString('en-IN'); }

// ── Stats ─────────────────────────────────────────────────────────────────────

async function loadStats() {
  const [{ count: shopCount }, { count: productCount }, { count: orderCount }] = await Promise.all([
    supabase.from('shops').select('*', { count: 'exact', head: true }),
    supabase.from('products').select('*', { count: 'exact', head: true }),
    supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
  ]);
  document.getElementById('stat-shops').textContent    = fmt(shopCount ?? 0);
  document.getElementById('stat-products').textContent = fmt(productCount ?? 0);
  document.getElementById('stat-orders').textContent   = fmt(orderCount ?? 0);
}

// ── Inventory Table ───────────────────────────────────────────────────────────

async function loadOrders() {
  const { data, error } = await supabase
    .from('orders')
    .select('id, quantity_kg, price_override, status, created_at, products(name), shops(name)')
    .order('created_at', { ascending: false });

  const tbody = document.getElementById('orders-tbody');
  if (error) { tbody.innerHTML = `<tr><td colspan="6" style="color:#ef5959;padding:16px">Error loading orders.</td></tr>`; return; }
  if (!data.length) { tbody.innerHTML = `<tr><td colspan="6" style="color:var(--text-muted);padding:16px;text-align:center">No orders yet.</td></tr>`; return; }

  tbody.innerHTML = data.map(o => `
    <tr>
      <td>${o.products?.name ?? '—'}</td>
      <td>${o.shops?.name ?? '—'}</td>
      <td>&#8377; ${fmt(o.price_override ?? 0)}/kg</td>
      <td>${fmt(o.quantity_kg)}</td>
      <td>${o.created_at ? new Date(o.created_at).toLocaleDateString('en-IN') : '—'}</td>
      <td>${statusBadge(o.quantity_kg)}</td>
      <td>
        <button class="btn btn-danger" style="padding:5px 12px;font-size:12px" data-delete="${o.id}">Remove</button>
      </td>
    </tr>`).join('');

  tbody.querySelectorAll('[data-delete]').forEach(btn => {
    btn.addEventListener('click', () => deleteOrder(btn.dataset.delete));
  });
}

async function deleteOrder(id) {
  if (!confirm('Remove this order?')) return;
  const { error } = await supabase.from('orders').delete().eq('id', id);
  if (error) { alert('Delete failed: ' + error.message); return; }
  await Promise.all([loadOrders(), loadStats()]);
}

// ── Populate Selects ──────────────────────────────────────────────────────────

async function populateSelects() {
  const [{ data: products }, { data: shops }] = await Promise.all([
    supabase.from('products').select('id, name').order('name'),
    supabase.from('shops').select('id, name').order('name'),
  ]);

  const productOptions = (products || []).map(p => `<option value="${p.id}">${p.name}</option>`).join('');
  const shopOptions    = (shops    || []).map(s => `<option value="${s.id}">${s.name}</option>`).join('');

  document.getElementById('upload-product').innerHTML  = '<option value="">— Select Product —</option>' + productOptions;
  document.getElementById('upload-shop').innerHTML     = '<option value="">— Select Shop —</option>'    + shopOptions;
  document.getElementById('remove-product').innerHTML  = '<option value="">— Select Product —</option>' + productOptions;
  document.getElementById('remove-shop').innerHTML     = '<option value="">— Select Shop —</option>'    + shopOptions;
}

// ── Upload Order Form ─────────────────────────────────────────────────────────

document.getElementById('upload-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = e.target.querySelector('[type=submit]');
  btn.textContent = 'Uploading…'; btn.disabled = true;

  const { error } = await supabase.from('orders').insert({
    product_id:     document.getElementById('upload-product').value || null,
    shop_id:        document.getElementById('upload-shop').value    || null,
    price_override: parseFloat(document.getElementById('upload-price').value)  || 0,
    quantity_kg:    parseFloat(document.getElementById('upload-qty').value)    || 0,
    status:         'pending',
  });

  if (error) { alert('Error: ' + error.message); }
  else { e.target.reset(); await Promise.all([loadOrders(), loadStats(), populateSelects()]); }

  btn.textContent = 'Upload Order'; btn.disabled = false;
});

// ── Remove Order Form ─────────────────────────────────────────────────────────

document.getElementById('remove-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const productId = document.getElementById('remove-product').value;
  const shopId    = document.getElementById('remove-shop').value;
  if (!productId && !shopId) { alert('Select at least a product or shop.'); return; }

  let query = supabase.from('orders').delete();
  if (productId) query = query.eq('product_id', productId);
  if (shopId)    query = query.eq('shop_id', shopId);

  const { error } = await query;
  if (error) { alert('Error: ' + error.message); return; }
  e.target.reset();
  await Promise.all([loadOrders(), loadStats(), populateSelects()]);
});

// ── Init ──────────────────────────────────────────────────────────────────────

(async () => {
  await Promise.all([loadStats(), populateSelects(), loadOrders()]);
})();
