# OAuth Configuration Issue - Next Steps

## Status: RLS Fix Complete ✅ | OAuth Config Issue Identified ❌

### What We Fixed (RLS Issue)
✅ Added UPDATE and INSERT policies to `oauth_tokens` table  
✅ Database now successfully persists token updates  
✅ Multiple updates confirmed (no longer just 1 update)  
✅ Migration `004_add_oauth_tokens_update_policy.sql` applied successfully

### Separate Issue: OAuth Tokens Invalid

**Problem:** Google Calendar/Tasks API returns 401 "UNAUTHENTICATED" for all tokens, including fresh ones after login.

**Evidence:**
```bash
curl test to Google Calendar API with current token → 401 Invalid Credentials
```

**Root Cause:** OAuth configuration mismatch between:
- Google Cloud Console OAuth Client
- Supabase Auth Provider settings  
- Railway environment variables

### Next Steps to Fix OAuth

#### 1. Verify Google Cloud Console Settings

Go to: https://console.cloud.google.com/apis/credentials

**Check OAuth 2.0 Client ID:**
- Application type: Web application
- Authorized redirect URIs must include:
  ```
  https://[your-project-ref].supabase.co/auth/v1/callback
  ```
- Note the Client ID and Client Secret

#### 2. Verify Supabase Auth Configuration

In Supabase Dashboard → Authentication → Providers → Google:

**Must match Google Cloud Console:**
- Client ID (from Google Cloud Console)
- Client Secret (from Google Cloud Console)  
- Authorized Client IDs (if using)

**Scopes required:**
```
https://www.googleapis.com/auth/calendar
https://www.googleapis.com/auth/tasks
https://www.googleapis.com/auth/gmail.readonly
https://www.googleapis.com/auth/userinfo.email
https://www.googleapis.com/auth/userinfo.profile
openid
```

#### 3. Verify Railway Environment Variables

Check that Railway has matching credentials:

```bash
GOOGLE_CLIENT_ID=<same as Supabase>
GOOGLE_CLIENT_SECRET=<same as Supabase>
NEXT_PUBLIC_GOOGLE_CLIENT_ID=<same as above>
```

**Location in code:**  
- Used in: `app/api/auth/tokens/route.ts` (line 108-109)
- Used for: Token refresh operations

#### 4. Check OAuth Consent Screen

In Google Cloud Console → OAuth consent screen:

- **Publishing status:** Should be "In production" (not "Testing")
- **User type:** External
- **Scopes:** All required scopes added
- **Test users:** If in "Testing" mode, only test users can authenticate

#### 5. Re-authenticate After Fixing

Once configuration is corrected:

1. User must log out completely
2. Clear Supabase auth session
3. Log back in fresh
4. This will create a NEW valid token

### How to Test OAuth Fix

**After configuration changes:**

```bash
# 1. Get fresh token (log out/in)
# 2. Test with Google API
curl "https://www.googleapis.com/calendar/v3/users/me/calendarList" \
  -H "Authorization: Bearer YOUR_NEW_TOKEN"

# Should return calendar list, NOT 401 error
```

### Files to Review

1. **Google Cloud Console:**
   - OAuth 2.0 Client ID settings
   - OAuth consent screen status
   - Enabled APIs (Calendar, Tasks, Gmail)

2. **Supabase Dashboard:**
   - Authentication → Providers → Google
   - Verify Client ID/Secret match

3. **Railway:**
   - Environment variables
   - GOOGLE_CLIENT_ID
   - GOOGLE_CLIENT_SECRET

### Common Causes of Invalid Tokens

1. **Redirect URI Mismatch**
   - Google rejects token if redirect URI doesn't match exactly
   - Check: Supabase callback URL vs Google Cloud Console settings

2. **Client Secret Mismatch**  
   - Wrong secret in Supabase or Railway
   - Token refresh will fail with invalid_client

3. **Revoked Access**
   - User revoked app access in Google Account settings
   - Solution: Re-authenticate

4. **App Not Verified**
   - App in "Testing" mode with restricted users
   - Solution: Publish app or add test users

5. **Expired OAuth Client**
   - Rare but possible if credentials rotated
   - Solution: Generate new credentials

### Documentation References

- [Supabase Auth Providers](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Google OAuth 2.0 Setup](https://developers.google.com/identity/protocols/oauth2)
- [Google Calendar API Auth](https://developers.google.com/calendar/api/guides/auth)

---

**Bottom Line:** The RLS database fix is working perfectly. The OAuth issue is a configuration problem requiring alignment between Google Cloud Console, Supabase Auth, and Railway environment variables.
