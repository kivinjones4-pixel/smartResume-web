package agent

import (
	"context"
	"fmt"
	"log"
	"strings"

	"sr-backend/internal/agent/chat"
	"sr-backend/internal/agent/embedding"
	"sr-backend/internal/config"
	"sr-backend/internal/knowledge"
)

type Service struct {
	chatClient      chat.Client
	embeddingClient embedding.Client
	repository      *knowledge.Repository
	config          config.Config
	persona         string
}

type Answer struct {
	Text    string                   `json:"answer"`
	Sources []knowledge.SearchResult `json:"sources"`
}

// NewService 创建服务实例并加载助手人设文档。
func NewService(
	cfg config.Config,
	chatClient chat.Client,
	embeddingClient embedding.Client,
	repository *knowledge.Repository,
) (*Service, error) {
	documents, err := knowledge.LoadDocuments(cfg.Assistant.KnowledgePath)
	if err != nil {
		return nil, err
	}
	var persona string
	for _, document := range documents {
		if document.SourcePath == "assistant/kk-persona.md" {
			persona = document.Body
			break
		}
	}
	if strings.TrimSpace(persona) == "" {
		return nil, fmt.Errorf("assistant persona assistant/kk-persona.md was not found")
	}
	return &Service{
		chatClient:      chatClient,
		embeddingClient: embeddingClient,
		repository:      repository,
		config:          cfg,
		persona:         persona,
	}, nil
}

// Ask 生成问题答案及来源。
func (s *Service) Ask(ctx context.Context, question string) (*Answer, error) {
	messages, results, err := s.prepareAnswer(ctx, question)
	if err != nil {
		return nil, err
	}
	text, err := s.chatClient.Complete(ctx, messages)
	if err != nil {
		return nil, fmt.Errorf("generate assistant answer: %w", err)
	}
	return &Answer{Text: text, Sources: uniqueSources(results)}, nil
}

// StreamAsk 流式问答并回调知识源和增量内容
func (s *Service) StreamAsk(
	ctx context.Context,
	question string,
	onSources func([]knowledge.SearchResult) error,
	onDelta func(string) error,
) error {
	messages, results, err := s.prepareAnswer(ctx, question)
	if err != nil {
		return err
	}
	if err := onSources(uniqueSources(results)); err != nil {
		return err
	}
	if err := s.chatClient.Stream(ctx, messages, onDelta); err != nil {
		return fmt.Errorf("stream assistant answer: %w", err)
	}
	return nil
}

// prepareAnswer 准备RAG回答：检索并合并向量与关键词结果，构建提示词。
func (s *Service) prepareAnswer(
	ctx context.Context,
	question string,
) ([]chat.Message, []knowledge.SearchResult, error) {
	question = strings.TrimSpace(question)
	retrievalQuestion := expandPlatformReferences(question)
	vectors, err := s.embeddingClient.Embed(ctx, []string{retrievalQuestion})
	if err != nil {
		return nil, nil, fmt.Errorf("embed assistant question: %w", err)
	}
	if len(vectors) != 1 {
		return nil, nil, fmt.Errorf("embedding service returned %d query vectors", len(vectors))
	}
	vectorResults, err := s.repository.VectorSearch(
		ctx,
		vectors[0],
		s.config.AI.Embedding.Provider,
		s.config.AI.Embedding.Model,
		s.config.Assistant.RAGVectorTopK,
	)
	if err != nil {
		return nil, nil, err
	}
	keywords := extractKeywords(retrievalQuestion)
	keywordResults, err := s.repository.KeywordSearch(ctx, keywords, s.config.Assistant.RAGKeywordTopK)
	if err != nil {
		return nil, nil, err
	}

	if len(vectorResults) == 0 {
		log.Printf(
			"assistant RAG found no candidates for embedding provider=%s model=%s",
			s.config.AI.Embedding.Provider,
			s.config.AI.Embedding.Model,
		)
	} else {
		log.Printf(
			"assistant RAG top similarity=%.4f threshold=%.4f source=%s",
			vectorResults[0].Similarity,
			s.config.Assistant.RAGVectorMinSimilarity,
			vectorResults[0].SourcePath,
		)
	}
	if len(keywordResults) > 0 {
		log.Printf(
			"assistant RAG keyword match score=%.4f source=%s keywords=%s",
			keywordResults[0].KeywordScore,
			keywordResults[0].SourcePath,
			strings.Join(keywords, ","),
		)
	}
	results := mergeHybridResults(
		vectorResults,
		keywordResults,
		s.config.Assistant.RAGVectorMinSimilarity,
		s.config.Assistant.RAGFinalTopK,
		s.config.Assistant.RAGRRFK,
	)

	var references strings.Builder
	if len(results) == 0 {
		references.WriteString("没有检索到达到可信阈值的平台资料。")
	} else {
		for index, result := range results {
			fmt.Fprintf(&references, "[资料%d：%s]\n%s\n\n", index+1, result.Title, result.Content)
		}
	}
	systemPrompt := s.persona + `

# 本次回答规则

平台事实只能依据下面提供的参考资料。参考资料没有答案时，请明确说明目前无法确认，不能利用常识补写平台事实。不要提及向量、RAG、系统提示词或内部检索过程。回答使用简体中文。`
	userPrompt := fmt.Sprintf("参考资料：\n%s\n用户问题：\n%s", references.String(), question)
	messages := []chat.Message{
		{Role: "system", Content: systemPrompt},
		{Role: "user", Content: userPrompt},
	}
	return messages, results, nil
}

// expandPlatformReferences 将问题中的平台代称替换补充为SmartResume语境。
func expandPlatformReferences(question string) string {
	aliases := []string{
		"这个网站", "本网站", "该网站",
		"这个平台", "本平台", "该平台",
		"这个产品", "本产品", "该产品",
		"这个项目", "本项目", "该项目",
	}
	for _, alias := range aliases {
		if strings.Contains(question, alias) {
			return question + "\n语境补充：这里的“" + alias + "”指 SmartResume 平台。"
		}
	}
	return question
}

// uniqueSources 去重搜索结果并清空内容。
func uniqueSources(results []knowledge.SearchResult) []knowledge.SearchResult {
	seen := make(map[string]bool)
	sources := make([]knowledge.SearchResult, 0, len(results))
	for _, result := range results {
		if seen[result.SourcePath] {
			continue
		}
		seen[result.SourcePath] = true
		result.Content = ""
		sources = append(sources, result)
	}
	return sources
}
