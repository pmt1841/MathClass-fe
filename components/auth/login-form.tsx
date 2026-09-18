'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Mail, AlertTriangle } from 'lucide-react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { ReportBugModal } from '@/components/bug-report/ReportBugModal'

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

import { useLogin, TwoFactorState } from '@/hooks/useLogin'
import { TwoFactorConfirmResponse, LoginResponse } from '@/services/authService'
import { TwoFactorSetupWizard } from './TwoFactorSetupWizard'
import { TwoFactorVerifyModal } from './TwoFactorVerifyModal'
import { SocialLoginButton } from './social-login-button'
import { AccountLockedModal } from './account-locked-modal'
import { AUTH_KEYS, ROLES } from '@/lib/constants/auth'
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks'
import { logoutSuccess, setSelectedRole } from '@/lib/redux/features/authSlice'
import { authStorage } from '@/lib/auth-storage'
import { logoutSession } from '@/lib/logout'
import { useAuthChannel } from '@/hooks/useAuthChannel'
import { AccountConflictModal } from './account-conflict-modal'

const formSchema = z.object({
  email: z.string().min(1, 'Email là bắt buộc').trim().toLowerCase().email('Email không hợp lệ'),
  password: z.string().min(1, 'Mật khẩu là bắt buộc'),
  rememberMe: z.boolean().default(false).optional(),
})

type FormValues = z.infer<typeof formSchema>

