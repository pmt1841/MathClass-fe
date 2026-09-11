import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { CreditQuotaTab } from '@/components/admin/ai-config/CreditQuotaTab'

const updateTaskConfig = vi.fn().mockResolvedValue({})
const updateDefaultCredits = vi.fn().mockResolvedValue({})
const adjustCreditMock = vi.fn().mockResolvedValue({})

vi.mock('@/hooks/useAdminCredits', () => ({
  useAdminTaskCreditConfigs: () => ({
    data: [{ id: 1, task: 'STUDENT_HINT', costPerCall: 1, tokensPerCredit: 1000, enabled: true }],
    isLoading: false,
  }),
  useUpdateTaskCreditConfig: () => ({ mutateAsync: updateTaskConfig }),
  useAdminDefaultCredits: () => ({
    data: [
      { role: 'STUDENT', defaultCredits: 100 },
      { role: 'TEACHER', defaultCredits: 500 },
    ],
    isLoading: false,
  }),
  useUpdateDefaultCredits: () => ({ mutateAsync: updateDefaultCredits }),
  useAdminPackages: () => ({
    data: [
      { id: 1, name: 'Gói Cơ bản', credits: 100, price: 20000, enabled: true, sortOrder: 1 },
    ],
    isLoading: false,
  }),
  useCreateCreditPackage: () => ({ mutateAsync: vi.fn() }),
  useUpdateCreditPackage: () => ({ mutateAsync: vi.fn() }),
  useDeleteCreditPackage: () => ({ mutateAsync: vi.fn() }),
  useAdjustCredit: () => ({ mutateAsync: adjustCreditMock }),
  useAdminCreditTransactions: () => ({
    data: {
      content: [
        {
          id: 101,
          userId: 1,
          userEmail: 'student@example.com',
          userRole: 'STUDENT',
          amount: 50,
          type: 'GRANT_DEFAULT',
          task: null,
          description: 'Cấp khởi tạo',
          createdAt: '2026-03-01T10:00:00Z',
        },
      ],
      totalElements: 1,
      totalPages: 1,
      size: 10,
      number: 0,
      first: true,
      last: true,
      empty: false,
    },
    isLoading: false,
  }),
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

vi.mock('@/hooks/useAdmin', () => ({
  useAdminUsers: (
    _page?: number,
    _role?: string,
    _isActive?: boolean,
    _search?: string,
    _size?: number,
    _options?: { enabled?: boolean },
    excludeRole?: string
  ) => {
    const allUsers = [
      {
        id: 1,
        email: 'student@example.com',
        fullName: 'Học sinh Test',
        role: 'STUDENT',
        active: true,
      },
      {
        id: 2,
        email: 'admin@example.com',
        fullName: 'Quản trị viên Hệ thống',
        role: 'ADMIN',
        active: true,
      },
    ]
    const content = excludeRole ? allUsers.filter((u) => u.role !== excludeRole) : allUsers
    return {
      data: {
        content,
        totalElements: content.length,
        totalPages: 1,
      },
      isLoading: false,
      isFetching: false,
    }
  },
}))

describe('CreditQuotaTab', () => {
  it('should render all 4 management sections', () => {
    render(<CreditQuotaTab />)

    expect(screen.getByText('Chi phí Credit theo Tác vụ AI')).toBeTruthy()
    expect(screen.getByText('Credit mặc định khi tạo tài khoản')).toBeTruthy()
    expect(screen.getByText('Gói nạp Credit')).toBeTruthy()
    expect(screen.getByText('Điều chỉnh Credit & Sổ cái giao dịch')).toBeTruthy()

    // Dữ liệu seed render đúng
    expect(screen.getByText('Gợi ý tư duy làm bài')).toBeTruthy()
    expect(screen.getByText('Gói Cơ bản')).toBeTruthy()
  })

  it('should call update task credit config on save', async () => {
    render(<CreditQuotaTab />)

    // Sửa chi phí STUDENT_HINT từ 1 -> 2 rồi bấm Lưu (nút đầu tiên trong trang)
    fireEvent.change(screen.getByDisplayValue('1'), { target: { value: '2' } })
    fireEvent.click(screen.getAllByText('Lưu')[0])

    await waitFor(() =>
      expect(updateTaskConfig).toHaveBeenCalledWith({
        task: 'STUDENT_HINT',
        data: { costPerCall: 2, tokensPerCredit: 1000, enabled: true },
      })
    )
  })

  it('should render ledger transactions with STT, email, role, and pagination', () => {
    render(<CreditQuotaTab />)
    expect(screen.getByText('STT')).toBeTruthy()
    expect(screen.getByText('Email')).toBeTruthy()
    expect(screen.getByText('Vai trò')).toBeTruthy()
    expect(screen.getByText('Thời gian')).toBeTruthy()
    expect(screen.getByText('Loại')).toBeTruthy()
    expect(screen.getByText('Nội dung')).toBeTruthy()
    expect(screen.getAllByText('Số credit').length).toBeGreaterThanOrEqual(1)

    // Rendered row data
    expect(screen.getByText('student@example.com')).toBeTruthy()
    expect(screen.getAllByText('Học sinh').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Cấp mặc định')).toBeTruthy()
    expect(screen.getByText('+50')).toBeTruthy()

    // Pagination controls
    expect(screen.getByText(/Hiển thị/)).toBeTruthy()
    expect(screen.getByText('Trước')).toBeTruthy()
    expect(screen.getByText('Sau')).toBeTruthy()
  })

  it('should translate task codes in descriptions into Vietnamese', async () => {
    const { formatCreditTransactionDescription } = await import('@/lib/constants/credit')

    expect(formatCreditTransactionDescription('Tiêu thụ AI cho tác vụ QUESTION_GEN')).toBe(
      'Tiêu thụ AI cho tác vụ "Sinh đề"'
    )
    expect(
      formatCreditTransactionDescription('Hoàn credit do hủy hoặc lỗi khi gọi AI tác vụ STUDENT_HINT')
    ).toBe('Hoàn credit do hủy hoặc lỗi khi gọi AI tác vụ "Gợi ý tư duy làm bài"')
    expect(formatCreditTransactionDescription(null, 'CANVAS_LATEX')).toBe(
      'Tác vụ "Trợ lý AI Canvas (Chữ viết tay & Phác thảo)"'
    )
  })

  it('should adjust credit successfully when user is selected from combobox', async () => {
    render(<CreditQuotaTab />)

    // Mở combobox tìm người dùng
    const selectTrigger = screen.getByText('Chọn người dùng (email)...')
    fireEvent.click(selectTrigger)

    // Xác nhận tài khoản role ADMIN bị loại bỏ, không hiển thị trong danh sách
    expect(screen.queryByText('Quản trị viên Hệ thống')).toBeNull()

    // Chọn người dùng từ danh sách popover
    const userOption = await screen.findByText('Học sinh Test')
    fireEvent.click(userOption)

    // Nhập số credit
    const amountInput = screen.getByPlaceholderText('100 hoặc -50')
    fireEvent.change(amountInput, { target: { value: '50' } })

    // Nhập lý do
    const reasonInput = screen.getByPlaceholderText('Hoàn tiền lỗi hệ thống')
    fireEvent.change(reasonInput, { target: { value: 'Thưởng học sinh chăm chỉ' } })

    // Bấm nút điều chỉnh
    const submitBtn = screen.getByRole('button', { name: 'Điều chỉnh' })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(adjustCreditMock).toHaveBeenCalledWith({
        userId: 1,
        amount: 50,
        reason: 'Thưởng học sinh chăm chỉ',
      })
    })
  })
})
