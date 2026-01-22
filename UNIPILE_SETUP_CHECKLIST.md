# Unipile Setup Checklist

## Before You Can Test

### ✅ Step 1: Create Unipile Account
1. Go to https://unipile.com or https://dashboard.unipile.com
2. Sign up (email + password)
3. Verify your email

**Time:** 2 minutes

---

### ✅ Step 2: Get Your API Key
1. Log into Unipile Dashboard
2. Go to **Settings** → **API Keys** (or similar section)
3. Click "Create API Key" or copy existing one
4. Save it somewhere safe (you'll need this for the test)

**Copy this value** - it's your `UNIPILE_API_KEY`

**Time:** 1 minute

---

### ✅ Step 3: Configure OAuth Settings (IMPORTANT!)

#### For Testing (Simple):
1. In Unipile Dashboard → **Settings** → **OAuth** (or **Hosted Auth**)
2. Add **Redirect URLs**:
   ```
   http://localhost:3000/auth/success
   http://localhost:3000/auth/failure
   ```
3. Or just use Unipile's **default hosted auth** (no config needed)

#### For Production (Later):
Add your real domain:
```
https://yourdomain.com/auth/callback
https://yourdomain.com/auth/success
```

**Time:** 2 minutes

---

### ✅ Step 4: Enable Email Scope
1. Check that **Gmail/Email** provider is enabled
2. Make sure these scopes are selected:
   - ✅ Read emails
   - ✅ Send emails
   - ✅ Modify emails (for labels/archive)

**Usually enabled by default**, but double-check.

**Time:** 1 minute

---

### ✅ Step 5: (Optional) Set Up Webhooks

**Skip for initial test** - you can add this later!

When you're ready:
1. Go to **Webhooks** section
2. Add webhook URL:
   ```
   https://your-app.railway.app/api/webhooks/unipile/email
   ```
3. Select events to receive:
   - ✅ Email received
   - ✅ Email sent
   - ✅ Email updated

**Time:** 2 minutes (do later)

---

### ✅ Step 6: (Optional) Custom Domain

**Skip for testing** - only needed for production white-labeling!

When you're ready:
1. Go to **Custom Domain** settings
2. Enter your domain: `auth.yourdomain.com`
3. Add the CNAME record they provide to your DNS
4. Wait for verification (can take up to 24 hours)

**Time:** 5 minutes setup + DNS propagation

---

## Minimum Required for Test

To run `test-unipile-signup.ts`, you **ONLY** need:

1. ✅ Unipile account created
2. ✅ API Key copied
3. ✅ That's it!

The hosted auth link will work automatically with default settings.

---

## Quick Checklist

Before running the test script:

- [ ] I have a Unipile account
- [ ] I have my API Key saved
- [ ] I set `export UNIPILE_API_KEY=...` in terminal
- [ ] I have a test Gmail account ready to connect
- [ ] Ready to run: `npx tsx test-unipile-signup.ts`

---

## Dashboard Navigation Tips

Unipile dashboards may vary, but look for these sections:

### Main Navigation:
- **Home** / **Dashboard** - Overview
- **Accounts** - See connected user accounts
- **Messages** - View emails (after connecting an account)
- **Settings** - API Keys, OAuth config, Webhooks
- **API** or **Developers** - API documentation, test console
- **Billing** - Check your plan/usage

### Key Pages:

**For Setup:**
- Settings → API Keys ← **Start here**
- Settings → OAuth / Hosted Auth
- Settings → Webhooks (later)

**For Testing:**
- Accounts → Add Account ← **Manual test without code**
- Messages → View emails from connected accounts

**For Debugging:**
- Logs or Activity → See API calls
- Webhooks → See webhook deliveries

---

## What You DON'T Need to Configure

✅ **No Google Cloud Console setup** - Unipile handles this  
✅ **No OAuth2 credentials** - Unipile provides them  
✅ **No scope configuration** - Already configured by Unipile  
✅ **No webhook verification** - Skip for initial test  
✅ **No custom domain** - Skip for testing  

---

## After You Get Your API Key

Run this to verify it works:

```bash
# Set your API key
export UNIPILE_API_KEY=upk_live_abc123...

# Test API access
curl -X GET "https://api.unipile.com/api/v1/accounts" \
  -H "X-API-KEY: $UNIPILE_API_KEY"
```

**Expected response:**
```json
{
  "items": [],
  "cursor": null
}
```

If you see this (even with empty items), your API key works! ✅

---

## Common Issues

### "Invalid API Key"
- Double-check you copied the full key
- Make sure there are no extra spaces
- Some dashboards have "Test" vs "Live" keys - use the right one

### "Unauthorized" or 401 Error
- API key might be deactivated
- Regenerate a new key in dashboard
- Make sure you're using the header name: `X-API-KEY` (not `Authorization`)

### Can't Find API Keys Section
- Try: Settings → API → Keys
- Or: Settings → Developers → API Keys
- Or: Account → API Access
- Or contact Unipile support (they're responsive!)

---

## Ready to Test?

Once you have your API key:

```bash
export UNIPILE_API_KEY=your_key_here
npx tsx test-unipile-signup.ts
```

---

**Estimated Total Setup Time**: 5-10 minutes  
**Minimum Required**: Just the API key!
