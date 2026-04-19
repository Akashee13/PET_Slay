package catalog

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"strings"
	"time"
)

const listProductsSQL = `
SELECT id, title, category, base_wholesale_price, moq, availability_status, is_new_arrival, media_cover_url, COALESCE(media_urls, '[]'::jsonb), listing_status, visible_until
FROM products
WHERE availability_status <> 'inactive'
  AND listing_status = 'listed'
  AND (visible_until IS NULL OR visible_until > NOW())
  AND ($1 = '' OR category = $1)
  AND ($2 <> 'new_arrivals' OR is_new_arrival = TRUE)
ORDER BY created_at DESC`

const adminListProductsSQL = `
SELECT id, title, category, base_wholesale_price, moq, availability_status, is_new_arrival, media_cover_url, COALESCE(media_urls, '[]'::jsonb), listing_status, visible_until
FROM products
ORDER BY updated_at DESC, created_at DESC`

const getProductSQL = `
SELECT p.id, p.title, p.category, p.base_wholesale_price, p.moq, p.availability_status, p.is_new_arrival, p.media_cover_url, COALESCE(p.media_urls, '[]'::jsonb), p.listing_status, p.visible_until, p.description, COALESCE(sp.measurement_chart, '{}'::jsonb)
FROM products p
LEFT JOIN size_profiles sp ON sp.id = p.size_profile_id
WHERE p.id = $1`

const getVisibleProductSQL = getProductSQL + `
  AND p.listing_status = 'listed'
  AND (p.visible_until IS NULL OR p.visible_until > NOW())`

const listVariantsSQL = `
SELECT id, size_label, color_label, availability_status
FROM product_variants
WHERE product_id = $1
ORDER BY size_label, color_label`

const findByVariantSQL = `
SELECT p.id AS product_id, p.title, p.category, p.base_wholesale_price, p.moq, p.availability_status AS product_availability_status, p.is_new_arrival, p.media_cover_url, p.listing_status, p.visible_until,
       v.id AS variant_id, v.size_label, v.color_label, v.availability_status AS variant_availability_status
FROM product_variants v
JOIN products p ON p.id = v.product_id
WHERE v.id = $1
  AND p.listing_status = 'listed'
  AND (p.visible_until IS NULL OR p.visible_until > NOW())`

type PostgresRepository struct {
	db *sql.DB
}

func NewPostgresRepository(db *sql.DB) *PostgresRepository {
	return &PostgresRepository{db: db}
}

func (r *PostgresRepository) List(category, collection string) ([]ProductCard, error) {
	rows, err := r.db.Query(listProductsSQL, category, collection)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	products := []ProductCard{}
	for rows.Next() {
		product, err := scanProductCard(rows)
		if err != nil {
			return nil, err
		}
		products = append(products, product)
	}

	return products, rows.Err()
}

func (r *PostgresRepository) AdminList() ([]ProductCard, error) {
	rows, err := r.db.Query(adminListProductsSQL)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	products := []ProductCard{}
	for rows.Next() {
		product, err := scanProductCard(rows)
		if err != nil {
			return nil, err
		}
		products = append(products, product)
	}

	return products, rows.Err()
}

func (r *PostgresRepository) Get(productID string) (*ProductDetail, error) {
	return r.get(productID, getProductSQL)
}

func (r *PostgresRepository) GetVisible(productID string) (*ProductDetail, error) {
	return r.get(productID, getVisibleProductSQL)
}

