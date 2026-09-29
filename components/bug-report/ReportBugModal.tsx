'use client'

import { useState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  AlertTriangle,
  Upload,
  X,
  Loader2,
  Image as ImageIcon,
  CheckCircle2,
  KeyRound,
  Mail,
  Building2,
  Search,
  Check,
  ChevronDown,
  Edit3,
} from 'lucide-react'
import { VIETNAM_BANKS, searchBanks, getBankInfo, VietnamBank } from '@/lib/constants/vietnam-banks'
import { cn } from '@/lib/utils'

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
import { useI18n } from '@/lib/i18n/i18n-context'

const ERROR_TYPE_OPTIONS: { value: BugErrorType; labelKey: string }[] = [
  { value: 'LOGIN_ACCOUNT', labelKey: 'bugReport.errLoginAccount' },
  { value: 'UI_KATEX', labelKey: 'bugReport.errUiKaTex' },
  { value: 'SUBMISSION_PROBLEM', labelKey: 'bugReport.errSubmission' },
  { value: 'PERFORMANCE', labelKey: 'bugReport.errPerformance' },
  { value: 'AI_ASSISTANT', labelKey: 'bugReport.errAiAssistant' },
  { value: 'CREDIT_TRANSACTION', labelKey: 'bugReport.errCreditTransaction' },
  { value: 'PAYMENT_REFUND', labelKey: '7. Nạp Credit / Yêu cầu hoàn tiền' },
  { value: 'OTHER', labelKey: 'bugReport.errOther' },
]

