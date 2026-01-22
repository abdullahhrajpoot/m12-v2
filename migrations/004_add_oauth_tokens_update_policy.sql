-- Fix OAuth token refresh by adding missing UPDATE and INSERT policies
-- This allows service role to update tokens when they're refreshed
--
-- Root Cause: oauth_tokens table has RLS enabled but no UPDATE policy,
-- causing token refresh operations to silently fail (return success but update 0 rows)

-- Allow authenticated users (including service role) to UPDATE tokens
CREATE POLICY "Service role can update oauth tokens" 
ON oauth_tokens
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Allow authenticated users (including service role) to INSERT tokens
CREATE POLICY "Service role can insert oauth tokens"
ON oauth_tokens
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Verify policies were created successfully
SELECT 
  policyname, 
  cmd, 
  roles,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'oauth_tokens'
ORDER BY cmd, policyname;
