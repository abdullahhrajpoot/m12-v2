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
  const sessionId = searchParams.get('session_id')
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://bippity.boo'

  console.log('🔐 Unipile callback received:', {
    sessionId: sessionId,
    allParams: Object.fromEntries(searchParams.entries())
  })

  if (!sessionId) {
    console.error('❌ Missing session_id in callback')
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

    let user = null
    const { data: { user: existingUser }, error: authError } = await supabase.auth.getUser()

    if (existingUser) {
      user = existingUser
      console.log('✅ Authenticated user found:', user.id, 'email:', user.email)
    } else {
      // No existing Supabase session - create a new user account
      // This handles the case where users come directly from Unipile OAuth
      console.log('📝 No existing session - creating new Supabase user with email:', email)
      
      // Create a Supabase user via email (no password - they'll use Unipile OAuth)
      const { data: newUserData, error: signUpError } = await supabase.auth.signUp({
        email: email,
        password: crypto.randomUUID(), // Random password - user won't use it
        options: {
          data: {
            full_name: email.split('@')[0],
            provider: 'unipile'
          }
        }
      })
      
      if (signUpError || !newUserData.user) {
        console.error('❌ Failed to create Supabase user:', signUpError)
        return NextResponse.redirect(new URL('/login?error=signup_failed', appUrl))
      }
      
      user = newUserData.user
      console.log('✅ Created new Supabase user:', user.id)
    }

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
        return NextResponse.redirect(new URL('/?error=account_not_found', appUrl))
      }
    }

    if (!accountId) {
      console.error('❌ Could not find account_id for session:', sessionId)
      return NextResponse.redirect(new URL('/?error=account_not_found', appUrl))
    }

    // Get account email from Unipile API
    let accountEmail = user.email || null
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
          accountEmail = accountData.email || accountData.provider_email || user.email
        }
      }
    } catch (error) {
      console.warn('Could not fetch account email from Unipile:', error)
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
        provider_email: accountEmail,
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
        const webhookPayload = {
          userId: user.id,
          email: user.email,
          fullName: user.user_metadata?.full_name || user.email?.split('@')[0]
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

    // Redirect to whatwefound page (onboarding status page)
    const response = NextResponse.redirect(new URL('/whatwefound', appUrl))
    
    // Prevent caching
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    
    return response

  } catch (error) {
    console.error('❌ Error in Unipile callback:', error)
    return NextResponse.redirect(new URL('/?error=callback_error', appUrl))
  }
}
