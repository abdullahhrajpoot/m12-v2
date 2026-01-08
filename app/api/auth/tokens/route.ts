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

      // If token is expired and we have a refresh token, automatically refresh it (fallback)
      // Note: Proactive refresh should be handled by cron job calling /api/auth/refresh-tokens
      // This on-demand refresh is a safety net for tokens that weren't refreshed proactively
      if (isExpired && tokenData.refresh_token && provider === 'google') {
        // Get Google OAuth credentials from environment
        // These should match the credentials configured in Supabase Auth
        const googleClientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
        const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET
        
        if (!googleClientId || !googleClientSecret) {
          console.warn('⚠️ Google OAuth credentials not configured - cannot auto-refresh tokens')
          console.warn('GOOGLE_CLIENT_ID:', googleClientId ? 'SET' : 'MISSING')
          console.warn('GOOGLE_CLIENT_SECRET:', googleClientSecret ? 'SET' : 'MISSING')
          // Return expired token - workflow will mark as needs_reauth
        } else {
          try {
            console.log('🔄 Token expired, refreshing for user:', userId)
            
            // Refresh Google OAuth token
            const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              body: new URLSearchParams({
                client_id: googleClientId,
                client_secret: googleClientSecret,
                refresh_token: tokenData.refresh_token,
                grant_type: 'refresh_token',
              }),
            })

            if (refreshResponse.ok) {
              const refreshedData = await refreshResponse.json()
              
              // Calculate new expiration time (Google tokens typically expire in 1 hour)
              const newExpiresAt = refreshedData.expires_in
                ? new Date(Date.now() + refreshedData.expires_in * 1000).toISOString()
                : null

              // Update tokens in database
              const { error: updateError } = await supabaseAdmin
                .from('oauth_tokens')
                .update({
                  access_token: refreshedData.access_token,
                  expires_at: newExpiresAt,
                  updated_at: new Date().toISOString(),
                  // Note: refresh_token may or may not be returned - keep existing if not provided
                  refresh_token: refreshedData.refresh_token || tokenData.refresh_token,
                })
                .eq('user_id', userId)
                .eq('provider', provider)

              if (updateError) {
                console.error('Error updating refreshed token:', updateError)
                // Still return the expired token - workflow can handle it
              } else {
                console.log('✅ Token refreshed successfully for user:', userId)
                
                // Return the refreshed token
                return NextResponse.json({
                  provider: tokenData.provider,
                  access_token: refreshedData.access_token,
                  refresh_token: refreshedData.refresh_token || tokenData.refresh_token,
                  expires_at: newExpiresAt,
                  token_type: refreshedData.token_type || 'Bearer',
                  scope: refreshedData.scope || tokenData.scope,
                  is_expired: false,
                  was_refreshed: true,
                })
              }
            } else {
              const errorText = await refreshResponse.text()
              console.error('❌ Failed to refresh token:', refreshResponse.status, errorText)
              console.error('Refresh token used:', tokenData.refresh_token?.substring(0, 20) + '...')
              // If refresh fails, token is invalid - user needs to re-auth
              return NextResponse.json({
                error: 'Token expired and refresh failed. Please re-authenticate.',
                is_expired: true,
                needs_reauth: true,
                refresh_error: errorText,
              }, { status: 401 })
            }
          } catch (refreshError) {
            console.error('❌ Error refreshing token:', refreshError)
            // Return error instead of silently continuing
            return NextResponse.json({
              error: 'Token refresh failed. Please re-authenticate.',
              is_expired: true,
              needs_reauth: true,
              refresh_error: refreshError instanceof Error ? refreshError.message : 'Unknown error',
            }, { status: 401 })
          }
        }
      }

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
