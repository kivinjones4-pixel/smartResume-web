package agent

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"

	"sr-backend/internal/agent/chat"
)

// PolishService generates editable resume copy without persisting it.
type PolishService struct {
	chatClient chat.Client
}

type PolishRequest struct {
	Module  string            `json:"module"`
	Context map[string]string `json:"context"`
	Content map[string]string `json:"content"`
}

type PolishResult struct {
	Content map[string]string `json:"content"`
}

type ResumePolishItem struct {
	Module   string            `json:"module"`
	RecordID string            `json:"record_id"`
	Context  map[string]string `json:"context"`
	Content  map[string]string `json:"content"`
}

type ResumePolishRequest struct {
	TargetPosition string             `json:"target_position"`
	Items          []ResumePolishItem `json:"items"`
}

type PolishSuggestion struct {
	ID        string `json:"id"`
	Module    string `json:"module"`
	RecordID  string `json:"record_id"`
	Field     string `json:"field"`
	Original  string `json:"original"`
	Suggested string `json:"suggested"`
	Reason    string `json:"reason"`
}

type ResumePolishResult struct {
	Suggestions []PolishSuggestion `json:"suggestions"`
}

// NewPolishService 创建PolishService实例。
func NewPolishService(chatClient chat.Client) *PolishService {
	return &PolishService{chatClient: chatClient}
}

// Polish 润色简历指定模块内容。验证字段、调用AI润色并解析返回结果。
func (s *PolishService) Polish(ctx context.Context, request PolishRequest) (*PolishResult, error) {
	fields, ok := polishFields[request.Module]
	if !ok {
		return nil, fmt.Errorf("unsupported resume module %q", request.Module)
	}
	allowed := make(map[string]string, len(fields))
	for _, field := range fields {
		if value := strings.TrimSpace(request.Content[field]); value != "" {
			allowed[field] = value
		}
	}
	if len(allowed) == 0 {
		return nil, fmt.Errorf("no polishable content")
	}

	payload, err := json.Marshal(map[string]any{
		"module":  request.Module,
		"context": request.Context,
		"content": allowed,
	})
	if err != nil {
		return nil, fmt.Errorf("encode polish input: %w", err)
	}
	messages := []chat.Message{
		{Role: "system", Content: `你是专业的中文简历润色助手。只优化输入 content 中已有的字段，增强表达的专业性、清晰度和结果导向，不虚构数据、经历或成绩。achievements 保持每行一项，description 保持为可直接填写进简历的纯文本。只返回严格 JSON，格式为 {"content":{"字段名":"润色文本"}}，不要 Markdown，不要返回 context 中的字段。`},
		{Role: "user", Content: string(payload)},
	}
	answer, err := s.chatClient.Complete(ctx, messages)
	if err != nil {
		return nil, fmt.Errorf("generate polished resume content: %w", err)
	}
	var decoded PolishResult
	if err := decodeModelJSON(answer, &decoded); err != nil {
		return nil, fmt.Errorf("decode polished resume content: %w", err)
	}
	result := make(map[string]string, len(fields))
	for _, field := range fields {
		if _, existed := allowed[field]; !existed {
			continue
		}
		if value := strings.TrimSpace(decoded.Content[field]); value != "" {
			result[field] = value
		}
	}
	if len(result) == 0 {
		return nil, fmt.Errorf("chat service returned no polishable content")
	}
	return &PolishResult{Content: result}, nil
}

