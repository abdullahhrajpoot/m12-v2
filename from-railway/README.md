# Railway Frontend Assets - Contractor Reference Package

This folder contains all frontend source files, components, API routes, and assets used in the bippity.boo application, specifically focusing on the user authentication and onboarding flow.

## Purpose

This package is intended for contractors working on migrating the authentication system from Supabase Auth + Google OAuth to Unipile API. It contains all the files currently deployed on Railway that handle the user journey from landing page through sign-up to onboarding completion.

## Folder Structure

```
from-railway/
├── pages/                    # All page components
│   ├── landing-page.tsx     # Main landing page (/)
│   ├── whatwefound-page.tsx # Onboarding results page (/whatwefound)
│   ├── missing-permissions-page.tsx # OAuth error page
│   ├── layout.tsx           # Root layout component
│   ├── onboarding-page.tsx  # Onboarding stub
│   ├── waitlist-page.tsx    # Waitlist signup
│   └── dashboard-page.tsx   # User dashboard
│
├── components/              # Reusable UI components
│   ├── ConnectButton.tsx    # "Sign Up With Google" button
│   └── ui/                  # Base UI components
│       ├── button.tsx
│       ├── progress.tsx
│       ├── sonner.tsx       # Toast notifications
│       └── textarea.tsx
│
├── api-routes/              # Backend API endpoints
│   ├── auth/
│   │   ├── unipile-connect.ts       # Initiates Unipile OAuth flow
│   │   ├── unipile-callback.ts      # Handles OAuth callback
│   │   └── unipile-check-status.ts  # Polls for account status
│   ├── onboarding/
│   │   ├── summary.ts       # Fetches extracted facts
│   │   ├── finalize.ts      # Finalizes onboarding
│   │   └── tip.ts           # Random onboarding tips
│   └── webhooks/
│       └── unipile-account.ts # Unipile account webhooks
│
├── lib/                     # Utility libraries
│   ├── middleware.ts        # Auth middleware (session management)
│   ├── supabase-client.ts   # Client-side Supabase client
│   ├── supabase.ts          # Server-side Supabase client
│   ├── cookie-utils.ts      # Cookie configuration
│   └── utils.ts             # General utilities
│
├── styles/                  # Stylesheets
│   └── globals.css          # Global styles
│
├── assets/                  # Static assets
│   └── (all images, logos, icons from /public)
│
└── config/                  # Configuration files
    ├── next.config.js       # Next.js configuration
    ├── tsconfig.json        # TypeScript configuration
    ├── tailwind.config.ts   # Tailwind CSS configuration
    └── postcss.config.js    # PostCSS configuration
```

## Key Files for Migration

### Authentication Flow
1. **`components/ConnectButton.tsx`** - Entry point for user sign-up
2. **`api-routes/auth/unipile-connect.ts`** - Generates Unipile hosted auth link
3. **`api-routes/webhooks/unipile-account.ts`** - Receives account creation webhook
4. **`api-routes/auth/unipile-callback.ts`** - Processes OAuth callback, creates user
5. **`pages/whatwefound-page.tsx`** - Displays onboarding results
6. **`pages/missing-permissions-page.tsx`** - Error handling for missing OAuth permissions

### Session Management
- **`lib/middleware.ts`** - Global auth middleware using Supabase SSR
- **`lib/cookie-utils.ts`** - Cookie domain configuration (`.bippity.boo`)

### Database Integration
- **`lib/supabase-client.ts`** - Client-side Supabase operations
- **`lib/supabase.ts`** - Server-side Supabase operations

## Important Notes

### Hardcoded Values to Replace
⚠️ The following files contain hardcoded company-specific values:

1. **`lib/middleware.ts`** (lines 32, 54)
   - Domain: `.bippity.boo`

2. **`lib/cookie-utils.ts`** (line 9)
   - Domain: `.bippity.boo`

3. **`api-routes/auth/unipile-connect.ts`** (line 16)
   - App URL: `https://bippity.boo`

4. **Various pages**
   - Company name "bippity.boo" in UI text
   - Contact email "fgm@bippity.boo"

### Current Architecture

**Authentication Provider:** Unipile (Hosted Auth flow)
**Session Management:** Supabase Auth
**Database:** Supabase PostgreSQL
**Frontend Framework:** Next.js 14 (App Router)
**Styling:** Tailwind CSS
**Deployment:** Railway

See **USER_FLOW.md** for detailed user journey documentation.
See **DEPENDENCIES.md** for required npm packages.

## Usage

This is a reference package. Files are organized by type for easy navigation:
- Look in `pages/` for page-level components
- Look in `api-routes/` for backend logic
- Look in `components/` for reusable UI elements
- Look in `lib/` for utilities and middleware

File names have been simplified (e.g., `route.ts` → descriptive names) for clarity.
