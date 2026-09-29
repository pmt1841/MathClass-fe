'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import viDict from '@/dictionaries/vi.json'
import enDict from '@/dictionaries/en.json'
import { setLocaleCookie, getLocaleCookie, DEFAULT_LOCALE } from '@/lib/constants/i18n'

const dictionaries: Record<string, any> = {
  vi: viDict,
  en: enDict,
}

export type TranslationParams = Record<string, string | number | boolean | null | undefined> & {
  context?: string
}

export interface I18nContextType {
  locale: string
  setLocale: (locale: string) => void
  t: (key: string, params?: TranslationParams) => string
}

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Format string with ICU-style single brace {variable} and legacy double brace {{variable}}.
 * Ignores 'context' parameter used for disambiguation.
 */
function formatTemplate(template: string, params?: TranslationParams): string {
  if (!params) return template
  let result = template
  for (const [key, value] of Object.entries(params)) {
    if (key === 'context') continue // Skip context parameter
    const strVal = value !== undefined && value !== null ? String(value) : ''
    const escapedKey = escapeRegExp(key)
    result = result
      .replace(new RegExp(`\\{\\{\\s*${escapedKey}\\s*\\}\\}`, 'g'), strVal)
      .replace(new RegExp(`\\{\\s*${escapedKey}\\s*\\}`, 'g'), strVal)
  }
  return result
}

/**
 * Unified translation resolver:
 * 1. Checks contextual key (key##context) in active dictionary
 * 2. Checks direct natural key in active dictionary
 * 3. Checks contextual / direct natural key in fallback dictionary (vi)
 * 4. Checks legacy dot-notation path (e.g. "sidebar.overview")
 * 5. Returns key itself with variable interpolation if not found
 */
function resolveTranslation(
  dict: Record<string, any>,
  fallbackDict: Record<string, any>,
  key: string,
  params?: TranslationParams
): string {
  const context = params?.context
  const contextualKey = context ? `${key}##${context}` : null

  // 1. Direct match with context (e.g. "Lớp##education")
  if (contextualKey && typeof dict[contextualKey] === 'string') {
    return formatTemplate(dict[contextualKey], params)
  }

  // 2. Direct flat natural language match (e.g. "Đánh giá năng lực", "Mã lớp học: {code}")
  if (typeof dict[key] === 'string') {
    return formatTemplate(dict[key], params)
  }

  // 3. Fallback to Vietnamese dictionary for contextual or flat key
  if (contextualKey && typeof fallbackDict[contextualKey] === 'string') {
    return formatTemplate(fallbackDict[contextualKey], params)
  }
  if (typeof fallbackDict[key] === 'string') {
    return formatTemplate(fallbackDict[key], params)
  }

  // 4. Backward compatible dot-notation navigation (e.g. "assignments.assign")
  // Only attempt if key contains dot and doesn't look like a normal sentence with spaces
  if (key.includes('.') && !key.includes(' ')) {
    const keys = key.split('.')
    
    // Check in current dict
    let current: any = dict
    let found = true
    for (const k of keys) {
      if (current && typeof current === 'object' && k in current) {
        current = current[k]
      } else {
        found = false
        break
      }
    }
    if (found && typeof current === 'string') {
      return formatTemplate(current, params)
    }

    // Check in fallback dict
    let fallbackCurrent: any = fallbackDict
    let fallbackFound = true
    for (const k of keys) {
      if (fallbackCurrent && typeof fallbackCurrent === 'object' && k in fallbackCurrent) {
        fallbackCurrent = fallbackCurrent[k]
      } else {
        fallbackFound = false
        break
      }
    }
    if (fallbackFound && typeof fallbackCurrent === 'string') {
      return formatTemplate(fallbackCurrent, params)
    }
  }

  // 5. Default fallback: return key with interpolated parameters
  return formatTemplate(key, params)
}

const defaultT = (key: string, params?: TranslationParams) => {
  return resolveTranslation(dictionaries.vi, dictionaries.vi, key, params)
}

const I18nContext = createContext<I18nContextType>({
  locale: DEFAULT_LOCALE,
  setLocale: () => {},
  t: defaultT,
})

export function I18nProvider({
  children,
  initialLocale,
}: {
  children: React.ReactNode
  initialLocale?: string
}) {
  const [locale, setLocaleState] = useState<string>(initialLocale || getLocaleCookie)

  useEffect(() => {
    if (initialLocale && initialLocale !== locale) {
      setLocaleState(initialLocale)
    } else if (!initialLocale) {
      const current = getLocaleCookie()
      if (current !== locale) {
        setLocaleState(current)
      }
    }
  }, [initialLocale])

  const setLocale = (newLocale: string) => {
    setLocaleState(newLocale)
    setLocaleCookie(newLocale)
  }

  const t = (key: string, params?: TranslationParams): string => {
    const activeDict = dictionaries[locale] || dictionaries.vi
    const fallbackDict = dictionaries.vi
    return resolveTranslation(activeDict, fallbackDict, key, params)
  }

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  return useContext(I18nContext)
}
