package app

import (
	"context"
	"fmt"

	"github.com/minio/minio-go/v7"
)

func (worker *Worker) processEvent(ctx context.Context, minioClient *minio.Client, event mediaUploadedEvent) error {
	if event.Type != "media.uploaded" {
		return nil
	}

	if err := worker.updateMedia(ctx, event.MediaID, completionRequest{Status: "processing"}); err != nil {
		return err
	}

	output, err := worker.processMedia(ctx, minioClient, event)
	if err != nil {
		return err
	}

	return worker.updateMedia(ctx, event.MediaID, completionRequest{
		Status:     "processed",
		Width:      output.Width,
		Height:     output.Height,
		DurationMs: output.DurationMs,
		Variants:   output.Variants,
	})
}

func (worker *Worker) markMediaFailed(ctx context.Context, mediaID string, failureReason string) error {
	return worker.updateMedia(ctx, mediaID, completionRequest{
		Status:        "failed",
		FailureReason: &failureReason,
	})
}

func (worker *Worker) processMedia(ctx context.Context, minioClient *minio.Client, event mediaUploadedEvent) (mediaOutput, error) {
	originalPath, cleanup, err := worker.downloadOriginal(ctx, minioClient, event)
	if err != nil {
		return mediaOutput{}, err
	}
	defer cleanup()

	switch event.MediaType {
	case "image":
		return worker.processImage(ctx, minioClient, event, originalPath)
	case "video":
		return worker.processVideo(ctx, minioClient, event, originalPath)
	default:
		return mediaOutput{}, fmt.Errorf("unsupported media type: %s", event.MediaType)
	}
}
