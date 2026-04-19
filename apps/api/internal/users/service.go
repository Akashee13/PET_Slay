package users

import (
	"errors"

	"github.com/akash/pet_slay/apps/api/internal/auth"
)

var ErrNoSession = errors.New("no session in context")

type CurrentUser struct {
	ID    string    `json:"id"`
	Role  auth.Role `json:"role"`
	Email string    `json:"email"`
	PreferredLanguage string `json:"preferredLanguage"`
	BusinessName string `json:"businessName,omitempty"`
}

func Current(session *auth.Session) (*CurrentUser, error) {
	if session == nil {
		return nil, ErrNoSession
	}

	return &CurrentUser{
		ID:    session.UserID,
		Role:  session.Role,
		Email: session.Email,
		PreferredLanguage: "english",
	}, nil
}
