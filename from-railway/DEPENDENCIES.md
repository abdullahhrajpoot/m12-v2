# Dependencies Documentation

This document lists all npm packages and external services required to run the bippity.boo frontend and backend.

## Core Framework

### Next.js
```json
{
  "next": "^14.0.0",
  "react": "^18.0.0",
  "react-dom": "^18.0.0"
}
```
- **Purpose:** Full-stack React framework with App Router
- **Features Used:** Server components, API routes, middleware, SSR
- **Documentation:** https://nextjs.org/docs

## TypeScript

```json
{
  "typescript": "^5.0.0",
  "@types/node": "^20.0.0",
  "@types/react": "^18.0.0",
  "@types/react-dom": "^18.0.0"
}
```
- **Purpose:** Type safety and better developer experience

## Authentication & Database

### Supabase
```json
{
  "@supabase/supabase-js": "^2.38.0",
  "@supabase/ssr": "^0.0.10"
}
```
- **Purpose:** 
  - User authentication and session management
  - PostgreSQL database access
  - Real-time subscriptions (not currently used)
- **Features Used:**
  - `createServerClient` - SSR-compatible Supabase client
  - `createBrowserClient` - Client-side Supabase client
  - Auth API for user management
- **Environment Variables:**
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY` (server-side only)
- **Documentation:** https://supabase.com/docs/reference/javascript

## Styling

### Tailwind CSS
```json
{
  "tailwindcss": "^3.3.0",
  "postcss": "^8.4.0",
  "autoprefixer": "^10.4.0"
}
```
- **Purpose:** Utility-first CSS framework
- **Configuration:** `tailwind.config.ts`, `postcss.config.js`
- **Documentation:** https://tailwindcss.com/docs

### shadcn/ui Components
```json
{
  "@radix-ui/react-progress": "^1.0.0",
  "@radix-ui/react-slot": "^1.0.0",
  "class-variance-authority": "^0.7.0",
  "clsx": "^2.0.0",
  "tailwind-merge": "^2.0.0"
}
```
- **Purpose:** Headless UI components with Tailwind styling
- **Components Used:** Button, Progress, Textarea, Toast
- **Note:** Components are copied directly into the codebase (not installed as package)
- **Documentation:** https://ui.shadcn.com

### Toast Notifications
```json
{
  "sonner": "^1.0.0"
}
```
- **Purpose:** Beautiful toast notifications
- **Usage:** Error messages, success confirmations
- **Documentation:** https://sonner.emilkowal.ski

## UI/UX

### Icons
```json
{
  "lucide-react": "^0.292.0"
}
```
- **Purpose:** Icon library
- **Icons Used:** ArrowRight, Check, Calendar, Mail, Sparkles, Clock, etc.
- **Documentation:** https://lucide.dev

### Animation
```json
{
  "framer-motion": "^10.16.0"
}
```
- **Purpose:** Animation library
- **Usage:** Page transitions, loading states, fade-ins
- **Features Used:** `motion` components, `initial`, `animate`, `transition`
- **Documentation:** https://www.framer.com/motion

## Error Monitoring

### Sentry
```json
{
  "@sentry/nextjs": "^7.0.0"
}
```
- **Purpose:** Error tracking and performance monitoring
- **Configuration:** `sentry.client.config.ts`, `sentry.server.config.ts`, `instrumentation.ts`
- **Environment Variables:**
  - `NEXT_PUBLIC_SENTRY_DSN`
  - `SENTRY_AUTH_TOKEN` (build-time only)
  - `SENTRY_ORG`
  - `SENTRY_PROJECT`
- **Documentation:** https://docs.sentry.io/platforms/javascript/guides/nextjs

## External Services

### Unipile
- **Purpose:** Unified API for email and calendar access (Google, Microsoft, etc.)
- **Features Used:**
  - Hosted OAuth flow
  - Email fetching
  - Calendar access
  - Account management
- **API Endpoints Used:**
  - `POST /api/v1/hosted/accounts/link` - Generate auth link
  - `GET /api/v1/accounts/{id}` - Get account details
  - `GET /api/v1/accounts/{id}/messages` - Fetch emails
- **Environment Variables:**
  - `UNIPILE_DSN` - API endpoint (e.g., `https://api27.unipile.com:15744`)
  - `UNIPILE_API_KEY` - Application API key
  - `UNIPILE_WEBHOOK_SECRET` - Webhook signature verification
- **Documentation:** https://docs.unipile.com

### n8n Workflows
- **Purpose:** Backend automation and AI processing
- **Workflows Used:**
  - Parallelized_Onboarding_Unipile - Email scanning and fact extraction
  - Onboarding Finalize - Save user edits and facts
- **Environment Variables:**
  - `N8N_API_KEY` - n8n Cloud API access
  - `N8N_UNIPILE_ONBOARDING_WEBHOOK_URL` - Onboarding trigger endpoint
- **Documentation:** https://docs.n8n.io

## Build Tools

### Development
```json
{
  "eslint": "^8.0.0",
  "eslint-config-next": "^14.0.0"
}
```

## Environment Variables Summary

### Required for Production

**Supabase:**
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Public anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Server-side admin key

**Unipile:**
- `UNIPILE_DSN` - Unipile API endpoint
- `UNIPILE_API_KEY` - Application API key
- `UNIPILE_WEBHOOK_SECRET` - Webhook verification secret

**Application:**
- `NEXT_PUBLIC_APP_URL` - Base application URL (e.g., `https://bippity.boo`)
- `NODE_ENV` - Environment mode (`production` | `development`)

**n8n:**
- `N8N_API_KEY` - n8n Cloud API key
- `N8N_UNIPILE_ONBOARDING_WEBHOOK_URL` - Webhook trigger URL

**Sentry (Optional but Recommended):**
- `NEXT_PUBLIC_SENTRY_DSN` - Public Sentry DSN
- `SENTRY_AUTH_TOKEN` - Build-time source map upload token
- `SENTRY_ORG` - Sentry organization slug
- `SENTRY_PROJECT` - Sentry project slug
- `SENTRY_ENVIRONMENT` - Environment name

## Package Manager

**Recommended:** npm or pnpm

### Install Dependencies
```bash
npm install
# or
pnpm install
```

### Development Server
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm start
```

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- ES2020+ JavaScript features
- CSS Grid and Flexbox

## Minimum Node Version

- Node.js 18.x or higher
- npm 9.x or higher

## Notes

1. **Supabase SSR:** Uses `@supabase/ssr` for Next.js App Router compatibility with server components
2. **Middleware:** Global middleware runs on every request for session management
3. **API Routes:** All under `app/api/**/route.ts` following Next.js 13+ conventions
4. **Component Library:** Uses shadcn/ui pattern (copy components, don't install package)
5. **Styling:** Tailwind with custom design system (see `tailwind.config.ts`)
6. **Error Handling:** Sentry for production error tracking

## Development Setup Checklist

- [ ] Install Node.js 18+
- [ ] Clone repository
- [ ] Copy `.env.example` to `.env.local`
- [ ] Fill in all environment variables
- [ ] Run `npm install`
- [ ] Run `npm run dev`
- [ ] Verify Supabase connection
- [ ] Test Unipile OAuth flow
- [ ] Check n8n webhook connectivity

## Production Deployment (Railway)

Railway automatically:
- Detects Next.js framework
- Installs dependencies
- Builds the application
- Serves on assigned port
- Injects environment variables

**Required Railway Environment Variables:**
- All variables listed in "Required for Production" section above
