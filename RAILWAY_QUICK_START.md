# Railway Quick Start Checklist

## 🚀 Quick Deployment Steps

### 1. Initial Setup (One-time)

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# From your Next.js project root
railway init
```

### 2. Environment Variables in Railway Dashboard

Go to: Railway Dashboard → Your Service → Variables

Add these:
```
NEXT_PUBLIC_SUPABASE_URL=https://[your-project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-anon-key]
SUPABASE_SERVICE_ROLE_KEY=[your-service-role-key]
N8N_API_KEY=[your-n8n-api-key]
NEXT_PUBLIC_APP_URL=https://bippity.boo
NODE_ENV=production
```

### 3. Deploy

```bash
railway up
```

### 4. Configure Custom Domain

1. Railway Dashboard → Service → Settings → Networking
2. Click "+ Custom Domain"
3. Enter: `bippity.boo`
4. Copy the CNAME value provided

### 5. Update DNS

In your DNS provider (where bippity.boo is registered):

**CNAME Record:**
```
Type: CNAME
Name: @ (or leave blank for root)
Value: [Railway CNAME value]
TTL: 300
```

**OR if CNAME not supported, use A Records:**
```
Type: A
Name: @
Value: [Railway IP 1]

Type: A
Name: @
Value: [Railway IP 2]
```

### 6. Configure Supabase Auth Google Provider

1. Supabase Dashboard → Authentication → Providers → Google
2. Enable Google provider
3. Add Authorized redirect URLs:
   - `https://bippity.boo/auth/callback`
   - `http://localhost:3000/auth/callback` (for local dev)
4. Add scopes: `email`, `profile`, `https://www.googleapis.com/auth/gmail.readonly`, `https://www.googleapis.com/auth/gmail.labels`, `https://www.googleapis.com/auth/calendar`, `https://www.googleapis.com/auth/tasks`

### 7. Verify

```bash
# Check DNS (wait 15-60 min after DNS update)
dig bippity.boo

# Test site
curl -I https://bippity.boo

# Check Railway logs
railway logs
```

---

## 📋 Pre-Deployment Checklist

- [ ] Next.js project created
- [ ] All pages converted from Base44
- [ ] ConnectButton component uses Supabase Auth OAuth
- [ ] OAuth callback page at `/app/auth/callback/route.ts`
- [ ] Supabase client configured
- [ ] Environment variables ready
- [ ] `next.config.js` has `output: 'standalone'`
- [ ] Local build works: `npm run build`
- [ ] Local OAuth flow tested

---

## 🔧 Key Files to Create

```
bippity-nextjs/
├── app/
│   ├── page.tsx                 # Landing (from Home.jsx)
│   ├── auth/callback/route.ts   # OAuth callback
│   └── dashboard/page.tsx       # Dashboard
├── components/
│   └── ConnectButton.tsx        # Sign-up button
├── lib/
│   └── supabase.ts             # Supabase client
└── next.config.js
```

---

## ⚠️ Common Pitfalls

1. **Missing `NEXT_PUBLIC_` prefix** → Environment variables won't work in browser
2. **Wrong Supabase redirect URL** → OAuth callback will fail (must match `/auth/callback`)
3. **DNS TTL too high** → Can't rollback quickly if issues
4. **Missing SUPABASE_SERVICE_ROLE_KEY** → OAuth tokens won't be stored for n8n workflows
5. **Not testing locally first** → Deploy bugs to production

---

## 🆘 Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| DNS not resolving | Wait 15-60 min, check DNS records, verify TTL |
| OAuth fails | Check Supabase redirect URL, verify Google provider is enabled, check callback route |
| Build fails | Check `next.config.js`, Node version, dependencies |
| 404 on pages | Verify App Router structure, check file names |
| Env vars undefined | Ensure `NEXT_PUBLIC_` prefix, restart dev server |

---

## 📞 Useful Commands

```bash
# Deploy
railway up

# View logs
railway logs

# Check domain
railway domain

# Link to existing project
railway link [project-id]

# List variables
railway variables
```

---

For detailed information, see: `RAILWAY_DEPLOYMENT_PLAN.md`

