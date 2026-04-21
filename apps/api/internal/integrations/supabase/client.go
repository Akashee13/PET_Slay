package supabase

import (
	"errors"
	"net/http"
)

var ErrSupabaseNotConfigured = errors.New("supabase is not configured")

type Config struct {
	URL            string
	AnonKey        string
	ServiceRoleKey string
}

type Client struct {
	config Config
	httpClient *http.Client
}

func New(config Config) (*Client, error) {
	if config.URL == "" {
		return nil, ErrSupabaseNotConfigured
	}

	return &Client{config: config, httpClient: http.DefaultClient}, nil
}

func (c *Client) Config() Config {
	return c.config
}

func (c *Client) SetHTTPClient(client *http.Client) {
	if client != nil {
		c.httpClient = client
	}
}
