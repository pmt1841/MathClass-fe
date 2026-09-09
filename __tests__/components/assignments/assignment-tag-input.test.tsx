import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AssignmentTagInput } from '@/components/assignments/assignment-tag-input'
import { assignmentService } from '@/services/assignmentService'

vi.mock('@/services/assignmentService', () => ({
  assignmentService: {
    getTags: vi.fn(),
  },
}))

describe('AssignmentTagInput Component', () => {
  const mockOnChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(assignmentService.getTags).mockResolvedValue([
      { id: 1, name: 'Đại số' },
      { id: 2, name: 'Hình học' },
    ])
  })

  it('renders existing tags as chips', () => {
    render(<AssignmentTagInput value={['Lớp 10', 'Bất đẳng thức']} onChange={mockOnChange} />)
    expect(screen.getByText('Lớp 10')).toBeInTheDocument()
    expect(screen.getByText('Bất đẳng thức')).toBeInTheDocument()
  })

  it('calls onChange with updated array when clicking x button on chip', () => {
    render(<AssignmentTagInput value={['Lớp 10', 'Hình học']} onChange={mockOnChange} />)
    const removeButtons = screen.getAllByTitle('Xóa tag')
    fireEvent.click(removeButtons[0])
    expect(mockOnChange).toHaveBeenCalledWith(['Hình học'])
  })

  it('removes last tag when pressing Backspace in empty input', () => {
    render(<AssignmentTagInput value={['Lớp 10', 'Hình học']} onChange={mockOnChange} />)
    const input = screen.getByPlaceholderText('Thêm tag khác...')
    fireEvent.keyDown(input, { key: 'Backspace' })
    expect(mockOnChange).toHaveBeenCalledWith(['Lớp 10'])
  })

  it('adds tag when pressing Enter with input value', () => {
    render(<AssignmentTagInput value={[]} onChange={mockOnChange} />)
    const input = screen.getByPlaceholderText('Nhập tag bài tập...')
    fireEvent.change(input, { target: { value: 'Hình không gian' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(mockOnChange).toHaveBeenCalledWith(['Hình không gian'])
  })

  it('auto-commits typed input text on blur', () => {
    render(<AssignmentTagInput value={[]} onChange={mockOnChange} />)
    const input = screen.getByPlaceholderText('Nhập tag bài tập...')
    fireEvent.change(input, { target: { value: 'Tự luận' } })
    fireEvent.blur(input)
    expect(mockOnChange).toHaveBeenCalledWith(['Tự luận'])
  })

  it('renders autocomplete dropdown suggestions when user types text', async () => {
    render(<AssignmentTagInput value={[]} onChange={mockOnChange} />)
    const input = screen.getByPlaceholderText('Nhập tag bài tập...')
    fireEvent.change(input, { target: { value: 'Đại' } })

    await waitFor(() => {
      expect(assignmentService.getTags).toHaveBeenCalledWith('Đại')
    })
  })
})
