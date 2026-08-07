import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import AdminLoginForm from '@/components/auth/admin-login-form'

// Mock next/navigation
let mockReason: string | null = null

vi.mock('next/navigation', () => ({
  useSearchParams: () => ({
    get: (key: string) => (key === 'reason' ? mockReason : null),
    toString: () => (mockReason ? 'reason=account_locked' : ''),
  }),
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
  usePathname: () => '/admin/login',
}))

// Mock Redux hooks
vi.mock('@/lib/redux/hooks', () => ({
  useAppDispatch: () => vi.fn(),
  useAppSelector: vi.fn(),
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

describe('AdminLoginForm Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsLoading = false
    mockLoginError = null
    mockReason = null
  })

  it('renders admin login form elements correctly', () => {
    render(<AdminLoginForm />)

    expect(screen.getByRole('heading', { name: 'Đăng nhập Hệ thống Quản trị' })).toBeInTheDocument()
    expect(screen.getByPlaceholderText('admin@mathclass.edu.vn')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Đăng nhập Quản trị' })).toBeInTheDocument()
  })

  it('displays validation errors when submitting empty form', async () => {
    render(<AdminLoginForm />)

    fireEvent.click(screen.getByRole('button', { name: 'Đăng nhập Quản trị' }))

    await waitFor(() => {
      expect(screen.getByText('Email là bắt buộc')).toBeInTheDocument()
      expect(screen.getByText('Mật khẩu là bắt buộc')).toBeInTheDocument()
    })
    expect(mockLogin).not.toHaveBeenCalled()
  })

  it('submits form with ADMIN expected role', async () => {
    render(<AdminLoginForm />)

    fireEvent.change(screen.getByPlaceholderText('admin@mathclass.edu.vn'), {
      target: { value: 'admin@mathclass.edu.vn' },
    })
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'admin123' },
    })

    fireEvent.click(screen.getByRole('button', { name: 'Đăng nhập Quản trị' }))

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith(
        { email: 'admin@mathclass.edu.vn', password: 'admin123' },
        false,
        'ADMIN'
      )
    })
  })

  it('opens account locked modal when reason=account_locked is present', async () => {
    mockReason = 'account_locked'

    render(<AdminLoginForm />)

    await waitFor(() => {
      expect(screen.getByText('Tài khoản của bạn đã bị khóa!')).toBeInTheDocument()
    })
  })

  it('opens account locked modal when login fails with locked message', async () => {
    mockLoginError = 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.'

    render(<AdminLoginForm />)

    await waitFor(() => {
      expect(screen.getByText('Tài khoản của bạn đã bị khóa!')).toBeInTheDocument()
    })
  })
})
