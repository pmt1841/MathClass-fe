import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ProfileForm } from '@/components/profile/ProfileForm'
import { UserResponse } from '@/types'

const mockUser: UserResponse = {
  id: 1,
  email: 'test@example.com',
  fullName: 'John Doe',
  role: 'STUDENT',
  isActive: true,
  phoneNumber: '0123456789',
  gender: 'MALE',
  dateOfBirth: '01-01-2000'
}

const mockUpdateProfile = vi.fn()

vi.mock('@/hooks/useProfile', () => ({
  useProfile: () => ({ data: mockUser, isLoading: false }),
  useUpdateProfile: () => ({
    mutate: mockUpdateProfile,
    mutateAsync: mockUpdateProfile,
    isPending: false
  })
}))

describe('ProfileForm', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    vi.clearAllMocks()
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    })
  })

  it('renders correctly with initial data', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ProfileForm initialData={mockUser} />
      </QueryClientProvider>
    )

    expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument()
    expect(screen.getByDisplayValue('0123456789')).toBeInTheDocument()
    expect(screen.getByText('01')).toBeInTheDocument()
    expect(screen.getByText('Tháng 01')).toBeInTheDocument()
    expect(screen.getByText('2000')).toBeInTheDocument()
  })

  it('shows validation errors when fields are empty', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ProfileForm initialData={{} as any} />
      </QueryClientProvider>
    )

    const submitButton = screen.getByRole('button', { name: /lưu thay đổi/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Họ tên không được để trống')).toBeInTheDocument()
    })
  })

  it('calls updateProfile mutation when form is submitted with valid data', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ProfileForm initialData={mockUser} />
      </QueryClientProvider>
    )

    const nameInput = screen.getByDisplayValue('John Doe')
    fireEvent.change(nameInput, { target: { value: 'Jane Doe' } })

    const submitButton = screen.getByRole('button', { name: /lưu thay đổi/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockUpdateProfile).toHaveBeenCalled()
    })
  })
})
