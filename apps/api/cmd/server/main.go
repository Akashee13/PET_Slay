package main

import (
	"log"
	"net/http"
	"os"

	"github.com/akash/pet_slay/apps/api/internal/httpserver"
)

func main() {
	addr := os.Getenv("PORT")
	if addr == "" {
		addr = "8080"
	}

	server := httpserver.New()

	log.Printf("api listening on :%s", addr)
	if err := http.ListenAndServe(":"+addr, server); err != nil {
		log.Fatalf("server failed: %v", err)
	}
}
