package middleware

import (
	"log"
	"net/http"

	httpresponse "github.com/akash/pet_slay/apps/api/internal/http/response"
)

func Recoverer(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if recovered := recover(); recovered != nil {
				log.Printf("panic recovered: %v", recovered)
				httpresponse.Error(w, http.StatusInternalServerError, "internal_server_error")
			}
		}()

		next.ServeHTTP(w, r)
	})
}
