package users

import (
	"context"
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
	DisplayName       string    `json:"displayName,omitempty"`
	BusinessName      string    `json:"businessName,omitempty"`
	Phone             string    `json:"phone,omitempty"`
	Region            string    `json:"region,omitempty"`
	AvatarURL         string    `json:"avatarUrl,omitempty"`
}

type BuyerProfileStore interface {
	GetProfile(ctx context.Context, session *auth.Session) (*BuyerProfile, error)
	SetLanguage(ctx context.Context, session *auth.Session, language string) (*BuyerProfile, error)
	UpdateProfile(ctx context.Context, session *auth.Session, input UpdateBuyerProfileInput) (*BuyerProfile, error)
}

type UpdateBuyerProfileInput struct {
	DisplayName  string `json:"displayName,omitempty"`
	BusinessName string `json:"businessName,omitempty"`
	Phone        string `json:"phone,omitempty"`
	Region       string `json:"region,omitempty"`
	AvatarURL    string `json:"avatarUrl,omitempty"`
}

type PreferenceStore struct {
	profiles sync.Map
}

func NewPreferenceStore() *PreferenceStore {
	return &PreferenceStore{}
}

func deriveDisplayName(session *auth.Session) string {
	if session == nil {
		return ""
	}
	if session.DisplayName != "" {
		return session.DisplayName
	}
	if session.Email != "" {
		for index, char := range session.Email {
			if char == '@' {
				if index > 0 {
					return session.Email[:index]
				}
				break
			}
		}
	}

	return ""
}

func defaultBuyerProfile(session *auth.Session) *BuyerProfile {
	profile := &BuyerProfile{
		ID:                session.UserID,
		Role:              session.Role,
		Email:             session.Email,
		PreferredLanguage: "english",
		DisplayName:       deriveDisplayName(session),
		AvatarURL:         session.AvatarURL,
	}

	if session.Role == auth.RoleBuyer {
		profile.BusinessName = "PET_Slay Demo Reseller"
	}

	return profile
}

func (s *PreferenceStore) GetProfile(_ context.Context, session *auth.Session) (*BuyerProfile, error) {
	profile := defaultBuyerProfile(session)
	if value, ok := s.profiles.Load(session.UserID); ok {
		if saved, valid := value.(*BuyerProfile); valid && saved != nil {
			copy := *saved
			if copy.Email == "" {
				copy.Email = session.Email
			}
			if copy.DisplayName == "" {
				copy.DisplayName = deriveDisplayName(session)
			}
			if copy.AvatarURL == "" {
				copy.AvatarURL = session.AvatarURL
			}
			return &copy, nil
		}
	}

	return profile, nil
}

func (s *PreferenceStore) SetLanguage(ctx context.Context, session *auth.Session, language string) (*BuyerProfile, error) {
	profile, err := s.GetProfile(ctx, session)
	if err != nil {
		return nil, err
	}
	profile.PreferredLanguage = language
	s.profiles.Store(session.UserID, profile)
	return profile, nil
}

func (s *PreferenceStore) UpdateProfile(ctx context.Context, session *auth.Session, input UpdateBuyerProfileInput) (*BuyerProfile, error) {
	profile, err := s.GetProfile(ctx, session)
	if err != nil {
		return nil, err
	}
	if input.DisplayName != "" {
		profile.DisplayName = input.DisplayName
	}
	if input.BusinessName != "" {
		profile.BusinessName = input.BusinessName
	}
	if input.Phone != "" {
		profile.Phone = input.Phone
	}
	if input.Region != "" {
		profile.Region = input.Region
	}
	if input.AvatarURL != "" {
		profile.AvatarURL = input.AvatarURL
	}
	s.profiles.Store(session.UserID, profile)
	return profile, nil
}

func BuyerProfileFromSession(ctx context.Context, session *auth.Session, store BuyerProfileStore) (*BuyerProfile, error) {
	if session == nil {
		return nil, ErrNoSession
	}

	return store.GetProfile(ctx, session)
}

func CurrentBuyerHandler(store BuyerProfileStore) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		session, ok := auth.SessionFromContext(r.Context())
		if !ok {
			httpresponse.Error(w, http.StatusUnauthorized, auth.ErrInvalidToken.Error())
			return
		}

		profile, err := BuyerProfileFromSession(r.Context(), session, store)
		if err != nil {
			httpresponse.Error(w, http.StatusUnauthorized, err.Error())
			return
		}

		httpresponse.JSON(w, http.StatusOK, profile)
	}
}

func UpdateLanguageHandler(store BuyerProfileStore) http.HandlerFunc {
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

		profile, err := store.SetLanguage(r.Context(), session, payload.PreferredLanguage)
		if err != nil {
			httpresponse.Error(w, http.StatusInternalServerError, "language_preference_not_saved")
			return
		}

		httpresponse.JSON(w, http.StatusOK, profile)
	}
}

func UpdateBuyerProfileHandler(store BuyerProfileStore) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		session, ok := auth.SessionFromContext(r.Context())
		if !ok {
			httpresponse.Error(w, http.StatusUnauthorized, auth.ErrInvalidToken.Error())
			return
		}

		var payload UpdateBuyerProfileInput
		if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
			httpresponse.Error(w, http.StatusBadRequest, "invalid_json")
			return
		}

		profile, err := store.UpdateProfile(r.Context(), session, payload)
		if err != nil {
			httpresponse.Error(w, http.StatusInternalServerError, "buyer_profile_not_saved")
			return
		}

		httpresponse.JSON(w, http.StatusOK, profile)
	}
}
