package contract_test

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/akash/pet_slay/apps/api/tests/testutil"
)

func TestReadinessAllowsOptionalDatabaseDuringEarlyStage(t *testing.T) {
	t.Setenv("DATABASE_URL", "")
	t.Setenv("DATABASE_REQUIRED", "false")

	handler := testutil.NewHandler()
	req := httptest.NewRequest(http.MethodGet, "/health/ready", nil)
	rec := httptest.NewRecorder()

	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d body=%s", rec.Code, rec.Body.String())
	}

	var payload map[string]any
	if err := json.Unmarshal(rec.Body.Bytes(), &payload); err != nil {
		t.Fatalf("decode response: %v", err)
	}

	if payload["databaseConfigured"] != false {
		t.Fatalf("expected databaseConfigured=false, got %v", payload["databaseConfigured"])
	}
}

func TestReadinessFailsWhenRequiredDatabaseIsMissing(t *testing.T) {
	t.Setenv("DATABASE_URL", "")
	t.Setenv("DATABASE_REQUIRED", "true")

	handler := testutil.NewHandler()
	req := httptest.NewRequest(http.MethodGet, "/health/ready", nil)
	rec := httptest.NewRecorder()

	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusServiceUnavailable {
		t.Fatalf("expected 503, got %d body=%s", rec.Code, rec.Body.String())
	}
}

