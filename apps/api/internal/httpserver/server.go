package httpserver

import (
	"context"
	"net/http"
	"strings"
	"time"

	"github.com/akash/pet_slay/apps/api/internal/auth"
	"github.com/akash/pet_slay/apps/api/internal/catalog"
	"github.com/akash/pet_slay/apps/api/internal/config"
	"github.com/akash/pet_slay/apps/api/internal/http/middleware"
	httpresponse "github.com/akash/pet_slay/apps/api/internal/http/response"
	"github.com/akash/pet_slay/apps/api/internal/notifications"
	"github.com/akash/pet_slay/apps/api/internal/orders"
	"github.com/akash/pet_slay/apps/api/internal/refunds"
	"github.com/akash/pet_slay/apps/api/internal/store"
	"github.com/akash/pet_slay/apps/api/internal/users"
)

type healthResponse struct {
	Status  string `json:"status"`
	Service string `json:"service"`
	Env     string `json:"env"`
}

type readinessResponse struct {
	Status             string `json:"status"`
	Service            string `json:"service"`
	Env                string `json:"env"`
	DatabaseConfigured bool   `json:"databaseConfigured"`
	DatabaseRequired   bool   `json:"databaseRequired"`
}

func New() http.Handler {
	cfg := config.Load()
	dbStore, _ := store.Open(context.Background(), store.Config{
		DatabaseURL:      cfg.DatabaseURL,
		DatabaseRequired: cfg.DatabaseRequired,
	})
	verifier := auth.NewStaticVerifier()
	var preferenceStore users.BuyerProfileStore = users.NewPreferenceStore()
	if dbStore.Configured() {
		preferenceStore = users.NewPostgresBuyerProfileStore(dbStore.DB)
	}
	catalogService := catalog.NewService()
	if dbStore.Configured() {
		catalogService = catalog.NewServiceWithRepository(catalog.NewPostgresRepository(dbStore.DB))
	}
	orderService := orders.NewService(catalogService)
	if dbStore.Configured() {
		orderService = orders.NewServiceWithRepository(catalogService, orders.NewPostgresRepository(dbStore.DB))
	}
	notificationService := notifications.NewService()
	deviceTokenService := notifications.NewDeviceTokenService()
	if dbStore.Configured() {
		notificationService = notifications.NewServiceWithRepository(notifications.NewPostgresRepository(dbStore.DB))
		deviceTokenService = notifications.NewDeviceTokenServiceWithRepository(notifications.NewPostgresRepository(dbStore.DB))
	}
	refundService := refunds.NewService()
	if dbStore.Configured() {
		refundService = refunds.NewServiceWithRepository(refunds.NewPostgresRepository(dbStore.DB))
	}
	mux := http.NewServeMux()

	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		httpresponse.JSON(w, http.StatusOK, healthResponse{
			Status:  "ok",
			Service: "pet-slay-api",
			Env:     cfg.AppEnv,
		})
	})
	mux.HandleFunc("/health/ready", func(w http.ResponseWriter, r *http.Request) {
		databaseConfigured := dbStore.Configured()
		status := "ready"
		httpStatus := http.StatusOK

		if cfg.DatabaseRequired {
			ctx, cancel := context.WithTimeout(r.Context(), 2*time.Second)
			defer cancel()

			if !databaseConfigured || dbStore.Ping(ctx) != nil {
				status = "not_ready"
				httpStatus = http.StatusServiceUnavailable
			}
		}

		httpresponse.JSON(w, httpStatus, readinessResponse{
			Status:             status,
			Service:            "pet-slay-api",
			Env:                cfg.AppEnv,
			DatabaseConfigured: databaseConfigured,
			DatabaseRequired:   cfg.DatabaseRequired,
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
		switch r.Method {
		case http.MethodPost:
			orders.CreateHandler(orderService).ServeHTTP(w, r)
		case http.MethodGet:
			orders.ListHandler(orderService).ServeHTTP(w, r)
		default:
			httpresponse.Error(w, http.StatusMethodNotAllowed, "method_not_allowed")
		}
	})))
	mux.Handle("/v1/orders/", auth.RequireRole(verifier, auth.RoleBuyer)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			httpresponse.Error(w, http.StatusMethodNotAllowed, "method_not_allowed")
			return
		}

		if strings.HasSuffix(r.URL.Path, "/refunds") {
			refunds.BuyerListByOrderHandler(refundService).ServeHTTP(w, r)
			return
		}

		orders.DetailHandler(orderService).ServeHTTP(w, r)
	})))
	mux.Handle("/v1/buyers/device-tokens", auth.RequireRole(verifier, auth.RoleBuyer)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			httpresponse.Error(w, http.StatusMethodNotAllowed, "method_not_allowed")
			return
		}

		notifications.RegisterDeviceTokenHandler(deviceTokenService).ServeHTTP(w, r)
	})))
	mux.Handle("/v1/admin/products", auth.RequireRole(verifier, auth.RoleAdmin)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			catalog.AdminListHandler(catalogService).ServeHTTP(w, r)
		case http.MethodPost:
			catalog.AdminCreateHandler(catalogService).ServeHTTP(w, r)
		default:
			httpresponse.Error(w, http.StatusMethodNotAllowed, "method_not_allowed")
		}
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
	mux.Handle("/v1/admin/orders/", auth.RequireRole(verifier, auth.RoleAdmin)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPatch {
			httpresponse.Error(w, http.StatusMethodNotAllowed, "method_not_allowed")
			return
		}

		orders.AdminUpdateStatusHandler(orderService).ServeHTTP(w, r)
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
	handler = middleware.CORS(handler)

	return handler
}
