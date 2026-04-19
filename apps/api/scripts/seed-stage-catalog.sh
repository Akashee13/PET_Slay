#!/usr/bin/env sh

set -eu

if [ -z "${DATABASE_URL:-}" ]; then
	echo "DATABASE_URL is required." >&2
	exit 1
fi

if ! command -v psql >/dev/null 2>&1; then
	echo "psql command is required to seed stage catalog." >&2
	exit 1
fi

echo "Seeding minimal catalog rows into stage database..."

psql "$DATABASE_URL" -v ON_ERROR_STOP=1 <<'SQL'
BEGIN;

INSERT INTO size_profiles (id, name, measurement_chart, notes)
VALUES (
  'size-prof-standard-womens',
  'Standard Womens',
  '{"chest":"S-34,M-36,L-38,XL-40","waist":"S-28,M-30,L-32,XL-34"}'::jsonb,
  'Seed profile for stage verification'
)
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name,
    measurement_chart = EXCLUDED.measurement_chart,
    notes = EXCLUDED.notes,
    updated_at = NOW();

INSERT INTO products (
  id,
  sku,
  title,
  slug,
  category,
  subcategory,
  description,
  base_wholesale_price,
  currency,
  moq,
  size_profile_id,
  availability_status,
  trend_tags,
  is_new_arrival,
  media_cover_url
)
VALUES
(
  'prod-stage-kurti-001',
  'STAGE_KURTI_001',
  'Stage Floral Kurti',
  'stage-floral-kurti',
  'kurti',
  'casual',
  'Seeded product for stage DB-backed catalog verification',
  799.00,
  'INR',
  3,
  'size-prof-standard-womens',
  'in_stock',
  '["new_arrival","floral"]'::jsonb,
  TRUE,
  'https://images.example.com/stage/floral-kurti.jpg'
),
(
  'prod-stage-top-001',
  'STAGE_TOP_001',
  'Stage Everyday Top',
  'stage-everyday-top',
  'tops',
  'everyday',
  'Seeded product for stage DB-backed catalog verification',
  499.00,
  'INR',
  2,
  'size-prof-standard-womens',
  'in_stock',
  '["trend"]'::jsonb,
  FALSE,
  'https://images.example.com/stage/everyday-top.jpg'
)
ON CONFLICT (id) DO UPDATE
SET sku = EXCLUDED.sku,
    title = EXCLUDED.title,
    slug = EXCLUDED.slug,
    category = EXCLUDED.category,
    subcategory = EXCLUDED.subcategory,
    description = EXCLUDED.description,
    base_wholesale_price = EXCLUDED.base_wholesale_price,
    currency = EXCLUDED.currency,
    moq = EXCLUDED.moq,
    size_profile_id = EXCLUDED.size_profile_id,
    availability_status = EXCLUDED.availability_status,
    trend_tags = EXCLUDED.trend_tags,
    is_new_arrival = EXCLUDED.is_new_arrival,
    media_cover_url = EXCLUDED.media_cover_url,
    updated_at = NOW();

INSERT INTO product_variants (
  id,
  product_id,
  size_label,
  color_label,
  inventory_on_hand,
  reserved_inventory,
  availability_status
)
VALUES
  ('var-stage-kurti-001-s', 'prod-stage-kurti-001', 'S', 'Blue', 50, 0, 'in_stock'),
  ('var-stage-kurti-001-m', 'prod-stage-kurti-001', 'M', 'Blue', 50, 0, 'in_stock'),
  ('var-stage-top-001-s', 'prod-stage-top-001', 'S', 'Black', 60, 0, 'in_stock'),
  ('var-stage-top-001-m', 'prod-stage-top-001', 'M', 'Black', 60, 0, 'in_stock')
ON CONFLICT (id) DO UPDATE
SET product_id = EXCLUDED.product_id,
    size_label = EXCLUDED.size_label,
    color_label = EXCLUDED.color_label,
    inventory_on_hand = EXCLUDED.inventory_on_hand,
    reserved_inventory = EXCLUDED.reserved_inventory,
    availability_status = EXCLUDED.availability_status;

COMMIT;
SQL

echo "Stage catalog seed complete."
