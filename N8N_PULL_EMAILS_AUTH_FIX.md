# Fix: Pull Discovered Emails Authorization Header

## Error
```
401 - Request is missing required authentication credential. Expected OAuth 2 access token
```

## Root Cause
The "Pull Discovered Emails" HTTP Request node had `sendHeaders: false`, so it wasn't sending the Authorization header with the OAuth token, even though the `access_token` was added to each item by the "Add Token To Items" node.

## Solution
1. Set `sendHeaders: true` to enable sending headers
2. Added `headerParameters` with an Authorization header that uses `={{ $json.access_token }}` from each item

The node now correctly sends:
```
Authorization: Bearer <access_token>
```
where `<access_token>` comes from `$json.access_token` which was added by the "Add Token To Items" Code node.

## Status
✅ Fixed - The node will now send the Authorization header with the OAuth token for each email request.






