import { test, expect } from '@playwright/test'

const MOCK_TEACHER_JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiVEVBQ0hFUiIsInN1YiI6InRlYWNoZXJAdGVzdC5jb20ifQ.mock_signature'
const MOCK_STUDENT_JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiU1RVIERFTlQiLCJzdWIiOiJzdHVkZW50QHRlc3QuY29tIn0.mock_signature'

test.describe('Assignment & KaTeX Math Formula E2E Flow', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies()

    // Prevent notification SSE / API 401 from triggering axios redirect
    await page.route('**/notifications**', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
    })
    await page.route('**/classrooms**', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
    })
  })

  test('Teacher views assignment library and sees creation button', async ({ page, context }) => {
    const teacherUser = {
      id: 1,
      email: 'teacher@test.com',
      fullName: 'Thầy Giáo Toán',
      role: 'TEACHER',
      permissions: ['assignment:view', 'assignment:create', 'assignment:delete'],
    }

    // Mock /users/profile required by AuthInitializer in StoreProvider.tsx
    await page.route('**/users/profile**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(teacherUser),
      })
    })

    // Mock API endpoints for assignment list
    await page.route(url => url.pathname.includes('/assignments') && url.pathname !== '/assignments', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          content: [
            {
              id: 101,
              title: 'Bài tập Khảo sát Hàm số Bậc ba',
              description: 'Cho hàm số $y = x^3 - 3x + 2$. Tìm khoảng đồng biến.',
              status: 'DRAFT',
              type: 'SINGLE',
              maxScore: 10,
            },
          ],
          totalPages: 1,
          totalElements: 1,
        }),
      })
    })

    // Mock assignment-sheets endpoint
    await page.route('**/assignment-sheets**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ content: [], totalPages: 0 }),
      })
    })

    // Set authenticated cookies expected by proxy.ts middleware
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

    await page.goto('/assignments')

    // Page renders "Kho bài tập" header for Teacher
    await expect(page.getByRole('heading', { name: /Kho bài tập/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /Tạo bài tập mới/i })).toBeVisible()
  })

  test('Student views assignment list with KaTeX Math rendering', async ({ page, context }) => {
    const studentUser = {
      id: 2,
      email: 'student@test.com',
      fullName: 'Em Học Sinh',
      role: 'STUDENT',
      permissions: ['assignment:view'],
    }

    // Mock /users/profile required by AuthInitializer
    await page.route('**/users/profile**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(studentUser),
      })
    })

    // Mock assignments endpoint for Student with future deadline
    await page.route(url => url.pathname.includes('/assignments') && url.pathname !== '/assignments', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          content: [
            {
              id: 101,
              title: 'Bài tập Khảo sát Hàm số Bậc ba',
              description: 'Cho hàm số $y = x^3 - 3x + 2$',
              submissionStatus: null,
              deadline: '2099-12-31T23:59:59Z',
              type: 'SINGLE',
              maxScore: 10,
            },
          ],
          totalPages: 1,
          totalElements: 1,
        }),
      })
    })

    // Mock assignment-sheets endpoint for Student
    await page.route('**/assignment-sheets**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ content: [], totalPages: 0 }),
      })
    })

    // Set STUDENT role cookies for Next.js proxy middleware
    await context.addCookies([
      {
        name: 'mathclass_jwt',
        value: MOCK_STUDENT_JWT,
        domain: 'localhost',
        path: '/',
      },
      {
        name: 'mathclass_role',
        value: 'STUDENT',
        domain: 'localhost',
        path: '/',
      },
    ])

    await page.goto('/assignments')

    // Page renders "Bài tập được giao" header for Student
    await expect(page.getByRole('heading', { name: /Bài tập được giao/i })).toBeVisible()
    await expect(page.getByText('Bài tập Khảo sát Hàm số Bậc ba')).toBeVisible()
  })
})
