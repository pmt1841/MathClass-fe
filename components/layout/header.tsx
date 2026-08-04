'use client'

import { Calculator, LogOut, User, ChevronDown, Settings } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
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
import { NotificationPopover } from './NotificationPopover'
import { useAuth } from '@/hooks/useAuth'

export function DashboardHeader() {
  const { user, logout } = useAuth()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)

  const role = user?.role || (user as any)?.userRole
  const displayName = user?.fullName || user?.email || 'Người dùng'
  const roleLabel = role === 'ADMIN' ? 'Quản trị viên' : role === 'TEACHER' ? 'Giáo viên' : 'Học sinh'
  const roleColor = role === 'ADMIN' ? 'bg-red-500 text-white' : role === 'TEACHER' ? 'bg-white text-blue-600 font-semibold shadow-xs' : 'bg-white text-slate-800 font-medium'
  const homeHref = role === 'ADMIN' ? '/admin/users' : '/home'

  return (
    <header className="sticky top-0 z-50 w-full bg-primary shadow-sm">
      <div className="mx-auto max-w-screen-xl px-6 py-2">
        <div className="flex items-center justify-between">
          <Link href={homeHref} className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-500 text-white shadow-xs">
              <Calculator className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-primary-foreground">Math Class</span>
          </Link>

          <div className="flex items-center gap-3">
            <NotificationPopover />

            <div className="relative">
              <button
                id="user-menu-btn"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 hover:bg-primary-foreground/10 transition-colors"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-foreground/20 overflow-hidden">
                  {user?.avatarUrl ? (
                    <img src={user.avatarUrl} alt={displayName} className="h-full w-full object-cover" />
                  ) : (
                    <User className="h-4 w-4 text-primary-foreground" />
                  )}
                </div>
                <div className="hidden sm:flex flex-col items-start justify-center text-left">
                  <p className="text-sm font-semibold text-primary-foreground leading-tight">{displayName}</p>
                  <span className={`mt-0.5 inline-block rounded-full px-2 py-[2px] text-[10px] ${roleColor}`}>
                    {roleLabel}
                  </span>
                </div>
                <ChevronDown className={`h-4 w-4 text-primary-foreground/70 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {dropdownOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
                  <div className="absolute right-0 top-full z-20 mt-2 w-52 rounded-xl bg-white border border-border shadow-xl overflow-hidden">
                    <div className="px-4 py-3 border-b border-border bg-slate-50">
                      <p className="font-semibold text-foreground text-sm">{displayName}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{user?.email}</p>
                    </div>
                    <div className="p-1.5">
                      <Link
                        href="/profile"
                        className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors font-medium"
                        onClick={() => setDropdownOpen(false)}
                      >
                        <User className="h-4 w-4 text-slate-400 group-hover:text-blue-600" />
                        Hồ sơ cá nhân
                      </Link>
                      <Link
                        href="/settings"
                        className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors font-medium"
                        onClick={() => setDropdownOpen(false)}
                      >
                        <Settings className="h-4 w-4 text-slate-400 group-hover:text-blue-600" />
                        Cài đặt
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
            <AlertDialogCancel className="bg-white text-black border border-input hover:bg-neutral-800 hover:text-white transition-colors">
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction onClick={logout} className="bg-white text-red-600 border border-red-200 hover:bg-red-600 hover:text-white transition-colors">
              Đăng xuất
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </header>
  )
}
