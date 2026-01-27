# How to Share Developer Access: Step-by-Step Guide

Quick instructions for granting developer role access to contractors on Supabase and Railway.

---

## 🔵 Supabase: Grant Developer Role Access

### Step 1: Navigate to Team Settings

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. **Select your project** (the one with project ref: `fvjmzvvcyxsvstlhenex`)
3. In the left sidebar, click on **Settings** (gear icon ⚙️)
4. Click on **Team** in the settings menu

   *Alternative path: Click your project name at the top → **Settings** → **Team***

### Step 2: Invite Team Member

1. On the Team page, click the **Invite Member** button (usually top-right)
2. A modal/dialog will appear

### Step 3: Enter Contractor Details

1. **Email**: Enter the contractor's email address
2. **Role**: Select **Developer** from the dropdown
   - **Developer** = Can view/edit database, view logs, manage API keys (anon only)
   - **Admin** = Full access (only use if absolutely necessary)
3. Click **Send Invitation** or **Invite**

### Step 4: Contractor Accepts Invitation

1. Contractor will receive an email invitation
2. They click the link in the email
3. They sign up/log in to Supabase
4. They'll now have access to your project

### Step 5: Verify Access (Optional)

1. Go back to **Settings** → **Team**
2. You should see the contractor listed with **Developer** role
3. Status should show as "Active" once they accept

### What Developer Role Can Do:
- ✅ View and edit database schema
- ✅ View logs and metrics
- ✅ Access SQL Editor
- ✅ View API keys (anon key only)
- ✅ View project settings
- ❌ Cannot access service role key
- ❌ Cannot delete project
- ❌ Cannot change billing

---

## 🚂 Railway: Grant Developer Role Access

### Step 1: Navigate to Project Team Settings

1. Go to [Railway Dashboard](https://railway.app)
2. **Select your project** (e.g., "bippity-boo")
   - Click on the project name in the left sidebar or from the project list
3. Click on **Settings** tab (at the top of the project page)
   - *Or click the gear icon ⚙️ if visible*

### Step 2: Access Team Management

1. In the Settings page, look for **Team** section
   - It may be in the left sidebar of settings, or as a tab
   - Look for "Team", "Members", or "Collaborators"
2. Click on **Team** or **Members**

### Step 3: Invite Team Member

1. Click the **Invite Member** or **+ Add Member** button
   - Usually located at the top-right of the team list
2. A dialog/modal will appear

### Step 4: Enter Contractor Details

1. **Email**: Enter the contractor's email address
2. **Role**: Select **Developer** from the role dropdown
   - **Viewer** = Read-only (can view logs, deployments)
   - **Developer** = Can deploy, view logs, manage env vars (recommended)
   - **Admin** = Full access including billing (use sparingly)
3. Click **Send Invitation** or **Invite**

### Step 5: Contractor Accepts Invitation

1. Contractor receives an email invitation from Railway
2. They click the invitation link
3. They sign up/log in to Railway
4. They'll now have access to your project

### Step 6: Verify Access (Optional)

1. Go back to **Settings** → **Team**
2. You should see the contractor listed with **Developer** role
3. Status should show as "Active" or "Member" once they accept

### What Developer Role Can Do:
- ✅ View deployments and logs
- ✅ Deploy new code
- ✅ View and edit environment variables
- ✅ Restart services
- ✅ View metrics and usage
- ❌ Cannot delete project
- ❌ Cannot change billing
- ❌ Cannot remove team members

---

## 📋 Quick Checklist

Use this when inviting a contractor:

### Supabase
- [ ] Navigated to Settings → Team
- [ ] Clicked "Invite Member"
- [ ] Entered contractor email
- [ ] Selected "Developer" role
- [ ] Sent invitation
- [ ] Verified contractor appears in team list (after they accept)

### Railway
- [ ] Navigated to Project → Settings → Team
- [ ] Clicked "Invite Member" or "+ Add Member"
- [ ] Entered contractor email
- [ ] Selected "Developer" role
- [ ] Sent invitation
- [ ] Verified contractor appears in team list (after they accept)

---

## 🔐 Important: Environment Variables

### Before Granting Railway Access

**Set these critical environment variables yourself** (don't let contractor set them):

1. Railway Dashboard → Your Service → **Variables** tab
2. Ensure these are already set:
   - `SUPABASE_SERVICE_ROLE_KEY` (admin key - never share)
   - `N8N_API_KEY` (shared secret)
   - Any production API keys

**Contractor can safely add:**
- Development/test environment variables
- Feature flags
- Non-sensitive configuration

---

## 🚪 Revoking Access Later

### Supabase
1. Go to **Settings** → **Team**
2. Find contractor's email in the list
3. Click **Remove** or **Revoke Access** (three dots menu)
4. Confirm removal

### Railway
1. Go to **Project** → **Settings** → **Team**
2. Find contractor's email in the list
3. Click **Remove** or the trash icon
4. Confirm removal

**After revoking:** Consider rotating any credentials they may have seen.

---

## ❓ Troubleshooting

### Contractor didn't receive invitation email
- Check spam/junk folder
- Verify email address is correct
- Resend invitation from team settings
- Check if they already have a Supabase/Railway account (may need to use that email)

### Can't find Team settings
- **Supabase**: Look for gear icon ⚙️ → Settings → Team
- **Railway**: Project page → Settings tab → Team section
- Try refreshing the page
- Ensure you have admin/owner access to the project

### Role options not showing
- You may need to be project owner/admin to invite members
- Check your own access level first
- Some projects may have team features disabled

---

## 📞 Need Help?

- **Supabase Support**: [support@supabase.com](mailto:support@supabase.com) or [docs](https://supabase.com/docs/guides/platform/team-management)
- **Railway Support**: [support@railway.app](mailto:support@railway.app) or [docs](https://docs.railway.app/develop/collaboration)

---

**Last Updated:** January 2026
