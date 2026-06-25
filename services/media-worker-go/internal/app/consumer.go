package app

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/minio/minio-go/v7"
	amqp "github.com/rabbitmq/amqp091-go"
)

func (worker *Worker) Run() error {
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	minioClient, err := worker.newMinioClient()
	if err != nil {
		return err
	}

	connection, err := amqp.Dial(worker.config.RabbitMQURL)
	if err != nil {
		return fmt.Errorf("connect rabbitmq: %w", err)
	}
	defer connection.Close()

	channel, err := connection.Channel()
	if err != nil {
		return fmt.Errorf("open rabbitmq channel: %w", err)
	}
	defer channel.Close()

	if err := worker.configureMessaging(channel); err != nil {
		return err
	}

	if err := channel.Qos(1, 0, false); err != nil {
		return fmt.Errorf("set qos: %w", err)
	}

	deliveries, err := channel.Consume(worker.config.MediaEventsQueue, "media-worker-go", false, false, false, false, nil)
	if err != nil {
		return fmt.Errorf("consume queue: %w", err)
	}

	log.Printf(
		"media worker consuming queue=%s exchange=%s max_retries=%d retry_delay=%s",
		worker.config.MediaEventsQueue,
		worker.config.MediaEventsExchange,
		worker.config.MaxProcessingRetries,
		worker.config.ProcessingRetryDelay,
	)

	for {
		select {
		case <-ctx.Done():
			return nil
		case delivery, ok := <-deliveries:
			if !ok {
				return errors.New("rabbitmq delivery channel closed")
			}

			worker.handleDelivery(ctx, channel, minioClient, delivery)
		}
	}
}

func (worker *Worker) handleDelivery(ctx context.Context, channel *amqp.Channel, minioClient *minio.Client, delivery amqp.Delivery) {
	var event mediaUploadedEvent
	if err := json.Unmarshal(delivery.Body, &event); err != nil {
		reason := trimFailureReason(err.Error())
		log.Printf("dead-lettering invalid media event error=%v", err)
		if publishErr := worker.publishDeadLetter(ctx, channel, delivery, "invalid_media_event", reason, 0); publishErr != nil {
			log.Printf("failed to publish invalid media event to dlq: %v", publishErr)
			_ = delivery.Nack(false, true)
			return
		}
		_ = delivery.Ack(false)
		return
	}

	jobCtx, cancel := context.WithTimeout(ctx, 15*time.Minute)
	err := worker.processEvent(jobCtx, minioClient, event)
	cancel()

	if err == nil {
		_ = delivery.Ack(false)
		return
	}

	reason := trimFailureReason(err.Error())
	retryCount := retryCountFromHeaders(delivery.Headers)
	if retryCount < worker.config.MaxProcessingRetries {
		nextRetryCount := retryCount + 1
		log.Printf("media processing retry media_id=%s attempt=%d error=%v", event.MediaID, nextRetryCount, err)
		if publishErr := worker.publishRetry(ctx, channel, delivery, reason, nextRetryCount); publishErr != nil {
			log.Printf("failed to publish retry media_id=%s error=%v", event.MediaID, publishErr)
			_ = delivery.Nack(false, true)
			return
		}
		_ = delivery.Ack(false)
		return
	}

	log.Printf("media processing exhausted retries media_id=%s retries=%d error=%v", event.MediaID, retryCount, err)
	if failErr := worker.markMediaFailed(ctx, event.MediaID, reason); failErr != nil {
		log.Printf("failed to mark media failed media_id=%s error=%v", event.MediaID, failErr)
		reason = trimFailureReason(fmt.Sprintf("%s; failed to persist failure: %v", reason, failErr))
	}

	if publishErr := worker.publishDeadLetter(ctx, channel, delivery, "processing_failed", reason, retryCount); publishErr != nil {
		log.Printf("failed to publish media event to dlq media_id=%s error=%v", event.MediaID, publishErr)
		_ = delivery.Nack(false, true)
		return
	}

	_ = delivery.Ack(false)
}
