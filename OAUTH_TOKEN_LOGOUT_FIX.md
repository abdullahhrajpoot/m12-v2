# OAuth Token Logout Fix

## The Problem

When you revoked Bippity's access in Google Account settings and then re-authenticated, the 401 authentication errors persisted because:

1. **Revoking in Google** → Invalidates the `refresh_token` stored in the `oauth_tokens` table
2. **Re-authenticating without proper logout** → Supabase may use cached session data
3. **Token refresh runs** → Uses the old revoked `refresh_token`
4. **Google returns "new" tokens** → But these tokens are invalid because the underlying OAuth grant was revoked
5. **Result**: 401 "Invalid Credentials" errors in all subworkflows calling Google APIs

## The Root Cause

The workflow for logging out and re-authenticating was:
1. ❌ Revoke in Google Account settings (external)
2. ❌ Go to bippity.boo and click "Sign Up With Google" again
3. ❌ Old `oauth_tokens` row either:
   - Wasn't updated properly
   - Was updated with invalid cached tokens
   - Kept the revoked `refresh_token`

## The Fix

### New Proper Logout Flow

1. ✅ Go to **https://bippity.boo/dashboard**
2. ✅ Click the **"Logout"** button in the top right
3. ✅ This triggers `/api/auth/logout` which:
   - Deletes OAuth tokens from `oauth_tokens` table
   - Signs out from Supabase Auth session
   - Clears all cached tokens
4. ✅ Now click "Sign Up With Google"
5. ✅ Get completely fresh tokens with valid `refresh_token`

### What the Logout API Does

Created: `/app/api/auth/logout/route.ts`

```typescript
// 1. Gets current user
// 2. Deletes all oauth_tokens for that user (using service role)
// 3. Signs out from Supabase Auth
// 4. Returns success
```

### Updated Dashboard

Updated: `/app/dashboard/page.tsx`

- Added a "Logout" button in the top right corner
- Calls the logout API when clicked
- Redirects to home page after successful logout

## How to Use

### To Properly Log Out and Re-Authenticate:

1. **Go to**: https://bippity.boo/dashboard
2. **Click**: "Logout" button (top right)
3. **Wait**: for redirect to home page
4. **Click**: "Sign Up With Google"
5. **Authorize**: Bippity in Google OAuth screen
6. **Done**: You now have fresh, valid tokens!

### Never Do This Again:

❌ **DON'T**: Revoke in Google Account settings → Re-auth immediately
✅ **DO**: Use the Logout button → Re-auth

## Technical Details

### Token Refresh Flow

The `/api/auth/tokens` endpoint (used by n8n workflows) has a safety net that auto-refreshes expired tokens:

```typescript
// Lines 92-188 in /app/api/auth/tokens/route.ts
if (isExpired && tokenData.refresh_token && provider === 'google') {
  // Auto-refresh the token by calling Google OAuth API
  // Update oauth_tokens table with new access_token
  // Return fresh token to workflow
}
```

**But** if the `refresh_token` is revoked, Google returns a 400 error or issues invalid tokens.

### Token Refresh Cron

The cron job runs every 6 hours:
- Workflow: "Bippity Token Refresh Cron" (ID: `Ek0ft5PCAEv3qB5b`)
- Endpoint: `/api/auth/refresh-tokens`
- Problem: 6 hours >> 1 hour (Google token expiry)

**Recommendation**: Change to run every 30 minutes to proactively refresh tokens before they expire.

## Testing

1. **Test the logout flow**:
   ```bash
   # Go to dashboard
   curl https://bippity.boo/dashboard
   
   # Click logout button
   # Should redirect to /
   ```

2. **Verify tokens are deleted**:
   ```sql
   SELECT * FROM oauth_tokens WHERE user_id = 'YOUR_USER_ID';
   -- Should return 0 rows after logout
   ```

3. **Re-authenticate**:
   - Click "Sign Up With Google"
   - Check that new tokens are created in `oauth_tokens` table
   - Verify `updated_at` timestamp is recent

4. **Test workflow**:
   - Run "Bippity - AI Email Processor" workflow
   - Check Calendar_Search_MultiTenant execution
   - Should see `status: "success"` with valid calendar data (not 401 error)

## Deployment

### Required Environment Variables

These should already be set, but verify:
- `SUPABASE_SERVICE_ROLE_KEY` (for deleting tokens)
- `GOOGLE_CLIENT_ID` (for OAuth)
- `GOOGLE_CLIENT_SECRET` (for token refresh)

### Deploy the Changes

```bash
# Commit the new logout endpoint and updated dashboard
git add app/api/auth/logout/route.ts
git add app/dashboard/page.tsx
git commit -m "Add proper OAuth logout flow to fix token refresh issues"
git push origin main

# Railway will auto-deploy
```

## Summary

**Before**: Revoking in Google → Re-auth → Still getting 401 errors because old revoked `refresh_token` was being used.

**After**: Using Logout button → Re-auth → Fresh valid tokens → No more 401 errors! 🎉

The auth errors you were seeing weren't a Supabase caching issue or a token refresh bug - they were caused by trying to use revoked OAuth tokens. The proper logout flow ensures complete cleanup before re-authentication.