func (r *PostgresRepository) get(productID string, query string) (*ProductDetail, error) {
	var product ProductDetail
	var coverImage sql.NullString
	var imageURLsBytes []byte
	var visibleUntil sql.NullTime
	var description sql.NullString
	var sizeChartBytes []byte

	err := r.db.QueryRow(query, productID).Scan(
		&product.ID,
		&product.Title,
		&product.Category,
		&product.BaseWholesalePrice,
		&product.MOQ,
		&product.AvailabilityStatus,
		&product.IsNewArrival,
		&coverImage,
		&imageURLsBytes,
		&product.ListingStatus,
		&visibleUntil,
		&description,
		&sizeChartBytes,
	)
	if err == sql.ErrNoRows {
		return nil, ErrProductNotFound
	}
	if err != nil {
		return nil, err
	}

	product.CoverImageURL = coverImage.String
	if visibleUntil.Valid {
		value := visibleUntil.Time
		product.VisibleUntil = &value
	}
	product.ImageURLs = []string{}
	if len(imageURLsBytes) > 0 {
		if err := json.Unmarshal(imageURLsBytes, &product.ImageURLs); err != nil {
			return nil, err
		}
	}
	product.Description = description.String
	product.SizeChart = map[string]interface{}{}
	if len(sizeChartBytes) > 0 {
		if err := json.Unmarshal(sizeChartBytes, &product.SizeChart); err != nil {
			return nil, err
		}
	}

	variants, err := r.listVariants(productID)
	if err != nil {
		return nil, err
	}
	product.Variants = variants

	return &product, nil
}

func (r *PostgresRepository) FindByVariantID(variantID string) (*ProductCard, *ProductVariant, error) {
	var product ProductCard
	var variant ProductVariant
	var coverImage sql.NullString
	var visibleUntil sql.NullTime
	var colorLabel sql.NullString

	err := r.db.QueryRow(findByVariantSQL, variantID).Scan(
		&product.ID,
		&product.Title,
		&product.Category,
		&product.BaseWholesalePrice,
		&product.MOQ,
		&product.AvailabilityStatus,
		&product.IsNewArrival,
		&coverImage,
		&product.ListingStatus,
		&visibleUntil,
		&variant.ID,
		&variant.SizeLabel,
		&colorLabel,
		&variant.AvailabilityStatus,
	)
	if err == sql.ErrNoRows {
		return nil, nil, ErrVariantNotFound
	}
	if err != nil {
		return nil, nil, err
	}

	product.CoverImageURL = coverImage.String
	if visibleUntil.Valid {
		value := visibleUntil.Time
		product.VisibleUntil = &value
	}
	variant.ColorLabel = colorLabel.String

	return &product, &variant, nil
}

func (r *PostgresRepository) CreateProduct(input AdminCreateProductInput) (*ProductDetail, error) {
	id := fmt.Sprintf("prod-%s", slugify(input.Title))
	if id == "prod-" {
		id = "prod-admin"
	}
	sku := strings.ToUpper(strings.ReplaceAll(id, "-", "_"))
	status := input.AvailabilityStatus
	if status == "" {
		status = string(AvailabilityInStock)
	}
	coverImageURL := ""
	if len(input.ImageURLs) > 0 {
		coverImageURL = input.ImageURLs[0]
	}
	visibleUntil := time.Now().UTC().Add(defaultListingWindow)
	imageURLsJSON, err := json.Marshal(input.ImageURLs)
	if err != nil {
		return nil, err
	}

	_, err = r.db.Exec(`
		INSERT INTO products (id, sku, title, slug, category, description, base_wholesale_price, moq, availability_status, media_cover_url, media_urls, listing_status, visible_until)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, $12, $13)
	`, id, sku, input.Title, strings.TrimPrefix(id, "prod-"), input.Category, input.Description, input.BaseWholesalePrice, input.MOQ, status, coverImageURL, string(imageURLsJSON), ListingListed, visibleUntil)
	if err != nil {
		return nil, err
	}

	return r.Get(id)
}

