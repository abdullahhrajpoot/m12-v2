# Unipile Environment Variables

## Required Environment Variables for Railway

Add these environment variables to your Railway deployment:

### Unipile API Configuration

```bash
# Unipile API Key (from Unipile dashboard)
UNIPILE_API_KEY=your_api_key_here

# Unipile DSN - Your specific DSN URL from Unipile dashboard
# Example: https://api27.unipile.com:15744
UNIPILE_DSN=https://api27.unipile.com:15744

# Unipile Webhook Secret - For verifying webhook signatures
UNIPILE_WEBHOOK_SECRET=your_webhook_secret_here
```

### n8n Webhook Configuration

```bash
# Webhook URL for the new Unipile onboarding workflow
N8N_UNIPILE_ONBOARDING_WEBHOOK_URL=https://chungxchung.app.n8n.cloud/webhook/parallelized-unipile-onboarding
```

### Keep Existing Variables (for legacy system)

```bash
# These remain unchanged for the legacy Supabase OAuth system
GOOGLE_CLIENT_ID=existing_value
GOOGLE_CLIENT_SECRET=existing_value
N8N_ONBOARDING_WEBHOOK_URL=existing_value  # Legacy webhook URL
```

## How to Get These Values

### 1. UNIPILE_API_KEY

1. Log in to your Unipile dashboard at https://dashboard.unipile.com
2. Navigate to Settings → API Keys
3. Copy your API key
4. **Important**: Keep this secret and never commit it to version control

### 2. UNIPILE_DSN

1. In Unipile dashboard, go to Settings → General
2. Look for "API DSN" or "API Endpoint"
3. Copy the full URL (including port number)
4. Example format: `https://api27.unipile.com:15744`

### 3. UNIPILE_WEBHOOK_SECRET

Unipile webhooks use a custom authentication header (`Unipile-Auth`) with a secret you provide. You need to generate your own secret and configure it when creating the webhook.

**Option A: Create webhook via Dashboard (if it supports custom headers)**
1. In Unipile dashboard, go to Settings → Webhooks
2. Create a new webhook with:
   - **Source:** Select **"Mailing"** (for email webhooks)
   - **Webhook URL:** `https://bippity.boo/api/webhooks/unipile/email`
   - **Events:** Select email-related events
   - **Custom Header:** Add `Unipile-Auth` with a secret value you generate
3. Generate a strong random secret (e.g., using `openssl rand -hex 32`)
4. Use that same secret as your `UNIPILE_WEBHOOK_SECRET` in Railway

**Option B: Create webhook via API (Recommended)**
If the dashboard doesn't support custom headers, create the webhook via API:

**Important:** Make sure to use `https://` (not `http://`) in the URL. Replace `{YOUR_DSN}` with your actual Unipile DSN (e.g., `api27.unipile.com:15744`).

```bash
curl --request POST \
  --url "https://{YOUR_DSN}/api/v1/webhooks" \
  --header 'X-API-KEY: YOUR_UNIPILE_API_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "request_url": "https://bippity.boo/api/webhooks/unipile/email",
    "source": "email",
    "events": ["mail_received"],
    "headers": [
      {
        "key": "Unipile-Auth",
        "value": "YOUR_GENERATED_SECRET_HERE"
      }
    ]
  }'
```

**Example with actual DSN:**
```bash
curl --request POST \
  --url "https://api27.unipile.com:15744/api/v1/webhooks" \
  --header 'X-API-KEY: YOUR_UNIPILE_API_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "request_url": "https://bippity.boo/api/webhooks/unipile/email",
    "source": "email",
    "events": ["mail_received"],
    "headers": [
      {
        "key": "Unipile-Auth",
        "value": "YOUR_GENERATED_SECRET_HERE"
      }
    ]
  }'
```

**Troubleshooting:**
- If you get "400 The plain HTTP request was sent to HTTPS port", make sure you're using `https://` (not `http://`)
- Make sure your DSN includes the port number (e.g., `:15744`)
- Verify your `UNIPILE_API_KEY` is correct

**Generate a secret:**
```bash
# Generate a secure random secret
openssl rand -hex 32
```

**Important:** Use the same secret value for:
- The `value` in the webhook's `Unipile-Auth` header (when creating the webhook)
- The `UNIPILE_WEBHOOK_SECRET` environment variable in Railway

**Important:** 
- The API requires `source: "email"` (not "mailing" or "messaging")
- Available events: `["mail_sent", "mail_received", "mail_moved"]`
- Default event is `"mail_received"` if not specified
- "Messaging" is for chat platforms (WhatsApp, LinkedIn, etc.)

### 4. N8N_UNIPILE_ONBOARDING_WEBHOOK_URL

1. In n8n Cloud, open your workspace
2. Import the `Parallelized_Onboarding_Unipile.json` workflow
3. Activate the workflow
4. Click on the "Unipile Onboarding Webhook" node
5. Copy the webhook URL (should end with `/webhook/parallelized-unipile-onboarding`)

## Verification

After adding these variables to Railway:

1. **Test Unipile API Connection:**
   ```bash
   curl -X GET "${UNIPILE_DSN}/api/v1/health" \
     -H "X-API-KEY: ${UNIPILE_API_KEY}"
   ```
   Should return 200 OK

2. **Test Webhook Endpoint:**
   ```bash
   curl -X POST "${N8N_UNIPILE_ONBOARDING_WEBHOOK_URL}" \
     -H "Content-Type: application/json" \
     -d '{"body": {"userId": "test-user-id", "email": "test@example.com"}}'
   ```
   Should trigger the workflow

3. **Check Railway Logs:**
   - Look for successful deployment after adding variables
   - Check for any missing variable warnings

## Security Notes

- **Never commit** API keys or secrets to git
- **Use Railway's secrets management** for sensitive values
- **Rotate keys** if they are ever exposed
- **Use different keys** for development and production

## Troubleshooting

### Error: "UNIPILE_API_KEY not configured"
- Check that the variable is set in Railway
- Verify there are no trailing spaces in the value
- Restart the Railway service after adding variables

### Error: "Invalid Unipile API response"
- Verify UNIPILE_DSN is correct (including port)
- Check that UNIPILE_API_KEY is valid
- Test the Unipile API connection manually (see Verification above)

### Error: "Webhook signature verification failed"
- Ensure UNIPILE_WEBHOOK_SECRET matches the value in Unipile dashboard
- Check that the secret has no trailing spaces
- Verify the webhook is configured in Unipile to use this secret
