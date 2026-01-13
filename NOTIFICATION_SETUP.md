# Notification Setup Guide

## ⚠️ Important: Railway GUI Doesn't Show Notifications

**Railway GUI only shows:**
- ✅ Build status (success/failure) 
- ✅ Deployment status
- ✅ Service logs
- ❌ **NOT notifications** - those are **email only**

---

## ✅ Where to See Notifications

Notifications are **email-based**, not displayed in GUIs:

#### 1. Email Notifications (Primary)
All notifications come to your **email inbox**:
- ✅ **Sentry errors** → Email from Sentry
- ✅ **Railway infrastructure alerts** → Email from Railway
- ✅ **n8n workflow errors** → Email from Sentry (via error handler)

#### 2. Sentry Dashboard (Error Monitoring)
- ✅ **Website:** https://sentry.io
- ✅ **Real-time error monitoring**
- ✅ **Error details, stack traces, context**
- ✅ **Error grouping and trends**

#### 3. Railway Dashboard (Infrastructure Status Only)
- ✅ **Build status** (pass/fail)
- ✅ **Deployment status** (success/fail)
- ✅ **Service health** (up/down)
- ❌ **NOT for error notifications** - those go to email

---

## Setting Up Email Notifications

### Step 1: Sentry Email Notifications (Application Errors)

These are already configured if you set them up during Sentry setup. Verify:

1. **Go to Sentry Dashboard:** https://sentry.io
2. **Settings → Notifications**
3. **Verify Email is enabled:**
   - Your email address should be listed
   - Check that alerts are enabled

4. **Check Alert Rules:**
   - Go to **Alerts → Alert Rules**
   - You should have rules like:
     - "An issue is created"
     - "The issue level is equal to error"
   - Make sure email notifications are enabled for these rules

5. **Test Notification:**
   - Go to your Sentry project
   - Look for the test error you created (if you visited `/sentry-example-page`)
   - You should have received an email about it

### Step 2: Railway Notifications (Infrastructure)

**Important:** Railway does NOT have a "Notifications" tab in Settings. Railway uses **Webhooks** for notifications.

#### Option A: Railway Webhooks (Recommended)

Railway can send webhooks to notify you of deployment events:

1. **Go to Railway Dashboard:** https://railway.app
2. **Select your project**
3. **Click Settings** (gear icon)
4. **Go to "Webhooks" tab** (if available)
5. **Add webhook URL:**
   - You can create a webhook endpoint to receive Railway deployment events
   - Or use Railway's supported Muxers (Slack, Discord)

**Note:** Railway webhooks are for deployment events, not for monitoring errors. For error monitoring, Sentry is what you need (already set up).

#### Option B: Monitor Railway Status Manually

Since Railway doesn't have built-in email notifications, you can:
- ✅ Check Railway dashboard regularly for build/deployment status
- ✅ Use Sentry for all application errors (already configured)
- ✅ Monitor Railway logs: `railway logs`

---

## Testing Your Notification Setup

### Test 1: Sentry Notifications (Application Errors)

**Option A: Test via Sentry Example Page**
1. Visit: `https://bippity.boo/sentry-example-page` (or `http://localhost:3000/sentry-example-page` if testing locally)
2. Click "Throw Error" button
3. Check your email within 1-2 minutes
4. Check Sentry dashboard → Issues tab

**Option B: Test via n8n Error Handler**
1. Break a node in one of your linked workflows (wrong credentials, etc.)
2. Run the workflow (it should error)
3. Check Error Handler workflow executions (should be triggered)
4. Check your email for Sentry alert
5. Check Sentry dashboard for the error

### Test 2: Railway Infrastructure Notifications

1. **Intentionally break a build:**
   - Add syntax error to a file
   - Commit and push to trigger Railway build
   - Build should fail
   - Check your email for Railway notification

2. **Check Railway dashboard:**
   - Go to your project
   - Click on failed deployment
   - Should see error details in GUI

---

## Checking Notification Settings

### Sentry Notification Settings Checklist

- [ ] Email address added in Sentry Settings → Notifications
- [ ] Alert rules created (Settings → Alerts → Alert Rules)
- [ ] Email notifications enabled for alert rules
- [ ] Test email received (check spam folder if not in inbox)

### Railway Notification Settings Checklist

**Note:** Railway doesn't have traditional email notifications. Options:

