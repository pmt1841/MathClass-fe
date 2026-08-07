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
})
