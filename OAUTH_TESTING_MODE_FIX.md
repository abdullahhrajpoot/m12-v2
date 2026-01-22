# Fix OAuth by Staying in Testing Mode

## Problem
Switched OAuth app from "Testing" to "Production" without verification → Google invalidated all tokens.

## Solution: Set Back to Testing Mode

### Steps in Google Cloud Console

1. **Go to OAuth consent screen:**
   ```
   https://console.cloud.google.com/apis/credentials/consent
   ```

2. **Change Publishing Status:**
   - Click "MAKE TESTING" or "Publishing status" 
   - Set to: **Testing**
   - Status should show: "Testing" (not "In production")

3. **Add Test Users:**
   - Scroll down to "Test users" section
   - Click "+ ADD USERS"
   - Add email addresses that need access:
     ```
     hanschung@gmail.com
     [any other emails that need to use the app]
     ```
   - Save

4. **Verify Settings:**
   - **User type:** External (this is fine for testing)
   - **Publishing status:** Testing
   - **Test users:** Your email(s) listed
   - **Scopes:** All required scopes added (Calendar, Tasks, Gmail)

### Why Testing Mode is Better for You

✅ **Pros:**
- No verification needed
- Works immediately after adding test users
- All scopes available (Calendar, Tasks, Gmail)
- Full API access
- Perfect for personal/family apps
- Supports up to 100 test users

⚠️ **Cons:**
- Users see "unverified app" warning (you can click "Continue" to bypass)
- Must manually add each user as a test user
- Users not in test list can't authenticate

### After Setting to Testing Mode

1. **Add yourself as test user** (if not already)
2. **Log out of Bippity completely**
3. **Clear browser cookies** for bippity.boo
4. **Log back in**
5. **Accept the "unverified app" warning** (click "Advanced" → "Go to [app name]")
6. **Grant permissions**

This will create a **fresh, valid token** that works with Google APIs.

### What the "Unverified App" Warning Looks Like

When users authenticate, they'll see:
```
⚠️ This app hasn't been verified by Google

Advanced → Go to [Your App] (unsafe)
```

**This is normal for Testing mode** - just click through it. It doesn't mean anything is actually unsafe, just that you haven't gone through Google's lengthy verification process.

### When You'd Need Production Mode

You only need Production + Verification if:
- Public app with >100 users
- Want to remove the "unverified" warning
- Publishing to Google Workspace Marketplace
- Enterprise compliance requirements

**For a personal/family scheduling app:** Testing mode is perfect.

### Verification Requirements (If You Ever Wanted It)

**What Google requires for verification:**
- Public homepage URL
- Privacy policy (published online)
- Terms of service (published online)
- YouTube video demonstrating the app
- Detailed scope justification (why you need Calendar, Gmail, Tasks access)
- Domain verification
- Security assessment
- 2-8 week review period
- Possible security audit

**Not worth it** unless you're building a commercial product for thousands of users.

### Check Your Current Status

Run this to see if you're in Testing mode:

1. Go to: https://console.cloud.google.com/apis/credentials/consent
2. Look for "Publishing status" at the top
3. Should say: **"Testing"** (not "In production")

### Alternative: Use Service Account (Advanced)

If you only need access to your own calendar/tasks (not other family members), you could use a Service Account instead of OAuth. This avoids the testing/production issue entirely. But OAuth is the right choice for a multi-user family app.

---

**Bottom Line:** Set your OAuth consent screen back to "Testing" mode, add yourself as a test user, and log back in. You'll get valid tokens immediately without needing verification.
