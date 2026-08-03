import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import LoginForm from '@/components/auth/login-form'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useSearchParams: () => ({
    get: (key: string) => (key === 'role' ? 'STUDENT' : null),
    toString: () => '',
  }),
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
  usePathname: () => '/login',
}))

// Mock Redux hooks
vi.mock('@/lib/redux/hooks', () => ({
  useAppDispatch: () => vi.fn(),
  useAppSelector: vi.fn(),
}))

// Mock SocialLoginButton to isolate LoginForm testing
vi.mock('@/components/auth/social-login-button', () => ({
  SocialLoginButton: () => <div data-testid="social-login-button" />,
}))

// Mock custom hook useLogin
const mockLogin = vi.fn()
let mockIsLoading = false
let mockLoginError: string | null = null

vi.mock('@/hooks/useLogin', () => ({
  useLogin: () => ({
    login: mockLogin,
    isLoading: mockIsLoading,
    loginError: mockLoginError,
  }),
}))

describe('LoginForm Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsLoading = false
    mockLoginError = null
  })

  it('renders login form elements correctly', () => {
    render(<LoginForm />)

    expect(screen.getByRole('heading', { name: /Đăng nhập Học sinh/i })).toBeInTheDocument()
    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Đăng nhập' })).toBeInTheDocument()
    expect(screen.getByTestId('social-login-button')).toBeInTheDocument()
  })

  it('displays validation errors when submitting empty form', async () => {
    render(<LoginForm />)

    fireEvent.click(screen.getByRole('button', { name: 'Đăng nhập' }))

    await waitFor(() => {
      expect(screen.getByText('Email là bắt buộc')).toBeInTheDocument()
      expect(screen.getByText('Mật khẩu là bắt buộc')).toBeInTheDocument()
    })
    expect(mockLogin).not.toHaveBeenCalled()
  })

  it('submits form with valid data', async () => {
    render(<LoginForm />)

    fireEvent.change(screen.getByPlaceholderText('you@example.com'), {
      target: { value: 'student@example.com' },
    })
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'password123' },
    })

    fireEvent.click(screen.getByRole('button', { name: 'Đăng nhập' }))

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith(
        { email: 'student@example.com', password: 'password123' },
        false,
        'STUDENT'
      )
    })
  })
})
