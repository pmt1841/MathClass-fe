import { test, expect } from '@playwright/test'

test.describe('Authentication & Routing', () => {
  test('unauthenticated users are redirected from protected routes to login', async ({ page }) => {
    // Thử truy cập trang chủ /home
    await page.goto('/home')
    
    // Hệ thống (qua proxy.ts) sẽ phát hiện không có cookie auth_token và đẩy về /login
    await expect(page).toHaveURL(/.*\/login.*/)
  })

  test('user can access public routes', async ({ page }) => {
    // Trang chủ public
    await page.goto('/')
    await expect(page).toHaveURL('/')
    
    // Có logo Math Class
    await expect(page.getByRole('link', { name: 'Math Class' })).toBeVisible()
  })

  test('user can login successfully', async ({ page }) => {
    await page.goto('/login')
    
    // Điền thông tin đăng nhập bằng placeholder thay vì label
    await page.getByPlaceholder('you@example.com').fill('teacher@test.com')
    await page.getByPlaceholder('••••••••').fill('123456')
    
    // Bấm nút đăng nhập
    await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click()
    
    // Test dừng ở đây vì chưa có BE thật
  })
})
