# n8n Error Handling Guide

## Where to Put Error Handling in n8n Workflows

There are **two main approaches** for error handling in n8n:

---

## Approach 1: Workflow-Level Error Handling (Recommended)

This uses n8n's built-in error workflow feature to catch errors and send them to Sentry.

### Setup Steps:

1. **Create a separate "Error Handler" workflow:**
   - Create a new workflow called "Error Handler" or "n8n Error Handler"
   - Add **Error Trigger** node as the first node (this is a trigger node)
   - Add **HTTP Request** node after Error Trigger
   - Configure HTTP Request as shown below

2. **Link your workflows to the Error Handler:**
   - Open each workflow you want to monitor
   - Click the **three dots (⋯)** menu → **Settings**
   - Scroll to **Error Workflow** section
   - Select your "Error Handler" workflow
   - Save

3. **Configure the HTTP Request Node** (see configuration below)

### Example: Error Handler Workflow Structure

**Workflow 1: "Error Handler" (Dedicated Error Workflow)**

```
┌─────────────┐
│Error Trigger│ ← Triggered automatically when ANY linked workflow errors
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│ HTTP Request        │
│ (to Sentry webhook) │
└─────────────────────┘
```

**Workflow 2: "Your Main Workflow" (e.g., "AI Email Processor")**

```
┌─────────────┐
│ Gmail API   │
│ (Get Emails)│ ← If this errors, Error Handler workflow is triggered
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Process Data│
└─────────────┘
```

The Error Handler workflow is **linked** to the main workflow via Settings → Error Workflow

### HTTP Request Node Configuration:

**Method:** POST  
**URL:** `https://bippity.boo/api/errors/n8n-webhook`

**Authentication:** Header Auth
- Header Name: `Authorization`
- Header Value: `Bearer {{ $env.N8N_API_KEY }}`

**Body (JSON):**
```json
{
  "workflow_id": "{{ $workflow.id }}",
  "execution_id": "{{ $execution.id }}",
  "user_id": "{{ $json.execution?.data?.workflowData?.main?.[0]?.[0]?.json?.user_id || '' }}",
  "error": {
    "message": "{{ $json.error.message }}",
    "stack": "{{ $json.error.stack }}",
    "name": "{{ $json.error.name }}"
  },
  "node": {
    "name": "{{ $json.error.node?.name || 'Unknown' }}",
    "type": "{{ $json.error.node?.type || 'Unknown' }}"
  },
  "context": {
    "workflow_name": "{{ $workflow.name }}",
    "execution_mode": "{{ $execution.mode }}"
  }
}
```

**Note:** The Error Trigger node provides error data in `$json.error` when a workflow errors.

---

## Approach 2: Node-Level "Continue on Fail" (For Inline Handling)

If you want to handle errors **within the same workflow** and continue execution, you can:

1. **Enable "Continue on Fail"** on specific nodes:
   - Click on a node
   - In node settings, enable **"Continue on Fail"**
   - Add an **IF node** after it to check if the node failed
   - Route errors to an HTTP Request node

**Note:** This is more complex and requires checking `$json.error` in subsequent nodes.

### When to Use Each Approach:

**Use Approach 1 (Error Handler Workflow)** - **RECOMMENDED:**
- ✅ Simple setup
- ✅ Centralized error handling
- ✅ Works automatically for all linked workflows
- ✅ No need to modify each workflow individually

**Use Approach 2 (Continue on Fail)** if:
- ✅ You need workflow to continue after specific node errors
- ✅ You need custom error handling logic per node
- ⚠️ More complex to set up and maintain

---

## Recommended: Single Error Handler Workflow

**Best practice:** Create **one Error Handler workflow** and link all your workflows to it:

1. One centralized error handler workflow (Approach 1)
2. Link all critical workflows to it via Settings → Error Workflow
3. Simple, clean, and easy to maintain

---

## Where to Add Error Handling in Your Workflows

### Workflow: "Bippity - AI Email Processor_Test"

Add Error Trigger after these nodes:
- ✅ Gmail API node (fetching emails)
- ✅ Supabase node (reading/writing data)
- ✅ AI Agent node (ChatGPT processing)
- ✅ Google Calendar API node (creating events)
- ✅ Google Tasks API node (creating tasks)

### Workflow: "Bippity - Scheduled Email Check"

Add Error Trigger after:
- ✅ Gmail API node (searching emails)
- ✅ Any node that processes email data

### Workflow: "Google Auth Nango Powered Onboarding"

Add Error Trigger after:
- ✅ Nango API node
- ✅ Supabase node (storing user data)
- ✅ Any node in the onboarding flow

---

## Step-by-Step: Setting Up Error Handler Workflow

### Step 1: Create the Error Handler Workflow

1. **In n8n Cloud, click "+" to create a new workflow**

2. **Name it:** "Error Handler" or "n8n Error Handler"

