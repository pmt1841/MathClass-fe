'use client'

import { Calculator } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ROLES } from '@/lib/constants/auth'
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks'
import { setSelectedRole } from '@/lib/redux/features/authSlice'

export function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const dispatch = useAppDispatch()
  const selectedRole = useAppSelector((state) => state.auth.selectedRole) || ROLES.TEACHER

  const isLandingPage = pathname === '/'
  const isLoginPage = pathname === '/login'
  const isSignupPage = pathname === '/signup'

  // Vai trò đối ứng (ngược với vai trò hiện tại)
  const targetRole = selectedRole === ROLES.TEACHER ? ROLES.STUDENT : ROLES.TEACHER
  const targetRoleName = targetRole === ROLES.TEACHER ? 'Giáo viên' : 'Học sinh'

  /**
   * Tính text và hành động cho nút duy nhất trên header:
   *
   * - Landing (/):     "Dùng thử miễn phí"        → set TEACHER + /signup
   * - /signup TEACHER: "Đăng ký Học sinh"          → switch sang STUDENT (ở lại /signup)
   * - /signup STUDENT: "Đăng ký Giáo viên"         → switch sang TEACHER (ở lại /signup)
   * - /login  TEACHER: "Đăng nhập Học sinh"        → switch sang STUDENT (ở lại /login)
   * - /login  STUDENT: "Đăng nhập Giáo viên"       → switch sang TEACHER (ở lại /login)
   */
  const getButtonConfig = () => {
    if (isLandingPage) {
      return {
        label: 'Dùng thử miễn phí',
        action: () => {
          dispatch(setSelectedRole(ROLES.TEACHER))
          router.push('/signup')
        },
      }
    }
    if (isSignupPage) {
      return {
        label: `Đăng ký ${targetRoleName}`,
        action: () => dispatch(setSelectedRole(targetRole)),
      }
    }
    if (isLoginPage) {
      return {
        label: `Đăng nhập ${targetRoleName}`,
        action: () => dispatch(setSelectedRole(targetRole)),
      }
    }
    // Fallback các trang khác
    return {
      label: 'Dùng thử miễn phí',
      action: () => {
        dispatch(setSelectedRole(ROLES.TEACHER))
        router.push('/signup')
      },
    }
  }

  const { label, action } = getButtonConfig()

  return (
    <header className="sticky top-0 z-50 w-full bg-primary shadow-sm">
      <div className="mx-auto max-w-6xl px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500 text-white shadow-xs">
              <Calculator className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-primary-foreground">Math Class</span>
          </Link>

          {/* Nút hành động duy nhất */}
          <Button
            onClick={action}
            className="bg-white text-primary hover:bg-white/90 font-semibold shadow-sm cursor-pointer"
          >
            {label}
          </Button>
        </div>
      </div>
    </header>
  )
}
