package auth

import "errors"

var (
	ErrMissingAuthorization = errors.New("missing authorization header")
	ErrInvalidAuthorization = errors.New("invalid authorization header")
	ErrInvalidToken         = errors.New("invalid token")
	ErrForbidden            = errors.New("forbidden")
)
