import { http, HttpResponse } from 'msw'

export const handlers = [
  // Giả lập API lấy thông tin người dùng
  http.get('/api/auth/me', () => {
    return HttpResponse.json({
      user: { id: 'u1', name: 'Test User', role: 'STUDENT' },
    })
  }),

  // Giả lập API lấy danh sách lớp học
  http.get('/api/classes', () => {
    return HttpResponse.json([
      { id: '1', name: 'Toán 10', code: 'MATH10' },
      { id: '2', name: 'Đại số 11', code: 'ALG11' },
    ])
  }),
]
