# Custom Domain Setup - Next Steps

## ✅ Custom Domain Activated

Great! Your Supabase custom domain is now active. Here's what to do next:

## Step 1: Update Environment Variables

Update your `NEXT_PUBLIC_SUPABASE_URL` environment variable in Railway to use your custom domain:

**Railway Dashboard → Your Service → Variables:**

```
NEXT_PUBLIC_SUPABASE_URL=https://[your-custom-domain]
```

**Example:**
- If your custom domain is `api.bippity.boo`, set:
  ```
  NEXT_PUBLIC_SUPABASE_URL=https://api.bippity.boo
  ```

**Note:** The old Supabase URL (`fvjmzvvcyxsvstlhenex.supabase.co`) will continue to work, but using your custom domain is recommended for consistency.

## Step 2: Verify Google OAuth Redirect URIs

Make sure your Google OAuth Client has BOTH URLs in the authorized redirect URIs:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **Credentials**
3. Click on your OAuth 2.0 Client ID
4. Under **Authorized redirect URIs**, ensure you have:
   - `https://fvjmzvvcyxsvstlhenex.supabase.co/auth/v1/callback` (original)
   - `https://[your-custom-domain]/auth/v1/callback` (new custom domain)
   - `https://bippity.boo/auth/callback` (your app callback)

**Example if custom domain is `api.bippity.boo`:**
```
https://fvjmzvvcyxsvstlhenex.supabase.co/auth/v1/callback
https://api.bippity.boo/auth/v1/callback
https://bippity.boo/auth/callback
```

## Step 3: Test OAuth Flow

1. **Redeploy your app** (to pick up the new environment variable):
   ```bash
   railway up
   ```
   Or just push to git if auto-deploy is enabled.

2. **Test the OAuth flow**:
   - Go to `https://bippity.boo`
   - Click "Sign Up With Google"
   - **Verify** that the OAuth consent screen shows your custom domain (e.g., `api.bippity.boo`) instead of `fvjmzvvcyxsvstlhenex.supabase.co`
   - Complete the OAuth flow
   - Verify everything still works

## Step 4: Update Google OAuth Consent Screen (Optional but Recommended)

Now that you have a custom domain, configure the Google OAuth consent screen with your branding:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **OAuth consent screen**
3. Update:
   - **App name**: `Bippity.boo`
   - **App logo**: Upload your logo
   - **Application home page**: `https://bippity.boo`
   - **Privacy policy link**: `https://bippity.boo/privacy`
   - **Terms of service link**: `https://bippity.boo/terms`
   - **Authorized domains**: `bippity.boo` and your custom domain (e.g., `api.bippity.boo`)

## Verification Checklist

- [ ] Updated `NEXT_PUBLIC_SUPABASE_URL` in Railway to use custom domain
- [ ] Added custom domain callback URL to Google OAuth redirect URIs
- [ ] Redeployed app (or auto-deployed)
- [ ] Tested OAuth flow - consent screen shows custom domain
- [ ] OAuth flow completes successfully
- [ ] User data saves correctly to Supabase
- [ ] n8n webhook triggers correctly

## What Changed?

- **Before**: OAuth consent screen showed `fvjmzvvcyxsvstlhenex.supabase.co`
- **After**: OAuth consent screen shows your custom domain (e.g., `api.bippity.boo`)

Both URLs will continue to work, but your custom domain is now the primary one shown to users.

## Troubleshooting

### OAuth still shows old domain?
- Clear browser cache and try incognito mode
- Verify `NEXT_PUBLIC_SUPABASE_URL` is updated in Railway
- Check that the custom domain is actually activated in Supabase

### OAuth flow fails?
- Verify both callback URLs are in Google OAuth redirect URIs
- Check Railway logs: `railway logs`
- Verify environment variables are set correctly

### Custom domain not resolving?
- Check DNS propagation: `dig api.bippity.boo` (or your custom domain)
- Verify CNAME and TXT records are correct
- Wait up to 30 minutes for DNS propagation
