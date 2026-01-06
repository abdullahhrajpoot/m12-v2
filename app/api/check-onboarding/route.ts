import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

/**
 * API endpoint to check onboarding_summaries table
 * This is a diagnostic endpoint - should be removed or secured in production
 */
export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    // Try service role key first, fallback to anon key (may be limited by RLS)
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Missing Supabase environment variables' },
        { status: 500 }
      )
    }

    // Use service role client if available, otherwise use anon key (may be limited by RLS)
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Query onboarding_summaries table
    const { data, error } = await supabase
      .from('onboarding_summaries')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      console.error('Error querying database:', error)
      return NextResponse.json(
        { error: 'Error querying database', details: error.message },
        { status: 500 }
      )
    }

    // Check for the most recent run's user ID
    const userId = '8ac8bfee-c53a-4c35-b2d0-f92b0906b146' // From execution data
    const userRecords = data?.filter(r => r.user_id === userId) || []

    // Also try to get the specific record ID from execution
    const recordId = 'e1f1182e-7f6c-407a-ae39-8837647ab39f'
    const { data: specificRecord, error: specificError } = await supabase
      .from('onboarding_summaries')
      .select('*')
      .eq('id', recordId)
      .single()

    return NextResponse.json({
      total_records: data?.length || 0,
      all_records: data || [],
      user_records: userRecords,
      user_id_checked: userId,
      specific_record: specificRecord || null,
      specific_record_error: specificError?.message || null,
      message: userRecords.length > 0 
        ? `Found ${userRecords.length} record(s) for user ${userId}`
        : `No records found for user ${userId}`,
      // Show summary_sentences details (simplified schema)
      sentences_details: userRecords.map(r => ({
        id: r.id,
        user_id: r.user_id,
        sentences_count: Array.isArray(r.summary_sentences) ? r.summary_sentences.length : 0,
        sentences: r.summary_sentences,
        status: r.status,
        created_at: r.created_at,
        updated_at: r.updated_at
      }))
    })

  } catch (error) {
    console.error('Error in check-onboarding endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

