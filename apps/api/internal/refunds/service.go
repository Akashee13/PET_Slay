package refunds

import "sync"

type Decision struct {
	ID           string `json:"id"`
	Status       string `json:"status"`
	DecisionType string `json:"decisionType"`
	ReasonCode   string `json:"reasonCode,omitempty"`
	AdminNotes   string `json:"adminNotes,omitempty"`
}

type UpdateDecisionInput struct {
	Status       string `json:"status"`
	DecisionType string `json:"decisionType,omitempty"`
	ReasonCode   string `json:"reasonCode,omitempty"`
	AdminNotes   string `json:"adminNotes,omitempty"`
}

type Service struct {
	mu        sync.RWMutex
	decisions map[string]Decision
}

func NewService() *Service {
	return &Service{
		decisions: map[string]Decision{},
	}
}

func (s *Service) Update(id string, input UpdateDecisionInput) *Decision {
	s.mu.Lock()
	defer s.mu.Unlock()

	decision := Decision{
		ID:           id,
		Status:       input.Status,
		DecisionType: input.DecisionType,
		ReasonCode:   input.ReasonCode,
		AdminNotes:   input.AdminNotes,
	}

	if decision.DecisionType == "" {
		decision.DecisionType = "store_credit"
	}

	s.decisions[id] = decision
	copy := decision
	return &copy
}
