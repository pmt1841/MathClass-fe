'use client'

import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp'
import { ShieldCheck, KeyRound, Smartphone, AlertCircle, ArrowRight } from 'lucide-react'
import { authService, LoginResponse } from '@/services/authService'
import { AxiosError } from 'axios'

interface TwoFactorVerifyModalProps {
  isOpen: boolean
  preAuthToken: string
  email: string
  rememberMe?: boolean
  onClose: () => void
  onSuccess: (data: LoginResponse) => void
}

export function TwoFactorVerifyModal({
  isOpen,
  preAuthToken,
  email,
  rememberMe = false,
  onClose,
  onSuccess,
}: TwoFactorVerifyModalProps) {
  const [isBackupMode, setIsBackupMode] = useState(false)
  const [otpCode, setOtpCode] = useState('')
  const [backupCode, setBackupCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [isRateLimited, setIsRateLimited] = useState(false)
  const [shake, setShake] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setOtpCode('')
      setBackupCode('')
      setError('')
      setIsRateLimited(false)
      setIsBackupMode(false)
    }
  }, [isOpen])

  // Tự động submit khi nhập đủ 6 số OTP
  useEffect(() => {
    if (otpCode.length === 6 && !isLoading && !isBackupMode) {
      handleSubmitVerify(otpCode, false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otpCode])

  const triggerShake = () => {
    setShake(true)
    setTimeout(() => setShake(false), 500)
  }

  const handleSubmitVerify = async (codeToVerify: string, isBackup: boolean) => {
    if (!codeToVerify || codeToVerify.trim().length === 0) {
      setError(isBackup ? 'Vui lòng nhập mã dự phòng.' : 'Vui lòng nhập đủ 6 chữ số.')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const res = await authService.verify2faLogin(
        {
          code: codeToVerify.trim(),
          isBackupCode: isBackup,
          rememberMe,
        },
        preAuthToken
      )
      onSuccess(res)
    } catch (err) {
      triggerShake()
      const axiosErr = err as AxiosError<{ message?: string; errorCode?: string }>
      if (axiosErr.response?.status === 429) {
        setIsRateLimited(true)
        setError(
          axiosErr.response?.data?.message ||
            'Bạn đã nhập sai mã quá 5 lần. Vui lòng thử lại sau 15 phút.'
        )
      } else {
        setError(
          axiosErr.response?.data?.message ||
            (isBackup
              ? 'Mã dự phòng không đúng hoặc đã được sử dụng.'
              : 'Mã xác thực 6 số không đúng hoặc đã hết hạn.')
        )
      }
      if (!isBackup) {
        setOtpCode('')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleBackupSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleSubmitVerify(backupCode, true)
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isLoading && onClose()}>
      <DialogContent className={`sm:max-w-[440px] p-6 ${shake ? 'animate-shake' : ''}`}>
        <DialogHeader className="text-center sm:text-center pb-2">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-2 shadow-xs">
            {isBackupMode ? <KeyRound className="w-6 h-6" /> : <ShieldCheck className="w-6 h-6" />}
          </div>
          <DialogTitle className="text-xl font-bold">
            {isBackupMode ? 'Đăng nhập bằng Mã Dự Phòng' : 'Xác thực 2 Bước (2FA)'}
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm text-muted-foreground">
            {isBackupMode
              ? `Nhập 1 trong 8 mã dự phòng (8 ký tự) đã lưu cho tài khoản ${email}.`
              : `Mở Google Authenticator trên điện thoại và nhập mã 6 số cho ${email}.`}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs sm:text-sm">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <p className="leading-snug">{error}</p>
          </div>
        )}

        {/* CHẾ ĐỘ 1: NHẬP OTP 6 SỐ */}
        {!isBackupMode ? (
          <div className="space-y-6 pt-2">
            <div className="flex justify-center py-3">
              <InputOTP
                maxLength={6}
                value={otpCode}
                onChange={(val) => {
                  setOtpCode(val)
                  if (error) setError('')
                }}
                disabled={isLoading || isRateLimited}
                autoFocus
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} className="h-11 w-10 text-base font-bold" />
                  <InputOTPSlot index={1} className="h-11 w-10 text-base font-bold" />
                  <InputOTPSlot index={2} className="h-11 w-10 text-base font-bold" />
                </InputOTPGroup>
                <div className="text-muted-foreground font-bold px-1.5">-</div>
                <InputOTPGroup>
                  <InputOTPSlot index={3} className="h-11 w-10 text-base font-bold" />
                  <InputOTPSlot index={4} className="h-11 w-10 text-base font-bold" />
                  <InputOTPSlot index={5} className="h-11 w-10 text-base font-bold" />
                </InputOTPGroup>
              </InputOTP>
            </div>

            {isLoading && (
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <Spinner className="w-4 h-4 text-primary" />
                <span>Đang kiểm tra mã xác thực...</span>
              </div>
            )}

            <div className="pt-2 border-t border-border/60 flex flex-col items-center gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setIsBackupMode(true)
                  setError('')
                }}
                className="text-xs text-primary hover:underline font-medium flex items-center gap-1.5 cursor-pointer"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Không có điện thoại? Sử dụng Mã dự phòng</span>
              </button>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onClose}
                disabled={isLoading}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Hủy và quay lại đăng nhập
              </Button>
            </div>
          </div>
        ) : (
          /* CHẾ ĐỘ 2: NHẬP MÃ DỰ PHÒNG */
          <form onSubmit={handleBackupSubmit} className="space-y-5 pt-2">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground">
                Mã dự phòng (8 ký tự dạng XXXX-XXXX)
              </label>
              <Input
                placeholder="VD: A1B2-C3D4"
                value={backupCode}
                onChange={(e) => {
                  setBackupCode(e.target.value.toUpperCase())
                  if (error) setError('')
                }}
                disabled={isLoading || isRateLimited}
                className="h-10 text-center font-mono font-bold tracking-widest uppercase"
                autoFocus
              />
            </div>

            <Button
              type="submit"
              disabled={backupCode.trim().length === 0 || isLoading || isRateLimited}
              className="w-full h-10 font-semibold gap-2"
            >
              {isLoading ? (
                <>
                  <Spinner className="w-4 h-4" />
                  <span>Đang xác minh...</span>
                </>
              ) : (
                <>
                  <span>Xác nhận Đăng nhập</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>

            <div className="pt-2 border-t border-border/60 flex flex-col items-center gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setIsBackupMode(false)
                  setError('')
                }}
                className="text-xs text-primary hover:underline font-medium flex items-center gap-1.5 cursor-pointer"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Quay lại nhập mã từ Google Authenticator</span>
              </button>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onClose}
                disabled={isLoading}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Hủy và quay lại đăng nhập
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
