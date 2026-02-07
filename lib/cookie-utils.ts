/**
 * Shared cookie utilities for consistent cookie handling across the app
 * 
 * Ensures all cookies use the same domain (.bippity.boo) for cross-subdomain compatibility
 */

import type { ResponseCookie } from 'next/dist/compiled/@edge-runtime/cookies'

export const COOKIE_DOMAIN = process.env.NODE_ENV === 'production' ? '.bippity.boo' : undefined

export function getCookieOptions(overrides?: Partial<ResponseCookie>): Partial<ResponseCookie> {
  const options: Partial<ResponseCookie> = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    ...overrides
  }

  // Only add domain if it's set (production)
  if (COOKIE_DOMAIN) {
    options.domain = COOKIE_DOMAIN
  }

  return options
}
