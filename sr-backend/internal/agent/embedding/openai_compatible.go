package embedding

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"sort"
	"strings"
	"time"

	"sr-backend/internal/config"
)

type OpenAICompatibleClient struct {
	httpClient *http.Client
	endpoint   string
	apiKey     string
	model      string
	dimensions int
}

// embeddingBatchSize is compatible with providers that cap one request at 10 inputs.
// Callers can still submit any number of inputs; Embed preserves their original order.
const embeddingBatchSize = 10

type embeddingRequest struct {
	Model      string   `json:"model"`
	Input      []string `json:"input"`
	Dimensions int      `json:"dimensions,omitempty"`
}

type embeddingResponse struct {
	Data []struct {
		Index     int       `json:"index"`
		Embedding []float32 `json:"embedding"`
	} `json:"data"`
	Error *struct {
		Message string `json:"message"`
		Type    string `json:"type"`
	} `json:"error,omitempty"`
}

// NewOpenAICompatibleClient 创建OpenAI兼容客户端，校验参数并初始化。
func NewOpenAICompatibleClient(cfg config.AIProviderConfig, dimensions, timeoutSeconds int) (*OpenAICompatibleClient, error) {
	endpoint, err := embeddingEndpoint(cfg.BaseURL)
	if err != nil {
		return nil, err
	}
	if dimensions <= 0 {
		return nil, fmt.Errorf("embedding dimensions must be greater than zero")
	}
	return &OpenAICompatibleClient{
		httpClient: &http.Client{Timeout: time.Duration(timeoutSeconds) * time.Second},
		endpoint:   endpoint,
		apiKey:     strings.TrimSpace(cfg.APIKey),
		model:      strings.TrimSpace(cfg.Model),
		dimensions: dimensions,
	}, nil
}

// Embed 批量获取文本向量，自动分批处理，空输入报错。
func (c *OpenAICompatibleClient) Embed(ctx context.Context, inputs []string) ([][]float32, error) {
	if len(inputs) == 0 {
		return nil, fmt.Errorf("embedding inputs cannot be empty")
	}
	for _, input := range inputs {
		if strings.TrimSpace(input) == "" {
			return nil, fmt.Errorf("embedding input cannot be blank")
		}
	}

	vectors := make([][]float32, 0, len(inputs))
	for start := 0; start < len(inputs); start += embeddingBatchSize {
		end := min(start+embeddingBatchSize, len(inputs))
		batchVectors, err := c.embedBatch(ctx, inputs[start:end])
		if err != nil {
			return nil, fmt.Errorf("embed input batch %d-%d: %w", start+1, end, err)
		}
		vectors = append(vectors, batchVectors...)
	}
	return vectors, nil
}

// embedBatch 批量获取文本嵌入向量。发送请求至OpenAI兼容API，校验响应状态及向量维度，并按索引排序返回。出错时返回错误。
func (c *OpenAICompatibleClient) embedBatch(ctx context.Context, inputs []string) ([][]float32, error) {

	payload, err := json.Marshal(embeddingRequest{
		Model:      c.model,
		Input:      inputs,
		Dimensions: c.dimensions,
	})
	if err != nil {
		return nil, fmt.Errorf("encode embedding request: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, c.endpoint, bytes.NewReader(payload))
	if err != nil {
		return nil, fmt.Errorf("create embedding request: %w", err)
	}
	req.Header.Set("Authorization", "Bearer "+c.apiKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("request embedding service: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(io.LimitReader(resp.Body, 4<<20))
	if err != nil {
		return nil, fmt.Errorf("read embedding response: %w", err)
	}

	var decoded embeddingResponse
	if err := json.Unmarshal(body, &decoded); err != nil {
		return nil, fmt.Errorf("decode embedding response (status %d): %w", resp.StatusCode, err)
	}
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		message := strings.TrimSpace(http.StatusText(resp.StatusCode))
		if decoded.Error != nil && strings.TrimSpace(decoded.Error.Message) != "" {
			message = strings.TrimSpace(decoded.Error.Message)
		}
		return nil, fmt.Errorf("embedding service returned status %d: %s", resp.StatusCode, message)
	}
	if len(decoded.Data) != len(inputs) {
		return nil, fmt.Errorf("embedding service returned %d vectors for %d inputs", len(decoded.Data), len(inputs))
	}

	sort.Slice(decoded.Data, func(i, j int) bool { return decoded.Data[i].Index < decoded.Data[j].Index })
	vectors := make([][]float32, len(decoded.Data))
	for i, item := range decoded.Data {
		if len(item.Embedding) != c.dimensions {
			return nil, fmt.Errorf("embedding vector %d has dimension %d, expected %d", i, len(item.Embedding), c.dimensions)
		}
		vectors[i] = item.Embedding
	}
	return vectors, nil
}

// embeddingEndpoint 规范化嵌入接口地址，确保以/embeddings结尾。
func embeddingEndpoint(baseURL string) (string, error) {
	raw := strings.TrimSpace(baseURL)
	if raw == "" {
		return "", fmt.Errorf("embedding base URL cannot be empty")
	}
	parsed, err := url.Parse(raw)
	if err != nil || parsed.Scheme == "" || parsed.Host == "" {
		return "", fmt.Errorf("invalid embedding base URL %q", raw)
	}
	parsed.RawQuery = ""
	parsed.Fragment = ""
	parsed.Path = strings.TrimRight(parsed.Path, "/")
	if !strings.HasSuffix(parsed.Path, "/embeddings") {
		parsed.Path += "/embeddings"
	}
	return parsed.String(), nil
}
