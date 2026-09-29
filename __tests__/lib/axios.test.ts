import { describe, it, expect, vi, beforeEach } from 'vitest'
import api from '@/lib/axios'
import axios from 'axios'

describe('axios client (lib/axios.ts)', () => {
  it('has default configuration set', () => {
    expect(api.defaults.withCredentials).toBe(true)
    expect(api.defaults.headers['Content-Type']).toBe('application/json')
  })

  it('handles 403 forbidden response by dispatching permission-revoked event', async () => {
    const dispatchEventSpy = vi.spyOn(window, 'dispatchEvent')

    // Mock an adapter returning 403
    api.defaults.adapter = async (config) => {
      return Promise.reject({
        config,
        response: {
          status: 403,
          data: {},
          headers: {},
        },
      })
    }

    try {
      await api.get('/test-403')
    } catch (err: any) {
      expect(err.message).toBe('Tính năng không khả dụng hoặc bạn không có quyền thực hiện thao tác này.')
    }

    expect(dispatchEventSpy).toHaveBeenCalled()
  })

  it('does not trigger refresh-token flow when logout endpoint returns 401', async () => {
    const requestedUrls: string[] = []

    api.defaults.adapter = async (config) => {
      requestedUrls.push(config.url || '')
      return Promise.reject({
        config,
        response: { status: 401, data: {}, headers: {} },
      })
    }

    try {
      await api.post('/auth/logout')
    } catch {
      // Expected rejection
    }

    // Logout phải được gọi NHƯNG không được kích hoạt refresh-token
    // (nếu không, backend có thể cấp lại cookie HttpOnly → phiên "sống lại" sau logout)
    expect(requestedUrls).toContain('/auth/logout')
    expect(requestedUrls).not.toContain('/auth/refresh-token')
    expect(requestedUrls).toEqual(['/auth/logout'])
  })

  describe('Accept-Language header interceptor', () => {
    beforeEach(() => {
      document.cookie = 'NEXT_LOCALE=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
    })

    it('attaches Accept-Language header matching NEXT_LOCALE cookie', async () => {
      document.cookie = 'NEXT_LOCALE=en; path=/'
      let capturedHeaders: any = null

      api.defaults.adapter = async (config) => {
        capturedHeaders = config.headers
        return {
          data: {},
          status: 200,
          statusText: 'OK',
          headers: {},
          config,
        }
      }

      await api.get('/test-locale')
      expect(capturedHeaders['Accept-Language']).toBe('en')
    })

    it('defaults Accept-Language header to vi when NEXT_LOCALE is not set', async () => {
      let capturedHeaders: any = null

      api.defaults.adapter = async (config) => {
        capturedHeaders = config.headers
        return {
          data: {},
          status: 200,
          statusText: 'OK',
          headers: {},
          config,
        }
      }

      await api.get('/test-locale-default')
      expect(capturedHeaders['Accept-Language']).toBe('vi')
    })

    it('falls back to vi when NEXT_LOCALE contains an unsupported locale', async () => {
      document.cookie = 'NEXT_LOCALE=fr; path=/'
      let capturedHeaders: any = null

      api.defaults.adapter = async (config) => {
        capturedHeaders = config.headers
        return {
          data: {},
          status: 200,
          statusText: 'OK',
          headers: {},
          config,
        }
      }

      await api.get('/test-locale-unsupported')
      expect(capturedHeaders['Accept-Language']).toBe('vi')
    })
  })
})

