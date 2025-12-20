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
export async function GET(request: NextRequest) {
  try {
    // Authenticate via session cookie
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

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - please log in' },
        { status: 401 }
      )
    }

    // Fetch onboarding summary for this user
    const { data: summaryData, error: summaryError } = await supabase
      .from('onboarding_summaries')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (summaryError) {
      // If no record exists yet, return empty state
      if (summaryError.code === 'PGRST116') {
        return NextResponse.json({
          user_id: user.id,
          summary_sentences: [],
          status: 'pending',
          message: 'Onboarding scan in progress or not started'
        })
      }

      console.error('Error fetching onboarding summary:', summaryError)
      return NextResponse.json(
        { error: 'Error fetching onboarding data' },
        { status: 500 }
      )
    }

    // Return the summary data
    return NextResponse.json({
      user_id: summaryData.user_id,
      summary_sentences: summaryData.summary_sentences || [],
      children: summaryData.children || [],
      unassigned_schools: summaryData.unassigned_schools || [],
      unassigned_activities: summaryData.unassigned_activities || [],
      emails_analyzed_count: summaryData.emails_analyzed_count || 0,
      status: summaryData.status || 'completed',
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

