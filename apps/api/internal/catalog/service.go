package catalog

import (
	"errors"
	"fmt"
	"strings"
	"sync"
	"time"
)

var ErrProductNotFound = errors.New("product not found")
var ErrVariantNotFound = errors.New("product variant not found")

type AvailabilityStatus string
type ProductCategory string
type ListingStatus string

const (
	AvailabilityInStock  AvailabilityStatus = "in_stock"
	AvailabilityLowStock AvailabilityStatus = "low_stock"
	AvailabilityOutStock AvailabilityStatus = "out_of_stock"

	CategoryWestern    ProductCategory = "western"
	CategorySouthAsian ProductCategory = "south_asian"

	ListingListed   ListingStatus = "listed"
	ListingUnlisted ListingStatus = "unlisted"

	defaultListingWindow = 60 * 24 * time.Hour
)

type ProductCard struct {
	ID                 string             `json:"id"`
	Title              string             `json:"title"`
	Category           ProductCategory    `json:"category"`
	BaseWholesalePrice float64            `json:"baseWholesalePrice"`
	MOQ                int                `json:"moq"`
	AvailabilityStatus AvailabilityStatus `json:"availabilityStatus"`
	IsNewArrival       bool               `json:"isNewArrival"`
	CoverImageURL      string             `json:"coverImageUrl,omitempty"`
	ImageURLs          []string           `json:"imageUrls,omitempty"`
	ListingStatus      ListingStatus      `json:"listingStatus"`
	VisibleUntil       *time.Time         `json:"visibleUntil,omitempty"`
}

type ProductVariant struct {
	ID                 string             `json:"id"`
	SizeLabel          string             `json:"sizeLabel"`
	ColorLabel         string             `json:"colorLabel,omitempty"`
	AvailabilityStatus AvailabilityStatus `json:"availabilityStatus"`
}

type ProductDetail struct {
	ProductCard
	Description string                 `json:"description,omitempty"`
	SizeChart   map[string]interface{} `json:"sizeChart,omitempty"`
	Variants    []ProductVariant       `json:"variants"`
}

type Repository interface {
	List(category, collection string) ([]ProductCard, error)
	AdminList() ([]ProductDetail, error)
	Get(productID string) (*ProductDetail, error)
	GetVisible(productID string) (*ProductDetail, error)
	FindByVariantID(variantID string) (*ProductCard, *ProductVariant, error)
	CreateProduct(input AdminCreateProductInput) (*ProductDetail, error)
	UpdateProduct(productID string, input AdminUpdateProductInput) (*ProductDetail, error)
	DeleteProduct(productID string) error
}

type Service struct {
	mu       sync.RWMutex
	products []ProductDetail
	nextID   int
	repo     Repository
}

func NewService() *Service {
	defaultVisibleUntil := time.Now().UTC().Add(defaultListingWindow)
	return &Service{
		nextID: 1,
		products: []ProductDetail{
			{
				ProductCard: ProductCard{
					ID:                 "prod-western-001",
					Title:              "Floral Co-ord Set",
					Category:           CategoryWestern,
					BaseWholesalePrice: 799,
					MOQ:                4,
					AvailabilityStatus: AvailabilityInStock,
					IsNewArrival:       true,
					CoverImageURL:      "https://example.com/floral-coord.jpg",
					ListingStatus:      ListingListed,
					VisibleUntil:       &defaultVisibleUntil,
				},
				Description: "Trend-led floral co-ord set for reseller restocks.",
				SizeChart: map[string]interface{}{
					"S": "34",
					"M": "36",
					"L": "38",
				},
				Variants: []ProductVariant{
					{ID: "var-western-001-s", SizeLabel: "S", ColorLabel: "Blue", AvailabilityStatus: AvailabilityInStock},
					{ID: "var-western-001-m", SizeLabel: "M", ColorLabel: "Blue", AvailabilityStatus: AvailabilityLowStock},
				},
			},
			{
				ProductCard: ProductCard{
					ID:                 "prod-ethnic-001",
					Title:              "Printed Kurta Set",
					Category:           CategorySouthAsian,
					BaseWholesalePrice: 899,
					MOQ:                3,
					AvailabilityStatus: AvailabilityInStock,
					IsNewArrival:       false,
					CoverImageURL:      "https://example.com/printed-kurta.jpg",
					ListingStatus:      ListingListed,
					VisibleUntil:       &defaultVisibleUntil,
				},
				Description: "South Asian kurta set curated for high-repeat reseller demand.",
				SizeChart: map[string]interface{}{
					"M":  "38",
					"L":  "40",
					"XL": "42",
				},
				Variants: []ProductVariant{
					{ID: "var-ethnic-001-m", SizeLabel: "M", ColorLabel: "Rust", AvailabilityStatus: AvailabilityInStock},
					{ID: "var-ethnic-001-l", SizeLabel: "L", ColorLabel: "Rust", AvailabilityStatus: AvailabilityInStock},
				},
			},
		},
	}
}

