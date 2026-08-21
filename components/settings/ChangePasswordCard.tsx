'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { KeyRound, Eye, EyeOff, Lock, AlertCircle, ShieldAlert, Info } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/useAuth'
import { useQuery, useMutation } from '@tanstack/react-query'
import { profileService } from '@/services/profileService'
import { ChangePasswordRequest } from '@/types'
import { SetPasswordCard } from './SetPasswordCard'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'

export function ChangePasswordCard() {
  const { toast } = useToast()
  const { logout } = useAuth()

  // Gọi API /users/me để lấy thông tin real-time của người dùng (bao gồm cờ hasPassword)
  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: profileService.getProfile,
  })

  const [formData, setFormData] = useState<ChangePasswordRequest>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)

  // State cho Modal Cảnh báo trùng mật khẩu
  const [warningModalOpen, setWarningModalOpen] = useState(false)
  const [warningMessage, setWarningMessage] = useState('')

  const mutation = useMutation({
    mutationFn: (data: ChangePasswordRequest) => profileService.changePassword(data),
    onSuccess: async () => {
      toast({
        title: 'Thành công',
        description: 'Đổi mật khẩu thành công. Đang đăng xuất...',
      })
      // Clear form
      setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' })
      // Auto logout and redirect to login page
      setTimeout(async () => {
        await logout()
      }, 1200)
    },
    onError: (error: any) => {
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.result ||
        'Có lỗi xảy ra khi đổi mật khẩu. Vui lòng thử lại.'
      
      const lowerMsg = errorMessage.toLowerCase()
      if (
        lowerMsg.includes('trùng') ||
        lowerMsg.includes('3 mật khẩu') ||
        lowerMsg.includes('gần nhất') ||
        lowerMsg.includes('mật khẩu hiện tại')
      ) {
        setWarningMessage(errorMessage)
        setWarningModalOpen(true)
      } else {
        toast({
          title: 'Thất bại',
          description: errorMessage,
          variant: 'destructive'
        })
      }
    }
  })

  // ── ⚠️ BẮT BỤC: Các câu lệnh rẽ nhánh Early Return phải nằm SAU tất cả các Hooks ──
  // Nếu đang tải thông tin profile
  if (isLoading) {
    return (
      <Card className="shadow-sm border-slate-200 bg-white p-8">
        <div className="flex items-center justify-center gap-2 text-slate-500 py-6">
          <span className="w-5 h-5 border-2 border-slate-300 border-t-indigo-600 rounded-full animate-spin" />
          Đang kiểm tra trạng thái tài khoản...
        </div>
      </Card>
    )
  }

  // Nếu tài khoản Google chưa từng tạo mật khẩu local -> render SetPasswordCard
  if (profile && profile.hasPassword === false) {
    return <SetPasswordCard />
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setValidationError(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.currentPassword) {
      setValidationError('Vui lòng nhập mật khẩu hiện tại.')
      return
    }

    if (!formData.newPassword || formData.newPassword.length < 6) {
      setValidationError('Mật khẩu mới phải có tối thiểu 6 ký tự.')
      return
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setValidationError('Mật khẩu xác nhận không trùng khớp với mật khẩu mới.')
      return
    }

    if (formData.currentPassword === formData.newPassword) {
      setWarningMessage('Mật khẩu mới không được trùng với mật khẩu hiện tại. Vui lòng nhập một mật khẩu khác.')
      setWarningModalOpen(true)
      return
    }

    setValidationError(null)
    mutation.mutate(formData)
  }

  const isPending = mutation.isPending

  return (
    <>
      <Card className="shadow-sm border-slate-200 bg-white">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl flex items-center gap-2 text-slate-800">
            <KeyRound className="w-5 h-5 text-indigo-600" />
            Đổi mật khẩu
          </CardTitle>
          <CardDescription className="text-slate-500">
            Cập nhật mật khẩu đăng nhập cá nhân để tăng cường bảo mật cho tài khoản của bạn.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-5">
            {validationError && (
              <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{validationError}</span>
              </div>
            )}

            <div className="space-y-5">
              {/* Mật khẩu hiện tại */}
              <div className="space-y-2">
                <Label htmlFor="currentPassword" className="font-medium text-slate-700">
                  Mật khẩu hiện tại <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    name="currentPassword"
                    type={showCurrent ? 'text' : 'password'}
                    placeholder="Nhập mật khẩu hiện tại"
                    value={formData.currentPassword}
                    onChange={handleChange}
                    disabled={isPending}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    tabIndex={-1}
                    disabled={isPending}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {/* Link nhỏ Quên mật khẩu */}
                <div className="flex justify-end pt-1">
                  <Link
                    href="/forgot-password"
                    className="text-xs font-medium text-indigo-600 hover:text-indigo-800 hover:underline transition-colors"
                  >
                    Quên mật khẩu?
                  </Link>
                </div>
              </div>

              {/* Mật khẩu mới */}
              <div className="space-y-2">
                <Label htmlFor="newPassword" className="font-medium text-slate-700">
                  Mật khẩu mới <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    name="newPassword"
                    type={showNew ? 'text' : 'password'}
                    placeholder="Tối thiểu 6 ký tự"
                    value={formData.newPassword}
                    onChange={handleChange}
                    disabled={isPending}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    tabIndex={-1}
                    disabled={isPending}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Xác nhận mật khẩu mới */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="font-medium text-slate-700">
                  Xác nhận mật khẩu mới <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="Nhập lại mật khẩu mới"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    disabled={isPending}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    tabIndex={-1}
                    disabled={isPending}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </CardContent>

          <CardFooter className="bg-slate-50/80 px-6 py-4 border-t border-slate-100 flex justify-end rounded-b-xl">
            <Button
              type="submit"
              disabled={isPending}
              className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm font-medium"
            >
              {isPending ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  Đang xử lý...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Đổi mật khẩu
                </span>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>

      {/* Modal Cảnh Báo Trùng Mật Khẩu Trực Quan ở Giữa Màn Hình */}
      <Dialog open={warningModalOpen} onOpenChange={setWarningModalOpen}>
        <DialogContent className="sm:max-w-md text-center p-6 sm:p-8">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-600 mb-2 ring-8 ring-amber-50">
            <ShieldAlert className="h-8 w-8" />
          </div>

          <DialogHeader className="text-center sm:text-center space-y-2">
            <DialogTitle className="text-xl font-bold text-slate-900 text-center">
              Mật khẩu bị trùng lặp
            </DialogTitle>
            <DialogDescription className="text-slate-600 text-sm text-center leading-relaxed">
              {warningMessage || 'Mật khẩu mới không được trùng với mật khẩu hiện tại hoặc 3 mật khẩu đã từng sử dụng gần đây.'}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="sm:justify-center mt-4">
            <Button
              type="button"
              onClick={() => setWarningModalOpen(false)}
              className="w-full sm:w-auto min-w-[140px] bg-amber-600 hover:bg-amber-700 text-white font-medium shadow-sm"
            >
              Đã hiểu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
