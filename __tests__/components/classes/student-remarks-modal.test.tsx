import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { StudentRemarksModal } from '@/app/(dashboard)/classes/[classCode]/_components/student-remarks-modal'
import { Student } from '@/types'
import { toast } from 'sonner'

// Mock hooks
const mockUseStudentRemarks = vi.fn()
const mockCreateMutate = vi.fn()
const mockDeleteMutate = vi.fn()

vi.mock('@/hooks/useStudentRemarks', () => ({
  useStudentRemarks: (classCode: string, studentId: number | null) =>
    mockUseStudentRemarks(classCode, studentId),
  useCreateStudentRemark: () => ({
    mutate: mockCreateMutate,
    isPending: false,
  }),
  useDeleteStudentRemark: () => ({
    mutate: mockDeleteMutate,
    isPending: false,
  }),
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

// Mock useAuth for PermissionGuard
const mockUseAuth = vi.fn()
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}))

const mockStudent: Student = {
  id: 10,
  fullName: 'Lê Thị Bình',
  email: 'binh.le@example.com',
  joinedAt: '2026-08-01',
}

describe('StudentRemarksModal Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default: Teacher with classroom:manage_requests permission
    mockUseAuth.mockReturnValue({
      user: {
        id: 1,
        fullName: 'Thầy Nguyễn Văn A',
        role: 'TEACHER',
        permissions: ['classroom:manage_requests'],
      },
    })
    mockUseStudentRemarks.mockReturnValue({
      data: [],
      isLoading: false,
    })
  })

  it('không hiển thị nội dung modal khi open = false', () => {
    render(
      <StudentRemarksModal
        open={false}
        onClose={vi.fn()}
        student={mockStudent}
        classCode="MATH101"
      />
    )

    expect(screen.queryByText('Hồ sơ theo dõi học sinh')).not.toBeInTheDocument()
  })

  it('hiển thị thông tin học sinh khi open = true', () => {
    render(
      <StudentRemarksModal
        open={true}
        onClose={vi.fn()}
        student={mockStudent}
        classCode="MATH101"
      />
    )

    expect(screen.getByText('Hồ sơ theo dõi học sinh')).toBeInTheDocument()
    expect(screen.getByText('Lê Thị Bình')).toBeInTheDocument()
    expect(screen.getByText(/binh.le@example.com/)).toBeInTheDocument()
  })

  it('hiển thị empty state khi chưa có nhận xét nào', () => {
    mockUseStudentRemarks.mockReturnValue({
      data: [],
      isLoading: false,
    })

    render(
      <StudentRemarksModal
        open={true}
        onClose={vi.fn()}
        student={mockStudent}
        classCode="MATH101"
      />
    )

    expect(screen.getByText('Chưa có nhận xét nào')).toBeInTheDocument()
  })

  it('hiển thị danh sách nhận xét với đầy đủ badge thông tin', () => {
    const mockRemarks = [
      {
        id: 101,
        studentId: 10,
        studentName: 'Lê Thị Bình',
        teacherId: 1,
        teacherName: 'Thầy Nguyễn Văn A',
        strengths: 'Tư duy logic rất nhạy bén',
        weaknesses: 'Hay nhầm lẫn dấu',
        generalAssessment: 'Cần cẩn thận hơn',
        createdAt: '2026-08-27T10:00:00Z',
        updatedAt: '2026-08-27T10:00:00Z',
      },
    ]

    mockUseStudentRemarks.mockReturnValue({
      data: mockRemarks,
      isLoading: false,
    })

    render(
      <StudentRemarksModal
        open={true}
        onClose={vi.fn()}
        student={mockStudent}
        classCode="MATH101"
      />
    )

    expect(screen.getByText('Lịch sử nhận xét (1)')).toBeInTheDocument()
    expect(screen.getByText('Thầy Nguyễn Văn A')).toBeInTheDocument()
    expect(screen.getByText('Điểm mạnh')).toBeInTheDocument()
    expect(screen.getByText('Cần cải thiện')).toBeInTheDocument()
    expect(screen.getByText('Đánh giá chung')).toBeInTheDocument()
    expect(screen.getByText('Tư duy logic rất nhạy bén')).toBeInTheDocument()
  })

  it('hiển thị lỗi toast khi submit form với toàn bộ các trường rỗng', () => {
    render(
      <StudentRemarksModal
        open={true}
        onClose={vi.fn()}
        student={mockStudent}
        classCode="MATH101"
      />
    )

    const submitBtn = screen.getByRole('button', { name: /Lưu nhận xét học sinh/i })
    expect(submitBtn).toBeDisabled()
  })

  it('nhập form và submit gọi createMutation thành công', () => {
    render(
      <StudentRemarksModal
        open={true}
        onClose={vi.fn()}
        student={mockStudent}
        classCode="MATH101"
      />
    )

    const strengthInput = screen.getByPlaceholderText(/Tư duy logic tốt/i)
    fireEvent.change(strengthInput, { target: { value: 'Hiểu bài rất nhanh' } })

    const submitBtn = screen.getByRole('button', { name: /Lưu nhận xét học sinh/i })
    expect(submitBtn).not.toBeDisabled()

    fireEvent.click(submitBtn)

    expect(mockCreateMutate).toHaveBeenCalledWith(
      {
        strengths: 'Hiểu bài rất nhanh',
        weaknesses: undefined,
        generalAssessment: undefined,
      },
      expect.any(Object)
    )
  })

  it('mở modal xác nhận AlertDialog và gọi deleteMutation khi xác nhận xóa', () => {
    const mockRemarks = [
      {
        id: 101,
        studentId: 10,
        studentName: 'Lê Thị Bình',
        teacherId: 1,
        teacherName: 'Thầy Nguyễn Văn A',
        strengths: 'Tư duy logic',
        createdAt: '2026-08-27T10:00:00Z',
        updatedAt: '2026-08-27T10:00:00Z',
      },
    ]

    mockUseStudentRemarks.mockReturnValue({
      data: mockRemarks,
      isLoading: false,
    })

    render(
      <StudentRemarksModal
        open={true}
        onClose={vi.fn()}
        student={mockStudent}
        classCode="MATH101"
      />
    )

    const deleteBtn = screen.getByTitle('Xóa nhận xét này')
    fireEvent.click(deleteBtn)

    // AlertDialog opens
    expect(screen.getByText('Xác nhận xóa nhận xét')).toBeInTheDocument()

    const confirmDeleteBtn = screen.getByRole('button', { name: 'Xóa nhận xét' })
    fireEvent.click(confirmDeleteBtn)

    expect(mockDeleteMutate).toHaveBeenCalledWith(101, expect.any(Object))
  })

  it('hiển thị giao diện chỉ xem khi người dùng không có quyền classroom:manage_requests', () => {
    mockUseAuth.mockReturnValue({
      user: {
        id: 10,
        fullName: 'Học sinh Lê Thị Bình',
        role: 'STUDENT',
        permissions: [],
      },
    })

    render(
      <StudentRemarksModal
        open={true}
        onClose={vi.fn()}
        student={mockStudent}
        classCode="MATH101"
      />
    )

    expect(screen.getByText('Chế độ xem lịch sử nhận xét')).toBeInTheDocument()
    expect(
      screen.getByText(/Chỉ giáo viên phụ trách lớp mới có quyền ghi nhận xét/i)
    ).toBeInTheDocument()
    expect(screen.queryByPlaceholderText(/Tư duy logic tốt/i)).not.toBeInTheDocument()
  })
})
