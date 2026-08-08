import { describe, it, expect } from 'vitest'
import { AxiosError, AxiosHeaders } from 'axios'
import { isInsufficientCredit } from '@/lib/utils/error-handler'

function buildAxiosError(status?: number): AxiosError {
  const response = status
    ? {
        status,
        data: { message: 'Bạn đã hết credit AI. Vui lòng mua thêm.' },
        statusText: '',
        headers: {},
        config: { headers: new AxiosHeaders() },
      }
    : undefined
  return new AxiosError('Request failed', undefined, undefined, undefined, response as never)
}

describe('isInsufficientCredit', () => {
  it('should return true when HTTP status is 402', () => {
    expect(isInsufficientCredit(buildAxiosError(402))).toBe(true)
  })

  it('should return false for other HTTP statuses (e.g. 400, 500)', () => {
    expect(isInsufficientCredit(buildAxiosError(400))).toBe(false)
    expect(isInsufficientCredit(buildAxiosError(500))).toBe(false)
  })

  it('should return false when error is not an AxiosError', () => {
    expect(isInsufficientCredit(new Error('generic'))).toBe(false)
    expect(isInsufficientCredit(null)).toBe(false)
    expect(isInsufficientCredit(undefined)).toBe(false)
  })
})
