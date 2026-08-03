package chat

import (
	"bufio"
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"

	"sr-backend/internal/config"
)

type OpenAICompatibleClient struct {
	httpClient *http.Client
	endpoint   string
	apiKey     string
	model      string
}

type completionRequest struct {
	Model       string    `json:"model"`
	Messages    []Message `json:"messages"`
	Temperature float64   `json:"temperature"`
	Stream      bool      `json:"stream,omitempty"`
}

type streamChunk struct {
	Choices []struct {
		Delta struct {
			Content string `json:"content"`
		} `json:"delta"`
	} `json:"choices"`
	Error *struct {
		Message string `json:"message"`
	} `json:"error,omitempty"`
}

type completionResponse struct {
	Choices []struct {
		Message Message `json:"message"`
	} `json:"choices"`
	Error *struct {
		Message string `json:"message"`
	} `json:"error,omitempty"`
}

func NewOpenAICompatibleClient(cfg config.AIProviderConfig, timeoutSeconds int) (*OpenAICompatibleClient, error) {
	endpoint, err := completionEndpoint(cfg.BaseURL)
	if err != nil {
		return nil, err
	}
	return &OpenAICompatibleClient{
		httpClient: &http.Client{Timeout: time.Duration(timeoutSeconds) * time.Second},
		endpoint:   endpoint,
		apiKey:     strings.TrimSpace(cfg.APIKey),
		model:      strings.TrimSpace(cfg.Model),
	}, nil
}

// Complete 发送消息并返回回复内容。
func (c *OpenAICompatibleClient) Complete(ctx context.Context, messages []Message) (string, error) {
	payload, err := json.Marshal(completionRequest{Model: c.model, Messages: messages, Temperature: 0.3})
	if err != nil {
		return "", fmt.Errorf("encode chat request: %w", err)
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, c.endpoint, bytes.NewReader(payload))
	if err != nil {
		return "", fmt.Errorf("create chat request: %w", err)
	}
	req.Header.Set("Authorization", "Bearer "+c.apiKey)
	req.Header.Set("Content-Type", "application/json")
	resp, err := c.httpClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("request chat service: %w", err)
	}
	defer resp.Body.Close()
	body, err := io.ReadAll(io.LimitReader(resp.Body, 4<<20))
	if err != nil {
		return "", fmt.Errorf("read chat response: %w", err)
	}
	var decoded completionResponse
	if err := json.Unmarshal(body, &decoded); err != nil {
		return "", fmt.Errorf("decode chat response (status %d): %w", resp.StatusCode, err)
	}
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		message := http.StatusText(resp.StatusCode)
		if decoded.Error != nil && strings.TrimSpace(decoded.Error.Message) != "" {
			message = decoded.Error.Message
		}
		return "", fmt.Errorf("chat service returned status %d: %s", resp.StatusCode, message)
	}
	if len(decoded.Choices) == 0 || strings.TrimSpace(decoded.Choices[0].Message.Content) == "" {
		return "", fmt.Errorf("chat service returned an empty answer")
	}
	return strings.TrimSpace(decoded.Choices[0].Message.Content), nil
}

// Stream 发送流式聊天请求，通过回调实时返回增量内容。
func (c *OpenAICompatibleClient) Stream(
	ctx context.Context,
	messages []Message,
	onDelta func(string) error,
) error {
	payload, err := json.Marshal(completionRequest{
		Model: c.model, Messages: messages, Temperature: 0.3, Stream: true,
	})
	if err != nil {
		return fmt.Errorf("encode streaming chat request: %w", err)
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, c.endpoint, bytes.NewReader(payload))
	if err != nil {
		return fmt.Errorf("create streaming chat request: %w", err)
	}
	req.Header.Set("Authorization", "Bearer "+c.apiKey)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "text/event-stream")
	resp, err := c.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("request streaming chat service: %w", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		body, _ := io.ReadAll(io.LimitReader(resp.Body, 1<<20))
		var decoded completionResponse
		_ = json.Unmarshal(body, &decoded)
		message := http.StatusText(resp.StatusCode)
		if decoded.Error != nil && strings.TrimSpace(decoded.Error.Message) != "" {
			message = decoded.Error.Message
		}
		return fmt.Errorf("streaming chat service returned status %d: %s", resp.StatusCode, message)
	}

	scanner := bufio.NewScanner(resp.Body)
	scanner.Buffer(make([]byte, 64*1024), 2*1024*1024)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if !strings.HasPrefix(line, "data:") {
			continue
		}
		data := strings.TrimSpace(strings.TrimPrefix(line, "data:"))
		if data == "" || data == "[DONE]" {
			continue
		}
		var chunk streamChunk
		if err := json.Unmarshal([]byte(data), &chunk); err != nil {
			return fmt.Errorf("decode streaming chat chunk: %w", err)
		}
		if chunk.Error != nil {
			return fmt.Errorf("streaming chat service: %s", chunk.Error.Message)
		}
		for _, choice := range chunk.Choices {
			if choice.Delta.Content != "" {
				if err := onDelta(choice.Delta.Content); err != nil {
					return err
				}
			}
		}
	}
	if err := scanner.Err(); err != nil {
		return fmt.Errorf("read streaming chat response: %w", err)
	}
	return nil
}

// completionEndpoint 补全基础URL的聊天补全路径并清理参数。
func completionEndpoint(baseURL string) (string, error) {
	raw := strings.TrimSpace(baseURL)
	parsed, err := url.Parse(raw)
	if err != nil || parsed.Scheme == "" || parsed.Host == "" {
		return "", fmt.Errorf("invalid chat base URL %q", raw)
	}
	parsed.RawQuery = ""
	parsed.Fragment = ""
	parsed.Path = strings.TrimRight(parsed.Path, "/")
	if !strings.HasSuffix(parsed.Path, "/chat/completions") {
		parsed.Path += "/chat/completions"
	}
	return parsed.String(), nil
}
