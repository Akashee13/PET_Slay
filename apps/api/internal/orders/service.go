package orders

import (
	"errors"
	"fmt"
	"sync"

	"github.com/akash/pet_slay/apps/api/internal/catalog"
)

var (
	ErrEmptyOrder            = errors.New("order must contain at least one item")
	ErrInvalidQuantity       = errors.New("quantity must be greater than zero")
	ErrProductVariantMissing = errors.New("product variant not found")
	ErrOrderNotFound         = errors.New("order not found")
)

type CreateOrderRequest struct {
	BuyerID         string
	Items           []CreateOrderItem
	ShippingAddress map[string]interface{}
	Notes           string
}

type CreateOrderItem struct {
	ProductVariantID string `json:"productVariantId"`
	Quantity         int    `json:"quantity"`
}

type UpdateStatusInput struct {
	Status string `json:"status"`
}

type OrderLineItem struct {
	ProductID  string  `json:"productId"`
	Quantity   int     `json:"quantity"`
	UnitPrice  float64 `json:"unitPrice"`
	LineTotal  float64 `json:"lineTotal"`
	VariantID  string  `json:"productVariantId,omitempty"`
	ProductMoq int     `json:"-"`
}

type Order struct {
	ID          string          `json:"id"`
	Status      string          `json:"status"`
	TotalAmount float64         `json:"totalAmount"`
	Items       []OrderLineItem `json:"items"`
	RefundPolicy struct {
		DefaultMode          string `json:"defaultMode"`
		AdminExceptionAllowed bool   `json:"adminExceptionAllowed"`
	} `json:"refundPolicy"`
}

type Repository interface {
	Save(input CreateOrderRequest, order Order) error
	Get(orderID string) (*Order, error)
	List() ([]Order, error)
	UpdateStatus(orderID, status string) (*Order, error)
}

type Service struct {
	catalog *catalog.Service
	mu      sync.RWMutex
	orders  map[string]Order
	nextID  int
	repo    Repository
}

func NewService(catalogService *catalog.Service) *Service {
	return &Service{
		catalog: catalogService,
		orders:  map[string]Order{},
		nextID:  1,
	}
}

func NewServiceWithRepository(catalogService *catalog.Service, repo Repository) *Service {
	service := NewService(catalogService)
	service.repo = repo
	return service
}

func (s *Service) Create(input CreateOrderRequest) (*Order, error) {
	if len(input.Items) == 0 {
		return nil, ErrEmptyOrder
	}

	lineItems := make([]OrderLineItem, 0, len(input.Items))
	var total float64

	for _, item := range input.Items {
		if item.Quantity <= 0 {
			return nil, ErrInvalidQuantity
		}

		product, variant, err := s.catalog.FindByVariantID(item.ProductVariantID)
		if err != nil {
			return nil, err
		}

		lineTotal := float64(item.Quantity) * product.BaseWholesalePrice
		lineItems = append(lineItems, OrderLineItem{
			ProductID:  product.ID,
			Quantity:   item.Quantity,
			UnitPrice:  product.BaseWholesalePrice,
			LineTotal:  lineTotal,
			VariantID:  variant.ID,
			ProductMoq: product.MOQ,
		})
		total += lineTotal
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	id := fmt.Sprintf("order-%03d", s.nextID)
	s.nextID++

	order := Order{
		ID:          id,
		Status:      "pending",
		TotalAmount: total,
		Items:       lineItems,
	}
	order.RefundPolicy.DefaultMode = "store_credit"
	order.RefundPolicy.AdminExceptionAllowed = true

	if s.repo != nil {
		if err := s.repo.Save(input, order); err != nil {
			return nil, err
		}
		copy := order
		return &copy, nil
	}

	s.orders[id] = order

	copy := order
	return &copy, nil
}

func (s *Service) Get(orderID string) (*Order, error) {
	if s.repo != nil {
		return s.repo.Get(orderID)
	}

	s.mu.RLock()
	defer s.mu.RUnlock()

	order, ok := s.orders[orderID]
	if !ok {
		return nil, ErrOrderNotFound
	}

	copy := order
	return &copy, nil
}

func (s *Service) List() ([]Order, error) {
	if s.repo != nil {
		return s.repo.List()
	}

	s.mu.RLock()
	defer s.mu.RUnlock()

	items := make([]Order, 0, len(s.orders))
	for _, order := range s.orders {
		items = append(items, order)
	}

	return items, nil
}

func (s *Service) UpdateStatus(orderID string, input UpdateStatusInput) (*Order, error) {
	if input.Status == "" {
		return nil, ErrOrderNotFound
	}

	if s.repo != nil {
		return s.repo.UpdateStatus(orderID, input.Status)
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	order, ok := s.orders[orderID]
	if !ok {
		return nil, ErrOrderNotFound
	}

	order.Status = input.Status
	s.orders[orderID] = order
	copy := order
	return &copy, nil
}
