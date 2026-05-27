'use client'

import { useFormik } from 'formik'
import * as yup from 'yup'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Eye, EyeOff, Lock, Mail } from 'lucide-react'

const validationSchema = yup.object().shape({
  email: yup
    .string()
    .email('Email không hợp lệ')
    .required('Email là bắt buộc'),
  password: yup
    .string()
    .min(6, 'Mật khẩu phải có ít nhất 6 ký tự')
    .required('Mật khẩu là bắt buộc'),
  rememberMe: yup.boolean(),
})

export default function LoginForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [loginError, setLoginError] = useState('')

  const formik = useFormik({
    initialValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
    validationSchema,
    onSubmit: async (values) => {
      setIsLoading(true)
      setLoginError('')
      try {
        const response = await fetch('http://localhost:8080/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: values.email, password: values.password }),
        })

        if (response.ok) {
          const data = await response.json()
          const token = data.token
          const role = data.role || data.userRole || 'STUDENT'
          const maxAge = values.rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24

          // Save to cookies for middleware
          document.cookie = `auth_token=${token}; path=/; max-age=${maxAge}; SameSite=Lax`
          document.cookie = `user_role=${role}; path=/; max-age=${maxAge}; SameSite=Lax`

          // Save to storage for client-side use
          const storage = values.rememberMe ? localStorage : sessionStorage
          storage.setItem('auth_token', token)
          storage.setItem('user_info', JSON.stringify(data))
          if (values.rememberMe) {
            localStorage.setItem('remembered_email', values.email)
          } else {
            localStorage.removeItem('remembered_email')
          }

          window.location.href = '/home'
        } else {
          const errData = await response.json().catch(() => null)
          setLoginError(errData?.message || 'Email hoặc mật khẩu không đúng. Vui lòng thử lại.')
        }
      } catch {
        setLoginError('Không thể kết nối máy chủ. Vui lòng thử lại sau.')
      } finally {
        setIsLoading(false)
      }
    },
  })

  useEffect(() => {
    const savedEmail = localStorage.getItem('remembered_email')
    if (savedEmail) {
      formik.setFieldValue('email', savedEmail)
      formik.setFieldValue('rememberMe', true)
    }
  }, [])

  const emailError = formik.touched.email && formik.errors.email
  const passwordError = formik.touched.password && formik.errors.password

  return (
    <div className="w-full max-w-md">
      <div className="space-y-8">
        {/* Header */}
        <div className="space-y-2 text-center">
          <h1 className="text-4xl font-bold text-foreground tracking-tight">
            Đăng nhập
          </h1>
          <p className="text-muted-foreground text-base">
            Nhập thông tin để truy cập tài khoản của bạn
          </p>
        </div>

        {/* Form */}
        <form onSubmit={formik.handleSubmit} className="space-y-6">
          {/* Error Message */}
          {loginError && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3">
              <p className="text-sm text-destructive font-medium">{loginError}</p>
            </div>
          )}

          {/* Email Field */}
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium text-foreground">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                {...formik.getFieldProps('email')}
                className={`
                  w-full px-4 py-3 pl-10 rounded-lg border-2 transition-all
                  placeholder:text-muted-foreground/50
                  focus:outline-none focus:ring-2 focus:ring-primary/20
                  ${
                    emailError
                      ? 'border-destructive bg-destructive/5'
                      : 'border-border bg-input hover:border-border/80 focus:border-primary'
                  }
                `}
              />
            </div>
            {emailError && (
              <p className="text-sm text-destructive font-medium">{emailError}</p>
            )}
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-medium text-foreground">
              Mật khẩu
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                {...formik.getFieldProps('password')}
                className={`
                  w-full px-4 py-3 pl-10 rounded-lg border-2 transition-all
                  placeholder:text-muted-foreground/50
                  focus:outline-none focus:ring-2 focus:ring-primary/20
                  ${
                    passwordError
                      ? 'border-destructive bg-destructive/5'
                      : 'border-border bg-input hover:border-border/80 focus:border-primary'
                  }
                `}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
            {passwordError && (
              <p className="text-sm text-destructive font-medium">{passwordError}</p>
            )}
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2.5 cursor-pointer group">
              <input
                type="checkbox"
                {...formik.getFieldProps('rememberMe')}
                className="w-5 h-5 rounded border-2 border-border cursor-pointer accent-primary hover:border-primary/50 transition-colors"
              />
              <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                Nhớ mật khẩu
              </span>
            </label>
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

        {/* Sign Up Link */}
        <div className="text-center">
          <p className="text-muted-foreground">
            Chưa có tài khoản?{' '}
            <Link
              href="/signup"
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
          <button
            type="button"
            className="
              w-full py-2.5 px-4 border-2 border-border rounded-lg font-medium text-foreground
              hover:bg-secondary/50 transition-colors
            "
          >
            Google
          </button>
        </div>
      </div>
    </div>
  )
}
