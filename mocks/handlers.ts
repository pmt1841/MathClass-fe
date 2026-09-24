import { http, HttpResponse } from 'msw'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'

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

  // Submissions hints & versions
  http.get('*/api/v1/submissions/:submissionId/hints', () => {
    return HttpResponse.json([])
  }),
  http.get('*/api/v1/submissions/:submissionId/versions', () => {
    return HttpResponse.json({
      content: [],
      totalElements: 0,
      totalPages: 0,
    })
  }),
  http.get(`${API_URL}/api/v1/submissions/:submissionId/hints`, () => {
    return HttpResponse.json([])
  }),
  http.get(`${API_URL}/api/v1/submissions/:submissionId/versions`, () => {
    return HttpResponse.json({
      content: [],
      totalElements: 0,
      totalPages: 0,
    })
  }),
]
