'use client'

import React, { useState, useEffect, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Spinner } from '@/components/ui/spinner'
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp'
import { ShieldCheck, QrCode, Key, Copy, Check, ArrowRight, ArrowLeft } from 'lucide-react'
import {
  authService,
  TwoFactorSetupResponse,
  TwoFactorConfirmResponse,
} from '@/services/authService'
import { BackupCodesViewer } from './BackupCodesViewer'
import { AxiosError } from 'axios'

interface TwoFactorSetupWizardProps {
  isOpen: boolean
  preAuthToken: string
  email: string
  rememberMe?: boolean
  onClose: () => void
  onSuccess: (confirmResponse: TwoFactorConfirmResponse) => void
}

export function TwoFactorSetupWizard({
  isOpen,
  preAuthToken,
  email,
  onClose,
  onSuccess,
}: TwoFactorSetupWizardProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [isLoading, setIsLoading] = useState(false)
  const [qrData, setQrData] = useState<TwoFactorSetupResponse | null>(null)
  const [otpCode, setOtpCode] = useState('')
  const [error, setError] = useState('')
  const [copiedSecret, setCopiedSecret] = useState(false)
  const [confirmResponse, setConfirmResponse] = useState<TwoFactorConfirmResponse | null>(null)
  const [isBackupConfirmed, setIsBackupConfirmed] = useState(false)
  const fetchedTokenRef = useRef<string | null>(null)

  // Khởi tạo mã QR khi mở modal
  useEffect(() => {
    if (isOpen && preAuthToken) {
      if (fetchedTokenRef.current === preAuthToken) {
        return
      }
      fetchedTokenRef.current = preAuthToken
      setStep(1)
      setError('')
      setOtpCode('')
      setIsBackupConfirmed(false)
      fetchSetupData()
    } else if (!isOpen) {
      fetchedTokenRef.current = null
    }
  }, [isOpen, preAuthToken])

  const fetchSetupData = async () => {
    setIsLoading(true)
    setError('')
    try {
      const data = await authService.initiate2faSetup(preAuthToken)
      setQrData(data)
    } catch (err) {
      const axiosErr = err as AxiosError<{ message?: string }>
      setError(
        axiosErr.response?.data?.message ||
        'Không thể khởi tạo mã thiết lập 2FA. Phiên có thể đã hết hạn.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopySecret = async () => {
    if (!qrData?.secretKey) return
    try {
      await navigator.clipboard.writeText(qrData.secretKey)
      setCopiedSecret(true)
      setTimeout(() => setCopiedSecret(false), 2000)
    } catch (err) {
      console.error('Không thể copy secret key:', err)
    }
  }

  const handleConfirmOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (otpCode.length !== 6) {
      setError('Vui lòng nhập đủ 6 chữ số từ ứng dụng Authenticator.')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const res = await authService.confirm2faSetup({ code: otpCode }, preAuthToken)
      setConfirmResponse(res)
      setStep(3)
    } catch (err) {
      const axiosErr = err as AxiosError<{ message?: string }>
      setError(
        axiosErr.response?.data?.message ||
        'Mã xác thực không chính xác hoặc đã hết hạn. Vui lòng thử lại.'
      )
      setOtpCode('')
    } finally {
      setIsLoading(false)
    }
  }

  const handleComplete = () => {
    if (confirmResponse) {
      onSuccess(confirmResponse)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[480px] p-6 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-center sm:text-center pb-2">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-2 shadow-xs">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <DialogTitle className="text-xl font-bold">
            {step === 1 && 'Thiết lập Xác thực 2 bước (2FA)'}
            {step === 2 && 'Xác nhận Mã từ Ứng dụng'}
            {step === 3 && 'Lưu Mã Dự Phòng (Backup Codes)'}
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm text-muted-foreground">
            {step === 1 && 'Tài khoản Quản trị viên bắt buộc kích hoạt Google Authenticator.'}
            {step === 2 && `Nhập mã 6 chữ số hiển thị trên ứng dụng cho tài khoản ${email}.`}
            {step === 3 && 'Kích hoạt thành công! Hãy lưu các mã dự phòng này để phòng khi mất thiết bị.'}
          </DialogDescription>
        </DialogHeader>

        {/* Indicator 3 bước */}
        <div className="flex items-center justify-center gap-2 my-1">
          <div className={`h-1.5 rounded-full transition-all ${step >= 1 ? 'w-8 bg-primary' : 'w-3 bg-muted'}`} />
          <div className={`h-1.5 rounded-full transition-all ${step >= 2 ? 'w-8 bg-primary' : 'w-3 bg-muted'}`} />
          <div className={`h-1.5 rounded-full transition-all ${step >= 3 ? 'w-8 bg-primary' : 'w-3 bg-muted'}`} />
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs sm:text-sm text-center">
            {error}
          </div>
        )}

        {/* BƯỚC 1: QUÉT QR CODE */}
        {step === 1 && (
          <div className="space-y-4 pt-2">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <Spinner className="w-8 h-8 text-primary" />
                <p className="text-sm text-muted-foreground">Đang tạo mã QR bảo mật...</p>
              </div>
            ) : qrData ? (
              <>
                <div className="flex flex-col items-center justify-center p-4 bg-muted/30 rounded-xl border border-border">
                  <div className="p-2 bg-white rounded-lg shadow-xs">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={qrData.qrCodeDataUrl}
                      alt="Google Authenticator QR Code"
                      className="w-48 h-48 sm:w-52 sm:h-52 object-contain"
                    />
                  </div>
                  <div className="mt-3 text-center">
                    <p className="text-xs font-medium text-foreground flex items-center justify-center gap-1.5">
                      <QrCode className="w-3.5 h-3.5 text-primary" /> Quét mã bằng Google Authenticator hoặc Authy
                    </p>
                  </div>
                </div>

                {/* Nhập mã thủ công */}
                <div className="p-3 rounded-lg bg-muted/40 border border-border/60 space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
                    <span className="flex items-center gap-1">
                      <Key className="w-3.5 h-3.5" /> Không thể quét mã? Nhập khóa thủ công:
                    </span>
                    <button
                      type="button"
                      onClick={handleCopySecret}
                      className="text-primary hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      {copiedSecret ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-500" />
                          <span className="text-emerald-500 font-semibold">Đã copy</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Sao chép</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="font-mono text-xs font-bold tracking-widest text-center py-1.5 px-2 bg-background rounded border border-border/50 select-all">
                    {qrData.manualEntryKey}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    className="flex-1"
                  >
                    Hủy
                  </Button>
                  <Button
                    type="button"
                    onClick={() => {
                      setError('')
                      setStep(2)
                    }}
                    className="flex-1 gap-1.5"
                  >
                    <span>Tiếp tục</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-4 gap-3">
                <p className="text-xs sm:text-sm text-muted-foreground text-center">
                  Phiên thiết lập có thể đã hết hạn (quá 5 phút) sau khi reset dữ liệu. Vui lòng đăng nhập lại từ đầu.
                </p>
                <div className="flex items-center gap-2 w-full pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={fetchSetupData}
                    className="flex-1"
                  >
                    Thử lại
                  </Button>
                  <Button
                    type="button"
                    onClick={onClose}
                    className="flex-1"
                  >
                    Đăng nhập lại
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* BƯỚC 2: NHẬP MÃ XÁC NHẬN */}
        {step === 2 && (
          <form onSubmit={handleConfirmOtp} className="space-y-5 pt-2">
            <div className="flex flex-col items-center justify-center py-4 space-y-4">
              <p className="text-xs sm:text-sm text-center text-muted-foreground">
                Mở ứng dụng <strong>Google Authenticator</strong> hoặc <strong>Authy</strong> trên điện thoại và nhập mã 6 số cho <strong>MathClass</strong>:
              </p>

              <div className="flex justify-center">
                <InputOTP
                  maxLength={6}
                  value={otpCode}
                  onChange={(val) => {
                    setOtpCode(val)
                    if (error) setError('')
                  }}
                  autoFocus
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                  </InputOTPGroup>
                  <div className="text-muted-foreground font-bold px-1">-</div>
                  <InputOTPGroup>
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setError('')
                  setStep(1)
                }}
                disabled={isLoading}
                className="gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Quay lại</span>
              </Button>
              <Button
                type="submit"
                disabled={otpCode.length !== 6 || isLoading}
                className="flex-1 gap-2"
              >
                {isLoading ? (
                  <>
                    <Spinner className="w-4 h-4" />
                    <span>Đang xác nhận...</span>
                  </>
                ) : (
                  <>
                    <span>Xác nhận & Kích hoạt</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          </form>
        )}

        {/* BƯỚC 3: MÃ DỰ PHÒNG */}
        {step === 3 && confirmResponse && (
          <div className="space-y-5 pt-2">
            <BackupCodesViewer codes={confirmResponse.backupCodes} />

            <div className="flex items-start gap-2 pt-1">
              <Checkbox
                id="confirm-backup"
                checked={isBackupConfirmed}
                onCheckedChange={(checked) => setIsBackupConfirmed(!!checked)}
                className="mt-0.5"
              />
              <label
                htmlFor="confirm-backup"
                className="text-xs sm:text-sm leading-tight text-foreground font-medium cursor-pointer"
              >
                Tôi xác nhận đã lưu trữ danh sách mã dự phòng này ở nơi an toàn.
              </label>
            </div>

            <Button
              type="button"
              disabled={!isBackupConfirmed}
              onClick={handleComplete}
              className="w-full h-10 font-semibold gap-2"
            >
              <span>Hoàn tất & Truy cập Quản trị</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
