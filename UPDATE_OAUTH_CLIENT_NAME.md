# Update OAuth Client Name from "TLDRpal Nango Version" to "Bippity.Boo"

## Problem
When users go to revoke/delete the Google connection in their Google Account settings, they see "TLDRpal Nango Version" instead of "Bippity.Boo".

## Solution
The application name comes from the **OAuth Consent Screen** in Google Cloud Console, not from your code. You need to update it there.

## Steps

### Option 1: If You're Using Supabase's Default OAuth Client

If you're using Supabase's built-in Google OAuth (default), you need to check if Supabase allows you to customize the app name. However, typically you'll need to:

1. **Set up your own OAuth client in Google Cloud Console:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create or select your project
   - Go to **APIs & Services** → **Credentials**
   - Create OAuth 2.0 Client ID (if you don't have one)
   - Note the Client ID and Client Secret

2. **Configure it in Supabase:**
   - Go to [Supabase Dashboard](https://supabase.com/dashboard)
   - Select your project
   - Go to **Authentication** → **Providers** → **Google**
   - Enter your Google Client ID and Client Secret
   - Save

3. **Update OAuth Consent Screen:**
   - In Google Cloud Console, go to **APIs & Services** → **OAuth consent screen**
   - Click **Edit App**
   - Update **Application name** to "Bippity.Boo"
   - Update **Support email**, **App logo** (optional), and **App domain** if needed
   - Save changes

### Option 2: If You Already Have a Custom OAuth Client

If you already configured a custom Google OAuth client in Supabase:

1. **Find which Google Cloud project is being used:**
   - Go to Supabase Dashboard → Authentication → Providers → Google
   - Check if Client ID is configured
   - Note the Client ID

2. **Update the OAuth Consent Screen:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Select the project that contains the OAuth client with that Client ID
   - Go to **APIs & Services** → **OAuth consent screen**
   - Click **Edit App**
   - Update **Application name** from "TLDRpal Nango Version" to "Bippity.Boo"
   - Update other fields as needed:
     - Support email
     - App logo (optional)
     - App domain: `bippity.boo`
     - Authorized domains: `bippity.boo`
   - **Save** changes

3. **Important Notes:**
   - After changing the app name, Google may require you to submit for verification again
   - For testing/development, you can use "Testing" mode (no verification needed for up to 100 users)
   - Changes may take a few minutes to propagate

## Verification

After updating:

1. **Test the OAuth flow:**
   - Go to https://bippity.boo
   - Click "Sign Up With Google"
   - Check if the consent screen shows "Bippity.Boo"

2. **Check connected apps:**
   - Go to [Google Account Settings](https://myaccount.google.com/security)
   - Go to **Security** → **Third-party apps with account access**
   - Find your app - it should now show "Bippity.Boo" instead of "TLDRpal Nango Version"

## Additional Resources

- [Google OAuth Consent Screen Documentation](https://developers.google.com/identity/protocols/oauth2/policies)
- [Supabase Auth Provider Configuration](https://supabase.com/docs/guides/auth/social-login/auth-google)