// PolishResume 根据求职方向生成简历润色建议。过滤无效项，调用大模型获取改写建议，并校验去重。
func (s *PolishService) PolishResume(ctx context.Context, request ResumePolishRequest) (*ResumePolishResult, error) {
	allowedItems := make([]ResumePolishItem, 0, len(request.Items))
	originals := make(map[string]string)
	for _, item := range request.Items {
		fields, ok := polishFields[item.Module]
		if !ok || strings.TrimSpace(item.RecordID) == "" {
			continue
		}
		content := make(map[string]string)
		for _, field := range fields {
			if value := strings.TrimSpace(item.Content[field]); value != "" {
				content[field] = value
				originals[suggestionKey(item.Module, item.RecordID, field)] = value
			}
		}
		if len(content) > 0 {
			item.Content = content
			allowedItems = append(allowedItems, item)
		}
	}
	if len(allowedItems) == 0 {
		return nil, fmt.Errorf("no polishable content")
	}
	payload, err := json.Marshal(map[string]any{
		"target_position": request.TargetPosition,
		"items":           allowedItems,
	})
	if err != nil {
		return nil, fmt.Errorf("encode resume polish input: %w", err)
	}
	messages := []chat.Message{
		{Role: "system", Content: `你是专业的中文简历顾问。结合求职方向审阅整份简历，只针对 items.content 中已有字段提出有价值的改写建议，不虚构数据、经历或成绩。每条建议必须保留输入中的 module、record_id 和 field。achievements 用换行分隔每项成就。只返回严格 JSON：{"suggestions":[{"module":"work","record_id":"原ID","field":"description","suggested":"建议文本","reason":"简短原因"}]}。不要 Markdown，不要建议修改 context 字段。`},
		{Role: "user", Content: string(payload)},
	}
	answer, err := s.chatClient.Complete(ctx, messages)
	if err != nil {
		return nil, fmt.Errorf("generate resume polish suggestions: %w", err)
	}
	var decoded ResumePolishResult
	if err := decodeModelJSON(answer, &decoded); err != nil {
		return nil, fmt.Errorf("decode resume polish suggestions: %w", err)
	}
	result := make([]PolishSuggestion, 0, len(decoded.Suggestions))
	seen := make(map[string]bool)
	for _, suggestion := range decoded.Suggestions {
		key := suggestionKey(suggestion.Module, suggestion.RecordID, suggestion.Field)
		original, ok := originals[key]
		if !ok || seen[key] || strings.TrimSpace(suggestion.Suggested) == "" {
			continue
		}
		seen[key] = true
		suggestion.ID = key
		suggestion.Original = original
		suggestion.Suggested = strings.TrimSpace(suggestion.Suggested)
		suggestion.Reason = strings.TrimSpace(suggestion.Reason)
		result = append(result, suggestion)
	}
	return &ResumePolishResult{Suggestions: result}, nil
}

var polishFields = map[string][]string{
	"education":  {"description"},
	"internship": {"achievements", "description"},
	"work":       {"achievements", "description"},
	"project":    {"achievements", "description"},
	"award":      {"description"},
}

// stripJSONFence 去除JSON的Markdown代码块围栏。
func stripJSONFence(value string) string {
	value = strings.TrimSpace(value)
	if !strings.HasPrefix(value, "```") {
		return value
	}
	value = strings.TrimPrefix(value, "```")
	value = strings.TrimPrefix(value, "json")
	value = strings.TrimSpace(value)
	value = strings.TrimSuffix(value, "```")
	return strings.TrimSpace(value)
}

// decodeModelJSON tolerates common provider wrappers such as Markdown fences or
// a short explanation before/after the JSON object.
func decodeModelJSON(value string, target any) error {
	value = stripJSONFence(value)
	if err := json.Unmarshal([]byte(value), target); err == nil {
		return nil
	}
	start := strings.Index(value, "{")
	end := strings.LastIndex(value, "}")
	if start < 0 || end <= start {
		return fmt.Errorf("model response did not contain a JSON object")
	}
	if err := json.Unmarshal([]byte(value[start:end+1]), target); err != nil {
		return fmt.Errorf("invalid JSON object in model response: %w", err)
	}
	return nil
}

// 生成模块、记录ID和字段的组合键。
func suggestionKey(module, recordID, field string) string {
	return module + ":" + recordID + ":" + field
}
