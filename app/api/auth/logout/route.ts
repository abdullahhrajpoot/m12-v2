import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

/**
 * Logout endpoint that properly cleans up:
 * 1. Supabase Auth session
 * 2. OAuth tokens from oauth_tokens table
 * 
 * This ensures when user re-authenticates, they get completely fresh tokens
 */
export async function POST(request: Request) {
  try {
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
              // Ignore errors from Server Components
            }
          },
        },
      }
    )

    // Get current user before signing out
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      console.log('🚪 Logging out user:', user.id, user.email)
      
      // Delete OAuth tokens from database using service role
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
      if (serviceRoleKey) {
        const supabaseAdmin = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          serviceRoleKey
        )
        
        const { error: deleteError } = await supabaseAdmin
          .from('oauth_tokens')
          .delete()
          .eq('user_id', user.id)
        
        if (deleteError) {
          console.error('Error deleting OAuth tokens:', deleteError)
        } else {
          console.log('✅ OAuth tokens deleted for user:', user.id)
        }
      }
    }

    // Sign out from Supabase Auth
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      console.error('Error signing out:', error)
      return NextResponse.json(
        { error: 'Failed to sign out' },
        { status: 500 }
      )
    }

    console.log('✅ User signed out successfully')
    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
