package supabase

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/akash/pet_slay/apps/api/internal/auth"
)

func TestVerifyAccessTokenReturnsBuyerSessionFromSupabaseUser(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Header.Get("Authorization") != "Bearer valid-token" {
			w.WriteHeader(http.StatusUnauthorized)
			return
		}
		if r.Header.Get("apikey") != "anon-key" {
			w.WriteHeader(http.StatusUnauthorized)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"id":"supabase-user-001","email":"buyer@example.com"}`))
	}))
	defer server.Close()

	client, err := New(Config{
		URL:     server.URL,
		AnonKey: "anon-key",
	})
	if err != nil {
		t.Fatalf("expected client: %v", err)
	}

	session, err := client.VerifyAccessToken("valid-token")
	if err != nil {
		t.Fatalf("expected token to verify: %v", err)
	}
	if session.Role != auth.RoleBuyer {
		t.Fatalf("expected buyer role, got %s", session.Role)
	}
	if session.UserID != "supabase-user-001" {
		t.Fatalf("expected supabase-user-001, got %s", session.UserID)
	}
}

func TestVerifyAccessTokenRejectsInvalidToken(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusUnauthorized)
	}))
	defer server.Close()

	client, err := New(Config{
		URL:     server.URL,
		AnonKey: "anon-key",
	})
	if err != nil {
		t.Fatalf("expected client: %v", err)
	}

	if _, err := client.VerifyAccessToken("bad-token"); err != auth.ErrInvalidToken {
		t.Fatalf("expected invalid token, got %v", err)
	}
}
