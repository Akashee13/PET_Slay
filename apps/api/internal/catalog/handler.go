package catalog

import (
	"net/http"
	"strings"

	httpresponse "github.com/akash/pet_slay/apps/api/internal/http/response"
)

func ListHandler(service *Service) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		category := strings.TrimSpace(r.URL.Query().Get("category"))
		collection := strings.TrimSpace(r.URL.Query().Get("collection"))

		items, err := service.List(category, collection)
		if err != nil {
			httpresponse.Error(w, http.StatusInternalServerError, "catalog_unavailable")
			return
		}

		httpresponse.JSON(w, http.StatusOK, map[string][]ProductCard{
			"items": items,
		})
	}
}

func DetailHandler(service *Service) http.HandlerFunc {
	prefix := "/v1/catalog/products/"

	return func(w http.ResponseWriter, r *http.Request) {
		productID := strings.TrimPrefix(r.URL.Path, prefix)
		if productID == "" || productID == r.URL.Path {
			httpresponse.Error(w, http.StatusBadRequest, "invalid_product_id")
			return
		}

		product, err := service.Get(productID)
		if err != nil {
			httpresponse.Error(w, http.StatusNotFound, ErrProductNotFound.Error())
			return
		}

		httpresponse.JSON(w, http.StatusOK, product)
	}
}
