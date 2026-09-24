import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AvatarUpload } from '@/components/profile/AvatarUpload'

// 1. Mock AvatarUploadModal độc lập, sạch sẽ và an toàn tuyệt đối với JSDOM
vi.mock('@/components/profile/AvatarUploadModal', () => ({
  AvatarUploadModal: ({ open, onUploadSuccess }: any) => {
    if (!open) return null
    return (
      <div data-testid="mock-avatar-modal">
        <button onClick={() => onUploadSuccess?.('https://example.com/new-avatar.jpg')}>
          Kích hoạt upload thành công
        </button>
      </div>
    )
  }
}))

// 2. Mock Avatar UI components
vi.mock('@/components/ui/avatar', () => ({
  Avatar: ({ children, className }: any) => <div className={className}>{children}</div>,
  AvatarImage: ({ src, alt, className }: any) => src ? <img src={src} alt={alt} className={className} /> : null,
  AvatarFallback: ({ children, className }: any) => <div className={className}>{children}</div>,
}))

describe('AvatarUpload Component', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    vi.clearAllMocks()
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
  })

  it('1. Hiển thị avatar fallback viết tắt khi không có avatarUrl', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <AvatarUpload currentAvatarUrl={undefined} fullName="Nguyen Van A" />
      </QueryClientProvider>
    )
    expect(screen.getByText('NA')).toBeInTheDocument()
  })

  it('2. Hiển thị đúng thẻ img khi có avatarUrl', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <AvatarUpload currentAvatarUrl="https://example.com/avatar.png" fullName="John Doe" />
      </QueryClientProvider>
    )
    const img = screen.getByAltText('John Doe')
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', 'https://example.com/avatar.png')
  })

  it('3. Mở Modal khi người dùng nhấn nút "Thay đổi ảnh"', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <AvatarUpload currentAvatarUrl={undefined} fullName="John Doe" />
      </QueryClientProvider>
    )

    // Ban đầu modal chưa mở
    expect(screen.queryByTestId('mock-avatar-modal')).not.toBeInTheDocument()

    // Bấm nút mở modal
    const button = screen.getByRole('button', { name: /thay đổi ảnh/i })
    fireEvent.click(button)

    // Modal đã mở ra
    expect(screen.getByTestId('mock-avatar-modal')).toBeInTheDocument()
  })

  it('4. Khóa tính năng đổi ảnh đối với tài khoản Google', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <AvatarUpload currentAvatarUrl={undefined} fullName="Google User" isGoogleUser={true} />
      </QueryClientProvider>
    )

    const button = screen.getByRole('button', { name: /thay đổi ảnh/i })
    expect(button).toBeDisabled()

    // Thử click nhưng modal vẫn không được mở
    fireEvent.click(button)
    expect(screen.queryByTestId('mock-avatar-modal')).not.toBeInTheDocument()
  })

  it('5. Nhận callback onUploadSuccess khi modal hoàn tất upload', () => {
    const handleSuccess = vi.fn()

    render(
      <QueryClientProvider client={queryClient}>
        <AvatarUpload currentAvatarUrl={undefined} fullName="John Doe" onUploadSuccess={handleSuccess} />
      </QueryClientProvider>
    )

    // Mở modal
    fireEvent.click(screen.getByRole('button', { name: /thay đổi ảnh/i }))

    // Kích hoạt upload từ modal
    fireEvent.click(screen.getByText('Kích hoạt upload thành công'))

    expect(handleSuccess).toHaveBeenCalledWith('https://example.com/new-avatar.jpg')
  })
})
