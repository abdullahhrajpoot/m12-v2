-- Create waitlist table for early access signups
CREATE TABLE IF NOT EXISTS waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  contacted BOOLEAN DEFAULT FALSE,
  contacted_at TIMESTAMPTZ,
  notes TEXT
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_waitlist_email ON waitlist(email);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_waitlist_created_at ON waitlist(created_at DESC);

-- Create index on contacted status for filtering
CREATE INDEX IF NOT EXISTS idx_waitlist_contacted ON waitlist(contacted);

-- Add RLS policies (table is only accessible via service role key in API)
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

-- Create a policy that only allows service role access
-- This means regular authenticated users cannot query the waitlist table directly
CREATE POLICY "Service role only access" ON waitlist
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Add comment to table
COMMENT ON TABLE waitlist IS 'Stores email addresses and reasons from users requesting early access';
COMMENT ON COLUMN waitlist.email IS 'User email address (unique)';
COMMENT ON COLUMN waitlist.reason IS 'Optional reason why user wants access';
COMMENT ON COLUMN waitlist.contacted IS 'Whether we have reached out to this user';
COMMENT ON COLUMN waitlist.contacted_at IS 'When we contacted this user';
COMMENT ON COLUMN waitlist.notes IS 'Internal notes about this waitlist entry';
