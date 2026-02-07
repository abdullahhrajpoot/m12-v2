import { createServerClient } from '@supabase/ssr'
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
  await supabase.auth.getUser()

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
