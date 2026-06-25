package app

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
)

func (worker *Worker) updateMedia(ctx context.Context, mediaID string, payload completionRequest) error {
	body, err := json.Marshal(payload)
	if err != nil {
		return err
	}

	endpoint := strings.TrimRight(worker.config.MediaServiceURL, "/") + "/media/" + mediaID + "/processing"
	request, err := http.NewRequestWithContext(ctx, http.MethodPatch, endpoint, bytes.NewReader(body))
	if err != nil {
		return err
	}
	request.Header.Set("content-type", "application/json")
	request.Header.Set("x-internal-service-secret", worker.config.InternalSecret)

	response, err := worker.httpClient.Do(request)
	if err != nil {
		return err
	}
	defer response.Body.Close()

	if response.StatusCode < 200 || response.StatusCode >= 300 {
		responseBody, _ := io.ReadAll(io.LimitReader(response.Body, 4096))
		return fmt.Errorf("media-service returned %d: %s", response.StatusCode, strings.TrimSpace(string(responseBody)))
	}

	return nil
}
