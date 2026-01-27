# Contractor Access Management Guide

This guide covers how to securely grant and manage access for contractors to your infrastructure services (Supabase, Railway, n8n, etc.).

## 🎯 Access Levels Overview

### Recommended Access Levels by Role

**For Development Contractors:**
- **Supabase**: Developer role (read/write to specific tables, no admin)
- **Railway**: Team member with "Viewer" or "Developer" role (can view logs, deploy, but not delete)
- **n8n**: Editor role (can edit workflows, but not delete or change settings)
- **GitHub**: Read access to repo (or write if they need to push)

**For Production/Admin Contractors:**
- **Supabase**: Admin access (only if absolutely necessary)
- **Railway**: Admin access (only if they need to manage infrastructure)
- **n8n**: Admin access (only if they need to configure integrations)

---

## 📋 Service-by-Service Setup

### 1. Supabase Access

#### Option A: Developer Role (Recommended for most contractors)

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project (`fvjmzvvcyxsvstlhenex`)
3. Navigate to **Settings** → **Team** (or **Project Settings** → **Team**)
4. Click **Invite Member**
5. Enter contractor's email
6. Select role: **Developer**
   - ✅ Can view and edit database schema
   - ✅ Can view logs and metrics
   - ✅ Can manage API keys (anon key only)
   - ❌ Cannot delete project
   - ❌ Cannot access service role key
   - ❌ Cannot change billing

#### Option B: Custom Database Role (Most Secure)

For even more restricted access, create a custom database role:

1. In Supabase Dashboard → **SQL Editor**
2. Create a role with specific permissions:

```sql
-- Create a contractor role
CREATE ROLE contractor_role;

-- Grant specific table access (example)
GRANT SELECT, INSERT, UPDATE ON public.users TO contractor_role;
GRANT SELECT ON public.oauth_tokens TO contractor_role;
-- Add other tables as needed

-- Grant usage on schemas
GRANT USAGE ON SCHEMA public TO contractor_role;

-- Assign to contractor's user
-- (You'll need their Supabase user ID)
ALTER USER contractor_user_id SET ROLE contractor_role;
```

#### What Contractors Need:

**For Development:**
- `NEXT_PUBLIC_SUPABASE_URL` (public, safe to share)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (public, safe to share)
- Access to Supabase Dashboard (via team invite)

**NEVER Share:**
- `SUPABASE_SERVICE_ROLE_KEY` (admin key - bypasses all security)
- Database passwords
- Project API keys (service role)

---

### 2. Railway Access

#### Setting Up Team Member Access

