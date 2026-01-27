-- Migration: Create task management tables for family-based task system
-- Purpose: Enable task tracking with family membership and RLS policies

-- Create families table
CREATE TABLE IF NOT EXISTS families (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create family_members table
CREATE TABLE IF NOT EXISTS family_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  display_name TEXT,
  unipile_account_id TEXT,
  role TEXT DEFAULT 'member',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for family_members
CREATE INDEX IF NOT EXISTS idx_family_members_email ON family_members(email);
CREATE INDEX IF NOT EXISTS idx_family_members_family_id ON family_members(family_id);
CREATE INDEX IF NOT EXISTS idx_family_members_unipile_account ON family_members(unipile_account_id) 
  WHERE unipile_account_id IS NOT NULL;

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'not_done',
  source_type TEXT,
  source_id TEXT,
  source_snippet TEXT,
  feedback TEXT,
  feedback_submitted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT valid_status CHECK (status IN ('done', 'not_done', 'skipped', 'dismissed'))
);

-- Create indexes for tasks
CREATE INDEX IF NOT EXISTS idx_tasks_family_id ON tasks(family_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_family_status ON tasks(family_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_family_due_date ON tasks(family_id, due_date) 
  WHERE status = 'not_done';

-- Enable Row Level Security
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user's email from Supabase auth
CREATE OR REPLACE FUNCTION current_user_email()
RETURNS TEXT AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claims', true)::json->>'email',
    ''
  );
$$ LANGUAGE SQL STABLE;

-- RLS Policies for families table
CREATE POLICY "Users can view their family"
  ON families FOR SELECT
  USING (
    id IN (
      SELECT family_id FROM family_members 
      WHERE email = current_user_email()
    )
  );

CREATE POLICY "Users can update their family"
  ON families FOR UPDATE
  USING (
    id IN (
      SELECT family_id FROM family_members 
      WHERE email = current_user_email()
    )
  );

-- RLS Policies for family_members table
CREATE POLICY "Users can view their family members"
  ON family_members FOR SELECT
  USING (
    family_id IN (
      SELECT family_id FROM family_members 
      WHERE email = current_user_email()
    )
  );

CREATE POLICY "Users can update their own member record"
  ON family_members FOR UPDATE
  USING (email = current_user_email());

-- RLS Policies for tasks table
CREATE POLICY "Users can view their family tasks"
  ON tasks FOR SELECT
  USING (
    family_id IN (
      SELECT family_id FROM family_members 
      WHERE email = current_user_email()
    )
  );

CREATE POLICY "Users can update their family tasks"
  ON tasks FOR UPDATE
  USING (
    family_id IN (
      SELECT family_id FROM family_members 
      WHERE email = current_user_email()
    )
  );

CREATE POLICY "Users can insert tasks for their family"
  ON tasks FOR INSERT
  WITH CHECK (
    family_id IN (
      SELECT family_id FROM family_members 
      WHERE email = current_user_email()
    )
  );

CREATE POLICY "Users can delete their family tasks"
  ON tasks FOR DELETE
  USING (
    family_id IN (
      SELECT family_id FROM family_members 
      WHERE email = current_user_email()
    )
  );

-- Service role policies (for backend operations)
-- These allow the service role key to bypass RLS for system operations
CREATE POLICY "Service role can manage families"
  ON families FOR ALL
  USING (current_setting('role') = 'service_role')
  WITH CHECK (current_setting('role') = 'service_role');

CREATE POLICY "Service role can manage family_members"
  ON family_members FOR ALL
  USING (current_setting('role') = 'service_role')
  WITH CHECK (current_setting('role') = 'service_role');

CREATE POLICY "Service role can manage tasks"
  ON tasks FOR ALL
  USING (current_setting('role') = 'service_role')
  WITH CHECK (current_setting('role') = 'service_role');

-- Comments for documentation
COMMENT ON TABLE families IS 'Family groups that share tasks';
COMMENT ON TABLE family_members IS 'Users belonging to families';
COMMENT ON TABLE tasks IS 'Task items for families';

COMMENT ON COLUMN tasks.status IS 'Task status: done, not_done, skipped, dismissed';
COMMENT ON COLUMN tasks.source_type IS 'Where task came from: email, manual, etc.';
COMMENT ON COLUMN tasks.source_id IS 'Reference ID to source (e.g., unified_events.id)';
COMMENT ON COLUMN tasks.source_snippet IS 'Preview text from source';
COMMENT ON COLUMN tasks.feedback IS 'User feedback about the task';
COMMENT ON COLUMN tasks.completed_at IS 'Timestamp when task status changed to done';
