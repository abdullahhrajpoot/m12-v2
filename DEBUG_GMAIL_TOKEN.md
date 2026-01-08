# Debug Gmail Token Authentication Issue

## Problem
The "Pull Discovered Emails" node is failing with 401 authentication error, even though:
- Token is successfully retrieved
- Token works for "Search Gmail For Usual Suspects" 
- Token fails for "Pull Discovered Emails" when processing multiple items from Split Out

## Current Configuration

### OAuth Scopes Requested
From `components/ConnectButton.tsx`:
- `https://www.googleapis.com/auth/gmail.readonly` ✅ Should work for reading messages
- `https://www.googleapis.com/auth/gmail.labels`
- `https://www.googleapis.com/auth/calendar`
- `https://www.googleapis.com/auth/tasks`

### Current Token Expression
In "Pull Discovered Emails" node:
```
=Bearer {{ $node['Get Token from Supabase'].item(0).json.access_token }}
```

## Debugging Steps

### Step 1: Verify Token is Being Passed Correctly
The issue might be that when processing multiple items from "Split Out", the expression isn't evaluating correctly.

**Solution A: Add a Set node to pass token through items**
1. Add a "Set" node after "Split Out"
2. Add field: `access_token` = `={{ $node['Get Token from Supabase'].item(0).json.access_token }}`
3. This ensures each item has the token as part of its data
4. Update "Pull Discovered Emails" to use `={{ $json.access_token }}` instead

**Solution B: Verify expression syntax**
The expression `$node['Get Token from Supabase'].item(0).json.access_token` should work, but when processing items in parallel, n8n might have issues. Try:
- `={{ $('Get Token from Supabase').item(0).json.access_token }}`
- Or use the simplified syntax if supported

### Step 2: Check Token Scopes
Verify the actual token has the required scopes. We can't check the stored token directly (no scope column), but we can:

1. **Check what Google OAuth consent screen shows** - make sure all requested scopes are approved
2. **Test token directly with curl**:
```bash
# Get token from database or execution log
TOKEN="ya29.a0Aa7pCA_..."

# Test reading a message
curl -H "Authorization: Bearer $TOKEN" \
  "https://gmail.googleapis.com/gmail/v1/users/me/messages/19affb8850e998af"
```

### Step 3: Alternative Approach - Use gmail.modify scope
If `gmail.readonly` doesn't work for message details, we might need:
- `https://www.googleapis.com/auth/gmail.modify` (includes read + write)
- Or check if we need `https://www.googleapis.com/auth/gmail` (full access)

However, `gmail.readonly` should be sufficient for reading messages, so this is likely not the issue.

## Recommended Fix

**Immediate fix**: Add a "Set" node after "Split Out" to add the access_token to each item, then reference it directly in "Pull Discovered Emails".

This ensures:
1. Each item has the token
2. No cross-node reference issues
3. More reliable execution

### Implementation Steps

1. Add "Set" node after "Split Out"
2. Configure it to add `access_token` field
3. Update "Pull Discovered Emails" Authorization header to use `={{ $json.access_token }}`
4. Test the workflow








