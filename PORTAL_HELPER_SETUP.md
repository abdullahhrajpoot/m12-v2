# Portal Helper Setup Guide

This feature allows you to manually work through a list of family portals, copy credentials, and paste content for your agent to process.

## What It Does

1. **Stores Portal Credentials**: Save login information for different family portals (ParentSquare, school websites, etc.)
2. **Easy Credential Access**: Click to copy usernames and passwords
3. **Content Capture**: Paste content you manually selected from portals
4. **Agent Processing**: Captured content is saved and ready to be sent to your n8n workflows

## Setup Instructions

### 1. Apply the Database Migration

Run the migration to create the necessary tables:

```bash
cd /Users/hanschung/Documents/Parser/Cursor/projects/tldrpal
psql $DATABASE_URL -f migrations/004_create_portal_helper_tables.sql
```

Or if you're using Supabase CLI:

```bash
supabase db push
```

This creates two tables:
- `portal_credentials`: Stores login info for family portals
- `captured_content`: Stores content you paste from portals

### 2. Add Portal Credentials

You can add portal credentials either:

**Option A: Through the UI**
1. Navigate to `/portal-helper`
2. Click "Add Portal"
3. Fill in the portal details

**Option B: Directly in Database**
```sql
INSERT INTO portal_credentials (user_id, portal_name, portal_url, login_username, login_password, notes)
VALUES (
  'your-user-id-here',
  'ParentSquare',
  'https://parentsquare.com/signin',
  'parent@example.com',
  'password123',
  'Smith Family'
);
```

### 3. Use the Portal Helper

1. Go to `/portal-helper` in your app
2. Select a portal from the left sidebar
3. Copy the username and password
4. Go to the portal in another tab and log in
5. Copy content from the portal (messages, announcements, etc.)
6. Return to Portal Helper and paste the content
7. Click "Save & Process"

The content is saved to `captured_content` table and can be processed by your agent.

## Integration with n8n Workflow

To send captured content to your n8n workflow automatically, update the API route at:
`app/api/captured-content/route.ts`

Add a webhook call after saving:

```typescript
// After successful save
const webhookUrl = process.env.N8N_WEBHOOK_URL
if (webhookUrl) {
  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId,
      portalName: data.portal_credentials.portal_name,
      content,
      timestamp: new Date().toISOString()
    })
  })
}
```

## Database Schema

### portal_credentials
- `id` (UUID): Primary key
- `user_id` (UUID): References auth.users
- `portal_name` (TEXT): Name of the portal
- `portal_url` (TEXT): URL to the portal login
- `login_username` (TEXT): Login username
- `login_password` (TEXT): Login password
- `notes` (TEXT): Optional notes
- `created_at`, `updated_at` (TIMESTAMPTZ)

### captured_content
- `id` (UUID): Primary key
- `user_id` (UUID): References auth.users
- `portal_credential_id` (UUID): References portal_credentials
- `content` (TEXT): The captured content
- `processed` (BOOLEAN): Whether it's been processed
- `processed_at` (TIMESTAMPTZ): When it was processed
- `created_at` (TIMESTAMPTZ)

## Security Notes

- Portal credentials are stored in plaintext in the database
- Row Level Security (RLS) is enabled - users can only see their own credentials
- Consider encrypting passwords if sharing database access
- Use HTTPS in production to protect credentials in transit

## Next Steps

1. Apply the migration
2. Add your first portal credentials
3. Test the workflow
4. Connect to your n8n agent workflow
5. Consider adding a "Mark as Processed" button to track what's been handled
