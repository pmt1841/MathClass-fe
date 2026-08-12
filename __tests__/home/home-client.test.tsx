import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { HomeClient } from '@/app/(dashboard)/home/_components/home-client'
import { authStorage } from '@/lib/auth-storage'

// Mock the child components so we don't render the whole heavy dashboard
vi.mock('@/app/(dashboard)/home/_components/student-client', () => ({
  StudentDashboardClient: () => <div data-testid="student-dashboard">Student Dashboard</div>
}))

vi.mock('@/app/(dashboard)/home/_components/teacher-client', () => ({
  TeacherDashboardClient: () => <div data-testid="teacher-dashboard">Teacher Dashboard</div>
}))

describe('HomeClient', () => {
  beforeEach(() => {
    // Clear localStorage and cookies before each test
    authStorage.clearUserInfo()
    window.localStorage.clear()
    window.sessionStorage.clear()
  })

  it('renders StudentDashboardClient when role is STUDENT', async () => {
    authStorage.setUserInfo({ role: 'STUDENT' }, true)
    
    render(<HomeClient />)
    
    // Wait for the loading state to finish
    await waitFor(() => {
      expect(screen.getByTestId('student-dashboard')).toBeInTheDocument()
    })
    expect(screen.queryByTestId('teacher-dashboard')).not.toBeInTheDocument()
  })

  it('renders TeacherDashboardClient when role is TEACHER', async () => {
    authStorage.setUserInfo({ role: 'TEACHER' }, true)
    
    render(<HomeClient />)
    
    await waitFor(() => {
      expect(screen.getByTestId('teacher-dashboard')).toBeInTheDocument()
    })
    expect(screen.queryByTestId('student-dashboard')).not.toBeInTheDocument()
  })

  it('does not render dashboards and shows loading state if no role is found', async () => {
    // Empty local storage
    render(<HomeClient />)
    
    await waitFor(() => {
      expect(screen.getByText('Đang tải giao diện...')).toBeInTheDocument()
    })
    expect(screen.queryByTestId('student-dashboard')).not.toBeInTheDocument()
    expect(screen.queryByTestId('teacher-dashboard')).not.toBeInTheDocument()
  })
})
