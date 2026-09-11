import { describe, it, expect, vi, beforeEach } from 'vitest'
import api from '@/lib/axios'
import { classroomService } from '@/services/classroomService'

vi.mock('@/lib/axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('classroomService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('getMyClassrooms gọi GET /classrooms và trả về danh sách lớp học', async () => {
    const mockClassrooms = [
      { id: 1, classCode: 'MATH101', className: 'Toán 10A1', studentCount: 30, maxStudents: 40 },
    ]
    vi.mocked(api.get).mockResolvedValueOnce({ data: mockClassrooms })

    const result = await classroomService.getMyClassrooms()

    expect(api.get).toHaveBeenCalledWith('/classrooms')
    expect(result).toEqual(mockClassrooms)
  })

  it('getMyClassrooms trả về mảng rỗng nếu response không phải mảng', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: null })

    const result = await classroomService.getMyClassrooms()

    expect(result).toEqual([])
  })

  it('createClassroom gọi POST /classrooms với payload', async () => {
    const payload = { name: 'Toán 11A', maxStudents: 35, description: 'Lớp nâng cao' }
    const mockRes = { id: 2, classCode: 'MATH102', ...payload }
    vi.mocked(api.post).mockResolvedValueOnce({ data: mockRes })

    const result = await classroomService.createClassroom(payload)

    expect(api.post).toHaveBeenCalledWith('/classrooms', payload)
    expect(result).toEqual(mockRes)
  })

  it('getClassroomDetail gọi GET /classrooms/{classCode}', async () => {
    const mockDetail = { id: 1, classCode: 'MATH101', className: 'Toán 10A1' }
    vi.mocked(api.get).mockResolvedValueOnce({ data: mockDetail })

    const result = await classroomService.getClassroomDetail('MATH101')

    expect(api.get).toHaveBeenCalledWith('/classrooms/MATH101')
    expect(result).toEqual(mockDetail)
  })

  it('updateClassroom gọi PUT /classrooms/{classCode} với payload', async () => {
    const payload = { className: 'Toán 10A1 Đổi tên', description: 'Đã sửa', maxStudents: 45 }
    vi.mocked(api.put).mockResolvedValueOnce({ data: null })

    await classroomService.updateClassroom('MATH101', payload)

    expect(api.put).toHaveBeenCalledWith('/classrooms/MATH101', payload)
  })

  it('deleteClassroom gọi DELETE /classrooms/{classCode}', async () => {
    vi.mocked(api.delete).mockResolvedValueOnce({ data: null })

    await classroomService.deleteClassroom('MATH101')

    expect(api.delete).toHaveBeenCalledWith('/classrooms/MATH101')
  })

  it('getClassroomStudents gọi GET /classrooms/{classCode}/students với params', async () => {
    const mockData = { content: [{ id: 10, fullName: 'Học sinh A' }], totalPages: 1 }
    vi.mocked(api.get).mockResolvedValueOnce({ data: mockData })

    const params = { page: 0, size: 10, keyword: 'Học sinh' }
    const result = await classroomService.getClassroomStudents('MATH101', params)

    expect(api.get).toHaveBeenCalledWith('/classrooms/MATH101/students', { params })
    expect(result).toEqual(mockData)
  })

  it('addStudent gọi POST /classrooms/{classCode}/students với studentEmail', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({ data: null })

    await classroomService.addStudent('MATH101', 'student@mathclass.edu.vn')

    expect(api.post).toHaveBeenCalledWith('/classrooms/MATH101/students', {
      studentEmail: 'student@mathclass.edu.vn',
    })
  })

  it('removeStudent gọi DELETE /classrooms/{classCode}/students/{studentId}', async () => {
    vi.mocked(api.delete).mockResolvedValueOnce({ data: null })

    await classroomService.removeStudent('MATH101', 50)

    expect(api.delete).toHaveBeenCalledWith('/classrooms/MATH101/students/50')
  })
})
