-- Enable Row Level Security on all tables

ALTER TABLE knowledge_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE lectures ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE cohorts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_cohorts ENABLE ROW LEVEL SECURITY;

-- ================================
-- KNOWLEDGE CHUNKS POLICIES
-- ================================

-- Policy: Students and instructors see only their cohort's chunks
CREATE POLICY cohort_isolation_chunks ON knowledge_chunks
FOR SELECT
USING (
  cohort_id IN (
    SELECT cohort_id
    FROM user_cohorts
    WHERE user_id = auth.uid()
  )
);

-- Policy: Admins see all chunks
CREATE POLICY admin_full_access_chunks ON knowledge_chunks
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_cohorts
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- ================================
-- LECTURES POLICIES
-- ================================

-- Policy: Users see lectures from modules in their cohorts
CREATE POLICY cohort_isolation_lectures ON lectures
FOR SELECT
USING (
  module_id IN (
    SELECT m.id
    FROM modules m
    JOIN user_cohorts uc ON uc.cohort_id = m.cohort_id
    WHERE uc.user_id = auth.uid()
  )
);

-- Policy: Only admins and instructors can insert lectures
CREATE POLICY upload_permission_lectures ON lectures
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_cohorts
    WHERE user_id = auth.uid() AND role IN ('admin', 'instructor')
  )
);

-- Policy: Admins have full access to lectures
CREATE POLICY admin_full_access_lectures ON lectures
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_cohorts
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- ================================
-- RESOURCES POLICIES
-- ================================

-- Policy: Users see global resources OR resources linked to their cohort's lectures
CREATE POLICY resource_access ON resources
FOR SELECT
USING (
  is_global = true
  OR id IN (
    SELECT lr.resource_id
    FROM lecture_resources lr
    JOIN lectures l ON l.id = lr.lecture_id
    JOIN modules m ON m.id = l.module_id
    JOIN user_cohorts uc ON uc.cohort_id = m.cohort_id
    WHERE uc.user_id = auth.uid()
  )
);

-- Policy: Only admins and instructors can insert resources
CREATE POLICY upload_permission_resources ON resources
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_cohorts
    WHERE user_id = auth.uid() AND role IN ('admin', 'instructor')
  )
);

-- Policy: Admins have full access to resources
CREATE POLICY admin_full_access_resources ON resources
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_cohorts
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- ================================
-- MODULES POLICIES
-- ================================

-- Policy: Users see modules in their cohorts
CREATE POLICY cohort_isolation_modules ON modules
FOR SELECT
USING (
  cohort_id IN (
    SELECT cohort_id
    FROM user_cohorts
    WHERE user_id = auth.uid()
  )
);

-- Policy: Only admins can manage modules
CREATE POLICY admin_full_access_modules ON modules
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_cohorts
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- ================================
-- COHORTS POLICIES
-- ================================

-- Policy: Users see only cohorts they belong to
CREATE POLICY user_cohort_access ON cohorts
FOR SELECT
USING (
  id IN (
    SELECT cohort_id
    FROM user_cohorts
    WHERE user_id = auth.uid()
  )
);

-- Policy: Admins have full access to cohorts
CREATE POLICY admin_full_access_cohorts ON cohorts
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_cohorts
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- ================================
-- USER_COHORTS POLICIES
-- ================================

-- Policy: Users can see their own enrollments
CREATE POLICY user_own_enrollments ON user_cohorts
FOR SELECT
USING (user_id = auth.uid());

-- Policy: Admins can manage all enrollments
CREATE POLICY admin_manage_enrollments ON user_cohorts
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_cohorts
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);
