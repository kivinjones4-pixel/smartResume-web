-- SmartResume platform knowledge-base RAG initialization
-- PostgreSQL 16+ / pgvector
-- Embedding dimension: 1536 (must match AI_EMBEDDING_DIMENSIONS)
-- Run with:
--   psql -v ON_ERROR_STOP=1 -f scripts/init_knowledge_rag.sql

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Keep this script independently executable on databases that were not created
-- from scripts/init.sql.
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

-- One row represents one Markdown knowledge source. The Markdown file remains
-- the canonical source; this table stores its searchable/import state.
CREATE TABLE IF NOT EXISTS knowledge_documents (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title               varchar(255) NOT NULL,
    source_path         varchar(500) NOT NULL UNIQUE,
    source_url          text,
    category            varchar(100) NOT NULL,
    visibility          varchar(20) NOT NULL DEFAULT 'public'
                            CHECK (visibility IN ('public', 'authenticated', 'internal')),
    status              varchar(20) NOT NULL DEFAULT 'active'
                            CHECK (status IN ('draft', 'active', 'archived')),
    version             integer NOT NULL DEFAULT 1 CHECK (version > 0),
    content_hash        char(64) NOT NULL,
    metadata            jsonb NOT NULL DEFAULT '{}'::jsonb,
    published_at        timestamptz,
    created_at          timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (jsonb_typeof(metadata) = 'object')
);

CREATE INDEX IF NOT EXISTS idx_knowledge_documents_lookup
    ON knowledge_documents (status, visibility, category);

-- A document is split into ordered semantic chunks before embedding. Keeping
-- provider/model metadata prevents vectors produced by incompatible models
-- from being mixed during retrieval.
CREATE TABLE IF NOT EXISTS knowledge_chunks (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id         uuid NOT NULL
                            REFERENCES knowledge_documents(id) ON DELETE CASCADE,
    chunk_index         integer NOT NULL CHECK (chunk_index >= 0),
    heading             varchar(500),
    content             text NOT NULL CHECK (length(btrim(content)) > 0),
    content_hash        char(64) NOT NULL,
    token_count         integer CHECK (token_count IS NULL OR token_count >= 0),
    metadata            jsonb NOT NULL DEFAULT '{}'::jsonb,
    embedding           vector(1536) NOT NULL,
    embedding_provider  varchar(100) NOT NULL,
    embedding_model     varchar(150) NOT NULL,
    embedded_at         timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at          timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (document_id, chunk_index),
    CHECK (jsonb_typeof(metadata) = 'object')
);

CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_document
    ON knowledge_chunks (document_id, chunk_index);

CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_embedding_model
    ON knowledge_chunks (embedding_provider, embedding_model);

CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_content_trgm
    ON knowledge_chunks USING gin (content gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_knowledge_documents_title_trgm
    ON knowledge_documents USING gin (title gin_trgm_ops);

-- Cosine distance operator: embedding <=> query_embedding.
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_embedding_hnsw
    ON knowledge_chunks USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

-- Records each importer execution for diagnostics and safe re-indexing.
CREATE TABLE IF NOT EXISTS knowledge_import_runs (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    embedding_provider  varchar(100) NOT NULL,
    embedding_model     varchar(150) NOT NULL,
    embedding_dimensions integer NOT NULL CHECK (embedding_dimensions > 0),
    status              varchar(20) NOT NULL DEFAULT 'running'
                            CHECK (status IN ('running', 'completed', 'failed')),
    documents_scanned   integer NOT NULL DEFAULT 0 CHECK (documents_scanned >= 0),
    documents_changed   integer NOT NULL DEFAULT 0 CHECK (documents_changed >= 0),
    chunks_written      integer NOT NULL DEFAULT 0 CHECK (chunks_written >= 0),
    error_message       text,
    started_at          timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    finished_at         timestamptz,
    CHECK (
        (status = 'running' AND finished_at IS NULL)
        OR (status IN ('completed', 'failed') AND finished_at IS NOT NULL)
    )
);

DROP TRIGGER IF EXISTS trg_knowledge_documents_updated_at ON knowledge_documents;
CREATE TRIGGER trg_knowledge_documents_updated_at
    BEFORE UPDATE ON knowledge_documents
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_knowledge_chunks_updated_at ON knowledge_chunks;
CREATE TRIGGER trg_knowledge_chunks_updated_at
    BEFORE UPDATE ON knowledge_chunks
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMIT;
