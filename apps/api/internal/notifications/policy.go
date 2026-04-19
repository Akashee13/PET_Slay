package notifications

import (
	"errors"
	"strings"
)

var (
	ErrMissingCampaignContext = errors.New("campaign must include product context")
	ErrMissingCampaignCopy    = errors.New("campaign must include non-empty localized copy")
	ErrUnsupportedLanguage    = errors.New("campaign includes unsupported language")
)

func ValidateCampaign(input CreateCampaignInput) error {
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
		if strings.TrimSpace(variant.Title) == "" || strings.TrimSpace(variant.Body) == "" {
			return ErrMissingCampaignCopy
		}
		if seenLanguages[language] {
			return ErrMissingCampaignCopy
		}
		seenLanguages[language] = true
	}

	return nil
}

func supportedCampaignLanguage(language string) bool {
	switch language {
	case "english", "hindi", "hinglish":
		return true
	default:
		return false
	}
}

