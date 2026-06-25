package app

import (
	"bytes"
	"context"
	"io"
	"net/url"
	"os"
	"path"

	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
)

func (worker *Worker) newMinioClient() (*minio.Client, error) {
	endpoint, useSSL, err := normalizeS3Endpoint(worker.config.S3Endpoint, worker.config.S3UseSSL)
	if err != nil {
		return nil, err
	}

	return minio.New(endpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(worker.config.S3AccessKey, worker.config.S3SecretKey, ""),
		Secure: useSSL,
	})
}

func (worker *Worker) downloadOriginal(ctx context.Context, minioClient *minio.Client, event mediaUploadedEvent) (string, func(), error) {
	extension := path.Ext(event.StorageKey)
	file, err := os.CreateTemp("", "media-original-*"+extension)
	if err != nil {
		return "", nil, err
	}
	defer file.Close()

	object, err := minioClient.GetObject(ctx, worker.config.S3Bucket, event.StorageKey, minio.GetObjectOptions{})
	if err != nil {
		_ = os.Remove(file.Name())
		return "", nil, err
	}
	defer object.Close()

	if _, err := io.Copy(file, object); err != nil {
		_ = os.Remove(file.Name())
		return "", nil, err
	}

	return file.Name(), func() { _ = os.Remove(file.Name()) }, nil
}

func (worker *Worker) uploadBuffer(ctx context.Context, minioClient *minio.Client, key string, contentType string, buffer *bytes.Buffer) (int64, error) {
	reader := bytes.NewReader(buffer.Bytes())
	info, err := minioClient.PutObject(ctx, worker.config.S3Bucket, key, reader, int64(reader.Len()), minio.PutObjectOptions{ContentType: contentType})
	if err != nil {
		return 0, err
	}

	return info.Size, nil
}

func (worker *Worker) uploadFile(ctx context.Context, minioClient *minio.Client, key string, contentType string, filePath string) (int64, error) {
	info, err := minioClient.FPutObject(ctx, worker.config.S3Bucket, key, filePath, minio.PutObjectOptions{ContentType: contentType})
	if err != nil {
		return 0, err
	}

	return info.Size, nil
}

func normalizeS3Endpoint(rawEndpoint string, defaultSSL bool) (string, bool, error) {
	parsed, err := url.Parse(rawEndpoint)
	if err != nil {
		return "", false, err
	}

	if parsed.Scheme == "" {
		return rawEndpoint, defaultSSL, nil
	}

	return parsed.Host, parsed.Scheme == "https", nil
}
