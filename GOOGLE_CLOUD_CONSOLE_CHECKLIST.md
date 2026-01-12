# Google Cloud Console - Complete Configuration Checklist

## ⚠️ CRITICAL: You MUST update Google Cloud Console for OAuth to work!

### Step 1: Find Your OAuth Client ID in Supabase

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: **fvjmzvvcyxsvstlhenex**
3. Navigate to: **Authentication → Providers → Google**
4. **Copy the Client ID** - you'll need this to find the right OAuth client in Google Cloud Console

### Step 2: Add Redirect URI to Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. **Select the correct project** (the one that matches the Client ID from Supabase)
3. Navigate to: **APIs & Services → Credentials** (left sidebar)
4. In the **OAuth 2.0 Client IDs** section, find your OAuth client
   - Look for the Client ID that matches what you copied from Supabase
   - If you see multiple, check which one matches
5. Click on the **OAuth client name** (or the edit/pencil icon)
6. Scroll down to **Authorized redirect URIs**
7. Click **+ ADD URI**
8. **Add this EXACT URI** (copy/paste to avoid typos):
   ```
   https://fvjmzvvcyxsvstlhenex.supabase.co/auth/v1/callback
   ```
9. Click **SAVE** at the bottom

### Step 3: Verify Scopes are Configured

Still in the same OAuth client settings:

1. Scroll to **Authorized JavaScript origins** (if visible)
2. Make sure these are added:
   ```
   https://fvjmzvvcyxsvstlhenex.supabase.co
   https://bippity.boo
   ```

### Step 4: Verify Client ID and Secret Match Supabase

1. In Google Cloud Console OAuth client settings:
   - **Copy the Client ID**
   - **Copy the Client Secret** (click "Reveal" if hidden)

2. Go back to Supabase Dashboard → Authentication → Providers → Google
3. **Verify these match EXACTLY**:
   - ✅ Client ID in Supabase = Client ID in Google Cloud Console
   - ✅ Client Secret in Supabase = Client Secret in Google Cloud Console

**If they don't match:**
- Update Supabase with the correct values from Google Cloud Console
- OR create a new OAuth client in Google Cloud Console and update Supabase

### Step 5: Clean Up Revoked Tokens in Supabase

Since you removed bippity's access, clean up the old tokens:

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to: **SQL Editor**
3. Run this query to see existing tokens:
   ```sql
   SELECT user_id, provider, email, created_at, updated_at
   FROM oauth_tokens
   ORDER BY updated_at DESC;
   ```

4. Delete the revoked tokens:
   ```sql
   -- Option 1: Delete all tokens (force re-auth for everyone)
   DELETE FROM oauth_tokens;
   
   -- Option 2: Delete specific user's tokens (replace with actual email)
   -- DELETE FROM oauth_tokens WHERE email = 'your-email@gmail.com';
   ```

### Step 6: Test the OAuth Flow

1. Go to `https://bippity.boo`
2. Click "Sign Up With Google"
3. You should be redirected to Google sign-in
4. After signing in and granting permissions, you should be redirected back to `/auth/callback`
5. Then redirected to `/whatwefound` or `/auth/missing-permissions`

## ✅ Complete Checklist

- [ ] Found OAuth Client ID in Supabase Dashboard
- [ ] Found matching OAuth client in Google Cloud Console
- [ ] Added redirect URI: `https://fvjmzvvcyxsvstlhenex.supabase.co/auth/v1/callback`
- [ ] Saved changes in Google Cloud Console
- [ ] Verified Client ID matches between Supabase and Google Cloud Console
- [ ] Verified Client Secret matches between Supabase and Google Cloud Console
- [ ] Cleaned up revoked tokens in Supabase
- [ ] Tested OAuth flow - sign in works!

## 🚨 Still Not Working?

### Check 1: Is the redirect URI exactly correct?
```
✅ CORRECT: https://fvjmzvvcyxsvstlhenex.supabase.co/auth/v1/callback
❌ WRONG:   https://fvjmzvvcyxsvstlhenex.supabase.co/auth/v1/callback/
❌ WRONG:   https://bippity.boo/auth/callback
❌ WRONG:   http://fvjmzvvcyxsvstlhenex.supabase.co/auth/v1/callback
```

### Check 2: Are you using the right Google Cloud project?
- The OAuth Client ID in Supabase MUST match an OAuth Client ID in Google Cloud Console
- They must be in the same Google Cloud project

### Check 3: Wait a few minutes
- Google's cache can take 1-5 minutes to update
- Clear your browser cache and try again

### Check 4: Check browser console for errors
- Open browser DevTools (F12)
- Go to Console tab
- Look for any error messages when clicking "Sign Up With Google"

### Check 5: Check Railway logs
```bash
railway logs
```
Look for any errors related to OAuth or redirect URIs

## 📸 Quick Reference: Where to Find Things

### In Supabase Dashboard:
- **Client ID**: Authentication → Providers → Google → Client ID (for OAuth)
- **Client Secret**: Authentication → Providers → Google → Client Secret (for OAuth)

### In Google Cloud Console:
- **OAuth Clients**: APIs & Services → Credentials → OAuth 2.0 Client IDs
- **Redirect URIs**: Inside each OAuth client → Authorized redirect URIs section

## 🔗 Direct Links

- [Google Cloud Console](https://console.cloud.google.com)
- [Supabase Dashboard](https://supabase.com/dashboard)
- [Supabase Project](https://supabase.com/dashboard/project/fvjmzvvcyxsvstlhenex)
