'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useState, useEffect } from 'react'
import { Mail, Calculator, ShieldCheck, Lock } from 'lucide-react'
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
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { AccountLockedModal } from './account-locked-modal'
import { AccountConflictModal } from './account-conflict-modal'
import { TwoFactorSetupWizard } from './TwoFactorSetupWizard'
import { TwoFactorVerifyModal } from './TwoFactorVerifyModal'
import { useAuthChannel } from '@/hooks/useAuthChannel'

import { useLogin, TwoFactorState } from '@/hooks/useLogin'
import { TwoFactorConfirmResponse, LoginResponse } from '@/services/authService'
import { AUTH_KEYS, ROLES } from '@/lib/constants/auth'
import { useAppDispatch } from '@/lib/redux/hooks'
import { logoutSuccess } from '@/lib/redux/features/authSlice'
import { authStorage } from '@/lib/auth-storage'
import { logoutSession } from '@/lib/logout'

const formSchema = z.object({
  email: z.string().min(1, 'Email là bắt buộc').trim().toLowerCase().email('Email không hợp lệ'),
  password: z.string().min(1, 'Mật khẩu là bắt buộc'),
  rememberMe: z.boolean().default(false).optional(),
})

type FormValues = z.infer<typeof formSchema>

export default function AdminLoginForm() {
  const { login, completeLoginSession, isLoading, loginError } = useLogin()
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const dispatch = useAppDispatch()
  const { broadcastEvent } = useAuthChannel()

  const [showLockedModal, setShowLockedModal] = useState<boolean>(false)

  // State kiểm soát 2FA Google Authenticator
  const [twoFactorState, setTwoFactorState] = useState<TwoFactorState | null>(null)
  const [show2faSetup, setShow2faSetup] = useState<boolean>(false)
  const [show2faVerify, setShow2faVerify] = useState<boolean>(false)

  // State kiểm soát Modal Xung đột đăng nhập đa tài khoản
  const [showConflictModal, setShowConflictModal] = useState<boolean>(false)
  const [existingUser, setExistingUser] = useState<any>(null)
  const [pendingValues, setPendingValues] = useState<FormValues | null>(null)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  })

  // Tự động mở Modal cảnh báo khi bị khóa tài khoản (từ query param hoặc lỗi login)
  useEffect(() => {
    if (searchParams.get('reason') === 'account_locked') {
      setShowLockedModal(true)
    }
  }, [searchParams])

  useEffect(() => {
    if (loginError && (loginError.includes('đã bị khóa') || loginError.includes('bị khóa'))) {
      setShowLockedModal(true)
    }
  }, [loginError])

  const handleCloseLockedModal = () => {
    setShowLockedModal(false)

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

  useEffect(() => {
    const savedEmail = localStorage.getItem(AUTH_KEYS.REMEMBERED_EMAIL)
    if (savedEmail) {
      form.setValue('email', savedEmail)
    }
  }, [form])

  const executeActualLogin = async (values: FormValues) => {
    const result = await login(
      { email: values.email, password: values.password },
      !!values.rememberMe,
      ROLES.ADMIN
    )

    if (result && typeof result === 'object' && result.is2faRequired) {
      setTwoFactorState(result)
      if (result.isSetupRequired) {
        setShow2faSetup(true)
      } else {
        setShow2faVerify(true)
      }
    } else if (result === true) {
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
      <div className="rounded-2xl border border-border bg-card p-8 shadow-xl text-card-foreground transition-all duration-300">
        {/* Header section - Tông màu đồng bộ với Header Dashboard */}
        <div className="space-y-4 text-center mb-8">
          <div className="flex items-center justify-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-accent-foreground shadow-md">
              <Calculator className="h-6 w-6" aria-hidden="true" />
            </div>
            <span className="text-2xl font-bold text-foreground tracking-tight">Math Class</span>
          </div>

          <div className="flex items-center justify-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-red-500 px-3 py-0.5 text-xs font-semibold text-white shadow-sm">
              <ShieldCheck className="h-3.5 w-3.5" />
              Quản trị viên
            </span>
          </div>

          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              Đăng nhập Hệ thống Quản trị
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Nhập thông tin quản trị để truy cập
            </p>
          </div>
        </div>

        {/* Form section */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            {/* Error Message Alert */}
            {loginError && (
              <div
                role="alert"
                className="rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3 text-destructive text-sm font-medium animate-in fade-in slide-in-from-top-2 duration-200"
              >
                {loginError}
              </div>
            )}

            {/* Email Field */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground font-medium text-sm">Email Quản trị</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                      <Input
                        {...field}
                        type="email"
                        placeholder="admin@mathclass.edu.vn"
                        className="pl-10 h-11 bg-background border-input text-foreground placeholder:text-muted-foreground focus-visible:ring-primary focus-visible:border-primary rounded-xl"
                        autoComplete="email"
                      />
                    </div>
                  </FormControl>
                  <FormMessage className="text-destructive text-xs" />
                </FormItem>
              )}
            />

            {/* Password Field */}
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground font-medium text-sm">Mật khẩu</FormLabel>
                  <FormControl>
                    <PasswordInput
                      {...field}
                      placeholder="••••••••"
                      maxLength={256}
                      className="h-11 bg-background border-input text-foreground placeholder:text-muted-foreground focus-visible:ring-primary focus-visible:border-primary rounded-xl"
                      autoComplete="current-password"
                    />
                  </FormControl>
                  <FormMessage className="text-destructive text-xs" />
                </FormItem>
              )}
            />

            {/* Remember Me Checkbox */}
            <FormField
              control={form.control}
              name="rememberMe"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-3 space-y-0 py-1">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="border-input data-[state=checked]:bg-primary data-[state=checked]:border-primary rounded-md"
                    />
                  </FormControl>
                  <FormLabel className="text-sm text-foreground font-normal cursor-pointer select-none">
                    Ghi nhớ phiên đăng nhập
                  </FormLabel>
                </FormItem>
              )}
            />

            {/* Submit Button - Đồng bộ màu bg-primary của Header */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl shadow-md active:scale-[0.99] transition-all duration-200 cursor-pointer disabled:opacity-70"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <Spinner className="h-4 w-4 text-primary-foreground" />
                  <span>Đang xác thực...</span>
                </div>
              ) : (
                'Đăng nhập Quản trị'
              )}
            </Button>
          </form>
        </Form>
      </div>

      {/* ── Modal Cảnh báo Tài khoản bị khóa ─────────────────────────────── */}
      <AccountLockedModal open={showLockedModal} onClose={handleCloseLockedModal} />

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
