package refunds

import (
	"encoding/json"
	"net/http"
	"strings"

	httpresponse "github.com/akash/pet_slay/apps/api/internal/http/response"
)

func UpdateDecisionHandler(service *Service) http.HandlerFunc {
	prefix := "/v1/admin/refunds/"

	return func(w http.ResponseWriter, r *http.Request) {
		refundID := strings.TrimPrefix(r.URL.Path, prefix)
		if refundID == "" || refundID == r.URL.Path {
			httpresponse.Error(w, http.StatusBadRequest, "invalid_refund_id")
			return
		}

		var payload UpdateDecisionInput
		if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
			httpresponse.Error(w, http.StatusBadRequest, "invalid_json")
			return
		}

		decision := service.Update(refundID, payload)
		httpresponse.JSON(w, http.StatusOK, decision)
	}
}
