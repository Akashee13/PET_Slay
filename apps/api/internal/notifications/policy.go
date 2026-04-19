package notifications

import (
	"errors"
	"strings"
)

const (
	minCampaignTitleLength = 8
	minCampaignBodyLength  = 24
)

var (
	ErrMissingCampaignContext  = errors.New("campaign must include product context")
	ErrMissingCampaignCopy     = errors.New("campaign must include meaningful localized copy")
	ErrUnsupportedCampaignType = errors.New("campaign type is not supported")
	ErrUnsupportedLanguage     = errors.New("campaign includes unsupported language")
)

func ValidateCampaign(input CreateCampaignInput) error {
	campaignType := strings.TrimSpace(input.CampaignType)
	if !supportedCampaignType(campaignType) {
		return ErrUnsupportedCampaignType
	}

	if len(input.ProductIDs) == 0 {
		return ErrMissingCampaignContext
	}
	if len(input.MessageVariants) == 0 {
		return ErrMissingCampaignCopy
	}

	seenLanguages := map[string]bool{}
	for _, variant := range input.MessageVariants {
		language := strings.TrimSpace(variant.Language)
		if !supportedCampaignLanguage(language) {
			return ErrUnsupportedLanguage
		}
		if len(strings.TrimSpace(variant.Title)) < minCampaignTitleLength || len(strings.TrimSpace(variant.Body)) < minCampaignBodyLength {
			return ErrMissingCampaignCopy
		}
		if seenLanguages[language] {
			return ErrMissingCampaignCopy
		}
		seenLanguages[language] = true
	}

	return nil
}

func supportedCampaignType(campaignType string) bool {
	switch campaignType {
	case "new_arrival", "trending", "back_in_stock", "price_drop":
		return true
	default:
		return false
	}
}

func supportedCampaignLanguage(language string) bool {
	switch language {
	case "english", "hindi", "hinglish":
		return true
	default:
		return false
	}
}
