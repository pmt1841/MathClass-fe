import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MediaUploadModal } from '@/components/ui/media-upload-modal'

describe('MediaUploadModal Component', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onUploadImage: vi.fn(),
    onUploadImages: vi.fn(),
    onUploadFile: vi.fn(),
    onInsertLink: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    // Mock URL.createObjectURL and URL.revokeObjectURL
    global.URL.createObjectURL = vi.fn(() => 'blob:http://localhost/fake-image-url')
    global.URL.revokeObjectURL = vi.fn()
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

  it('renders preview grid when multiple files are selected', async () => {
    render(<MediaUploadModal {...defaultProps} initialMode="image" />)

    const file1 = new File(['image1'], 'photo1.jpg', { type: 'image/jpeg' })
    const file2 = new File(['image2'], 'photo2.png', { type: 'image/png' })

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    expect(fileInput).not.toBeNull()

    fireEvent.change(fileInput, { target: { files: [file1, file2] } })

    expect(await screen.findByText('photo1.jpg')).toBeInTheDocument()
    expect(await screen.findByText('photo2.png')).toBeInTheDocument()
    expect(screen.getByText(/Đã chọn 2 ảnh/i)).toBeInTheDocument()
  })

  it('removes item from list when delete button is clicked', async () => {
    render(<MediaUploadModal {...defaultProps} initialMode="image" />)

    const file = new File(['image1'], 'photo-to-remove.jpg', { type: 'image/jpeg' })
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement

    fireEvent.change(fileInput, { target: { files: [file] } })

    expect(await screen.findByText('photo-to-remove.jpg')).toBeInTheDocument()

    const deleteBtn = screen.getByTitle('Xóa')
    fireEvent.click(deleteBtn)

    expect(screen.queryByText('photo-to-remove.jpg')).not.toBeInTheDocument()
  })
})
