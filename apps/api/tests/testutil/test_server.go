package testutil

import (
	"bytes"
	"io"
	"net/http"

	"github.com/akash/pet_slay/apps/api/internal/httpserver"
)

func NewHandler() http.Handler {
	return httpserver.New()
}

func NewRequest(method, path string) (*http.Request, error) {
	return http.NewRequest(method, path, nil)
}

func NewJSONRequest(method, path string, body []byte) (*http.Request, error) {
	return http.NewRequest(method, path, bytes.NewReader(body))
}

func JSONBody(raw string) io.Reader {
	return bytes.NewBufferString(raw)
}
