/**
 * Shared cookie utilities for consistent cookie handling across the app
 * 
 * Ensures all cookies use the correct domain for cross-subdomain compatibility
 */

import type { ResponseCookie } from 'next/dist/compiled/@edge-runtime/cookies'

// Get cookie domain from environment or derive from app URL
function getCookieDomain(): string | undefined {
  // In development, don't set a domain (allows localhost to work)
  if (process.env.NODE_ENV !== 'production') {
    return undefined
  }

  // Allow explicit override via COOKIE_DOMAIN env var
  if (process.env.COOKIE_DOMAIN) {
    return process.env.COOKIE_DOMAIN
  }

  // Try to derive from NEXT_PUBLIC_APP_URL
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  if (appUrl) {
    try {
      const url = new URL(appUrl)
      // For Vercel deployments, don't set domain to allow cookies to work on the exact host
      if (url.hostname.includes('vercel.app')) {
        return undefined
      }
      // For custom domains, use the root domain with leading dot
      const parts = url.hostname.split('.')
      if (parts.length >= 2) {
        return '.' + parts.slice(-2).join('.')
      }
    } catch {
      // Invalid URL, skip domain setting
    }
  }

  // Default fallback for bippity.boo
  return '.bippity.boo'
}

export const COOKIE_DOMAIN = getCookieDomain()

export function getCookieOptions(overrides?: Partial<ResponseCookie>): Partial<ResponseCookie> {
  const options: Partial<ResponseCookie> = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    ...overrides
  }

  // Only add domain if it's set (production with custom domain)
  if (COOKIE_DOMAIN) {
    options.domain = COOKIE_DOMAIN
  }

  return options
}
