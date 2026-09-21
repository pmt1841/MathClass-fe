import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import LoginForm from '@/components/auth/login-form'

// Mock next/navigation
let mockRole: string | null = null
let mockReason: string | null = null

vi.mock('next/navigation', () => ({
  useSearchParams: () => ({
    get: (key: string) => {
      if (key === 'role') return mockRole
      if (key === 'reason') return mockReason
      return null
    },
    toString: () => (mockReason ? 'reason=account_locked' : ''),
  }),
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
  usePathname: () => '/login',
}))

// Mock Redux hooks
let mockReduxRole: string | null = 'STUDENT'

const mockUseAppSelector = vi.fn()

vi.mock('@/lib/redux/hooks', () => ({
  useAppDispatch: () => vi.fn(),
  useAppSelector: (...args: any[]) => mockUseAppSelector(...args),
}))

// Mock SocialLoginButton to isolate LoginForm testing
vi.mock('@/components/auth/social-login-button', () => ({
  SocialLoginButton: () => <div data-testid="social-login-button" />,
}))

// Mock custom hook useLogin
const mockLogin = vi.fn()
const mockSetLoginError = vi.fn()
let mockIsLoading = false
let mockLoginError: string | null = null

vi.mock('@/hooks/useLogin', () => ({
  useLogin: () => ({
    login: mockLogin,
    isLoading: mockIsLoading,
    loginError: mockLoginError,
    setLoginError: mockSetLoginError,
  }),
}))

describe('LoginForm Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sessionStorage.clear()
    localStorage.clear()
    mockIsLoading = false
    mockLoginError = null
    mockRole = 'STUDENT'
    mockReason = null
    mockReduxRole = 'STUDENT'

    // Reset selector implementation so it reads mockReduxRole at call time
    mockUseAppSelector.mockImplementation((selector: (state: any) => any) =>
      selector({ auth: { selectedRole: mockReduxRole } })
    )
  })

  it('renders login form elements correctly', () => {
    render(<LoginForm />)

    expect(screen.getByRole('heading', { name: /Đăng nhập Học sinh/i })).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Nhập email')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Nhập mật khẩu')).toBeInTheDocument()
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

    fireEvent.change(screen.getByPlaceholderText('Nhập email'), {
      target: { value: 'student@example.com' },
    })
    fireEvent.change(screen.getByPlaceholderText('Nhập mật khẩu'), {
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

  it('defaults to STUDENT role when no explicit role is selected', async () => {
    mockRole = null
    mockReduxRole = null

    // Re-apply implementation after clearAllMocks with null role
    mockUseAppSelector.mockImplementation((selector: (state: any) => any) =>
      selector({ auth: { selectedRole: null } })
    )

    render(<LoginForm />)

    fireEvent.change(screen.getByPlaceholderText('Nhập email'), {
      target: { value: 'teacher@example.com' },
    })
    fireEvent.change(screen.getByPlaceholderText('Nhập mật khẩu'), {
      target: { value: 'password123' },
    })

    fireEvent.click(screen.getByRole('button', { name: 'Đăng nhập' }))

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith(
        { email: 'teacher@example.com', password: 'password123' },
        false,
        'STUDENT'
      )
    })
  })

  it('opens account locked modal when reason=account_locked is present', async () => {
    mockReason = 'account_locked'

    render(<LoginForm />)

    await waitFor(() => {
      expect(screen.getByText('Tài khoản của bạn đã bị khóa!')).toBeInTheDocument()
    })
  })

  it('opens account locked modal when login fails with locked message', async () => {
    mockLoginError = 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.'

    render(<LoginForm />)

    await waitFor(() => {
      expect(screen.getByText('Tài khoản của bạn đã bị khóa!')).toBeInTheDocument()
    })
  })
})
