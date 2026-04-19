package auth

import (
	"net/http"
	"strings"

	httpresponse "github.com/akash/pet_slay/apps/api/internal/http/response"
)

func RequireAuth(verifier Verifier) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			session, err := authenticateRequest(r, verifier)
			if err != nil {
				httpresponse.Error(w, http.StatusUnauthorized, err.Error())
				return
			}

			next.ServeHTTP(w, r.WithContext(WithSession(r.Context(), session)))
		})
	}
}

func RequireRole(verifier Verifier, role Role) func(http.Handler) http.Handler {
	authenticate := RequireAuth(verifier)

	return func(next http.Handler) http.Handler {
		return authenticate(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			session, ok := SessionFromContext(r.Context())
			if !ok || session.Role != role {
				httpresponse.Error(w, http.StatusForbidden, ErrForbidden.Error())
				return
			}

			next.ServeHTTP(w, r)
		}))
	}
}

func authenticateRequest(r *http.Request, verifier Verifier) (*Session, error) {
	authorization := strings.TrimSpace(r.Header.Get("Authorization"))
	if authorization == "" {
		return nil, ErrMissingAuthorization
	}

	parts := strings.SplitN(authorization, " ", 2)
	if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
		return nil, ErrInvalidAuthorization
	}

	return verifier.VerifyBearerToken(strings.TrimSpace(parts[1]))
}
