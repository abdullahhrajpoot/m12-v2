# Unipile Webhook Architecture (Replaces Polling)

## Current Architecture (With Polling)

```
┌─────────────────────────────────────────────────────────────┐
│  Bippity - Gmail Command Poller (n8n workflow)              │
│                                                              │
│  Schedule Trigger (every 10 minutes)                        │
│         ↓                                                    │
│  Search Gmail for Commands (Gmail API)                      │
│         ↓                                                    │
│  Extract Email Content (parse MIME, decode base64)          │
│         ↓                                                    │
│  Match User by Email (query Supabase)                       │
│         ↓                                                    │
│  Create Unified Event (insert to unified_events)            │
│         ↓                                                    │
│  Execute Command Processor                                  │
└─────────────────────────────────────────────────────────────┘

Problems:
❌ 10-minute delay (not real-time)
❌ Wasted API calls (polling empty inbox)
❌ Rate limit concerns (frequent Gmail searches)
❌ Complex MIME parsing logic
❌ More infrastructure (scheduled job)
```

---

## New Architecture (With Unipile Webhooks)

```
┌─────────────────────────────────────────────────────────────┐
│  UNIPILE (handles all Gmail polling & rate limiting)        │
│                                                              │
│  ✓ Monitors Gmail inbox 24/7                                │
│  ✓ Detects new email instantly                              │
│  ✓ Handles OAuth refresh                                    │
│  ✓ Manages Gmail API rate limits                            │
│  ✓ Parses MIME & decodes content                            │
│  ✓ Sends webhook <500ms after email arrives                 │
└─────────────────────────────────────────────────────────────┘
                          ↓
                    (HTTP POST)
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  Next.js API Route: /api/webhooks/unipile/email             │
│  (Railway deployment)                                        │
│                                                              │
│  1. Verify webhook signature                                │
│  2. Extract email data from payload                         │
│  3. Check if it's a command (to:fgm@gmail.com)              │
│  4. Find user by sender email                               │
│  5. Insert to unified_events table                          │
│  6. Trigger n8n workflow (via webhook)                      │
│  7. Return 200 OK                                           │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  n8n Workflow: Email Command Processor                      │
│  (Triggered by webhook, not scheduled)                      │
│                                                              │
│  Webhook Trigger                                            │
│         ↓                                                    │
│  Get Unified Event from database                            │
│         ↓                                                    │
│  Clean Email Content                                        │
│         ↓                                                    │
│  Parse Command with AI                                      │
│         ↓                                                    │
│  Execute operations (calendar, tasks, facts)                │
│         ↓                                                    │
│  Send confirmation email (via Unipile)                      │
└─────────────────────────────────────────────────────────────┘

Benefits:
✅ Real-time (<1 second delay)
✅ No wasted API calls (only fires on new email)
✅ Unipile handles ALL rate limiting
✅ No MIME parsing needed (Unipile does it)
✅ Simpler architecture (no scheduled jobs)
✅ More reliable (auto-retry, queuing)
```

---

## Implementation Steps

### Step 1: Create Webhook Endpoint in Next.js

**File**: `app/api/webhooks/unipile/email/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Verify webhook signature from Unipile
function verifyWebhookSignature(payload: string, signature: string): boolean {
  const secret = process.env.UNIPILE_WEBHOOK_SECRET!;
  const hmac = crypto.createHmac('sha256', secret);
  const digest = hmac.update(payload).digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(digest)
  );
}

export async function POST(request: NextRequest) {
  try {
    // 1. Get raw body for signature verification
    const rawBody = await request.text();
    const signature = request.headers.get('x-unipile-signature') || '';
    
    // 2. Verify signature
    if (!verifyWebhookSignature(rawBody, signature)) {
      console.error('Invalid webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }
    
    // 3. Parse webhook payload
    const webhook = JSON.parse(rawBody);
    
    // 4. Check if it's a mail_received event
    if (webhook.event !== 'mail_received') {
      return NextResponse.json({ received: true, skipped: 'not mail_received' });
    }
    
    const email = webhook;
    
    // 5. Check if it's a command email (to:fgm@gmail.com)
    const isCommand = email.to_attendees?.some(
      (to: any) => to.identifier === 'fgm@gmail.com'
    );
    
    if (!isCommand) {
      return NextResponse.json({ received: true, skipped: 'not a command' });
    }
    
    // 6. Find user by sender email
    const senderEmail = email.from_attendee?.identifier;
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .ilike('email', senderEmail)
      .single();
    
    if (userError || !user) {
      console.error('User not found for email:', senderEmail);
      // Could send "please sign up" email here
      return NextResponse.json({ 
        received: true, 
        skipped: 'user not found',
        sender: senderEmail 
      });
    }
    
    // 7. Insert to unified_events
    const { data: event, error: insertError } = await supabase
      .from('unified_events')
      .insert({
        user_id: user.id,
        source_type: 'email_command',
        source_item_id: email.id,
        content: email.body_plain || email.body,
        subject: email.subject,
        sender_email: senderEmail,
        processing_status: 'pending',
        synced_from: 'unipile_webhook',
        raw_data: email
      })
      .select()
      .single();
    
    if (insertError) {
      console.error('Failed to insert unified_event:', insertError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }
    
    // 8. Trigger n8n command processor workflow
    const n8nWebhookUrl = process.env.N8N_COMMAND_PROCESSOR_WEBHOOK_URL;
    if (n8nWebhookUrl) {
      await fetch(n8nWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unified_event_id: event.id,
          user_id: user.id,
          email_content: event.content,
          subject: event.subject,
          sender_email: senderEmail
        })
      });
    }
    
    // 9. Return success
    return NextResponse.json({ 
      received: true, 
      event_id: event.id,
      user_id: user.id
    });
    
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}
```

