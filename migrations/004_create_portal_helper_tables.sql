-- Create portal_credentials table for storing family portal login information
CREATE TABLE IF NOT EXISTS portal_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  portal_name TEXT NOT NULL,
  portal_url TEXT,
  login_username TEXT NOT NULL,
  login_password TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create captured_content table for storing manually pasted content
CREATE TABLE IF NOT EXISTS captured_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  portal_credential_id UUID NOT NULL REFERENCES portal_credentials(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_portal_credentials_user_id ON portal_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_portal_credentials_portal_name ON portal_credentials(portal_name);
CREATE INDEX IF NOT EXISTS idx_captured_content_user_id ON captured_content(user_id);
CREATE INDEX IF NOT EXISTS idx_captured_content_portal_id ON captured_content(portal_credential_id);
CREATE INDEX IF NOT EXISTS idx_captured_content_processed ON captured_content(processed);

-- Enable RLS
ALTER TABLE portal_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE captured_content ENABLE ROW LEVEL SECURITY;

-- RLS Policies for portal_credentials
CREATE POLICY "Users can view their own portal credentials" ON portal_credentials
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own portal credentials" ON portal_credentials
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own portal credentials" ON portal_credentials
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own portal credentials" ON portal_credentials
  FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for captured_content
CREATE POLICY "Users can view their own captured content" ON captured_content
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own captured content" ON captured_content
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own captured content" ON captured_content
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own captured content" ON captured_content
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add comments
COMMENT ON TABLE portal_credentials IS 'Stores portal login credentials for families';
COMMENT ON TABLE captured_content IS 'Stores manually captured content from portals for processing';
COMMENT ON COLUMN portal_credentials.portal_name IS 'Name of the portal (e.g., ParentSquare, School Website)';
COMMENT ON COLUMN portal_credentials.portal_url IS 'URL of the portal login page';
COMMENT ON COLUMN captured_content.processed IS 'Whether the content has been sent to the agent for processing';