func NewServiceWithRepository(repo Repository) *Service {
	service := NewService()
	service.repo = repo
	return service
}

func (s *Service) List(category, collection string) ([]ProductCard, error) {
	if s.repo != nil {
		return s.repo.List(category, collection)
	}

	s.mu.RLock()
	defer s.mu.RUnlock()

	filtered := make([]ProductCard, 0, len(s.products))

	for _, product := range s.products {
		if !productVisible(product.ProductCard) {
			continue
		}
		if category != "" && string(product.Category) != category {
			continue
		}

		if strings.EqualFold(collection, "new_arrivals") && !product.IsNewArrival {
			continue
		}

		filtered = append(filtered, product.ProductCard)
	}

	return filtered, nil
}

func (s *Service) AdminList() ([]ProductDetail, error) {
	if s.repo != nil {
		return s.repo.AdminList()
	}

	s.mu.RLock()
	defer s.mu.RUnlock()

	items := make([]ProductDetail, 0, len(s.products))
	for _, product := range s.products {
		items = append(items, product)
	}

	return items, nil
}

func (s *Service) Get(productID string) (*ProductDetail, error) {
	if s.repo != nil {
		return s.repo.Get(productID)
	}

	s.mu.RLock()
	defer s.mu.RUnlock()

	for _, product := range s.products {
		if product.ID == productID {
			copy := product
			return &copy, nil
		}
	}

	return nil, ErrProductNotFound
}

func (s *Service) GetVisible(productID string) (*ProductDetail, error) {
	if s.repo != nil {
		return s.repo.GetVisible(productID)
	}

	product, err := s.Get(productID)
	if err != nil {
		return nil, err
	}
	if !productVisible(product.ProductCard) {
		return nil, ErrProductNotFound
	}

	return product, nil
}

func (s *Service) FindByVariantID(variantID string) (*ProductCard, *ProductVariant, error) {
	if s.repo != nil {
		return s.repo.FindByVariantID(variantID)
	}

	s.mu.RLock()
	defer s.mu.RUnlock()

	for _, product := range s.products {
		for _, variant := range product.Variants {
			if variant.ID == variantID {
				productCopy := product.ProductCard
				variantCopy := variant
				return &productCopy, &variantCopy, nil
			}
		}
	}

	return nil, nil, ErrVariantNotFound
}

type AdminCreateProductInput struct {
	Title              string   `json:"title"`
	Category           string   `json:"category"`
	Description        string   `json:"description,omitempty"`
	BaseWholesalePrice float64  `json:"baseWholesalePrice"`
	AvailabilityStatus string   `json:"availabilityStatus,omitempty"`
	AvailableSizes     []string `json:"availableSizes,omitempty"`
	ImageURLs          []string `json:"imageUrls,omitempty"`
	ListingStatus      string   `json:"listingStatus,omitempty"`
}

type AdminUpdateProductInput struct {
	Title              *string   `json:"title,omitempty"`
	Description        *string   `json:"description,omitempty"`
	BaseWholesalePrice *float64  `json:"baseWholesalePrice,omitempty"`
	AvailabilityStatus *string   `json:"availabilityStatus,omitempty"`
	AvailableSizes     *[]string `json:"availableSizes,omitempty"`
	IsNewArrival       *bool     `json:"isNewArrival,omitempty"`
	ImageURLs          *[]string `json:"imageUrls,omitempty"`
	ListingStatus      *string   `json:"listingStatus,omitempty"`
	ListingAction      *string   `json:"listingAction,omitempty"`
}

func normalizeImageURLs(imageURLs []string) ([]string, error) {
	if len(imageURLs) > 5 {
		return nil, errors.New("maximum_5_images_allowed")
	}

	normalized := make([]string, 0, len(imageURLs))
	for _, imageURL := range imageURLs {
		trimmed := strings.TrimSpace(imageURL)
		if trimmed == "" {
			continue
		}
		normalized = append(normalized, trimmed)
	}

	if len(normalized) > 5 {
		return nil, errors.New("maximum_5_images_allowed")
	}

	return normalized, nil
}

func normalizeSizeLabels(sizeLabels []string) []string {
	if len(sizeLabels) == 0 {
		return nil
	}

	allowed := map[string]bool{
		"XS": true,
		"S": true,
		"M": true,
		"L": true,
		"XL": true,
		"XXL": true,
		"XXXL": true,
	}
	normalized := make([]string, 0, len(sizeLabels))
	seen := make(map[string]bool, len(sizeLabels))
	for _, sizeLabel := range sizeLabels {
		size := strings.ToUpper(strings.TrimSpace(sizeLabel))
		if size == "" || !allowed[size] || seen[size] {
			continue
		}
		seen[size] = true
		normalized = append(normalized, size)
	}

	return normalized
}

