'use client'

import { useFormik } from 'formik'
import * as yup from 'yup'
import Link from 'next/link'
import { useState } from 'react'
import { Eye, EyeOff, Lock, Mail, User, Phone, Briefcase } from 'lucide-react'
import { useRouter } from 'next/navigation'
import api from '@/lib/axios'

const validationSchema = yup.object().shape({
  fullName: yup
    .string()
    .transform((value) => (value ? value.normalize('NFC') : value))
    .required('Họ và tên là bắt buộc')
    .min(2, 'Họ và tên phải có ít nhất 2 ký tự')
    .matches(
      /^[\p{L}\s]+$/u,
      'Họ và tên chỉ được chứa chữ cái và khoảng trắng'
    ),
  email: yup
    .string()
    .email('Email không hợp lệ')
    .required('Email là bắt buộc'),
  phoneNumber: yup
    .string()
    .length(10, 'Số điện thoại phải có đúng 10 chữ số')
    .matches(/^0/, 'Số điện thoại phải bắt đầu bằng số 0')
    .matches(/^[0-9]+$/, 'Số điện thoại chỉ bao gồm các chữ số')
    .required('Số điện thoại là bắt buộc'),
  password: yup
    .string()
    .min(6, 'Mật khẩu phải có ít nhất 6 ký tự')
    .required('Mật khẩu là bắt buộc'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], 'Mật khẩu nhập lại không khớp')
    .required('Vui lòng nhập lại mật khẩu'),
  role: yup
    .string()
    .oneOf(['STUDENT', 'TEACHER'], 'Vui lòng chọn chức vụ hợp lệ')
    .required('Chức vụ là bắt buộc'),
})

export default function SignupForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const formik = useFormik({
    initialValues: {
      fullName: '',
      email: '',
      phoneNumber: '',
      password: '',
      confirmPassword: '',
      role: 'STUDENT',
    },
    validationSchema,
    onSubmit: async (values) => {
      setIsLoading(true)
      try {
        const response = await api.post('/auth/register', {
          fullName: values.fullName,
          email: values.email,
          phoneNumber: values.phoneNumber,
          password: values.password,
          role: values.role,
        })

        const data = response.data
        alert(data?.message || 'Đăng ký thành công! Vui lòng kiểm tra email để xác nhận.')
        router.push('/')
      } catch (error: any) {
        console.error('Signup error:', error)
        if (error.response) {
          const data = error.response.data
          alert(`Đăng ký thất bại: ${data?.message || 'Vui lòng kiểm tra lại thông tin.'}`)
        } else {
          alert('Có lỗi xảy ra khi đăng ký. Vui lòng thử lại sau.')
        }
      } finally {
        setIsLoading(false)
      }
    },
  })

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
        <form onSubmit={formik.handleSubmit} className="space-y-4">

          {/* Full Name Field */}
          <div className="space-y-1">
            <label htmlFor="fullName" className="block text-sm font-medium text-foreground">
              Họ tên
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
              <input
                id="fullName"
                type="text"
                placeholder="Nguyễn Văn A"
                {...formik.getFieldProps('fullName')}
                className={`
                  w-full px-4 py-2 pl-10 rounded-lg border-2 transition-all
                  placeholder:text-muted-foreground/50
                  focus:outline-none focus:ring-2 focus:ring-primary/20
                  ${formik.touched.fullName && formik.errors.fullName
                    ? 'border-destructive bg-destructive/5'
                    : 'border-border bg-input hover:border-border/80 focus:border-primary'
                  }
                `}
              />
            </div>
            {formik.touched.fullName && formik.errors.fullName && (
              <p className="text-xs text-destructive font-medium mt-1">{formik.errors.fullName as string}</p>
            )}
          </div>

          {/* Email Field */}
          <div className="space-y-1">
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
                  w-full px-4 py-2 pl-10 rounded-lg border-2 transition-all
                  placeholder:text-muted-foreground/50
                  focus:outline-none focus:ring-2 focus:ring-primary/20
                  ${formik.touched.email && formik.errors.email
                    ? 'border-destructive bg-destructive/5'
                    : 'border-border bg-input hover:border-border/80 focus:border-primary'
                  }
                `}
              />
            </div>
            {formik.touched.email && formik.errors.email && (
              <p className="text-xs text-destructive font-medium mt-1">{formik.errors.email as string}</p>
            )}
          </div>

          {/* Phone Field */}
          <div className="space-y-1">
            <label htmlFor="phoneNumber" className="block text-sm font-medium text-foreground">
              Số điện thoại
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
              <input
                id="phoneNumber"
                type="text"
                placeholder="0912345678"
                {...formik.getFieldProps('phoneNumber')}
                className={`
                  w-full px-4 py-2 pl-10 rounded-lg border-2 transition-all
                  placeholder:text-muted-foreground/50
                  focus:outline-none focus:ring-2 focus:ring-primary/20
                  ${formik.touched.phoneNumber && formik.errors.phoneNumber
                    ? 'border-destructive bg-destructive/5'
                    : 'border-border bg-input hover:border-border/80 focus:border-primary'
                  }
                `}
              />
            </div>
            {formik.touched.phoneNumber && formik.errors.phoneNumber && (
              <p className="text-xs text-destructive font-medium mt-1">{formik.errors.phoneNumber as string}</p>
            )}
          </div>

          {/* Role Field */}
          <div className="space-y-1">
            <label htmlFor="role" className="block text-sm font-medium text-foreground">
              Chức vụ
            </label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
              <select
                id="role"
                {...formik.getFieldProps('role')}
                className={`
                  w-full px-4 py-2 pl-10 rounded-lg border-2 transition-all
                  focus:outline-none focus:ring-2 focus:ring-primary/20 bg-input
                  ${formik.touched.role && formik.errors.role
                    ? 'border-destructive bg-destructive/5'
                    : 'border-border hover:border-border/80 focus:border-primary'
                  }
                `}
              >
                <option value="STUDENT">Học sinh</option>
                <option value="TEACHER">Giáo viên</option>
              </select>
            </div>
            {formik.touched.role && formik.errors.role && (
              <p className="text-xs text-destructive font-medium mt-1">{formik.errors.role as string}</p>
            )}
          </div>

          {/* Password Field */}
          <div className="space-y-1">
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
                  w-full px-4 py-2 pl-10 rounded-lg border-2 transition-all
                  placeholder:text-muted-foreground/50
                  focus:outline-none focus:ring-2 focus:ring-primary/20
                  ${formik.touched.password && formik.errors.password
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
            {formik.touched.password && formik.errors.password && (
              <p className="text-xs text-destructive font-medium mt-1">{formik.errors.password as string}</p>
            )}
          </div>

          {/* Confirm Password Field */}
          <div className="space-y-1">
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground">
              Nhập lại mật khẩu
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="••••••••"
                {...formik.getFieldProps('confirmPassword')}
                className={`
                  w-full px-4 py-2 pl-10 rounded-lg border-2 transition-all
                  placeholder:text-muted-foreground/50
                  focus:outline-none focus:ring-2 focus:ring-primary/20
                  ${formik.touched.confirmPassword && formik.errors.confirmPassword
                    ? 'border-destructive bg-destructive/5'
                    : 'border-border bg-input hover:border-border/80 focus:border-primary'
                  }
                `}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
            {formik.touched.confirmPassword && formik.errors.confirmPassword && (
              <p className="text-xs text-destructive font-medium mt-1">{formik.errors.confirmPassword as string}</p>
            )}
          </div>

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
    </div>
  )
}
