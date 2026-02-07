import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { getCookieOptions } from '@/lib/cookie-utils'

export const dynamic = 'force-dynamic'

/**
 * API endpoint to handle Unipile OAuth callback
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const sessionId = searchParams.get('session_id') || searchParams.get('session')
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://bippity.boo'
  const cookieStore = cookies()

  console.log('🛑 CALLBACK HIT - STARTING EXECUTION', { sessionId, appUrl })

  if (!sessionId) {
    console.error('❌ Missing session_id')
    return NextResponse.redirect(new URL('/?error=missing_session', appUrl))
  }

  // --- 1. ROBUST ENV PARSING ---
  let unipileDsn = process.env.UNIPILE_DSN?.trim() || ''
  if (unipileDsn.startsWith('"') && unipileDsn.endsWith('"')) unipileDsn = unipileDsn.slice(1, -1)
  if (unipileDsn.startsWith("'") && unipileDsn.endsWith("'")) unipileDsn = unipileDsn.slice(1, -1)
  if (unipileDsn && !unipileDsn.startsWith('http')) unipileDsn = `https://${unipileDsn}`

  let unipileApiKey = process.env.UNIPILE_API_KEY?.trim() || ''
  if (unipileApiKey.startsWith('"') && unipileApiKey.endsWith('"')) unipileApiKey = unipileApiKey.slice(1, -1)
  if (unipileApiKey.startsWith("'") && unipileApiKey.endsWith("'")) unipileApiKey = unipileApiKey.slice(1, -1)

  console.log('🔧 Config loaded:', {
    dsn: unipileDsn,
    hasKey: !!unipileApiKey,
    appUrl
  })

  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // --- 0. CHECK FOR EXISTING SESSION ---
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            // We don't need to set cookies here in the callback logic usually, 
            // but it's required for the interface.
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // ignored
            }
          },
        },
      }
    )
    const { data: { user: sessionUser } } = await supabase.auth.getUser()

    if (sessionUser) {
      console.log('👤 Found logged-in session user:', sessionUser.id)
    } else {
      console.log('👤 No active session found.')
    }

    // --- 2. GET ACCOUNT ID (Prefer URL Param) ---
    // Fast path: Unipile sends account_id in URL
    let accountId = searchParams.get('account_id')

    // Fallback: DB lookup (Only if not in URL)
    if (!accountId) {
      console.log('⚠️ No account_id in URL, checking DB...')
      const { data } = await supabaseAdmin
        .from('oauth_tokens')
        .select('unipile_account_id')
        .eq('provider', 'unipile')
        // We can't query UUID col with loose text. 
        // This fallback is brittle on localhost. Skipping complex retry logic for clarity.
        .limit(1)
        .maybeSingle()

      if (data?.unipile_account_id) accountId = data.unipile_account_id
    }

    if (!accountId) {
      console.error('❌ No account_id found. Redirecting to summary to poll.')
      const res = NextResponse.redirect(new URL(`/whatwefound?session=${sessionId}`, appUrl))
      res.cookies.set('unipile_pending_session', sessionId, getCookieOptions({ maxAge: 1800 }))
      return res
    }

    console.log('✅ Account ID obtained:', accountId)

    // --- 3. FETCH EMAIL FROM UNIPILE ---
    let accountEmail: string | null = null

    // Method A: Accounts Endpoint
    try {
      const resp = await fetch(`${unipileDsn}/api/v1/accounts/${accountId}`, {
        headers: { 'X-API-KEY': unipileApiKey }
      })
      if (resp.ok) {
        const data = await resp.json()
        accountEmail = data.email || data.provider_email || data.provider?.email
        console.log('📧 Email from Account API:', accountEmail)
      } else {
        console.error('❌ Account API failed:', resp.status, await resp.text())
      }
    } catch (e) { console.error('❌ Account API Exception:', e) }

    // Method B: Messages Endpoint (Fallback)
    if (!accountEmail) {
      try {
        const resp = await fetch(`${unipileDsn}/api/v1/accounts/${accountId}/messages?limit=1`, {
          headers: { 'X-API-KEY': unipileApiKey }
        })
        if (resp.ok) {
          const data = await resp.json()
          const msg = data.data?.[0]
          accountEmail = msg?.from?.email || msg?.sender_email
          console.log('📧 Email from Messages API:', accountEmail)
        }
      } catch (e) { console.error('❌ Messages API Exception:', e) }
    }

    // --- 4. HANDLE USER CREATION / RESOLUTION ---
    let user = sessionUser

    // If no session user, try to find by email
    if (!user && accountEmail) {
      const { data: { users } } = await supabaseAdmin.auth.admin.listUsers()
      user = users.find(u => u.email?.toLowerCase() === accountEmail?.toLowerCase()) || null

      if (user) console.log('👤 Found existing user by email:', user.id)
    }

    // If still no user, Create them
    if (!user && accountEmail) {
      console.log('🆕 Creating new user:', accountEmail)
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email: accountEmail,
        email_confirm: true,
        user_metadata: { full_name: accountEmail.split('@')[0] }
      })

      if (error) {
        console.error('❌ Create User Error:', error)
        return NextResponse.redirect(new URL('/?error=signup_failed', appUrl))
      }
      user = data.user
    }

    // If we failed to get an email AND we don't have a user, we trigger the Manual Fallback Flow
    if (!user && !accountEmail) {
      console.warn('⚠️ Email missing from Unipile and no session. Triggering manual entry fallback.')

      const response = NextResponse.redirect(
        new URL(`/whatwefound?session=${sessionId}&missing_email=true`, appUrl)
      )

      // Store the Account ID securely so we can link it after user provides email
      response.cookies.set('unipile_temp_account', accountId, getCookieOptions({
        maxAge: 3600 // 1 hour
      }))

      return response
    }

    // Safety check - we should have a user here
    if (!user) {
      // This theoretically shouldn't happen due to the block above, but typescript needs assurance
      // or logic might fall through if accountEmail exists but user creation failed (handled above)
      console.error('❌ User resolution failed unexpectedly.')
      return NextResponse.redirect(new URL('/?error=user_resolution_failed', appUrl))
    }

    // --- 5. SYNC TO PUBLIC.USERS TABLE ---
    console.log('💾 Syncing to public.users table...')

    // Prepare update data
    const updateData: any = {
      unipile_account_id: accountId,
      unipile_linked: true, // EXPLICITLY SET TO TRUE as requested
      updated_at: new Date().toISOString()
    }

    // If we have an email, ensure it's synced
    if (user.email) updateData.email = user.email
    if (user.user_metadata?.full_name) updateData.full_name = user.user_metadata.full_name

    // Only set defaults if creating new record (upsert handles logic, but let's be safe)
    // We can just rely on upsert to merge.
    updateData.subscription_status = 'active'
    updateData.subscription_tier = 'free'

    const { error: publicProfileError } = await supabaseAdmin
      .from('users')
      .upsert({
        id: user.id,
        ...updateData
      }, { onConflict: 'email' })

    if (publicProfileError) console.error('❌ Public Profile Sync Error:', publicProfileError)
    else console.log('✅ Public Profile Synced with unipile_linked=true')

    // --- 6. STORE TOKENS ---
    console.log('🔑 Storing OAuth Tokens...')
    await supabaseAdmin
      .from('oauth_tokens')
      .upsert({
        user_id: user.id,
        provider: 'unipile',
        unipile_account_id: accountId,
        provider_email: accountEmail || user.email, // Use user email if accountEmail is null
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id,provider' })

    // --- 7. CREATE SESSION MAPPING ---
    console.log('🗺️ Creating Session Map...', sessionId, '->', user.id)
    try {
      const { error: mapError } = await supabaseAdmin
        .from('oauth_tokens')
        .upsert({
          user_id: user.id, // Must be real user ID
          provider: 'session_map',
          unipile_account_id: sessionId, // Store session ID here for lookup
          provider_email: user.email,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id,provider' })

      if (mapError) {
        console.error('❌ CRITICAL: Session Map Error:', mapError)
      } else {
        console.log('✅ Session Map Created Successfully')
      }
    } catch (dbErr) {
      console.error('❌ CRITICAL: DB Exception during Map:', dbErr)
    }

    // Clean up temporary pending records if any
    try {
      await supabaseAdmin.from('oauth_tokens').delete().eq('user_id', `pending_${sessionId}`).eq('provider', 'unipile')
    } catch (e) { }

    // --- 8. DETERMINE REDIRECT ---
    console.log('🤔 Determining redirect destination...')
    let destination = `/whatwefound?session=${sessionId}`

    try {
      // Check if user has completed onboarding
      const { data: summary } = await supabaseAdmin
        .from('onboarding_summaries')
        .select('status')
        .eq('user_id', user.id)
        .single()

      if (summary && ['completed', 'reviewed'].includes(summary.status)) {
        console.log('✅ User has completed onboarding. Redirecting to Dashboard.')
        destination = '/dashboard'
      } else {
        console.log('⏳ Onboarding not complete (Status: ' + (summary?.status || 'none') + '). Redirecting to WhatWeFound.')
        // Redirect to /whatwefound
        // Ensure we DO NOT pass missing_email since the user is resolved and linked
      }
    } catch (checkErr) {
      console.warn('⚠️ Error checking onboarding status:', checkErr)
    }

    console.log('🚀 Redirecting to:', destination)
    const response = NextResponse.redirect(new URL(destination, appUrl))

    // Clear temp cookies
    response.cookies.set('unipile_session_id', '', getCookieOptions({ maxAge: 0 }))
    return response

  } catch (error) {
    console.error('💥 Fatal Callback Error:', error)
    return NextResponse.redirect(new URL(`/?error=fatal_callback&msg=${String(error)}`, appUrl))
  }
}
