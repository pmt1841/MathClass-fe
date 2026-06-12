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
    
    // Có nút đăng nhập
    const loginLink = page.locator('a[href="/login"]').first()
    await expect(loginLink).toBeVisible()
  })
})
