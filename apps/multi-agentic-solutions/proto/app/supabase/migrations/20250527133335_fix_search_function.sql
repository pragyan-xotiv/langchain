-- Check existing embedding dimensions
DO $$
DECLARE
    col_type text;
    dimension int;
BEGIN
    -- Get current dimension of embeddings
    SELECT data_type INTO col_type 
    FROM information_schema.columns 
    WHERE table_name = 'embeddings' AND column_name = 'embedding';
    
    RAISE NOTICE 'Current embedding column type: %', col_type;
    
    -- Try to get vector dimension if it's a vector type
    BEGIN
        SELECT typmod INTO dimension 
        FROM pg_attribute 
        WHERE attrelid = 'embeddings'::regclass AND attname = 'embedding';
        
        IF dimension > 0 THEN
            RAISE NOTICE 'Current vector dimension: %', dimension;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Could not determine vector dimension: %', SQLERRM;
    END;
END $$;

-- Update the embeddings table to use 3072 dimensions if not already set
-- This will recreate the embeddings table with the new dimension if necessary
DO $$
BEGIN
    -- Try to alter the table if it doesn't have the right dimensions
    BEGIN
        -- Drop the existing index first (if any)
        EXECUTE 'DROP INDEX IF EXISTS embeddings_embedding_idx';
        EXECUTE 'DROP INDEX IF EXISTS embeddings_embedding_cosine_idx';
        
        -- Alter the embedding column to use 3072 dimensions
        EXECUTE 'ALTER TABLE embeddings ALTER COLUMN embedding TYPE VECTOR(3072)';
        
        RAISE NOTICE 'Updated embedding column to VECTOR(3072)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error updating embedding column: %', SQLERRM;
    END;
END $$;

-- Create a simpler match_documents function for basic vector search
CREATE OR REPLACE FUNCTION simple_match_documents(
  query_embedding VECTOR(3072),  -- Using 3072 dimensions for text-embedding-3-large
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

-- Create a debug function to examine embeddings
CREATE OR REPLACE FUNCTION debug_embedding(embedding_id UUID)
RETURNS TABLE (
  id UUID,
  document_id UUID,
  embedding_type TEXT,
  embedding_length INT,
  first_values TEXT,
  last_values TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id, 
    e.document_id,
    pg_typeof(e.embedding)::TEXT AS embedding_type,
    array_length(e.embedding, 1) AS embedding_length,
    CASE 
      WHEN array_length(e.embedding, 1) >= 3 THEN 
        '[' || e.embedding[1] || ',' || e.embedding[2] || ',' || e.embedding[3] || '...]'
      ELSE 'unknown'
    END AS first_values,
    CASE 
      WHEN array_length(e.embedding, 1) >= 3 THEN 
        '[...' || e.embedding[array_length(e.embedding, 1)-2] || ',' || 
        e.embedding[array_length(e.embedding, 1)-1] || ',' || 
        e.embedding[array_length(e.embedding, 1)] || ']'
      ELSE 'unknown'
    END AS last_values
  FROM 
    embeddings e
  WHERE 
    e.id = embedding_id;
END;
$$;

-- -- Recreate the vector search index
-- CREATE INDEX embeddings_embedding_cosine_idx ON embeddings 
-- USING ivfflat (embedding vector_cosine_ops)
-- WITH (lists = 100);  -- Use fewer lists for higher dimensions

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
