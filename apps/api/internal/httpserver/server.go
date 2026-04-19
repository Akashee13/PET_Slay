package httpserver

import (
	"net/http"

	"github.com/akash/pet_slay/apps/api/internal/auth"
	"github.com/akash/pet_slay/apps/api/internal/catalog"
	"github.com/akash/pet_slay/apps/api/internal/config"
	"github.com/akash/pet_slay/apps/api/internal/http/middleware"
	httpresponse "github.com/akash/pet_slay/apps/api/internal/http/response"
	"github.com/akash/pet_slay/apps/api/internal/notifications"
	"github.com/akash/pet_slay/apps/api/internal/orders"
	"github.com/akash/pet_slay/apps/api/internal/refunds"
	"github.com/akash/pet_slay/apps/api/internal/users"
)

type healthResponse struct {
	Status  string `json:"status"`
	Service string `json:"service"`
	Env     string `json:"env"`
}

func New() http.Handler {
	cfg := config.Load()
	verifier := auth.NewStaticVerifier()
	preferenceStore := users.NewPreferenceStore()
	catalogService := catalog.NewService()
	orderService := orders.NewService(catalogService)
	notificationService := notifications.NewService()
	refundService := refunds.NewService()
	mux := http.NewServeMux()

	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		httpresponse.JSON(w, http.StatusOK, healthResponse{
			Status:  "ok",
			Service: "pet-slay-api",
			Env:     cfg.AppEnv,
		})
	})

	mux.Handle("/v1/me", auth.RequireAuth(verifier)(users.CurrentBuyerHandler(preferenceStore)))
	mux.Handle("/v1/buyers/preferences/language", auth.RequireRole(verifier, auth.RoleBuyer)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPut {
			httpresponse.Error(w, http.StatusMethodNotAllowed, "method_not_allowed")
			return
		}

		users.UpdateLanguageHandler(preferenceStore).ServeHTTP(w, r)
	})))
	mux.Handle("/v1/catalog/products", auth.RequireRole(verifier, auth.RoleBuyer)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			httpresponse.Error(w, http.StatusMethodNotAllowed, "method_not_allowed")
			return
		}

		catalog.ListHandler(catalogService).ServeHTTP(w, r)
	})))
	mux.Handle("/v1/catalog/products/", auth.RequireRole(verifier, auth.RoleBuyer)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			httpresponse.Error(w, http.StatusMethodNotAllowed, "method_not_allowed")
			return
		}

		catalog.DetailHandler(catalogService).ServeHTTP(w, r)
	})))
	mux.Handle("/v1/orders", auth.RequireRole(verifier, auth.RoleBuyer)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			httpresponse.Error(w, http.StatusMethodNotAllowed, "method_not_allowed")
			return
		}

		orders.CreateHandler(orderService).ServeHTTP(w, r)
	})))
	mux.Handle("/v1/orders/", auth.RequireRole(verifier, auth.RoleBuyer)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			httpresponse.Error(w, http.StatusMethodNotAllowed, "method_not_allowed")
			return
		}

		orders.DetailHandler(orderService).ServeHTTP(w, r)
	})))
	mux.Handle("/v1/buyers/device-tokens", auth.RequireRole(verifier, auth.RoleBuyer)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			httpresponse.Error(w, http.StatusMethodNotAllowed, "method_not_allowed")
			return
		}

		notifications.RegisterDeviceTokenHandler(notificationService).ServeHTTP(w, r)
	})))
	mux.Handle("/v1/admin/products", auth.RequireRole(verifier, auth.RoleAdmin)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			httpresponse.Error(w, http.StatusMethodNotAllowed, "method_not_allowed")
			return
		}

		catalog.AdminCreateHandler(catalogService).ServeHTTP(w, r)
	})))
	mux.Handle("/v1/admin/products/", auth.RequireRole(verifier, auth.RoleAdmin)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPatch {
			httpresponse.Error(w, http.StatusMethodNotAllowed, "method_not_allowed")
			return
		}

		catalog.AdminUpdateHandler(catalogService).ServeHTTP(w, r)
	})))
	mux.Handle("/v1/admin/orders", auth.RequireRole(verifier, auth.RoleAdmin)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			httpresponse.Error(w, http.StatusMethodNotAllowed, "method_not_allowed")
			return
		}

		orders.AdminListHandler(orderService).ServeHTTP(w, r)
	})))
	mux.Handle("/v1/admin/notification-campaigns", auth.RequireRole(verifier, auth.RoleAdmin)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			httpresponse.Error(w, http.StatusMethodNotAllowed, "method_not_allowed")
			return
		}

		notifications.CreateCampaignHandler(notificationService).ServeHTTP(w, r)
	})))
	mux.Handle("/v1/admin/notification-campaigns/", auth.RequireRole(verifier, auth.RoleAdmin)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			httpresponse.Error(w, http.StatusMethodNotAllowed, "method_not_allowed")
			return
		}

		notifications.SendCampaignHandler(notificationService).ServeHTTP(w, r)
	})))
	mux.Handle("/v1/admin/refunds/", auth.RequireRole(verifier, auth.RoleAdmin)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPatch {
			httpresponse.Error(w, http.StatusMethodNotAllowed, "method_not_allowed")
			return
		}

		refunds.UpdateDecisionHandler(refundService).ServeHTTP(w, r)
	})))

	handler := middleware.Recoverer(mux)
	handler = middleware.RequestLogger(handler)

	return handler
}
