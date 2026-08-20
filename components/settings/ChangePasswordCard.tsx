'use client'

import React, { useState } from 'react'
import { KeyRound, Eye, EyeOff, Lock, AlertCircle, ShieldAlert, Info } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/useAuth'
import { useMutation } from '@tanstack/react-query'
import { profileService } from '@/services/profileService'
import { ChangePasswordRequest } from '@/types'
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
  const { user, logout } = useAuth()

  const isGoogleUser = user?.provider === 'GOOGLE'

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setValidationError(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (isGoogleUser) {
      return
    }

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
  const isFormDisabled = isPending || isGoogleUser

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
            {/* Google OAuth Account Notice Banner */}
            {isGoogleUser && (
              <div className="flex items-start gap-3 p-4 bg-blue-50/70 border border-blue-200/80 rounded-xl text-slate-700 animate-in fade-in duration-300">
                <div className="p-2 bg-white rounded-lg border border-blue-100 shrink-0 shadow-xs">
                  <Info className="w-5 h-5 text-blue-600" />
                </div>
                <div className="space-y-1 text-sm">
                  <p className="font-semibold text-slate-900">Tài khoản liên kết Google</p>
                  <p className="text-slate-600 leading-relaxed">
                    Bạn đang đăng nhập bằng tài khoản Google. Tính năng đổi mật khẩu trực tiếp không khả dụng cho phương thức này.
                  </p>
                </div>
              </div>
            )}

            {validationError && (
              <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{validationError}</span>
              </div>
            )}

            <div
              className={`space-y-5 transition-all duration-300 ${
                isGoogleUser ? 'opacity-40 grayscale-[0.3] pointer-events-none select-none' : ''
              }`}
              title={isGoogleUser ? 'Tính năng không khả dụng cho tài khoản Google' : undefined}
            >
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
                    disabled={isFormDisabled}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    tabIndex={-1}
                    disabled={isFormDisabled}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors disabled:pointer-events-none"
                  >
                    {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
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
                    disabled={isFormDisabled}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    tabIndex={-1}
                    disabled={isFormDisabled}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors disabled:pointer-events-none"
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
                    disabled={isFormDisabled}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    tabIndex={-1}
                    disabled={isFormDisabled}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors disabled:pointer-events-none"
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
              disabled={isFormDisabled}
              className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              title={isGoogleUser ? 'Tính năng không khả dụng cho tài khoản Google' : undefined}
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
