import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * API endpoint to retrieve OAuth provider tokens for n8n workflows
 * 
 * This replaces the Nango token retrieval mechanism.
 * n8n workflows should call this endpoint to get Google OAuth tokens.
 * 
 * Authentication: Requires either:
 * - Valid Supabase session cookie (for user requests)
 * - API key in Authorization header (for n8n service-to-service calls)
 * 
 * Usage from n8n:
 * GET /api/auth/tokens?userId=<user-id>&provider=google
 * Headers: Authorization: Bearer <N8N_API_KEY>
 */
export async function GET(request: NextRequest) {
  try {
    // Check for API key authentication (for n8n service-to-service)
    const authHeader = request.headers.get('authorization')
    const apiKey = authHeader?.replace('Bearer ', '')
    const expectedApiKey = process.env.N8N_API_KEY

    let userId: string | null = null

    // Authenticate via API key (for n8n)
    if (apiKey && expectedApiKey && apiKey === expectedApiKey) {
      // Get userId and provider from query params when using API key
      const { searchParams } = new URL(request.url)
      userId = searchParams.get('userId')
      const provider = searchParams.get('provider') || 'google'
      
      if (!userId) {
        return NextResponse.json(
          { error: 'userId query parameter required when using API key' },
          { status: 400 }
        )
      }

      // Use service role to access tokens table
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
      
      if (!serviceRoleKey) {
        console.error('SUPABASE_SERVICE_ROLE_KEY not configured')
        return NextResponse.json(
          { error: 'Server configuration error' },
          { status: 500 }
        )
      }

      // Create service role client to bypass RLS
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        serviceRoleKey
      )

      // Get tokens from our oauth_tokens table
      const { data: tokenData, error: tokenError } = await supabaseAdmin
        .from('oauth_tokens')
        .select('*')
        .eq('user_id', userId)
        .eq('provider', provider)
        .single()

      if (tokenError || !tokenData) {
        return NextResponse.json(
          { error: 'OAuth tokens not found for this user. Please complete OAuth setup.' },
          { status: 404 }
        )
      }

      // Check if token is expired
      const isExpired = tokenData.expires_at 
        ? new Date(tokenData.expires_at) < new Date()
        : false

      return NextResponse.json({
        provider: tokenData.provider,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_at: tokenData.expires_at,
        token_type: tokenData.token_type || 'Bearer',
        scope: tokenData.scope,
        is_expired: isExpired,
      })

    } else {
      // Authenticate via session cookie (for user requests)
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
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }

      userId = user.id

      // Get provider from query params
      const { searchParams } = new URL(request.url)
      const provider = searchParams.get('provider') || 'google'

      // Get tokens for the authenticated user
      const { data: tokenData, error: tokenError } = await supabase
        .from('oauth_tokens')
        .select('*')
        .eq('user_id', userId)
        .eq('provider', provider)
        .single()

      if (tokenError || !tokenData) {
        return NextResponse.json(
          { error: 'OAuth tokens not found. Please complete OAuth setup.' },
          { status: 404 }
        )
      }

      // Don't return full token details for user requests (security)
      return NextResponse.json({
        provider: tokenData.provider,
        has_token: !!tokenData.access_token,
        expires_at: tokenData.expires_at,
      })
    }

  } catch (error) {
    console.error('Error retrieving tokens:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