1. Go to [Railway Dashboard](https://railway.app)
2. Click on your project (e.g., "bippity-boo")
3. Go to **Settings** → **Team** (or click the project name → **Team**)
4. Click **Invite Member**
5. Enter contractor's email
6. Select role:
   - **Viewer**: Can view deployments and logs (read-only)
   - **Developer**: Can deploy, view logs, manage environment variables (recommended)
   - **Admin**: Full access including billing and deletion (use sparingly)

#### Recommended: Developer Role
- ✅ Can deploy code
- ✅ Can view logs
- ✅ Can manage environment variables (but you should set critical ones)
- ✅ Can restart services
- ❌ Cannot delete project
- ❌ Cannot change billing
- ❌ Cannot remove team members

#### Environment Variables Management

**Best Practice:** Set critical environment variables yourself before granting access:

1. Railway Dashboard → Your Service → **Variables**
2. Set these yourself (don't let contractor set):
   - `SUPABASE_SERVICE_ROLE_KEY` (admin key)
   - `N8N_API_KEY` (shared secret)
   - Any production API keys

**Contractors can add:**
- Development/test environment variables
- Feature flags
- Non-sensitive configuration

---

### 3. n8n Access

#### Setting Up Team Member Access

1. Go to your n8n Cloud instance
2. Navigate to **Settings** → **Users** (or **Team**)
3. Click **Invite User**
4. Enter contractor's email
5. Select role:
   - **Editor**: Can create/edit workflows (recommended)
   - **Admin**: Full access including settings and integrations

#### Recommended: Editor Role
- ✅ Can create and edit workflows
- ✅ Can test workflows
- ✅ Can view execution history
- ❌ Cannot delete workflows (unless explicitly granted)
- ❌ Cannot change integrations/credentials
- ❌ Cannot access environment variables

#### What Contractors Need:

**For Workflow Development:**
- Access to n8n instance (via team invite)
- Documentation on your API endpoints
- Example workflow templates

**NEVER Share:**
- `N8N_API_KEY` (unless they need to test workflows that call your API)
- Integration credentials (OAuth tokens, API keys)
- Environment variables with secrets

---

### 4. GitHub Access

#### Setting Up Repository Access

1. Go to your GitHub repository
2. **Settings** → **Collaborators** (or **Manage access**)
3. Click **Add people**
4. Enter contractor's GitHub username
5. Select permission level:
   - **Read**: Can view code (for reference)
   - **Write**: Can push branches and create PRs (recommended)
   - **Admin**: Full access (only for trusted contractors)

#### Recommended: Write Access
- ✅ Can create branches
- ✅ Can push code
- ✅ Can create pull requests
- ❌ Cannot merge to main/master
- ❌ Cannot delete repository
- ❌ Cannot change settings

**Best Practice:** Require pull requests for all changes to main branch.

---

## 🔐 Security Best Practices

### 1. Principle of Least Privilege
- Only grant the minimum access needed for the task
- Start with read-only access, upgrade if needed
- Review access regularly

### 2. Time-Limited Access
- Set clear project end dates
- Schedule access reviews (e.g., monthly)
- Revoke access immediately when project ends

### 3. Separate Development and Production
- Use separate environments when possible
- Never give production admin access unless absolutely necessary
- Use staging/test environments for contractor work

### 4. Audit and Monitor
- Review access logs regularly
- Set up alerts for sensitive operations
- Monitor for unusual activity

### 5. Credential Management
- Never share service role keys or admin credentials
- Use environment variables in Railway (not in code)
- Rotate keys after contractor access ends

---

## 📝 Access Checklist Template

Use this checklist when onboarding a contractor:

```
Contractor: [Name]
Email: [Email]
Project: [Project Name]
Start Date: [Date]
End Date: [Date]

Access Granted:
[ ] Supabase - Role: [Developer/Admin] - Invited: [Date]
[ ] Railway - Role: [Developer/Admin] - Invited: [Date]
[ ] n8n - Role: [Editor/Admin] - Invited: [Date]
[ ] GitHub - Permission: [Read/Write] - Invited: [Date]

Credentials Shared:
[ ] NEXT_PUBLIC_SUPABASE_URL
[ ] NEXT_PUBLIC_SUPABASE_ANON_KEY
[ ] Railway deployment URL
[ ] n8n instance URL

NOT Shared (as per security policy):
[ ] SUPABASE_SERVICE_ROLE_KEY
[ ] N8N_API_KEY
[ ] Production database passwords
[ ] OAuth client secrets

Access Review Date: [Date]
Access Revoked: [Date]
```

---

## 🚪 Revoking Access

### When to Revoke
- Project completion
- Contract termination
- Security concerns
- Regular access review (e.g., quarterly)

### How to Revoke

#### Supabase
1. Dashboard → **Settings** → **Team**
2. Find contractor's email
3. Click **Remove** or **Revoke Access**

#### Railway
1. Dashboard → Project → **Settings** → **Team**
2. Find contractor's email
3. Click **Remove Member**

#### n8n
1. n8n Dashboard → **Settings** → **Users**
2. Find contractor's email
3. Click **Remove** or **Deactivate**

#### GitHub
1. Repository → **Settings** → **Collaborators**
2. Find contractor's username
3. Click **Remove** or change to **Read** access

### Post-Revocation Steps
1. ✅ Rotate any shared credentials (API keys, tokens)
2. ✅ Review recent changes for unauthorized access
3. ✅ Update environment variables if contractor had access
4. ✅ Document revocation in access log

---

## 🔄 Temporary Access for Specific Tasks

For one-off tasks, consider:

1. **Screen Sharing**: Share your screen instead of granting access
2. **Temporary Credentials**: Create temporary accounts with expiration
3. **Read-Only Access**: Grant read-only access first, upgrade if needed
4. **Time-Limited**: Set clear expiration dates

---

## 📞 Emergency Procedures

If you suspect unauthorized access:

1. **Immediately revoke all access** (all platforms)
2. **Rotate all credentials**:
   - Supabase: Regenerate service role key
   - Railway: Rotate environment variables
   - n8n: Regenerate API keys
   - GitHub: Rotate personal access tokens
3. **Review audit logs** in each platform
4. **Change passwords** for any shared accounts
5. **Notify team** if production systems affected

---

## 📚 Additional Resources

- [Supabase Team Management](https://supabase.com/docs/guides/platform/team-management)
- [Railway Team Collaboration](https://docs.railway.app/develop/collaboration)
- [GitHub Repository Permissions](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/managing-repository-settings/managing-teams-and-people-with-access-to-your-repository)
- [n8n User Management](https://docs.n8n.io/user-management/)

---

## 💡 Quick Reference: What to Share vs. Not Share

### ✅ Safe to Share
- `NEXT_PUBLIC_SUPABASE_URL` (public URL)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (public key, has RLS protection)
- Public repository URLs
- Documentation and API endpoints
- Development environment variables (non-sensitive)

### ❌ Never Share
- `SUPABASE_SERVICE_ROLE_KEY` (bypasses all security)
- `N8N_API_KEY` (unless they need to test workflows)
- OAuth client secrets
- Database passwords
- Production API keys
- Billing information
- Admin account credentials

---

**Last Updated:** January 2026
**Maintained By:** Project Owner
