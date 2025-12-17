# Railway Deployment Plan for Bippity.boo

## Overview
This document outlines the complete plan to migrate from Base44 hosting to Railway, update DNS records, and configure the sign-up button with Nango OAuth.

---

## Part 1: DNS Migration Strategy

### Current State
- Domain: `bippity.boo`
- DNS currently points to: Base44
- Target: Railway deployment

### DNS Update Process

#### Step 1: Get Railway Custom Domain Configuration
1. Deploy to Railway first (see Part 2)
2. In Railway dashboard → Service → Settings → Networking
3. Click "+ Custom Domain"
4. Enter domain: `bippity.boo`
5. Railway will provide:
   - CNAME record value (e.g., `bippity.boo.railway.app`)
   - OR A record values (IP addresses)

#### Step 2: Update DNS Records (Zero-Downtime Strategy)

**Option A: Using CNAME (Recommended if DNS provider supports apex CNAME)**
```
Type: CNAME
Name: @ (or bippity.boo)
Value: [Railway-provided CNAME value]
TTL: 300 (5 minutes for quick rollback if needed)
```

**Option B: Using A Records (For root domain when CNAME not supported)**
```
Type: A
Name: @ (or bippity.boo)
Value: [Railway-provided IP address 1]
TTL: 300

Type: A
Name: @ (or bippity.boo)
Value: [Railway-provided IP address 2]
TTL: 300
```

**Option C: Using Cloudflare (Best for apex domain CNAME)**
- Point domain to Cloudflare nameservers
- Set up CNAME for root domain via Cloudflare proxy
- CNAME target: Railway-provided value

#### Step 3: DNS Propagation
- **Timeframe**: 5 minutes to 72 hours (usually 15-60 minutes)
- **Monitor**: Use `dig bippity.boo` or [whatsmydns.net](https://www.whatsmydns.net)
- **Test**: `curl -I https://bippity.boo` to verify

#### Step 4: Rollback Plan
- Keep Base44 DNS records saved
- If issues occur, revert DNS records immediately
- DNS TTL of 300 seconds allows quick rollback

---

## Part 2: Next.js Project Structure & Files Needed

### Project Structure to Create

```
bippity-nextjs/
├── app/                          # Next.js App Router
│   ├── layout.tsx               # Root layout with Toaster
│   ├── page.tsx                 # Landing page (Home.jsx converted)
│   ├── dashboard/
│   │   └── page.tsx             # Dashboard page
│   ├── onboarding/
│   │   └── page.tsx             # Onboarding page
│   └── nango-callback/
│       └── page.tsx             # OAuth callback handler
├── components/
│   ├── ui/                      # shadcn/ui components (copy from bippityboo-711a96a6/src/components/ui)
│   └── ConnectButton.tsx        # Sign-up button with Nango
├── lib/
│   ├── supabase.ts             # Supabase client
│   └── utils.ts                # Utility functions
├── hooks/
│   └── use-mobile.tsx          # Mobile detection hook
├── styles/
│   └── globals.css             # Global styles + Tailwind
├── public/                     # Static assets
├── .env.local                  # Local environment variables (gitignored)
├── .env.example                # Example env file
├── next.config.js              # Next.js configuration
├── tailwind.config.ts          # Tailwind config (copy from bippityboo-711a96a6)
├── postcss.config.js           # PostCSS config
├── tsconfig.json               # TypeScript config
├── package.json                # Dependencies
└── railway.json                # Railway deployment config (optional)
```

### Key Files to Create/Convert

1. **`package.json`** - Next.js dependencies
2. **`next.config.js`** - Next.js configuration
3. **`app/page.tsx`** - Landing page (convert from `Home.jsx`)
4. **`components/ConnectButton.tsx`** - Nango OAuth button (convert from React Router version)
5. **`app/nango-callback/page.tsx`** - OAuth callback (convert from `NangoCallback.jsx`)
6. **`lib/supabase.ts`** - Supabase client setup
7. **`tailwind.config.ts`** - Copy from Base44 version
8. **`.env.example`** - Template for environment variables

---

## Part 3: Railway Configuration

### Step 1: Create Railway Project

```bash
# Install Railway CLI (if not already installed)
npm i -g @railway/cli

# Login to Railway
railway login

# Initialize project (from your Next.js project directory)
railway init

# Link to existing project (if you have one)
railway link
```

### Step 2: Railway Configuration Files

#### `railway.json` (Optional - for custom build config)
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

#### `next.config.js` (Required)
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // Optimized for Railway
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_NANGO_PUBLIC_KEY: process.env.NEXT_PUBLIC_NANGO_PUBLIC_KEY,
  },
}

module.exports = nextConfig
```

#### `package.json` scripts
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  }
}
```

### Step 3: Set Environment Variables in Railway

