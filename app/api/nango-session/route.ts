import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const NANGO_SECRET_KEY = process.env.NANGO_SECRET_KEY

  if (!NANGO_SECRET_KEY) {
    return NextResponse.json(
      { error: 'Nango secret key not configured' },
      { status: 500 }
    )
  }

  try {
    const body = await request.json()
    const { userId } = body

    // Create Connect session using Nango API
    const response = await fetch('https://api.nango.dev/connect/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NANGO_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        end_user: {
          id: userId || 'user-' + Date.now()
        },
        allowed_integrations: ['google'],
        redirect_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/nango-callback`
      })
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || 'Failed to create Nango session' },
        { status: response.status }
      )
    }

    return NextResponse.json({ 
      connectUrl: data.data.connect_link,
      connectionId: data.data.connection_id
    })
  } catch (error) {
    console.error('Nango session creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

