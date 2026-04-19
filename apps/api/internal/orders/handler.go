package orders

import (
	"encoding/json"
	"net/http"
	"strings"

	"github.com/akash/pet_slay/apps/api/internal/auth"
	httpresponse "github.com/akash/pet_slay/apps/api/internal/http/response"
)

func CreateHandler(service *Service) http.HandlerFunc {
	type createOrderRequest struct {
		Items []CreateOrderItem `json:"items"`
		ShippingAddress map[string]interface{} `json:"shippingAddress"`
		Notes string `json:"notes,omitempty"`
	}

	return func(w http.ResponseWriter, r *http.Request) {
		session, ok := auth.SessionFromContext(r.Context())
		if !ok {
			httpresponse.Error(w, http.StatusUnauthorized, auth.ErrInvalidToken.Error())
			return
		}

		var payload createOrderRequest
		if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
			httpresponse.Error(w, http.StatusBadRequest, "invalid_json")
			return
		}

		order, err := service.Create(CreateOrderRequest{
			BuyerID:         session.UserID,
			Items:           payload.Items,
			ShippingAddress: payload.ShippingAddress,
			Notes:           payload.Notes,
		})
		if err != nil {
			httpresponse.Error(w, http.StatusBadRequest, err.Error())
			return
		}

		httpresponse.JSON(w, http.StatusCreated, order)
	}
}

func ListHandler(service *Service) http.HandlerFunc {
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

func DetailHandler(service *Service) http.HandlerFunc {
	prefix := "/v1/orders/"

	return func(w http.ResponseWriter, r *http.Request) {
		orderID := strings.TrimPrefix(r.URL.Path, prefix)
		if orderID == "" || orderID == r.URL.Path {
			httpresponse.Error(w, http.StatusBadRequest, "invalid_order_id")
			return
		}

		order, err := service.Get(orderID)
		if err != nil {
			httpresponse.Error(w, http.StatusNotFound, ErrOrderNotFound.Error())
			return
		}

		httpresponse.JSON(w, http.StatusOK, order)
	}
}
