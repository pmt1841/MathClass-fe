'use client'

import { useEffect, useState, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import api from '@/lib/axios'

export default function VerifyEmail() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('Đang xác thực tài khoản...')
  const called = useRef(false)

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('Không tìm thấy mã xác nhận.')
      return
    }

    if (called.current) return
    called.current = true

    const verifyToken = async () => {
      try {
        const response = await api.get(`/auth/verify?token=${token}`)
        const data = response.data
        setStatus('success')
        setMessage(data?.message || 'Tài khoản đã được kích hoạt thành công!')
      } catch (error: any) {
        setStatus('error')
        if (error.response) {
          const data = error.response.data
          setMessage(data?.message || 'Xác nhận thất bại. Link có thể đã hết hạn hoặc không hợp lệ.')
        } else {
          setMessage('Có lỗi kết nối tới máy chủ. Vui lòng thử lại sau.')
        }
      }
    }

    verifyToken()
  }, [token])

  return (
    <div className="space-y-6">
      <div className="flex justify-center">
        {status === 'loading' && <Loader2 className="h-16 w-16 text-primary animate-spin" />}
        {status === 'success' && <CheckCircle2 className="h-16 w-16 text-green-500" />}
        {status === 'error' && <XCircle className="h-16 w-16 text-destructive" />}
      </div>
      
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          {status === 'loading' && 'Xác thực tài khoản'}
          {status === 'success' && 'Xác thực thành công'}
          {status === 'error' && 'Xác thực thất bại'}
        </h1>
        <p className="text-muted-foreground text-sm">
          {message}
        </p>
      </div>

      <div className="pt-4">
        <Link
          href="/"
          className="
            inline-block w-full py-3 px-4 bg-primary text-primary-foreground font-semibold rounded-lg
            transition-all duration-200 hover:shadow-lg hover:shadow-primary/25 hover:scale-[1.02] active:scale-100
          "
        >
          Quay lại trang đăng nhập
        </Link>
      </div>
    </div>
  )
}