In Railway Dashboard → Service → Variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://[your-project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-anon-key]
NEXT_PUBLIC_NANGO_PUBLIC_KEY=[your-nango-public-key]
NODE_ENV=production
PORT=3000
```

**Note**: Railway automatically provides `PORT` environment variable, but Next.js uses `3000` by default.

### Step 4: Deploy to Railway

```bash
# Deploy from CLI
railway up

# OR push to GitHub and connect repo in Railway dashboard
# Railway will auto-deploy on push
```

---

## Part 4: Nango OAuth Setup (Sign-Up Button)

### Step 1: Update Nango Configuration

1. **In Nango Dashboard:**
   - Go to Settings → Integrations → Google
   - Update redirect URLs to include:
     - `https://bippity.boo/nango-callback`
     - `http://localhost:3000/nango-callback` (for local dev)

### Step 2: Create ConnectButton Component

**`components/ConnectButton.tsx`** (Next.js version):

```tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

export default function ConnectButton({ 
  text = "Sign Up With Google", 
  className = "" 
}) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const NANGO_PUBLIC_KEY = process.env.NEXT_PUBLIC_NANGO_PUBLIC_KEY

  useEffect(() => {
    // Listen for messages from popup
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return

      if (event.data?.type === 'NANGO_OAUTH_SUCCESS') {
        setLoading(false)
        toast.success("Successfully connected to Google!")
        setTimeout(() => {
          router.push('/onboarding') // or /dashboard
        }, 1000)
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [router])

  const handleConnect = async () => {
    setLoading(true)
    const popup = window.open('', 'google-login', 'width=600,height=700')
    
    if (popup) {
      popup.document.title = "Connecting..."
      popup.document.body.innerHTML = '<div style="font-family: system-ui; display: flex; justify-content: center; align-items: center; height: 100vh;">Loading secure login...</div>'
    }

    try {
      // Use Nango Connect Sessions API
      const response = await fetch('https://api.nango.dev/connect/sessions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${NANGO_PUBLIC_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          end_user: {
            id: 'user-' + Date.now() // In production, use Supabase user ID
          },
          allowed_integrations: ['google'],
          redirect_url: `${window.location.origin}/nango-callback`
        })
      })

      const data = await response.json()

      if (!response.ok) {
        if (popup) popup.close()
        throw new Error(JSON.stringify(data.error || data))
      }

      const connectUrl = data.data.connect_link

      if (popup) {
        popup.location.href = connectUrl
      } else {
        window.open(connectUrl, '_blank', 'width=600,height=700')
      }

    } catch (error) {
      console.error('Nango Connection Error:', error)
      if (popup) popup.close()
      toast.error("Connection failed. Check console for details.")
      setLoading(false)
    }
  }

  return (
    <Button
      onClick={handleConnect}
      disabled={loading}
      className={className}
      size="lg"
    >
      {loading ? (
        <>
          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"/>
          Connecting...
        </>
      ) : (
        <>
          <img src="https://www.gstatic.com/images/branding/product/1x/gmail_2020q4_32dp.png" alt="Gmail" className="w-5 h-5 mr-2" />
          {text}
          <ArrowRight className="w-4 h-4 ml-2" />
        </>
      )}
    </Button>
  )
}
```

### Step 3: Create OAuth Callback Page

**`app/nango-callback/page.tsx`**:

```tsx
'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function NangoCallback() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Check if we're in a popup (opened by ConnectButton)
    if (window.opener) {
      // Send success message to parent window
      window.opener.postMessage({ 
        type: 'NANGO_OAUTH_SUCCESS',
        connectionId: searchParams.get('connection_id') || searchParams.get('connectionId')
      }, window.location.origin)
      
      // Close the popup
      setTimeout(() => {
        window.close()
      }, 500)
    } else {
      // If not in a popup, redirect to dashboard/onboarding
      router.push('/onboarding')
    }
  }, [searchParams, router])

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-600">Completing connection...</p>
      </div>
    </div>
  )
}
```

### Step 4: Connect Nango to n8n Webhook

After successful OAuth:
1. Nango stores the connection
2. Trigger n8n webhook: "Google Auth Nango Powered Onboarding"
3. Webhook URL should be: `https://[your-n8n-instance]/webhook/nango-oauth-success`
4. Payload: `{ connection_id, user_id, provider: 'google' }`

---

## Part 5: Migration Checklist

### Pre-Deployment
- [ ] Create Next.js project structure
- [ ] Convert React Router pages to Next.js App Router
- [ ] Copy UI components from Base44
- [ ] Set up Supabase client library
- [ ] Update Nango redirect URLs in dashboard
- [ ] Test OAuth flow locally with `.env.local`
- [ ] Build Next.js project locally: `npm run build`

