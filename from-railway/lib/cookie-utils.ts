/**
 * Shared cookie utilities for consistent cookie handling across the app
 * 
 * Ensures all cookies use the same domain (.bippity.boo) for cross-subdomain compatibility
 */

import type { ResponseCookie } from 'next/dist/compiled/@edge-runtime/cookies'

export const COOKIE_DOMAIN = '.bippity.boo'

export function getCookieOptions(overrides?: Partial<ResponseCookie>): Partial<ResponseCookie> {
  return {
    domain: COOKIE_DOMAIN,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    ...overrides
  }
}
