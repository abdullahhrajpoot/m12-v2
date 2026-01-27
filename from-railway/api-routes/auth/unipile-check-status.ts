import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

/**
 * API endpoint to check Unipile account creation status
 * 
 * Polls for account creation by checking oauth_tokens table for pending session.
 * Used by whatwefound page to detect when account is ready.
 * 
 * GET /api/auth/unipile/check-status?session_id={id}
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('session_id')

    if (!sessionId) {
      return NextResponse.json(
        { error: 'session_id is required' },
        { status: 400 }
      )
    }

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

    // Check for pending account
    const { data: pendingToken, error: lookupError } = await supabaseAdmin
      .from('oauth_tokens')
      .select('unipile_account_id, provider_email')
      .eq('user_id', `pending_${sessionId}`)
      .eq('provider', 'unipile')
      .single()

    if (lookupError || !pendingToken || !pendingToken.unipile_account_id) {
      return NextResponse.json({
        status: 'pending',
        account_id: null,
        email: null
      })
    }

    // Account found!
    return NextResponse.json({
      status: 'created',
      account_id: pendingToken.unipile_account_id,
      email: pendingToken.provider_email || null
    })

  } catch (error) {
    console.error('Error checking account status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
