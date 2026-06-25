package app

import (
	"testing"

	amqp "github.com/rabbitmq/amqp091-go"
)

func TestRetryCountFromHeaders(t *testing.T) {
	tests := []struct {
		name     string
		headers  amqp.Table
		expected int
	}{
		{
			name:     "missing header",
			headers:  amqp.Table{},
			expected: 0,
		},
		{
			name: "int32 header",
			headers: amqp.Table{
				retryCountHeader: int32(2),
			},
			expected: 2,
		},
		{
			name: "int64 header",
			headers: amqp.Table{
				retryCountHeader: int64(3),
			},
			expected: 3,
		},
		{
			name: "unsupported header",
			headers: amqp.Table{
				retryCountHeader: "3",
			},
			expected: 0,
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			actual := retryCountFromHeaders(test.headers)
			if actual != test.expected {
				t.Fatalf("retryCountFromHeaders() = %d, want %d", actual, test.expected)
			}
		})
	}
}

func TestCloneHeadersDoesNotMutateOriginal(t *testing.T) {
	headers := amqp.Table{"existing": "value"}
	cloned := cloneHeaders(headers)

	cloned[retryCountHeader] = int32(1)

	if _, ok := headers[retryCountHeader]; ok {
		t.Fatal("cloneHeaders mutated the original table")
	}
}
