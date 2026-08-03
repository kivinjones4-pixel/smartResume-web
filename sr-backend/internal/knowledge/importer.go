package knowledge

import (
	"context"
	"fmt"
	"strings"

	"sr-backend/internal/agent/embedding"
)

type Importer struct {
	repository *Repository
	embeddings embedding.Client
	provider   string
	model      string
	dimensions int
}

// NewImporter 创建导入器。
func NewImporter(repository *Repository, embeddings embedding.Client, provider, model string, dimensions int) *Importer {
	return &Importer{
		repository: repository,
		embeddings: embeddings,
		provider:   strings.TrimSpace(provider),
		model:      strings.TrimSpace(model),
		dimensions: dimensions,
	}
}

// Import 导入知识文档，生成向量并存储，跳过无效或未变更的文档。
func (i *Importer) Import(ctx context.Context, root string) (stats ImportStats, returnedErr error) {
	runID, err := i.repository.StartRun(ctx, i.provider, i.model, i.dimensions)
	if err != nil {
		return stats, err
	}
	defer func() {
		status := "completed"
		if returnedErr != nil {
			status = "failed"
		}
		finishCtx := context.WithoutCancel(ctx)
		if finishErr := i.repository.FinishRun(finishCtx, runID, status, stats, returnedErr); finishErr != nil && returnedErr == nil {
			returnedErr = finishErr
		}
	}()

	documents, err := LoadDocuments(root)
	if err != nil {
		return stats, err
	}
	stats.DocumentsScanned = len(documents)
	for _, document := range documents {
		if document.Status != "active" || document.Visibility == "internal" {
			continue
		}
		current, err := i.repository.IsCurrent(ctx, document, i.provider, i.model)
		if err != nil {
			return stats, err
		}
		if current {
			continue
		}

		chunks := SplitDocument(document)
		if len(chunks) == 0 {
			return stats, fmt.Errorf("knowledge document %q produced no chunks", document.SourcePath)
		}
		inputs := make([]string, len(chunks))
		for index, chunk := range chunks {
			inputs[index] = chunk.Content
		}
		vectors, err := i.embeddings.Embed(ctx, inputs)
		if err != nil {
			return stats, fmt.Errorf("embed knowledge document %q: %w", document.SourcePath, err)
		}
		for index, vector := range vectors {
			if len(vector) != i.dimensions {
				return stats, fmt.Errorf(
					"knowledge document %q chunk %d has vector dimension %d, expected %d",
					document.SourcePath, index, len(vector), i.dimensions,
				)
			}
		}
		if err := i.repository.ReplaceDocument(ctx, document, chunks, vectors, i.provider, i.model); err != nil {
			return stats, err
		}
		stats.DocumentsChanged++
		stats.ChunksWritten += len(chunks)
	}
	return stats, nil
}
