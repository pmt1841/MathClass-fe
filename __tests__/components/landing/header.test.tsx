import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Header } from '@/components/landing/header'

let mockPathname = '/'
let mockSelectedRole: string = 'STUDENT'
const mockDispatch = vi.fn()

vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
  useRouter: () => ({
    push: vi.fn(),
  }),
}))

vi.mock('@/lib/redux/hooks', () => ({
  useAppSelector: (selector: any) =>
    selector({
      auth: {
        selectedRole: mockSelectedRole,
      },
    }),
  useAppDispatch: () => mockDispatch,
}))

describe('Landing Header Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPathname = '/'
    mockSelectedRole = 'STUDENT'
  })

  it('hides login button and displays "Dùng thử miễn phí" on landing page', () => {
    mockPathname = '/'
    render(<Header />)

    // Nút đăng nhập phải bị ẩn trên landing page
    expect(screen.queryByRole('button', { name: /Đăng nhập/i })).not.toBeInTheDocument()
    // Nút Dùng thử miễn phí hiển thị
    expect(screen.getByRole('button', { name: 'Dùng thử miễn phí' })).toBeInTheDocument()
  })

  it('shows switch to "Đăng nhập Giáo viên" when on login page with student role', () => {
    mockPathname = '/login'
    mockSelectedRole = 'STUDENT'
    render(<Header />)

    // Khi đang ở cổng Học sinh, nút đổi vai trò trên header hiển thị "Đăng nhập Giáo viên"
    expect(screen.getByRole('button', { name: 'Đăng nhập Giáo viên' })).toBeInTheDocument()
  })

  it('shows switch to "Đăng nhập Học sinh" when on login page with teacher role', () => {
    mockPathname = '/login'
    mockSelectedRole = 'TEACHER'
    render(<Header />)

    // Khi đang ở cổng Giáo viên, nút đổi vai trò trên header hiển thị "Đăng nhập Học sinh"
    expect(screen.getByRole('button', { name: 'Đăng nhập Học sinh' })).toBeInTheDocument()
  })
})
