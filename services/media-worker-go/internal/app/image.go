package app

import (
	"bytes"
	"context"
	"fmt"
	"image"
	"image/color"
	"image/jpeg"
	_ "image/png"
	"os"

	xdraw "golang.org/x/image/draw"
	_ "golang.org/x/image/webp"

	"github.com/minio/minio-go/v7"
)

func (worker *Worker) processImage(ctx context.Context, minioClient *minio.Client, event mediaUploadedEvent, originalPath string) (mediaOutput, error) {
	file, err := os.Open(originalPath)
	if err != nil {
		return mediaOutput{}, err
	}
	config, _, err := image.DecodeConfig(file)
	_ = file.Close()
	if err != nil {
		return mediaOutput{}, fmt.Errorf("decode image config: %w", err)
	}

	file, err = os.Open(originalPath)
	if err != nil {
		return mediaOutput{}, err
	}
	src, _, err := image.Decode(file)
	_ = file.Close()
	if err != nil {
		return mediaOutput{}, fmt.Errorf("decode image: %w", err)
	}

	large, err := worker.encodeImageVariant(src, 1600)
	if err != nil {
		return mediaOutput{}, err
	}
	thumbnail, err := worker.encodeImageVariant(src, 320)
	if err != nil {
		return mediaOutput{}, err
	}

	largeKey := variantStorageKey(event, "large.jpg")
	thumbnailKey := variantStorageKey(event, "thumbnail.jpg")

	largeSize, err := worker.uploadBuffer(ctx, minioClient, largeKey, "image/jpeg", large)
	if err != nil {
		return mediaOutput{}, err
	}
	thumbnailSize, err := worker.uploadBuffer(ctx, minioClient, thumbnailKey, "image/jpeg", thumbnail)
	if err != nil {
		return mediaOutput{}, err
	}

	largeWidth, largeHeight := fitWithin(config.Width, config.Height, 1600)
	thumbWidth, thumbHeight := fitWithin(config.Width, config.Height, 320)

	return mediaOutput{
		Width:  intPtr(config.Width),
		Height: intPtr(config.Height),
		Variants: []processedVariant{
			{
				VariantType: "image_large",
				MimeType:    "image/jpeg",
				SizeBytes:   largeSize,
				Width:       intPtr(largeWidth),
				Height:      intPtr(largeHeight),
				StorageKey:  largeKey,
				URL:         variantURL(event.MediaID, "image_large"),
			},
			{
				VariantType: "image_thumbnail",
				MimeType:    "image/jpeg",
				SizeBytes:   thumbnailSize,
				Width:       intPtr(thumbWidth),
				Height:      intPtr(thumbHeight),
				StorageKey:  thumbnailKey,
				URL:         variantURL(event.MediaID, "image_thumbnail"),
			},
		},
	}, nil
}

func (worker *Worker) encodeImageVariant(src image.Image, maxDimension int) (*bytes.Buffer, error) {
	width, height := fitWithin(src.Bounds().Dx(), src.Bounds().Dy(), maxDimension)
	dst := image.NewRGBA(image.Rect(0, 0, width, height))
	xdraw.Draw(dst, dst.Bounds(), &image.Uniform{C: color.White}, image.Point{}, xdraw.Src)
	xdraw.CatmullRom.Scale(dst, dst.Bounds(), src, src.Bounds(), xdraw.Over, nil)

	var buffer bytes.Buffer
	if err := jpeg.Encode(&buffer, dst, &jpeg.Options{Quality: 85}); err != nil {
		return nil, err
	}

	return &buffer, nil
}
