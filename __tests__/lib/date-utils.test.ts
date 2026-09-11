import { describe, it, expect } from 'vitest'
import {
  getMaxDaysInMonth,
  checkIsLeapYear,
  formatCalendarDate,
  parseClientDate,
  getDaysInMonthAndYear,
} from '@/lib/date-utils'

describe('date-utils', () => {
  describe('getMaxDaysInMonth', () => {
    it('trả về 31 ngày cho tháng 1', () => {
      const date = new Date(2026, 0, 15) // Tháng 1/2026
      expect(getMaxDaysInMonth(date)).toBe(31)
    })

    it('trả về 28 ngày cho tháng 2 của năm không nhuận 2023', () => {
      const date = new Date(2023, 1, 10) // Tháng 2/2023
      expect(getMaxDaysInMonth(date)).toBe(28)
    })

    it('trả về 29 ngày cho tháng 2 của năm nhuận 2024', () => {
      const date = new Date(2024, 1, 10) // Tháng 2/2024
      expect(getMaxDaysInMonth(date)).toBe(29)
    })

    it('trả về 30 ngày cho tháng 4', () => {
      const date = new Date(2026, 3, 20) // Tháng 4/2026
      expect(getMaxDaysInMonth(date)).toBe(30)
    })
  })

  describe('checkIsLeapYear', () => {
    it('nhận diện chính xác năm nhuận 2024 và năm 2000', () => {
      expect(checkIsLeapYear(new Date(2024, 5, 1))).toBe(true)
      expect(checkIsLeapYear(new Date(2000, 0, 1))).toBe(true)
    })

    it('nhận diện chính xác năm không nhuận 2023, 2025, 2026', () => {
      expect(checkIsLeapYear(new Date(2023, 0, 1))).toBe(false)
      expect(checkIsLeapYear(new Date(2025, 0, 1))).toBe(false)
      expect(checkIsLeapYear(new Date(2026, 0, 1))).toBe(false)
    })
  })

  describe('formatCalendarDate', () => {
    it('trả về chuỗi rỗng khi truyền null hoặc undefined', () => {
      expect(formatCalendarDate(null)).toBe('')
      expect(formatCalendarDate(undefined)).toBe('')
    })

    it('format định dạng mặc định dd-MM-yyyy từ đối tượng Date', () => {
      const date = new Date(2026, 8, 11) // 11/09/2026
      expect(formatCalendarDate(date)).toBe('11-09-2026')
    })

    it('format định dạng tùy chỉnh theo formatStr', () => {
      const date = new Date(2026, 8, 11, 14, 30)
      expect(formatCalendarDate(date, 'yyyy/MM/dd HH:mm')).toBe('2026/09/11 14:30')
    })

    it('format thành công khi đầu vào là chuỗi ISO string', () => {
      expect(formatCalendarDate('2026-09-11T10:00:00Z')).toBe('11-09-2026')
    })

    it('trả về chuỗi rỗng khi chuỗi ngày không hợp lệ', () => {
      expect(formatCalendarDate('invalid-date-string')).toBe('')
    })
  })

  describe('parseClientDate', () => {
    it('trả về undefined khi truyền chuỗi rỗng, null hoặc undefined', () => {
      expect(parseClientDate('')).toBeUndefined()
      expect(parseClientDate(null)).toBeUndefined()
      expect(parseClientDate(undefined)).toBeUndefined()
    })

    it('parse thành công chuỗi dd-MM-yyyy về đối tượng Date', () => {
      const parsed = parseClientDate('25-12-2026')
      expect(parsed).toBeInstanceOf(Date)
      expect(parsed?.getDate()).toBe(25)
      expect(parsed?.getMonth()).toBe(11) // Tháng 12 là index 11
      expect(parsed?.getFullYear()).toBe(2026)
    })

    it('trả về undefined với chuỗi ngày sai format hoặc không hợp lệ', () => {
      expect(parseClientDate('not-a-date')).toBeUndefined()
      expect(parseClientDate('2026/12/25')).toBeUndefined()
    })
  })

  describe('getDaysInMonthAndYear', () => {
    it('tính số ngày chính xác theo tháng (1-12) và năm', () => {
      expect(getDaysInMonthAndYear(1, 2026)).toBe(31) // Tháng 1
      expect(getDaysInMonthAndYear(2, 2024)).toBe(29) // Tháng 2 năm nhuận
      expect(getDaysInMonthAndYear(2, 2026)).toBe(28) // Tháng 2 năm không nhuận
      expect(getDaysInMonthAndYear(4, 2026)).toBe(30) // Tháng 4
      expect(getDaysInMonthAndYear(7, 2026)).toBe(31) // Tháng 7
      expect(getDaysInMonthAndYear(8, 2026)).toBe(31) // Tháng 8
      expect(getDaysInMonthAndYear(11, 2026)).toBe(30) // Tháng 11
      expect(getDaysInMonthAndYear(12, 2026)).toBe(31) // Tháng 12
    })
  })
})
