# Guide: Clear All Users and Tokens

This guide explains how to completely reset your Supabase and Unipile accounts for a fresh start.

## ⚠️ WARNING

**This will permanently delete:**
- All Supabase auth users
- All OAuth tokens
- All onboarding summaries
- All unified events
- All calendar events
- All tasks
- All family facts
- All Unipile accounts

**This cannot be undone!** Make sure you have backups if needed.

## Method 1: TypeScript Script (Recommended)

This script clears both Supabase and Unipile automatically.

### Prerequisites

```bash
# Install dependencies if needed
npm install
```

### Run the script

```bash
# Load environment variables
export $(cat .env.local | grep -v '^#' | xargs)

# Run the script
npx tsx scripts/clear-all-users.ts
```

The script will:
1. Wait 5 seconds (you can cancel with Ctrl+C)
2. Delete all Supabase auth users
3. Delete all database records
4. Delete all Unipile accounts

## Method 2: SQL Script (Supabase Only)

This only clears database tables, not auth users.

### Option A: Using Supabase CLI

```bash
supabase db execute --file scripts/clear-all-users.sql
```

### Option B: Using Supabase Dashboard

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **SQL Editor**
4. Copy the contents of `scripts/clear-all-users.sql`
5. Paste and click **Run**

### Option C: Using psql

```bash
psql "postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT-REF].supabase.co:5432/postgres" -f scripts/clear-all-users.sql
```

## Method 3: Manual Deletion

### Supabase

1. **Delete Auth Users:**
   - Go to Supabase Dashboard → Authentication → Users
   - Select all users and delete

2. **Delete Database Records:**
   - Run the SQL script (see Method 2)

### Unipile

1. **Via API:**
   ```bash
   # Get all accounts
   curl -X GET "https://api27.unipile.com:15744/api/v1/accounts" \
     -H "X-API-KEY: YOUR_API_KEY"
   
   # Delete each account
   curl -X DELETE "https://api27.unipile.com:15744/api/v1/accounts/{account_id}" \
     -H "X-API-KEY: YOUR_API_KEY"
   ```

2. **Via Dashboard:**
   - Log into Unipile dashboard
   - Go to Accounts section
   - Delete all accounts manually

## Verification

After running the cleanup, verify everything is cleared:

### Supabase

```sql
-- Check user count (should be 0)
SELECT COUNT(*) FROM auth.users;

-- Check token count (should be 0)
SELECT COUNT(*) FROM oauth_tokens;

-- Check other tables
SELECT 
  (SELECT COUNT(*) FROM onboarding_summaries) as summaries,
  (SELECT COUNT(*) FROM unified_events) as events,
  (SELECT COUNT(*) FROM calendar_events) as calendar,
  (SELECT COUNT(*) FROM tasks) as tasks;
```

### Unipile

```bash
curl -X GET "https://api27.unipile.com:15744/api/v1/accounts" \
  -H "X-API-KEY: YOUR_API_KEY"
```

Should return an empty array: `{"data": []}` or `{"accounts": []}`

## Troubleshooting

### "Permission denied" errors

- Make sure you're using the **Service Role Key** (not anon key)
- Service Role Key bypasses RLS and can delete users

### "Cannot delete user" errors

- Some users might have foreign key constraints
- Delete related records first, then delete users
- The TypeScript script handles this automatically

### Unipile API errors

- Check that `UNIPILE_DSN` and `UNIPILE_API_KEY` are correct
- Verify your API key has delete permissions
- Some accounts might be in use - check Unipile dashboard

## After Cleanup

1. **Test the signup flow:**
   - Go to your app
   - Click "Sign Up With Google"
   - Complete Unipile OAuth
   - Verify user is created

2. **Check n8n workflows:**
   - Verify workflows can access the new user
   - Test onboarding workflow

3. **Verify database:**
   - Check that new user appears in `auth.users`
   - Check that Unipile account_id is stored in `oauth_tokens`

## Quick Reference

```bash
# Full cleanup (Supabase + Unipile)
npx tsx scripts/clear-all-users.ts

# Supabase only (SQL)
supabase db execute --file scripts/clear-all-users.sql

# Or use the shell script
./scripts/clear-all-users.sh
```
