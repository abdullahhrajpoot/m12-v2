import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * API endpoint to store OAuth provider tokens
 * 
 * Called after successful OAuth to store tokens in the database for n8n workflows.
 * 
 * POST /api/auth/store-tokens
 * Body: { provider, access_token, refresh_token?, expires_at?, scope? }
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user via session cookie
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
            // Not needed
          },
        },
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { provider, access_token, refresh_token, expires_at, scope, token_type } = body

    if (!provider || !access_token) {
      return NextResponse.json(
        { error: 'provider and access_token are required' },
        { status: 400 }
      )
    }

    // Use service role to store tokens (bypass RLS since user is authenticated)
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

    // Upsert tokens (insert or update if exists)
    // Note: oauth_tokens table columns: id, user_id, provider, access_token, refresh_token, expires_at, created_at, updated_at
    const { data, error } = await supabaseAdmin
      .from('oauth_tokens')
      .upsert({
        user_id: user.id,
        provider: provider,
        access_token: access_token,
        refresh_token: refresh_token || null,
        expires_at: expires_at ? new Date(expires_at).toISOString() : null,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,provider' // This requires a unique constraint on (user_id, provider)
      })
      .select()
      .single()

    if (error) {
      console.error('Error storing tokens:', error)
      return NextResponse.json(
        { error: 'Failed to store tokens' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Tokens stored successfully',
    })

  } catch (error) {
    console.error('Error storing tokens:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


