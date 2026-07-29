import { test, expect } from '@playwright/test'

const MOCK_TEACHER_JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiVEVBQ0hFUiIsInN1YiI6InRlYWNoZXJAdGVzdC5jb20ifQ.mock_signature'

test.describe('User Profile E2E Flow', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies()

    // Prevent notification SSE 401 redirect
    await page.route('**/notifications**', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
    })
  })

  test('User renders profile page and updates phone number', async ({ page, context }) => {
    const initialUser = {
      id: 1,
      email: 'teacher@test.com',
      fullName: 'Thầy Giáo Toán',
      role: 'TEACHER',
      phoneNumber: '0912345678',
      gender: 'MALE',
      dateOfBirth: '1990-05-15',
      provider: 'LOCAL',
    }

    await page.addInitScript(() => {
      localStorage.setItem('auth_persistence', 'persistent')
    })

    // Mock /users/profile GET API
    await page.route('**/users/profile**', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(initialUser),
        })
      } else if (route.request().method() === 'PUT') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            ...initialUser,
            phoneNumber: '0988776655',
          }),
        })
      } else {
        await route.continue()
      }
    })

    // Set authenticated cookies for proxy.ts
    await context.addCookies([
      {
        name: 'mathclass_jwt',
        value: MOCK_TEACHER_JWT,
        domain: 'localhost',
        path: '/',
      },
      {
        name: 'mathclass_role',
        value: 'TEACHER',
        domain: 'localhost',
        path: '/',
      },
    ])

    await page.goto('/profile')

    // Page renders Profile header and initial full name & email
    await expect(page.getByRole('heading', { name: /Hồ sơ cá nhân/i })).toBeVisible()
    await expect(page.getByPlaceholder('Nhập họ và tên...')).toHaveValue('Thầy Giáo Toán')

    // Update Phone Number field
    const phoneInput = page.getByPlaceholder('Nhập số điện thoại...')
    await phoneInput.fill('0988776655')

    // Click submit button
    await page.getByRole('button', { name: /Lưu thay đổi/i }).click()

    // Expect updated phone number value
    await expect(phoneInput).toHaveValue('0988776655')
  })
})
