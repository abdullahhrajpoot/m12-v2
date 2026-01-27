# How to Check Railway Logs for Unipile Callback Issue

## Quick Check

After clicking "OK" in Unipile OAuth, check Railway logs for:

### 1. Check if Callback Route is Hit

Look for this log message:
```
🔐 Unipile callback received:
```

If you see this, the callback route IS being hit. Check for:
- `sessionId: null` or `sessionId: undefined` - means Unipile didn't preserve query params
- `cookieSessionId: 'none'` - means cookie fallback didn't work
- Any error messages after this

### 2. Check for Missing Session Errors

Look for:
```
❌ Missing session_id in callback URL
❌ This might mean Unipile redirected without preserving query params
```

This means Unipile redirected but didn't include the `session_id` parameter.

### 3. Check for Webhook Calls

Look for:
```
📧 notify_url webhook received from Unipile Hosted Auth
📧 Unipile account webhook received: { status: "CREATION_SUCCESS", account_id: "..." }
```

This confirms Unipile sent the webhook notification.

### 4. Check for Redirects

Look for:
```
✅ Redirecting to /whatwefound for user: ...
```

This means the callback processed successfully and redirected.

## What to Look For

### Scenario 1: No Callback Logs at All
**Problem:** Unipile isn't redirecting to `success_redirect_url`
**Solution:** Check Unipile dashboard to verify redirect URL is configured correctly

### Scenario 2: Callback Hit But No Session ID
**Problem:** Unipile redirected but didn't preserve query parameters
**Solution:** The cookie fallback should work, but if it doesn't, we need to fix cookie handling

### Scenario 3: Callback Hit, Session Found, But Error
**Problem:** Something is failing in the callback processing
**Solution:** Check the specific error message in the logs

## How to Access Railway Logs

### Option 1: Railway Dashboard
1. Go to https://railway.app
2. Select your project
3. Click on your service
4. Go to "Deployments" tab
5. Click on the latest deployment
6. View logs

### Option 2: Railway CLI
```bash
# Login first
railway login

# Link to your project (if not already linked)
cd /Users/hanschung/Documents/Parser/Cursor/projects/tldrpal
railway link

# View logs
railway logs --deploy
```

### Option 3: Filter Logs
```bash
# Filter for callback-related logs
railway logs --deploy | grep -i "callback\|unipile\|session"

# Filter for errors
railway logs --deploy | grep -i "error\|❌"
```

## What to Share

If you find logs, please share:
1. Do you see "🔐 Unipile callback received"?
2. What is the `sessionId` value?
3. What is the `cookieSessionId` value?
4. Any error messages?
5. Do you see "✅ Redirecting to /whatwefound"?

This will help diagnose why "nothing happens" after clicking OK.
