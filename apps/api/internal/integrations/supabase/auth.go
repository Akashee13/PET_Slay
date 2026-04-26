package supabase

import (
	"encoding/json"
	"net/http"
	"strings"

	"github.com/akash/pet_slay/apps/api/internal/auth"
)

func (c *Client) VerifyAccessToken(token string) (*auth.Session, error) {
	if token == "" {
		return nil, auth.ErrInvalidToken
	}

	if c.config.URL == "" || c.config.AnonKey == "" {
		return nil, auth.ErrInvalidToken
	}

	req, err := http.NewRequest(http.MethodGet, strings.TrimRight(c.config.URL, "/")+"/auth/v1/user", nil)
	if err != nil {
		return nil, auth.ErrInvalidToken
	}

	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("apikey", c.config.AnonKey)

	response, err := c.httpClient.Do(req)
	if err != nil {
		return nil, auth.ErrInvalidToken
	}
	defer response.Body.Close()

	if response.StatusCode != http.StatusOK {
		return nil, auth.ErrInvalidToken
	}

	var payload struct {
		ID           string `json:"id"`
		Email        string `json:"email"`
		UserMetadata struct {
			Name              string `json:"name"`
			FullName          string `json:"full_name"`
			GivenName         string `json:"given_name"`
			FamilyName        string `json:"family_name"`
			PreferredUsername string `json:"preferred_username"`
			AvatarURL         string `json:"avatar_url"`
			Picture           string `json:"picture"`
		} `json:"user_metadata"`
		Identities []struct {
			IdentityData struct {
				Name              string `json:"name"`
				FullName          string `json:"full_name"`
				GivenName         string `json:"given_name"`
				FamilyName        string `json:"family_name"`
				PreferredUsername string `json:"preferred_username"`
				AvatarURL         string `json:"avatar_url"`
				Picture           string `json:"picture"`
			} `json:"identity_data"`
		} `json:"identities"`
	}
	if err := json.NewDecoder(response.Body).Decode(&payload); err != nil {
		return nil, auth.ErrInvalidToken
	}
	if payload.ID == "" {
		return nil, auth.ErrInvalidToken
	}

	identity := firstIdentity(payload.Identities)
	fullName := joinNameParts(
		firstNonEmpty(payload.UserMetadata.FullName, identity.FullName),
		firstNonEmpty(payload.UserMetadata.GivenName, identity.GivenName),
		firstNonEmpty(payload.UserMetadata.FamilyName, identity.FamilyName),
	)

	return &auth.Session{
		UserID:      payload.ID,
		Role:        auth.RoleBuyer,
		Email:       payload.Email,
		DisplayName: firstNonEmpty(
			fullName,
			payload.UserMetadata.Name,
			identity.Name,
			payload.UserMetadata.PreferredUsername,
			identity.PreferredUsername,
		),
		AvatarURL: firstNonEmpty(
			payload.UserMetadata.AvatarURL,
			payload.UserMetadata.Picture,
			identity.AvatarURL,
			identity.Picture,
		),
	}, nil
}

func firstNonEmpty(values ...string) string {
	for _, value := range values {
		if strings.TrimSpace(value) != "" {
			return strings.TrimSpace(value)
		}
	}

	return ""
}

type identityData struct {
	Name              string
	FullName          string
	GivenName         string
	FamilyName        string
	PreferredUsername string
	AvatarURL         string
	Picture           string
}

func firstIdentity(values []struct {
	IdentityData struct {
		Name              string `json:"name"`
		FullName          string `json:"full_name"`
		GivenName         string `json:"given_name"`
		FamilyName        string `json:"family_name"`
		PreferredUsername string `json:"preferred_username"`
		AvatarURL         string `json:"avatar_url"`
		Picture           string `json:"picture"`
	} `json:"identity_data"`
}) identityData {
	if len(values) == 0 {
		return identityData{}
	}

	return identityData{
		Name:              values[0].IdentityData.Name,
		FullName:          values[0].IdentityData.FullName,
		GivenName:         values[0].IdentityData.GivenName,
		FamilyName:        values[0].IdentityData.FamilyName,
		PreferredUsername: values[0].IdentityData.PreferredUsername,
		AvatarURL:         values[0].IdentityData.AvatarURL,
		Picture:           values[0].IdentityData.Picture,
	}
}

func joinNameParts(fullName, givenName, familyName string) string {
	if strings.TrimSpace(fullName) != "" {
		return strings.TrimSpace(fullName)
	}

	combined := strings.TrimSpace(strings.TrimSpace(givenName) + " " + strings.TrimSpace(familyName))
	return strings.TrimSpace(combined)
}
