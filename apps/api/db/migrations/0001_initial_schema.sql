CREATE TABLE reseller_buyers (
  id TEXT PRIMARY KEY,
  auth_user_id TEXT NOT NULL UNIQUE,
  display_name TEXT,
  phone TEXT,
  email TEXT,
  preferred_language TEXT NOT NULL DEFAULT 'english',
  region TEXT,
  business_name TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE admin_operators (
  id TEXT PRIMARY KEY,
  auth_user_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE size_profiles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  measurement_chart JSONB NOT NULL DEFAULT '{}'::jsonb,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE products (
  id TEXT PRIMARY KEY,
  sku TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  subcategory TEXT,
  description TEXT,
  base_wholesale_price NUMERIC(12, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  moq INTEGER NOT NULL DEFAULT 1,
  size_profile_id TEXT REFERENCES size_profiles(id),
  availability_status TEXT NOT NULL DEFAULT 'in_stock',
  trend_tags JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_new_arrival BOOLEAN NOT NULL DEFAULT FALSE,
  media_cover_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE product_variants (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  size_label TEXT NOT NULL,
  color_label TEXT,
  inventory_on_hand INTEGER NOT NULL DEFAULT 0,
  reserved_inventory INTEGER NOT NULL DEFAULT 0,
  availability_status TEXT NOT NULL DEFAULT 'in_stock'
);

CREATE TABLE orders (
  id TEXT PRIMARY KEY,
  buyer_id TEXT NOT NULL REFERENCES reseller_buyers(id),
  order_number TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending',
  subtotal_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  discount_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  payment_status TEXT NOT NULL DEFAULT 'pending',
  payment_reference TEXT,
  shipping_contact JSONB NOT NULL DEFAULT '{}'::jsonb,
  shipping_address JSONB NOT NULL DEFAULT '{}'::jsonb,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE order_items (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES products(id),
  product_variant_id TEXT REFERENCES product_variants(id),
  quantity INTEGER NOT NULL,
  unit_price NUMERIC(12, 2) NOT NULL,
  line_total NUMERIC(12, 2) NOT NULL
);

CREATE TABLE device_tokens (
  id TEXT PRIMARY KEY,
  buyer_id TEXT NOT NULL REFERENCES reseller_buyers(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'expo',
  token TEXT NOT NULL UNIQUE,
  platform TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  last_seen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE notification_campaigns (
  id TEXT PRIMARY KEY,
  campaign_type TEXT NOT NULL,
  audience_rule JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'draft',
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  created_by_admin_id TEXT NOT NULL REFERENCES admin_operators(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE notification_message_variants (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL REFERENCES notification_campaigns(id) ON DELETE CASCADE,
  language TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  deep_link_target TEXT,
  UNIQUE (campaign_id, language)
);

CREATE TABLE notification_campaign_items (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL REFERENCES notification_campaigns(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES products(id),
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE refund_decisions (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id),
  buyer_id TEXT NOT NULL REFERENCES reseller_buyers(id),
  decision_type TEXT NOT NULL DEFAULT 'store_credit',
  reason_code TEXT,
  admin_notes TEXT,
  approved_by_admin_id TEXT REFERENCES admin_operators(id),
  status TEXT NOT NULL DEFAULT 'requested',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_new_arrival ON products(is_new_arrival);
CREATE INDEX idx_orders_buyer_id ON orders(buyer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_device_tokens_buyer_id ON device_tokens(buyer_id);
CREATE INDEX idx_notification_campaigns_status ON notification_campaigns(status);
