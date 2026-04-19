package notifications

import (
	"encoding/json"
	"net/http"
	"strings"

	httpresponse "github.com/akash/pet_slay/apps/api/internal/http/response"
)

func CreateCampaignHandler(service *Service) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var payload CreateCampaignInput
		if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
			httpresponse.Error(w, http.StatusBadRequest, "invalid_json")
			return
		}

		campaign, err := service.Create(payload)
		if err != nil {
			httpresponse.Error(w, http.StatusBadRequest, err.Error())
			return
		}

		httpresponse.JSON(w, http.StatusCreated, campaign)
	}
}

func SendCampaignHandler(service *Service) http.HandlerFunc {
	prefix := "/v1/admin/notification-campaigns/"

	return func(w http.ResponseWriter, r *http.Request) {
		path := strings.TrimPrefix(r.URL.Path, prefix)
		campaignID := strings.TrimSuffix(path, "/send")
		if campaignID == "" || campaignID == path {
			httpresponse.Error(w, http.StatusBadRequest, "invalid_campaign_id")
			return
		}

		campaign, err := service.MarkSent(campaignID)
		if err != nil {
			httpresponse.Error(w, http.StatusNotFound, err.Error())
			return
		}

		httpresponse.JSON(w, http.StatusAccepted, campaign)
	}
}
