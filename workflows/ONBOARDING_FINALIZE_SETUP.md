# Onboarding Finalize Workflow - Setup Guide

## Workflow Created ✅

**Workflow ID**: `NScxKgKI3k1JDJai`  
**Workflow Name**: "Onboarding Finalize"  
**Webhook Path**: `onboarding-finalize`  
**Webhook URL**: `https://chungxchung.app.n8n.cloud/webhook/onboarding-finalize`

## Workflow Structure

The workflow uses a **single workflow with IF node** approach as recommended:

```
1. Webhook receives: {userId, facts, userEdits}
2. IF node: Check if userEdits exists and is not empty
   ├─ TRUE: Run AI Agent refinement → Parse refined facts → Save to family_facts → Send email
   └─ FALSE: Use facts directly → Save to family_facts → Send email
```

### Nodes

1. **Onboarding Finalize Webhook** - Receives POST requests from frontend
2. **Has User Edits?** - IF node that checks if `userEdits` exists
3. **Prepare for Refinement** - Formats facts and edits for AI (TRUE branch)
4. **Refine Facts Agent** - AI Agent that refines facts based on user edits
5. **GPT-4o Refine** - Language model for the agent
6. **Parse Refined Facts** - Extracts JSON array from AI output
7. **Prepare Direct Save** - Uses facts directly without refinement (FALSE branch)
8. **Split Facts for Insert** - Splits facts array into individual database rows
9. **Save to family_facts** - Inserts facts into Supabase
10. **Get User Email** - Fetches user email from users table
11. **Send Welcome Email** - Sends email via SendGrid API

## Configuration Required

### 1. SendGrid API Key (for Email Sending)

The workflow uses SendGrid for sending welcome emails. You need to:

1. **Add environment variable in n8n**:
   - Variable name: `SENDGRID_API_KEY`
   - Value: Your SendGrid API key

2. **Alternative**: If you're not using SendGrid, you can:
   - Replace the "Send Welcome Email" HTTP Request node
   - Use n8n's Email node (SMTP)
   - Use another email service API

### 2. Update API Endpoint (Optional)

The frontend API endpoint (`app/api/onboarding/finalize/route.ts`) has a default webhook URL. You can either:

- Use the default: `https://chungxchung.app.n8n.cloud/webhook/onboarding-finalize`
- Or set `N8N_ONBOARDING_FINALIZE_WEBHOOK_URL` in Railway environment variables

## Testing

### Test Case 1: "It's All Good" (No Edits)
```json
POST /webhook/onboarding-finalize
{
  "userId": "user-uuid",
  "facts": ["Fact 1", "Fact 2"],
  "userEdits": null
}
```
Expected: Facts saved directly to `family_facts`, welcome email sent

### Test Case 2: "Submit Edits/Add Facts" (With Edits)
```json
POST /webhook/onboarding-finalize
{
  "userId": "user-uuid",
  "facts": ["Fact 1", "Fact 2"],
  "userEdits": "Add: Ballet is Tuesdays at 3pm. Remove: Soccer practice."
}
```
Expected: AI refines facts, refined facts saved to `family_facts`, welcome email sent

## Database Structure

Facts are saved to `family_facts` table with:
- `user_id`: UUID from webhook
- `fact_type`: Auto-detected ('general', 'school', 'activity', 'child')
- `fact_text`: The fact string
- `source`: 'onboarding_scan'
- `confidence`: 1.0 (user confirmed)
- `is_confirmed`: true

## Next Steps

1. ✅ Workflow created and validated
2. ⏳ Configure SendGrid API key (or replace email node)
3. ⏳ Test workflow with both paths (with/without edits)
4. ⏳ Activate workflow when ready
5. ⏳ Update Railway env var if using custom webhook URL

## Notes

- The workflow is currently **inactive** - activate it when ready to use
- Email sending will fail if SendGrid API key is not configured
- Fact type detection is basic (can be improved with better AI classification)
- The workflow handles errors gracefully with `continueOnFail` where needed

