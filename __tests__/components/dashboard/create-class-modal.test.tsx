import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { CreateClassModal } from '@/components/dashboard/create-class-modal'

// Tạm thời mock api để không thực sự gửi network request
vi.mock('@/lib/axios', () => ({
  __esModule: true,
  api: {
    post: vi.fn().mockResolvedValue({ data: { message: 'Success', class: { id: 1 } } })
  }
}))

describe('CreateClassModal Component', () => {
  it('renders modal when open is true', () => {
    render(<CreateClassModal open={true} onClose={vi.fn()} onSuccess={vi.fn()} />)
    
    // Dialog title
    expect(screen.getByText('Tạo lớp học mới')).toBeInTheDocument()
    // Fields
    expect(screen.getByPlaceholderText('VD: Toán 10A - Đại số cơ bản')).toBeInTheDocument()
  })

  it('shows validation errors if fields are empty and submitted', async () => {
    render(<CreateClassModal open={true} onClose={vi.fn()} onSuccess={vi.fn()} />)
    
    // Find the submit button
    const submitBtn = screen.getByRole('button', { name: 'Tạo lớp học' })
    fireEvent.click(submitBtn)
    
    // React Hook Form validation might take a tick
    await waitFor(() => {
      // Tìm thấy lỗi bắt buộc nhập tên lớp
      expect(screen.getByText('Vui lòng điền tên lớp học')).toBeInTheDocument()
    })
  })
})
