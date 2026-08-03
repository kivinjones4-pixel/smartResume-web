package chat

import "context"

type Message struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type Client interface {
	Complete(ctx context.Context, messages []Message) (string, error)
	Stream(ctx context.Context, messages []Message, onDelta func(string) error) error
}
