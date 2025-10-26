-- Create indexes for performance optimization

-- Vector similarity search index (CRITICAL for RAG performance)
-- Using IVFFlat index for fast similarity search
-- Lists parameter set to 100 (adjust based on total chunks: sqrt(total_rows))
CREATE INDEX idx_knowledge_chunks_embedding
ON knowledge_chunks
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Cohort filtering index (for RLS and cohort isolation)
CREATE INDEX idx_knowledge_chunks_cohort_type
ON knowledge_chunks(cohort_id, type);

-- Lecture lookup indexes
CREATE INDEX idx_knowledge_chunks_lecture
ON knowledge_chunks(lecture_id)
WHERE type = 'lecture';

CREATE INDEX idx_knowledge_chunks_resource
ON knowledge_chunks(resource_id)
WHERE type = 'resource';

-- Module and lecture indexes
CREATE INDEX idx_modules_cohort_sequence
ON modules(cohort_id, sequence);

CREATE INDEX idx_lectures_module_date
ON lectures(module_id, lecture_date DESC);

CREATE INDEX idx_lectures_instructor
ON lectures(instructor);

-- Resource indexes
CREATE INDEX idx_resources_type
ON resources(type);

CREATE INDEX idx_resources_created_by
ON resources(created_by);

-- Lecture resources reverse lookup
CREATE INDEX idx_lecture_resources_resource
ON lecture_resources(resource_id);

-- User cohort lookup
CREATE INDEX idx_user_cohorts_user
ON user_cohorts(user_id, cohort_id);

CREATE INDEX idx_user_cohorts_cohort
ON user_cohorts(cohort_id);
