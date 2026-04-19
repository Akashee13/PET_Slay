package supabase

import "errors"

var ErrSupabaseNotConfigured = errors.New("supabase is not configured")

type Config struct {
	URL            string
	AnonKey        string
	ServiceRoleKey string
}

type Client struct {
	config Config
}

func New(config Config) (*Client, error) {
	if config.URL == "" {
		return nil, ErrSupabaseNotConfigured
	}

	return &Client{config: config}, nil
}

func (c *Client) Config() Config {
	return c.config
}
