ALTER TABLE products
ADD COLUMN IF NOT EXISTS listing_status TEXT NOT NULL DEFAULT 'listed';

ALTER TABLE products
ADD COLUMN IF NOT EXISTS visible_until TIMESTAMPTZ;

UPDATE products
SET visible_until = COALESCE(visible_until, created_at + INTERVAL '60 days')
WHERE visible_until IS NULL;

CREATE INDEX IF NOT EXISTS idx_products_listing_visibility
ON products(listing_status, visible_until);
