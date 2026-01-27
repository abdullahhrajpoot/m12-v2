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
 * NOTE: notify_url from Hosted Auth does NOT send authentication headers
 * This is different from regular webhooks created via API
 * The notify_url is a callback from Unipile's hosted auth wizard
 * We rely on the payload structure and the 'name' parameter for security
 * 
 * If you need authentication, you can:
 * 1. Include a secret in the notify_url query string
 * 2. Verify the payload structure matches expected format
 * 3. Use HTTPS to ensure secure transmission
 */

export async function POST(request: NextRequest) {
  // Log all incoming requests for debugging (sanitize URL to avoid logging localhost)
  const urlPath = new URL(request.url).pathname + new URL(request.url).search
  console.log('📧 Unipile account webhook endpoint hit:', {
    method: request.method,
    url: urlPath, // Only log path, not full URL with host
    host: request.headers.get('host'), // Log host separately
    userAgent: request.headers.get('user-agent')
  })

  try {
    // IMPORTANT: notify_url from Hosted Auth does NOT send authentication headers
    // This is different from regular webhooks created via API
    // The notify_url is a callback from Unipile's hosted auth wizard
    // We rely on HTTPS and payload structure for security
    // See: https://developer.unipile.com/docs/hosted-auth
    
    const body = await request.text()
    
    console.log('📧 notify_url webhook received from Unipile Hosted Auth:', {
      method: request.method,
      bodyLength: body.length
    })

    // Parse webhook data
    let data
    try {
      data = JSON.parse(body)
    } catch (parseError) {
      console.error('❌ Failed to parse webhook body:', parseError, 'Body:', body)
      return NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400 }
      )
    }

    console.log('📧 Unipile account webhook received:', {
      status: data.status,
      accountId: data.account_id,
      name: data.name,
      fullPayload: data
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
    const pendingUserId = `pending_${sessionId}`
    
    console.log('📧 Storing pending account:', {
      pendingUserId,
      accountId: data.account_id,
      sessionId
    })

    const { data: insertData, error: insertError } = await supabaseAdmin
      .from('oauth_tokens')
      .insert({
        user_id: pendingUserId, // Temporary user_id
        provider: 'unipile',
        unipile_account_id: data.account_id,
        provider_email: null, // Will be filled in callback
        updated_at: new Date().toISOString()
      })
      .select()

    if (insertError) {
      console.error('❌ Error storing pending account:', insertError)
      // Try update instead in case it already exists
      const { data: updateData, error: updateError } = await supabaseAdmin
        .from('oauth_tokens')
        .update({
          unipile_account_id: data.account_id,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', pendingUserId)
        .eq('provider', 'unipile')
        .select()
      
      if (updateError) {
        console.error('❌ Error updating pending account:', updateError)
        return NextResponse.json(
          { error: 'Failed to store account', details: updateError.message },
          { status: 500 }
        )
      } else {
        console.log('✅ Updated existing pending account:', updateData)
      }
    } else {
      console.log('✅ Inserted new pending account:', insertData)
    }

    // Verify the record was stored
    const { data: verifyData, error: verifyError } = await supabaseAdmin
      .from('oauth_tokens')
      .select('unipile_account_id')
      .eq('user_id', pendingUserId)
      .eq('provider', 'unipile')
      .single()

    if (verifyError || !verifyData) {
      console.error('❌ Failed to verify stored account:', verifyError)
      return NextResponse.json(
        { error: 'Account stored but verification failed' },
        { status: 500 }
      )
    }

    console.log('✅ Account webhook processed and verified:', {
      account_id: data.account_id,
      sessionId,
      storedAccountId: verifyData.unipile_account_id
    })

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
