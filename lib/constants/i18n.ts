export const SUPPORTED_LOCALES = ['vi', 'en'] as const;
export type SupportedLocale = typeof SUPPORTED_LOCALES[number];
export const DEFAULT_LOCALE: SupportedLocale = 'vi';

export const LOCALE_COOKIE = {
  NAME: 'NEXT_LOCALE',
  MAX_AGE: 31536000, // 1 year
  PATH: '/',
  SAME_SITE: 'Lax',
} as const;

/**
 * Set NEXT_LOCALE cookie with standard security attributes
 */
export function setLocaleCookie(locale: string): void {
  if (typeof window === 'undefined') return;
  const isSecure = window.location.protocol === 'https:';
  const secureFlag = isSecure ? '; Secure' : '';
  document.cookie = `${LOCALE_COOKIE.NAME}=${locale}; path=${LOCALE_COOKIE.PATH}; max-age=${LOCALE_COOKIE.MAX_AGE}; SameSite=${LOCALE_COOKIE.SAME_SITE}${secureFlag}`;
}

/**
 * Read and validate NEXT_LOCALE cookie on client side
 */
export function getLocaleCookie(): SupportedLocale {
  if (typeof window === 'undefined') return DEFAULT_LOCALE;
  const match = document.cookie.match(new RegExp(`(?:^|; )${LOCALE_COOKIE.NAME}=([^;]*)`));
  if (match) {
    const val = decodeURIComponent(match[1]);
    if (SUPPORTED_LOCALES.includes(val as SupportedLocale)) {
      return val as SupportedLocale;
    }
  }
  return DEFAULT_LOCALE;
}
