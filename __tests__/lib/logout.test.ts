import { describe, it, expect } from 'vitest'
import axios from 'axios'
import { logoutSession } from '@/lib/logout'

describe('logoutSession (lib/logout.ts)', () => {
  it('calls the logout endpoint with credentials and correct /v1 base URL', async () => {
    let capturedUrl = ''
    let capturedConfig: any = null

    axios.defaults.adapter = async (config) => {
      capturedUrl = config.url || ''
      capturedConfig = config
      return { data: {}, status: 200, statusText: 'OK', headers: {}, config }
    }

    await logoutSession()

    // URL phải đúng endpoint (bao gồm /v1) — tránh lỗi 404 làm cookie HttpOnly không được xóa
    expect(capturedUrl).toContain('/auth/logout')
    expect(capturedUrl).toContain('/v1')
    expect(capturedConfig.withCredentials).toBe(true)
  })

  it('does not throw when the logout request fails', async () => {
    axios.defaults.adapter = async () => {
      throw new Error('network error')
    }

    await expect(logoutSession()).resolves.toBeUndefined()
  })
})
