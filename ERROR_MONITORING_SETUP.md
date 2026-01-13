# Error Monitoring Setup - Step-by-Step Guide

This guide walks you through setting up error monitoring with Sentry for Railway (Next.js) and n8n workflows.

---

## Phase 1: Sentry Account Setup (You Do This)

### Step 1.1: Create Sentry Account
1. Go to https://sentry.io/signup/
2. Sign up for a free account (or log in if you have one)
3. Verify your email address

### Step 1.2: Create Sentry Project
1. After logging in, click **"Create Project"** or **"Add Project"**
2. Select **"Next.js"** as the platform
3. Give it a name: `bippity-boo` (or your preferred name)
4. Click **"Create Project"**

### Step 1.3: Get Your Sentry DSN
1. After creating the project, you'll see a setup page
2. Look for **"Your DSN"** or go to **Settings → Projects → [Your Project] → Client Keys (DSN)**
3. Copy the DSN (it looks like: `https://xxxxx@xxxxx.ingest.sentry.io/xxxxx`)
4. **Save this DSN** - you'll need it in Step 2

### Step 1.4: Configure Sentry Email Notifications
1. In Sentry dashboard, go to **Settings → Notifications**
2. Click **"Email"** or **"Add Notification"**
3. Add your email address
4. Configure alert rules:
   - Go to **Alerts → Create Alert Rule**
   - Select **"An issue is created"** (notify on new errors)
   - Add condition: **"The issue level is equal to error"** (or higher)
   - Set notification: **Email** → your email
   - Save the alert rule
5. (Optional) Create another alert for error rate spikes:
   - **"The rate of events is greater than X per minute"**
   - Set threshold (e.g., 10 errors/minute)

**✅ Checkpoint:** You should now have:
- Sentry account created
- Project created
- DSN copied
- Email notifications configured

**👉 Next:** Tell me "I've completed Sentry setup, ready for you to install Sentry in the codebase"

---

## Phase 2: Install Sentry in Codebase (I Do This)

**Tell me:** "Install Sentry in the Next.js app"

I will:
1. Install `@sentry/nextjs` package
2. Run Sentry wizard to generate config files
3. Create Sentry configuration files
4. Set up error boundaries
5. Configure source maps

**After I'm done, you'll need to:**
- Add Sentry DSN to Railway environment variables (Step 2.1)

---

## Phase 2.1: Add Sentry to Railway (You Do This)

### Add Environment Variables
1. Go to Railway Dashboard → Your Project → Your Service
2. Click **"Variables"** tab
3. Add these environment variables:

   ```
   NEXT_PUBLIC_SENTRY_DSN=your-dsn-from-step-1.3
   SENTRY_AUTH_TOKEN=your-auth-token (see below)
   SENTRY_ORG=your-org-slug
   SENTRY_PROJECT=your-project-slug
   SENTRY_ENVIRONMENT=production
   ```

### Get Sentry Auth Token
1. In Sentry dashboard, go to **Settings → Auth Tokens**
2. Click **"Create New Token"**
3. Name it: `Railway Source Maps`
4. Scopes needed:
   - ✅ `project:read`
   - ✅ `project:releases`
   - ✅ `org:read`
