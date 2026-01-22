import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

/**
 * API endpoint to receive Unipile webhook notifications for new emails
 * 
 * Unipile sends webhooks when new emails arrive. We verify the authentication header,
 * store the email in unified_events table for processing.
 * 
 * POST /api/webhooks/unipile/email
 * Headers: Unipile-Auth (custom secret you configure)
 * Body: Unipile message object
 */

// Force dynamic rendering
export const dynamic = 'force-dynamic'

/**
 * Verify Unipile webhook authentication
 * Unipile uses a custom header "Unipile-Auth" with a secret you provide when creating the webhook
 */
function verifyUnipileAuth(authHeader: string | null, expectedSecret: string): boolean {
  if (!authHeader) {
    return false
  }
  
  // Simple string comparison - the secret you set when creating the webhook
  return authHeader === expectedSecret
}

/**
 * Map Unipile account_id to user_id
 */
async function getUserIdFromUnipileAccount(accountId: string, supabaseAdmin: any): Promise<string | null> {
  const { data, error } = await supabaseAdmin
    .from('oauth_tokens')
    .select('user_id')
    .eq('unipile_account_id', accountId)
    .eq('provider', 'unipile')
    .single()

  if (error || !data) {
    console.error('Could not find user for Unipile account:', accountId, error)
    return null
  }

  return data.user_id
}

export async function POST(request: NextRequest) {
  try {
    // Get webhook secret from environment
    const webhookSecret = process.env.UNIPILE_WEBHOOK_SECRET

    if (!webhookSecret) {
      console.error('UNIPILE_WEBHOOK_SECRET not configured')
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      )
    }

    // Verify webhook authentication
    // Unipile sends the secret in the "Unipile-Auth" header
    const authHeader = request.headers.get('Unipile-Auth')
    const body = await request.text()

    if (!verifyUnipileAuth(authHeader, webhookSecret)) {
      console.error('Invalid webhook authentication - Unipile-Auth header missing or incorrect')
      return NextResponse.json(
        { error: 'Invalid authentication' },
        { status: 401 }
      )
    }

    // Parse webhook data
    const data = JSON.parse(body)

    console.log('📧 Unipile email webhook received:', {
      messageId: data.id,
      accountId: data.account_id,
      subject: data.subject,
      from: data.from?.email
    })

    // Get service role client for database operations
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!serviceRoleKey) {
      console.error('SUPABASE_SERVICE_ROLE_KEY not configured')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey
    )

    // Map Unipile account_id to our user_id
    const userId = await getUserIdFromUnipileAccount(data.account_id, supabaseAdmin)

    if (!userId) {
      console.error('Could not find user for Unipile account:', data.account_id)
      // Return 200 to acknowledge receipt, but don't process
      return NextResponse.json({ received: true, processed: false })
    }

    // Extract email body (prefer text_body, fallback to body)
    let emailContent = ''
    if (data.text_body) {
      emailContent = data.text_body
    } else if (data.body) {
      emailContent = data.body
    }

    // Store email in unified_events table
    const { error: insertError } = await supabaseAdmin
      .from('unified_events')
      .insert({
        user_id: userId,
        source_type: 'email',
        source_item_id: data.id,
        subject: data.subject,
        sender_email: data.from?.email || '',
        recipient_emails: data.to?.map((t: any) => t.email) || [],
        content: emailContent,
        synced_from: 'unipile_webhook',
        processing_status: 'pending',
        raw_data: data,
        created_at: data.date ? new Date(data.date).toISOString() : new Date().toISOString()
      })

    if (insertError) {
      console.error('Error storing email in unified_events:', insertError)
      return NextResponse.json(
        { error: 'Failed to store email' },
        { status: 500 }
      )
    }

    console.log('✅ Email stored in unified_events for user:', userId)

    // TODO: In the future, trigger email processing workflow here
    // For now, emails are just stored for later processing

    return NextResponse.json({ 
      received: true,
      processed: true,
      user_id: userId
    })

  } catch (error) {
    console.error('Error processing Unipile webhook:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
