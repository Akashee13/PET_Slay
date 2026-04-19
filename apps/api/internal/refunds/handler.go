package refunds

import (
	"encoding/json"
	"net/http"
	"strings"

	"github.com/akash/pet_slay/apps/api/internal/auth"
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

		decision, err := service.Update(refundID, payload)
		if err != nil {
			httpresponse.Error(w, http.StatusInternalServerError, "refund_decision_not_saved")
			return
		}

		httpresponse.JSON(w, http.StatusOK, decision)
	}
}

func BuyerListByOrderHandler(service *Service) http.HandlerFunc {
	prefix := "/v1/orders/"
	suffix := "/refunds"

	return func(w http.ResponseWriter, r *http.Request) {
		session, ok := auth.SessionFromContext(r.Context())
		if !ok {
			httpresponse.Error(w, http.StatusUnauthorized, auth.ErrInvalidToken.Error())
			return
		}

		path := strings.TrimPrefix(r.URL.Path, prefix)
		orderID := strings.TrimSuffix(path, suffix)
		if orderID == "" || orderID == path {
			httpresponse.Error(w, http.StatusBadRequest, "invalid_order_id")
			return
		}

		items, err := service.ListByOrder(orderID, session.UserID)
		if err != nil {
			httpresponse.Error(w, http.StatusInternalServerError, "refunds_unavailable")
			return
		}

		httpresponse.JSON(w, http.StatusOK, map[string][]Decision{
			"items": items,
		})
	}
}