5. Click **"Create Token"**
6. **Copy the token immediately** (you won't see it again)
7. Paste into Railway as `SENTRY_AUTH_TOKEN`

### Get Org and Project Slugs
- **SENTRY_ORG**: Your organization slug (visible in URL: `sentry.io/organizations/[org-slug]/`)
- **SENTRY_PROJECT**: Your project slug (visible in URL: `sentry.io/organizations/[org]/projects/[project]/`)

**✅ Checkpoint:** Railway should have all Sentry environment variables

**👉 Next:** Tell me "Railway environment variables are set, ready to test Sentry"

---

## Phase 3: Test Sentry Integration (I Do This)

**Tell me:** "Test Sentry error capture"

I will:
1. Create a test API route that throws an error
2. Verify error appears in Sentry dashboard
3. Check that email notification was sent

**After testing:**
- You should receive an email from Sentry about the test error
- You should see the error in Sentry dashboard

**✅ Checkpoint:** Sentry is working and capturing errors

**👉 Next:** Tell me "Sentry is working, ready for n8n integration"

---

## Phase 4: n8n Error Integration (I Do This)

**Tell me:** "Set up n8n error webhook endpoint"

I will:
1. Create `/api/errors/n8n-webhook` endpoint
2. Endpoint receives errors from n8n workflows
3. Forwards errors to Sentry with context
4. Includes: workflow_id, execution_id, user_id, error details

**After I'm done, you'll need to:**
- Add error handling to n8n workflows (Step 4.1)

---

## Phase 4.1: Configure n8n Workflows (You Do This)

### Option A: Use n8n Error Monitoring Template (Recommended)
1. Go to n8n Cloud dashboard
2. Search for workflow template: **"Error Monitoring"** or **"Centralized Error Monitoring"**
3. Import the template
4. Configure webhook URL to: `https://bippity.boo/api/errors/n8n-webhook`
5. Add API key authentication (use `N8N_API_KEY` from Railway)
6. Activate the workflow

### Option B: Add Error Handling to Existing Workflows (Manual)
For each critical workflow:
1. Add an **"On Error"** node or **"Error Trigger"** node
2. Add an **"HTTP Request"** node after error node
3. Configure HTTP Request:
   - **Method**: POST
   - **URL**: `https://bippity.boo/api/errors/n8n-webhook`
   - **Authentication**: Header Auth
   - **Header Name**: `Authorization`
   - **Header Value**: `Bearer {{ $env.N8N_API_KEY }}`
   - **Body**:
     ```json
     {
       "workflow_id": "{{ $workflow.id }}",
       "execution_id": "{{ $execution.id }}",
       "error": {
         "message": "{{ $json.error.message }}",
         "stack": "{{ $json.error.stack }}"
       },
       "node": {
         "name": "{{ $json.node.name }}",
         "type": "{{ $json.node.type }}"
       },
       "user_id": "{{ $json.user_id }}"
     }
     ```

**Critical Workflows to Add Error Handling:**
- `Bippity - AI Email Processor_Test`
- `Bippity - Scheduled Email Check`
- `Google Auth Nango Powered Onboarding`
- Any workflow that processes user data

**✅ Checkpoint:** n8n errors should now be sent to Sentry

**👉 Next:** Tell me "n8n error handling is configured, ready to test"

---

## Phase 5: Test n8n Error Capture (I Do This)

**Tell me:** "Test n8n error capture"

I will:
1. Create a test n8n workflow that intentionally fails
2. Verify error appears in Sentry with n8n context
3. Check that email notification includes workflow details

**After testing:**
- You should see n8n errors in Sentry with workflow_id, execution_id
- Email notifications should include n8n context

**✅ Checkpoint:** Both Railway and n8n errors are being captured

---

## Phase 6: Railway Infrastructure Alerts (You Do This)

### Configure Railway Notifications
1. Go to Railway Dashboard → Your Project
2. Click **Settings** (gear icon)
3. Go to **Notifications** tab
4. Enable email notifications for:
   - ✅ Build failures
   - ✅ Deployment failures
   - ✅ Service health issues

### Configure Railway Alerts (Optional)
1. Go to Railway Dashboard → Your Service
2. Click **Settings → Monitoring**
3. Set up alerts for:
   - CPU usage > 80%
   - Memory usage > 80%
   - Disk usage > 80%

**✅ Checkpoint:** Railway infrastructure alerts are configured

---

## Phase 7: Optional - Supabase Sync for Dashboard (I Do This)

**Tell me:** "Set up Supabase sync for error dashboard"

I will:
1. Create Supabase migration for `error_logs` table
2. Create `/api/errors/sync-sentry` webhook endpoint
3. Configure Sentry webhook to call this endpoint
4. Store error summaries in Supabase for dashboard queries

**After I'm done, you'll need to:**
- Configure Sentry webhook (Step 7.1)

---

## Phase 7.1: Configure Sentry Webhook (You Do This)

1. In Sentry dashboard, go to **Settings → Integrations → Webhooks**
2. Click **"Add Webhook"**
3. **Endpoint URL**: `https://bippity.boo/api/errors/sync-sentry`
4. **Events to send**:
   - ✅ `event.created` (new error)
   - ✅ `event.updated` (error updated)
5. Save webhook

**✅ Checkpoint:** Errors are syncing to Supabase for dashboard

---

## Summary Checklist

### ✅ You've Completed:
- [ ] Created Sentry account and project
- [ ] Configured Sentry email notifications
- [ ] Added Sentry environment variables to Railway
- [ ] Configured Railway infrastructure alerts
- [ ] Added error handling to n8n workflows
- [ ] (Optional) Configured Sentry webhook for Supabase sync

### ✅ I've Completed:
- [ ] Installed Sentry in Next.js codebase
- [ ] Created n8n error webhook endpoint
- [ ] Tested error capture from Railway
- [ ] Tested error capture from n8n
- [ ] (Optional) Set up Supabase sync

---

## Quick Reference: When to Tell Me to Build

1. **After Step 1.4:** "I've completed Sentry setup, ready for you to install Sentry in the codebase"
2. **After Step 2.1:** "Railway environment variables are set, ready to test Sentry"
3. **After Step 3:** "Sentry is working, ready for n8n integration"
4. **After Step 4.1:** "n8n error handling is configured, ready to test"
5. **After Step 5:** "Ready for optional Supabase sync" (if you want dashboard metrics)

---

## Troubleshooting

### Sentry not capturing errors?
- Check Railway environment variables are set correctly
- Verify `NEXT_PUBLIC_SENTRY_DSN` is correct
- Check Railway logs: `railway logs`
- Verify Sentry project is active in Sentry dashboard

### Not receiving email notifications?
- Check Sentry Settings → Notifications → Email
- Verify alert rules are active
- Check spam folder
- Verify email address in Sentry settings

### n8n errors not appearing in Sentry?
- Check webhook URL is correct
- Verify `N8N_API_KEY` is set in n8n environment variables
- Check n8n workflow execution logs
- Verify HTTP Request node is configured correctly

---

## Next Steps After Setup

Once error monitoring is working:
1. Monitor Sentry dashboard for errors
2. Set up error resolution workflow
3. Create dashboard for error metrics (separate task)
4. Configure additional alert rules as needed


