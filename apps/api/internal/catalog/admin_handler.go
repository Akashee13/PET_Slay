package catalog

import (
	"encoding/json"
	"net/http"
	"strings"

	httpresponse "github.com/akash/pet_slay/apps/api/internal/http/response"
)

func AdminListHandler(service *Service) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		items, err := service.List("", "")
		if err != nil {
			httpresponse.Error(w, http.StatusInternalServerError, "catalog_unavailable")
			return
		}

		httpresponse.JSON(w, http.StatusOK, map[string][]ProductCard{
			"items": items,
		})
	}
}

func AdminCreateHandler(service *Service) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var payload AdminCreateProductInput
		if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
			httpresponse.Error(w, http.StatusBadRequest, "invalid_json")
			return
		}

		product, err := service.CreateProduct(payload)
		if err != nil {
			httpresponse.Error(w, http.StatusBadRequest, err.Error())
			return
		}

		httpresponse.JSON(w, http.StatusCreated, product)
	}
}

func AdminUpdateHandler(service *Service) http.HandlerFunc {
	prefix := "/v1/admin/products/"

	return func(w http.ResponseWriter, r *http.Request) {
		productID := strings.TrimPrefix(r.URL.Path, prefix)
		if productID == "" || productID == r.URL.Path {
			httpresponse.Error(w, http.StatusBadRequest, "invalid_product_id")
			return
		}

		var payload AdminUpdateProductInput
		if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
			httpresponse.Error(w, http.StatusBadRequest, "invalid_json")
			return
		}

		product, err := service.UpdateProduct(productID, payload)
		if err != nil {
			httpresponse.Error(w, http.StatusNotFound, err.Error())
			return
		}

		httpresponse.JSON(w, http.StatusOK, product)
	}
}