func buildVariants(productID string, sizeLabels []string, status string) []ProductVariant {
	normalized := normalizeSizeLabels(sizeLabels)
	if len(normalized) == 0 {
		normalized = []string{"M"}
	}
	if status == "" {
		status = string(AvailabilityInStock)
	}

	variants := make([]ProductVariant, 0, len(normalized))
	for _, sizeLabel := range normalized {
		variants = append(variants, ProductVariant{
			ID:                 fmt.Sprintf("var-%s-%s", productID, strings.ToLower(sizeLabel)),
			SizeLabel:          sizeLabel,
			AvailabilityStatus: AvailabilityStatus(status),
		})
	}

	return variants
}

func (s *Service) CreateProduct(input AdminCreateProductInput) (*ProductDetail, error) {
	imageURLs, err := normalizeImageURLs(input.ImageURLs)
	if err != nil {
		return nil, err
	}
	input.ImageURLs = imageURLs

	listingStatus, visibleUntil := createListingState(input.ListingStatus)
	input.ListingStatus = string(listingStatus)

	if s.repo != nil {
		return s.repo.CreateProduct(input)
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	id := fmt.Sprintf("prod-admin-%03d", s.nextID)
	s.nextID++

	status := input.AvailabilityStatus
	if status == "" {
		status = string(AvailabilityInStock)
	}
	product := ProductDetail{
		ProductCard: ProductCard{
			ID:                 id,
			Title:              input.Title,
			Category:           ProductCategory(input.Category),
			BaseWholesalePrice: input.BaseWholesalePrice,
			MOQ:                0,
			AvailabilityStatus: AvailabilityStatus(status),
			IsNewArrival:       false,
			ImageURLs:          imageURLs,
			ListingStatus:      listingStatus,
			VisibleUntil:       visibleUntil,
		},
		Description: input.Description,
		Variants:    buildVariants(id, input.AvailableSizes, status),
	}
	if len(imageURLs) > 0 {
		product.CoverImageURL = imageURLs[0]
	}

	s.products = append(s.products, product)

	copy := product
	return &copy, nil
}

func createListingState(value string) (ListingStatus, *time.Time) {
	if strings.TrimSpace(value) == string(ListingUnlisted) {
		return ListingUnlisted, nil
	}

	visibleUntil := time.Now().UTC().Add(defaultListingWindow)
	return ListingListed, &visibleUntil
}

func (s *Service) UpdateProduct(productID string, input AdminUpdateProductInput) (*ProductDetail, error) {
	if input.ImageURLs != nil {
		imageURLs, err := normalizeImageURLs(*input.ImageURLs)
		if err != nil {
			return nil, err
		}
		input.ImageURLs = &imageURLs
	}
	if input.AvailableSizes != nil {
		normalized := normalizeSizeLabels(*input.AvailableSizes)
		input.AvailableSizes = &normalized
	}

	if s.repo != nil {
		return s.repo.UpdateProduct(productID, input)
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	for index, product := range s.products {
		if product.ID != productID {
			continue
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
		if input.AvailabilityStatus != nil {
			product.AvailabilityStatus = AvailabilityStatus(*input.AvailabilityStatus)
			for variantIndex := range product.Variants {
				product.Variants[variantIndex].AvailabilityStatus = AvailabilityStatus(*input.AvailabilityStatus)
			}
		}
		if input.AvailableSizes != nil {
			product.Variants = buildVariants(product.ID, *input.AvailableSizes, string(product.AvailabilityStatus))
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
			if len(product.ImageURLs) > 0 {
				product.CoverImageURL = product.ImageURLs[0]
			} else {
				product.CoverImageURL = ""
			}
		}

		s.products[index] = product
		copy := product
		return &copy, nil
	}

	return nil, ErrProductNotFound
}

func (s *Service) DeleteProduct(productID string) error {
	if s.repo != nil {
		return s.repo.DeleteProduct(productID)
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	for index, product := range s.products {
		if product.ID != productID {
			continue
		}

		s.products = append(s.products[:index], s.products[index+1:]...)
		return nil
	}

	return ErrProductNotFound
}

func productVisible(product ProductCard) bool {
	if product.ListingStatus != ListingListed {
		return false
	}
	if product.VisibleUntil == nil {
		return true
	}
	return product.VisibleUntil.After(time.Now().UTC())
}

func applyListingAction(product *ProductCard, action string) {
	switch strings.TrimSpace(action) {
	case "list_now":
		visibleUntil := time.Now().UTC().Add(defaultListingWindow)
		product.ListingStatus = ListingListed
		product.VisibleUntil = &visibleUntil
	case "unlist_now":
		product.ListingStatus = ListingUnlisted
	}
}
