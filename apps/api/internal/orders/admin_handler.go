package orders

import (
	"net/http"

	httpresponse "github.com/akash/pet_slay/apps/api/internal/http/response"
)

func AdminListHandler(service *Service) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		httpresponse.JSON(w, http.StatusOK, map[string][]Order{
			"items": service.List(),
		})
	}
}
