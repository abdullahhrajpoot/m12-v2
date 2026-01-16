# Supabase User Cleanup Guide

## ⚠️ Critical Issue: Two User Tables

Supabase has **two separate user systems**:

1. **`auth.users`** (Supabase Authentication tab)
   - Managed by Supabase Auth
   - Created automatically when user signs up via OAuth
   - Contains: `id`, `email`, `created_at`, OAuth metadata
   - **DO NOT DELETE MANUALLY** from SQL editor (use Admin API)

2. **`public.users`** (Your app's Users table)
   - Your custom table for app data
   - Created by the n8n onboarding workflow
   - Contains: `id` (matches `auth.users.id`), `email`, `full_name`, `status`, etc.

## The Problem

**If you delete from `public.users` but NOT from `auth.users`:**

1. ✅ User still exists in `auth.users` (Supabase Auth)
2. ❌ User missing from `public.users` (your app table)
3. ❌ User missing from `oauth_tokens` (your app table)

**When user signs in again:**
- Supabase Auth recognizes them (they exist in `auth.users`)
- Your callback route gets `userId` from `auth.users`
- n8n workflow checks `public.users` → **user doesn't exist**
- Workflow tries to create user in `public.users`
- But old `oauth_tokens` might still exist with same `user_id`
- This causes conflicts and can prevent webhook from working properly

## Proper User Cleanup Process

### Option 1: Delete via Supabase Dashboard (Recommended)

1. **Go to Authentication → Users**
2. Find the user you want to delete
3. Click the **three dots** (⋮) → **Delete user**
4. This will:
   - ✅ Delete from `auth.users`
   - ✅ Trigger cascade deletes (if configured)
   - ❌ **Won't automatically delete from `public.users`** (you need to do this separately)

5. **Then manually delete from your app tables:**
   ```sql
   -- Delete from public.users
   DELETE FROM users WHERE id = 'user-uuid-here';
   
   -- Delete from oauth_tokens
   DELETE FROM oauth_tokens WHERE user_id = 'user-uuid-here';
   
   -- Delete from onboarding_summaries (if exists)
   DELETE FROM onboarding_summaries WHERE user_id = 'user-uuid-here';
   
   -- Delete any other user-related data
   DELETE FROM family_facts WHERE user_id = 'user-uuid-here';
   DELETE FROM calendar_events WHERE user_id = 'user-uuid-here';
   DELETE FROM tasks WHERE user_id = 'user-uuid-here';
   -- etc.
   ```

### Option 2: Use Supabase Admin API (Best for automation)

```bash
# Delete from auth.users (requires service role key)
curl -X DELETE \
  'https://api.bippity.boo/auth/v1/admin/users/{user_id}' \
  -H "apikey: YOUR_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"

# Then delete from public.users
# (Do this in SQL editor or via API)
```

### Option 3: Clean Up Mismatched Users

**If you already have mismatched users** (exist in `auth.users` but not `public.users`):

1. **Find orphaned auth users:**
   ```sql
   -- Find users in auth.users that don't have matching public.users
   SELECT au.id, au.email, au.created_at
   FROM auth.users au
   LEFT JOIN public.users pu ON au.id = pu.id
   WHERE pu.id IS NULL;
   ```

2. **Delete the orphaned auth users:**
   - Go to Authentication → Users
   - Find each user and delete them
   - OR use Admin API (see Option 2)

3. **Verify cleanup:**
   ```sql
   -- Should return 0 rows
   SELECT au.id, au.email
   FROM auth.users au
   LEFT JOIN public.users pu ON au.id = pu.id
   WHERE pu.id IS NULL;
   ```

## Impact on Your Current Issue

**Why the webhook might not be triggering:**

1. User exists in `auth.users` but not `public.users`
2. Workflow receives webhook → checks `public.users` → user doesn't exist
3. Workflow tries to create user in `public.users`
4. But `oauth_tokens` might already exist with that `user_id` (conflict)
5. Workflow fails or gets stuck
6. No onboarding summary is created

## Quick Fix for Current User

For user `e261d74f-63b9-43f3-b6d2-62b6ee441f2e`:

1. **Check if user exists in both places:**
   ```sql
   -- Check auth.users
   SELECT id, email FROM auth.users WHERE id = 'e261d74f-63b9-43f3-b6d2-62b6ee441f2e';
   
   -- Check public.users
   SELECT id, email FROM users WHERE id = 'e261d74f-63b9-43f3-b6d2-62b6ee441f2e';
   ```

2. **If mismatch exists:**
   - Delete from Authentication → Users
   - Delete from `oauth_tokens`:
     ```sql
     DELETE FROM oauth_tokens WHERE user_id = 'e261d74f-63b9-43f3-b6d2-62b6ee441f2e';
     ```
   - Have user sign up again (fresh start)

## Prevention

**Set up database triggers** to auto-delete from `public.users` when deleted from `auth.users`:

```sql
-- Create function to handle user deletion
CREATE OR REPLACE FUNCTION public.handle_auth_user_deleted()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM public.users WHERE id = OLD.id;
  DELETE FROM public.oauth_tokens WHERE user_id = OLD.id;
  -- Add other cleanup as needed
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger (requires superuser or appropriate permissions)
-- Note: This requires enabling the trigger in Supabase SQL editor
-- You may need to contact Supabase support or use a webhook/edge function
```

**OR use Supabase Database Webhooks** to sync deletions between tables.

## Verification Checklist

After cleanup, verify:

- [ ] User deleted from Authentication → Users
- [ ] User deleted from `public.users` table
- [ ] User deleted from `oauth_tokens` table
- [ ] User deleted from `onboarding_summaries` (if exists)
- [ ] No orphaned records in any related tables

Then test:
- [ ] User can sign up again successfully
- [ ] Webhook triggers correctly
- [ ] Onboarding workflow completes
- [ ] User record created in `public.users`
