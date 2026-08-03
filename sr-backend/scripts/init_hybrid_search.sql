-- SmartResume hybrid retrieval initialization
-- Run after scripts/init_knowledge_rag.sql with:
--   psql -v ON_ERROR_STOP=1 -f scripts/init_hybrid_search.sql

BEGIN;

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_content_trgm
    ON knowledge_chunks USING gin (content gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_knowledge_documents_title_trgm
    ON knowledge_documents USING gin (title gin_trgm_ops);

COMMIT;

