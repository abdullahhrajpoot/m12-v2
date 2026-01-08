-- Migration: Simplify onboarding_summaries table
-- Removes unused fields: children, unassigned_schools, unassigned_activities, raw_ai_output, emails_analyzed_count
-- Date: 2025-12-25

-- Drop unused columns
ALTER TABLE onboarding_summaries 
  DROP COLUMN IF EXISTS children,
  DROP COLUMN IF EXISTS unassigned_schools,
  DROP COLUMN IF EXISTS unassigned_activities,
  DROP COLUMN IF EXISTS raw_ai_output,
  DROP COLUMN IF EXISTS emails_analyzed_count;

-- Ensure status has a default and constraint (if not already present)
ALTER TABLE onboarding_summaries 
  ALTER COLUMN status SET DEFAULT 'pending_review';

-- Add constraint for status values if not already present
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'onboarding_summaries_status_check'
  ) THEN
    ALTER TABLE onboarding_summaries 
      ADD CONSTRAINT onboarding_summaries_status_check 
      CHECK (status IN ('pending_review', 'completed', 'reviewed'));
  END IF;
END $$;

-- Ensure summary_sentences has a default
ALTER TABLE onboarding_summaries 
  ALTER COLUMN summary_sentences SET DEFAULT '{}';

-- Add comment to document the simplified schema
COMMENT ON TABLE onboarding_summaries IS 'Simplified schema: Stores AI-extracted facts from onboarding email scan. Only essential fields retained.';





