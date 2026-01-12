# Custom OAuth Consent Screen Setup Guide

This guide explains how to customize the Google OAuth consent screen to show your branding (bippity.boo) instead of the default Supabase branding.

## Overview

There are **two ways** to customize the OAuth consent screen:

1. **Supabase Custom Domain** (Recommended) - Changes the URL shown on the consent screen from `fvjmzvvcyxsvstlhenex.supabase.co` to your custom domain (e.g., `api.bippity.boo`)
2. **Google OAuth Consent Screen Configuration** - Controls the branding (logo, app name, privacy policy links, etc.)

**For full customization, you should do BOTH:**
- Set up a Supabase custom domain to show your domain name
- Configure the Google OAuth consent screen with your branding

## Option 1: Supabase Custom Domain (Recommended First Step)

According to [Supabase Custom Domains documentation](https://supabase.com/docs/guides/platform/custom-domains), custom domains are useful when "You are using OAuth (Social Login) with Supabase Auth and the project's URL is shown on the OAuth consent screen."

### Benefits:
- Shows your domain (e.g., `api.bippity.boo`) instead of `fvjmzvvcyxsvstlhenex.supabase.co` on the OAuth consent screen
- Makes your API URLs more professional and portable
- Available as a paid add-on for projects on a paid plan

### Setup Steps:

1. **Install Supabase CLI** (if not already installed):
   ```bash
   npm install -g supabase
   ```

2. **Login to Supabase**:
   ```bash
   supabase login
   ```

3. **Check domain availability** (optional - for vanity subdomains):
   ```bash
   supabase vanity-subdomains --project-ref fvjmzvvcyxsvstlhenex check-availability --desired-subdomain bippity-api --experimental
   ```

4. **Create custom domain**:
   ```bash
   supabase domains create --project-ref fvjmzvvcyxsvstlhenex --custom-hostname api.bippity.boo
   ```
   
   This will return a TXT record you need to add to your DNS.

5. **Add DNS records**:
   - **CNAME record**: `api.bippity.boo` → `fvjmzvvcyxsvstlhenex.supabase.co.`
   - **TXT record**: `_acme-challenge.api.bippity.boo` → (value from step 4)

6. **Verify domain**:
   ```bash
   supabase domains reverify --project-ref fvjmzvvcyxsvstlhenex
   ```

7. **Update Google OAuth redirect URIs** (BEFORE activating):
   - Go to Google Cloud Console → Credentials → Your OAuth Client
   - Add BOTH URLs to Authorized Redirect URIs:
     - `https://fvjmzvvcyxsvstlhenex.supabase.co/auth/v1/callback` (existing)
     - `https://api.bippity.boo/auth/v1/callback` (new)

8. **Activate domain**:
   ```bash
   supabase domains activate --project-ref fvjmzvvcyxsvstlhenex
   ```

9. **Update your app** (optional - old URL still works):
   ```typescript
   // You can now use either URL:
   const supabase = createClient('https://api.bippity.boo', 'your-key')
   // OR keep using the old one:
   const supabase = createClient('https://fvjmzvvcyxsvstlhenex.supabase.co', 'your-key')
   ```

**Note**: Custom domains are a paid add-on. Check your Supabase plan.

## Option 2: Google OAuth Consent Screen Configuration

This controls the visual branding on the consent screen (logo, app name, links, etc.).

## Step 2: Create/Configure Google Cloud Project

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Select or create a project**:
   - If you already have a project with OAuth credentials, use that
   - Otherwise, create a new project (e.g., "Bippity Boo")

## Step 3: Configure OAuth Consent Screen

1. **Navigate to OAuth Consent Screen**:
   - Go to **APIs & Services** → **OAuth consent screen**

2. **Choose User Type**:
   - **External** (for public users) - Recommended for most apps
   - **Internal** (only for Google Workspace users)

3. **Fill in App Information**:
   - **App name**: `Bippity.boo` (or your preferred name)
   - **User support email**: Your email
   - **App logo**: Upload your logo (recommended: 120x120px PNG)
   - **App domain**: `bippity.boo`
   - **Application home page**: `https://bippity.boo`
   - **Privacy policy link**: `https://bippity.boo/privacy`
   - **Terms of service link**: `https://bippity.boo/terms`
   - **Authorized domains**: Add `bippity.boo`

4. **Developer contact information**:
   - Your email address

5. **Scopes** (Add the scopes you need):
   - `email`
   - `profile`
   - `https://www.googleapis.com/auth/gmail.readonly`
   - `https://www.googleapis.com/auth/gmail.labels`
   - `https://www.googleapis.com/auth/calendar`
   - `https://www.googleapis.com/auth/tasks`

6. **Test users** (if app is in Testing mode):
   - Add test email addresses that can use the app before verification

7. **Save and Continue**

## Step 4: Create OAuth 2.0 Credentials

1. **Navigate to Credentials**:
   - Go to **APIs & Services** → **Credentials**

2. **Create OAuth 2.0 Client ID**:
   - Click **+ CREATE CREDENTIALS** → **OAuth 2.0 Client ID**
   - **Application type**: Web application
   - **Name**: `Bippity.boo Web Client`

3. **Authorized redirect URIs** (Add these):
   ```
   https://fvjmzvvcyxsvstlhenex.supabase.co/auth/v1/callback
   https://api.bippity.boo/auth/v1/callback  (if using custom domain)
   https://bippity.boo/auth/callback
   http://localhost:3000/auth/callback  (for local development)
   ```
   
   **Important**: 
   - Always include the Supabase project URL (`fvjmzvvcyxsvstlhenex.supabase.co`)
   - If you set up a custom domain, add that URL too
   - Your app callback (`bippity.boo/auth/callback`) is also needed

4. **Save** and copy:
   - **Client ID**
   - **Client Secret**

## Step 5: Configure Supabase Auth

1. **Go to Supabase Dashboard**:
   - Navigate to your project → **Authentication** → **Providers**

2. **Configure Google Provider**:
   - Enable **Google** provider
   - **Client ID (for OAuth)**: Paste your Google Client ID
   - **Client Secret (for OAuth)**: Paste your Google Client Secret
   - **Save**

## Step 6: Update Environment Variables

Update your Railway (or deployment) environment variables:

```bash
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here
```

**Note**: These should match the credentials you created in Google Cloud Console, NOT the Supabase default credentials.

## Step 7: Verify Custom Branding

1. **Test the OAuth flow**:
   - Go to `https://bippity.boo`
   - Click "Sign Up With Google"
   - You should see your custom consent screen with:
     - Your app name (Bippity.boo)
     - Your logo
     - Your privacy policy and terms links
     - Your app domain

2. **If you still see Supabase branding**:
   - Check that you're using YOUR Google Client ID/Secret, not Supabase's
   - Verify the credentials are correctly set in Supabase Auth settings
   - Clear browser cache and try again
   - Check that environment variables are set correctly in Railway

## Step 8: Publish Your App (Optional)

If you want to make your app available to all Google users (not just test users):

1. **Go back to OAuth Consent Screen**
2. **Click "PUBLISH APP"**
3. **Complete verification** (if required by Google):
   - Google may require verification for sensitive scopes
   - This can take several days
   - You may need to provide additional information

## Important Notes

- **Custom Domain**: Shows your domain name (e.g., `api.bippity.boo`) instead of Supabase's random subdomain on the OAuth consent screen
- **Google OAuth Consent Screen**: Controls the visual branding (logo, app name, links)
- **Supabase Default Credentials**: If you use Supabase's default Google OAuth credentials, you'll see Supabase branding
- **Your Own Credentials**: Using your own Google OAuth credentials shows YOUR branding
- **Testing Mode**: In testing mode, only test users can authenticate
- **Production Mode**: After publishing, all users can authenticate
- **Custom Domain Cost**: Custom domains are a paid add-on - check your Supabase plan

## Recommended Approach

1. **First**: Set up Supabase custom domain (if on paid plan) - this changes the URL shown
2. **Second**: Configure Google OAuth consent screen with your branding - this adds logo, app name, etc.
3. **Result**: Users see `api.bippity.boo` (or your custom domain) with your logo and branding

## Troubleshooting

### Still seeing Supabase branding?

1. **Check Supabase Auth settings**:
   - Go to Supabase Dashboard → Authentication → Providers → Google
   - Verify Client ID and Client Secret match YOUR Google Cloud credentials
   - NOT the Supabase default credentials

2. **Check environment variables**:
   - Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set in Railway
   - These should be YOUR credentials, not Supabase's

3. **Clear browser cache**:
   - OAuth consent screens are cached by Google
   - Try incognito/private browsing mode

4. **Verify redirect URIs**:
   - Make sure your Supabase callback URL is in the authorized redirect URIs list
   - Format: `https://[project-id].supabase.co/auth/v1/callback`

## Current Configuration

Based on your codebase:
- **App URL**: `https://bippity.boo`
- **Callback URL**: `/auth/callback`
- **OAuth Scopes**: email, profile, gmail.readonly, gmail.labels, calendar, tasks
- **Privacy Policy**: `/privacy`
- **Terms of Service**: `/terms`

Make sure these match your Google Cloud Console configuration!
