# Sentry Setup - Complete ✅

## What I've Done (Automated Setup)

### ✅ Code Changes Complete

1. **Sentry Configuration Files** ✓
   - `sentry.client.config.ts` - Client-side Sentry config
   - `sentry.server.config.ts` - Server-side Sentry config  
   - `sentry.edge.config.ts` - Edge runtime config
   - `instrumentation.ts` - Next.js instrumentation hook
   - `next.config.js` - Sentry webpack plugin (conditional)

2. **n8n Error Webhook Endpoint** ✓
   - Created `/app/api/errors/n8n-webhook/route.ts`
   - Authenticates via `N8N_API_KEY` (same as tokens endpoint)
   - Forwards errors to Sentry with context:
     - workflow_id
     - execution_id
     - user_id
     - node name/type
     - Error message and stack trace

3. **Error Handling** ✓
   - Sentry auto-captures unhandled errors in API routes
   - Existing routes already have try/catch blocks
   - Sentry will automatically log exceptions

### ✅ Build Configuration

- Sentry only initializes if `NEXT_PUBLIC_SENTRY_DSN` is present
- Source map uploads only if `SENTRY_AUTH_TOKEN` is present
- Build won't hang if DSN is missing

---

## What You Need to Do (Manual Steps)

### Step 1: Add Environment Variables to Railway

Go to **Railway Dashboard → Your Project → Your Service → Variables** and add:

```
NEXT_PUBLIC_SENTRY_DSN=https://77f6856b92424cf8e528b66ed8c2df9e@o4510681713147904.ingest.us.sentry.io/4510681720750080
SENTRY_AUTH_TOKEN=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
SENTRY_ORG=bippityboo
SENTRY_PROJECT=javascript-nextjs
SENTRY_ENVIRONMENT=production
```

**Note:** Update `SENTRY_PROJECT` if your project slug is different (check Sentry dashboard URL).

### Step 2: Configure n8n Workflows

For each critical n8n workflow, add error handling:

1. **Add Error Handler Node** to your workflow
2. **Add HTTP Request Node** after error handler:
   - Method: POST
   - URL: `https://bippity.boo/api/errors/n8n-webhook`
   - Authentication: Header Auth
   - Header Name: `Authorization`
   - Header Value: `Bearer {{ $env.N8N_API_KEY }}`
   - Body (JSON):
     ```json
     {
       "workflow_id": "{{ $workflow.id }}",
       "execution_id": "{{ $execution.id }}",
       "user_id": "{{ $json.user_id }}",
       "error": {
         "message": "{{ $json.error.message }}",
         "stack": "{{ $json.error.stack }}",
         "name": "{{ $json.error.name }}"
       },
       "node": {
         "name": "{{ $json.node.name }}",
         "type": "{{ $json.node.type }}"
       }
     }
     ```

**Critical Workflows to Update:**
- `Bippity - AI Email Processor_Test`
- `Bippity - Scheduled Email Check`
- `Google Auth Nango Powered Onboarding`
- Any workflow that processes user data

### Step 3: Test Sentry Integration

Once Railway environment variables are set:

1. **Deploy to Railway** (Railway will auto-deploy when you push)
2. **Test Next.js error capture:**
   - Visit: `https://bippity.boo/sentry-example-page`
   - Click "Throw Error" button
   - Check Sentry dashboard for error
   - Check email for notification

3. **Test n8n error capture:**
   - Trigger an error in an n8n workflow
   - Check Sentry dashboard for error with n8n context
   - Check email for notification

### Step 4: Railway Infrastructure Monitoring (Optional)

**Note:** Railway does NOT have a "Notifications" tab. Railway uses webhooks for notifications, not email.

**Options for Railway monitoring:**
1. **Check Railway dashboard manually** - View build/deployment status in GUI
2. **Use Railway CLI** - `railway logs` to monitor in real-time
3. **Set up webhooks** (optional) - Railway → Settings → Webhooks for deployment events
4. **Rely on Sentry** - All application errors go to Sentry (recommended - already set up)

**Recommendation:** Use Sentry for error monitoring. Check Railway dashboard periodically for infrastructure status.

---

## How to Verify Everything Works

### Check Sentry Dashboard

1. Go to https://sentry.io
2. Navigate to your project
3. You should see:
   - Errors appear in "Issues" tab
   - Errors tagged with `source: railway` or `source: n8n`
   - Errors include workflow_id, execution_id, user_id for n8n errors

### Check Email Notifications

1. Check your email for Sentry alert emails
2. Each new error should trigger an email
3. Email includes link to error details in Sentry

### Check n8n Error Webhook

1. Check Railway logs: `railway logs`
2. Look for: `n8n error captured in Sentry`
3. Verify webhook endpoint is receiving requests

---

## Troubleshooting

### Sentry Not Capturing Errors?

1. Check Railway environment variables are set:
   ```bash
   railway variables
   ```
2. Verify `NEXT_PUBLIC_SENTRY_DSN` is correct
3. Check Railway logs for Sentry errors:
   ```bash
   railway logs | grep -i sentry
   ```

### n8n Errors Not Appearing in Sentry?

1. Verify `N8N_API_KEY` is set in n8n Cloud environment variables
2. Verify webhook URL is correct: `https://bippity.boo/api/errors/n8n-webhook`
3. Check n8n workflow execution logs
4. Verify HTTP Request node is configured correctly

### Not Receiving Email Notifications?

1. Check Sentry Settings → Notifications → Email
2. Verify email address is correct
3. Check alert rules are active
4. Check spam folder
5. Verify alert rules match your error conditions

---

## Next Steps

Once error monitoring is working:

1. ✅ Monitor Sentry dashboard for errors
2. ✅ Review error patterns and trends
3. ✅ Set up additional alert rules if needed
4. ✅ Create dashboard for error metrics (separate task)

---

## Summary

**✅ Complete:**
- Sentry installed and configured
- n8n webhook endpoint created
- Error handling in place
- Build configuration fixed

**⚠️ Manual Steps Required:**
- Add Railway environment variables
- Configure n8n workflow error handlers
- Test error capture
- Configure Railway notifications (optional)

**Once Railway env vars are added, Sentry will automatically start working!**

