package notifications

import (
	"errors"
	"fmt"
	"sync"
)

var ErrCampaignNotFound = errors.New("campaign not found")
var ErrInvalidDeviceToken = errors.New("invalid device token")

type MessageVariant struct {
	Language string `json:"language"`
	Title    string `json:"title"`
	Body     string `json:"body"`
}

type Campaign struct {
	ID              string           `json:"id"`
	CampaignType    string           `json:"campaignType"`
	Status          string           `json:"status"`
	MessageVariants []MessageVariant `json:"messageVariants"`
	ProductIDs      []string         `json:"productIds"`
}

type CreateCampaignInput struct {
	CampaignType    string           `json:"campaignType"`
	MessageVariants []MessageVariant `json:"messageVariants"`
	ProductIDs      []string         `json:"productIds"`
}

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

type Repository interface {
	Create(input CreateCampaignInput) (*Campaign, error)
	RegisterDeviceToken(input RegisterDeviceTokenInput) (*DeviceToken, bool, error)
	MarkSent(campaignID string) (*Campaign, error)
}

type Service struct {
	mu           sync.RWMutex
	campaigns    map[string]Campaign
	deviceTokens map[string]DeviceToken
	nextID       int
	nextTokenID  int
	repo         Repository
}

func NewService() *Service {
	return &Service{
		campaigns:    map[string]Campaign{},
		deviceTokens: map[string]DeviceToken{},
		nextID:       1,
		nextTokenID:  1,
	}
}

func NewServiceWithRepository(repo Repository) *Service {
	service := NewService()
	service.repo = repo
	return service
}

func (s *Service) Create(input CreateCampaignInput) (*Campaign, error) {
	if err := ValidateCampaign(input); err != nil {
		return nil, err
	}

	if s.repo != nil {
		return s.repo.Create(input)
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	id := fmt.Sprintf("camp-%03d", s.nextID)
	s.nextID++

	campaign := Campaign{
		ID:              id,
		CampaignType:    input.CampaignType,
		Status:          "draft",
		MessageVariants: input.MessageVariants,
		ProductIDs:      input.ProductIDs,
	}

	s.campaigns[id] = campaign
	copy := campaign
	return &copy, nil
}

func (s *Service) RegisterDeviceToken(input RegisterDeviceTokenInput) (*DeviceToken, bool, error) {
	if input.BuyerID == "" || input.Provider == "" || input.Token == "" || input.Platform == "" {
		return nil, false, ErrInvalidDeviceToken
	}

	if s.repo != nil {
		return s.repo.RegisterDeviceToken(input)
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

	copy := deviceToken
	return &copy, true, nil
}

func (s *Service) MarkSent(campaignID string) (*Campaign, error) {
	if s.repo != nil {
		return s.repo.MarkSent(campaignID)
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	campaign, ok := s.campaigns[campaignID]
	if !ok {
		return nil, ErrCampaignNotFound
	}

	campaign.Status = "sent"
	s.campaigns[campaignID] = campaign
	copy := campaign
	return &copy, nil
}
