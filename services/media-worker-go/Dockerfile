FROM golang:1.25-alpine

WORKDIR /app

RUN apk add --no-cache ca-certificates ffmpeg

COPY services/media-worker-go ./

RUN go build -o media-worker ./cmd/worker

CMD ["./media-worker"]
