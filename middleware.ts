import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Debug logging for auth callback
  if (request.nextUrl.pathname.startsWith('/auth/callback')) {
    console.log('MIDDLEWARE: /auth/callback hit', {
      pathname: request.nextUrl.pathname,
      searchParams: request.nextUrl.searchParams.toString(),
      hasCode: request.nextUrl.searchParams.has('code'),
    })
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          // Set cookies for root domain to work across subdomains
          const cookieOptions = {
            ...options,
            domain: '.bippity.boo', // Leading dot makes it work for all subdomains
          }
          request.cookies.set({
            name,
            value,
            ...cookieOptions,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...cookieOptions,
          })
        },
        remove(name: string, options: any) {
          // Remove cookies from root domain
          const cookieOptions = {
            ...options,
            domain: '.bippity.boo',
          }
          request.cookies.set({
            name,
            value: '',
            ...cookieOptions,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...cookieOptions,
          })
        },
      },
    }
  )

  // Refresh session if expired
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    // Check if user is on a protected route (dashboard or whatwefound)
    // We also want to intercept the login redirect which might go to dashboard
    const isDashboard = request.nextUrl.pathname.startsWith('/dashboard')
    const isWhatWeFound = request.nextUrl.pathname.startsWith('/whatwefound')

    if (isDashboard || isWhatWeFound) {
      // Use service role key to bypass RLS policies if available
      let userData = null

      if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
        const adminClient = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY,
          {
            auth: {
              persistSession: false,
              autoRefreshToken: false,
              detectSessionInUrl: false,
            }
          }
        )

        const { data } = await adminClient
          .from('users')
          .select('unipile_linked, unipile_account_id')
          .eq('id', user.id)
          .single()

        userData = data
      } else {
        // Fallback to user client if no service key (e.g. dev without env var)
        const { data } = await supabase
          .from('users')
          .select('unipile_linked, unipile_account_id')
          .eq('id', user.id)
          .single()
        userData = data
      }

      const isLinked = userData?.unipile_linked || !!userData?.unipile_account_id

      if (isLinked && isDashboard) {
        return NextResponse.redirect(new URL('/whatwefound', request.url))
      }

      if (!isLinked && isWhatWeFound) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api/auth/unipile (Unipile Callback/Connect/Status)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|api/auth/unipile|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
