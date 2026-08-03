package knowledge

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"strconv"
	"strings"
	"time"
)

type Repository struct {
	db *sql.DB
}

type SearchResult struct {
	ChunkID        string  `json:"-"`
	Title          string  `json:"title"`
	SourcePath     string  `json:"source_path"`
	SourceURL      string  `json:"source_url,omitempty"`
	Content        string  `json:"-"`
	Similarity     float64 `json:"similarity,omitempty"`
	KeywordScore   float64 `json:"-"`
	RetrievalScore float64 `json:"-"`
}

func NewRepository(db *sql.DB) *Repository {
	return &Repository{db: db}
}

// VectorSearch 根据向量检索知识块。
func (r *Repository) VectorSearch(
	ctx context.Context,
	queryVector []float32,
	provider, model string,
	topK int,
) ([]SearchResult, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT c.id::text,
		       d.title,
		       d.source_path,
		       COALESCE(d.source_url, ''),
		       c.content,
		       1 - (c.embedding <=> $1::vector) AS similarity
		FROM knowledge_chunks c
		JOIN knowledge_documents d ON d.id = c.document_id
		WHERE d.status = 'active'
		  AND d.visibility IN ('public', 'authenticated')
		  AND c.embedding_provider = $2
		  AND c.embedding_model = $3
		ORDER BY c.embedding <=> $1::vector
		LIMIT $4
	`, vectorLiteral(queryVector), provider, model, topK)
	if err != nil {
		return nil, fmt.Errorf("vector search knowledge chunks: %w", err)
	}
	defer rows.Close()
	results := make([]SearchResult, 0, topK)
	for rows.Next() {
		var result SearchResult
		if err := rows.Scan(&result.ChunkID, &result.Title, &result.SourcePath, &result.SourceURL, &result.Content, &result.Similarity); err != nil {
			return nil, fmt.Errorf("scan vector search result: %w", err)
		}
		results = append(results, result)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate vector search results: %w", err)
	}
	return results, nil
}

// KeywordSearch 基于关键词检索知识块，返回按相关度降序排列的topK结果。
func (r *Repository) KeywordSearch(ctx context.Context, keywords []string, topK int) ([]SearchResult, error) {
	if len(keywords) == 0 || topK <= 0 {
		return []SearchResult{}, nil
	}
	args := make([]any, 0, len(keywords)+1)
	scoreExpressions := make([]string, 0, len(keywords))
	whereExpressions := make([]string, 0, len(keywords))
	for _, keyword := range keywords {
		args = append(args, strings.ToLower(strings.TrimSpace(keyword)))
		parameter := fmt.Sprintf("$%d", len(args))
		exact := fmt.Sprintf(
			"lower(c.content) LIKE '%%' || %s || '%%' OR lower(d.title) LIKE '%%' || %s || '%%'",
			parameter, parameter,
		)
		scoreExpressions = append(scoreExpressions, fmt.Sprintf(
			"CASE WHEN %s THEN 1.0 ELSE GREATEST(similarity(lower(c.content), %s), similarity(lower(d.title), %s)) END",
			exact, parameter, parameter,
		))
		whereExpressions = append(whereExpressions, fmt.Sprintf(
			"(%s OR similarity(lower(c.content), %s) >= 0.3 OR similarity(lower(d.title), %s) >= 0.3)",
			exact, parameter, parameter,
		))
	}
	args = append(args, topK)
	limitParameter := fmt.Sprintf("$%d", len(args))
	query := fmt.Sprintf(`
		SELECT c.id::text,
		       d.title,
		       d.source_path,
		       COALESCE(d.source_url, ''),
		       c.content,
		       GREATEST(%s) AS keyword_score
		FROM knowledge_chunks c
		JOIN knowledge_documents d ON d.id = c.document_id
		WHERE d.status = 'active'
		  AND d.visibility IN ('public', 'authenticated')
		  AND (%s)
		ORDER BY keyword_score DESC
		LIMIT %s
	`, strings.Join(scoreExpressions, ", "), strings.Join(whereExpressions, " OR "), limitParameter)

	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("keyword search knowledge chunks: %w", err)
	}
	defer rows.Close()
	results := make([]SearchResult, 0, topK)
	for rows.Next() {
		var result SearchResult
		if err := rows.Scan(
			&result.ChunkID,
			&result.Title,
			&result.SourcePath,
			&result.SourceURL,
			&result.Content,
			&result.KeywordScore,
		); err != nil {
			return nil, fmt.Errorf("scan keyword search result: %w", err)
		}
		results = append(results, result)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate keyword search results: %w", err)
	}
	return results, nil
}

// StartRun 创建知识导入运行记录并返回其ID。
func (r *Repository) StartRun(ctx context.Context, provider, model string, dimensions int) (string, error) {
	var id string
	err := r.db.QueryRowContext(ctx, `
		INSERT INTO knowledge_import_runs (
			embedding_provider, embedding_model, embedding_dimensions
		) VALUES ($1, $2, $3)
		RETURNING id::text
	`, provider, model, dimensions).Scan(&id)
	if err != nil {
		return "", fmt.Errorf("start knowledge import run: %w", err)
	}
	return id, nil
}

// FinishRun 结束导入运行并更新状态及统计信息。
func (r *Repository) FinishRun(ctx context.Context, runID, status string, stats ImportStats, importErr error) error {
	var errorMessage any
	if importErr != nil {
		message := importErr.Error()
		if len(message) > 4000 {
			message = message[:4000]
		}
		errorMessage = message
	}
	result, err := r.db.ExecContext(ctx, `
		UPDATE knowledge_import_runs
		SET status = $2,
			documents_scanned = $3,
			documents_changed = $4,
			chunks_written = $5,
			error_message = $6,
			finished_at = CURRENT_TIMESTAMP
		WHERE id = $1::uuid
	`, runID, status, stats.DocumentsScanned, stats.DocumentsChanged, stats.ChunksWritten, errorMessage)
	if err != nil {
		return fmt.Errorf("finish knowledge import run: %w", err)
	}
	rows, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("read knowledge import update result: %w", err)
	}
	if rows != 1 {
		return fmt.Errorf("knowledge import run %s was not found", runID)
	}
	return nil
}

// IsCurrent 检查指定提供者和模型下文档是否已存在且已向量化。
func (r *Repository) IsCurrent(ctx context.Context, document Document, provider, model string) (bool, error) {
	var current bool
	err := r.db.QueryRowContext(ctx, `
		SELECT EXISTS (
			SELECT 1
			FROM knowledge_documents d
			WHERE d.source_path = $1
			  AND d.content_hash = $2
			  AND EXISTS (
				SELECT 1
				FROM knowledge_chunks c
				WHERE c.document_id = d.id
				  AND c.embedding_provider = $3
				  AND c.embedding_model = $4
			  )
		)
	`, document.SourcePath, document.Hash, provider, model).Scan(&current)
	if err != nil {
		return false, fmt.Errorf("check knowledge document %q: %w", document.SourcePath, err)
	}
	return current, nil
}

// ReplaceDocument 替换文档及其分块和向量。若冲突则更新文档，删除旧分块后插入新分块。要求分块与向量数量一致。事务内执行。
func (r *Repository) ReplaceDocument(
	ctx context.Context,
	document Document,
	chunks []Chunk,
	vectors [][]float32,
	provider string,
	model string,
) error {
	if len(chunks) != len(vectors) {
		return fmt.Errorf("chunk/vector count mismatch: %d/%d", len(chunks), len(vectors))
	}
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("begin knowledge document transaction: %w", err)
	}
	defer func() { _ = tx.Rollback() }()

	metadata, err := json.Marshal(map[string]any{"source_format": "markdown"})
	if err != nil {
		return fmt.Errorf("encode knowledge document metadata: %w", err)
	}
	var documentID string
	err = tx.QueryRowContext(ctx, `
		INSERT INTO knowledge_documents (
			title, source_path, source_url, category, visibility, status,
			version, content_hash, metadata, published_at
		) VALUES (
			$1, $2, NULLIF($3::text, ''), $4, $5, $6::varchar, $7, $8, $9::jsonb,
			CASE WHEN $6::varchar = 'active' THEN CURRENT_TIMESTAMP ELSE NULL END
		)
		ON CONFLICT (source_path) DO UPDATE SET
			title = EXCLUDED.title,
			source_url = EXCLUDED.source_url,
			category = EXCLUDED.category,
			visibility = EXCLUDED.visibility,
			status = EXCLUDED.status,
			version = EXCLUDED.version,
			content_hash = EXCLUDED.content_hash,
			metadata = EXCLUDED.metadata,
			published_at = EXCLUDED.published_at
		RETURNING id::text
	`, document.Title, document.SourcePath, document.SourceURL, document.Category,
		document.Visibility, document.Status, document.Version, document.Hash, metadata).Scan(&documentID)
	if err != nil {
		return fmt.Errorf("upsert knowledge document %q: %w", document.SourcePath, err)
	}

	if _, err := tx.ExecContext(ctx, `DELETE FROM knowledge_chunks WHERE document_id = $1::uuid`, documentID); err != nil {
		return fmt.Errorf("delete old chunks for %q: %w", document.SourcePath, err)
	}
	for i, chunk := range chunks {
		chunkMetadata, err := json.Marshal(map[string]any{"source_path": document.SourcePath})
		if err != nil {
			return fmt.Errorf("encode chunk metadata: %w", err)
		}
		_, err = tx.ExecContext(ctx, `
			INSERT INTO knowledge_chunks (
				document_id, chunk_index, heading, content, content_hash,
				metadata, embedding, embedding_provider, embedding_model, embedded_at
			) VALUES (
				$1::uuid, $2, NULLIF($3, ''), $4, $5, $6::jsonb,
				$7::vector, $8, $9, $10
			)
		`, documentID, chunk.Index, chunk.Heading, chunk.Content, chunk.Hash,
			chunkMetadata, vectorLiteral(vectors[i]), provider, model, time.Now().UTC())
		if err != nil {
			return fmt.Errorf("insert chunk %d for %q: %w", chunk.Index, document.SourcePath, err)
		}
	}

	if err := tx.Commit(); err != nil {
		return fmt.Errorf("commit knowledge document %q: %w", document.SourcePath, err)
	}
	return nil
}

// vectorLiteral 将float32切片格式化为字符串数组格式。
func vectorLiteral(vector []float32) string {
	var builder strings.Builder
	builder.Grow(len(vector) * 10)
	builder.WriteByte('[')
	for i, value := range vector {
		if i > 0 {
			builder.WriteByte(',')
		}
		builder.WriteString(strconv.FormatFloat(float64(value), 'g', -1, 32))
	}
	builder.WriteByte(']')
	return builder.String()
}