export default function LoginForm() {
  const { login, completeLoginSession, isLoading, loginError } = useLogin()
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const dispatch = useAppDispatch()
  const reduxSelectedRole = useAppSelector((state) => state.auth.selectedRole)
  const { broadcastEvent } = useAuthChannel()

  const [role, setRole] = useState<string>(reduxSelectedRole || ROLES.STUDENT)
  const [explicitRole, setExplicitRole] = useState<string | null>(reduxSelectedRole || null)
  
  const [showLockedModal, setShowLockedModal] = useState<boolean>(false)
  const [lockedReason, setLockedReason] = useState<string | undefined>(undefined)
  const [lockedAt, setLockedAt] = useState<string | undefined>(undefined)

  // State kiểm soát 2FA Google Authenticator
  const [twoFactorState, setTwoFactorState] = useState<TwoFactorState | null>(null)
  const [show2faSetup, setShow2faSetup] = useState<boolean>(false)
  const [show2faVerify, setShow2faVerify] = useState<boolean>(false)

  // State kiểm soát Modal Báo cáo lỗi hệ thống
  const [showReportModal, setShowReportModal] = useState<boolean>(false)

  // State kiểm soát Modal Xung đột đăng nhập đa tài khoản
  const [showConflictModal, setShowConflictModal] = useState<boolean>(false)
  const [existingUser, setExistingUser] = useState<any>(null)
  const [pendingValues, setPendingValues] = useState<FormValues | null>(null)

  useEffect(() => {
    const paramRole = searchParams.get('role')
    const activeRole = paramRole || reduxSelectedRole || ROLES.STUDENT
    setRole(activeRole)
    setExplicitRole(activeRole)
    if (paramRole) {
      dispatch(setSelectedRole(paramRole))
    }

    // Kiểm tra query parameter để mở Modal cảnh báo tài khoản bị khóa
    const reason = searchParams.get('reason')
    if (reason === 'account_locked') {
      const savedInfo = sessionStorage.getItem('locked_account_info')
      if (savedInfo) {
        try {
          const parsed = JSON.parse(savedInfo)
          if (parsed.lockReason) setLockedReason(parsed.lockReason)
          if (parsed.lockedAt) setLockedAt(parsed.lockedAt)
        } catch (e) {
          // ignore
        }
      }
      setShowLockedModal(true)
    }
  }, [searchParams, reduxSelectedRole, dispatch])

  useEffect(() => {
    if (loginError && (loginError.includes('đã bị khóa') || loginError.includes('bị khóa'))) {
      if (loginError.includes('Lý do: ')) {
        const parts = loginError.split('Lý do: ')
        if (parts[1]) {
          setLockedReason(parts[1].trim())
        }
      }
      setShowLockedModal(true)
    }
  }, [loginError])

  const handleCloseLockedModal = () => {
    setShowLockedModal(false)
    setLockedReason(undefined)
    setLockedAt(undefined)
    sessionStorage.removeItem('locked_account_info')

    try {
      dispatch(logoutSuccess())
    } catch (e) {
      // ignore
    }

    authStorage.clearToken()
    authStorage.clearUserInfo()
    logoutSession()

    const params = new URLSearchParams(searchParams.toString())
    params.delete('reason')
    const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname
    router.replace(newUrl)
  }

  const roleText = role === ROLES.TEACHER ? ' Giáo viên' : role === ROLES.STUDENT ? ' Học sinh' : role === ROLES.ADMIN ? ' Quản trị viên' : ''

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: 'onTouched',
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  })

  const rememberMe = form.watch('rememberMe')

  useEffect(() => {
    const savedEmail = localStorage.getItem(AUTH_KEYS.REMEMBERED_EMAIL)
    if (savedEmail) {
      form.setValue('email', savedEmail)
    }
  }, [form])

  const executeActualLogin = async (values: FormValues) => {
    const res = await login(
      { email: values.email, password: values.password },
      !!values.rememberMe,
      explicitRole || undefined
    )

    if (res && typeof res === 'object' && res.is2faRequired) {
      setTwoFactorState(res)
      if (res.isSetupRequired) {
        setShow2faSetup(true)
      } else {
        setShow2faVerify(true)
      }
    } else if (res === true) {
      broadcastEvent('LOGIN')
    }
  }

  const handle2faSetupSuccess = (confirmRes: TwoFactorConfirmResponse) => {
    setShow2faSetup(false)
    if (confirmRes.userInfo) {
      completeLoginSession(confirmRes.userInfo, twoFactorState?.rememberMe ?? false)
      broadcastEvent('LOGIN')
    }
  }

  const handle2faVerifySuccess = (userInfo: LoginResponse) => {
    setShow2faVerify(false)
    completeLoginSession(userInfo, twoFactorState?.rememberMe ?? false)
    broadcastEvent('LOGIN')
  }

  const onSubmit = async (values: FormValues) => {
    // PRE-LOGIN CHECK: Kiểm tra xem trình duyệt đã tồn tại phiên tài khoản khác hay chưa
    const currentUser = authStorage.getUserInfo()
    if (currentUser && currentUser.email && currentUser.email.toLowerCase() !== values.email.toLowerCase()) {
      setExistingUser(currentUser)
      setPendingValues(values)
      setShowConflictModal(true)
      return
    }

    await executeActualLogin(values)
  }

  const handleContinueAsCurrent = () => {
    setShowConflictModal(false)
    const isAdmin = existingUser?.role === 'ADMIN' || existingUser?.roles?.includes('ROLE_ADMIN')
    router.push(isAdmin ? '/admin' : '/home')
  }

  const handleSwitchAccount = async () => {
    setShowConflictModal(false)
    // Đăng xuất tài khoản cũ ngầm
    await logoutSession()
    authStorage.clearToken()
    authStorage.clearUserInfo()
    dispatch(logoutSuccess())
    broadcastEvent('LOGOUT')

    if (pendingValues) {
      await executeActualLogin(pendingValues)
      setPendingValues(null)
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-2 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
            Đăng nhập{roleText}
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Nhập thông tin để truy cập tài khoản của bạn
          </p>
        </div>

        {/* Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-6">
            {/* Error Message */}
            {loginError && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive font-medium leading-relaxed">
                {loginError.includes('/admin/login') ? (
                  <p>
                    {loginError.replace('(/admin/login).', '')}{' '}
                    <Link
                      href="/admin/login"
                      className="underline underline-offset-4 font-bold hover:text-destructive/80 transition-colors inline-flex items-center gap-0.5"
                    >
                      Cổng Quản trị hệ thống &rarr;
                    </Link>
                  </p>
                ) : loginError.includes('/login') ? (
                  <p>
                    {loginError.replace('(/login).', '')}{' '}
                    <Link
                      href="/login"
                      className="underline underline-offset-4 font-bold hover:text-destructive/80 transition-colors inline-flex items-center gap-0.5"
                    >
                      Cổng Giáo viên & Học sinh &rarr;
                    </Link>
                  </p>
                ) : (
                  <p>{loginError}</p>
                )}
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
                        placeholder="Nhập email"
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
                      placeholder="Nhập mật khẩu"
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
          <SocialLoginButton provider="google" label="Đăng nhập bằng Google" expectedRole={role} rememberMe={rememberMe} />
        </div>

        {/* Nút Báo cáo sự cố hệ thống cho Guest */}
        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => setShowReportModal(true)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-destructive hover:text-destructive/80 hover:underline transition-colors"
          >
            <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
            Gặp sự cố? Báo cáo lỗi hệ thống
          </button>
        </div>
      </div>

      {/* Modal Báo cáo lỗi cho Guest */}
      <ReportBugModal
        open={showReportModal}
        onClose={() => setShowReportModal(false)}
        isAuthenticated={false}
      />

      {/* ── Modal Cảnh báo Tài khoản bị khóa (Tách biệt Component) ───────────── */}
      <AccountLockedModal
        open={showLockedModal}
        onClose={handleCloseLockedModal}
        lockReason={lockedReason}
        lockedAt={lockedAt}
      />

      {/* ── Modal Cảnh báo Xung đột Đăng nhập Đa Tài khoản ───────────── */}
      <AccountConflictModal
        open={showConflictModal}
        currentUser={existingUser}
        attemptedEmail={pendingValues?.email || ''}
        onContinueAsCurrent={handleContinueAsCurrent}
        onSwitchAccount={handleSwitchAccount}
      />

      {/* ── Modal Thiết lập 2FA Google Authenticator Lần đầu ──────────── */}
      {twoFactorState && (
        <TwoFactorSetupWizard
          isOpen={show2faSetup}
          preAuthToken={twoFactorState.preAuthToken}
          email={twoFactorState.email}
          rememberMe={twoFactorState.rememberMe}
          onClose={() => setShow2faSetup(false)}
          onSuccess={handle2faSetupSuccess}
        />
      )}

      {/* ── Modal Xác thực 2FA Đăng nhập Định kỳ ─────────────────────────── */}
      {twoFactorState && (
        <TwoFactorVerifyModal
          isOpen={show2faVerify}
          preAuthToken={twoFactorState.preAuthToken}
          email={twoFactorState.email}
          rememberMe={twoFactorState.rememberMe}
          onClose={() => setShow2faVerify(false)}
          onSuccess={handle2faVerifySuccess}
        />
      )}
    </div>
  )
}

