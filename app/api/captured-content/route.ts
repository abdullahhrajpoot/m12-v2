import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { userId, portalCredentialId, content } = body

    if (!userId || !portalCredentialId || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Save the captured content
    const { data, error } = await supabase
      .from('captured_content')
      .insert({
        user_id: userId,
        portal_credential_id: portalCredentialId,
        content: content,
        processed: false
      })
      .select()
      .single()

    if (error) {
      console.error('Error saving captured content:', error)
      return NextResponse.json(
        { error: 'Failed to save captured content' },
        { status: 500 }
      )
    }

    // TODO: Send to n8n workflow for processing
    // You can add a webhook call here to your agent workflow

    return NextResponse.json({ 
      success: true,
      capturedContent: data 
    })
  } catch (error) {
    console.error('Error in captured content POST:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const processed = searchParams.get('processed')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    let query = supabase
      .from('captured_content')
      .select(`
        *,
        portal_credentials:portal_credential_id (
          portal_name,
          portal_url
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (processed !== null) {
      query = query.eq('processed', processed === 'true')
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching captured content:', error)
      return NextResponse.json(
        { error: 'Failed to fetch captured content' },
        { status: 500 }
      )
    }

    return NextResponse.json({ content: data })
  } catch (error) {
    console.error('Error in captured content GET:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
