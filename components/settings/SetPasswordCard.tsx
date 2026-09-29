'use client'

import React, { useState, useEffect } from 'react'
import { KeyRound, Eye, EyeOff, Lock, AlertCircle, ShieldAlert, Send, Mail } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/useAuth'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { profileService } from '@/services/profileService'
import { SetPasswordRequest } from '@/types'
import { PasswordStrengthMeter, evaluatePassword, PASSWORD_CRITERIA_MESSAGE } from '@/components/ui/password-strength-meter'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { useI18n } from '@/lib/i18n/i18n-context'

export function SetPasswordCard() {
  const { t } = useI18n()
  const { toast } = useToast()
  const { logout, user } = useAuth()
  const queryClient = useQueryClient()

  const [formData, setFormData] = useState<SetPasswordRequest>({
    otpCode: '',
    newPassword: '',
    confirmPassword: ''
  })

  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)

  // Cooldown countdown for Resend OTP button
  const [cooldown, setCooldown] = useState(0)

  // State cho Modal Cảnh báo trùng mật khẩu
  const [warningModalOpen, setWarningModalOpen] = useState(false)
  const [warningMessage, setWarningMessage] = useState('')

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setInterval(() => {
      setCooldown(prev => prev - 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [cooldown])

  // Mutation send OTP
  const sendOtpMutation = useMutation({
    mutationFn: () => profileService.sendSetPasswordOtp(),
    onSuccess: (data) => {
      toast({
        title: t('Mã OTP đã được gửi'),
        description: data.message || t('Vui lòng kiểm tra hộp thư Gmail của bạn (kể cả thư mục Spam).'),
      })
      setCooldown(60)
    },
    onError: (error: any) => {
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.result ||
        t('Không thể gửi mã OTP. Vui lòng thử lại sau.')
      toast({
        title: t('Lỗi gửi OTP'),
        description: errorMessage,
        variant: 'destructive'
      })
    }
  })

  // Mutation set password
  const setPasswordMutation = useMutation({
    mutationFn: (data: SetPasswordRequest) => profileService.setPassword(data),
    onSuccess: async () => {
      toast({
        title: t('Thiết lập thành công'),
        description: t('Đã tạo mật khẩu đăng nhập thành công. Đang đăng xuất...'),
      })
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      setFormData({ otpCode: '', newPassword: '', confirmPassword: '' })
      setTimeout(async () => {
        await logout()
      }, 1200)
    },
    onError: (error: any) => {
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.result ||
        t('Có lỗi xảy ra khi thiết lập mật khẩu. Vui lòng thử lại.')

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
          title: t('Thất bại'),
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

    if (!formData.otpCode || formData.otpCode.trim().length !== 6) {
      setValidationError(t('Vui lòng nhập mã xác thực OTP 6 chữ số.'))
      return
    }

    if (!formData.newPassword) {
      setValidationError(t('Vui lòng nhập mật khẩu mới.'))
      return
    }

    const strength = evaluatePassword(formData.newPassword)
    if (!strength.isValid) {
      setValidationError(t(PASSWORD_CRITERIA_MESSAGE))
      return
    }

    if (formData.newPassword.length > 24) {
      setValidationError(t('Mật khẩu mới không được vượt quá 24 ký tự.'))
      return
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setValidationError(t('Mật khẩu xác nhận không trùng khớp với mật khẩu mới.'))
      return
    }

    setValidationError(null)
    setPasswordMutation.mutate(formData)
  }

  const isPending = setPasswordMutation.isPending || sendOtpMutation.isPending

  return (
    <>
      <Card className="shadow-sm border-slate-200 bg-white">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl flex items-center gap-2 text-slate-800">
            <KeyRound className="w-5 h-5 text-indigo-600" />
            {t('Thiết lập mật khẩu đăng nhập')}
          </CardTitle>
          <CardDescription className="text-slate-500">
            {t('Tài khoản của bạn được liên kết qua Google. Thiết lập mật khẩu riêng để có thể đăng nhập trực tiếp bằng Email & Mật khẩu.')}
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-5">
            {/* Informative Step Box */}
            <div className="flex items-start justify-between gap-3 p-4 bg-indigo-50/70 border border-indigo-100 rounded-xl text-slate-700">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100/80 rounded-lg text-indigo-600 shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div className="space-y-0.5 text-sm">
                  <p className="font-semibold text-slate-900">{t('Xác thực Email ({email})', { email: user?.email })}</p>
                  <p className="text-slate-500 text-xs">{t('Bấm nút để nhận mã OTP 6 số bảo mật trước khi đặt mật khẩu.')}</p>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => sendOtpMutation.mutate()}
                disabled={cooldown > 0 || sendOtpMutation.isPending}
                className="shrink-0 bg-white border-indigo-200 hover:bg-indigo-50 text-indigo-600 text-xs font-medium"
              >
                {sendOtpMutation.isPending ? (
                  <span className="flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 border-2 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin" />
                    {t('Đang gửi...')}
                  </span>
                ) : cooldown > 0 ? (
                  t('Gửi lại sau ({cooldown}s)', { cooldown })
                ) : (
                  <span className="flex items-center gap-1.5">
                    <Send className="w-3.5 h-3.5" />
                    {t('Gửi mã OTP')}
                  </span>
                )}
              </Button>
            </div>

            {validationError && (
              <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{validationError}</span>
              </div>
            )}

            {/* Mã OTP */}
            <div className="space-y-2">
              <Label htmlFor="otpCode" className="font-medium text-slate-700">
                {t('Mã xác thực OTP (6 số)')} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="otpCode"
                name="otpCode"
                type="text"
                maxLength={6}
                placeholder={t('Nhập 6 số OTP gửi về Gmail')}
                value={formData.otpCode}
                onChange={handleChange}
                disabled={isPending}
                className="font-mono text-center tracking-widest text-lg font-semibold"
              />
            </div>

            {/* Mật khẩu mới */}
            <div className="space-y-2">
              <Label htmlFor="newPassword" className="font-medium text-slate-700">
                {t('Mật khẩu mới')} <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  name="newPassword"
                  type={showNew ? 'text' : 'password'}
                  placeholder={t('Tối thiểu 8 ký tự (hoa, thường, số, ký tự đặc biệt)')}
                  value={formData.newPassword}
                  onChange={handleChange}
                  disabled={isPending}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <PasswordStrengthMeter password={formData.newPassword} />
            </div>

            {/* Xác nhận mật khẩu mới */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="font-medium text-slate-700">
                {t('Xác nhận mật khẩu mới')} <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirm ? 'text' : 'password'}
                  placeholder={t('Nhập lại mật khẩu mới')}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={isPending}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </CardContent>

          <CardFooter className="bg-slate-50/80 px-6 py-4 border-t border-slate-100 flex justify-end rounded-b-xl">
            <Button
              type="submit"
              disabled={isPending}
              className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm font-medium"
            >
              {setPasswordMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  {t('Đang thiết lập...')}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  {t('Xác nhận & Lưu mật khẩu')}
                </span>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>

      {/* Modal Cảnh Báo Trùng Mật Khẩu */}
      <Dialog open={warningModalOpen} onOpenChange={setWarningModalOpen}>
        <DialogContent className="sm:max-w-md text-center p-6 sm:p-8">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-600 mb-2 ring-8 ring-amber-50">
            <ShieldAlert className="h-8 w-8" />
          </div>

          <DialogHeader className="text-center sm:text-center space-y-2">
            <DialogTitle className="text-xl font-bold text-slate-900 text-center">
              {t('Mật khẩu bị trùng lặp')}
            </DialogTitle>
            <DialogDescription className="text-slate-600 text-sm text-center leading-relaxed">
              {warningMessage || t('Mật khẩu mới không được trùng với 3 mật khẩu đã từng sử dụng gần đây.')}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="sm:justify-center mt-4">
            <Button
              type="button"
              onClick={() => setWarningModalOpen(false)}
              className="w-full sm:w-auto min-w-[140px] bg-amber-600 hover:bg-amber-700 text-white font-medium shadow-sm"
            >
              {t('Đã hiểu')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
