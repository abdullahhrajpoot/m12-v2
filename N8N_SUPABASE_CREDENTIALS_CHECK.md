# n8n Supabase Credentials Check

## Current Situation

You have `SUPABASE_SERVICE_ROLE_KEY` in n8n environment variables:
- Value: `eyJhbGciOiJIUzI1NiIs...` (JWT format - ✅ correct)
- Reference: `$vars.SUPABASE_SERVICE_ROLE_KEY`

## Why n8n Needs This

Your workflows use **Supabase nodes directly** to:
- Check if user exists in `users` table
- Create new users
- Update user status
- Save onboarding summaries
- Read/write to `oauth_tokens` table (via Next.js API, not directly)

These nodes need Supabase credentials to connect to your database.

## What Should Be in n8n Environment Variables

### Required Variables:

1. **`SUPABASE_SERVICE_ROLE_KEY`** ✅ (you have this)
   - Used by Supabase nodes for admin operations
   - Should match the value in Railway
   - Format: JWT token starting with `eyJhbGciOiJIUzI1NiIs...`

2. **`N8N_API_KEY`** ✅ (you should have this too)
   - Used for n8n → Next.js API authentication
   - Must match the value in Railway
   - Used in HTTP Request nodes calling `/api/auth/tokens`

3. **Optional: `NEXT_PUBLIC_SUPABASE_URL`**
   - If Supabase nodes are configured to use environment variables
   - Should be: `https://api.bippity.boo` (your custom domain)

## Verification Checklist

### 1. Verify Service Role Key Matches

**In Railway:**
- Go to Railway Dashboard → Service → Variables
- Find `SUPABASE_SERVICE_ROLE_KEY`
- Copy the value (first 30 chars)

**In n8n:**
- Go to Settings → Environment Variables
- Find `SUPABASE_SERVICE_ROLE_KEY`
- Compare first 30 chars

**They should match exactly!**

### 2. Verify Supabase Node Credentials

Check if Supabase nodes are using:
- **Environment variable** (`$vars.SUPABASE_SERVICE_ROLE_KEY`)
- **OR** n8n credential named "Supabase account"

**To check in workflow:**
1. Open a Supabase node (e.g., "Check if User Exists")
2. Check the credentials field
3. Should reference either:
   - Environment variable: `$vars.SUPABASE_SERVICE_ROLE_KEY`
   - OR n8n credential: "Supabase account" (ID: `LiyXJ3va3HnvvAkS`)

### 3. Check n8n Credentials

If using n8n credentials (not env vars):
1. Go to n8n → Settings → Credentials
2. Find "Supabase account" (ID: `LiyXJ3va3HnvvAkS`)
3. Verify it has:
   - **Host**: `https://api.bippity.boo` (or `https://fvjmzvvcyxsvstlhenex.supabase.co`)
   - **Service Role Secret**: Should match Railway `SUPABASE_SERVICE_ROLE_KEY`

## Potential Issues

### Issue 1: Mismatched Service Role Key
**Symptom**: Supabase nodes fail with auth errors
**Solution**: Ensure Railway and n8n have the same `SUPABASE_SERVICE_ROLE_KEY`

### Issue 2: Wrong Supabase URL
**Symptom**: Connection errors from Supabase nodes
**Solution**: 
- If using env var: Set `NEXT_PUBLIC_SUPABASE_URL=https://api.bippity.boo`
- If using credential: Update credential host to `https://api.bippity.boo`

### Issue 3: Service Role Key Not Used Correctly
**Symptom**: RLS errors when Supabase nodes try to write
**Solution**: Ensure nodes are using service role key, not anon key

## Recommendation

**Keep `SUPABASE_SERVICE_ROLE_KEY` in n8n environment variables** - this is correct!

Just verify:
1. ✅ It matches the value in Railway
2. ✅ Supabase nodes are configured to use it (either via env var or credential)
3. ✅ The Supabase URL is correct (`https://api.bippity.boo`)
