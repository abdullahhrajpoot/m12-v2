# 401 Token Error Fix Summary

## Issue
"Pull Discovered Emails" node returns 401 - "Request is missing required authentication credential"

## Root Cause
The Authorization header was using `{{ $json.access_token || '' }}` which could result in an empty token if `access_token` wasn't in the item JSON.

## Fix Applied
Updated "Pull Discovered Emails" Authorization header to include fallback:
```
Bearer {{ $json.access_token || $('Get Token from Supabase').first().json.access_token || '' }}
```

This ensures:
1. First tries `$json.access_token` (from "Add Token To Items" node)
2. Falls back to token from "Get Token from Supabase" node
3. Only sends empty if both fail

## Why Summaries Might Not Be Saving

If "Pull Discovered Emails" fails with 401:
1. No emails are retrieved
2. No data flows to extraction nodes
3. "Parse Sentences Array" has no data
4. "Save Onboarding Summaries" has nothing to save

**However**, the workflow should still complete even if there's no data - it just won't save anything.

## Check These

1. **Token is valid**: Check "Get Token from Supabase" node output - does it return `access_token`?
2. **Token is passed**: Check "Add Token To Items" node output - does each item have `access_token`?
3. **Workflow completes**: Does the execution reach "Save Onboarding Summaries" node?
4. **Data exists**: Check "Parse Sentences Array" output - does it have `userId` and `sentences`?

## Next Steps

After importing the fixed workflow:
1. Test with a new OAuth flow
2. Check execution logs to see if token is being passed correctly
3. Verify "Pull Discovered Emails" no longer returns 401
4. Check if summaries are now being saved
