'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Mail, User, Phone } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'

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
import { PasswordStrengthMeter, PASSWORD_CRITERIA_MESSAGE } from '@/components/ui/password-strength-meter'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

import { useSignup } from '@/hooks/useSignup'
import { AUTH_KEYS, ROLES } from '@/lib/constants/auth'
import { handleApiError } from '@/lib/utils/error-handler'
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks'
import { setSelectedRole } from '@/lib/redux/features/authSlice'

const formSchema = z.object({
  fullName: z
    .string()
    .min(2, 'Họ và tên phải có ít nhất 2 ký tự')
    .regex(/^[\p{L}\s]+$/u, 'Họ và tên chỉ được chứa chữ cái và khoảng trắng')
    .trim(),
  email: z.string().min(1, 'Email là bắt buộc').email('Email không hợp lệ').toLowerCase().trim(),
  phoneNumber: z
    .string()
    .regex(/^[0-9]{10}$/, 'Số điện thoại phải có đúng 10 chữ số')
    .trim(),
  password: z
    .string()
    .min(8, 'Mật khẩu phải có ít nhất 8 ký tự')
    .regex(/[A-Z]/, 'Mật khẩu phải chứa ít nhất một chữ hoa')
    .regex(/[a-z]/, 'Mật khẩu phải chứa ít nhất một chữ thường')
    .regex(/[0-9]/, 'Mật khẩu phải chứa ít nhất một chữ số')
    .regex(/[^A-Za-z0-9]/, 'Mật khẩu phải chứa ít nhất một ký tự đặc biệt'),
  confirmPassword: z.string().min(1, 'Vui lòng xác nhận mật khẩu'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Mật khẩu xác nhận không khớp',
  path: ['confirmPassword'],
})

type FormValues = z.infer<typeof formSchema>

export default function SignupForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const dispatch = useAppDispatch()
  const reduxSelectedRole = useAppSelector((state) => state.auth.selectedRole)
  
  const [alertConfig, setAlertConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    isSuccess: false
  })
  
  const [queryRole, setQueryRole] = useState<string>(reduxSelectedRole || ROLES.STUDENT)
  const signupMutation = useSignup()

  useEffect(() => {
    const paramRole = searchParams.get('role')
    const activeRole = paramRole || reduxSelectedRole || ROLES.STUDENT
    setQueryRole(activeRole === ROLES.TEACHER ? ROLES.TEACHER : ROLES.STUDENT)
    if (paramRole) {
      dispatch(setSelectedRole(paramRole))
    }
  }, [searchParams, reduxSelectedRole, dispatch])

  const roleText = queryRole === ROLES.TEACHER ? ' Giáo viên' : ' Học sinh'
  const subtitleText = queryRole === ROLES.TEACHER ? 'Tạo tài khoản để giao bài và chấm điểm' : 'Tạo tài khoản để tham gia lớp học'

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phoneNumber: '',
      password: '',
      confirmPassword: '',
    },
  })

  const onSubmit = (values: FormValues) => {
    signupMutation.mutate(
      {
        fullName: values.fullName,
        email: values.email,
        phoneNumber: values.phoneNumber,
        password: values.password,
        role: queryRole,
      },
      {
        onSuccess: (data) => {
          setAlertConfig({
            isOpen: true,
            title: 'Thành công',
            message: data?.message || 'Đăng ký thành công! Vui lòng kiểm tra email để xác nhận.',
            isSuccess: true
          })
        },
        onError: (error) => {
          setAlertConfig({
            isOpen: true,
            title: 'Đăng ký thất bại',
            message: handleApiError(error, 'Vui lòng kiểm tra lại thông tin.'),
            isSuccess: false
          })
        }
      }
    )
  }

  return (
    <div className="w-full max-w-md">
      <div className="space-y-8">
        {/* Header */}
        <div className="space-y-2 text-center">
          <h1 className="text-4xl font-bold text-foreground tracking-tight">
            Đăng ký{roleText}
          </h1>
          <p className="text-muted-foreground text-base">
            {subtitleText}
          </p>
        </div>

        {/* Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Full Name Field */}
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Họ tên</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
                      <Input placeholder="Nguyễn Văn A" className="pl-10 py-5" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                      <Input placeholder="you@example.com" type="email" className="pl-10 py-5" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Phone Field */}
            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Số điện thoại</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
                      <Input placeholder="0912345678" className="pl-10 py-5" {...field} />
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
                    <PasswordInput placeholder="••••••••" className="py-5 pl-3" {...field} />
                  </FormControl>
                  <PasswordStrengthMeter password={field.value || ''} />
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Confirm Password Field */}
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nhập lại mật khẩu</FormLabel>
                  <FormControl>
                    <PasswordInput placeholder="••••••••" className="py-5 pl-3" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={signupMutation.isPending}
                className="
                  w-full py-3 px-4 bg-primary text-primary-foreground font-semibold rounded-lg
                  transition-all duration-200
                  hover:shadow-lg hover:shadow-primary/25 hover:scale-[1.02]
                  active:scale-100
                  disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:hover:scale-100
                "
              >
                {signupMutation.isPending ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                    Đang xử lý...
                  </div>
                ) : (
                  'Đăng ký tài khoản'
                )}
              </button>
            </div>
          </form>
        </Form>

        {/* Login Link */}
        <div className="text-center">
          <p className="text-muted-foreground">
            Đã có tài khoản?{' '}
            <Link
              href="/login"
              onClick={() => sessionStorage.setItem(AUTH_KEYS.SELECTED_ROLE, queryRole)}
              className="font-semibold text-primary hover:text-primary/80 transition-colors"
            >
              Đăng nhập ngay
            </Link>
          </p>
        </div>
      </div>

      <AlertDialog open={alertConfig.isOpen} onOpenChange={(open) => setAlertConfig(prev => ({ ...prev, isOpen: open }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{alertConfig.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {alertConfig.message}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => {
              setAlertConfig(prev => ({ ...prev, isOpen: false }))
              if (alertConfig.isSuccess) {
                router.push('/login') // Redirect to login after successful signup
              }
            }}>
              Đồng ý
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
