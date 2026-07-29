import { describe, it, expect } from 'vitest'
import {
  cn,
  parseDateSafe,
  formatDate,
  formatDateTime,
  formatTime,
  formatDistanceToNowSafe,
} from '@/lib/utils'

describe('utils', () => {
  describe('cn (Tailwind Class Merger)', () => {
    it('merges tailwind classes correctly without duplication', () => {
      expect(cn('bg-red-500', 'text-white')).toBe('bg-red-500 text-white')
      expect(cn('p-4', { 'bg-blue-500': true, 'text-black': false })).toBe('p-4 bg-blue-500')
      expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4')
    })
  })

  describe('parseDateSafe', () => {
    it('parses valid ISO string date', () => {
      const date = parseDateSafe('2026-05-20T10:30:00Z')
      expect(date).toBeInstanceOf(Date)
      expect(date?.getUTCFullYear()).toBe(2026)
      expect(date?.getUTCMonth()).toBe(4) // 0-indexed May
      expect(date?.getUTCDate()).toBe(20)
    })

    it('parses Spring Boot LocalDateTime array [YYYY, MM, DD, HH, mm, ss]', () => {
      const date = parseDateSafe([2026, 7, 29, 9, 15, 30])
      expect(date).toBeInstanceOf(Date)
      expect(date?.getUTCFullYear()).toBe(2026)
      expect(date?.getUTCMonth()).toBe(6) // July
      expect(date?.getUTCDate()).toBe(29)
      expect(date?.getUTCHours()).toBe(9)
      expect(date?.getUTCMinutes()).toBe(15)
    })

    it('returns null for invalid inputs', () => {
      expect(parseDateSafe('invalid-date-string')).toBeNull()
      expect(parseDateSafe(null)).toBeNull()
      expect(parseDateSafe(undefined)).toBeNull()
      expect(parseDateSafe(new Date(NaN))).toBeNull()
    })
  })

  describe('formatDate', () => {
    it('formats date to dd/MM/yyyy string', () => {
      const date = new Date(2026, 0, 15) // Jan 15 2026
      expect(formatDate(date)).toBe('15/01/2026')
    })

    it('returns empty string for null/invalid input', () => {
      expect(formatDate(null)).toBe('')
      expect(formatDate('invalid')).toBe('')
    })
  })

  describe('formatDateTime & formatTime', () => {
    it('formats date and time correctly', () => {
      const date = new Date(2026, 4, 10, 14, 20, 45)
      expect(formatDateTime(date)).toBe('14:20:45 10/05/2026')
      expect(formatTime(date)).toBe('14:20:45')
    })
  })

  describe('formatDistanceToNowSafe', () => {
    it('returns formatted distance in Vietnamese locale', () => {
      const now = new Date()
      const pastDate = new Date(now.getTime() - 1000 * 60 * 5) // 5 mins ago
      const result = formatDistanceToNowSafe(pastDate)
      expect(result).toBeDefined()
      expect(typeof result).toBe('string')
    })

    it('returns empty string for invalid date', () => {
      expect(formatDistanceToNowSafe(null)).toBe('')
    })
  })
})
