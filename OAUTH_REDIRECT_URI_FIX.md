# OAuth Redirect URI Mismatch Fix

## Problem
Error 400: `redirect_uri_mismatch` when signing in with Google OAuth.

## Root Cause
The redirect URI in the OAuth request doesn't match what's configured in Google Cloud Console. This can happen after:
- Setting up a custom domain
- Changing Supabase project settings
- Revoking app access in Google Account settings

## Solution

### Step 1: Find Your Correct Redirect URIs

Supabase Auth uses its own redirect URI format. You need to configure these in **both** places:

#### Supabase Redirect URIs
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to: **Authentication → Providers → Google**
3. Check the **Redirect URLs** section
4. You should see something like:
   - `https://[your-project-id].supabase.co/auth/v1/callback`
   - `https://[your-custom-domain].supabase.co/auth/v1/callback` (if custom domain configured)

**OR** if using a custom domain for Supabase:
- `https://auth.bippity.boo/auth/v1/callback` (or whatever your custom auth domain is)

#### What Your App Uses
Looking at your code:
- **ConnectButton** redirects to: `${appUrl}/auth/callback` 
- This becomes: `https://bippity.boo/auth/callback`
- But **Supabase Auth** actually handles the OAuth redirect first
- Supabase then redirects to your app's `/auth/callback`

### Step 2: Configure Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project
3. Navigate to: **APIs & Services → Credentials**
4. Find your **OAuth 2.0 Client ID** (the one used by Supabase)
5. Click **Edit**
6. Under **Authorized redirect URIs**, add:

```
https://[your-supabase-project-id].supabase.co/auth/v1/callback
```

**If you have a custom Supabase domain:**
```
https://auth.bippity.boo/auth/v1/callback
```

**For local development:**
```
http://localhost:54321/auth/v1/callback
```

### Step 3: Verify Supabase Configuration

In Supabase Dashboard → Authentication → Providers → Google:

1. **Enable** Google provider
2. **Client ID**: Should match Google Cloud Console
3. **Client Secret**: Should match Google Cloud Console
4. **Redirect URLs**: Should match what you added in Google Cloud Console
5. **Scopes**: Should include:
   - `email`
   - `profile`
   - `https://www.googleapis.com/auth/gmail.readonly`
   - `https://www.googleapis.com/auth/gmail.labels`
   - `https://www.googleapis.com/auth/calendar`
   - `https://www.googleapis.com/auth/tasks`

### Step 4: Clean Up Revoked Tokens

Since you removed bippity's access but didn't remove Supabase rows:

1. Go to Supabase Dashboard → SQL Editor
2. Run the cleanup script: `scripts/cleanup_revoked_tokens.sql`
3. Or manually run:
   ```sql
   -- Check existing tokens
   SELECT user_id, provider, email, created_at 
   FROM oauth_tokens 
   ORDER BY updated_at DESC;
   
   -- Delete revoked tokens (choose one):
   -- Option 1: Delete all tokens (force re-auth for everyone)
   DELETE FROM oauth_tokens;
   
   -- Option 2: Delete specific user's tokens
   DELETE FROM oauth_tokens WHERE email = 'user@example.com';
   ```

### Step 5: Test the Flow

1. Go to `https://bippity.boo`
2. Click "Sign Up With Google"
3. Complete OAuth flow
4. Should redirect to `/auth/callback` successfully

## Common Issues

### Issue 1: Supabase Project ID Not Found
**Solution**: Check your `.env` file:
```
NEXT_PUBLIC_SUPABASE_URL=https://[project-id].supabase.co
```
The `[project-id]` part is what you need for the redirect URI.

### Issue 2: Custom Domain Not Working
**Solution**: If you set up a custom domain for Supabase Auth:
- Check Supabase Dashboard → Project Settings → Custom Domains
- Use the custom auth domain in Google Cloud Console redirect URIs
- Format: `https://[custom-auth-domain]/auth/v1/callback`

### Issue 3: Multiple Redirect URIs
**Solution**: Add all variants to Google Cloud Console:
- Production: `https://[project-id].supabase.co/auth/v1/callback`
- Custom domain (if used): `https://[custom-domain]/auth/v1/callback`
- Local dev: `http://localhost:54321/auth/v1/callback`

## Verification Checklist

- [ ] Google Cloud Console has correct redirect URIs
- [ ] Supabase Dashboard has correct redirect URIs
- [ ] Supabase Google provider is enabled
- [ ] Client ID and Secret match in both places
- [ ] All required scopes are configured
- [ ] Revoked tokens are cleaned up from `oauth_tokens` table
- [ ] OAuth flow works in production
- [ ] OAuth flow works in local dev (if applicable)

## Additional Notes

- The `redirectTo` parameter in `signInWithOAuth` is for your app's callback, not the OAuth redirect
- Supabase Auth handles the OAuth redirect to Google
- Google redirects back to Supabase's `/auth/v1/callback`
- Supabase then redirects to your app's `/auth/callback`
