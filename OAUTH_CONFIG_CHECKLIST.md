# OAuth Configuration Checklist

## Critical: All Three Must Match

The SAME Google OAuth credentials must be used in:
1. **Google Cloud Console** (where you created the OAuth client)
2. **Supabase Dashboard** (Authentication → Providers → Google)
3. **Railway Environment Variables** (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`)

If ANY of these don't match, token refresh will fail with `unauthorized_client`.

---

## Step 1: Google Cloud Console

1. Go to https://console.cloud.google.com/apis/credentials
2. Find your OAuth 2.0 Client ID
3. Note down:
   - **Client ID**: `xxxxxxx.apps.googleusercontent.com`
   - **Client Secret**: `GOCSPX-xxxxxxxxxx`
4. Check **Authorized redirect URIs** includes:
   - `https://fvjmzvvcyxsvstlhenex.supabase.co/auth/v1/callback`
   - `https://api.bippity.boo/auth/v1/callback` (if using custom domain)

---

## Step 2: Supabase Dashboard

1. Go to https://supabase.com/dashboard/project/fvjmzvvcyxsvstlhenex/auth/providers
2. Find **Google** provider
3. Verify:
   - **Client ID** matches Google Console exactly
   - **Client Secret** matches Google Console exactly
4. Go to URL Configuration:
   - **Site URL**: `https://bippity.boo`
   - **Redirect URLs**: includes `https://bippity.boo/auth/callback`

---

## Step 3: Railway Environment Variables

1. Go to Railway dashboard → your project → Variables
2. Verify these are set:
   - `GOOGLE_CLIENT_ID` = same as Google Console
   - `GOOGLE_CLIENT_SECRET` = same as Google Console
   - `NEXT_PUBLIC_GOOGLE_CLIENT_ID` = same as above (optional, fallback)

---

## Common Mismatches

| Symptom | Likely Cause |
|---------|--------------|
| `unauthorized_client` during refresh | Client ID/Secret mismatch between Railway and Supabase |
| `redirect_uri_mismatch` | Missing redirect URI in Google Console |
| `invalid_grant` | Refresh token was revoked (user needs to re-auth) |
| 401 from Gmail API | Token expired and refresh failed |

---

## How to Fix Mismatch

1. **Pick ONE source of truth**: Use the credentials from Google Cloud Console
2. **Update Supabase**: Copy Client ID and Secret from Google Console to Supabase
3. **Update Railway**: Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` to match
4. **Redeploy Railway**: Changes to env vars require redeployment
5. **Clear old tokens**: Delete rows from `oauth_tokens` table in Supabase
6. **Test fresh auth**: Sign out, clear cookies, sign in again

---

## Verification Command

Test the token endpoint directly:
```bash
curl -X GET "https://bippity.boo/api/auth/tokens?userId=YOUR_USER_ID&provider=google" \
  -H "Authorization: Bearer YOUR_N8N_API_KEY"
```

Expected response if working:
```json
{
  "provider": "google",
  "access_token": "ya29.xxxxx...",
  "is_expired": false
}
```

If you see `is_expired: true` and refresh fails, credentials are mismatched.
