import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const response = NextResponse.next()

  // Allow cross-origin popup communication for Nango callback
  if (request.nextUrl.pathname === '/nango-callback') {
    response.headers.set('Cross-Origin-Opener-Policy', 'same-origin-allow-popups')
    response.headers.set('Cross-Origin-Embedder-Policy', 'unsafe-none')
  }

  return response
}

export const config = {
  matcher: '/nango-callback',
}

