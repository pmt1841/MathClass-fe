'use client'

import { useState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { AlertTriangle, Upload, X, Loader2, Image as ImageIcon, CheckCircle2, KeyRound, Mail } from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { bugReportService, BugErrorType } from '@/services/bugReportService'
import { toast } from 'sonner'

const ERROR_TYPE_OPTIONS: { value: BugErrorType; label: string }[] = [
  { value: 'LOGIN_ACCOUNT', label: '1. Lỗi đăng nhập / tài khoản' },
  { value: 'UI_KATEX', label: '2. Lỗi hiển thị giao diện / công thức Toán (KaTeX)' },
  { value: 'SUBMISSION_PROBLEM', label: '3. Lỗi không nộp bài / không tải được đề bài' },
  { value: 'PERFORMANCE', label: '4. Lỗi tốc độ / không phản hồi' },
  { value: 'OTHER', label: '5. Khác' },
]

const formSchema = z.object({
  email: z.string().trim().email('Email không hợp lệ').min(1, 'Email là bắt buộc'),
  errorType: z.string({
    required_error: 'Vui lòng chọn loại lỗi bạn gặp phải',
  }).min(1, 'Vui lòng chọn loại lỗi bạn gặp phải'),
  description: z.string().optional(),
  otp: z.string().optional(),
  website: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface ReportBugModalProps {
  open: boolean
  onClose: () => void
  defaultEmail?: string
  defaultName?: string
  isAuthenticated?: boolean
}

export function ReportBugModal({
  open,
  onClose,
  defaultEmail = '',
  defaultName = '',
  isAuthenticated = false,
}: ReportBugModalProps) {
  const [imageFiles, setImageFiles] = useState<{ file: File; preview: string; url?: string }[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [sendingOtp, setSendingOtp] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [otpCooldown, setOtpCooldown] = useState(0)

  const imageFilesRef = useRef(imageFiles)
  imageFilesRef.current = imageFiles

  const formLoadedAtRef = useRef<number>(Date.now())

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: defaultEmail,
      errorType: '',
      description: '',
      otp: '',
      website: '',
    },
  })

  // Đếm ngược 60s Cooldown gửi OTP cho Guest
  useEffect(() => {
    const checkCooldown = () => {
      const savedTime = localStorage.getItem('bug_report_otp_cooldown')
      if (savedTime) {
        const remaining = Math.ceil((parseInt(savedTime, 10) - Date.now()) / 1000)
        if (remaining > 0) {
          setOtpCooldown(remaining)
        } else {
          setOtpCooldown(0)
          localStorage.removeItem('bug_report_otp_cooldown')
        }
      }
    }

    checkCooldown()
    const interval = setInterval(checkCooldown, 1000)
    return () => clearInterval(interval)
  }, [])

  // Cleanup Blob Object URLs khi unmount
  useEffect(() => {
    return () => {
      imageFilesRef.current.forEach((item) => {
        if (item.preview) {
          URL.revokeObjectURL(item.preview)
        }
      })
    }
  }, [])

  useEffect(() => {
    if (open) {
      formLoadedAtRef.current = Date.now()
      form.reset({
        email: defaultEmail,
        errorType: '',
        description: '',
        otp: '',
        website: '',
      })
      setImageFiles((prev) => {
        prev.forEach((item) => {
          if (item.preview) {
            URL.revokeObjectURL(item.preview)
          }
        })
        return []
      })
      setOtpSent(false)
    }
  }, [open, defaultEmail, form])

  const handleSendOtp = async () => {
    const email = form.getValues('email')
    if (!email || !z.string().email().safeParse(email).success) {
      form.setError('email', { message: 'Vui lòng nhập địa chỉ Email hợp lệ để nhận mã OTP' })
      return
    }

    setSendingOtp(true)
    try {
      const res = await bugReportService.sendPublicOtp(email)
      toast.success(res?.message || 'Mã OTP 6 số đã được gửi đến email của bạn! Vui lòng kiểm tra hòm thư.')
      setOtpSent(true)
      const expireTime = Date.now() + 60000
      localStorage.setItem('bug_report_otp_cooldown', expireTime.toString())
      setOtpCooldown(60)
    } catch (err: any) {
      console.warn('Lỗi gửi mã OTP:', err?.response?.data?.message || err?.message)
      const msg = err?.response?.data?.message || 'Không thể gửi mã OTP. Vui lòng kiểm tra lại địa chỉ email.'
      toast.error(msg)
      form.setError('email', { message: msg })
    } finally {
      setSendingOtp(false)
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    if (imageFiles.length + files.length > 3) {
      toast.error('Bạn chỉ được phép đính kèm tối đa 3 ảnh')
      return
    }

    const validFiles: { file: File; preview: string }[] = []
    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`File ${file.name} vượt quá dung lượng cho phép (5MB)`)
        continue
      }
      if (!file.type.startsWith('image/')) {
        toast.error(`File ${file.name} không phải là định dạng hình ảnh`)
        continue
      }
      validFiles.push({
        file,
        preview: URL.createObjectURL(file),
      })
    }

    setImageFiles((prev) => [...prev, ...validFiles])
    e.target.value = ''
  }

  const handleRemoveImage = (index: number) => {
    setImageFiles((prev) => {
      const updated = [...prev]
      if (updated[index]?.preview) {
        URL.revokeObjectURL(updated[index].preview)
      }
      updated.splice(index, 1)
      return updated
    })
  }

  const onSubmit = async (values: FormValues) => {
    if (!isAuthenticated) {
      if (!values.otp || values.otp.trim().length !== 6) {
        form.setError('otp', { message: 'Vui lòng nhập mã OTP xác thực 6 số đã gửi về email' })
        return
      }
    }

    setIsSubmitting(true)
    try {
      // 1. Upload ảnh đính kèm nếu có
      const uploadedUrls: string[] = []
      if (imageFiles.length > 0) {
        setUploadingImage(true)
        for (const item of imageFiles) {
          try {
            const res = await bugReportService.uploadPublicImage(item.file)
            const resultObj = res?.result || res
            const url = typeof resultObj === 'string' ? resultObj : resultObj?.imageUrl || resultObj?.url
            if (url) {
              uploadedUrls.push(url)
            } else {
              throw new Error('Không nhận được URL ảnh từ máy chủ')
            }
          } catch (err: any) {
            console.error('Lỗi khi tải ảnh:', err)
            toast.error(`Tải ảnh ${item.file.name} thất bại. Vui lòng kiểm tra dung lượng hoặc kết nối mạng.`)
            setIsSubmitting(false)
            setUploadingImage(false)
            return
          }
        }
        setUploadingImage(false)
      }

      // 2. Gửi request báo cáo
      const payload = {
        reporterEmail: values.email,
        reporterName: defaultName || undefined,
        errorType: values.errorType as BugErrorType,
        description: values.description || undefined,
        imageUrls: uploadedUrls,
        otp: !isAuthenticated ? values.otp?.trim() : undefined,
        website: values.website || undefined,
        formLoadedAt: formLoadedAtRef.current,
      }

      if (isAuthenticated) {
        await bugReportService.createAuthenticatedReport(payload)
      } else {
        await bugReportService.createPublicReport(payload)
      }

      toast.success('Cảm ơn bạn! Báo cáo lỗi đã được gửi thành công đến Quản trị viên.')
      onClose()
    } catch (error: any) {
      console.warn('Submit report error:', error?.response?.data?.message || error?.message)
      const msg = error?.response?.data?.message || 'Có lỗi xảy ra khi gửi báo cáo sự cố'
      toast.error(msg)
    } finally {
      setIsSubmitting(false)
      setUploadingImage(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[540px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-foreground">
                Báo cáo lỗi hệ thống
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Hãy cho chúng tôi biết sự cố bạn đang gặp phải để bộ phận kỹ thuật hỗ trợ kịp thời.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
            {/* Honeypot Field (Bẫy ẩn đánh lừa Bot tự động điền) */}
            <input
              type="text"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              className="opacity-0 absolute -left-[9999px] pointer-events-none"
              {...form.register('website')}
            />

            {/* Field Email & Nút Gửi OTP cho Guest */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold">
                    Email liên hệ <span className="text-destructive">*</span>
                  </FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input
                        placeholder="you@example.com"
                        disabled={isAuthenticated}
                        className={isAuthenticated ? 'bg-muted text-muted-foreground' : ''}
                        {...field}
                      />
                    </FormControl>
                    {!isAuthenticated && (
                      <Button
                        type="button"
                        variant="secondary"
                        disabled={sendingOtp || otpCooldown > 0}
                        onClick={handleSendOtp}
                        className="whitespace-nowrap shrink-0 font-medium"
                      >
                        {sendingOtp ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : otpCooldown > 0 ? (
                          <span>Gửi lại ({otpCooldown}s)</span>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <Mail className="h-4 w-4" />
                            <span>{otpSent ? 'Gửi lại OTP' : 'Gửi mã OTP'}</span>
                          </div>
                        )}
                      </Button>
                    )}
                  </div>
                  {isAuthenticated && (
                    <p className="text-xs text-muted-foreground">
                      Tự động sử dụng Email tài khoản đang đăng nhập của bạn.
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Field Mã OTP (chỉ hiển thị khi chưa đăng nhập) */}
            {!isAuthenticated && (
              <FormField
                control={form.control}
                name="otp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold flex items-center justify-between">
                      <span>Mã xác thực OTP (6 chữ số) <span className="text-destructive">*</span></span>
                      {otpSent && (
                        <span className="text-xs text-emerald-600 font-normal">
                          ✓ Đã gửi mã về email của bạn
                        </span>
                      )}
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Nhập 6 chữ số OTP (ví dụ: 582910)"
                          maxLength={6}
                          className="pl-9 font-mono tracking-widest text-base font-semibold"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Field Loại lỗi */}
            <FormField
              control={form.control}
              name="errorType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold">
                    Lựa chọn loại lỗi <span className="text-destructive">*</span>
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ''}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn loại lỗi bạn gặp phải" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ERROR_TYPE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Field Mô tả sự cố */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold">
                    Mô tả sự cố <span className="text-xs font-normal text-muted-foreground">(Không bắt buộc)</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Chi tiết về các bước xảy ra lỗi hoặc thông tin bổ sung giúp giải quyết nhanh hơn..."
                      rows={3}
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Upload Ảnh đính kèm (Tối đa 3 ảnh, <= 5MB) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <FormLabel className="font-semibold">
                  Ảnh đính kèm <span className="text-xs font-normal text-muted-foreground">(Tối đa 3 ảnh, ≤ 5MB/ảnh)</span>
                </FormLabel>
                <span className="text-xs font-medium text-muted-foreground">
                  {imageFiles.length}/3 ảnh
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {imageFiles.map((item, idx) => (
                  <div key={idx} className="relative aspect-video rounded-lg border border-border bg-muted overflow-hidden group">
                    <img
                      src={item.preview}
                      alt={`Ảnh đính kèm ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white hover:bg-destructive transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}

                {imageFiles.length < 3 && (
                  <label className="flex flex-col items-center justify-center aspect-video rounded-lg border-2 border-dashed border-border hover:border-primary/50 bg-muted/30 hover:bg-muted cursor-pointer transition-all">
                    <Upload className="h-5 w-5 text-muted-foreground mb-1" />
                    <span className="text-xs font-medium text-muted-foreground">Tải ảnh lên</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                Hủy bỏ
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {uploadingImage ? 'Đang tải ảnh...' : 'Đang gửi...'}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Gửi báo cáo
                  </div>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
