# Error Handler Workflow - Setup Complete ✅

## Workflow Created

**Workflow Name:** `Error Handler - Sentry`  
**Workflow ID:** `fyNaHTZY8javrwU5`  
**Status:** Created (not activated yet)

## What Was Created

The workflow includes:
1. **Error Trigger Node** - Automatically triggers when any linked workflow errors
2. **HTTP Request Node** - Sends error data to your Sentry webhook endpoint

## Next Steps

### Step 1: Activate the Error Handler Workflow

1. Go to your n8n Cloud dashboard
2. Find the workflow: **"Error Handler - Sentry"**
3. Click the **toggle switch** to activate it (it should turn green/blue)
4. The workflow is now ready to receive errors

### Step 2: Link Your Workflows to Error Handler

For each workflow you want to monitor, you need to link it:

1. **Open the workflow** you want to monitor (e.g., "Bippity - AI Email Processor_Test")

2. **Click the three dots (⋯)** menu in the top-right corner

3. **Select "Settings"**

4. **Scroll down to find "Error Workflow" section**

5. **Click the dropdown** and select **"Error Handler - Sentry"**

6. **Click "Save"**

7. **Repeat for all critical workflows:**
   - ✅ "Bippity - AI Email Processor_Test"
   - ✅ "Bippity - Scheduled Email Check"
   - ✅ "Google Auth Nango Powered Onboarding"
   - ✅ Any other critical workflows

### Step 3: Configure Environment Variables in n8n

The workflow needs these environment variables in n8n Cloud:

1. Go to n8n Cloud → **Settings** → **Environment Variables**

2. Add these variables (if not already set):
   ```
   NEXT_PUBLIC_APP_URL=https://bippity.boo
   N8N_API_KEY=your-n8n-api-key-from-railway
   ```

   **Note:** `N8N_API_KEY` should be the same value you have in Railway environment variables.

### Step 4: Verify Webhook URL

The workflow is configured to call:
```
https://bippity.boo/api/errors/n8n-webhook
```

Make sure:
- ✅ Your Railway deployment is live
- ✅ The `/api/errors/n8n-webhook` endpoint is accessible
- ✅ `N8N_API_KEY` matches between Railway and n8n

## Testing the Error Handler

### Test 1: Simulate an Error

1. **Open one of your linked workflows** (e.g., "AI Email Processor")

2. **Temporarily break a node:**
   - Use wrong API credentials
   - Use invalid endpoint
   - Use malformed data

3. **Run the workflow** (it should error)

4. **Check Error Handler workflow:**
   - Go to "Error Handler - Sentry" workflow
   - Click "Executions" tab
   - You should see a new execution triggered by the error

5. **Check Sentry dashboard:**
   - Go to https://sentry.io
   - Navigate to your project
   - Error should appear in "Issues" tab within seconds

6. **Check email:**
   - You should receive a Sentry alert email

### Test 2: Verify Error Data

The error in Sentry should include:
- ✅ Workflow ID
- ✅ Execution ID
- ✅ Error message
- ✅ Error stack trace
- ✅ Node name that failed
- ✅ Node type
- ✅ Workflow name

## Troubleshooting

### Error Handler Not Triggering?

1. **Check workflow is activated:**
   - Error Handler workflow toggle should be ON (blue/green)

2. **Check workflow is linked:**
   - Main workflow → Settings → Error Workflow → "Error Handler - Sentry" selected

3. **Check n8n execution logs:**
   - Go to main workflow → Executions tab
   - Check if error occurred
   - Check execution details

### HTTP Request Failing?

1. **Check environment variables:**
   - Verify `N8N_API_KEY` is set in n8n
   - Verify `NEXT_PUBLIC_APP_URL` is set in n8n

2. **Check webhook endpoint:**
   - Test manually: `curl -X POST https://bippity.boo/api/errors/n8n-webhook -H "Authorization: Bearer YOUR_KEY"`
   - Check Railway logs: `railway logs`

3. **Check HTTP Request node:**
   - Go to Error Handler workflow
   - Click on "Send to Sentry" node
   - Check execution data to see error response

### Errors Not Appearing in Sentry?

1. **Check Railway environment variables:**
   - Verify `NEXT_PUBLIC_SENTRY_DSN` is set
   - Verify Sentry is initialized

2. **Check webhook endpoint logs:**
   - Check Railway logs for webhook requests
   - Verify errors are being received

3. **Check Sentry dashboard:**
   - Filter by tags: `source:n8n`
   - Check if any errors are being captured

## Workflow Configuration Details

### Error Trigger Node
- **Type:** Error Trigger (n8n-nodes-base.errorTrigger)
- **Configuration:** None needed (auto-captures errors)
- **Triggers:** When any linked workflow has an error

### HTTP Request Node
- **Method:** POST
- **URL:** `{{ $env.NEXT_PUBLIC_APP_URL }}/api/errors/n8n-webhook`
- **Authentication:** Header Auth with `Bearer {{ $env.N8N_API_KEY }}`
- **Body:** JSON with error details, workflow context, and node info

### Data Sent to Sentry

The workflow sends:
```json
{
  "workflow_id": "<workflow-id>",
  "execution_id": "<execution-id>",
  "user_id": "",
  "error": {
    "message": "<error-message>",
    "stack": "<stack-trace>",
    "name": "<error-type>"
  },
  "node": {
    "name": "<node-name>",
    "type": "<node-type>"
  },
  "context": {
    "workflow_name": "<workflow-name>",
    "execution_mode": "<execution-mode>",
    "execution_type": "<execution-type>",
    "error_timestamp": "<iso-timestamp>"
  }
}
```

## Summary

✅ **Error Handler workflow created:** `fyNaHTZY8javrwU5`  
✅ **Configuration complete:** Error Trigger → HTTP Request → Sentry  
⚠️ **Action required:**
   1. Activate the workflow
   2. Link your critical workflows to it
   3. Set environment variables in n8n
   4. Test error capture

Once you activate and link the workflows, error handling will be automatic!


