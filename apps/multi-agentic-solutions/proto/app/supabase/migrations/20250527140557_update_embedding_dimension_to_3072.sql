-- Update embedding dimension from 1536 to 3072
-- First, drop any existing indexes on the embedding column
DROP INDEX IF EXISTS embeddings_embedding_idx;
DROP INDEX IF EXISTS embeddings_embedding_cosine_idx;
DROP INDEX IF EXISTS embeddings_embedding_hnsw_idx;

-- Alter the embedding column to 3072 dimensions
ALTER TABLE embeddings ALTER COLUMN embedding TYPE VECTOR(3072);

-- Recreate the vector search index using HNSW for high-dimensional vectors
-- CREATE INDEX embeddings_embedding_hnsw_idx ON embeddings 
-- USING hnsw (embedding vector_cosine_ops)
-- WITH (m = 16, ef_construction = 64);

-- Update the match_documents function to use 3072 dimensions
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
        (d.metadata->>'tags')::text LIKE '%' || (filter->>'tag')::text || '%'
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

-- Create a simpler match_documents function for basic testing
CREATE OR REPLACE FUNCTION simple_match_documents(
  query_embedding VECTOR(3072),
  match_count INT
)
RETURNS TABLE (
  id UUID,
  document_id UUID,
  content TEXT,
  metadata JSONB,
  similarity FLOAT
)
LANGUAGE sql
STABLE
AS $$
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
  ORDER BY
    e.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- Recreate transaction management functions
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
