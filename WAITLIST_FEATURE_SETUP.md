# Waitlist Feature Setup

## Overview
Added a waiting list feature to capture emails from users who want early access. Links appear beside each "Sign Up With Google" button on the landing page.

## What Was Added

### 1. Waitlist Page (`/app/waitlist/page.tsx`)
- Clean, branded form to collect:
  - Email (required)
  - Optional reason with placeholder text: "we have 3 kids and use parentsquare, brightwheel, and 3 other apps and portal, help!"
- Matches the landing page design with gradients and branding
- Success message and auto-redirect to homepage after signup
- Shows popular app badges (ParentSquare, Brightwheel, etc.)

### 2. API Endpoint (`/app/api/waitlist/route.ts`)
- POST endpoint to handle waitlist signups
- Validates email format
- Stores data in Supabase `waitlist` table
- Handles duplicate email submissions gracefully
- Uses service role key for secure database access

### 3. Database Migration (`/migrations/003_create_waitlist_table.sql`)
- Creates `waitlist` table with:
  - `id` (UUID, primary key)
  - `email` (unique, required)
  - `reason` (optional text)
  - `created_at` (timestamp)
  - `contacted` (boolean flag for tracking)
  - `contacted_at` (timestamp when contacted)
  - `notes` (internal notes field)
- Includes indexes for performance
- Row Level Security enabled (service role only access)

### 4. Landing Page Updates (`/app/page.tsx`)
- Added "Get on waiting list" links beside both ConnectButton instances:
  - Hero section (top)
  - Final CTA section (bottom)
- Links styled to match brand (indigo color, underlined)
- Responsive layout adjustments

## Next Steps

### 1. Apply the Migration
Run this SQL in your Supabase SQL Editor or via CLI:

```bash
# If using Supabase CLI
supabase db push

# Or manually apply the migration file:
# migrations/003_create_waitlist_table.sql
```

### 2. Verify Environment Variables
Ensure these are set in your `.env.local` or production environment:
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

### 3. Test the Feature
1. Visit the landing page
2. Click "Get on waiting list"
3. Fill out the form
4. Verify the data appears in Supabase

### 4. View Waitlist Entries
Query the waitlist table in Supabase:

```sql
SELECT 
  email,
  reason,
  created_at,
  contacted
FROM waitlist
ORDER BY created_at DESC;
```

### 5. Mark Users as Contacted (Optional)
When you reach out to users:

```sql
UPDATE waitlist
SET 
  contacted = true,
  contacted_at = NOW(),
  notes = 'Sent welcome email and access instructions'
WHERE email = 'user@example.com';
```

## Files Modified
- ✅ `/app/page.tsx` - Added waiting list links
- ✅ `/app/waitlist/page.tsx` - New waitlist form page
- ✅ `/app/api/waitlist/route.ts` - New API endpoint
- ✅ `/migrations/003_create_waitlist_table.sql` - Database migration

## Design Notes
- The waitlist page matches the landing page aesthetic
- Form is simple and fast to complete
- Example placeholder text helps users understand what to write
- Success feedback is immediate and clear
- Links are prominently placed but don't overpower the main CTA
