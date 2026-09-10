import { describe, it, expect } from 'vitest'
import {
  cn,
  parseDateSafe,
  formatDate,
  formatDateTime,
  formatTime,
  formatDistanceToNowSafe,
  formatRelativeLastLogin,
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

  describe('formatRelativeLastLogin', () => {
    it('returns "Chưa đăng nhập" when date is null, undefined, or invalid', () => {
      expect(formatRelativeLastLogin(null)).toBe('Chưa đăng nhập')
      expect(formatRelativeLastLogin(undefined)).toBe('Chưa đăng nhập')
      expect(formatRelativeLastLogin('invalid-date')).toBe('Chưa đăng nhập')
    })

    it('returns "Vừa xong" when under 1 minute', () => {
      const now = new Date()
      const d = new Date(now.getTime() - 1000 * 30) // 30s ago
      expect(formatRelativeLastLogin(d)).toBe('Vừa xong')
    })

    it('returns "X phút trước" when between 1 and 59 minutes', () => {
      const now = new Date()
      const d = new Date(now.getTime() - 1000 * 60 * 25) // 25 mins ago
      expect(formatRelativeLastLogin(d)).toBe('25 phút trước')
    })

    it('returns "X giờ Y phút trước" when between 1 and 23 hours with remaining minutes', () => {
      const now = new Date()
      const d = new Date(now.getTime() - (1000 * 60 * 60 * 2 + 1000 * 60 * 15)) // 2h 15m ago
      expect(formatRelativeLastLogin(d)).toBe('2 giờ 15 phút trước')
    })

    it('returns "X giờ trước" when between 1 and 23 hours with 0 remaining minutes', () => {
      const now = new Date()
      const d = new Date(now.getTime() - 1000 * 60 * 60 * 3) // 3h 0m ago
      expect(formatRelativeLastLogin(d)).toBe('3 giờ trước')
    })

    it('returns "X ngày trước" when between 1 and 29 days', () => {
      const now = new Date()
      const d = new Date(now.getTime() - 1000 * 60 * 60 * 24 * 5) // 5 days ago
      expect(formatRelativeLastLogin(d)).toBe('5 ngày trước')
    })

    it('returns "X tháng trước" when between 30 and 364 days (e.g. 60 days -> 2 tháng trước, no 60 ngày)', () => {
      const now = new Date()
      const d1 = new Date(now.getTime() - 1000 * 60 * 60 * 24 * 65) // 65 days ago
      expect(formatRelativeLastLogin(d1)).toBe('2 tháng trước')

      const d2 = new Date(now.getTime() - 1000 * 60 * 60 * 24 * 95) // 95 days ago
      expect(formatRelativeLastLogin(d2)).toBe('3 tháng trước')
    })

    it('returns "X năm trước" when 365 days or more (e.g. 750 days -> 2 năm trước, no 24 tháng)', () => {
      const now = new Date()
      const d1 = new Date(now.getTime() - 1000 * 60 * 60 * 24 * 400) // ~1.1 years
      expect(formatRelativeLastLogin(d1)).toBe('1 năm trước')

      const d2 = new Date(now.getTime() - 1000 * 60 * 60 * 24 * 750) // ~2 years
      expect(formatRelativeLastLogin(d2)).toBe('2 năm trước')
    })
  })
})
