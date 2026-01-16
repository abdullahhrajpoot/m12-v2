# Railway Logs Empty - Troubleshooting

## Possible Causes

1. **App not deployed/running**
2. **Looking at wrong log stream** (build logs vs runtime logs)
3. **Logs not being captured** (Next.js logging issue)
4. **Route not being hit** (callback not executing)

## Quick Checks

### 1. Verify App is Running

**Check Railway Dashboard:**
- Go to your service
- Check **Deployments** tab
- Verify latest deployment is **Active** and **Running**
- Check if there are any failed deployments

**Check if site is accessible:**
```bash
curl -I https://bippity.boo
# Should return HTTP 200 or 301/302
```

### 2. Check Which Logs You're Viewing

Railway has different log streams:

**Build Logs** (during deployment):
- Show during `railway up` or git push
- Only show build process, not runtime

**Runtime Logs** (after deployment):
- Show `console.log`, `console.error` from running app
- These are what you need for debugging

**How to view runtime logs:**
```bash
# Via CLI
railway logs --tail

# Via Dashboard
# Service → Deployments → Click on active deployment → View Logs
# OR
# Service → Metrics → Logs tab
```

### 3. Test if Logging Works

Create a test endpoint to verify logs are being captured:

**`app/api/test-logs/route.ts`:**
```typescript
import { NextResponse } from 'next/server'

export async function GET() {
  console.log('✅ TEST LOG: API route hit at', new Date().toISOString())
  console.error('✅ TEST ERROR LOG: This is a test error')
  
  return NextResponse.json({ 
    message: 'Check Railway logs for test messages',
    timestamp: new Date().toISOString()
  })
}
```

Then:
1. Deploy this file
2. Visit: `https://bippity.boo/api/test-logs`
3. Check Railway logs immediately
4. You should see the test log messages

### 4. Check if Callback Route is Being Hit

The callback route has this log at the very start:
```typescript
console.log('Callback route hit:', { ... })
```

**If you don't see this log:**
- The callback route isn't being executed
- OAuth redirect might be going elsewhere
- Check browser network tab during sign-up to see where it redirects

### 5. Verify Middleware Logs

The middleware also logs:
```typescript
console.log('MIDDLEWARE: /auth/callback hit', { ... })
```

**Check for this log too** - it should appear before the callback route log.

## Common Issues

### Issue: "No logs at all"
**Solution:**
- Check Railway service status (is it running?)
- Try the test endpoint above
- Check Railway dashboard → Service → Metrics → Logs

### Issue: "See build logs but not runtime logs"
**Solution:**
- You're looking at deployment logs, not runtime logs
- Switch to runtime logs in Railway dashboard
- Or use `railway logs --tail` for live logs

### Issue: "Logs appear but callback logs missing"
**Solution:**
- Callback route isn't being hit
- Check OAuth redirect URL configuration
- Verify user is actually completing OAuth flow
- Check browser console for errors

### Issue: "Next.js logs not showing in Railway"
**Solution:**
- Next.js logs to stdout/stderr by default
- Railway should capture these automatically
- If not, check Railway service configuration
- Try adding explicit logging:

```typescript
// Force log to stderr
process.stderr.write(`[${new Date().toISOString()}] Log message\n`)
```

## Quick Diagnostic Steps

1. **Check app is live:**
   ```bash
   curl https://bippity.boo
   ```

2. **Check test endpoint:**
   ```bash
   curl https://bippity.boo/api/test-logs
   # Then check Railway logs
   ```

3. **Check callback route directly:**
   - Try visiting: `https://bippity.boo/auth/callback?code=test`
   - Should see error logs (invalid code)
   - This confirms route is accessible

4. **Check Railway service health:**
   - Railway Dashboard → Service → Metrics
   - Check CPU, Memory, Request count
   - If all zeros, service might not be running

## Next Steps

1. Create the test endpoint above
2. Deploy and test
3. Check Railway logs
4. If test logs appear → logging works, callback just not being hit
5. If test logs don't appear → Railway logging issue or app not running
