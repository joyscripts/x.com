package main

import (
	"log"

	"github.com/joyscripts/x-clone/services/media-worker-go/internal/app"
)

func main() {
	worker := app.New()

	if err := worker.Run(); err != nil {
		log.Fatalf("media worker failed: %v", err)
	}
}
