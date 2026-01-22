import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

/**
 * API endpoint to retrieve onboarding summary for the authenticated user
 * 
 * Returns the extracted facts/sentences from the user's Gmail onboarding scan.
 * The n8n workflow populates this data after analyzing emails.
 * 
 * Authentication: Requires valid Supabase session cookie
 * 
 * Usage:
 * GET /api/onboarding/summary
 */

// Force dynamic rendering - this route uses cookies which requires dynamic execution
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('session_id') || searchParams.get('session')
    
    // Authenticate via session cookie or session_id parameter
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll() {
            // Not needed for read operations
          },
        },
      }
    )

    let user: any = null
    let userId: string | null = null

    // Try to get user from session cookie first
    const { data: { user: sessionUser }, error: authError } = await supabase.auth.getUser()
    
    if (sessionUser && !authError) {
      user = sessionUser
      userId = sessionUser.id
      console.log('✅ Authenticated via session cookie:', userId)
    } else if (sessionId) {
      // Fallback: Look up user by session_id via oauth_tokens table
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
      if (serviceRoleKey) {
        const { createClient } = await import('@supabase/supabase-js')
        const supabaseAdmin = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          serviceRoleKey
        )
        
        // Check for pending account first
        const { data: pendingToken } = await supabaseAdmin
          .from('oauth_tokens')
          .select('user_id')
          .eq('user_id', `pending_${sessionId}`)
          .eq('provider', 'unipile')
          .single()
        
        if (pendingToken) {
          // Account not ready yet
          return NextResponse.json({
            user_id: null,
            summary_sentences: [],
            status: 'pending',
            message: 'Account creation in progress'
          })
        }
        
        // Look for real user_id
        const { data: tokenData } = await supabaseAdmin
          .from('oauth_tokens')
          .select('user_id')
          .eq('unipile_account_id', sessionId)
          .eq('provider', 'unipile')
          .single()
        
        if (tokenData?.user_id) {
          userId = tokenData.user_id
          console.log('✅ Found user via session_id:', userId)
        }
      }
    }
    
    if (!userId) {
      console.error('Auth error in onboarding summary:', authError)
      return NextResponse.json(
        { error: 'Unauthorized - please log in', details: authError?.message || 'No session or session_id provided' },
        { status: 401 }
      )
    }

    console.log('Fetching onboarding summary for user:', userId)

    // Use service role to fetch summary (bypasses RLS if needed)
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const supabaseClient = serviceRoleKey 
      ? (await import('@supabase/supabase-js')).createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          serviceRoleKey
        )
      : supabase

    // Fetch onboarding summary for this user
    const { data: summaryData, error: summaryError } = await supabaseClient
      .from('onboarding_summaries')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (summaryError) {
      // If no record exists yet, return empty state (PGRST116 = no rows returned)
      if (summaryError.code === 'PGRST116') {
        console.log('No onboarding summary found for user:', userId, '- returning pending state')
        return NextResponse.json({
          user_id: userId,
          summary_sentences: [],
          status: 'pending',
          message: 'Onboarding scan in progress or not started'
        })
      }

      console.error('Error fetching onboarding summary:', summaryError)
      return NextResponse.json(
        { error: 'Error fetching onboarding data', details: summaryError.message },
        { status: 500 }
      )
    }

    console.log('Found onboarding summary for user:', userId, 'with', summaryData.summary_sentences?.length || 0, 'sentences')

    // Return the summary data (simplified schema - only essential fields)
    return NextResponse.json({
      user_id: summaryData.user_id,
      summary_sentences: summaryData.summary_sentences || [],
      status: summaryData.status || 'pending_review',
      created_at: summaryData.created_at,
      updated_at: summaryData.updated_at
    })

  } catch (error) {
    console.error('Error in onboarding summary endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

