# Media Worker (Go)

CPU-heavy media work runs here instead of inside the Node media API.

The media-service stores the original upload, records the `media_assets` row, and publishes a `media.uploaded` event. This worker consumes that event, downloads the original from MinIO, processes it, uploads derived variants, and calls media-service to update processing state.

## Current processing

- Images: detects dimensions, generates `image_large` and `image_thumbnail` JPEG variants.
- Videos: extracts dimensions and duration with `ffprobe`, generates a `video_poster` JPEG, and transcodes a `video_mp4` playback variant with `ffmpeg`.
- Failures: retries with a delayed RabbitMQ retry queue, then records `failed`
  status and sends the original event to a dead-letter queue with failure
  headers.

## Important env vars

- `RABBITMQ_URL`
- `MEDIA_EVENTS_EXCHANGE`
- `MEDIA_EVENTS_QUEUE`
- `MEDIA_EVENTS_BINDINGS`
- `MEDIA_EVENTS_RETRY_EXCHANGE`
- `MEDIA_EVENTS_RETRY_QUEUE`
- `MEDIA_EVENTS_RETRY_ROUTING_KEY`
- `MEDIA_EVENTS_DEAD_LETTER_EXCHANGE`
- `MEDIA_EVENTS_DEAD_LETTER_QUEUE`
- `MEDIA_EVENTS_DEAD_LETTER_ROUTING_KEY`
- `MEDIA_PROCESSING_MAX_RETRIES`
- `MEDIA_PROCESSING_RETRY_DELAY_MS`
- `S3_ENDPOINT`
- `S3_ACCESS_KEY`
- `S3_SECRET_KEY`
- `S3_BUCKET`
- `MEDIA_SERVICE_URL`
- `INTERNAL_SERVICE_SECRET`
- `FFMPEG_PATH`
- `FFPROBE_PATH`
