import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AvatarUpload } from '@/components/profile/AvatarUpload'

const mockUploadAvatar = vi.fn()

vi.mock('@/hooks/useProfile', () => ({
  useUploadAvatar: () => ({
    mutate: mockUploadAvatar,
    mutateAsync: mockUploadAvatar,
    isPending: false
  })
}))

vi.mock('@/components/ui/avatar', () => ({
  Avatar: ({ children, className }: any) => <div className={className}>{children}</div>,
  AvatarImage: ({ src, alt, className }: any) => src ? <img src={src} alt={alt} className={className} /> : null,
  AvatarFallback: ({ children, className }: any) => <div className={className}>{children}</div>,
}))

describe('AvatarUpload', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    vi.clearAllMocks()
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    })
  })

  it('renders correctly with placeholder when no avatarUrl is provided', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <AvatarUpload currentAvatarUrl={undefined} fullName="John Doe" />
      </QueryClientProvider>
    )

    expect(screen.getByText('JD')).toBeInTheDocument()
  })

  it('renders image when avatarUrl is provided', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <AvatarUpload currentAvatarUrl="https://example.com/avatar.png" fullName="John Doe" />
      </QueryClientProvider>
    )

    const img = screen.getByAltText('John Doe')
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', expect.stringContaining('avatar.png'))
  })

  it('calls upload mutation when a file is selected', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <AvatarUpload currentAvatarUrl={undefined} fullName="John Doe" />
      </QueryClientProvider>
    )

    const file = new File(['hello'], 'hello.png', { type: 'image/png' })
    const input = document.querySelector('input[type="file"]') as HTMLInputElement

    fireEvent.change(input, { target: { files: [file] } })

    await waitFor(() => {
      expect(mockUploadAvatar).toHaveBeenCalledWith(file)
    })
  })
})
