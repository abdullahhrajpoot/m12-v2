# Aurinko Migration Progress

## Migration Status

### ✅ Completed
1. **Parallelized Onboarding Workflow** - All 8 Gmail API nodes migrated to Aurinko

### 🔄 In Progress
- Starting migration of remaining workflows

### ⏳ Pending
- Gmail Command Poller workflow
- Email Processor workflow  
- Calendar tool subworkflows (4 workflows)
- Tasks tool subworkflows (5 workflows)
- Frontend auth routes

---

## Changes Made to Parallelized Onboarding

### URL Changes
- `https://gmail.googleapis.com/gmail/v1/users/me/messages` → `https://api.aurinko.io/v1/email/messages`
- `https://gmail.googleapis.com/gmail/v1/users/me/messages/{id}` → `https://api.aurinko.io/v1/email/messages/{id}`

### Auth Header Changes
**Before:**
```
Authorization: Bearer {{ access_token }}
```

**After:**
```
Authorization: Bearer {{ aurinko_api_key }}
X-Aurinko-Account-Id: {{ aurinko_account_id }}
```

### Code Node Updates
1. **"Add Token To Items"** - Now adds `aurinko_api_key` and `aurinko_account_id` instead of `access_token`
2. **"Split Messages for Metadata"** - Updated to use Aurinko credentials

### Nodes Updated (8 total)
1. Pull Discovered Emails
2. Fetch Message Metadata  
3. Search Gmail - Recent
4. Search Gmail - BackToSchool
5. Search Gmail - Fall
6. Search Gmail - Winter
7. Search Gmail - Spring
8. (Plus 2 Code nodes updated)

---

## Important Notes

### Response Format Differences
- **Gmail API** returns messages with `payload.parts` structure
- **Aurinko API** may return different structure - the "Convert To Readable Email" code node may need adjustment after testing

### Query Parameters
- Aurinko uses `q` parameter similar to Gmail, so search queries should work
- Removed `format` and `metadataHeaders` parameters (Aurinko may handle differently)

### Required Backend Changes
The `/api/auth/tokens` endpoint must return:
```json
{
  "aurinko_api_key": "...",
  "aurinko_account_id": "..."
}
```

Instead of:
```json
{
  "access_token": "..."
}
```

---

## Next Steps

1. ✅ Migrate Parallelized Onboarding (DONE)
2. ⏳ Migrate Gmail Command Poller
3. ⏳ Migrate Email Processor Gmail send node
4. ⏳ Migrate Calendar tool workflows
5. ⏳ Migrate Tasks tool workflows
6. ⏳ Update frontend auth routes

---

*Last updated: 2026-01-16*
