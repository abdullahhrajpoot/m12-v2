import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { data, error } = await supabase
      .from('portal_credentials')
      .select('*')
      .eq('user_id', userId)
      .order('portal_name', { ascending: true })

    if (error) {
      console.error('Error fetching portal credentials:', error)
      return NextResponse.json(
        { error: 'Failed to fetch portal credentials' },
        { status: 500 }
      )
    }

    return NextResponse.json({ credentials: data })
  } catch (error) {
    console.error('Error in portal credentials GET:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { userId, portalName, portalUrl, loginUsername, loginPassword, notes } = body

    if (!userId || !portalName || !loginUsername || !loginPassword) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { data, error } = await supabase
      .from('portal_credentials')
      .insert({
        user_id: userId,
        portal_name: portalName,
        portal_url: portalUrl,
        login_username: loginUsername,
        login_password: loginPassword,
        notes: notes
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating portal credential:', error)
      return NextResponse.json(
        { error: 'Failed to create portal credential' },
        { status: 500 }
      )
    }

    return NextResponse.json({ credential: data })
  } catch (error) {
    console.error('Error in portal credentials POST:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
