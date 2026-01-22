# Token Invalid - Diagnostic Steps

## Current Status

- **Token in Supabase**: Shows as "valid" until `2026-01-14 21:42:24`
- **Token Refresh Cron**: Configured correctly (using HTTP Header Auth)
- **Issue**: Token is invalid when used in API calls (401 errors)

## Possible Causes

1. **Refresh Token Revoked**: Google may have revoked the refresh token (user changed password, revoked app access, etc.)
2. **Access Token Revoked**: Even if not expired, Google may have revoked the access token
3. **Token Refresh Failing**: The refresh process may be failing silently

## Diagnostic Steps

### 1. Test Token Refresh Manually

Call the refresh endpoint to see the exact error:

```bash
curl -X POST "https://bippity.boo/api/auth/refresh-tokens?hoursBeforeExpiry=24&provider=google" \
  -H "Authorization: Bearer YOUR_N8N_API_KEY"
```

**Expected responses:**
- ✅ `{"success": true, "refreshed": 1}` - Token refreshed successfully
- ❌ `{"error": "invalid_grant"}` - Refresh token is invalid/revoked (needs re-auth)
- ❌ `{"error": "invalid_client"}` - OAuth credentials misconfigured
- ❌ `{"error": "unauthorized"}` - API key issue

### 2. Check Token Refresh Cron Execution

The cron should run every 6 hours. Check recent executions:
- n8n workflow: `Bippity Token Refresh Cron` (ID: `Ek0ft5PCAEv3qB5b`)
- Look for execution logs showing refresh success/failure

### 3. Test Access Token Directly

Try using the access token with Google API:

```bash
# Get token from Supabase
TOKEN="ya29.a0AUMWg_JU2RSVOyCittGy3id..."

# Test with Google Tasks API
curl "https://www.googleapis.com/tasks/v1/users/@me/lists" \
  -H "Authorization: Bearer $TOKEN"
```

**Expected responses:**
- ✅ `200 OK` with task lists - Token is valid
- ❌ `401 Unauthorized` - Token is invalid/revoked

### 4. Check On-Demand Refresh

The `/api/auth/tokens` endpoint should automatically refresh expired tokens. Test it:

```bash
curl -X GET "https://bippity.boo/api/auth/tokens?userId=8ac8bfee-c53a-4c35-b2d0-f92b0906b146&provider=google" \
  -H "Authorization: Bearer YOUR_N8N_API_KEY"
```

Check the response:
- If `is_expired: true` and `was_refreshed: true` - Refresh worked
- If `is_expired: true` and `needs_reauth: true` - Refresh failed, re-auth needed

## Solution

### If Refresh Token is Invalid

The user needs to **re-authenticate**:

1. Go to the app and click "Sign Up With Google" again
2. This will generate new tokens and store them in Supabase
3. The new tokens should work immediately

### If Access Token is Invalid but Refresh Works

The on-demand refresh in `/api/auth/tokens` should handle this automatically. The next time the workflow runs, it will:
1. Detect expired token
2. Automatically refresh it
3. Return the new token

### If Both Tokens are Invalid

User must re-authenticate through the OAuth flow.

## Prevention

The token refresh cron should proactively refresh tokens before they expire. Make sure:
1. ✅ Cron is active and running every 6 hours
2. ✅ HTTP Header Auth credential is configured correctly
3. ✅ `N8N_API_KEY` is set in the credential

## Next Steps

1. **Immediate**: Test the refresh endpoint manually to see the exact error
2. **Short-term**: If refresh fails, user needs to re-authenticate
3. **Long-term**: Monitor the refresh cron to ensure it's working
