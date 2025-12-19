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
    hostname: requestUrl.hostname
  })

  if (code) {
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
    
    const { data: sessionData, error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      console.error('Error exchanging code for session:', error)
      return NextResponse.redirect(new URL('/?error=auth_failed', appUrl))
    }

    // Store OAuth provider tokens for n8n workflows
    // Provider tokens are only available in the session object immediately after OAuth
    if (sessionData?.session?.provider_token && sessionData?.session?.user) {
      const userId = sessionData.session.user.id
      const providerToken = sessionData.session.provider_token
      const providerRefreshToken = sessionData.session.provider_refresh_token
      const provider = sessionData.session.user.app_metadata?.provider || 'google'
      const expiresAt = sessionData.session.expires_at
        ? new Date(sessionData.session.expires_at * 1000).toISOString()
        : null

      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

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
            
            // Trigger n8n onboarding workflow (non-blocking - don't fail OAuth if webhook fails)
            const n8nWebhookUrl = process.env.N8N_ONBOARDING_WEBHOOK_URL || 
              'https://chungxchung.app.n8n.cloud/webhook/supabase-oauth'
            
            // Call webhook - don't await to avoid blocking redirect, but handle errors
            fetch(n8nWebhookUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                userId: userId,
                email: sessionData.session.user.email,
              }),
            }).then((response) => {
              if (!response.ok) {
                console.error('n8n webhook returned error status:', response.status)
              } else {
                console.log('n8n onboarding webhook triggered successfully for user:', userId)
              }
            }).catch((webhookError) => {
              // Log but don't fail OAuth flow if webhook call fails
              console.error('Error calling n8n onboarding webhook:', webhookError)
            })
          }
        } catch (tokenError) {
          // Log but don't fail the OAuth flow if token storage fails
          console.error('Error storing OAuth tokens:', tokenError)
        }
      } else if (!providerToken) {
        console.warn('No provider token found in session for user:', userId)
      }
    }
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(new URL(next, appUrl))
}

