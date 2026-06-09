FROM golang:1.24-alpine

WORKDIR /app

COPY services/media-worker-go ./

RUN go build -o media-worker ./cmd/worker

CMD ["./media-worker"]
