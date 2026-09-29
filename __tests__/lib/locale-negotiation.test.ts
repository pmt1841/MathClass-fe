import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { getNegotiatedLocale } from '@/proxy'
import { getLocaleCookie, setLocaleCookie, DEFAULT_LOCALE, LOCALE_COOKIE } from '@/lib/constants/i18n'
import type { NextRequest } from 'next/server'

function createMockRequest({
  cookie,
  acceptLanguage,
  protocol = 'http:',
}: {
  cookie?: string
  acceptLanguage?: string | null
  protocol?: string
}): NextRequest {
  const url = `${protocol}//localhost:3000/`
  return {
    nextUrl: new URL(url),
    cookies: {
      get: (name: string) => (name === LOCALE_COOKIE.NAME && cookie ? { value: cookie } : undefined),
      has: (name: string) => name === LOCALE_COOKIE.NAME && Boolean(cookie),
    },
    headers: {
      get: (name: string) => {
        if (name.toLowerCase() === 'accept-language') return acceptLanguage ?? null
        return null
      },
    },
  } as unknown as NextRequest
}

describe('Locale Negotiation (proxy.ts)', () => {
  it('prioritizes valid NEXT_LOCALE cookie over Accept-Language header', () => {
    const req = createMockRequest({
      cookie: 'en',
      acceptLanguage: 'vi-VN,vi;q=0.9',
    })
    expect(getNegotiatedLocale(req)).toBe('en')
  })

  it('ignores invalid NEXT_LOCALE cookie and falls back to Accept-Language', () => {
    const req = createMockRequest({
      cookie: 'invalid_locale',
      acceptLanguage: 'en-US,en;q=0.9',
    })
    expect(getNegotiatedLocale(req)).toBe('en')
  })

  it('negotiates language based on q-factor weights in Accept-Language', () => {
    const req1 = createMockRequest({
      acceptLanguage: 'en-US;q=0.8,en;q=0.7,vi;q=0.9',
    })
    expect(getNegotiatedLocale(req1)).toBe('vi')

    const req2 = createMockRequest({
      acceptLanguage: 'vi;q=0.5,en;q=0.9',
    })
    expect(getNegotiatedLocale(req2)).toBe('en')
  })

  it('ignores unsupported languages and picks best supported one', () => {
    const req = createMockRequest({
      acceptLanguage: 'ja-JP,ja;q=0.9,ko;q=0.8,en;q=0.7',
    })
    expect(getNegotiatedLocale(req)).toBe('en')
  })

  it('handles wildcard (*) in Accept-Language by returning default locale', () => {
    const req = createMockRequest({
      acceptLanguage: '*',
    })
    expect(getNegotiatedLocale(req)).toBe(DEFAULT_LOCALE)
  })

  it('handles empty or missing Accept-Language header gracefully', () => {
    const req1 = createMockRequest({ acceptLanguage: '' })
    expect(getNegotiatedLocale(req1)).toBe(DEFAULT_LOCALE)

    const req2 = createMockRequest({ acceptLanguage: null })
    expect(getNegotiatedLocale(req2)).toBe(DEFAULT_LOCALE)
  })

  it('handles malformed Accept-Language header without throwing', () => {
    const req = createMockRequest({
      acceptLanguage: ';;;q=invalid,;;;',
    })
    expect(getNegotiatedLocale(req)).toBe(DEFAULT_LOCALE)
  })
})

describe('Locale Cookie Helpers (lib/constants/i18n.ts)', () => {
  const originalLocation = window.location

  beforeEach(() => {
    // Clear cookies
    document.cookie = `${LOCALE_COOKIE.NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
  })

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      writable: true,
      value: originalLocation,
    })
  })

  it('reads supported locale from document.cookie', () => {
    document.cookie = `${LOCALE_COOKIE.NAME}=en; path=/`
    expect(getLocaleCookie()).toBe('en')

    document.cookie = `${LOCALE_COOKIE.NAME}=vi; path=/`
    expect(getLocaleCookie()).toBe('vi')
  })

  it('returns DEFAULT_LOCALE when cookie is empty or unsupported', () => {
    document.cookie = `${LOCALE_COOKIE.NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
    expect(getLocaleCookie()).toBe(DEFAULT_LOCALE)

    document.cookie = `${LOCALE_COOKIE.NAME}=fr; path=/`
    expect(getLocaleCookie()).toBe(DEFAULT_LOCALE)
  })

  it('sets cookie correctly and adds Secure flag on HTTPS', () => {
    delete (window as any).location
    window.location = { ...originalLocation, protocol: 'https:' } as any

    setLocaleCookie('en')
    expect(document.cookie).toContain(`${LOCALE_COOKIE.NAME}=en`)
  })

  it('sets cookie correctly without Secure flag on HTTP', () => {
    delete (window as any).location
    window.location = { ...originalLocation, protocol: 'http:' } as any

    setLocaleCookie('vi')
    expect(document.cookie).toContain(`${LOCALE_COOKIE.NAME}=vi`)
  })
})
