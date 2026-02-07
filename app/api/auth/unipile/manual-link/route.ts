
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { getCookieOptions } from '@/lib/cookie-utils'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
    try {
        const { email, sessionId } = await request.json()
        const unipileAccountId = request.cookies.get('unipile_temp_account')?.value

        if (!email || !sessionId || !unipileAccountId) {
            console.error('❌ Manual Link Missing Fields:', {
                hasEmail: !!email,
                hasSession: !!sessionId,
                hasCookie: !!unipileAccountId,
                cookieName: 'unipile_temp_account'
            })
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // Initialize Supabase Admin
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        // 1. Check/Create User
        console.log('📝 Manual Link: Processing user:', email)
        const { data: { users } } = await supabaseAdmin.auth.admin.listUsers()
        let user = users.find(u => u.email?.toLowerCase() === email.toLowerCase())

        if (!user) {
            console.log('🆕 Creating new user (manual):', email)
            const { data, error } = await supabaseAdmin.auth.admin.createUser({
                email: email,
                email_confirm: true,
                user_metadata: { full_name: email.split('@')[0] }
            })

            if (error) {
                console.error('❌ Manual Create User Error:', error)
                return NextResponse.json({ error: error.message }, { status: 500 })
            }
            user = data.user
        }

        if (!user) throw new Error('Failed to resolve user')

        // 2. Sync to public.users
        await supabaseAdmin
            .from('users')
            .upsert({
                id: user.id,
                email: user.email,
                full_name: user.user_metadata?.full_name || email.split('@')[0],
                avatar_url: user.user_metadata?.avatar_url,
                unipile_account_id: unipileAccountId,
                updated_at: new Date().toISOString()
            }, { onConflict: 'email' })

        // 3. Create Session Map (CRITICAL)
        console.log('🗺️ Creating Session Map (Manual)...', sessionId, '->', user.id)
        const { error: mapError } = await supabaseAdmin
            .from('oauth_tokens')
            .upsert({
                user_id: user.id, // Real User ID
                provider: 'session_map',
                unipile_account_id: sessionId, // Session ID
                provider_email: user.email,
                access_token: 'session_map_placeholder', // Required by DB Not-Null constraint
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id,provider' })

        if (mapError) {
            console.error('❌ Session Map Error:', mapError)
            return NextResponse.json({ error: 'DB Map Error' }, { status: 500 })
        }

        // 4. Create Token Record (Optional but good)
        await supabaseAdmin
            .from('oauth_tokens')
            .upsert({
                user_id: user.id,
                provider: 'unipile',
                unipile_account_id: unipileAccountId,
                provider_email: user.email,
                access_token: 'manual_link_placeholder', // Required by DB Not-Null constraint
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id,provider' })

        const response = NextResponse.json({ success: true })

        // Clear temp cookie
        response.cookies.set('unipile_temp_account', '', getCookieOptions({ maxAge: 0 }))

        return response

    } catch (error) {
        console.error('Manual Link Exception:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
