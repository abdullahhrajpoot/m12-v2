# Webhook Not Triggering Diagnosis

## Issue
Sign-up completes but `Parallelized_Onboarding_Supabase` workflow is not being triggered.

## Expected Webhook URL
```
https://chungxchung.app.n8n.cloud/webhook/parallelized-supabase-oauth
```

## Checklist

### 1. Verify Environment Variable in Railway
- [ ] Go to Railway Dashboard → Your Service → Variables
- [ ] Check if `N8N_ONBOARDING_WEBHOOK_URL` is set
- [ ] Value should be: `https://chungxchung.app.n8n.cloud/webhook/parallelized-supabase-oauth`
- [ ] If not set, add it (or the callback will use the default)

**Note**: The callback route has a default fallback, so this might not be the issue, but it's good to verify.

### 2. Verify Workflow is Active
✅ **Confirmed**: Workflow `Parallelized_Onboarding_Supabase` (ID: `vexJG6Y46lso0qKf`) is **ACTIVE**

### 3. Check Railway Logs
After a sign-up attempt, check Railway logs for:

**Success indicators:**
```
📞 Triggering n8n webhook for user: [userId] email: [email] webhook: [url]
✅ n8n onboarding webhook triggered successfully
```

**Error indicators:**
```
❌ No userId - cannot trigger webhook!
❌ Error calling n8n onboarding webhook: [error]
❌ n8n webhook returned error status: [status]
```

**To check logs:**
```bash
railway logs
# Or in Railway Dashboard → Service → Deployments → View Logs
```

### 4. Check if userId is Being Set
The webhook only triggers if `userId` is set. Check logs for:

**If OAuth code is present:**
```
Callback route hit: { hasCode: true, ... }
After exchangeCodeForSession: { hasUser: true, ... }
```

**If no code (existing session):**
```
⚠️ No code in callback - checking for existing session
✅ Found existing session for user: [userId]
```

**If userId is missing:**
```
❌ No userId - cannot trigger webhook!
```

### 5. Verify Webhook is Receiving Requests
In n8n:
1. Go to `Parallelized_Onboarding_Supabase` workflow
2. Check the "Supabase OAuth Webhook" node
3. Look at recent executions
4. Check if any requests are coming in

**If no requests:**
- The callback isn't reaching the webhook
- Check Railway logs for webhook call errors

**If requests are coming but failing:**
- Check the "OAuth Successful?" node
- It expects `body.userId` to exist
- Verify the request payload matches what the workflow expects

### 6. Test Webhook Manually
You can test if the webhook is accessible:

```bash
curl -X POST https://chungxchung.app.n8n.cloud/webhook/parallelized-supabase-oauth \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user-id",
    "email": "test@example.com",
    "fullName": "Test User"
  }'
```

**Expected**: Should trigger the workflow (you'll see it in n8n executions)

### 7. Check Supabase Custom Domain
Since you're using `api.bippity.boo` as custom domain:
- [ ] Verify Supabase Auth is configured to use the custom domain
- [ ] Check Supabase Dashboard → Authentication → URL Configuration
- [ ] Site URL should be: `https://bippity.boo`
- [ ] Redirect URLs should include: `https://bippity.boo/auth/callback`

### 8. Common Issues

#### Issue: userId is null
**Cause**: `exchangeCodeForSession` didn't return a user
**Solution**: 
- Check Supabase logs for auth errors
- Verify OAuth redirect URIs match exactly
- Check if cookies are being set correctly (domain: `.bippity.boo`)

#### Issue: Webhook call fails silently
**Cause**: Network error or timeout
**Solution**:
- Check Railway logs for fetch errors
- Verify n8n webhook URL is accessible
- Check if Railway can reach n8n.cloud

#### Issue: Workflow receives request but doesn't process
**Cause**: "OAuth Successful?" node condition fails
**Solution**:
- Check workflow execution logs
- Verify `body.userId` exists in the webhook payload
- The condition checks: `$json.body.userId` exists

## Quick Fix Steps

1. **Check Railway logs immediately after sign-up**
   ```bash
   railway logs --tail
   ```

2. **Verify environment variable is set** (optional but recommended)
   ```
   N8N_ONBOARDING_WEBHOOK_URL=https://chungxchung.app.n8n.cloud/webhook/parallelized-supabase-oauth
   ```

3. **Redeploy if you just updated variables**
   ```bash
   railway up
   ```

4. **Test the webhook manually** (see step 6 above)

5. **Check n8n workflow executions** to see if requests are arriving

## Next Steps

After checking the above:
1. Share Railway logs from a sign-up attempt
2. Share n8n workflow execution logs (if any requests are received)
3. Confirm if `userId` is being logged in the callback route
