'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import Link from 'next/link'
import { useState } from 'react'
import { Mail, User, Phone, Briefcase } from 'lucide-react'
import { useRouter } from 'next/navigation'
import api from '@/lib/axios'

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

const formSchema = z.object({
  fullName: z
    .string()
    .min(2, 'Họ và tên phải có ít nhất 2 ký tự')
    .regex(/^[\p{L}\s]+$/u, 'Họ và tên chỉ được chứa chữ cái và khoảng trắng')
    .min(1, 'Họ và tên là bắt buộc'),
  email: z.string().email('Email không hợp lệ').min(1, 'Email là bắt buộc'),
  phoneNumber: z
    .string()
    .length(10, 'Số điện thoại phải có đúng 10 chữ số')
    .regex(/^0[0-9]+$/, 'Số điện thoại phải bắt đầu bằng số 0 và chỉ chứa số')
    .min(1, 'Số điện thoại là bắt buộc'),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
  confirmPassword: z.string(),
  role: z.enum(['STUDENT', 'TEACHER'], {
    required_error: 'Vui lòng chọn chức vụ hợp lệ',
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Mật khẩu nhập lại không khớp",
  path: ["confirmPassword"],
})

type FormValues = z.infer<typeof formSchema>

export default function SignupForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [alertConfig, setAlertConfig] = useState<{ isOpen: boolean, title: string, message: string, isSuccess: boolean }>({
    isOpen: false,
    title: '',
    message: '',
    isSuccess: false
  })
  const router = useRouter()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phoneNumber: '',
      password: '',
      confirmPassword: '',
      role: 'STUDENT',
    },
  })

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true)
    try {
      const response = await api.post('/auth/register', {
        fullName: values.fullName.normalize('NFC'),
        email: values.email,
        phoneNumber: values.phoneNumber,
        password: values.password,
        role: values.role,
      })

      const data = response.data
      setAlertConfig({
        isOpen: true,
        title: 'Thành công',
        message: data?.message || 'Đăng ký thành công! Vui lòng kiểm tra email để xác nhận.',
        isSuccess: true
      })
    } catch (error: any) {
      console.error('Signup error:', error)
      if (error.response) {
        const data = error.response.data
        setAlertConfig({
          isOpen: true,
          title: 'Đăng ký thất bại',
          message: data?.message || 'Vui lòng kiểm tra lại thông tin.',
          isSuccess: false
        })
      } else {
        setAlertConfig({
          isOpen: true,
          title: 'Lỗi',
          message: 'Có lỗi xảy ra khi đăng ký. Vui lòng thử lại sau.',
          isSuccess: false
        })
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
            Đăng ký
          </h1>
          <p className="text-muted-foreground text-base">
            Tạo tài khoản để tham gia lớp học
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
                      <Input placeholder="Nguyễn Văn A" className="pl-10" {...field} />
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
                      <Input placeholder="you@example.com" type="email" className="pl-10" {...field} />
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
                      <Input placeholder="0912345678" className="pl-10" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Role Field */}
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Chức vụ</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <div className="relative">
                        <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground z-10 pointer-events-none" />
                        <SelectTrigger className="pl-10">
                          <SelectValue placeholder="Chọn chức vụ" />
                        </SelectTrigger>
                      </div>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="STUDENT">Học sinh</SelectItem>
                      <SelectItem value="TEACHER">Giáo viên</SelectItem>
                    </SelectContent>
                  </Select>
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
                    <PasswordInput placeholder="••••••••" {...field} />
                  </FormControl>
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
                    <PasswordInput placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="
                  w-full py-3 px-4 bg-primary text-primary-foreground font-semibold rounded-lg
                  transition-all duration-200
                  hover:shadow-lg hover:shadow-primary/25 hover:scale-[1.02]
                  active:scale-100
                  disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:hover:scale-100
                "
              >
                {isLoading ? (
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
              href="/"
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
                router.push('/')
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
