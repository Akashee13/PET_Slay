package notifications

import (
	"encoding/json"
	"net/http"
	"strings"

	"github.com/akash/pet_slay/apps/api/internal/auth"
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

func RegisterDeviceTokenHandler(service *Service) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		session, ok := auth.SessionFromContext(r.Context())
		if !ok {
			httpresponse.Error(w, http.StatusUnauthorized, "missing_session")
			return
		}

		var payload RegisterDeviceTokenInput
		if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
			httpresponse.Error(w, http.StatusBadRequest, "invalid_json")
			return
		}
		payload.BuyerID = session.UserID

		deviceToken, created, err := service.RegisterDeviceToken(payload)
		if err != nil {
			httpresponse.Error(w, http.StatusBadRequest, err.Error())
			return
		}

		status := http.StatusOK
		if created {
			status = http.StatusCreated
		}
		httpresponse.JSON(w, status, deviceToken)
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
