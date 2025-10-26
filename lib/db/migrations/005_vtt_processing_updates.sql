-- Update lectures table to support VTT processing pipeline
-- Add missing fields for VTT upload and processing

-- Add new columns to lectures table
ALTER TABLE lectures 
ADD COLUMN IF NOT EXISTS cohort_id UUID REFERENCES cohorts(id),
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
ADD COLUMN IF NOT EXISTS processing_stage TEXT,
ADD COLUMN IF NOT EXISTS processing_progress INT DEFAULT 0 CHECK (processing_progress >= 0 AND processing_progress <= 100),
ADD COLUMN IF NOT EXISTS error_message TEXT,
ADD COLUMN IF NOT EXISTS vtt_filename TEXT,
ADD COLUMN IF NOT EXISTS vtt_size BIGINT,
ADD COLUMN IF NOT EXISTS chunks_count INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS tokens_used INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS confidence DECIMAL(3,2) DEFAULT 0.0 CHECK (confidence >= 0.0 AND confidence <= 1.0),
ADD COLUMN IF NOT EXISTS processing_time DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS failed_at TIMESTAMPTZ;

-- Update knowledge_chunks table to match our processor
ALTER TABLE knowledge_chunks
ADD COLUMN IF NOT EXISTS start_time TEXT,
ADD COLUMN IF NOT EXISTS end_time TEXT;

-- Create storage bucket for VTT files
INSERT INTO storage.buckets (id, name, public)
VALUES ('lecture-vtts', 'lecture-vtts', false)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policy for lecture-vtts bucket
CREATE POLICY "Users can upload VTT files for their cohorts" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'lecture-vtts' AND
  auth.uid() IS NOT NULL
);

CREATE POLICY "Users can view VTT files for their cohorts" ON storage.objects
FOR SELECT USING (
  bucket_id = 'lecture-vtts' AND
  auth.uid() IS NOT NULL
);

-- Update RLS policies for lectures table
DROP POLICY IF EXISTS "Users can view lectures in their cohorts" ON lectures;
CREATE POLICY "Users can view lectures in their cohorts" ON lectures
FOR SELECT USING (
  cohort_id IN (
    SELECT cohort_id FROM user_cohorts WHERE user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can insert lectures in their cohorts" ON lectures;
CREATE POLICY "Users can insert lectures in their cohorts" ON lectures
FOR INSERT WITH CHECK (
  cohort_id IN (
    SELECT cohort_id FROM user_cohorts WHERE user_id = auth.uid()
  ) AND
  created_by = auth.uid()
);

DROP POLICY IF EXISTS "Users can update lectures in their cohorts" ON lectures;
CREATE POLICY "Users can update lectures in their cohorts" ON lectures
FOR UPDATE USING (
  cohort_id IN (
    SELECT cohort_id FROM user_cohorts WHERE user_id = auth.uid()
  )
);

-- Update RLS policies for knowledge_chunks table
DROP POLICY IF EXISTS "Users can view knowledge chunks in their cohorts" ON knowledge_chunks;
CREATE POLICY "Users can view knowledge chunks in their cohorts" ON knowledge_chunks
FOR SELECT USING (
  cohort_id IN (
    SELECT cohort_id FROM user_cohorts WHERE user_id = auth.uid()
  )
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_lectures_cohort_id ON lectures(cohort_id);
CREATE INDEX IF NOT EXISTS idx_lectures_status ON lectures(status);
CREATE INDEX IF NOT EXISTS idx_lectures_created_by ON lectures(created_by);
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_lecture_id ON knowledge_chunks(lecture_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_cohort_id ON knowledge_chunks(cohort_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_type ON knowledge_chunks(type);

-- Create function to get user cohorts (used in our code)
CREATE OR REPLACE FUNCTION get_user_cohorts(user_uuid UUID)
RETURNS TABLE(cohort_id UUID) AS $$
BEGIN
  RETURN QUERY
  SELECT uc.cohort_id
  FROM user_cohorts uc
  WHERE uc.user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