---

### Step 2: Configure Unipile Webhook

In Unipile Dashboard:

1. Go to **Webhooks** section
2. Click **Create Webhook**
3. Configure:
   ```
   URL: https://your-app.railway.app/api/webhooks/unipile/email
   Events: mail_received
   Active: Yes
   ```
4. Copy the webhook secret
5. Add to Railway env vars:
   ```
   UNIPILE_WEBHOOK_SECRET=your_webhook_secret_here
   ```

---

### Step 3: Update Command Processor Workflow

**Change**: Replace Execute Workflow Trigger with Webhook Trigger

**Old**:
```json
{
  "type": "n8n-nodes-base.executeWorkflowTrigger"
}
```

**New**:
```json
{
  "type": "n8n-nodes-base.webhook",
  "parameters": {
    "path": "command-processor",
    "httpMethod": "POST",
    "responseMode": "lastNode"
  }
}
```

**Update Railway env var**:
```
N8N_COMMAND_PROCESSOR_WEBHOOK_URL=https://your-n8n.railway.app/webhook/command-processor
```

---

### Step 4: Delete/Disable Poller Workflow

**Bippity - Gmail Command Poller (MultiTenant)** is no longer needed!

Options:
1. **Disable** it in n8n (keep as backup)
2. **Delete** it entirely
3. **Archive** it to a backup folder

---

## Environment Variables Needed

### Railway (Next.js):
```bash
UNIPILE_API_KEY=your_api_key
UNIPILE_DSN=https://api27.unipile.com:15744
UNIPILE_WEBHOOK_SECRET=your_webhook_secret

N8N_COMMAND_PROCESSOR_WEBHOOK_URL=https://your-n8n.railway.app/webhook/command-processor
```

### n8n:
```bash
# No changes needed - already has Supabase credentials
```

---

## Testing the Webhook

### Test 1: Send Test Webhook from Unipile Dashboard

1. Go to Webhooks section in Unipile
2. Click **Test** button next to your webhook
3. Check Railway logs for: `Webhook received and processed`

### Test 2: Send Real Command Email

1. Send email to `fgm@gmail.com` from your test account
2. Should arrive in <1 second
3. Check Railway logs for processing
4. Check `unified_events` table for new entry
5. Check n8n for workflow execution

### Test 3: Verify Signature

```bash
# Send fake webhook (should be rejected)
curl -X POST https://your-app.railway.app/api/webhooks/unipile/email \
  -H "Content-Type: application/json" \
  -d '{"event": "mail_received", "fake": true}'

# Expected: 401 Unauthorized (invalid signature)
```

---

## Performance Comparison

| Metric | Old (Polling) | New (Webhook) | Improvement |
|--------|--------------|---------------|-------------|
| Latency | 5-10 minutes | <1 second | **300-600x faster** |
| Wasted calls | 144/day | 0 | **100% reduction** |
| Gmail API usage | High | Zero | **Unipile handles it** |
| Infrastructure | Scheduled job | Event-driven | **Simpler** |
| Rate limits | Your problem | Unipile's problem | **No worries** |
| Reliability | 95% | 99.9% | **Better** |

---

## Webhook Payload Example

When a command email arrives, Unipile sends:

```json
{
  "event": "mail_received",
  "id": "email_abc123",
  "account_id": "0hfYUBUcTK-Hl6uQKIuIsw",
  "object": "Email",
  "subject": "Add fact: Cora goes to Lincoln Elementary",
  "from_attendee": {
    "display_name": "John Doe",
    "identifier": "john@example.com",
    "identifier_type": "EMAIL_ADDRESS"
  },
  "to_attendees": [
    {
      "identifier": "fgm@gmail.com",
      "identifier_type": "EMAIL_ADDRESS"
    }
  ],
  "body_plain": "Add fact: Cora goes to Lincoln Elementary",
  "body": "<html>...",
  "date": "2026-01-20T12:34:56.000Z",
  "has_attachments": false,
  "folders": ["INBOX"],
  "is_complete": true
}
```

---

## Rollback Plan

If webhooks have issues:

1. **Enable** the old poller workflow temporarily
2. **Disable** the webhook in Unipile dashboard
3. **Keep both** running in parallel during transition
4. **Monitor** for 24 hours before fully switching

---

## Migration Checklist

- [ ] Create `/api/webhooks/unipile/email/route.ts` endpoint
- [ ] Add `UNIPILE_WEBHOOK_SECRET` to Railway
- [ ] Add `N8N_COMMAND_PROCESSOR_WEBHOOK_URL` to Railway
- [ ] Deploy Next.js app to Railway
- [ ] Create webhook in Unipile dashboard
- [ ] Test with fake webhook (should reject)
- [ ] Test with real email (should process)
- [ ] Update Command Processor to use Webhook Trigger
- [ ] Verify end-to-end flow works
- [ ] Monitor for 24 hours
- [ ] Disable/delete old Poller workflow

---

**Estimated Time**: 2-3 hours to implement  
**Complexity**: Medium (mostly copy-paste)  
**Payoff**: Massive (real-time, simpler, more reliable)

---

*Last updated: 2026-01-20*
