import { createServerClient } from '@supabase/ssr'
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
    
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      console.error('Error exchanging code for session:', error)
      return NextResponse.redirect(new URL('/?error=auth_failed', appUrl))
    }
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(new URL(next, appUrl))
}

