package orders

import (
	"encoding/json"
	"net/http"
	"strings"

	httpresponse "github.com/akash/pet_slay/apps/api/internal/http/response"
)

func AdminListHandler(service *Service) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		items, err := service.List()
		if err != nil {
			httpresponse.Error(w, http.StatusInternalServerError, "orders_unavailable")
			return
		}

		httpresponse.JSON(w, http.StatusOK, map[string][]Order{
			"items": items,
		})
	}
}

func AdminUpdateStatusHandler(service *Service) http.HandlerFunc {
	prefix := "/v1/admin/orders/"

	return func(w http.ResponseWriter, r *http.Request) {
		orderID := strings.TrimPrefix(r.URL.Path, prefix)
		if orderID == "" || orderID == r.URL.Path {
			httpresponse.Error(w, http.StatusBadRequest, "invalid_order_id")
			return
		}

		var payload UpdateStatusInput
		if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
			httpresponse.Error(w, http.StatusBadRequest, "invalid_json")
			return
		}

		order, err := service.UpdateStatus(orderID, payload)
		if err != nil {
			httpresponse.Error(w, http.StatusNotFound, err.Error())
			return
		}

		httpresponse.JSON(w, http.StatusOK, order)
	}
}
