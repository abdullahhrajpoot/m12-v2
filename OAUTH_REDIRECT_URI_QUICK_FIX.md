# Quick Fix: OAuth Redirect URI Mismatch

## ✅ Your Correct Redirect URI

**Add this to Google Cloud Console:**
```
https://fvjmzvvcyxsvstlhenex.supabase.co/auth/v1/callback
```

## 🔧 Step-by-Step Fix

### Step 1: Add Redirect URI to Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project (the one used by Supabase for OAuth)
3. Navigate to: **APIs & Services → Credentials**
4. Find your **OAuth 2.0 Client ID** (the one configured in Supabase Dashboard)
5. Click **Edit** (pencil icon)
6. Scroll to **Authorized redirect URIs**
7. Click **+ ADD URI**
8. Add: `https://fvjmzvvcyxsvstlhenex.supabase.co/auth/v1/callback`
9. Click **SAVE**

### Step 2: Verify Supabase Configuration

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to: **Authentication → Providers → Google**
4. Verify:
   - ✅ Google provider is **Enabled**
   - ✅ **Client ID** matches Google Cloud Console
   - ✅ **Client Secret** matches Google Cloud Console
   - ✅ **Redirect URLs** includes: `https://fvjmzvvcyxsvstlhenex.supabase.co/auth/v1/callback`

### Step 3: Clean Up Revoked Tokens

Since you removed bippity's access but didn't remove Supabase rows:

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to: **SQL Editor**
3. Run this query to see existing tokens:
   ```sql
   SELECT user_id, provider, email, created_at, updated_at
   FROM oauth_tokens
   ORDER BY updated_at DESC;
   ```

4. Delete revoked tokens (choose one option):

   **Option A: Delete all tokens** (force re-auth for everyone)
   ```sql
   DELETE FROM oauth_tokens;
   ```

   **Option B: Delete specific user's tokens**
   ```sql
   DELETE FROM oauth_tokens WHERE email = 'user@example.com';
   ```

   **Option C: Delete old tokens** (older than 30 days)
   ```sql
   DELETE FROM oauth_tokens WHERE updated_at < NOW() - INTERVAL '30 days';
   ```

### Step 4: Test the Flow

1. Go to `https://bippity.boo`
2. Click "Sign Up With Google"
3. Complete OAuth flow
4. Should redirect successfully to `/auth/callback`

## 🚨 Common Issues

### Issue: "Still getting redirect_uri_mismatch"
- **Solution**: Make sure you added the exact URI: `https://fvjmzvvcyxsvstlhenex.supabase.co/auth/v1/callback`
- Check for typos or trailing slashes
- Wait a few minutes for Google's cache to update

### Issue: "Multiple redirect URIs needed"
- **Solution**: Add all variants to Google Cloud Console:
  - `https://fvjmzvvcyxsvstlhenex.supabase.co/auth/v1/callback` (production)
  - `http://localhost:54321/auth/v1/callback` (local dev)

### Issue: "Which OAuth Client ID?"
- **Solution**: Use the one configured in Supabase Dashboard → Authentication → Providers → Google
- The Client ID should match exactly between Supabase and Google Cloud Console

## 📋 Checklist

- [ ] Added redirect URI to Google Cloud Console
- [ ] Verified Supabase Google provider is enabled
- [ ] Verified Client ID matches in both places
- [ ] Verified Client Secret matches in both places
- [ ] Cleaned up revoked tokens from `oauth_tokens` table
- [ ] Tested OAuth flow in production
- [ ] OAuth redirects successfully

## 🔍 Verify Your Configuration

Run this script to find your Supabase redirect URI:
```bash
node scripts/find_supabase_redirect_uri.js
```

## 📚 Additional Resources

- Full documentation: `OAUTH_REDIRECT_URI_FIX.md`
- Cleanup script: `scripts/cleanup_revoked_tokens.sql`
- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
