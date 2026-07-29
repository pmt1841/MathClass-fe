import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MediaUploadModal } from '@/components/ui/media-upload-modal'

describe('MediaUploadModal Component', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onUploadImage: vi.fn(),
    onUploadFile: vi.fn(),
    onInsertLink: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('does not render when isOpen is false', () => {
    const { container } = render(<MediaUploadModal {...defaultProps} isOpen={false} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders mode tabs correctly and switches mode', () => {
    render(<MediaUploadModal {...defaultProps} initialMode="image" />)

    expect(screen.getByRole('button', { name: /Tải ảnh/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Tải file/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Chèn Link/i })).toBeInTheDocument()

    // Switch to Link mode
    fireEvent.click(screen.getByRole('button', { name: /Chèn Link/i }))
    expect(screen.getByPlaceholderText('https://example.com...')).toBeInTheDocument()
  })

  it('submits link when URL is entered', () => {
    render(<MediaUploadModal {...defaultProps} initialMode="link" />)

    const urlInput = screen.getByPlaceholderText('https://example.com...')
    const textInput = screen.getByPlaceholderText('Ví dụ: Tham khảo bài viết')

    fireEvent.change(urlInput, { target: { value: 'https://mathclass.edu.vn' } })
    fireEvent.change(textInput, { target: { value: 'Nguồn bài toán' } })

    fireEvent.click(screen.getByRole('button', { name: /Xác nhận/i }))

    expect(defaultProps.onInsertLink).toHaveBeenCalledWith(
      'https://mathclass.edu.vn',
      'Nguồn bài toán'
    )
    expect(defaultProps.onClose).toHaveBeenCalled()
  })
})
