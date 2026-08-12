import { describe, it, expect, beforeEach, vi } from 'vitest'
import { authStorage } from '@/lib/auth-storage'
import { AUTH_KEYS } from '@/lib/constants/auth'

describe('authStorage', () => {
  beforeEach(() => {
    // Clear cookies & storage before each test
    document.cookie.split(';').forEach((cookie) => {
      const eqPos = cookie.indexOf('=')
      const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie
      document.cookie = `${name.trim()}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
    })
    localStorage.clear()
    sessionStorage.clear()
  })

  it('getToken returns null as tokens are stored in HttpOnly cookies', () => {
    expect(authStorage.getToken()).toBeNull()
  })

  it('setToken sets role cookie and storage persistence mode correctly', () => {
    authStorage.setToken('dummy-token', 'TEACHER', true)
    expect(localStorage.getItem('auth_persistence')).toBe('persistent')
    expect(document.cookie).toContain('user_role=TEACHER')
  })

  it('setToken handles session mode when rememberMe is false', () => {
    authStorage.setToken('dummy-token', 'STUDENT', false)
    expect(localStorage.getItem('auth_persistence')).toBe('session')
    expect(document.cookie).toContain('user_role=STUDENT')
  })

  it('setUserInfo and getUserInfo work with cookies', () => {
    const userInfo = { id: 101, name: 'Nguyễn Văn A', role: 'TEACHER' }
    authStorage.setUserInfo(userInfo, true)

    const retrieved = authStorage.getUserInfo()
    expect(retrieved).toEqual(userInfo)
  })

  it('sanitizeUserInfo strips sensitive token fields before storing in cookie', () => {
    authStorage.setUserInfo({
      id: 1,
      email: 'a@b.com',
      fullName: 'A',
      role: 'TEACHER',
      token: 'SECRET_JWT',
      accessToken: 'SECRET_ACCESS',
      refreshToken: 'SECRET_REFRESH',
      password: 'secret',
    }, true)

    const retrieved = authStorage.getUserInfo()
    expect(retrieved).toEqual({ id: 1, email: 'a@b.com', fullName: 'A', role: 'TEACHER' })
    expect(retrieved.token).toBeUndefined()
    expect(retrieved.accessToken).toBeUndefined()
    expect(retrieved.refreshToken).toBeUndefined()
    expect(retrieved.password).toBeUndefined()
  })

  it('clearSessionCookies removes all session cookies', () => {
    authStorage.setToken('dummy', 'TEACHER', true)

    authStorage.clearSessionCookies()

    expect(document.cookie).not.toContain('user_role=')
    expect(document.cookie).not.toContain('mathclass_role=')
    expect(document.cookie).not.toContain('mathclass_remember=')
  })

  it('clearToken and clearUserInfo clear cookies and storage entries', () => {
    authStorage.setUserInfo({ id: 1, name: 'Test' }, true)
    authStorage.setToken('dummy', 'TEACHER', true)

    authStorage.clearToken()
    authStorage.clearUserInfo()

    expect(authStorage.getUserInfo()).toBeNull()
    expect(localStorage.getItem('auth_persistence')).toBeNull()
  })
})