- [ ] Option 1: Set up Railway webhooks (optional - for deployment events)
- [ ] Option 2: Monitor Railway dashboard manually (check builds/deployments)
- [ ] Option 3: Rely on Sentry for all error monitoring (recommended - already set up)

**Recommendation:** Use Sentry for all error monitoring. Check Railway dashboard manually for infrastructure status.

---

## Troubleshooting Notifications

### Not Receiving Sentry Email Notifications?

1. **Check spam folder:**
   - Sentry emails might be in spam
   - Search for "sentry.io" in your email

2. **Verify email in Sentry:**
   - Settings → Notifications → Email
   - Confirm email address is correct

3. **Check alert rules:**
   - Settings → Alerts → Alert Rules
   - Verify rules are active
   - Verify email notifications are enabled for rules

4. **Check Sentry dashboard:**
   - Go to Issues tab
   - See if errors are being captured
   - If errors are there but no emails, it's an email notification issue

5. **Test with a new error:**
   - Visit `/sentry-example-page` and throw error
   - Check email within 2 minutes

### Railway Infrastructure Monitoring

Railway doesn't send email notifications by default. To monitor infrastructure:

1. **Check Railway dashboard manually:**
   - Visit https://railway.app
   - Check build/deployment status
   - View logs for errors

2. **Use Railway CLI:**
   ```bash
   railway logs --follow  # Monitor logs in real-time
   ```

3. **Set up webhooks (optional):**
   - Railway → Settings → Webhooks
   - Create webhook endpoint to receive deployment events
   - Or use Muxers for Slack/Discord

4. **Rely on Sentry (recommended):**
   - All application errors go to Sentry (already configured)
   - Check Sentry dashboard for errors
   - Receive email notifications from Sentry

### Not Seeing Errors in Sentry Dashboard?

1. **Check Railway environment variables:**
   - Verify `NEXT_PUBLIC_SENTRY_DSN` is set
   - Check Railway logs: `railway logs | grep -i sentry`

2. **Check if Sentry is initialized:**
   - Check Railway logs for Sentry initialization errors
   - Verify DSN is correct format

3. **Test locally:**
   - Visit `http://localhost:3000/sentry-example-page`
   - Throw test error
   - Check if it appears in Sentry

4. **Check webhook endpoint:**
   - For n8n errors, verify `/api/errors/n8n-webhook` is accessible
   - Test with curl:
     ```bash
     curl -X POST https://bippity.boo/api/errors/n8n-webhook \
       -H "Authorization: Bearer YOUR_N8N_API_KEY" \
       -H "Content-Type: application/json" \
       -d '{"workflow_id":"test","execution_id":"test","error":{"message":"Test error"}}'
     ```

---

## Notification Summary

### What You'll Get Emails For:

✅ **Sentry (Application Errors):**
- New errors in your Next.js app
- Errors from n8n workflows (via error handler)
- Error rate spikes
- Critical errors

⚠️ **Railway (Infrastructure):**
- Railway does NOT send email notifications by default
- You can set up webhooks (optional)
- Or check Railway dashboard manually for build/deployment status

### What You'll Check Dashboards For:

✅ **Sentry Dashboard:**
- All application errors
- Error trends and patterns
- Error details and stack traces
- User impact

✅ **Railway Dashboard:**
- Build status
- Deployment status
- Service health
- Logs

---

## Quick Test Checklist

Before considering notifications "working":

- [ ] Sentry email notification received (test with `/sentry-example-page`)
- [ ] Error appears in Sentry dashboard
- [ ] Railway infrastructure status checked manually (optional - Railway doesn't send email notifications)
- [ ] n8n error handler workflow triggered (test with broken workflow)
- [ ] n8n errors appear in Sentry dashboard
- [ ] All notification settings verified in both Sentry and Railway

---

## Next Steps

1. **Test Sentry notifications:**
   - Visit `/sentry-example-page` and throw error
   - Check email and Sentry dashboard

2. **Test n8n error handler:**
   - Break a node in linked workflow
   - Verify error goes to Sentry
   - Check email notification

3. **Monitor Railway infrastructure:**
   - Check Railway dashboard manually for build/deployment status
   - Or use `railway logs` to monitor in real-time
   - Railway doesn't send email notifications (webhooks available if needed)

4. **Monitor Sentry dashboard:**
   - Bookmark: https://sentry.io
   - Check regularly for new errors
   - Set up additional alert rules if needed

