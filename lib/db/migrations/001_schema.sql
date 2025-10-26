-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pgvector extension for vector embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Create cohorts table
CREATE TABLE cohorts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  start_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create modules table
CREATE TABLE modules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cohort_id UUID NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sequence INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(cohort_id, sequence)
);

-- Create lectures table
CREATE TABLE lectures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  instructor TEXT NOT NULL,
  lecture_date DATE NOT NULL,
  duration_mins INT,
  vtt_file_url TEXT,
  summary JSONB,
  key_topics TEXT[],
  processed BOOLEAN DEFAULT FALSE,
  processing_progress INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create resources table
CREATE TABLE resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  url TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('github', 'youtube', 'blog', 'rss', 'other')),
  title TEXT NOT NULL,
  summary TEXT,
  content TEXT,
  metadata JSONB,
  is_global BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES auth.users(id),
  scraped_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create lecture_resources junction table
CREATE TABLE lecture_resources (
  lecture_id UUID REFERENCES lectures(id) ON DELETE CASCADE,
  resource_id UUID REFERENCES resources(id) ON DELETE CASCADE,
  mention_context TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (lecture_id, resource_id)
);

-- Create knowledge_chunks table (unified for lectures and resources)
CREATE TABLE knowledge_chunks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL CHECK (type IN ('lecture', 'resource')),
  lecture_id UUID REFERENCES lectures(id) ON DELETE CASCADE,
  resource_id UUID REFERENCES resources(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  embedding vector(1536) NOT NULL,
  metadata JSONB NOT NULL,
  cohort_id UUID NOT NULL REFERENCES cohorts(id),
  chunk_index INT NOT NULL,
  token_count INT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (
    (type = 'lecture' AND lecture_id IS NOT NULL AND resource_id IS NULL) OR
    (type = 'resource' AND resource_id IS NOT NULL AND lecture_id IS NULL)
  )
);

-- Create user_cohorts junction table
CREATE TABLE user_cohorts (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  cohort_id UUID REFERENCES cohorts(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('student', 'instructor', 'admin')),
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, cohort_id)
);

-- Create trigger to update lectures updated_at
CREATE OR REPLACE FUNCTION update_lecture_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER lecture_update_timestamp
BEFORE UPDATE ON lectures
FOR EACH ROW
EXECUTE FUNCTION update_lecture_timestamp();
