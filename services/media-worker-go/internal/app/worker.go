package app

import (
	"net/http"
	"time"
)

func New() *Worker {
	return &Worker{
		config:     loadConfig(),
		httpClient: &http.Client{Timeout: 30 * time.Second},
	}
}
