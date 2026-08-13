'use client'

import { baseURL } from './axios'
import { authStorage } from './auth-storage'

const TAB_STORAGE_KEY = 'mathclass_open_tabs'

export const tabLifecycleService = {
  /**
   * Tạo ID duy nhất cho Tab hiện tại
   */
  generateTabId(): string {
    return `tab_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  },

  /**
   * Lấy danh sách các Tab ID đang mở từ localStorage
   */
  getOpenTabs(): string[] {
    if (typeof window === 'undefined') return []
    try {
      const data = localStorage.getItem(TAB_STORAGE_KEY)
      return data ? JSON.parse(data) : []
    } catch (e) {
      return []
    }
  },

  /**
   * Đăng ký Tab hiện tại vào danh sách đang hoạt động
   */
  registerTab(tabId: string): void {
    if (typeof window === 'undefined') return
    try {
      const tabs = this.getOpenTabs()
      if (!tabs.includes(tabId)) {
        tabs.push(tabId)
        localStorage.setItem(TAB_STORAGE_KEY, JSON.stringify(tabs))
      }
    } catch (e) {
      // ignore
    }
  },

  /**
   * Bỏ đăng ký Tab hiện tại khỏi danh sách khi đóng tab
   */
  unregisterTab(tabId: string): string[] {
    if (typeof window === 'undefined') return []
    try {
      const tabs = this.getOpenTabs()
      const remaining = tabs.filter((id) => id !== tabId)
      localStorage.setItem(TAB_STORAGE_KEY, JSON.stringify(remaining))
      return remaining
    } catch (e) {
      return []
    }
  },

  /**
   * Kiểm tra xem người dùng có chọn "Ghi nhớ đăng nhập" hay không
   */
  isRemembered(): boolean {
    if (typeof window === 'undefined') return false
    const isPersistent = localStorage.getItem('auth_persistence') === 'persistent'
    const hasRememberCookie = !!authStorage.getCookie('mathclass_remember')
    return isPersistent || hasRememberCookie
  },

  /**
   * Dọn dẹp phiên khi Tab cuối cùng bị đóng (nếu không chọn Remember Me)
   */
  cleanupSessionIfLastTab(tabId: string): void {
    if (typeof window === 'undefined') return

    const remainingTabs = this.unregisterTab(tabId)
    const isRememberedMode = this.isRemembered()

    // Nếu KHÔNG tích "Ghi nhớ đăng nhập" VÀ đây là Tab cuối cùng của ứng dụng bị đóng
    if (!isRememberedMode && remainingTabs.length === 0) {
      // Dọn dẹp local storage và cookie client-side
      authStorage.clearToken()
      authStorage.clearUserInfo()

      // Gửi request ngầm bằng sendBeacon tới Backend để hủy HttpOnly Cookie
      if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
        const logoutUrl = `${baseURL}/auth/logout`
        const blob = new Blob([JSON.stringify({})], { type: 'application/json' })
        navigator.sendBeacon(logoutUrl, blob)
      }
    }
  },
}
