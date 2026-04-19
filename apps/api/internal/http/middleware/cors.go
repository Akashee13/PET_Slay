package middleware

import (
	"net/http"
	"os"
	"strings"
)

var defaultAllowedOrigins = []string{
	"https://pet-slay-admin-stage-j67sekma7a-el.a.run.app",
	"http://localhost:3000",
	"http://127.0.0.1:3000",
}

const defaultAllowedMethods = "GET,POST,PUT,PATCH,DELETE,OPTIONS"
const defaultAllowedHeaders = "Authorization,Content-Type"

func CORS(next http.Handler) http.Handler {
	allowedOrigins := buildAllowedOrigins()

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := strings.TrimSpace(r.Header.Get("Origin"))
		if origin == "" {
			next.ServeHTTP(w, r)
			return
		}

		if isAllowedOrigin(origin, allowedOrigins) {
			w.Header().Set("Access-Control-Allow-Origin", origin)
			w.Header().Set("Access-Control-Allow-Methods", defaultAllowedMethods)
			w.Header().Set("Access-Control-Allow-Headers", defaultAllowedHeaders)
			w.Header().Set("Vary", "Origin")
			w.Header().Add("Vary", "Access-Control-Request-Method")
			w.Header().Add("Vary", "Access-Control-Request-Headers")
		}

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func buildAllowedOrigins() map[string]struct{} {
	allowedOrigins := make(map[string]struct{}, len(defaultAllowedOrigins))
	for _, origin := range defaultAllowedOrigins {
		allowedOrigins[origin] = struct{}{}
	}

	for _, origin := range strings.Split(os.Getenv("CORS_ALLOWED_ORIGINS"), ",") {
		trimmed := strings.TrimSpace(origin)
		if trimmed == "" {
			continue
		}

		allowedOrigins[trimmed] = struct{}{}
	}

	return allowedOrigins
}

func isAllowedOrigin(origin string, allowedOrigins map[string]struct{}) bool {
	_, ok := allowedOrigins[origin]
	return ok
}
