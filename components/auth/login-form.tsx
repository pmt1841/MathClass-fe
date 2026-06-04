'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Mail } from 'lucide-react'
import api from '@/lib/axios'
import { useRouter } from 'next/navigation'

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

const formSchema = z.object({
  email: z.string().email('Email không hợp lệ').min(1, 'Email là bắt buộc'),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
  rememberMe: z.boolean().default(false).optional(),
})

type FormValues = z.infer<typeof formSchema>

export default function LoginForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [loginError, setLoginError] = useState('')
  const router = useRouter()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  })

  useEffect(() => {
    const savedEmail = localStorage.getItem('remembered_email')
    if (savedEmail) {
      form.setValue('email', savedEmail)
      form.setValue('rememberMe', true)
    }
  }, [form])

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true)
    setLoginError('')
    try {
      const response = await api.post('/auth/login', {
        email: values.email,
        password: values.password,
      })

      const data = response.data
      const token = data.token
      const role = data.role || data.userRole || 'STUDENT'
      const maxAge = values.rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24

      // Save to cookies for middleware
      document.cookie = `auth_token=${token}; path=/; max-age=${maxAge}; SameSite=Lax`
      document.cookie = `user_role=${role}; path=/; max-age=${maxAge}; SameSite=Lax`

      // Clear old storage to prevent stale data
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user_info')
      sessionStorage.removeItem('auth_token')
      sessionStorage.removeItem('user_info')

      // Save to storage for client-side use
      const storage = values.rememberMe ? localStorage : sessionStorage
      storage.setItem('auth_token', token)
      storage.setItem('user_info', JSON.stringify(data))
      if (values.rememberMe) {
        localStorage.setItem('remembered_email', values.email)
      } else {
        localStorage.removeItem('remembered_email')
      }

      router.push('/home')
    } catch (err: any) {
      if (err.response) {
        const errData = err.response.data
        setLoginError(errData?.message || 'Email hoặc mật khẩu không đúng. Vui lòng thử lại.')
      } else {
        setLoginError('Không thể kết nối máy chủ. Vui lòng thử lại sau.')
      }
    } finally {
      setIsLoading(false)
    }
  }

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
                      Nhớ mật khẩu
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
