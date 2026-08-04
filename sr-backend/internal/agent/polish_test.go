package agent

import (
	"context"
	"testing"

	"sr-backend/internal/agent/chat"
)

type polishChatStub struct {
	answer string
}

func (s polishChatStub) Complete(context.Context, []chat.Message) (string, error) {
	return s.answer, nil
}

func (s polishChatStub) Stream(context.Context, []chat.Message, func(string) error) error {
	return nil
}

func TestPolishOnlyReturnsAllowedFields(t *testing.T) {
	service := NewPolishService(polishChatStub{answer: `{"content":{"description":"优化后的职责描述","company_name":"被篡改的公司"}}`})
	result, err := service.Polish(context.Background(), PolishRequest{
		Module:  "work",
		Context: map[string]string{"company_name": "原公司"},
		Content: map[string]string{"description": "负责项目推进"},
	})
	if err != nil {
		t.Fatalf("Polish returned error: %v", err)
	}
	if result.Content["description"] != "优化后的职责描述" {
		t.Fatalf("unexpected description: %q", result.Content["description"])
	}
	if _, ok := result.Content["company_name"]; ok {
		t.Fatal("non-polishable company_name should have been discarded")
	}
}

func TestPolishRejectsEmptyContent(t *testing.T) {
	service := NewPolishService(polishChatStub{})
	_, err := service.Polish(context.Background(), PolishRequest{
		Module:  "education",
		Content: map[string]string{"description": "  "},
	})
	if err == nil {
		t.Fatal("expected empty polishable content to be rejected")
	}
}

func TestPolishAcceptsJSONWithProviderExplanation(t *testing.T) {
	service := NewPolishService(polishChatStub{answer: "以下是润色结果：\n```json\n{\"content\":{\"description\":\"优化文本\"}}\n```\n希望对你有帮助。"})
	result, err := service.Polish(context.Background(), PolishRequest{
		Module:  "award",
		Content: map[string]string{"description": "原始文本"},
	})
	if err != nil {
		t.Fatalf("Polish returned error: %v", err)
	}
	if result.Content["description"] != "优化文本" {
		t.Fatalf("unexpected description: %q", result.Content["description"])
	}
}
