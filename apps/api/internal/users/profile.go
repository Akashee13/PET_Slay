package users

import (
	"encoding/json"
	"net/http"
	"sync"

	"github.com/akash/pet_slay/apps/api/internal/auth"
	httpresponse "github.com/akash/pet_slay/apps/api/internal/http/response"
)

type BuyerProfile struct {
	ID                string    `json:"id"`
	Role              auth.Role `json:"role"`
	Email             string    `json:"email"`
	PreferredLanguage string    `json:"preferredLanguage"`
	BusinessName      string    `json:"businessName,omitempty"`
}

type PreferenceStore struct {
	languages sync.Map
}

func NewPreferenceStore() *PreferenceStore {
	return &PreferenceStore{}
}

func (s *PreferenceStore) GetLanguage(userID string) string {
	if value, ok := s.languages.Load(userID); ok {
		if language, valid := value.(string); valid {
			return language
		}
	}

	return "english"
}

func (s *PreferenceStore) SetLanguage(userID, language string) {
	s.languages.Store(userID, language)
}

func BuyerProfileFromSession(session *auth.Session, store *PreferenceStore) (*BuyerProfile, error) {
	if session == nil {
		return nil, ErrNoSession
	}

	profile := &BuyerProfile{
		ID:                session.UserID,
		Role:              session.Role,
		Email:             session.Email,
		PreferredLanguage: store.GetLanguage(session.UserID),
	}

	if session.Role == auth.RoleBuyer {
		profile.BusinessName = "PET_Slay Demo Reseller"
	}

	return profile, nil
}

func CurrentBuyerHandler(store *PreferenceStore) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		session, ok := auth.SessionFromContext(r.Context())
		if !ok {
			httpresponse.Error(w, http.StatusUnauthorized, auth.ErrInvalidToken.Error())
			return
		}

		profile, err := BuyerProfileFromSession(session, store)
		if err != nil {
			httpresponse.Error(w, http.StatusUnauthorized, err.Error())
			return
		}

		httpresponse.JSON(w, http.StatusOK, profile)
	}
}

func UpdateLanguageHandler(store *PreferenceStore) http.HandlerFunc {
	type updateLanguageRequest struct {
		PreferredLanguage string `json:"preferredLanguage"`
	}

	return func(w http.ResponseWriter, r *http.Request) {
		session, ok := auth.SessionFromContext(r.Context())
		if !ok {
			httpresponse.Error(w, http.StatusUnauthorized, auth.ErrInvalidToken.Error())
			return
		}

		var payload updateLanguageRequest
		if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
			httpresponse.Error(w, http.StatusBadRequest, "invalid_json")
			return
		}

		switch payload.PreferredLanguage {
		case "english", "hindi", "hinglish":
		default:
			httpresponse.Error(w, http.StatusBadRequest, "invalid_language")
			return
		}

		store.SetLanguage(session.UserID, payload.PreferredLanguage)

		profile, err := BuyerProfileFromSession(session, store)
		if err != nil {
			httpresponse.Error(w, http.StatusUnauthorized, err.Error())
			return
		}

		httpresponse.JSON(w, http.StatusOK, profile)
	}
}
