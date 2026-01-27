# File Manifest - Railway Frontend Export

This document lists all files exported from the bippity.boo production application on Railway.

**Export Date:** January 26, 2026
**Total Files:** 38

## Directory: pages/ (7 files)
User-facing page components

- `landing-page.tsx` - Main landing page at `/` (565 lines)
- `whatwefound-page.tsx` - Onboarding results page at `/whatwefound` (768 lines)
- `missing-permissions-page.tsx` - OAuth permission error page
- `layout.tsx` - Root layout with Sentry integration (45 lines)
- `onboarding-page.tsx` - Onboarding stub page (26 lines)
- `waitlist-page.tsx` - Waitlist signup form
- `dashboard-page.tsx` - User dashboard

## Directory: components/ (6 files)
Reusable UI components

### Root Components
- `ConnectButton.tsx` - "Sign Up With Google" button with loading states (62 lines)

### UI Components
- `ui/button.tsx` - Base button component (shadcn/ui)
- `ui/progress.tsx` - Progress bar component
- `ui/sonner.tsx` - Toast notification wrapper
- `ui/textarea.tsx` - Textarea input component

## Directory: api-routes/ (7 files)
Backend API endpoints

### Authentication Routes
- `auth/unipile-connect.ts` - Generates Unipile OAuth link (103 lines)
- `auth/unipile-callback.ts` - Processes OAuth callback, creates users (384 lines)
- `auth/unipile-check-status.ts` - Polls for account creation status

### Onboarding Routes
- `onboarding/summary.ts` - Fetches extracted onboarding facts from database
- `onboarding/finalize.ts` - Saves finalized facts and user corrections
- `onboarding/tip.ts` - Returns random onboarding tips

### Webhook Routes
- `webhooks/unipile-account.ts` - Receives Unipile account creation webhooks

## Directory: lib/ (5 files)
Utility libraries and middleware

- `middleware.ts` - Global auth middleware with Supabase session management (94 lines)
- `supabase-client.ts` - Client-side Supabase client (16 lines)
- `supabase.ts` - Server-side Supabase client (22 lines)
- `cookie-utils.ts` - Cookie domain configuration utilities (21 lines)
- `utils.ts` - General utility functions (cn function for className merging)

## Directory: styles/ (1 file)
Global stylesheets

- `globals.css` - Global CSS with Tailwind directives

## Directory: assets/ (9 files)
Static assets from /public directory

### Logos
- `logo.png` - Main application logo
- `bippity-boo-logo-120x120.png` - Logo variant

### Favicons
- `favicon.ico` - Standard favicon
- `favicon.png` - PNG favicon
- `favicon-16x16.png` - 16x16 favicon
- `favicon-16x16.ico` - 16x16 ICO
- `favicon-32x32.png` - 32x32 favicon
- `favicon-48x48.png` - 48x48 favicon
- `favicon-48x48.ico` - 48x48 ICO
- `bippity-boo-favicon-32x32.png` - Branded favicon

## Directory: config/ (4 files)
Configuration files

- `next.config.js` - Next.js configuration with Sentry integration (70 lines)
- `tsconfig.json` - TypeScript compiler configuration
- `tailwind.config.ts` - Tailwind CSS configuration
- `postcss.config.js` - PostCSS configuration

## Documentation Files (3 files)

- `README.md` - Overview and folder structure guide
- `USER_FLOW.md` - Detailed user journey documentation
- `DEPENDENCIES.md` - Complete dependency list with environment variables
- `FILE_MANIFEST.md` - This file

## File Size Summary

**Total Size:** ~250 KB (source code only, excluding node_modules)

### By Category:
- Pages: ~180 KB
- Components: ~30 KB
- API Routes: ~60 KB
- Libraries: ~20 KB
- Styles: ~5 KB
- Config: ~10 KB
- Assets: ~150 KB (images)

## Original File Paths (Reference)

For contractors who need to understand the original Next.js structure:

### Pages (Next.js App Router)
```
app/page.tsx                              → pages/landing-page.tsx
app/layout.tsx                            → pages/layout.tsx
app/whatwefound/page.tsx                  → pages/whatwefound-page.tsx
app/auth/missing-permissions/page.tsx     → pages/missing-permissions-page.tsx
app/onboarding/page.tsx                   → pages/onboarding-page.tsx
app/waitlist/page.tsx                     → pages/waitlist-page.tsx
app/dashboard/page.tsx                    → pages/dashboard-page.tsx
```

### API Routes
```
app/api/auth/unipile/connect/route.ts     → api-routes/auth/unipile-connect.ts
app/api/auth/unipile/callback/route.ts    → api-routes/auth/unipile-callback.ts
app/api/auth/unipile/check-status/route.ts → api-routes/auth/unipile-check-status.ts
app/api/onboarding/summary/route.ts       → api-routes/onboarding/summary.ts
app/api/onboarding/finalize/route.ts      → api-routes/onboarding/finalize.ts
app/api/onboarding/tip/route.ts           → api-routes/onboarding/tip.ts
app/api/webhooks/unipile/account/route.ts → api-routes/webhooks/unipile-account.ts
```

### Components
```
components/ConnectButton.tsx              → components/ConnectButton.tsx
components/ui/*.tsx                       → components/ui/*.tsx
```

### Utilities
```
middleware.ts                             → lib/middleware.ts
lib/supabase-client.ts                    → lib/supabase-client.ts
lib/supabase.ts                           → lib/supabase.ts
lib/cookie-utils.ts                       → lib/cookie-utils.ts
lib/utils.ts                              → lib/utils.ts
```

### Configuration
```
next.config.js                            → config/next.config.js
tsconfig.json                             → config/tsconfig.json
tailwind.config.ts                        → config/tailwind.config.ts
postcss.config.js                         → config/postcss.config.js
```

### Assets
```
public/*                                  → assets/*
```

## Files NOT Included

The following were intentionally excluded:

### Out of Scope for Migration
- Other pages: `/privacy`, `/terms`, `/portal-helper`, `/sentry-example-page`
- Legacy Supabase Auth routes: `app/api/auth/tokens`, `app/api/auth/refresh-tokens`, etc.
- Test/debug routes: `app/api/test-logs`, `app/api/sentry-example-api`
- Other API routes: `app/api/captured-content`, `app/api/portal-credentials`, `app/api/scan-feedback`

### Build/Deploy Artifacts
- `node_modules/`
- `.next/`
- `.env` files (contain secrets)
- Git history

### System Files
- `.cursor/` (IDE-specific)
- Documentation markdown files (workflow docs, migration plans)
- Python backup scripts
- Shell scripts

## Notes for Contractors

1. **File Naming:** Files have been renamed for clarity (e.g., `route.ts` → descriptive names)
2. **Structure:** Organized by type rather than Next.js folder structure
3. **Secrets:** All environment variables are referenced via `process.env.*` - no hardcoded secrets in source
4. **Company Names:** Hardcoded references to "bippity.boo" and ".bippity.boo" domain are present - see README.md for locations
5. **Complete Application:** This is a functional subset - other parts of the application exist but are not relevant to the migration

## Verification Checklist

Use this to verify you received all necessary files:

- [ ] 7 page components in `pages/`
- [ ] 6 UI components in `components/`
- [ ] 7 API route files in `api-routes/`
- [ ] 5 utility/middleware files in `lib/`
- [ ] 1 stylesheet in `styles/`
- [ ] 9 image files in `assets/`
- [ ] 4 configuration files in `config/`
- [ ] 4 documentation markdown files in root

**Total Expected:** 38 files + 4 markdown docs = 42 files
