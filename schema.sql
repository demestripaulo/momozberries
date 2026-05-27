-- Momo'z Berriez — D1 Schema
-- Run: wrangler d1 execute momozberriez-db --file=./schema.sql

-- Products
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price_cents INTEGER NOT NULL,
  stripe_price_id TEXT,
  photo_url TEXT,
  calories INTEGER,
  protein_g REAL,
  carbs_g REAL,
  fat_g REAL,
  is_high_protein BOOLEAN DEFAULT FALSE,
  is_vegan_available BOOLEAN DEFAULT FALSE,
  is_gf_available BOOLEAN DEFAULT FALSE,
  is_keto_available BOOLEAN DEFAULT FALSE,
  is_seasonal BOOLEAN DEFAULT FALSE,
  dietary_tags TEXT DEFAULT '[]',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ingredients (per-product cost calculator)
CREATE TABLE IF NOT EXISTS ingredients (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  unit TEXT NOT NULL,
  unit_cost_cents INTEGER NOT NULL DEFAULT 0,
  amount_per_serving REAL NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Orders (populated via Stripe webhook)
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  stripe_session_id TEXT UNIQUE,
  customer_email TEXT,
  customer_name TEXT,
  items_json TEXT NOT NULL DEFAULT '[]',
  substitutions TEXT DEFAULT '{}',
  total_cents INTEGER NOT NULL DEFAULT 0,
  pickup_time TEXT,
  order_notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Daily order limits (reset nightly via cron at 8am UTC = midnight PT)
CREATE TABLE IF NOT EXISTS daily_limits (
  date TEXT PRIMARY KEY,
  orders_count INTEGER NOT NULL DEFAULT 0,
  accepting_orders INTEGER NOT NULL DEFAULT 1
);

-- Admin sessions (JWT tokens)
CREATE TABLE IF NOT EXISTS admin_sessions (
  token TEXT PRIMARY KEY,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_ingredients_product_id ON ingredients(product_id);
