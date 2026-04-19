package notifications

import (
	"errors"
	"testing"
)

func TestValidateCampaignRequiresRelevantCampaignType(t *testing.T) {
	input := validCampaignInput()
	input.CampaignType = "generic_blast"

	err := ValidateCampaign(input)
	if !errors.Is(err, ErrUnsupportedCampaignType) {
		t.Fatalf("expected ErrUnsupportedCampaignType, got %v", err)
	}
}

func TestValidateCampaignRequiresMeaningfulLocalizedCopy(t *testing.T) {
	input := validCampaignInput()
	input.MessageVariants[0].Title = "New"

	err := ValidateCampaign(input)
	if !errors.Is(err, ErrMissingCampaignCopy) {
		t.Fatalf("expected ErrMissingCampaignCopy, got %v", err)
	}
}

func TestValidateCampaignRequiresSupportedLanguageSet(t *testing.T) {
	input := validCampaignInput()
	input.MessageVariants = append(input.MessageVariants, MessageVariant{
		Language: "punjabi",
		Title:    "Fresh stock for your shop",
		Body:     "New pieces are ready with fast dispatch.",
	})

	err := ValidateCampaign(input)
	if !errors.Is(err, ErrUnsupportedLanguage) {
		t.Fatalf("expected ErrUnsupportedLanguage, got %v", err)
	}
}

func TestValidateCampaignAcceptsNewArrivalCampaign(t *testing.T) {
	if err := ValidateCampaign(validCampaignInput()); err != nil {
		t.Fatalf("expected campaign to be valid, got %v", err)
	}
}

func validCampaignInput() CreateCampaignInput {
	return CreateCampaignInput{
		CampaignType: "new_arrival",
		ProductIDs:   []string{"prod-stage-kurti-001"},
		MessageVariants: []MessageVariant{
			{
				Language: "english",
				Title:    "Fresh kurti drop for your shop",
				Body:     "New wholesale-ready styles are live with fast dispatch.",
			},
			{
				Language: "hindi",
				Title:    "Naya kurti stock ready hai",
				Body:     "Fresh styles wholesale buyers ke liye live hain.",
			},
			{
				Language: "hinglish",
				Title:    "New kurti drop live hai",
				Body:     "Fast dispatch ke saath fresh stock ab available hai.",
			},
		},
	}
}
