import { supabase } from './supabase.js';

document.getElementById('addShopForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = e.target.querySelector('[type=submit]');
  btn.textContent = 'Saving…'; btn.disabled = true;

  const f = e.target;
  const { error } = await supabase.from('shops').insert({
    name:         f.name.value.trim(),
    address:      f.address.value.trim(),
    phone:        f.phone.value.trim(),
    alt_phone:    f.alt_phone.value.trim(),
    manager_name: f.manager_name.value.trim(),
    shop_type:    f.shop_type.value,
  });

  btn.textContent = '+ Add Shop'; btn.disabled = false;

  if (error) { alert('Error: ' + error.message); return; }

  f.reset();
  const msg = document.getElementById('success-msg');
  msg.style.display = 'block';
  setTimeout(() => { msg.style.display = 'none'; }, 3500);
});
