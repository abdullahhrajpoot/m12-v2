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
        allowed_integrations: ['google']
      })
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('Nango API Error:', {
        status: response.status,
        statusText: response.statusText,
        data: data,
        errors: data.error?.errors || data.errors
      })
      // Extract detailed error messages
      let errorMsg = 'Failed to create Nango session'
      if (data.error?.errors && Array.isArray(data.error.errors)) {
        errorMsg = data.error.errors.map((e: any) => e.message || JSON.stringify(e)).join(', ')
      } else if (typeof data.error === 'string') {
        errorMsg = data.error
      } else if (data.message) {
        errorMsg = data.message
      } else {
        errorMsg = JSON.stringify(data)
      }
      return NextResponse.json(
        { error: errorMsg },
        { status: response.status }
      )
    }

    console.log('Nango session created successfully:', {
      connect_link: data.data?.connect_link,
      connection_id: data.data?.connection_id,
      full_response: JSON.stringify(data, null, 2)
    })

    return NextResponse.json({ 
      connectUrl: data.data?.connect_link,
      connectionId: data.data?.connection_id
    })
  } catch (error) {
    console.error('Nango session creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

