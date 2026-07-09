import { describe, it, expect } from 'vitest'

describe('MSW API Mocking', () => {
  it('lấy danh sách lớp học từ mock API', async () => {
    const response = await fetch('/api/classes')
    const data = await response.json()
    
    expect(response.status).toBe(200)
    expect(data).toBeInstanceOf(Array)
    expect(data).toHaveLength(2)
    expect(data[0].code).toBe('MATH10')
  })

  it('lấy thông tin người dùng từ mock API', async () => {
    const response = await fetch('/api/auth/me')
    const data = await response.json()
    
    expect(response.status).toBe(200)
    expect(data.user).toBeDefined()
    expect(data.user.role).toBe('STUDENT')
  })
})
