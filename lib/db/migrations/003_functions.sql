-- Create custom function for vector search with cohort filtering

CREATE OR REPLACE FUNCTION search_knowledge(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 20,
  filter_cohort_id uuid DEFAULT NULL,
  filter_type text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  type text,
  text text,
  metadata jsonb,
  similarity float,
  lecture_id uuid,
  resource_id uuid
)
LANGUAGE sql STABLE
AS $$
  SELECT
    id,
    type,
    text,
    metadata,
    1 - (embedding <=> query_embedding) AS similarity,
    lecture_id,
    resource_id
  FROM knowledge_chunks
  WHERE
    (filter_cohort_id IS NULL OR cohort_id = filter_cohort_id)
    AND (filter_type IS NULL OR type = filter_type)
    AND 1 - (embedding <=> query_embedding) > match_threshold
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
$$;

-- Add comment for documentation
COMMENT ON FUNCTION search_knowledge IS
'Performs vector similarity search on knowledge chunks with optional cohort and type filtering.
Returns top K most similar chunks with similarity scores.';
