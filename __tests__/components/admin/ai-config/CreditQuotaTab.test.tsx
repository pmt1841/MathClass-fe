import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { CreditQuotaTab } from '@/components/admin/ai-config/CreditQuotaTab'

const updateTaskConfig = vi.fn().mockResolvedValue({})
const updateDefaultCredits = vi.fn().mockResolvedValue({})

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
  useAdjustCredit: () => ({ mutateAsync: vi.fn() }),
  useAdminCreditTransactions: () => ({ data: [], isLoading: false }),
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
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
})
