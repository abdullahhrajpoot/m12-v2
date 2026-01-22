/**
 * Shared cookie utilities for consistent cookie handling across the app
 * 
 * Ensures all cookies use the same domain (.bippity.boo) for cross-subdomain compatibility
 */

export const COOKIE_DOMAIN = '.bippity.boo'

export interface CookieOptions {
  httpOnly?: boolean
  secure?: boolean
  sameSite?: 'strict' | 'lax' | 'none'
  maxAge?: number
  path?: string
}

export function getCookieOptions(overrides?: CookieOptions): CookieOptions {
  return {
    domain: COOKIE_DOMAIN,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    ...overrides
  }
}
