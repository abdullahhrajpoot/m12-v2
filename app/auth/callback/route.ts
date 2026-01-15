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

  console.log('Callback route hit:', {
    requestOrigin: requestUrl.origin,
    appUrl,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    hostname: requestUrl.hostname,
    hasCode: !!code,
    code: code ? `${code.substring(0, 10)}...` : null,
    allParams: Object.fromEntries(requestUrl.searchParams.entries())
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
  let userFullName: string | null = null
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

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/5beb2915-5867-4232-9971-7d67e3e68583',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth/callback/route.ts:60',message:'After exchangeCodeForSession',data:{hasSession:!!sessionData?.session,hasUser:!!sessionData?.session?.user,hasProviderToken:!!sessionData?.session?.provider_token,hasRefreshToken:!!sessionData?.session?.provider_refresh_token,sessionKeys:sessionData?.session?Object.keys(sessionData.session):null},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion

    if (sessionData?.session?.user) {
      userId = sessionData.session.user.id
      userEmail = sessionData.session.user.email || null
      providerToken = sessionData.session.provider_token || null
      providerRefreshToken = sessionData.session.provider_refresh_token || null
      provider = sessionData.session.user.app_metadata?.provider || 'google'
      expiresAt = sessionData.session.expires_at
        ? new Date(sessionData.session.expires_at * 1000).toISOString()
        : null
      // Extract full name from Google OAuth user metadata
      userFullName = sessionData.session.user.user_metadata?.full_name || 
                     sessionData.session.user.user_metadata?.name || null

    }
  } else {
    // No code - check if user has existing session (re-auth scenario)
    // This handles the case where user clicks "Sign Up With Google" but already has a session
    console.log('⚠️ No code in callback - checking for existing session')
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (user && !userError) {
      userId = user.id
      userEmail = user.email || null
      console.log('✅ Found existing session for user:', userId, 'email:', userEmail)
      
      // Try to get provider tokens from the session if available
      // Supabase may have refreshed the tokens during re-auth
      if (session && !sessionError) {
        providerToken = session.provider_token || null
        providerRefreshToken = session.provider_refresh_token || null
        provider = user.app_metadata?.provider || 'google'
        expiresAt = session.expires_at
          ? new Date(session.expires_at * 1000).toISOString()
          : null
        
        if (providerToken) {
          console.log('✅ Found provider token in session for re-auth')
        } else {
          console.log('⚠️ No provider token in session - tokens may need to be refreshed')
        }
      }
      
      // For existing sessions, we still want to trigger the n8n webhook
      // to update user status from needs_reauth to active
    } else {
      console.error('❌ No existing session found! userError:', userError, 'redirecting to home')
      return NextResponse.redirect(new URL('/', appUrl))
    }
  }

  // Store OAuth provider tokens (requires service role key)
  if (userId) {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    console.log('🔐 Auth callback processing - userId:', userId, 'email:', userEmail, 'hasServiceRoleKey:', !!serviceRoleKey, 'hasProviderToken:', !!providerToken)

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/5beb2915-5867-4232-9971-7d67e3e68583',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth/callback/route.ts:116',message:'Before token storage check',data:{hasUserId:!!userId,hasServiceRoleKey:!!serviceRoleKey,hasProviderToken:!!providerToken,willStore:!!(serviceRoleKey&&providerToken)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion

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
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/5beb2915-5867-4232-9971-7d67e3e68583',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth/callback/route.ts:140',message:'Token storage failed',data:{error:insertError.message,code:insertError.code,details:insertError.details},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'H2'})}).catch(()=>{});
          // #endregion
        } else {
          console.log('OAuth tokens stored successfully for user:', userId, 'provider:', provider)
        }
      } catch (tokenError) {
        console.error('Error in OAuth token storage:', tokenError)
      }
    } else if (!serviceRoleKey) {
      console.warn('SUPABASE_SERVICE_ROLE_KEY not set - skipping token storage')
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/5beb2915-5867-4232-9971-7d67e3e68583',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth/callback/route.ts:148',message:'Service role key missing',data:{hasProviderToken:!!providerToken},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
    } else if (!providerToken) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/5beb2915-5867-4232-9971-7d67e3e68583',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth/callback/route.ts:152',message:'Provider token missing from session',data:{hasServiceRoleKey:!!serviceRoleKey,userId,userEmail},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
    }
    
    // Verify OAuth scopes after token storage
    // If missing scopes, redirect to missing-permissions page
    // Now uses GET API tests for Calendar/Tasks (more reliable than tokeninfo alone)
    if (providerToken && provider === 'google' && userId) {
      try {
        const verifyResponse = await fetch(`${appUrl}/api/auth/verify-scopes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ access_token: providerToken })
        })
        
        if (verifyResponse.ok) {
          const verifyData = await verifyResponse.json()
          const { hasAllScopes, missingScopes, scopeTestResults } = verifyData
          
          console.log('🔍 Scope verification results:', {
            hasAllScopes,
            missingScopes,
            scopeTestResults
          })
          
          // Only redirect if we have clear evidence of missing scopes
          // AND the verification didn't fail completely (hasAllScopes is explicitly false, not undefined)
          if (hasAllScopes === false && missingScopes && missingScopes.length > 0) {
            console.log('⚠️ Missing OAuth scopes detected:', missingScopes)
            const missingParam = encodeURIComponent(missingScopes.join(','))
            return NextResponse.redirect(new URL(`/auth/missing-permissions?missing=${missingParam}`, appUrl))
          }
        } else {
          // If verification endpoint fails, fail open - continue with normal flow
          console.warn('⚠️ Scope verification endpoint returned error, continuing with flow')
        }
      } catch (scopeError) {
        // Fail open - if scope verification fails, continue with normal flow
        // This prevents blocking legitimate users due to verification errors
        console.warn('⚠️ Scope verification failed, continuing with flow:', scopeError)
      }
    }
    
    // ALWAYS trigger n8n onboarding workflow (moved outside serviceRoleKey check)
    // This ensures user status is updated from needs_reauth to active
    const n8nWebhookUrl = process.env.N8N_ONBOARDING_WEBHOOK_URL || 
      'https://chungxchung.app.n8n.cloud/webhook/parallelized-supabase-oauth'
    
    console.log('📞 Triggering n8n webhook for user:', userId, 'email:', userEmail, 'webhook:', n8nWebhookUrl)
    
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
          fullName: userFullName,
        }),
      })
      
      const responseText = await webhookResponse.text()
      if (!webhookResponse.ok) {
        console.error('❌ n8n webhook returned error status:', webhookResponse.status, 'response:', responseText)
      } else {
        console.log('✅ n8n onboarding webhook triggered successfully for user:', userId, 'response:', responseText.substring(0, 200))
      }
    } catch (webhookError) {
      console.error('❌ Error calling n8n onboarding webhook:', webhookError)
    }
  } else {
    console.error('❌ No userId - cannot trigger webhook!')
  }

  // URL to redirect to after sign in process completes
  const response = NextResponse.redirect(new URL(next, appUrl))
  
  // CRITICAL: Prevent Railway from caching OAuth responses
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0')
  response.headers.set('Pragma', 'no-cache')
  response.headers.set('Expires', '0')
  
  return response
}

