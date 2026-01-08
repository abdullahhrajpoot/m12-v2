# OAuth Token Refresh Setup

## Overview

We use a **hybrid approach** for OAuth token refresh following best practices:

1. **Proactive Refresh (Cron)**: Scheduled workflow refreshes tokens before they expire
2. **On-Demand Refresh (Fallback)**: Automatic refresh when tokens are requested and already expired

This ensures tokens are always fresh when needed, with no delays for users or workflows.

## Architecture

### Proactive Refresh Endpoint
**POST** `/api/auth/refresh-tokens`

- Called by scheduled n8n workflow (e.g., every 6 hours)
- Finds tokens expiring within X hours (default: 24 hours)
- Refreshes them proactively
- Marks users as `needs_reauth` if refresh fails

### On-Demand Refresh (Fallback)
**GET** `/api/auth/tokens`

- Automatically refreshes expired tokens when requested
- Safety net for tokens that weren't refreshed proactively
- Ensures workflows always get valid tokens

## n8n Workflow Setup

### ✅ Workflow Created: "Token Refresh Cron"

**Workflow ID**: `Ek0ft5PCAEv3qB5b`  
**Status**: Created (needs to be activated)

The workflow has been created in your n8n instance with the following configuration:

1. **Trigger Node**: "Every 6 Hours"
   - Schedule: Every 6 hours at minute 0
   - Type: Schedule Trigger (v1.3)

2. **HTTP Request Node**: "Refresh Tokens"
   - Method: `POST`
   - URL: `https://bippity.boo/api/auth/refresh-tokens`
   - Query Parameters:
     - `hoursBeforeExpiry`: `24`
     - `provider`: `google`
   - Headers:
     - `Authorization`: `Bearer {{$env.N8N_API_KEY}}`
   - Error Handling:
     - Retry on fail: Enabled (3 tries, 1 second between)
     - Continue on fail: Enabled

### Activate the Workflow

1. Go to your n8n instance: https://chungxchung.app.n8n.cloud/
2. Open the workflow "Token Refresh Cron" (ID: `Ek0ft5PCAEv3qB5b`)
3. Ensure `N8N_API_KEY` is set in n8n environment variables
4. Click "Activate" to start the scheduled runs

### Response Handling (Optional Enhancement)

You can add nodes to:
- Log refresh results
- Send alerts if many tokens failed to refresh
- Store refresh statistics in a database

### Example n8n Workflow JSON

```json
{
  "name": "Token Refresh Cron",
  "nodes": [
    {
      "parameters": {
        "rule": {
          "interval": [
            {
              "field": "hours",
              "hoursInterval": 6
            }
          ]
        }
      },
      "name": "Every 6 Hours",
      "type": "n8n-nodes-base.scheduleTrigger",
      "typeVersion": 1.1,
      "position": [250, 300]
    },
    {
      "parameters": {
        "method": "POST",
        "url": "https://bippity.boo/api/auth/refresh-tokens",
        "authentication": "genericCredentialType",
        "genericAuthType": "httpHeaderAuth",
        "sendQuery": true,
        "queryParameters": {
          "parameters": [
            {
              "name": "hoursBeforeExpiry",
              "value": "24"
            },
            {
              "name": "provider",
              "value": "google"
            }
          ]
        },
        "options": {}
      },
      "name": "Refresh Tokens",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [450, 300],
      "credentials": {
        "httpHeaderAuth": {
          "id": "YOUR_HTTP_HEADER_AUTH_CREDENTIAL_ID",
          "name": "N8N API Key"
        }
      }
    }
  ],
  "connections": {
    "Every 6 Hours": {
      "main": [
        [
          {
            "node": "Refresh Tokens",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  }
}
```

## Environment Variables Required

### Railway (Next.js App)
- `GOOGLE_CLIENT_ID`: Google OAuth Client ID
- `GOOGLE_CLIENT_SECRET`: Google OAuth Client Secret
- `N8N_API_KEY`: API key for n8n authentication
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key

### n8n Cloud
- `N8N_API_KEY`: Same key as in Railway (for authentication)

## Best Practices

1. **Refresh Frequency**: 
   - Google tokens expire in ~1 hour
   - Refresh tokens expiring within 24 hours
   - Run cron every 6 hours (catches tokens before they expire)

2. **Error Handling**:
   - If refresh fails, user is marked `needs_reauth`
   - On-demand refresh provides fallback
   - Monitor failed refresh counts

3. **Monitoring**:
   - Log refresh success/failure rates
   - Alert if many tokens fail to refresh
   - Track token expiration patterns

4. **Security**:
   - API key authentication required
   - Tokens stored securely in database
   - Refresh tokens never exposed in logs

## Testing

### Test Proactive Refresh
```bash
curl -X POST "https://bippity.boo/api/auth/refresh-tokens?hoursBeforeExpiry=24&provider=google" \
  -H "Authorization: Bearer YOUR_N8N_API_KEY"
```

### Test On-Demand Refresh
```bash
curl -X GET "https://bippity.boo/api/auth/tokens?userId=USER_ID&provider=google" \
  -H "Authorization: Bearer YOUR_N8N_API_KEY"
```

## Response Format

### Proactive Refresh Response
```json
{
  "success": true,
  "message": "Refreshed 5 tokens, 0 failed",
  "refreshed": 5,
  "failed": 0,
  "total": 5,
  "errors": null
}
```

### On-Demand Refresh Response
```json
{
  "provider": "google",
  "access_token": "ya29.a0AfH6...",
  "refresh_token": "1//0gX...",
  "expires_at": "2024-01-15T12:00:00.000Z",
  "token_type": "Bearer",
  "scope": "https://www.googleapis.com/auth/gmail.readonly ...",
  "is_expired": false,
  "was_refreshed": true
}
```

## Troubleshooting

### Tokens Not Refreshing
1. Check `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set
2. Verify `N8N_API_KEY` matches in both Railway and n8n
3. Check n8n workflow is active and running
4. Review logs for refresh errors

### Users Stuck in `needs_reauth`
1. Check if refresh token is invalid/revoked
2. User may need to re-authenticate
3. Verify OAuth scopes are correct

### High Failure Rate
1. Check Google OAuth quota limits
2. Verify credentials are correct
3. Review token expiration patterns