### Railway Setup
- [ ] Create Railway account
- [ ] Initialize Railway project: `railway init`
- [ ] Set environment variables in Railway dashboard
- [ ] Deploy to Railway: `railway up`
- [ ] Verify deployment works on Railway domain
- [ ] Check Railway logs for errors

### DNS Migration
- [ ] Get Railway custom domain CNAME/A records
- [ ] Note current Base44 DNS configuration (backup)
- [ ] Update DNS records to point to Railway
- [ ] Set TTL to 300 seconds (for quick rollback)
- [ ] Wait for DNS propagation (monitor with dig/whatsmydns)
- [ ] Test domain: `curl -I https://bippity.boo`
- [ ] Test HTTPS (Railway provides SSL automatically)

### Post-Migration Testing
- [ ] Landing page loads correctly
- [ ] Sign-up button opens Nango popup
- [ ] OAuth flow completes successfully
- [ ] Callback page works correctly
- [ ] Dashboard page loads (if user is authenticated)
- [ ] Supabase queries work
- [ ] n8n webhook triggers on OAuth success
- [ ] Mobile responsiveness works

### Rollback Plan
- [ ] Keep Base44 deployment running during migration
- [ ] Document DNS rollback procedure
- [ ] Test rollback DNS change (revert to Base44)
- [ ] Monitor error rates after migration

---

## Part 6: Environment Variables Reference

### `.env.example` (Create this file)
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[project-id].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon-key]

# Nango
NEXT_PUBLIC_NANGO_PUBLIC_KEY=[public-key]
# Note: Never expose secret key in frontend code

# Next.js
NODE_ENV=development
```

### Railway Environment Variables
Set these in Railway Dashboard → Service → Variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_NANGO_PUBLIC_KEY`
- `NODE_ENV=production`
- `PORT=3000` (Railway auto-provides, but explicit is good)

---

## Part 7: Important Notes

### Security
1. **Nango Keys**: Use `NEXT_PUBLIC_NANGO_PUBLIC_KEY` (public key) in frontend, NOT secret key
2. **Supabase**: Use anon key in frontend, service role key only in server-side code
3. **Environment Variables**: Never commit `.env.local` to git

### Nango Configuration
- Update redirect URLs in Nango dashboard BEFORE deployment
- Test with localhost first, then add production URL
- Connection IDs are returned in callback - use these for n8n webhooks

### Railway Considerations
- Railway provides automatic HTTPS/SSL certificates
- Railway auto-detects Next.js and uses appropriate build settings
- Use `output: 'standalone'` in `next.config.js` for smaller deployments
- Railway provides a `.railway.app` subdomain for testing before DNS update

### Base44 Migration Notes
- Base44 used React Router - Next.js uses App Router (different routing)
- Base44 used Vite - Next.js uses its own build system
- Copy styling from Base44 but rewrite routing logic
- Test all UI components after migration

---

## Part 8: Testing Procedure

### Local Testing
```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .env.example .env.local
# Edit .env.local with your keys

# 3. Run dev server
npm run dev

# 4. Test OAuth flow
# - Click sign-up button
# - Complete Google OAuth
# - Verify callback works
# - Check Supabase for user data
```

### Railway Testing
```bash
# 1. Deploy to Railway
railway up

# 2. Check deployment URL
railway domain

# 3. Test on Railway subdomain
# - Verify all pages load
# - Test OAuth flow
# - Check logs: railway logs
```

### DNS Testing
```bash
# Check DNS resolution
dig bippity.boo
nslookup bippity.boo

# Check HTTPS
curl -I https://bippity.boo

# Check from different locations
# Use: https://www.whatsmydns.net
```

---

## Support & Troubleshooting

### Common Issues

1. **DNS not resolving**: Wait 15-60 minutes, check TTL, verify DNS records
2. **OAuth callback fails**: Check Nango redirect URL configuration
3. **Environment variables not working**: Ensure `NEXT_PUBLIC_` prefix for client-side vars
4. **Build fails on Railway**: Check `next.config.js`, verify Node.js version in `package.json`
5. **HTTPS issues**: Railway provides SSL automatically, may take 5-10 minutes after DNS

### Useful Commands

```bash
# Railway CLI
railway login
railway init
railway link [project-id]
railway up
railway logs
railway domain
railway variables

# Next.js
npm run dev        # Local development
npm run build      # Production build
npm run start      # Start production server
npm run lint       # Lint code

# DNS/Domain
dig bippity.boo
nslookup bippity.boo
curl -I https://bippity.boo
```

---

## Next Steps After Deployment

1. Monitor Railway logs for errors
2. Set up error tracking (Sentry, etc.)
3. Configure monitoring/uptime alerts
4. Update CONTEXT.md with new deployment info
5. Remove Base44 deployment after successful migration
6. Document any custom configurations in Railway

