import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { comment, is_correct } = body

    // TODO: Store feedback in Supabase
    // For now, just log it and return success
    console.log('Scan feedback received:', { comment, is_correct })

    // In the future, you can store this in Supabase:
    // const { error } = await supabase
    //   .from('scan_feedback')
    //   .insert({ comment, is_correct, user_id: userId })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Scan feedback error:', error)
    return NextResponse.json(
      { error: 'Failed to submit feedback' },
      { status: 500 }
    )
  }
}

