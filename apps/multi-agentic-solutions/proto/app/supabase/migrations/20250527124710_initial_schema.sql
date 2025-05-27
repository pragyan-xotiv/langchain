-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Documents table
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Embeddings table
CREATE TABLE embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  embedding VECTOR(3072) NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Conversations table
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Messages table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create vector search index
-- CREATE INDEX embeddings_embedding_hnsw_idx ON embeddings USING hnsw (embedding vector_cosine_ops)
-- WITH (m = 16, ef_construction = 64);

-- Create vector search function
CREATE OR REPLACE FUNCTION match_documents(
  query_embedding VECTOR(3072),
  match_threshold FLOAT,
  match_count INT,
  filter JSONB DEFAULT '{}'
)
RETURNS TABLE (
  id UUID,
  document_id UUID,
  content TEXT,
  metadata JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id,
    e.document_id,
    d.content,
    d.metadata,
    1 - (e.embedding <=> query_embedding) AS similarity
  FROM
    embeddings e
  JOIN
    documents d ON e.document_id = d.id
  WHERE
    1 - (e.embedding <=> query_embedding) > match_threshold
    -- Apply additional filters from the filter JSONB
    AND CASE
      WHEN filter->>'tag' IS NOT NULL THEN
        d.metadata->'tags' ? filter->>'tag'
      ELSE TRUE
    END
    AND CASE
      WHEN filter->>'collection' IS NOT NULL THEN
        d.metadata->'source'->>'collection' = filter->>'collection'
      ELSE TRUE
    END
  ORDER BY
    similarity DESC
  LIMIT match_count;
END;
$$;

-- Create functions for transaction management
CREATE OR REPLACE FUNCTION begin_transaction()
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  -- This is a dummy function as direct BEGIN statements aren't allowed in functions
  -- The actual BEGIN transaction will be handled by the client
  RAISE NOTICE 'Transaction should be started by the client';
END;
$$;

CREATE OR REPLACE FUNCTION commit_transaction()
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  -- This is a dummy function as direct COMMIT statements aren't allowed in functions
  -- The actual COMMIT transaction will be handled by the client
  RAISE NOTICE 'Transaction should be committed by the client';
END;
$$;

CREATE OR REPLACE FUNCTION rollback_transaction()
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  -- This is a dummy function as direct ROLLBACK statements aren't allowed in functions
  -- The actual ROLLBACK transaction will be handled by the client
  RAISE NOTICE 'Transaction should be rolled back by the client';
END;
$$; 