package app

import (
	"net/http"
	"time"
)

type Worker struct {
	config     Config
	httpClient *http.Client
}

type Config struct {
	RabbitMQURL                     string
	MediaEventsExchange             string
	MediaEventsQueue                string
	MediaEventsBindings             []string
	MediaEventsRetryExchange        string
	MediaEventsRetryQueue           string
	MediaEventsRetryRoutingKey      string
	MediaEventsDeadLetterExchange   string
	MediaEventsDeadLetterQueue      string
	MediaEventsDeadLetterRoutingKey string
	MaxProcessingRetries            int
	ProcessingRetryDelay            time.Duration
	S3Endpoint                      string
	S3UseSSL                        bool
	S3AccessKey                     string
	S3SecretKey                     string
	S3Bucket                        string
	MediaServiceURL                 string
	InternalSecret                  string
	FFmpegPath                      string
	FFprobePath                     string
}

type mediaUploadedEvent struct {
	EventID    string `json:"eventId"`
	Type       string `json:"type"`
	MediaID    string `json:"mediaId"`
	OwnerID    string `json:"ownerId"`
	MediaType  string `json:"mediaType"`
	MimeType   string `json:"mimeType"`
	SizeBytes  int64  `json:"sizeBytes"`
	StorageKey string `json:"storageKey"`
	OccurredAt string `json:"occurredAt"`
}

type processedVariant struct {
	VariantType string `json:"variantType"`
	MimeType    string `json:"mimeType"`
	SizeBytes   int64  `json:"sizeBytes"`
	Width       *int   `json:"width,omitempty"`
	Height      *int   `json:"height,omitempty"`
	DurationMs  *int   `json:"durationMs,omitempty"`
	StorageKey  string `json:"storageKey"`
	URL         string `json:"url"`
}

type completionRequest struct {
	Status        string             `json:"status"`
	Width         *int               `json:"width,omitempty"`
	Height        *int               `json:"height,omitempty"`
	DurationMs    *int               `json:"durationMs,omitempty"`
	FailureReason *string            `json:"failureReason,omitempty"`
	Variants      []processedVariant `json:"variants,omitempty"`
}

type mediaOutput struct {
	Width      *int
	Height     *int
	DurationMs *int
	Variants   []processedVariant
}

type videoMetadata struct {
	Width      int
	Height     int
	DurationMs int
}
