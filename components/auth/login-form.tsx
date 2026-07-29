'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Mail } from 'lucide-react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { Checkbox } from '@/components/ui/checkbox'

import { useLogin } from '@/hooks/useLogin'
import { SocialLoginButton } from './social-login-button'
import { AccountLockedModal } from './account-locked-modal'
import { AUTH_KEYS, ROLES } from '@/lib/constants/auth'
import { useAppDispatch } from '@/lib/redux/hooks'
import { logoutSuccess } from '@/lib/redux/features/authSlice'
import { authStorage } from '@/lib/auth-storage'
import api from '@/lib/axios'

const formSchema = z.object({
  email: z.string().min(1, 'Email là bắt buộc').email('Email không hợp lệ'),
  password: z.string().min(1, 'Mật khẩu là bắt buộc'),
  rememberMe: z.boolean().default(false).optional(),
})

type FormValues = z.infer<typeof formSchema>

export default function LoginForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const dispatch = useAppDispatch()
  const [role, setRole] = useState<string>(ROLES.STUDENT)
  /*
   * PHÁT HIỆN LÝ DO BỊ KHÓA:
   * State kiểm soát việc hiển thị Modal Cảnh báo khi người dùng bị văng từ hệ thống về trang Login với tham số ?reason=account_locked
   */
  const [showLockedModal, setShowLockedModal] = useState<boolean>(false)

  const { login, isLoading, loginError } = useLogin()

  useEffect(() => {
    const savedRole = searchParams.get('role') || sessionStorage.getItem(AUTH_KEYS.SELECTED_ROLE) || ROLES.STUDENT
    setRole(savedRole)

    // Kiểm tra query parameter để mở Modal cảnh báo tài khoản bị khóa
    const reason = searchParams.get('reason')
    if (reason === 'account_locked') {
      setShowLockedModal(true)
    }
  }, [searchParams])

  /*
   * TỰ ĐỘNG BẬT MODAL KHI ĐĂNG NHẬP THẤT BẠI DO BỊ KHÓA:
   * Nếu người dùng cố tình nhập thông tin đăng nhập của một tài khoản đã bị khóa,
   * thông báo lỗi từ backend trả về cũng sẽ kích hoạt hiển thị Modal Cảnh Báo.
   */
  useEffect(() => {
    if (loginError && (loginError.includes('đã bị khóa') || loginError.includes('bị khóa'))) {
      setShowLockedModal(true)
    }
  }, [loginError])

  /**
   * Đóng Modal, xóa sạch Redux Auth State & Cookie còn đọng lại trên trình duyệt
   * và loại bỏ tham số ?reason=account_locked để giữ người dùng an toàn tại trang Login chuẩn bị đăng nhập lại.
   */
  const handleCloseLockedModal = () => {
    setShowLockedModal(false)

    // Xóa sạch trạng thái Auth trong Redux và Storage
    try {
      dispatch(logoutSuccess())
    } catch (e) {
      // ignore
    }

    authStorage.clearToken()
    authStorage.clearUserInfo()

    if (typeof document !== 'undefined') {
      document.cookie = 'mathclass_role=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT'
      document.cookie = 'user_role=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT'
      document.cookie = 'mathclass_jwt=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    }

    // Gửi request ngầm logout tới backend để dọn cookie HttpOnly
    api.post('/auth/logout').catch(() => {})

    const params = new URLSearchParams(searchParams.toString())
    params.delete('reason')
    const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname
    router.replace(newUrl)
  }

  const roleText = role === ROLES.TEACHER ? ' Giáo viên' : role === ROLES.STUDENT ? ' Học sinh' : role === ROLES.ADMIN ? ' Quản trị viên' : ''

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  })

  useEffect(() => {
    const savedEmail = localStorage.getItem(AUTH_KEYS.REMEMBERED_EMAIL)
    if (savedEmail) {
      form.setValue('email', savedEmail)
      form.setValue('rememberMe', true)
    }
  }, [form])

  const onSubmit = async (values: FormValues) => {
    await login({ email: values.email, password: values.password }, !!values.rememberMe, role)
  }

  return (
    <div className="w-full max-w-md">
      <div className="space-y-8">
        {/* Header */}
        <div className="space-y-2 text-center">
          <h1 className="text-4xl font-bold text-foreground tracking-tight">
            Đăng nhập{roleText}
          </h1>
          <p className="text-muted-foreground text-base">
            Nhập thông tin để truy cập tài khoản của bạn
          </p>
        </div>

        {/* Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Error Message */}
            {loginError && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3">
                <p className="text-sm text-destructive font-medium">{loginError}</p>
              </div>
            )}

            {/* Email Field */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
                      <Input
                        placeholder="you@example.com"
                        className="pl-10 py-5"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Password Field */}
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mật khẩu</FormLabel>
                  <FormControl>
                    <PasswordInput
                      placeholder="••••••••"
                      className="pl-3 py-5"
                      maxLength={256}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <FormField
                control={form.control}
                name="rememberMe"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-2 space-y-0 cursor-pointer group">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="font-medium text-muted-foreground group-hover:text-foreground transition-colors cursor-pointer">
                      Giữ đăng nhập
                    </FormLabel>
                  </FormItem>
                )}
              />
              <Link
                href="/forgot-password"
                className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
              >
                Quên mật khẩu?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="
                w-full py-3 px-4 bg-primary text-primary-foreground font-semibold rounded-lg
                transition-all duration-200
                hover:shadow-lg hover:shadow-primary/25 hover:scale-105
                active:scale-100
                disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:hover:scale-100
              "
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  Đang đăng nhập...
                </div>
              ) : (
                'Đăng nhập'
              )}
            </button>
          </form>
        </Form>

        {/* Sign Up Link */}
        <div className="text-center">
          <p className="text-muted-foreground">
            Chưa có tài khoản?{' '}
            <Link
              href="/signup"
              onClick={() => sessionStorage.setItem(AUTH_KEYS.SELECTED_ROLE, role)}
              className="font-semibold text-primary hover:text-primary/80 transition-colors"
            >
              Đăng ký ngay
            </Link>
          </p>
        </div>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-background text-muted-foreground">
              hoặc tiếp tục với
            </span>
          </div>
        </div>

        {/* Social Login */}
        <div className="w-full">
          <SocialLoginButton provider="google" label="Đăng nhập bằng Google" expectedRole={role} />
        </div>
      </div>

      {/* ── Modal Cảnh báo Tài khoản bị khóa (Tách biệt Component) ───────────── */}
      <AccountLockedModal open={showLockedModal} onClose={handleCloseLockedModal} />
    </div>
  )
}
