import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { getCookieOptions } from '@/lib/cookie-utils'
import { ensureFamilyMembership } from '@/lib/family'

export const dynamic = 'force-dynamic'

/**
 * API endpoint to handle Unipile OAuth callback
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const sessionId = searchParams.get('session_id') || searchParams.get('session')
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://bippity.boo'

  console.log('🛑 CALLBACK HIT - STARTING EXECUTION', { sessionId, appUrl })

  if (!sessionId) {
    console.error('❌ Missing session_id')
    return NextResponse.redirect(new URL('/?error=missing_session', appUrl))
  }

  // --- 1. ROBUST ENV PARSING ---
  // We manually clean these to handle "quoted" values in .env files
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

    // --- 4. HANDLE USER CREATION ---
    let user = null

    // First, check if user exists in Supabase (Auth)
    if (accountEmail) {
      // Try to find by email
      const { data: { users } } = await supabaseAdmin.auth.admin.listUsers()
      user = users.find(u => u.email?.toLowerCase() === accountEmail?.toLowerCase())

      if (user) console.log('👤 Found existing user:', user.id)
    }

    // If new user, Create them
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

    // If we failed to get an email, we trigger the Manual Fallback Flow
    if (!user && !accountEmail) {
      console.warn('⚠️ Email missing from Unipile. Triggering manual entry fallback.')

      const response = NextResponse.redirect(
        new URL(`/whatwefound?session=${sessionId}&missing_email=true`, appUrl)
      )

      // Store the Account ID securely so we can link it after user provides email
      response.cookies.set('unipile_temp_account', accountId, getCookieOptions({
        maxAge: 3600 // 1 hour
      }))

      return response
    }

    // At this point, user must exist (either found or created)
    if (!user) {
      console.error('❌ User is null after creation logic - this should not happen')
      return NextResponse.redirect(new URL('/?error=user_creation_failed', appUrl))
    }

    // --- 5. SYNC TO PUBLIC.USERS TABLE (User Request) ---
    console.log('💾 Syncing to public.users table...')
    const { error: publicProfileError } = await supabaseAdmin
      .from('users')
      .upsert({
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name,
        unipile_account_id: accountId,
        updated_at: new Date().toISOString(),
        subscription_status: 'active', // Default to active for new signups?
        subscription_tier: 'free'
      }, { onConflict: 'email' })

    if (publicProfileError) console.error('❌ Public Profile Sync Error:', publicProfileError)
    else console.log('✅ Public Profile Synced')

    // --- 6. STORE TOKENS ---
    console.log('🔑 Storing OAuth Tokens...')
    await supabaseAdmin
      .from('oauth_tokens')
      .upsert({
        user_id: user.id,
        provider: 'unipile',
        unipile_account_id: accountId,
        provider_email: user.email,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id,provider' })

    // --- 7. CREATE SESSION MAPPING ---
    // We store the Real User ID in 'user_id' (to satisfy FK constraint)
    // And store the Session ID in 'unipile_account_id' (text field)
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

    // --- 8. FINALIZE ---
    // --- 9. DETERMINE REDIRECT ---
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
      }
    } catch (checkErr) {
      console.warn('⚠️ Error checking onboarding status:', checkErr)
    }

    console.log('🚀 Redirecting to:', destination)
    // IMPORTANT: Pass session ID so frontend knows what to poll if going to whatwefound
    const response = NextResponse.redirect(new URL(destination, appUrl))

    // Clear temp cookies
    response.cookies.set('unipile_session_id', '', getCookieOptions({ maxAge: 0 }))
    return response

  } catch (error) {
    console.error('💥 Fatal Callback Error:', error)
    return NextResponse.redirect(new URL(`/?error=fatal_callback&msg=${String(error)}`, appUrl))
  }
}