3. **Add Error Trigger node:**
   - Search for "Error Trigger" in the node list
   - Add it as the first node (it's a trigger node)
   - No configuration needed - it automatically captures errors

4. **Add HTTP Request node:**
   - Connect Error Trigger → HTTP Request
   - Configure as shown in "HTTP Request Node Configuration" section above

5. **Activate the workflow:**
   - Toggle the "Active" switch to ON
   - Save the workflow

### Step 2: Link Your Workflows to Error Handler

1. **Open a workflow** you want to monitor (e.g., "AI Email Processor")

2. **Click the three dots (⋯)** menu in the top right

3. **Select "Settings"**

4. **Scroll down to "Error Workflow" section**

5. **Select "Error Handler"** (or whatever you named it)

6. **Click "Save"**

7. **Repeat for all critical workflows:**
   - "Bippity - AI Email Processor_Test"
   - "Bippity - Scheduled Email Check"
   - "Google Auth Nango Powered Onboarding"
   - Any other critical workflows

### Step 3: Test the Error Handling

1. **Temporarily break a node** in one of your linked workflows:
   - Use wrong credentials
   - Use invalid API endpoint
   - Use invalid data format

2. **Run the workflow** (it should error)

3. **Check the Error Handler workflow:**
   - Go to Executions tab
   - You should see a new execution triggered by the error

4. **Check Sentry dashboard:**
   - Error should appear within seconds
   - Should include workflow_id, execution_id, error details

5. **Check email notification:**
   - You should receive Sentry alert email

---

## Visual Guide: Error Workflow Connection

**Error Handler Workflow (Separate):**
```
┌─────────────┐
│Error Trigger│ ← Automatically triggered when linked workflow errors
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│ HTTP Request        │
│ (to Sentry webhook) │
└─────────────────────┘
```

**Your Main Workflow:**
- Linked to Error Handler via: **Settings → Error Workflow**
- When any node errors, the Error Handler workflow is automatically triggered
- No visible connection in the workflow canvas - it's configured in Settings

---

## Testing Your Error Handling

### Test 1: Simulate an Error

1. **Temporarily break a node:**
   - Use wrong credentials
   - Use invalid API endpoint
   - Use invalid data format

2. **Run the workflow**

3. **Check Sentry dashboard:**
   - Error should appear within seconds
   - Should include workflow_id, execution_id, error details

4. **Check email notification:**
   - You should receive Sentry alert email

### Test 2: Verify Error Data

The Error Trigger node provides these data fields:
- `$json.error.message` - Error message
- `$json.error.stack` - Stack trace
- `$json.error.name` - Error type
- `$node.name` - Node that failed
- `$workflow.id` - Workflow ID
- `$execution.id` - Execution ID

---

## Common Issues & Solutions

### Issue: Error Handler Workflow Not Triggering

**Solution:**
- Verify Error Handler workflow is **Active** (toggle switch is ON)
- Check that your main workflow is linked: **Settings → Error Workflow** → Error Handler selected
- Verify the node is actually erroring (not just returning empty data)
- Check Error Handler workflow execution logs to see if it's being triggered

### Issue: HTTP Request Not Sending Data

**Solution:**
- Check that `N8N_API_KEY` is set in n8n environment variables
- Verify webhook URL is correct: `https://bippity.boo/api/errors/n8n-webhook`
- Check HTTP Request node body uses correct JSON path expressions (use `{{ }}` syntax)

### Issue: Errors Not Appearing in Sentry

**Solution:**
- Verify Railway environment variables are set (especially `NEXT_PUBLIC_SENTRY_DSN`)
- Check n8n execution logs to see if HTTP request succeeded
- Verify webhook endpoint is accessible (test with curl or Postman)

---

## Quick Reference: Error Handling Checklist

**Step 1: Create Error Handler Workflow**
- [ ] Create new workflow: "Error Handler"
- [ ] Add Error Trigger node
- [ ] Add HTTP Request node
- [ ] Configure HTTP Request with Sentry webhook URL
- [ ] Activate the Error Handler workflow

**Step 2: Link Critical Workflows**
- [ ] Link "Bippity - AI Email Processor_Test" → Settings → Error Workflow
- [ ] Link "Bippity - Scheduled Email Check" → Settings → Error Workflow
- [ ] Link "Google Auth Nango Powered Onboarding" → Settings → Error Workflow
- [ ] Link any other critical workflows

**Step 3: Test**
- [ ] Test error handling by simulating a failure
- [ ] Verify errors appear in Sentry dashboard
- [ ] Verify email notifications are received

---

## Next Steps

1. **Start with one workflow** - Add error handling to your most critical workflow first
2. **Test thoroughly** - Make sure it works before adding to all workflows
3. **Document** - Note which workflows have error handling enabled
4. **Monitor** - Check Sentry dashboard regularly to ensure errors are being captured

---

## Questions?

If you need help:
1. Check n8n execution logs for the specific workflow
2. Check Sentry dashboard to see if errors are being received
3. Check Railway logs: `railway logs` to see webhook endpoint activity

