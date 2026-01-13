# Google OAuth Verification Guide for bippity.boo

This guide walks you through setting up bippity.boo for Google OAuth verification.

## ✅ Pre-requisites Already Complete

Your app is already configured correctly:

- **Railway**: `NEXT_PUBLIC_APP_URL=https://bippity.boo` ✅
- **Railway**: `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` configured ✅
- **Railway Domain**: `bippity.boo` configured ✅
- **Code**: OAuth redirects to `bippity.boo/auth/callback` ✅
- **Privacy Policy**: Created at `/privacy` ✅
- **Terms of Service**: Created at `/terms` ✅

---

## 📋 Step 1: Google Cloud Console - OAuth Consent Screen

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to **APIs & Services** → **OAuth consent screen**
4. Click **EDIT APP**

### Update these fields:

| Field | Value |
|-------|-------|
| App name | `Bippity Boo` |
| User support email | Your email |
| App logo | Upload `bippity logo transparent.png` from your project |
| Application home page | `https://bippity.boo` |
| Application privacy policy link | `https://bippity.boo/privacy` |
| Application terms of service link | `https://bippity.boo/terms` |
| Authorized domains | `bippity.boo` |
| Developer contact email | Your email |

### Scopes to Include:
Your app requests these scopes (verify they're listed):
- `email`
- `profile`
- `https://www.googleapis.com/auth/gmail.readonly`
- `https://www.googleapis.com/auth/gmail.labels`
- `https://www.googleapis.com/auth/calendar`
- `https://www.googleapis.com/auth/tasks`

---

## 📋 Step 2: Google Cloud Console - OAuth Credentials

1. Navigate to **APIs & Services** → **Credentials**
2. Click on your **OAuth 2.0 Client ID**

### Authorized JavaScript Origins:
```
https://bippity.boo
https://fvjmzvvcyxsvstlhenex.supabase.co
http://localhost:3000
```

### Authorized Redirect URIs:
```
https://bippity.boo/auth/callback
https://fvjmzvvcyxsvstlhenex.supabase.co/auth/v1/callback
http://localhost:3000/auth/callback
```

---

## 📋 Step 3: Supabase Dashboard

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project (`fvjmzvvcyxsvstlhenex`)

### Authentication → Providers → Google
- Verify Client ID matches your Google OAuth Client ID
- Verify Client Secret matches your Google OAuth Client Secret

### Authentication → URL Configuration

| Setting | Value |
|---------|-------|
| Site URL | `https://bippity.boo` |
| Redirect URLs | Add: `https://bippity.boo/auth/callback` |

---

## 📋 Step 4: Google Search Console (Site Verification)

1. Go to [Google Search Console](https://search.google.com/search-console)
2. Click **Add Property**
3. Choose **URL prefix** → Enter `https://bippity.boo`
4. Verify ownership using one of these methods:
   - **HTML file upload** (recommended): Download the verification file and add to `/public`
   - **HTML tag**: Add meta tag to your layout
   - **DNS record**: Add TXT record to your domain

### For HTML file verification:
Place the downloaded `googleXXXXXXXX.html` file in `/public/` folder.

---

## 📋 Step 5: Deploy & Test

1. **Deploy the new pages:**
   ```bash
   railway up
   ```
   Or push to git and let Railway auto-deploy.

2. **Verify pages are accessible:**
   - https://bippity.boo/privacy
   - https://bippity.boo/terms

3. **Test OAuth flow:**
   - Go to https://bippity.boo
   - Click "Sign Up With Google"
   - Verify you see "bippity.boo" in the consent screen

---

## 📋 Step 6: Submit for Verification

1. Return to **Google Cloud Console** → **OAuth consent screen**
2. Click **PREPARE FOR VERIFICATION**
3. Complete the verification form:
   - Explain what your app does
   - Justify each scope requested
   - Provide demo video if requested

### Scope Justifications:

| Scope | Justification |
|-------|---------------|
| `gmail.readonly` | Read emails to generate summaries and identify important messages |
| `gmail.labels` | Categorize and filter emails by labels |
| `calendar` | Identify calendar-related emails and event reminders |
| `tasks` | Extract and manage action items from emails |

---

## 🧹 Optional Cleanup

Remove the unused Nango secret key from Railway:
```bash
# In Railway dashboard, delete this variable:
NANGO_SECRET_KEY
```

---

## ⏱️ Verification Timeline

- **Sensitive scopes** (gmail.readonly, calendar, tasks): Usually 4-6 weeks
- Google may request additional information or a security assessment
- You can continue testing with up to 100 users while awaiting verification

---

## 🔗 Useful Links

- [Google OAuth Verification FAQ](https://support.google.com/cloud/answer/9110914)
- [OAuth App Verification Requirements](https://support.google.com/cloud/answer/7454865)
- [Google API Services User Data Policy](https://developers.google.com/terms/api-services-user-data-policy)
- [Supabase Google OAuth Docs](https://supabase.com/docs/guides/auth/social-login/auth-google)

---

## ✅ Final Checklist

- [ ] Updated OAuth consent screen with bippity.boo URLs
- [ ] Added bippity.boo to authorized domains
- [ ] Updated OAuth credentials with bippity.boo redirect URIs
- [ ] Updated Supabase Site URL to https://bippity.boo
- [ ] Added https://bippity.boo/auth/callback to Supabase redirect URLs
- [ ] Verified bippity.boo ownership in Google Search Console
- [ ] Deployed privacy and terms pages
- [ ] Tested OAuth flow end-to-end
- [ ] Submitted for verification
