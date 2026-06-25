package app

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"os/exec"
	"strconv"
	"strings"

	"github.com/minio/minio-go/v7"
)

func (worker *Worker) processVideo(ctx context.Context, minioClient *minio.Client, event mediaUploadedEvent, originalPath string) (mediaOutput, error) {
	metadata, err := worker.probeVideo(ctx, originalPath)
	if err != nil {
		return mediaOutput{}, err
	}

	posterPath := tempPath("poster-*.jpg")
	defer os.Remove(posterPath)
	mp4Path := tempPath("transcoded-*.mp4")
	defer os.Remove(mp4Path)

	posterWidth := scaledWidth(metadata.Width, 640)
	if err := worker.runCommand(ctx, worker.config.FFmpegPath, "-y", "-ss", "1", "-i", originalPath, "-frames:v", "1", "-vf", fmt.Sprintf("scale=%d:-2", posterWidth), posterPath); err != nil {
		return mediaOutput{}, fmt.Errorf("generate video poster: %w", err)
	}

	mp4Width := scaledWidth(metadata.Width, 1280)
	if err := worker.runCommand(ctx, worker.config.FFmpegPath, "-y", "-i", originalPath, "-map", "0:v:0", "-map", "0:a?", "-vf", fmt.Sprintf("scale=%d:-2", mp4Width), "-c:v", "libx264", "-preset", "veryfast", "-crf", "23", "-c:a", "aac", "-movflags", "+faststart", mp4Path); err != nil {
		return mediaOutput{}, fmt.Errorf("transcode video mp4: %w", err)
	}

	posterKey := variantStorageKey(event, "poster.jpg")
	mp4Key := variantStorageKey(event, "video.mp4")

	posterSize, err := worker.uploadFile(ctx, minioClient, posterKey, "image/jpeg", posterPath)
	if err != nil {
		return mediaOutput{}, err
	}
	mp4Size, err := worker.uploadFile(ctx, minioClient, mp4Key, "video/mp4", mp4Path)
	if err != nil {
		return mediaOutput{}, err
	}

	return mediaOutput{
		Width:      intPtr(metadata.Width),
		Height:     intPtr(metadata.Height),
		DurationMs: intPtr(metadata.DurationMs),
		Variants: []processedVariant{
			{
				VariantType: "video_poster",
				MimeType:    "image/jpeg",
				SizeBytes:   posterSize,
				Width:       intPtr(posterWidth),
				StorageKey:  posterKey,
				URL:         variantURL(event.MediaID, "video_poster"),
			},
			{
				VariantType: "video_mp4",
				MimeType:    "video/mp4",
				SizeBytes:   mp4Size,
				Width:       intPtr(mp4Width),
				DurationMs:  intPtr(metadata.DurationMs),
				StorageKey:  mp4Key,
				URL:         variantURL(event.MediaID, "video_mp4"),
			},
		},
	}, nil
}

func (worker *Worker) probeVideo(ctx context.Context, inputPath string) (videoMetadata, error) {
	output, err := exec.CommandContext(ctx, worker.config.FFprobePath, "-v", "error", "-print_format", "json", "-show_streams", "-show_format", inputPath).CombinedOutput()
	if err != nil {
		return videoMetadata{}, fmt.Errorf("ffprobe: %w: %s", err, strings.TrimSpace(string(output)))
	}

	var result struct {
		Streams []struct {
			CodecType string `json:"codec_type"`
			Width     int    `json:"width"`
			Height    int    `json:"height"`
		} `json:"streams"`
		Format struct {
			Duration string `json:"duration"`
		} `json:"format"`
	}
	if err := json.Unmarshal(output, &result); err != nil {
		return videoMetadata{}, err
	}

	metadata := videoMetadata{}
	for _, stream := range result.Streams {
		if stream.CodecType == "video" {
			metadata.Width = stream.Width
			metadata.Height = stream.Height
			break
		}
	}

	if result.Format.Duration != "" {
		durationSeconds, _ := strconv.ParseFloat(result.Format.Duration, 64)
		metadata.DurationMs = int(durationSeconds * 1000)
	}

	if metadata.Width <= 0 || metadata.Height <= 0 {
		return videoMetadata{}, errors.New("video dimensions were not detected")
	}

	if metadata.DurationMs <= 0 {
		return videoMetadata{}, errors.New("video duration was not detected")
	}

	return metadata, nil
}

func (worker *Worker) runCommand(ctx context.Context, name string, args ...string) error {
	command := exec.CommandContext(ctx, name, args...)
	output, err := command.CombinedOutput()
	if err != nil {
		return fmt.Errorf("%w: %s", err, strings.TrimSpace(string(output)))
	}
	return nil
}
