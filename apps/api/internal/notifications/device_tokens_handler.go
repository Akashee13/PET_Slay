package notifications

import (
	"encoding/json"
	"net/http"

	"github.com/akash/pet_slay/apps/api/internal/auth"
	httpresponse "github.com/akash/pet_slay/apps/api/internal/http/response"
)

func RegisterDeviceTokenHandler(service *DeviceTokenService) http.HandlerFunc {
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
