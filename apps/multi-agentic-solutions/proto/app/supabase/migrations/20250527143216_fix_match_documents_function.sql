-- Fix the match_documents function to correctly handle JSONB filtering
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
        -- Use text comparison instead of JSONB operator
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

-- Also fix the simple_match_documents function to ensure it works properly
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
