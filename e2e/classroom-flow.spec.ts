import { test, expect } from '@playwright/test'

const MOCK_TEACHER_JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiVEVBQ0hFUiIsInN1YiI6InRlYWNoZXJAdGVzdC5jb20ifQ.mock_signature'
const MOCK_STUDENT_JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiU1RVIERFTlQiLCJzdWIiOiJzdHVkZW50QHRlc3QuY29tIn0.mock_signature'

test.describe('Classroom Management E2E Flow', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies()

    // Prevent notification SSE / API 401 from triggering axios redirect
    await page.route('**/notifications**', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
    })
    await page.route('**/join-requests/my-requests**', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
    })
  })

  test('Teacher creates a new classroom and sees the class card', async ({ page, context }) => {
    const teacherUser = {
      id: 1,
      email: 'teacher@test.com',
      fullName: 'Thầy Giáo Toán',
      role: 'TEACHER',
      permissions: ['classroom:create', 'classroom:view'],
    }

    await page.addInitScript(() => {
      localStorage.setItem('auth_persistence', 'persistent')
    })

    // Mock /users/profile required by AuthInitializer
    await page.route('**/users/profile**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(teacherUser),
      })
    })

    // Mock my-classroom list API
    await page.route('**/classrooms/my-classroom', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 10,
            className: 'Toán 12A1 - Đại số nâng cao',
            classCode: 'MATH12A1',
            teacherId: 1,
            teacherName: 'Thầy Giáo Toán',
            studentCount: 35,
            maxStudents: 40,
          },
        ]),
      })
    })

    // Mock create classroom POST API
    await page.route('**/classrooms/create', async (route) => {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 11,
          className: 'Toán 11B2 - Hình học Không gian',
          classCode: 'MATH11B2',
          teacherId: 1,
          teacherName: 'Thầy Giáo Toán',
          studentCount: 0,
          maxStudents: 30,
        }),
      })
    })

    // Set TEACHER role cookies for proxy.ts
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

    await page.goto('/classes')

    // Expect page heading
    await expect(page.getByRole('heading', { name: /Lớp học của tôi/i })).toBeVisible()
    await expect(page.getByText('Toán 12A1 - Đại số nâng cao')).toBeVisible()

    // Open create class modal
    await page.getByRole('button', { name: /Tạo lớp học mới/i }).first().click()

    // Expect modal to be open
    await expect(page.getByRole('heading', { name: 'Tạo lớp học mới' })).toBeVisible()

    // Fill form fields
    await page.getByPlaceholder('VD: Toán 10A - Đại số cơ bản').fill('Toán 11B2 - Hình học Không gian')
    await page.locator('#class-max-students').fill('30')
    await page.getByPlaceholder('Mô tả ngắn về nội dung, mục tiêu của lớp học...').fill('Lớp chuyên đề Hình học không gian')

    // Submit form
    await page.locator('#submit-create-class').click()

    // Modal closes after submit
    await expect(page.getByRole('heading', { name: 'Tạo lớp học mới' })).not.toBeVisible()
  })

  test('Student views joined classroom list', async ({ page, context }) => {
    const studentUser = {
      id: 2,
      email: 'student@test.com',
      fullName: 'Em Học Sinh',
      role: 'STUDENT',
      permissions: ['classroom:join', 'classroom:view'],
    }

    await page.addInitScript(() => {
      localStorage.setItem('auth_persistence', 'persistent')
    })

    // Mock /users/profile for Student
    await page.route('**/users/profile**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(studentUser),
      })
    })

    // Mock my-classroom list for Student
    await page.route('**/classrooms/my-classroom', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 10,
            className: 'Toán 12A1 - Đại số nâng cao',
            classCode: 'MATH12A1',
            teacherId: 1,
            teacherName: 'Thầy Giáo Toán',
            studentCount: 35,
            maxStudents: 40,
          },
        ]),
      })
    })

    // Set STUDENT role cookies
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

    await page.goto('/classes')

    // Expect Student class list view
    await expect(page.getByRole('heading', { name: /Lớp học của tôi/i })).toBeVisible()
    await expect(page.getByText('Toán 12A1 - Đại số nâng cao')).toBeVisible()
  })
})
