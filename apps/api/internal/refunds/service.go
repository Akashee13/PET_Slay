package refunds

import "sync"

type Decision struct {
	ID           string `json:"id"`
	OrderID      string `json:"orderId"`
	BuyerID      string `json:"buyerId"`
	Status       string `json:"status"`
	DecisionType string `json:"decisionType"`
	ReasonCode   string `json:"reasonCode,omitempty"`
	AdminNotes   string `json:"adminNotes,omitempty"`
}

type UpdateDecisionInput struct {
	OrderID      string `json:"orderId,omitempty"`
	BuyerID      string `json:"buyerId,omitempty"`
	Status       string `json:"status"`
	DecisionType string `json:"decisionType,omitempty"`
	ReasonCode   string `json:"reasonCode,omitempty"`
	AdminNotes   string `json:"adminNotes,omitempty"`
}

type Repository interface {
	Update(id string, input UpdateDecisionInput) (*Decision, error)
	ListByOrder(orderID, buyerID string) ([]Decision, error)
}

type Service struct {
	mu        sync.RWMutex
	decisions map[string]Decision
	repo      Repository
}

func NewService() *Service {
	return &Service{
		decisions: map[string]Decision{},
	}
}

func NewServiceWithRepository(repo Repository) *Service {
	service := NewService()
	service.repo = repo
	return service
}

func (s *Service) Update(id string, input UpdateDecisionInput) (*Decision, error) {
	if s.repo != nil {
		return s.repo.Update(id, input)
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	decision := Decision{
		ID:           id,
		OrderID:      input.OrderID,
		BuyerID:      input.BuyerID,
		Status:       input.Status,
		DecisionType: input.DecisionType,
		ReasonCode:   input.ReasonCode,
		AdminNotes:   input.AdminNotes,
	}

	if decision.DecisionType == "" {
		decision.DecisionType = "store_credit"
	}
	if decision.OrderID == "" {
		decision.OrderID = "order-001"
	}
	if decision.BuyerID == "" {
		decision.BuyerID = "buyer-dev-001"
	}

	s.decisions[id] = decision
	copy := decision
	return &copy, nil
}

func (s *Service) ListByOrder(orderID, buyerID string) ([]Decision, error) {
	if s.repo != nil {
		return s.repo.ListByOrder(orderID, buyerID)
	}

	s.mu.RLock()
	defer s.mu.RUnlock()

	items := []Decision{}
	for _, decision := range s.decisions {
		if decision.OrderID == orderID && decision.BuyerID == buyerID {
			items = append(items, decision)
		}
	}

	return items, nil
}
