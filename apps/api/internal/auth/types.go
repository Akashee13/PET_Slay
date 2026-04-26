package auth

type Role string

const (
	RoleBuyer Role = "buyer"
	RoleAdmin Role = "admin"
)

type Session struct {
	UserID      string
	Role        Role
	Email       string
	DisplayName string
	AvatarURL   string
}

type Verifier interface {
	VerifyBearerToken(token string) (*Session, error)
}
