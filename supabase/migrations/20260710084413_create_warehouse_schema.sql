/*
# Warehouse Management Schema

## Summary
Creates the full schema for SweetHouse Warehouse Management System.
No authentication — all data is shared (single-tenant). Policies allow anon + authenticated access.

## Tables

### products
Stores all sweet products managed by the admin.
- id: UUID primary key
- name: product name (e.g. Rasgulla)
- category: milk-based, flour-based, etc.
- price: price per kg in INR
- stock_kg: current stock in kilograms
- expiry_date: date of expiry
- created_at: timestamp

### shops
Stores all registered shops.
- id: UUID primary key
- name: shop name
- address: full address
- phone: primary phone
- alt_phone: alternate phone
- manager_name: responsible person
- shop_type: Retail / Wholesale / Franchise
- created_at: timestamp

### orders
Stores orders uploaded by managers — links a product to a shop.
- id: UUID primary key
- product_id: FK to products
- shop_id: FK to shops
- price_override: price at time of order (can differ from product price)
- quantity_kg: quantity ordered in kg
- status: pending / fulfilled / cancelled
- created_at: timestamp

## Security
RLS enabled on all tables. All policies use TO anon, authenticated with USING(true)
because this is a single-tenant app with no login screen.
*/

-- products
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL DEFAULT 'Milk-based',
  price numeric(10,2) NOT NULL DEFAULT 0,
  stock_kg numeric(10,2) NOT NULL DEFAULT 0,
  expiry_date date,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_products" ON products;
CREATE POLICY "anon_select_products" ON products FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_products" ON products;
CREATE POLICY "anon_insert_products" ON products FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_products" ON products;
CREATE POLICY "anon_update_products" ON products FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_products" ON products;
CREATE POLICY "anon_delete_products" ON products FOR DELETE TO anon, authenticated USING (true);

-- shops
CREATE TABLE IF NOT EXISTS shops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text,
  phone text,
  alt_phone text,
  manager_name text,
  shop_type text NOT NULL DEFAULT 'Retail',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE shops ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_shops" ON shops;
CREATE POLICY "anon_select_shops" ON shops FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_shops" ON shops;
CREATE POLICY "anon_insert_shops" ON shops FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_shops" ON shops;
CREATE POLICY "anon_update_shops" ON shops FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_shops" ON shops;
CREATE POLICY "anon_delete_shops" ON shops FOR DELETE TO anon, authenticated USING (true);

-- orders
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  shop_id uuid REFERENCES shops(id) ON DELETE SET NULL,
  price_override numeric(10,2),
  quantity_kg numeric(10,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_orders" ON orders;
CREATE POLICY "anon_select_orders" ON orders FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_orders" ON orders;
CREATE POLICY "anon_insert_orders" ON orders FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_orders" ON orders;
CREATE POLICY "anon_update_orders" ON orders FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_orders" ON orders;
CREATE POLICY "anon_delete_orders" ON orders FOR DELETE TO anon, authenticated USING (true);
