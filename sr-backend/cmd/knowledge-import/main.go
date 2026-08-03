package main

import (
	"context"
	"log"
	"os/signal"
	"syscall"

	"sr-backend/internal/agent/embedding"
	"sr-backend/internal/config"
	"sr-backend/internal/database"
	"sr-backend/internal/knowledge"
)

// main 初始化配置、数据库和AI客户端，执行知识库导入。
func main() {
	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	cfg := config.Load()
	if err := cfg.AI.ValidateEmbedding(); err != nil {
		log.Fatalf("invalid embedding configuration: %v", err)
	}

	postgresDB, err := database.Open(ctx, cfg.Database)
	if err != nil {
		log.Fatalf("database connection failed: %v", err)
	}
	defer func() {
		if err := postgresDB.Close(); err != nil {
			log.Printf("close database connection: %v", err)
		}
	}()

	embeddingClient, err := embedding.NewOpenAICompatibleClient(
		cfg.AI.Embedding,
		cfg.AI.EmbeddingDimensions,
		cfg.AI.TimeoutSeconds,
	)
	if err != nil {
		log.Fatalf("create embedding client: %v", err)
	}

	repository := knowledge.NewRepository(postgresDB.SQL)
	importer := knowledge.NewImporter(
		repository,
		embeddingClient,
		cfg.AI.Embedding.Provider,
		cfg.AI.Embedding.Model,
		cfg.AI.EmbeddingDimensions,
	)
	stats, err := importer.Import(ctx, cfg.Assistant.KnowledgePath)
	if err != nil {
		log.Fatalf("knowledge import failed: %v", err)
	}
	log.Printf(
		"knowledge import completed: scanned=%d changed=%d chunks=%d",
		stats.DocumentsScanned,
		stats.DocumentsChanged,
		stats.ChunksWritten,
	)
}
