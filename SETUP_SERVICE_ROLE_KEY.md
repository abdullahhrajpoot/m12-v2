# Setting Up Supabase Service Role Key

## Step 1: Get Service Role Key from Supabase Dashboard

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project (the one with project ref: `fvjmzvvcyxsvstlhenex`)
3. Navigate to **Settings** (gear icon in sidebar)
4. Click on **API** in the settings menu
5. Scroll down to **Project API keys** section
6. Find the **`service_role`** key (or **Service Role Key**)
   - ⚠️ **Important**: This is different from the `anon` key
   - It's typically labeled as "secret" or "service_role"
7. Click **Reveal** or **Copy** to copy the key

**The key will look something like:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2am16dnZjeXhzdnN0bGhlbmV4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mjk2MzkzMywiZXhwIjoyMDc4NTM5OTMzfQ.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## Step 2: Add to Local Development (.env.local)

Add the service role key to your `.env.local` file:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://fvjmzvvcyxsvstlhenex.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (your anon key)

# Supabase Service Role Key (for server-side Admin API access)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (your service role key)

# n8n API Key (generate a secure random key)
# This key is used for service-to-service authentication between n8n and Next.js
# Must be set in BOTH Railway AND n8n Cloud (same value in both places)
N8N_API_KEY=your-secure-random-key-here
```

## Step 3: Add to Railway Environment Variables

1. Go to [Railway Dashboard](https://railway.app)
2. Select your **bippity-boo** project
3. Click on your service (the Next.js app)
4. Go to the **Variables** tab
5. Click **+ New Variable**
6. Add these variables:

   **Variable 1:**
   - **Key:** `SUPABASE_SERVICE_ROLE_KEY`
   - **Value:** (paste your service role key from Step 1)
   - **Description:** Supabase service role key for Admin API access

   **Variable 2:**
   - **Key:** `N8N_API_KEY`
   - **Value:** (generate a secure key - see below)
   - **Description:** API key for n8n workflows to authenticate token requests. **Note:** This same key must also be set in n8n Cloud environment variables.

## Step 4: Generate N8N_API_KEY

You need a secure random key for service-to-service authentication between n8n and your Next.js app. **This same key must be set in both Railway AND n8n Cloud.**

Generate one using:

```bash
# Option 1: Using OpenSSL
openssl rand -hex 32

# Option 2: Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Option 3: Using Python
python3 -c "import secrets; print(secrets.token_hex(32))"
```

This will generate something like:
```
a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456
```

Copy this value and use it as your `N8N_API_KEY` in:
1. **Railway** (Next.js app environment) - to validate incoming requests
2. **n8n Cloud** (n8n environment variables) - for workflows to authenticate requests

### Step 4b: Add N8N_API_KEY to n8n Cloud

1. Go to your n8n Cloud instance
2. Navigate to **Settings** → **Environment Variables** (or similar)
3. Add a new environment variable:
   - **Key:** `N8N_API_KEY`
   - **Value:** (use the same key value from Step 4)
4. Save the variable

**Why two places?**
- **Railway**: Next.js uses `process.env.N8N_API_KEY` to validate requests from n8n
- **n8n Cloud**: n8n workflows use `$env.N8N_API_KEY` to authenticate when calling your Next.js API

Both services need the **same shared secret** for authentication.

## Step 5: Redeploy

After adding the environment variables to Railway:

1. Railway will automatically trigger a new deployment
2. Wait for deployment to complete (usually 2-3 minutes)
3. The new environment variables will be available to your application

## Security Notes

⚠️ **CRITICAL SECURITY WARNINGS:**

1. **Service Role Key:**
   - ⚠️ **NEVER** commit this key to git
   - ⚠️ **NEVER** expose it in client-side code
   - ⚠️ **NEVER** log it or include it in error messages
   - ✅ Only use it in **server-side** API routes
   - ✅ It bypasses Row Level Security - use with caution

2. **N8N_API_KEY:**
   - ⚠️ Keep it secret and only share with n8n workflows
   - ⚠️ Don't commit to git
   - ⚠️ Must be set in **both Railway AND n8n Cloud** (same value)
   - ✅ Use it to authenticate n8n's requests to `/api/auth/tokens`
   - **Railway**: Validates incoming requests (compares header to `process.env.N8N_API_KEY`)
   - **n8n Cloud**: Workflows use it in Authorization header (`Bearer $env.N8N_API_KEY`)

3. **Both keys are already in `.gitignore`:**
   - Your `.env.local` file is ignored by git
   - Never commit `.env.local` or any files containing these keys

## Verification

After setting up, verify the keys are working:

1. **Check Railway logs:**
   ```bash
   # In Railway dashboard → Service → Deployments → View Logs
   # Look for any errors about missing environment variables
   ```

2. **Test locally (if needed):**
   ```bash
   # Make sure .env.local has the keys
   cat .env.local | grep SUPABASE_SERVICE_ROLE_KEY
   cat .env.local | grep N8N_API_KEY
   ```

3. **Test API endpoint (after deployment):**
   ```bash
   # This should work after tokens are stored
   curl -X GET "https://bippity.boo/api/auth/tokens?userId=YOUR_USER_ID&provider=google" \
     -H "Authorization: Bearer YOUR_N8N_API_KEY"
   ```

## Quick Reference

| Key | Where to Find | Where to Set | Purpose |
|-----|---------------|--------------|---------|
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Settings → API | Railway Variables, `.env.local` | Server-side Admin API access |
| `N8N_API_KEY` | Generate new (see Step 4) | Railway Variables, `.env.local` | Authenticate n8n API requests |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard → Settings → API | Already set | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → Settings → API | Already set | Public anon key (safe for client) |


