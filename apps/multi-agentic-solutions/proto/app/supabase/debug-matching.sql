-- Debug script for vector matching

-- 1. Check if we have embeddings and their dimensions
SELECT 
    id, 
    document_id, 
    array_length(embedding, 1) as embedding_dimension,
    pg_typeof(embedding) as embedding_type
FROM 
    embeddings
LIMIT 5;

-- 2. Check if we have documents
SELECT id, LEFT(content, 50) as content_preview
FROM documents
LIMIT 5;

-- 3. Try a direct join without vector operations
SELECT 
    e.id as embedding_id, 
    e.document_id,
    d.id as document_id,
    LEFT(d.content, 50) as content_preview
FROM 
    embeddings e
JOIN 
    documents d ON e.document_id = d.id
LIMIT 5;

-- 4. Try a cosine distance calculation directly
-- Assuming we know a specific document_id to test with
-- Replace with a document_id from your database
WITH test_embedding AS (
    SELECT embedding
    FROM embeddings
    LIMIT 1
)
SELECT 
    e.id,
    e.document_id,
    d.content,
    1 - (e.embedding <=> (SELECT embedding FROM test_embedding)) AS similarity
FROM 
    embeddings e
JOIN 
    documents d ON e.document_id = d.id
ORDER BY 
    similarity DESC
LIMIT 5;

-- 5. Try to examine the match_documents function directly
-- This checks the function definition
SELECT pg_get_functiondef(oid) 
FROM pg_proc 
WHERE proname = 'match_documents';

-- 6. Try a simpler version of the match function
-- Replace with a document_id from your database to get its embedding
WITH test_query AS (
    SELECT embedding
    FROM embeddings
    LIMIT 1
)
SELECT 
    e.id,
    e.document_id,
    d.content,
    1 - (e.embedding <=> (SELECT embedding FROM test_query)) AS similarity
FROM 
    embeddings e
JOIN 
    documents d ON e.document_id = d.id
WHERE 
    1 - (e.embedding <=> (SELECT embedding FROM test_query)) > 0.0
ORDER BY 
    similarity DESC
LIMIT 5; 