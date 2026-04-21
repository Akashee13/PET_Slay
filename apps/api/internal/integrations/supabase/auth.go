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
		ID    string `json:"id"`
		Email string `json:"email"`
	}
	if err := json.NewDecoder(response.Body).Decode(&payload); err != nil {
		return nil, auth.ErrInvalidToken
	}
	if payload.ID == "" {
		return nil, auth.ErrInvalidToken
	}

	return &auth.Session{
		UserID: payload.ID,
		Role:   auth.RoleBuyer,
		Email:  payload.Email,
	}, nil
}
