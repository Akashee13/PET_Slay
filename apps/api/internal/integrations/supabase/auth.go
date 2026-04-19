package supabase

import (
	"errors"

	"github.com/akash/pet_slay/apps/api/internal/auth"
)

var ErrNotImplemented = errors.New("supabase auth verification not implemented yet")

func (c *Client) VerifyAccessToken(token string) (*auth.Session, error) {
	if token == "" {
		return nil, auth.ErrInvalidToken
	}

	return nil, ErrNotImplemented
}
