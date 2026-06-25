package app

import (
	"context"
	"fmt"
	"time"

	amqp "github.com/rabbitmq/amqp091-go"
)

const (
	retryCountHeader  = "x-media-worker-retry-count"
	failureCodeHeader = "x-media-worker-failure-code"
	failureHeader     = "x-media-worker-failure-reason"
	failedAtHeader    = "x-media-worker-failed-at"
)

func (worker *Worker) configureMessaging(channel *amqp.Channel) error {
	if err := channel.ExchangeDeclare(worker.config.MediaEventsExchange, "topic", true, false, false, false, nil); err != nil {
		return fmt.Errorf("declare exchange: %w", err)
	}

	if _, err := channel.QueueDeclare(worker.config.MediaEventsQueue, true, false, false, false, nil); err != nil {
		return fmt.Errorf("declare queue: %w", err)
	}

	for _, binding := range worker.config.MediaEventsBindings {
		if err := channel.QueueBind(worker.config.MediaEventsQueue, binding, worker.config.MediaEventsExchange, false, nil); err != nil {
			return fmt.Errorf("bind queue %q: %w", binding, err)
		}
	}

	if err := channel.ExchangeDeclare(worker.config.MediaEventsRetryExchange, "direct", true, false, false, false, nil); err != nil {
		return fmt.Errorf("declare retry exchange: %w", err)
	}

	retryArgs := amqp.Table{
		"x-message-ttl":             int32(worker.config.ProcessingRetryDelay / time.Millisecond),
		"x-dead-letter-exchange":    worker.config.MediaEventsExchange,
		"x-dead-letter-routing-key": worker.defaultMediaRoutingKey(),
	}
	if _, err := channel.QueueDeclare(worker.config.MediaEventsRetryQueue, true, false, false, false, retryArgs); err != nil {
		return fmt.Errorf("declare retry queue: %w", err)
	}

	if err := channel.QueueBind(worker.config.MediaEventsRetryQueue, worker.config.MediaEventsRetryRoutingKey, worker.config.MediaEventsRetryExchange, false, nil); err != nil {
		return fmt.Errorf("bind retry queue: %w", err)
	}

	if err := channel.ExchangeDeclare(worker.config.MediaEventsDeadLetterExchange, "direct", true, false, false, false, nil); err != nil {
		return fmt.Errorf("declare dead-letter exchange: %w", err)
	}

	if _, err := channel.QueueDeclare(worker.config.MediaEventsDeadLetterQueue, true, false, false, false, nil); err != nil {
		return fmt.Errorf("declare dead-letter queue: %w", err)
	}

	if err := channel.QueueBind(worker.config.MediaEventsDeadLetterQueue, worker.config.MediaEventsDeadLetterRoutingKey, worker.config.MediaEventsDeadLetterExchange, false, nil); err != nil {
		return fmt.Errorf("bind dead-letter queue: %w", err)
	}

	return nil
}

func (worker *Worker) publishRetry(ctx context.Context, channel *amqp.Channel, delivery amqp.Delivery, failureReason string, retryCount int) error {
	headers := cloneHeaders(delivery.Headers)
	headers[retryCountHeader] = int32(retryCount)
	headers[failureHeader] = failureReason

	return channel.PublishWithContext(
		ctx,
		worker.config.MediaEventsRetryExchange,
		worker.config.MediaEventsRetryRoutingKey,
		false,
		false,
		amqp.Publishing{
			ContentType:  delivery.ContentType,
			DeliveryMode: amqp.Persistent,
			MessageId:    delivery.MessageId,
			Timestamp:    time.Now().UTC(),
			Headers:      headers,
			Body:         delivery.Body,
		},
	)
}

func (worker *Worker) publishDeadLetter(ctx context.Context, channel *amqp.Channel, delivery amqp.Delivery, failureCode string, failureReason string, retryCount int) error {
	headers := cloneHeaders(delivery.Headers)
	headers[retryCountHeader] = int32(retryCount)
	headers[failureCodeHeader] = failureCode
	headers[failureHeader] = failureReason
	headers[failedAtHeader] = time.Now().UTC().Format(time.RFC3339Nano)

	return channel.PublishWithContext(
		ctx,
		worker.config.MediaEventsDeadLetterExchange,
		worker.config.MediaEventsDeadLetterRoutingKey,
		false,
		false,
		amqp.Publishing{
			ContentType:  delivery.ContentType,
			DeliveryMode: amqp.Persistent,
			MessageId:    delivery.MessageId,
			Timestamp:    time.Now().UTC(),
			Headers:      headers,
			Body:         delivery.Body,
		},
	)
}

func (worker *Worker) defaultMediaRoutingKey() string {
	if len(worker.config.MediaEventsBindings) == 0 {
		return "media.uploaded"
	}
	return worker.config.MediaEventsBindings[0]
}

func retryCountFromHeaders(headers amqp.Table) int {
	value, ok := headers[retryCountHeader]
	if !ok {
		return 0
	}

	switch typed := value.(type) {
	case int:
		return typed
	case int8:
		return int(typed)
	case int16:
		return int(typed)
	case int32:
		return int(typed)
	case int64:
		return int(typed)
	case uint8:
		return int(typed)
	case uint16:
		return int(typed)
	case uint32:
		return int(typed)
	case uint64:
		return int(typed)
	default:
		return 0
	}
}

func cloneHeaders(headers amqp.Table) amqp.Table {
	output := amqp.Table{}
	for key, value := range headers {
		output[key] = value
	}
	return output
}