const formSchema = z
  .object({
    email: z.string().trim().email('Email không hợp lệ').min(1, 'Email là bắt buộc'),
    errorType: z.string({
      required_error: 'Vui lòng chọn loại lỗi bạn gặp phải',
    }).min(1, 'Vui lòng chọn loại lỗi bạn gặp phải'),
    orderCode: z.string().optional(),
    bankCode: z.string().optional(),
    accountNumber: z.string().optional(),
    accountHolderName: z.string().optional(),
    description: z.string().optional(),
    otp: z.string().optional(),
    website: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.errorType === 'PAYMENT_REFUND') {
      if (!data.orderCode || !data.orderCode.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['orderCode'],
          message: 'Vui lòng nhập mã đơn hàng cần hoàn tiền',
        })
      }
      if (!data.bankCode || !data.bankCode.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['bankCode'],
          message: 'Vui lòng chọn hoặc nhập ngân hàng nhận tiền hoàn',
        })
      }
      if (!data.accountNumber || !data.accountNumber.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['accountNumber'],
          message: 'Vui lòng nhập số tài khoản ngân hàng',
        })
      }
      if (!data.accountHolderName || !data.accountHolderName.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['accountHolderName'],
          message: 'Vui lòng nhập tên chủ tài khoản',
        })
      }
    }
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
  const { t } = useI18n()
  const [imageFiles, setImageFiles] = useState<{ file: File; preview: string; url?: string }[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [sendingOtp, setSendingOtp] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [otpCooldown, setOtpCooldown] = useState(0)
  const [isDragging, setIsDragging] = useState(false)

  // Quản lý tìm kiếm và gõ tay tự do cho Ngân hàng thụ hưởng
  const [bankSearchQuery, setBankSearchQuery] = useState('')
  const [isBankDropdownOpen, setIsBankDropdownOpen] = useState(false)
  const bankSelectorRef = useRef<HTMLDivElement>(null)

  const imageFilesRef = useRef(imageFiles)
  imageFilesRef.current = imageFiles

  const formLoadedAtRef = useRef<number>(Date.now())

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: defaultEmail,
      errorType: '',
      orderCode: '',
      bankCode: '',
      accountNumber: '',
      accountHolderName: '',
      description: '',
      otp: '',
      website: '',
    },
  })

  const watchErrorType = form.watch('errorType')

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

  // Xử lý đóng dropdown ngân hàng khi click bên ngoài
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (bankSelectorRef.current && !bankSelectorRef.current.contains(e.target as Node)) {
        setIsBankDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
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
        orderCode: '',
        bankCode: '',
        accountNumber: '',
        accountHolderName: '',
        description: '',
        otp: '',
        website: '',
      })
      setBankSearchQuery('')
      setIsBankDropdownOpen(false)
      setImageFiles((prev) => {
        prev.forEach((item) => {
          if (item.preview) {
            URL.revokeObjectURL(item.preview)
          }
        })
        return []
      })
      setOtpSent(false)
      setIsDragging(false)
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

  const processFiles = (files: File[]) => {
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
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    processFiles(files)
    e.target.value = ''
  }

  const handleDragOver = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (imageFiles.length < 3) {
      setIsDragging(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.currentTarget.contains(e.relatedTarget as Node)) return
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    if (imageFiles.length >= 3) {
      toast.error('Bạn chỉ được phép đính kèm tối đa 3 ảnh')
      return
    }

    const files = Array.from(e.dataTransfer.files || [])
    processFiles(files)
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

      // 2. Chuẩn hóa bankCode: nếu người dùng gõ tay trùng mã hoặc tên ngân hàng có sẵn thì map về mã chuẩn
      let finalBankCode = values.bankCode ? values.bankCode.trim() : undefined
      if (finalBankCode) {
        const matchedBank =
          getBankInfo(finalBankCode) ||
          searchBanks(finalBankCode).find(
            (b) =>
              b.code.toUpperCase() === finalBankCode!.toUpperCase() ||
              b.shortName.toUpperCase() === finalBankCode!.toUpperCase()
          )
        if (matchedBank) {
          finalBankCode = matchedBank.code
        }
      }

      // 3. Gửi request báo cáo
      const payload = {
        reporterEmail: values.email,
        reporterName: defaultName || undefined,
        errorType: values.errorType as BugErrorType,
        orderCode: values.orderCode ? values.orderCode.trim().toUpperCase() : undefined,
        bankCode: finalBankCode,
        accountNumber: values.accountNumber ? values.accountNumber.trim() : undefined,
        accountHolderName: values.accountHolderName ? values.accountHolderName.trim().toUpperCase() : undefined,
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

      toast.success(t('bugReport.successMessage'))
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
                {t('bugReport.title')}
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                {t('bugReport.subheading')}
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
                    {t('bugReport.contactEmail')} <span className="text-destructive">*</span>
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
                          <span>{t('bugReport.resendIn', { seconds: otpCooldown })}</span>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <Mail className="h-4 w-4" />
                            <span>{otpSent ? t('bugReport.resendOtp') : t('bugReport.sendOtp')}</span>
                          </div>
                        )}
                      </Button>
                    )}
                  </div>
                  {isAuthenticated && (
                    <p className="text-xs text-muted-foreground">
                      {t('bugReport.otpSentDesc')}
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
                      <span>{t('bugReport.otpCode')} <span className="text-destructive">*</span></span>
                      {otpSent && (
                        <span className="text-xs text-emerald-600 font-normal">
                          {t('bugReport.otpSentCheck')}
                        </span>
                      )}
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder={t('bugReport.otpPlaceholder')}
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
                    {t('bugReport.errorType')} <span className="text-destructive">*</span>
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ''}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('bugReport.selectErrorType')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ERROR_TYPE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {t(opt.labelKey)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Field Mã đơn hàng (Chỉ hiển thị khi chọn Hoàn tiền Credit) */}
            {watchErrorType === 'PAYMENT_REFUND' && (
              <FormField
                control={form.control}
                name="orderCode"
                render={({ field }) => (
                  <FormItem className="rounded-lg border border-violet-200 bg-violet-50/60 p-3.5 dark:border-violet-900/50 dark:bg-violet-950/20">
                    <FormLabel className="font-semibold text-violet-950 dark:text-violet-200 flex items-center justify-between">
                      <span>Mã đơn nạp credit <span className="text-destructive">*</span></span>
                      <span className="text-xs font-normal text-violet-600 dark:text-violet-400 font-mono">
                        Ví dụ: 2609210048
                      </span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Nhập mã đơn nạp (ví dụ: 2609210048 hoặc N9GGDN)"
                        className="bg-white dark:bg-slate-900 font-mono uppercase tracking-wider text-base"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value.toUpperCase().trim())}
                      />
                    </FormControl>
                    <p className="text-xs text-violet-700 dark:text-violet-300">
                      💡 <strong>Hướng dẫn:</strong> Mã đơn là dãy số trong đơn nạp hoặc trong nội dung chuyển khoản của bạn (Ví dụ: bạn chuyển khoản với nội dung <strong>COBAN 2609210048</strong> thì mã đơn là <strong>2609210048</strong>).
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Thông tin tài khoản nhận tiền hoàn (Chỉ hiển thị khi chọn Hoàn tiền) */}
            {watchErrorType === 'PAYMENT_REFUND' && (
              <div className="rounded-xl border border-violet-200 bg-violet-50/50 p-3.5 dark:border-violet-900/50 dark:bg-violet-950/20 space-y-3">
                <div className="flex items-center gap-2 pb-1 border-b border-violet-100 dark:border-violet-900/40">
                  <Building2 className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-violet-950 dark:text-violet-200">
                    Tài khoản ngân hàng nhận tiền hoàn
                  </span>
                </div>

                {/* Chọn hoặc gõ tay ngân hàng thụ hưởng */}
                <FormField
                  control={form.control}
                  name="bankCode"
                  render={({ field }) => {
                    const selectedBank = getBankInfo(field.value)
                    const filteredBanks = searchBanks(bankSearchQuery)

                    return (
                      <FormItem>
                        <FormLabel className="font-semibold text-xs text-slate-800 dark:text-slate-200 flex items-center justify-between">
                          <span>
                            Ngân hàng thụ hưởng <span className="text-destructive">*</span>
                          </span>
                          <span className="text-[11px] font-normal text-violet-600 dark:text-violet-400">
                            (Tìm kiếm hoặc tự gõ tay)
                          </span>
                        </FormLabel>
                        <FormControl>
                          <div ref={bankSelectorRef} className="relative">
                            <div className="relative flex items-center">
                              {/* Logo hoặc Icon bên trái */}
                              <div className="absolute left-3 flex items-center pointer-events-none z-10">
                                {selectedBank?.logo ? (
                                  <img
                                    src={selectedBank.logo}
                                    alt={selectedBank.shortName}
                                    className="h-4 w-7 object-contain"
                                    onError={(e) => {
                                      (e.target as HTMLElement).style.display = 'none'
                                    }}
                                  />
                                ) : (
                                  <Building2 className="h-4 w-4 text-muted-foreground" />
                                )}
                              </div>

                              {/* Input vừa tìm kiếm vừa gõ tay */}
                              <Input
                                placeholder="Tìm kiếm (VCB, MB, Techcom...) hoặc gõ tay tên ngân hàng..."
                                className="pl-11 pr-16 bg-white dark:bg-slate-900 h-10 text-xs"
                                value={bankSearchQuery}
                                onFocus={() => setIsBankDropdownOpen(true)}
                                onChange={(e) => {
                                  const val = e.target.value
                                  setBankSearchQuery(val)
                                  field.onChange(val)
                                  if (!isBankDropdownOpen) setIsBankDropdownOpen(true)
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault()
                                    if (filteredBanks.length > 0 && bankSearchQuery.trim()) {
                                      const first = filteredBanks[0]
                                      setBankSearchQuery(first.shortName)
                                      field.onChange(first.code)
                                    } else if (bankSearchQuery.trim()) {
                                      field.onChange(bankSearchQuery.trim())
                                    }
                                    setIsBankDropdownOpen(false)
                                  } else if (e.key === 'Escape') {
                                    setIsBankDropdownOpen(false)
                                  }
                                }}
                              />

                              {/* Action buttons bên phải */}
                              <div className="absolute right-2 flex items-center gap-1">
                                {bankSearchQuery && (
                                  <button
                                    type="button"
                                    tabIndex={-1}
                                    className="p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setBankSearchQuery('')
                                      field.onChange('')
                                    }}
                                    title="Xóa để chọn lại"
                                  >
                                    <X className="h-3.5 w-3.5" />
                                  </button>
                                )}
                                <button
                                  type="button"
                                  tabIndex={-1}
                                  className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setIsBankDropdownOpen((prev) => !prev)
                                  }}
                                  title="Danh sách ngân hàng"
                                >
                                  <ChevronDown
                                    className={cn(
                                      'h-4 w-4 transition-transform duration-200',
                                      isBankDropdownOpen && 'rotate-180'
                                    )}
                                  />
                                </button>
                              </div>
                            </div>

                            {/* Dropdown Floating Options */}
                            {isBankDropdownOpen && (
                              <div className="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-100">
                                {/* Tùy chọn gõ tay tự do nếu người dùng có gõ chữ */}
                                {bankSearchQuery.trim() && (
                                  <div
                                    className="flex items-center gap-2 p-2.5 bg-violet-50/80 dark:bg-violet-950/40 hover:bg-violet-100 dark:hover:bg-violet-900/60 border-b border-violet-100 dark:border-violet-900/50 cursor-pointer transition-colors"
                                    onClick={() => {
                                      field.onChange(bankSearchQuery.trim())
                                      setIsBankDropdownOpen(false)
                                    }}
                                  >
                                    <Edit3 className="h-4 w-4 text-violet-600 dark:text-violet-400 shrink-0" />
                                    <div className="flex-1 min-w-0 text-xs">
                                      <span className="font-semibold text-violet-950 dark:text-violet-200">
                                        Sử dụng tên gõ tay:{' '}
                                      </span>
                                      <span className="font-mono font-bold text-violet-700 dark:text-violet-300">
                                        "{bankSearchQuery.trim()}"
                                      </span>
                                    </div>
                                    <span className="text-[10px] bg-violet-200/80 dark:bg-violet-800 text-violet-800 dark:text-violet-200 px-1.5 py-0.5 rounded font-medium shrink-0">
                                      Gõ tự do
                                    </span>
                                  </div>
                                )}

                                {/* Danh sách ngân hàng được lọc */}
                                <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                                  {filteredBanks.length > 0 ? (
                                    filteredBanks.map((bank) => {
                                      const isSelected =
                                        field.value?.toUpperCase() === bank.code.toUpperCase() ||
                                        field.value?.toUpperCase() === bank.shortName.toUpperCase()

                                      return (
                                        <div
                                          key={bank.code}
                                          className={cn(
                                            'flex items-center gap-2.5 p-2 text-xs hover:bg-slate-100 dark:hover:bg-slate-800/80 cursor-pointer transition-colors',
                                            isSelected && 'bg-violet-50/60 dark:bg-violet-950/30'
                                          )}
                                          onClick={() => {
                                            field.onChange(bank.code)
                                            setBankSearchQuery(bank.shortName)
                                            setIsBankDropdownOpen(false)
                                          }}
                                        >
                                          {bank.logo ? (
                                            <img
                                              src={bank.logo}
                                              alt={bank.shortName}
                                              className="h-4 w-8 object-contain shrink-0"
                                              onError={(e) => {
                                                (e.target as HTMLElement).style.display = 'none'
                                              }}
                                            />
                                          ) : (
                                            <div className="h-4 w-8 bg-slate-100 dark:bg-slate-800 rounded flex items-center justify-center shrink-0">
                                              <Building2 className="h-3 w-3 text-muted-foreground" />
                                            </div>
                                          )}
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5">
                                              <span className="font-bold text-slate-900 dark:text-slate-100">
                                                {bank.shortName}
                                              </span>
                                              <span className="text-[10px] font-mono text-muted-foreground bg-slate-100 dark:bg-slate-800 px-1 py-0.2 rounded">
                                                {bank.code}
                                              </span>
                                            </div>
                                            <p className="text-slate-500 dark:text-slate-400 text-[11px] truncate">
                                              {bank.name}
                                            </p>
                                          </div>
                                          {isSelected && (
                                            <Check className="h-4 w-4 text-violet-600 dark:text-violet-400 shrink-0" />
                                          )}
                                        </div>
                                      )
                                    })
                                  ) : (
                                    <div className="p-3 text-center text-xs text-muted-foreground">
                                      Không tìm thấy ngân hàng có sẵn khớp với "{bankSearchQuery}".
                                      <br />
                                      <span className="text-[11px] text-violet-600 dark:text-violet-400">
                                        Bấm vào mục <strong>Gõ tự do</strong> ở trên để tiếp tục sử dụng tên này.
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )
                  }}
                />

                {/* Số tài khoản & Tên chủ tài khoản */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="accountNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-semibold text-xs text-slate-800 dark:text-slate-200">
                          Số tài khoản nhận <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ví dụ: 0378531075"
                            className="bg-white dark:bg-slate-900 font-mono text-sm h-9"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="accountHolderName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-semibold text-xs text-slate-800 dark:text-slate-200">
                          Tên chủ tài khoản <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ví dụ: NGUYEN VAN A"
                            className="bg-white dark:bg-slate-900 font-mono uppercase text-sm h-9"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}

            {/* Field Mô tả sự cố */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold">
                    {watchErrorType === 'PAYMENT_REFUND' ? (
                      <span>
                        {t('Lý do hoàn tiền / Ghi chú bổ sung')}{' '}
                        <span className="text-xs font-normal text-muted-foreground">({t('Không bắt buộc')})</span>
                      </span>
                    ) : (
                      <span>
                        {t('bugReport.description')}{' '}
                        <span className="text-xs font-normal text-muted-foreground">{t('bugReport.descriptionOptional')}</span>
                      </span>
                    )}
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={
                        watchErrorType === 'PAYMENT_REFUND'
                          ? t('Ghi chú thêm nếu cần (ví dụ: Tôi chuyển tiền quá hạn 15 phút...)')
                          : t('bugReport.descriptionPlaceholder')
                      }
                      rows={watchErrorType === 'PAYMENT_REFUND' ? 2 : 3}
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
                  {t('bugReport.attachments')} <span className="text-xs font-normal text-muted-foreground">{t('bugReport.attachmentsLimit')}</span>
                </FormLabel>
                <span className="text-xs font-medium text-muted-foreground">
                  {imageFiles.length}/3 ảnh
                </span>
              </div>

              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`grid grid-cols-3 gap-3 p-1 rounded-xl transition-all ${
                  isDragging ? 'bg-primary/5 ring-2 ring-primary/40 ring-dashed' : ''
                }`}
              >
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
                  <label
                    className={`flex flex-col items-center justify-center aspect-video rounded-lg border-2 border-dashed transition-all cursor-pointer ${
                      isDragging
                        ? 'border-primary bg-primary/10 text-primary scale-[1.02] shadow-sm'
                        : 'border-border hover:border-primary/50 bg-muted/30 hover:bg-muted text-muted-foreground'
                    }`}
                  >
                    <Upload className={`h-5 w-5 mb-1 transition-transform pointer-events-none ${isDragging ? 'text-primary animate-bounce' : ''}`} />
                    <span className="text-xs font-medium text-center px-1 pointer-events-none">
                      {isDragging ? t('bugReport.dropHere') : t('bugReport.dragDropOrSelect')}
                    </span>
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
                {t('bugReport.cancel')}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {uploadingImage ? t('bugReport.uploadingImages') : t('bugReport.submitting')}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    {t('bugReport.submit')}
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
