package notifications

import (
	"errors"
	"fmt"
	"sync"
)

var ErrInvalidDeviceToken = errors.New("invalid device token")

type DeviceToken struct {
	ID       string `json:"id"`
	BuyerID  string `json:"buyerId"`
	Provider string `json:"provider"`
	Token    string `json:"token"`
	Platform string `json:"platform"`
	Status   string `json:"status"`
}

type RegisterDeviceTokenInput struct {
	BuyerID  string `json:"-"`
	Provider string `json:"provider"`
	Token    string `json:"token"`
	Platform string `json:"platform"`
}

type BuyerNotificationReadiness struct {
	BuyerID          string `json:"buyerId"`
	Ready            bool   `json:"ready"`
	ActiveTokenCount int    `json:"activeTokenCount"`
}

type DeviceTokenRepository interface {
	RegisterDeviceToken(input RegisterDeviceTokenInput) (*DeviceToken, bool, error)
}

type DeviceTokenService struct {
	mu            sync.RWMutex
	deviceTokens  map[string]DeviceToken
	buyerTokenMap map[string]int
	nextTokenID   int
	repo          DeviceTokenRepository
}

func NewDeviceTokenService() *DeviceTokenService {
	return &DeviceTokenService{
		deviceTokens:  map[string]DeviceToken{},
		buyerTokenMap: map[string]int{},
		nextTokenID:   1,
	}
}

func NewDeviceTokenServiceWithRepository(repo DeviceTokenRepository) *DeviceTokenService {
	service := NewDeviceTokenService()
	service.repo = repo
	return service
}

func (s *DeviceTokenService) RegisterDeviceToken(input RegisterDeviceTokenInput) (*DeviceToken, bool, error) {
	if input.BuyerID == "" || input.Provider == "" || input.Token == "" || input.Platform == "" {
		return nil, false, ErrInvalidDeviceToken
	}

	if s.repo != nil {
		token, created, err := s.repo.RegisterDeviceToken(input)
		if err != nil {
			return nil, false, err
		}

		s.mu.Lock()
		s.buyerTokenMap[input.BuyerID] = 1
		s.mu.Unlock()

		return token, created, nil
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	key := input.BuyerID + ":" + input.Provider + ":" + input.Token
	if existing, ok := s.deviceTokens[key]; ok {
		existing.Platform = input.Platform
		existing.Status = "active"
		s.deviceTokens[key] = existing

		copy := existing
		return &copy, false, nil
	}

	deviceToken := DeviceToken{
		ID:       fmt.Sprintf("dtok-%03d", s.nextTokenID),
		BuyerID:  input.BuyerID,
		Provider: input.Provider,
		Token:    input.Token,
		Platform: input.Platform,
		Status:   "active",
	}
	s.nextTokenID++
	s.deviceTokens[key] = deviceToken
	s.buyerTokenMap[input.BuyerID] = s.buyerTokenMap[input.BuyerID] + 1

	copy := deviceToken
	return &copy, true, nil
}

func (s *DeviceTokenService) BuyerReadiness(buyerID string) BuyerNotificationReadiness {
	s.mu.RLock()
	defer s.mu.RUnlock()

	activeTokenCount := s.buyerTokenMap[buyerID]
	return BuyerNotificationReadiness{
		BuyerID:          buyerID,
		Ready:            activeTokenCount > 0,
		ActiveTokenCount: activeTokenCount,
	}
}
