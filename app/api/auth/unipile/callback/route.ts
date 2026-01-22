import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

/**
 * API endpoint to handle Unipile OAuth callback
 * 
 * After successful authentication, Unipile redirects here with account_id and email.
 * We store the account_id in oauth_tokens table and trigger the onboarding workflow.
 * 
 * GET /api/auth/unipile/callback?account_id={id}&email={email}
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  // Handle both 'session_id' and 'session' parameters (Unipile might use either)
  const sessionId = searchParams.get('session_id') || searchParams.get('session')
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://bippity.boo'

  console.log('🔐 Unipile callback received:', {
    sessionId: sessionId,
    url: request.url,
    allParams: Object.fromEntries(searchParams.entries()),
    headers: Object.fromEntries(request.headers.entries())
  })

  if (!sessionId) {
    console.error('❌ Missing session_id in callback URL. Full URL:', request.url)
    console.error('❌ All search params:', Object.fromEntries(searchParams.entries()))
    // Try to get session_id from cookie as fallback
    const cookieSessionId = request.cookies.get('unipile_session_id')?.value
    if (cookieSessionId) {
      console.log('✅ Found session_id in cookie:', cookieSessionId)
      // Continue with cookie session_id
      const response = NextResponse.redirect(new URL(`/api/auth/unipile/callback?session_id=${cookieSessionId}`, appUrl))
      response.cookies.delete('unipile_session_id')
      return response
    }
    return NextResponse.redirect(new URL('/?error=missing_session', appUrl))
  }

  try {
    // Get current user session from Supabase
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
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options)
              })
            } catch {
              // Ignore errors in Server Component context
            }
          },
        },
      }
    )

    // Store Unipile account_id in oauth_tokens table using service role
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!serviceRoleKey) {
      console.error('❌ SUPABASE_SERVICE_ROLE_KEY not configured')
      return NextResponse.redirect(new URL('/?error=config_error', appUrl))
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey
    )

    // Look up account_id from the webhook data using session_id
    // The webhook may not have fired yet, so we'll retry a few times
    let accountId: string | null = null
    let retries = 0
    const maxRetries = 5
    
    while (!accountId && retries < maxRetries) {
      const { data: pendingToken, error: lookupError } = await supabaseAdmin
        .from('oauth_tokens')
        .select('unipile_account_id')
        .eq('user_id', `pending_${sessionId}`)
        .eq('provider', 'unipile')
        .single()

      if (!lookupError && pendingToken && pendingToken.unipile_account_id) {
        accountId = pendingToken.unipile_account_id
        break
      }

      // Wait a bit before retrying (webhook might be delayed)
      if (retries < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000)) // Wait 1 second
        retries++
      } else {
        console.error('❌ Could not find account_id for session after retries:', sessionId)
        console.error('❌ Check if webhook was received at /api/webhooks/unipile/account')
        console.error('❌ Check oauth_tokens table for user_id = pending_' + sessionId)
        // Redirect to whatwefound anyway - the page can poll for account status
        // Store session_id in cookie so whatwefound can check later
        const response = NextResponse.redirect(new URL(`/whatwefound?session=${sessionId}`, appUrl))
        response.cookies.set('unipile_pending_session', sessionId, {
          httpOnly: true,
          secure: true,
          sameSite: 'lax',
          maxAge: 60 * 30 // 30 minutes
        })
        return response
      }
    }

    if (!accountId) {
      console.error('❌ Could not find account_id for session:', sessionId)
      console.error('❌ This usually means the webhook has not fired yet or failed')
      // Redirect to whatwefound anyway - the page can poll for account status
      const response = NextResponse.redirect(new URL(`/whatwefound?session=${sessionId}`, appUrl))
      response.cookies.set('unipile_pending_session', sessionId, {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        maxAge: 60 * 30 // 30 minutes
      })
      return response
    }
    
    console.log('✅ Found account_id:', accountId, 'for session:', sessionId)

    // Get account email from Unipile API
    let accountEmail: string | null = null
    try {
      const unipileDsn = process.env.UNIPILE_DSN
      const unipileApiKey = process.env.UNIPILE_API_KEY
      
      if (unipileDsn && unipileApiKey) {
        const accountResponse = await fetch(`${unipileDsn}/api/v1/accounts/${accountId}`, {
          headers: {
            'X-API-KEY': unipileApiKey
          }
        })
        
        if (accountResponse.ok) {
          const accountData = await accountResponse.json()
          accountEmail = accountData.email || accountData.provider_email || null
        }
      }
    } catch (error) {
      console.warn('Could not fetch account email from Unipile:', error)
    }

    // Check for existing user first (before trying to use user.email in fallback)
    let user = null
    const { data: { user: existingUser }, error: authError } = await supabase.auth.getUser()

    if (existingUser) {
      user = existingUser
      console.log('✅ Authenticated user found:', user.id, 'email:', user.email)
    }

    // If we still don't have an email, try to get it from existing user or use placeholder
    if (!accountEmail) {
      console.warn('⚠️ Could not get email from Unipile account, will try to continue')
      // Try to get email from existing user or use a placeholder
      accountEmail = user?.email || `user_${accountId.substring(0, 8)}@unipile.temp`
    }

    // Now that we have the email, create user if needed
    if (!user) {
      // No existing Supabase session - create a new user account using Admin API
      // This handles the case where users come directly from Unipile OAuth
      console.log('📝 No existing session - creating new Supabase user with email:', accountEmail)
      
      // Use Admin API to create a confirmed user (bypasses email confirmation requirement)
      const { data: newUserData, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
        email: accountEmail,
        email_confirm: true, // Auto-confirm email so user can sign in immediately
        user_metadata: {
          full_name: accountEmail.split('@')[0],
          provider: 'unipile'
        },
        app_metadata: {
          provider: 'unipile'
        }
      })
      
      if (createUserError || !newUserData.user) {
        console.error('❌ Failed to create Supabase user:', createUserError)
        return NextResponse.redirect(new URL('/login?error=signup_failed', appUrl))
      }
      
      user = newUserData.user
      console.log('✅ Created new Supabase user via Admin API:', user.id)
      
      // Create a temporary password and sign the user in
      // This establishes a valid session immediately
      const tempPassword = crypto.randomUUID()
      try {
        // Update user with temporary password using Admin API
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
          user.id,
          { password: tempPassword }
        )
        
        if (updateError) {
          console.warn('⚠️ Could not set temporary password:', updateError)
        } else {
          // Sign in with the temporary password
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: accountEmail,
            password: tempPassword
          })
          
          if (signInError) {
            console.warn('⚠️ Could not sign in with temporary password:', signInError)
          } else if (signInData?.session) {
            console.log('✅ User signed in with temporary password')
            // Session cookie is set automatically
            // Note: User should change password later, but for now they have a valid session
          }
        }
      } catch (error) {
        console.warn('⚠️ Error creating session for new user:', error)
        // User is created, but no session - they'll need to sign in manually
      }
    }

    // Update oauth_tokens with real user_id (replacing the pending one)
    const { error: deleteError } = await supabaseAdmin
      .from('oauth_tokens')
      .delete()
      .eq('user_id', `pending_${sessionId}`)
      .eq('provider', 'unipile')

    // Store Unipile account credentials with real user_id
    const { error: upsertError } = await supabaseAdmin
      .from('oauth_tokens')
      .upsert({
        user_id: user.id,
        provider: 'unipile',
        unipile_account_id: accountId,
        provider_email: accountEmail || user.email || null,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,provider'
      })

    if (upsertError) {
      console.error('❌ Error storing Unipile account_id:', upsertError)
      return NextResponse.redirect(new URL('/?error=storage_error', appUrl))
    }

    console.log('✅ Unipile account_id stored for user:', user.id, 'account:', accountId)

    // Trigger n8n onboarding workflow
    const webhookUrl = process.env.N8N_UNIPILE_ONBOARDING_WEBHOOK_URL

    if (webhookUrl) {
      try {
        // Workflow expects payload nested under 'body' key
        const webhookPayload = {
          body: {
            userId: user.id,
            email: user.email,
            fullName: user.user_metadata?.full_name || user.email?.split('@')[0]
          }
        }

        console.log('📞 Triggering n8n webhook:', webhookUrl)
        console.log('📞 Payload:', webhookPayload)

        const webhookResponse = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(webhookPayload),
        })

        if (!webhookResponse.ok) {
          console.error('❌ n8n webhook returned error:', webhookResponse.status, await webhookResponse.text())
        } else {
          console.log('✅ n8n onboarding workflow triggered successfully')
        }
      } catch (webhookError) {
        console.error('❌ Error calling n8n webhook:', webhookError)
        // Don't fail the flow - user can still use the app
      }
    } else {
      console.warn('⚠️ N8N_UNIPILE_ONBOARDING_WEBHOOK_URL not configured - skipping workflow trigger')
    }

    // Clean up session cookie
    const response = NextResponse.redirect(new URL('/whatwefound', appUrl))
    response.cookies.delete('unipile_session_id')
    
    // Prevent caching
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    
    console.log('✅ Redirecting to /whatwefound for user:', user.id)
    
    return response

  } catch (error) {
    console.error('❌ Error in Unipile callback:', error)
    // Even on error, redirect to whatwefound - better UX than landing page
    // The page can show a loading state and handle errors gracefully
    const sessionId = new URL(request.url).searchParams.get('session_id')
    const response = NextResponse.redirect(new URL(`/whatwefound?error=callback_error${sessionId ? `&session=${sessionId}` : ''}`, appUrl))
    if (sessionId) {
      response.cookies.set('unipile_pending_session', sessionId, {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        maxAge: 60 * 30 // 30 minutes
      })
    }
    return response
  }
}
