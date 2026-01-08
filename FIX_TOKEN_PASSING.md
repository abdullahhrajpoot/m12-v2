# Fix Gmail Token Passing Issue

## Current Status
✅ The "Add Token To Items" Set node exists and is connected correctly  
⚠️ The Set node configuration needs to be fixed in n8n UI  
✅ "Pull Discovered Emails" Authorization header updated to use `{{ $json.access_token }}`

## Problem
The "Pull Discovered Emails" node gets 401 errors because the access token isn't being passed correctly when processing multiple items from "Split Out".

## Solution Steps (Do in n8n UI)

### Step 1: Configure "Add Token To Items" Set Node

1. Open the workflow in n8n Cloud
2. Click on "Add Token To Items" node
3. In the node configuration:
   - **Mode**: Should be "Manual Mapping" (default)
   - **Include Other Input Fields**: Set to ✅ **true** (this keeps all original fields from Split Out)
   - **Fields to Set** section:
     - Click "Add Value"
     - **Name**: `access_token`
     - **Value**: `={{ $node['Get Token from Supabase'].item(0).json.access_token }}`
     - **Type**: String

### Step 2: Verify "Pull Discovered Emails" Authorization Header

1. Click on "Pull Discovered Emails" node
2. Go to "Headers" section
3. Find the "Authorization" header
4. Make sure the value is: `=Bearer {{ $json.access_token }}`
   - This uses the token from the current item (added by Set node)
   - NOT the cross-node reference: `$node['Get Token from Supabase']`

### Step 3: Test the Workflow

1. Save the workflow
2. Activate it
3. Test by triggering a signup
4. Check execution logs to verify "Pull Discovered Emails" succeeds

## Why This Works

- **Set node** adds `access_token` to each item after Split Out
- Each item now has the token as part of its data
- "Pull Discovered Emails" can reference `$json.access_token` directly
- No cross-node reference needed, which is more reliable for parallel processing

## Alternative: If Set Node Still Fails

If the Set node configuration is problematic, you can use a Code node instead:

1. Remove "Add Token To Items" Set node
2. Add a Code node named "Add Token To Items" after "Split Out"
3. Use this code:
```javascript
// Add access_token to each item from the token node
const token = $('Get Token from Supabase').item(0).json.access_token;
const items = $input.all();

return items.map(item => ({
  json: {
    ...item.json,
    access_token: token
  }
}));
```
4. Set mode to: `runOnceForEachItem`








