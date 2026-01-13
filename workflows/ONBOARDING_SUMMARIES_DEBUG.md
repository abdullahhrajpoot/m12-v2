# Onboarding Summaries Not Saving - Debug Guide

## Issue
Onboarding summaries are not appearing in the database, but whatwefound page shows some facts.

## Possible Causes

### 1. Workflow Failing Before Save
If "Pull Discovered Emails" fails with 401, the workflow might stop before reaching the save nodes.

**Check:**
- Does the workflow execution complete?
- Are there errors before "Save Onboarding Summaries" node?
- Check n8n execution logs for the full execution path

### 2. UPDATE Returns Empty (Known Issue)
The "Save Onboarding Summaries" UPDATE node returns `{}` even on success, which makes "Check Update Result" think no rows were updated.

**Current Fix:**
- "Preserve Data for Insert" node always assumes `itemCount = 0` to trigger INSERT
- This should work, but verify the flow is correct

### 3. Data Not Reaching Save Nodes
If "Parse Sentences Array" doesn't output data correctly, the save nodes won't have data.

**Check:**
- Does "Parse Sentences Array" output `userId` and `sentences`?
- Check execution data at "Parse Sentences Array" node

### 4. RLS Policy Issues
Row Level Security might be blocking the INSERT/UPDATE.

**Check:**
- Verify RLS policies allow service_role operations
- Check if policies allow INSERT/UPDATE on `onboarding_summaries`

### 5. Field Name Mismatch
Column names might not match between workflow and database.

**Check:**
- Database column: `user_id` (snake_case)
- Workflow uses: `userId` (camelCase) in expressions
- Supabase node should map correctly, but verify

## Debugging Steps

### Step 1: Check Execution Logs
1. Go to n8n Cloud → Executions
2. Find the most recent execution
3. Check which nodes executed successfully
4. Look for errors in:
   - "Pull Discovered Emails"
   - "Parse Sentences Array"
   - "Save Onboarding Summaries"
   - "Insert Onboarding Summaries"

### Step 2: Verify Data Flow
Check execution data at each node:
1. "Parse Sentences Array" - Should output `{ userId, sentences: [...] }`
2. "Save Onboarding Summaries" - Should attempt UPDATE
3. "Preserve Data for Insert" - Should output `{ itemCount: 0, userId, sentences }`
4. "Check Update Result" - Should route to INSERT (FALSE branch)
5. "Insert Onboarding Summaries" - Should create record

### Step 3: Check Database
```sql
-- Check if any summaries exist
SELECT user_id, array_length(summary_sentences, 1) as fact_count, created_at
FROM onboarding_summaries
ORDER BY created_at DESC
LIMIT 10;

-- Check for your specific user
SELECT user_id, summary_sentences, status, created_at, updated_at
FROM onboarding_summaries
WHERE user_id = 'YOUR_USER_ID';
```

### Step 4: Check RLS Policies
```sql
-- Check RLS policies on onboarding_summaries
SELECT * FROM pg_policies WHERE tablename = 'onboarding_summaries';

-- Should allow service_role to INSERT/UPDATE
```

## Why whatwefound Shows Facts

If whatwefound shows facts but database doesn't have summaries, possible reasons:

1. **Previous execution** - Facts from an earlier successful run
2. **Manual entry** - User manually entered facts via the form
3. **Partial save** - Workflow saved some data but not all
4. **Different user** - Facts from a different user account

## Quick Fixes

### Fix 1: Ensure Token is Passed
"Pull Discovered Emails" now has fallback to get token from "Get Token from Supabase" node.

### Fix 2: Verify Save Flow
The UPDATE → INSERT pattern should work, but verify:
- "Preserve Data for Insert" always outputs `itemCount: 0`
- "Check Update Result" routes FALSE branch (itemCount == 0) to INSERT
- INSERT node has correct field mappings

### Fix 3: Check ContinueOnFail
Both "Save Onboarding Summaries" and "Insert Onboarding Summaries" have `continueOnFail: true`, so they won't stop the workflow, but errors might be silent.

## What to Check Next

1. **Execution ID** - Share the execution ID that failed
2. **Node output** - Check what "Parse Sentences Array" outputs
3. **Database query** - Run the SQL query above to see if any data exists
4. **RLS policies** - Verify policies allow service_role operations
