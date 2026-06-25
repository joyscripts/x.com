package app

import (
	"os"
	"strconv"
	"strings"
	"time"
)

func loadConfig() Config {
	return Config{
		RabbitMQURL:                     envString("RABBITMQ_URL", "amqp://guest:guest@localhost:5672"),
		MediaEventsExchange:             envString("MEDIA_EVENTS_EXCHANGE", "media.events"),
		MediaEventsQueue:                envString("MEDIA_EVENTS_QUEUE", "media-worker.processing"),
		MediaEventsBindings:             envList("MEDIA_EVENTS_BINDINGS", []string{"media.uploaded"}),
		MediaEventsRetryExchange:        envString("MEDIA_EVENTS_RETRY_EXCHANGE", "media.events.retry"),
		MediaEventsRetryQueue:           envString("MEDIA_EVENTS_RETRY_QUEUE", "media-worker.processing.retry"),
		MediaEventsRetryRoutingKey:      envString("MEDIA_EVENTS_RETRY_ROUTING_KEY", "media.uploaded.retry"),
		MediaEventsDeadLetterExchange:   envString("MEDIA_EVENTS_DEAD_LETTER_EXCHANGE", "media.events.dlx"),
		MediaEventsDeadLetterQueue:      envString("MEDIA_EVENTS_DEAD_LETTER_QUEUE", "media-worker.processing.dlq"),
		MediaEventsDeadLetterRoutingKey: envString("MEDIA_EVENTS_DEAD_LETTER_ROUTING_KEY", "media.uploaded.dead"),
		MaxProcessingRetries:            envInt("MEDIA_PROCESSING_MAX_RETRIES", 3),
		ProcessingRetryDelay:            time.Duration(envInt("MEDIA_PROCESSING_RETRY_DELAY_MS", 30000)) * time.Millisecond,
		S3Endpoint:                      envString("S3_ENDPOINT", "http://localhost:9000"),
		S3UseSSL:                        envBool("S3_USE_SSL", false),
		S3AccessKey:                     envString("S3_ACCESS_KEY", "minio"),
		S3SecretKey:                     envString("S3_SECRET_KEY", "minio123"),
		S3Bucket:                        envString("S3_BUCKET", "x-clone-dev"),
		MediaServiceURL:                 envString("MEDIA_SERVICE_URL", "http://localhost:4009"),
		InternalSecret:                  envString("INTERNAL_SERVICE_SECRET", "dev-internal-service-secret"),
		FFmpegPath:                      envString("FFMPEG_PATH", "ffmpeg"),
		FFprobePath:                     envString("FFPROBE_PATH", "ffprobe"),
	}
}

func envString(key string, fallback string) string {
	value := strings.TrimSpace(os.Getenv(key))
	if value == "" {
		return fallback
	}
	return value
}

func envBool(key string, fallback bool) bool {
	value := strings.TrimSpace(os.Getenv(key))
	if value == "" {
		return fallback
	}
	parsed, err := strconv.ParseBool(value)
	if err != nil {
		return fallback
	}
	return parsed
}

func envInt(key string, fallback int) int {
	value := strings.TrimSpace(os.Getenv(key))
	if value == "" {
		return fallback
	}
	parsed, err := strconv.Atoi(value)
	if err != nil {
		return fallback
	}
	return parsed
}

func envList(key string, fallback []string) []string {
	value := strings.TrimSpace(os.Getenv(key))
	if value == "" {
		return fallback
	}

	parts := strings.Split(value, ",")
	output := make([]string, 0, len(parts))
	for _, part := range parts {
		part = strings.TrimSpace(part)
		if part != "" {
			output = append(output, part)
		}
	}

	if len(output) == 0 {
		return fallback
	}

	return output
}
