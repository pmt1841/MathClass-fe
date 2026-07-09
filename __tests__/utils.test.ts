import { describe, it, expect } from 'vitest'
import { cn, parseDateSafe, formatDate } from '../lib/utils'

describe('utils', () => {
  describe('cn', () => {
    it('hợp nhất các class tailwind một cách chính xác', () => {
      expect(cn('bg-red-500', 'text-white')).toBe('bg-red-500 text-white')
      expect(cn('p-4', { 'bg-blue-500': true, 'text-black': false })).toBe('p-4 bg-blue-500')
    })
  })

  describe('parseDateSafe', () => {
    it('phân tích chuỗi ngày hợp lệ', () => {
      const date = parseDateSafe('2023-01-01T00:00:00Z')
      expect(date).toBeInstanceOf(Date)
    })

    it('trả về null nếu ngày không hợp lệ', () => {
      expect(parseDateSafe('invalid-date')).toBeNull()
      expect(parseDateSafe(null)).toBeNull()
    })
  })

  describe('formatDate', () => {
    it('định dạng ngày chuẩn dd/MM/yyyy', () => {
      // 15 tháng 1 năm 2023
      const date = new Date(2023, 0, 15)
      expect(formatDate(date)).toBe('15/01/2023')
    })
  })
})