func (r *PostgresRepository) UpdateProduct(productID string, input AdminUpdateProductInput) (*ProductDetail, error) {
	product, err := r.Get(productID)
	if err != nil {
		return nil, err
	}

	if input.Title != nil {
		product.Title = *input.Title
	}
	if input.Description != nil {
		product.Description = *input.Description
	}
	if input.BaseWholesalePrice != nil {
		product.BaseWholesalePrice = *input.BaseWholesalePrice
	}
	if input.MOQ != nil {
		product.MOQ = *input.MOQ
	}
	if input.AvailabilityStatus != nil {
		product.AvailabilityStatus = AvailabilityStatus(*input.AvailabilityStatus)
	}
	if input.IsNewArrival != nil {
		product.IsNewArrival = *input.IsNewArrival
	}
	if input.ListingStatus != nil {
		product.ListingStatus = ListingStatus(*input.ListingStatus)
	}
	if input.ListingAction != nil {
		applyListingAction(&product.ProductCard, *input.ListingAction)
	}
	if input.ImageURLs != nil {
		product.ImageURLs = *input.ImageURLs
	}
	if len(product.ImageURLs) > 0 {
		product.CoverImageURL = product.ImageURLs[0]
	} else {
		product.CoverImageURL = ""
	}

	imageURLsJSON, err := json.Marshal(product.ImageURLs)
	if err != nil {
		return nil, err
	}

	result, err := r.db.Exec(`
		UPDATE products
		SET title = $2,
		    description = $3,
		    base_wholesale_price = $4,
		    moq = $5,
		    availability_status = $6,
		    is_new_arrival = $7,
		    media_cover_url = $8,
		    media_urls = $9::jsonb,
		    listing_status = $10,
		    visible_until = $11,
		    updated_at = NOW()
		WHERE id = $1
	`, product.ID, product.Title, product.Description, product.BaseWholesalePrice, product.MOQ, product.AvailabilityStatus, product.IsNewArrival, product.CoverImageURL, string(imageURLsJSON), product.ListingStatus, product.VisibleUntil)
	if err != nil {
		return nil, err
	}
	if rowsAffected, _ := result.RowsAffected(); rowsAffected == 0 {
		return nil, ErrProductNotFound
	}

	return r.Get(productID)
}

func (r *PostgresRepository) listVariants(productID string) ([]ProductVariant, error) {
	rows, err := r.db.Query(listVariantsSQL, productID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	variants := []ProductVariant{}
	for rows.Next() {
		var variant ProductVariant
		var colorLabel sql.NullString
		if err := rows.Scan(&variant.ID, &variant.SizeLabel, &colorLabel, &variant.AvailabilityStatus); err != nil {
			return nil, err
		}
		variant.ColorLabel = colorLabel.String
		variants = append(variants, variant)
	}

	return variants, rows.Err()
}

type productCardScanner interface {
	Scan(dest ...interface{}) error
}

func scanProductCard(row productCardScanner) (ProductCard, error) {
	var product ProductCard
	var coverImage sql.NullString
	var imageURLsBytes []byte
	var visibleUntil sql.NullTime
	err := row.Scan(
		&product.ID,
		&product.Title,
		&product.Category,
		&product.BaseWholesalePrice,
		&product.MOQ,
		&product.AvailabilityStatus,
		&product.IsNewArrival,
		&coverImage,
		&imageURLsBytes,
		&product.ListingStatus,
		&visibleUntil,
	)
	product.CoverImageURL = coverImage.String
	if visibleUntil.Valid {
		value := visibleUntil.Time
		product.VisibleUntil = &value
	}
	product.ImageURLs = []string{}
	if len(imageURLsBytes) > 0 {
		if unmarshalErr := json.Unmarshal(imageURLsBytes, &product.ImageURLs); unmarshalErr != nil {
			return ProductCard{}, unmarshalErr
		}
	}
	return product, err
}

func slugify(value string) string {
	slug := strings.ToLower(strings.TrimSpace(value))
	replacer := strings.NewReplacer("&", "and", "/", "-", "_", "-", ".", "", ",", "", "'", "")
	slug = replacer.Replace(slug)
	slug = strings.Join(strings.Fields(slug), "-")
	return slug
}
