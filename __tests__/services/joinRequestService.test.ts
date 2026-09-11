import { describe, it, expect, vi, beforeEach } from 'vitest'
import api from '@/lib/axios'
import {
  joinRequestService,
  JoinRequestRequest,
  JoinRequestResponse,
  ProcessJoinRequest,
} from '@/services/joinRequestService'

vi.mock('@/lib/axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}))

describe('joinRequestService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('requestToJoinClass - gọi POST /classrooms/join-requests gửi yêu cầu tham gia lớp', async () => {
    const req: JoinRequestRequest = { classCode: 'MATH101' }
    const mockRes: JoinRequestResponse = {
      id: 1,
      studentId: 10,
      studentName: 'Nguyen Van B',
      studentEmail: 'student@example.com',
      classCode: 'MATH101',
      className: 'Lớp Toán 10',
      status: 'PENDING',
      requestedAt: '2026-09-11T10:00:00Z',
    }
    vi.mocked(api.post).mockResolvedValueOnce({ data: mockRes })

    const result = await joinRequestService.requestToJoinClass(req)

    expect(api.post).toHaveBeenCalledWith('/classrooms/join-requests', req)
    expect(result).toEqual(mockRes)
  })

  it('getMyJoinRequests - gọi GET /classrooms/join-requests/me lấy danh sách yêu cầu của học sinh', async () => {
    const mockList: JoinRequestResponse[] = [
      {
        id: 1,
        studentId: 10,
        studentName: 'Nguyen Van B',
        studentEmail: 'student@example.com',
        classCode: 'MATH101',
        className: 'Lớp Toán 10',
        status: 'PENDING',
        requestedAt: '2026-09-11T10:00:00Z',
      },
    ]
    vi.mocked(api.get).mockResolvedValueOnce({ data: mockList })

    const result = await joinRequestService.getMyJoinRequests()

    expect(api.get).toHaveBeenCalledWith('/classrooms/join-requests/me')
    expect(result).toEqual(mockList)
  })

  it('getPendingRequests - gọi GET /classrooms/:classCode/join-requests lấy danh sách chờ duyệt của giáo viên', async () => {
    const mockList: JoinRequestResponse[] = [
      {
        id: 2,
        studentId: 11,
        studentName: 'Tran Thi C',
        studentEmail: 'tranthic@example.com',
        classCode: 'MATH101',
        className: 'Lớp Toán 10',
        status: 'PENDING',
        requestedAt: '2026-09-11T10:05:00Z',
      },
    ]
    vi.mocked(api.get).mockResolvedValueOnce({ data: mockList })

    const result = await joinRequestService.getPendingRequests('MATH101')

    expect(api.get).toHaveBeenCalledWith('/classrooms/MATH101/join-requests')
    expect(result).toEqual(mockList)
  })

  it('processJoinRequest - gọi PUT /classrooms/join-requests/:id phê duyệt hoặc từ chối', async () => {
    const payload: ProcessJoinRequest = { status: 'APPROVED' }
    const mockRes: JoinRequestResponse = {
      id: 2,
      studentId: 11,
      studentName: 'Tran Thi C',
      studentEmail: 'tranthic@example.com',
      classCode: 'MATH101',
      className: 'Lớp Toán 10',
      status: 'APPROVED',
      requestedAt: '2026-09-11T10:05:00Z',
    }
    vi.mocked(api.put).mockResolvedValueOnce({ data: mockRes })

    const result = await joinRequestService.processJoinRequest(2, payload)

    expect(api.put).toHaveBeenCalledWith('/classrooms/join-requests/2', payload)
    expect(result).toEqual(mockRes)
    expect(result.status).toBe('APPROVED')
  })
})
