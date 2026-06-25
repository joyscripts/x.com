package app

import (
	"fmt"
	"mime"
	"os"
	"path"
	"strings"
)

func fitWithin(width int, height int, maxDimension int) (int, int) {
	if width <= maxDimension && height <= maxDimension {
		return width, height
	}

	scale := float64(maxDimension) / float64(width)
	if height > width {
		scale = float64(maxDimension) / float64(height)
	}

	return max(1, int(float64(width)*scale)), max(1, int(float64(height)*scale))
}

func scaledWidth(width int, maxWidth int) int {
	if width <= 0 {
		return maxWidth
	}
	return min(width, maxWidth)
}

func tempPath(pattern string) string {
	file, err := os.CreateTemp("", pattern)
	if err != nil {
		return path.Join(os.TempDir(), strings.ReplaceAll(pattern, "*", "file"))
	}
	name := file.Name()
	_ = file.Close()
	_ = os.Remove(name)
	return name
}

func variantStorageKey(event mediaUploadedEvent, filename string) string {
	return fmt.Sprintf("%s/%s/%s", event.OwnerID, event.MediaID, filename)
}

func variantURL(mediaID string, variantType string) string {
	return fmt.Sprintf("/media/%s/variants/%s/file", mediaID, variantType)
}

func intPtr(value int) *int {
	return &value
}

func trimFailureReason(reason string) string {
	reason = strings.TrimSpace(reason)
	if len(reason) <= 500 {
		return reason
	}
	return reason[:500]
}

func init() {
	for _, extension := range []string{".jpg", ".jpeg"} {
		_ = mime.AddExtensionType(extension, "image/jpeg")
	}
}
