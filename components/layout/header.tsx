'use client'

import { Calculator, Bell, LogOut, User, ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface UserInfo {
  fullName?: string
  email?: string
  userRole?: string
}

export function DashboardHeader() {
  const router = useRouter()
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)

  useEffect(() => {
    const stored =
      sessionStorage.getItem('user_info') ||
      localStorage.getItem('user_info')
    if (stored) {
      try {
        setUserInfo(JSON.parse(stored))
      } catch { }
    }
  }, [])

  const handleLogout = () => {
    // Clear cookies
    document.cookie = 'auth_token=; path=/; max-age=0'
    document.cookie = 'user_role=; path=/; max-age=0'
    // Clear storage
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user_info')
    sessionStorage.removeItem('auth_token')
    sessionStorage.removeItem('user_info')
    router.push('/login')
  }

  const role = userInfo?.userRole
  const displayName = userInfo?.fullName || userInfo?.email || 'Người dùng'
  const roleLabel = role === 'TEACHER' ? 'Giáo viên' : 'Học sinh'
  const roleColor = role === 'TEACHER' ? 'bg-white text-accent' : 'bg-white text-black'

  return (
    <header className="sticky top-0 z-50 w-full bg-primary shadow-sm">
      <div className="mx-auto max-w-screen-xl px-6 py-2">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/home" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent">
              <Calculator className="h-5 w-5 text-accent-foreground" />
            </div>
            <span className="text-xl font-bold text-primary-foreground">Math Class</span>
          </Link>

          {/* Right: User menu */}
          <div className="flex items-center gap-3">
            {/* Notification bell */}
            <button className="relative flex h-9 w-9 items-center justify-center rounded-lg text-primary-foreground/80 hover:bg-primary-foreground/10 transition-colors">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-accent" />
            </button>

            {/* User dropdown */}
            <div className="relative">
              <button
                id="user-menu-btn"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 hover:bg-primary-foreground/10 transition-colors"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-foreground/20">
                  <User className="h-4 w-4 text-primary-foreground" />
                </div>
                <div className="hidden sm:flex flex-col items-start justify-center text-left">
                  <p className="text-sm font-semibold text-primary-foreground leading-tight">{displayName}</p>
                  <span className={`mt-0.5 inline-block rounded-full px-2 py-[2px] text-[10px] font-medium ${roleColor}`}>
                    {roleLabel}
                  </span>
                </div>
                <ChevronDown className={`h-4 w-4 text-primary-foreground/70 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown menu */}
              {dropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setDropdownOpen(false)}
                  />
                  <div className="absolute right-0 top-full z-20 mt-2 w-52 rounded-xl bg-white border border-border shadow-xl overflow-hidden">
                    <div className="px-4 py-3 border-b border-border bg-muted/30">
                      <p className="font-semibold text-foreground text-sm">{displayName}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{userInfo?.email}</p>
                    </div>
                    <div className="p-1.5">
                      <Link
                        href="/profile"
                        className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                        onClick={() => setDropdownOpen(false)}
                      >
                        <User className="h-4 w-4 text-muted-foreground" />
                        Hồ sơ cá nhân
                      </Link>
                      <button
                        id="logout-btn"
                        onClick={() => {
                          setDropdownOpen(false)
                          setShowLogoutModal(true)
                        }}
                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-destructive hover:bg-destructive/5 transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        Đăng xuất
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <AlertDialog open={showLogoutModal} onOpenChange={setShowLogoutModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận đăng xuất</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn đăng xuất khỏi tài khoản này?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="bg-white text-black border border-input hover:bg-neutral-800 hover:text-white transition-colors"
            >
              Hủy
            </AlertDialogCancel>

            <AlertDialogAction
              onClick={handleLogout}
              className="bg-white text-red-600 border border-red-200 hover:bg-red-600 hover:text-white transition-colors"
            >
              Đăng xuất
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </header>
  )
}
