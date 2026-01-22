import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

/**
 * API endpoint to receive Unipile webhook notifications for account creation
 * 
 * Unipile sends webhooks when accounts are successfully connected via hosted auth.
 * We store the account_id and trigger the onboarding workflow.
 * 
 * POST /api/webhooks/unipile/account
 * Body: { status: "CREATION_SUCCESS", account_id: "...", name: "..." }
 */

// Force dynamic rendering
export const dynamic = 'force-dynamic'

/**
 * Verify Unipile webhook authentication
 */
function verifyUnipileAuth(authHeader: string | null, expectedSecret: string): boolean {
  if (!authHeader) {
    return false
  }
  
  return authHeader === expectedSecret
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

    console.log('📧 Unipile account webhook received:', {
      status: data.status,
      accountId: data.account_id,
      name: data.name
    })

    // The 'name' parameter contains our internal user identifier
    // For now, we'll use it to store a temporary mapping
    // In production, you might want to use a proper session ID or user ID
    
    if (data.status !== 'CREATION_SUCCESS' && data.status !== 'RECONNECTED') {
      console.log('⚠️ Account status is not CREATION_SUCCESS or RECONNECTED:', data.status)
      return NextResponse.json({ received: true, processed: false })
    }

    if (!data.account_id) {
      console.error('No account_id in webhook payload')
      return NextResponse.json(
        { error: 'Missing account_id' },
        { status: 400 }
      )
    }

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

    // The 'name' parameter contains the session_id we passed
    const sessionId = data.name
    
    if (!sessionId) {
      console.error('No session_id (name) in webhook payload')
      return NextResponse.json(
        { error: 'Missing session_id' },
        { status: 400 }
      )
    }

    // Store account_id in oauth_tokens table with a temporary user_id
    // We'll use a special format: "pending_{sessionId}" as the user_id
    // The callback will look this up and create/update the real user
    const { error: insertError } = await supabaseAdmin
      .from('oauth_tokens')
      .insert({
        user_id: `pending_${sessionId}`, // Temporary user_id
        provider: 'unipile',
        unipile_account_id: data.account_id,
        provider_email: null, // Will be filled in callback
        updated_at: new Date().toISOString()
      })

    if (insertError) {
      console.error('Error storing pending account:', insertError)
      // Try update instead in case it already exists
      const { error: updateError } = await supabaseAdmin
        .from('oauth_tokens')
        .update({
          unipile_account_id: data.account_id,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', `pending_${sessionId}`)
        .eq('provider', 'unipile')
      
      if (updateError) {
        console.error('Error updating pending account:', updateError)
      }
    }

    console.log('✅ Account webhook processed:', data.account_id)

    return NextResponse.json({ 
      received: true,
      processed: true,
      account_id: data.account_id
    })

  } catch (error) {
    console.error('Error processing Unipile account webhook:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
