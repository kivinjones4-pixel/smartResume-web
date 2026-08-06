package embedding

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"sync"
	"testing"
)

type roundTripFunc func(*http.Request) (*http.Response, error)

func (fn roundTripFunc) RoundTrip(request *http.Request) (*http.Response, error) {
	return fn(request)
}

func TestEmbeddingEndpoint(t *testing.T) {
	tests := []struct {
		name     string
		baseURL  string
		expected string
	}{
		{name: "version base", baseURL: "https://example.com/v1", expected: "https://example.com/v1/embeddings"},
		{name: "full endpoint", baseURL: "https://example.com/v1/embeddings", expected: "https://example.com/v1/embeddings"},
		{name: "trailing slash", baseURL: "https://example.com/v1/", expected: "https://example.com/v1/embeddings"},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			actual, err := embeddingEndpoint(test.baseURL)
			if err != nil {
				t.Fatalf("embeddingEndpoint() error = %v", err)
			}
			if actual != test.expected {
				t.Fatalf("embeddingEndpoint() = %q, expected %q", actual, test.expected)
			}
		})
	}
}

func TestEmbeddingEndpointRejectsInvalidURL(t *testing.T) {
	if _, err := embeddingEndpoint("not-a-url"); err == nil {
		t.Fatal("embeddingEndpoint() expected an error")
	}
}

func TestEmbedSplitsInputsIntoProviderCompatibleBatches(t *testing.T) {
	var mu sync.Mutex
	batchSizes := make([]int, 0)
	transport := roundTripFunc(func(r *http.Request) (*http.Response, error) {
		var request embeddingRequest
		if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
			return nil, err
		}
		if len(request.Input) > embeddingBatchSize {
			return &http.Response{StatusCode: http.StatusBadRequest, Body: io.NopCloser(strings.NewReader(`{"error":{"message":"batch too large"}}`))}, nil
		}
		mu.Lock()
		batchSizes = append(batchSizes, len(request.Input))
		mu.Unlock()

		response := embeddingResponse{}
		response.Data = make([]struct {
			Index     int       `json:"index"`
			Embedding []float32 `json:"embedding"`
		}, len(request.Input))
		for index, input := range request.Input {
			var originalIndex int
			if _, err := fmt.Sscanf(input, "input-%d", &originalIndex); err != nil {
				return nil, err
			}
			response.Data[index].Index = index
			response.Data[index].Embedding = []float32{float32(originalIndex), 1}
		}
		var body strings.Builder
		if err := json.NewEncoder(&body).Encode(response); err != nil {
			return nil, err
		}
		return &http.Response{StatusCode: http.StatusOK, Body: io.NopCloser(strings.NewReader(body.String()))}, nil
	})

	client := &OpenAICompatibleClient{
		httpClient: &http.Client{Transport: transport},
		endpoint:   "https://embedding.test/embeddings",
		apiKey:     "test",
		model:      "test-model",
		dimensions: 2,
	}
	inputs := make([]string, 23)
	for index := range inputs {
		inputs[index] = fmt.Sprintf("input-%d", index)
	}
	vectors, err := client.Embed(context.Background(), inputs)
	if err != nil {
		t.Fatal(err)
	}
	if fmt.Sprint(batchSizes) != "[10 10 3]" {
		t.Fatalf("unexpected batch sizes: %v", batchSizes)
	}
	if len(vectors) != len(inputs) {
		t.Fatalf("got %d vectors, want %d", len(vectors), len(inputs))
	}
	for index, vector := range vectors {
		if vector[0] != float32(index) {
			t.Fatalf("vector %d is out of order: %v", index, vector)
		}
	}
}
