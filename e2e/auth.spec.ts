import { test, expect } from '@playwright/test'

test.describe('Authentication & Routing Flow', () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies()
  })

  test('unauthenticated users are redirected from protected routes to landing page', async ({ page }) => {
    // Attempt to access protected dashboard route without auth cookie
    await page.goto('/home')
    
    // Server/Proxy (proxy.ts) redirects unauthenticated request to '/'
    await expect(page).toHaveURL('http://localhost:3000/')
  })

  test('public landing page renders correctly', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL('http://localhost:3000/')
    await expect(page.getByRole('link', { name: 'Math Class' })).toBeVisible()
  })

  test('login form displays validation errors for empty inputs', async ({ page }) => {
    await page.goto('/login')

    // Click form submit button specifically
    await page.locator('button[type="submit"]').click()

    // Expect Zod validation messages
    await expect(page.getByText('Email là bắt buộc')).toBeVisible()
    await expect(page.getByText('Mật khẩu là bắt buộc')).toBeVisible()
  })

  test('user logs in successfully with mocked API response', async ({ page, context }) => {
    // Mock authentication API endpoint
    await page.route('**/api/v1/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'SUCCESS',
          message: 'Đăng nhập thành công',
          data: {
            id: 1,
            email: 'teacher@test.com',
            fullName: 'Thầy Giáo Toán',
            role: 'TEACHER',
          },
        }),
      })
    })

    // Mock dashboard home data API
    await page.route('**/api/v1/dashboard/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          totalClasses: 5,
          totalStudents: 120,
          totalAssignments: 15,
        }),
      })
    })

    const teacherUser = { id: 1, email: 'teacher@test.com', fullName: 'Thầy Giáo Toán', role: 'TEACHER' }
    const MOCK_TEACHER_JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiVEVBQ0hFUiIsInN1YiI6InRlYWNoZXJAdGVzdC5jb20ifQ.mock_signature'

    // Set cookies expected by proxy.ts middleware
    await context.addCookies([
      {
        name: 'mathclass_jwt',
        value: MOCK_TEACHER_JWT,
        url: 'http://localhost:3000',
      },
      {
        name: 'mathclass_role',
        value: 'TEACHER',
        url: 'http://localhost:3000',
      },
      {
        name: 'user_role',
        value: 'TEACHER',
        url: 'http://localhost:3000',
      },
      {
        name: 'user_info',
        value: encodeURIComponent(JSON.stringify(teacherUser)),
        url: 'http://localhost:3000',
      },
    ])

    await page.goto('/login')
    // Given valid cookies, proxy.ts automatically redirects authenticated users to /home
    await expect(page).toHaveURL(/.*\/home.*/)
  })
})
