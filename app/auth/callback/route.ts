import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? '/whatwefound'

  // Use NEXT_PUBLIC_APP_URL if set, otherwise use request origin
  // This ensures consistent redirects regardless of where the callback was called from
  // For production, always prefer the environment variable to avoid localhost redirects
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 
    (requestUrl.hostname === 'bippity.boo' ? requestUrl.origin : process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : requestUrl.origin)

  console.log('Callback route:', {
    requestOrigin: requestUrl.origin,
    appUrl,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    hostname: requestUrl.hostname,
    hasCode: !!code
  })

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )

  let userId: string | null = null
  let userEmail: string | null = null
  let providerToken: string | null = null
  let providerRefreshToken: string | null = null
  let provider: string = 'google'
  let expiresAt: string | null = null

  if (code) {
    // New OAuth flow - exchange code for session
    const { data: sessionData, error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      console.error('Error exchanging code for session:', error)
      return NextResponse.redirect(new URL('/?error=auth_failed', appUrl))
    }

    if (sessionData?.session?.user) {
      userId = sessionData.session.user.id
      userEmail = sessionData.session.user.email || null
      providerToken = sessionData.session.provider_token || null
      providerRefreshToken = sessionData.session.provider_refresh_token || null
      provider = sessionData.session.user.app_metadata?.provider || 'google'
      expiresAt = sessionData.session.expires_at
        ? new Date(sessionData.session.expires_at * 1000).toISOString()
        : null
    }
  } else {
    // No code - check if user has existing session (re-auth scenario)
    // This handles the case where user clicks "Sign Up With Google" but already has a session
    console.log('No code in callback - checking for existing session')
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (user && !userError) {
      userId = user.id
      userEmail = user.email || null
      console.log('Found existing session for user:', userId)
      
      // For existing sessions, we still want to trigger the n8n webhook
      // to update user status from needs_reauth to active
    } else {
      console.log('No existing session found, redirecting to home')
      return NextResponse.redirect(new URL('/', appUrl))
    }
  }

  // Store OAuth provider tokens (requires service role key)
  if (userId) {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    console.log('Auth callback - userId:', userId, 'hasServiceRoleKey:', !!serviceRoleKey, 'hasProviderToken:', !!providerToken)

    if (serviceRoleKey && providerToken) {
      try {
        const supabaseAdmin = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          serviceRoleKey
        )

        // Store tokens in oauth_tokens table for n8n to retrieve
        const { error: insertError } = await supabaseAdmin
          .from('oauth_tokens')
          .upsert({
            user_id: userId,
            provider: provider,
            access_token: providerToken,
            refresh_token: providerRefreshToken || null,
            expires_at: expiresAt,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'user_id,provider' // Update if exists
          })

        if (insertError) {
          console.error('Error storing OAuth tokens:', insertError)
        } else {
          console.log('OAuth tokens stored successfully for user:', userId, 'provider:', provider)
        }
      } catch (tokenError) {
        console.error('Error in OAuth token storage:', tokenError)
      }
    } else if (!serviceRoleKey) {
      console.warn('SUPABASE_SERVICE_ROLE_KEY not set - skipping token storage')
    }
    
    // ALWAYS trigger n8n onboarding workflow (moved outside serviceRoleKey check)
    // This ensures user status is updated from needs_reauth to active
    const n8nWebhookUrl = process.env.N8N_ONBOARDING_WEBHOOK_URL || 
      'https://chungxchung.app.n8n.cloud/webhook/parallelized-supabase-oauth'
    
    console.log('Triggering n8n webhook for user:', userId, 'email:', userEmail, 'webhook:', n8nWebhookUrl)
    
    // Call webhook - await it to ensure it completes before redirect
    try {
      const webhookResponse = await fetch(n8nWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
          email: userEmail,
        }),
      })
      
      if (!webhookResponse.ok) {
        console.error('n8n webhook returned error status:', webhookResponse.status, await webhookResponse.text())
      } else {
        console.log('n8n onboarding webhook triggered successfully for user:', userId)
      }
    } catch (webhookError) {
      console.error('Error calling n8n onboarding webhook:', webhookError)
    }
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(new URL(next, appUrl))
}

