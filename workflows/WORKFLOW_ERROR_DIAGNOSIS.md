# Parallelized Onboarding Workflow - Error Diagnosis

## Common Errors to Check

### 1. Gmail API Errors

**"Invalid id value" errors:**
- **Location**: "Fetch Message Metadata" node
- **Cause**: Messages with null/undefined IDs reaching the node
- **Fix**: "Split Messages for Metadata" should filter these out, but verify it's working

**"401 Unauthorized" errors:**
- **Location**: Any Gmail API call
- **Cause**: Expired or invalid access token
- **Fix**: Check "Get Token from Supabase" node - token might be expired

### 2. Supabase Node Errors

**"Could not find column" errors:**
- **Location**: "Save Onboarding Summaries" or "Insert Onboarding Summaries"
- **Cause**: Column name mismatch (e.g., `user_id` vs `userId`)
- **Fix**: Verify column names match Supabase schema exactly

**"RLS policy violation" errors:**
- **Location**: Any Supabase INSERT/UPDATE
- **Cause**: Row Level Security blocking service role operations
- **Fix**: Check RLS policies allow service_role operations

### 3. Code Node Errors

**"Cannot read property 'json' of null":**
- **Location**: Any Code node accessing `item.json`
- **Cause**: Null/undefined items in input
- **Fix**: Add null checks: `if (!item || !item.json) continue;`

**Empty array errors:**
- **Location**: Nodes expecting data but receiving `[]`
- **Cause**: Upstream filtering removes all items
- **Fix**: Ensure nodes handle empty arrays gracefully

### 4. HTTP Request Errors

**"Bad request - please check your parameters":**
- **Location**: "Fetch Message Metadata" node
- **Cause**: Invalid URL or query parameters
- **Fix**: Check `metadataHeaders` parameter format

**"redirect_uri_mismatch":**
- **Location**: OAuth token retrieval
- **Cause**: Wrong redirect URI in Google Cloud Console
- **Fix**: Add `https://api.bippity.boo/auth/v1/callback` to Google Cloud Console

## Quick Diagnostic Steps

### Step 1: Check Recent Executions
1. Go to n8n Cloud UI
2. Open "Parallelized_Onboarding_Supabase" workflow
3. Check "Executions" tab
4. Look at failed executions
5. Note the exact error message and which node failed

### Step 2: Check Token Validity
1. Verify "Get Token from Supabase" node succeeds
2. Check if token is expired (look for 401 errors)
3. Verify `N8N_API_KEY` is set correctly in n8n

### Step 3: Check Node Configurations
1. Verify all Supabase nodes have correct credentials
2. Check table names match exactly: `onboarding_summaries`, `users`, `oauth_tokens`
3. Verify column names: `user_id`, `summary_sentences` (not `userId`, `sentences`)

### Step 4: Check Data Flow
1. Verify "Split Messages for Metadata" filters null IDs
2. Check "Filter Out Blank Emails" doesn't remove all emails
3. Verify "Preserve Data for Insert" gets data from "Parse Sentences Array"

## Specific Issues to Check

### Issue 1: Fetch Message Metadata - Invalid ID
**Error**: `400 - "Invalid id value"`
**Fix**: The "Split Messages for Metadata" node should filter out null IDs, but verify:
```javascript
// Should filter: messages.filter(msg => msg && msg.id)
```

### Issue 2: Multiple metadataHeaders Parameters
**Error**: `Bad request - please check your parameters`
**Fix**: Gmail API expects comma-separated string, not multiple parameters:
```javascript
// Current (might be wrong):
{ "name": "metadataHeaders", "value": "Date" }
{ "name": "metadataHeaders", "value": "From" }
{ "name": "metadataHeaders", "value": "Subject" }

// Should be:
{ "name": "metadataHeaders", "value": "Date,From,Subject" }
```

### Issue 3: UPDATE Returns Empty JSON
**Error**: "Save Onboarding Summaries" UPDATE returns `{}` even on success
**Fix**: "Preserve Data for Insert" node handles this by always assuming `itemCount = 0`

### Issue 4: Token Not Available
**Error**: "Get Token from Supabase" returns no token
**Fix**: 
- Check `N8N_API_KEY` is set in n8n environment variables
- Verify `/api/auth/tokens` endpoint works
- Check user has valid OAuth tokens in `oauth_tokens` table

## What Information Do I Need?

To help fix the errors, please provide:

1. **Exact error messages** from n8n execution logs
2. **Which node is failing** (node name)
3. **Error code** (400, 401, 500, etc.)
4. **Recent execution ID** that failed
5. **Screenshot** of the error in n8n UI (if possible)

## Quick Fixes to Try

### Fix 1: Verify metadataHeaders Format
In "Fetch Message Metadata" node, check if `metadataHeaders` is a single comma-separated string or multiple parameters.

### Fix 2: Add Error Handling
Ensure all Code nodes have null checks:
```javascript
if (!item || !item.json) continue;
```

### Fix 3: Verify Token Endpoint
Test the token endpoint manually:
```bash
curl -X GET "https://bippity.boo/api/auth/tokens?userId=YOUR_USER_ID&provider=google" \
  -H "Authorization: Bearer YOUR_N8N_API_KEY"
```

### Fix 4: Check Workflow Activation
Make sure the workflow is **Active** in n8n UI (toggle should be ON)
