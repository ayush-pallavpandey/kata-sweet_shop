import { supabase } from './supabase.js';

// ── Helpers ──────────────────────────────────────────────────────────────────

function statusBadge(stock) {
  if (stock > 50)  return '<span class="badge badge-green">In Stock</span>';
  if (stock > 10)  return '<span class="badge badge-yellow">Low Stock</span>';
  return '<span class="badge badge-red">Critical</span>';
}

function fmt(n) {
  return Number(n).toLocaleString('en-IN');
}

// ── Stats ─────────────────────────────────────────────────────────────────────

async function loadStats() {
  const [{ count: totalProducts }, { data: products }, { count: pendingOrders }] = await Promise.all([
    supabase.from('products').select('*', { count: 'exact', head: true }),
    supabase.from('products').select('stock_kg'),
    supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
  ]);

  const totalStock = (products || []).reduce((s, p) => s + Number(p.stock_kg), 0);

  document.getElementById('stat-products').textContent  = fmt(totalProducts ?? 0);
  document.getElementById('stat-stock').textContent     = fmt(totalStock.toFixed(0));
  document.getElementById('stat-orders').textContent    = fmt(pendingOrders ?? 0);
}

// ── Products Table ────────────────────────────────────────────────────────────

async function loadProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });

  const tbody = document.getElementById('products-tbody');
  if (error) { tbody.innerHTML = `<tr><td colspan="6" style="color:#ef5959;padding:16px">Error loading products.</td></tr>`; return; }
  if (!data.length) { tbody.innerHTML = `<tr><td colspan="6" style="color:var(--text-muted);padding:16px;text-align:center">No products yet. Add one above.</td></tr>`; return; }

  tbody.innerHTML = data.map(p => `
    <tr>
      <td>${p.name}</td>
      <td>${p.category}</td>
      <td>&#8377; ${fmt(p.price)}/kg</td>
      <td>${fmt(p.stock_kg)}</td>
      <td>${p.expiry_date ?? '—'}</td>
      <td>${statusBadge(p.stock_kg)}</td>
      <td>
        <button class="btn btn-danger" style="padding:5px 12px;font-size:12px" data-delete="${p.id}">Remove</button>
      </td>
    </tr>`).join('');

  tbody.querySelectorAll('[data-delete]').forEach(btn => {
    btn.addEventListener('click', () => deleteProduct(btn.dataset.delete));
  });
}

async function deleteProduct(id) {
  if (!confirm('Remove this product?')) return;
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) { alert('Delete failed: ' + error.message); return; }
  await Promise.all([loadProducts(), loadStats(), populateProductList()]);
}

// ── Add Product Form ──────────────────────────────────────────────────────────

document.getElementById('add-product-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = e.target.querySelector('[type=submit]');
  btn.textContent = 'Saving…'; btn.disabled = true;

  const { error } = await supabase.from('products').insert({
    name:        document.getElementById('p-name').value.trim(),
    category:    document.getElementById('p-category').value,
    price:       parseFloat(document.getElementById('p-price').value),
    stock_kg:    parseFloat(document.getElementById('p-stock').value),
    expiry_date: document.getElementById('p-expiry').value || null,
  });

  if (error) { alert('Error: ' + error.message); }
  else { e.target.reset(); await Promise.all([loadProducts(), loadStats(), populateProductList()]); }

  btn.textContent = 'Add Product'; btn.disabled = false;
});

// ── Remove Product Form ───────────────────────────────────────────────────────

async function populateProductList() {
  const { data } = await supabase.from('products').select('id, name').order('name');
  const sel = document.getElementById('remove-product-select');
  sel.innerHTML = '<option value="">— Select Product —</option>' +
    (data || []).map(p => `<option value="${p.id}">${p.name}</option>`).join('');
}

document.getElementById('remove-product-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('remove-product-select').value;
  if (!id) { alert('Please select a product.'); return; }
  if (!confirm('Remove this product permanently?')) return;
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) { alert('Error: ' + error.message); return; }
  await Promise.all([loadProducts(), loadStats(), populateProductList()]);
});

// ── Factory Stock Form ────────────────────────────────────────────────────────

document.getElementById('stock-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = e.target.querySelector('[type=submit]');
  btn.textContent = 'Saving…'; btn.disabled = true;

  const productId = document.getElementById('stock-product-select').value;
  const qty       = parseFloat(document.getElementById('stock-qty').value);

  if (!productId) { alert('Select a product.'); btn.textContent = 'Record Stock'; btn.disabled = false; return; }

  const { data: cur } = await supabase
    .from('products')
    .select('stock_kg')
    .eq('id', productId)
    .maybeSingle();

  const { error } = await supabase
    .from('products')
    .update({ stock_kg: Number(cur?.stock_kg ?? 0) + qty })
    .eq('id', productId);

  if (error) { alert('Error: ' + error.message); }
  else { e.target.reset(); await Promise.all([loadProducts(), loadStats()]); }

  btn.textContent = 'Record Stock'; btn.disabled = false;
});

async function populateStockProductList() {
  const { data } = await supabase.from('products').select('id, name').order('name');
  const sel = document.getElementById('stock-product-select');
  sel.innerHTML = '<option value="">— Select Product —</option>' +
    (data || []).map(p => `<option value="${p.id}">${p.name}</option>`).join('');
}

// ── Init ──────────────────────────────────────────────────────────────────────

(async () => {
  await Promise.all([loadStats(), loadProducts(), populateProductList(), populateStockProductList()]);
})();
