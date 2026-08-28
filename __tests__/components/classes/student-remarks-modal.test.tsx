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
const mockAiEvaluateMutate = vi.fn()

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
  useAiStudentRemarkEvaluation: () => ({
    mutate: mockAiEvaluateMutate,
    isPending: false,
  }),
}))

const mockUseQuery = vi.fn()

vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query')
  return {
    ...actual,
    useQuery: (...args: any[]) => mockUseQuery(...args),
  }
})

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
    mockUseQuery.mockReturnValue({
      data: { STUDENT_REMARK: true },
      isLoading: false,
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

  it('hiển thị khối AI Đánh giá và gọi aiEvaluateMutation khi click Quét & Đánh giá', () => {
    render(
      <StudentRemarksModal
        open={true}
        onClose={vi.fn()}
        student={mockStudent}
        classCode="MATH101"
      />
    )

    expect(screen.getByText('AI Đánh giá tiến độ')).toBeInTheDocument()
    expect(screen.getByText('3 ngày')).toBeInTheDocument()
    expect(screen.getByText('7 ngày')).toBeInTheDocument()
    expect(screen.getByText('1 tháng')).toBeInTheDocument()

    // Chọn 3 ngày
    const threeDaysBtn = screen.getByRole('button', { name: '3 ngày' })
    fireEvent.click(threeDaysBtn)

    const aiScanBtn = screen.getByRole('button', { name: /Quét & Đánh giá/i })
    fireEvent.click(aiScanBtn)

    expect(mockAiEvaluateMutate).toHaveBeenCalledWith(
      { days: 3 },
      expect.any(Object)
    )
  })

  it('tự động điền dữ liệu gợi ý và hiển thị banner khi AI evaluate thành công', () => {
    mockAiEvaluateMutate.mockImplementation((payload, options) => {
      options?.onSuccess?.({
        startDate: '2026-08-21',
        endDate: '2026-08-28',
        totalAssignments: 5,
        completedAssignments: 4,
        overdueAssignments: 0,
        activeIncompleteAssignments: 1,
        averageScore: 8.5,
        strengths: 'AI Điểm mạnh',
        weaknesses: 'AI Điểm yếu',
        generalAssessment: 'AI Đánh giá chung',
      })
    })

    render(
      <StudentRemarksModal
        open={true}
        onClose={vi.fn()}
        student={mockStudent}
        classCode="MATH101"
      />
    )

    const aiScanBtn = screen.getByRole('button', { name: /Quét & Đánh giá/i })
    fireEvent.click(aiScanBtn)

    expect(screen.getByDisplayValue('AI Điểm mạnh')).toBeInTheDocument()
    expect(screen.getByDisplayValue('AI Điểm yếu')).toBeInTheDocument()
    expect(screen.getByDisplayValue('AI Đánh giá chung')).toBeInTheDocument()

    // Banner hiển thị
    expect(screen.getByText(/Đã nộp/i)).toBeInTheDocument()

    // Đóng banner
    const closeBannerBtn = screen.getByRole('button', { name: 'Đóng' })
    fireEvent.click(closeBannerBtn)

    expect(screen.queryByRole('button', { name: 'Đóng' })).not.toBeInTheDocument()
  })

  it('click vào nhận xét trong danh sách để mở rộng / thu gọn chi tiết', () => {
    const mockRemarks = [
      {
        id: 101,
        studentId: 10,
        studentName: 'Lê Thị Bình',
        teacherId: 1,
        teacherName: 'Thầy Nguyễn Văn A',
        strengths: 'Nội dung nhận xét 1',
        createdAt: '2026-08-27T10:00:00Z',
        updatedAt: '2026-08-27T10:00:00Z',
      },
      {
        id: 102,
        studentId: 10,
        studentName: 'Lê Thị Bình',
        teacherId: 1,
        teacherName: 'Thầy Nguyễn Văn A',
        strengths: 'Nội dung nhận xét 2',
        createdAt: '2026-08-20T10:00:00Z',
        updatedAt: '2026-08-20T10:00:00Z',
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

    // Mặc định nhận xét đầu tiên (index 0) mở, nhận xét thứ 2 (index 1) đóng
    expect(screen.getByText('Nội dung nhận xét 1')).toBeInTheDocument()
    expect(screen.queryByText('Nội dung nhận xét 2')).not.toBeInTheDocument()

    // Click vào nhận xét thứ 2 để mở rộng
    const teacherHeaders = screen.getAllByText('Thầy Nguyễn Văn A')
    expect(teacherHeaders.length).toBe(2)
    fireEvent.click(teacherHeaders[1])

    expect(screen.getByText('Nội dung nhận xét 2')).toBeInTheDocument()
  })

  it('[FE-01] ẩn hoàn toàn khối Trợ lý AI khi cờ STUDENT_REMARK = false', () => {
    mockUseQuery.mockReturnValue({
      data: { STUDENT_REMARK: false },
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

    expect(screen.queryByText('AI Đánh giá tiến độ')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Quét & Đánh giá/i })).not.toBeInTheDocument()
  })

  it('[FE-02] hiển thị toast.error đúng nội dung lỗi khi AI evaluate thất bại (hết credit / lỗi mạng)', () => {
    mockAiEvaluateMutate.mockImplementation((payload, options) => {
      options?.onError?.({
        response: {
          data: {
            message: 'Bạn đã hết credit AI. Vui lòng nạp thêm để tiếp tục sử dụng.',
          },
        },
      })
    })

    render(
      <StudentRemarksModal
        open={true}
        onClose={vi.fn()}
        student={mockStudent}
        classCode="MATH101"
      />
    )

    const aiScanBtn = screen.getByRole('button', { name: /Quét & Đánh giá/i })
    fireEvent.click(aiScanBtn)

    expect(toast.error).toHaveBeenCalledWith(
      'Bạn đã hết credit AI. Vui lòng nạp thêm để tiếp tục sử dụng.'
    )
    expect(screen.getByRole('button', { name: /Quét & Đánh giá/i })).not.toBeDisabled()
  })

  it('[FE-03] hiển thị đúng các nhánh của Banner kết quả AI: bài quá hạn và không có điểm', () => {
    mockAiEvaluateMutate.mockImplementation((payload, options) => {
      options?.onSuccess?.({
        startDate: '2026-08-21',
        endDate: '2026-08-28',
        totalAssignments: 3,
        completedAssignments: 1,
        overdueAssignments: 2,
        activeIncompleteAssignments: 0,
        averageScore: null, // Không có điểm
        strengths: 'Chăm chỉ nộp bài',
        weaknesses: 'Nộp muộn',
        generalAssessment: 'Cần chú ý deadline',
      })
    })

    render(
      <StudentRemarksModal
        open={true}
        onClose={vi.fn()}
        student={mockStudent}
        classCode="MATH101"
      />
    )

    const aiScanBtn = screen.getByRole('button', { name: /Quét & Đánh giá/i })
    fireEvent.click(aiScanBtn)

    // Kiểm tra nhánh có bài quá hạn (overdue > 0 và active = 0)
    expect(screen.getByText(/2 bài quá hạn/i)).toBeInTheDocument()

    // Kiểm tra nhánh averageScore = null không render chữ ĐTB
    expect(screen.queryByText(/• ĐTB:/i)).not.toBeInTheDocument()
  })
})
