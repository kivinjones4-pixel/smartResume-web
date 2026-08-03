package embedding

import "testing"

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
