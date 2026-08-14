'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { AlertTriangle, Upload, X, Loader2, Image as ImageIcon, CheckCircle2 } from 'lucide-react'

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
  errorType: z.enum(['LOGIN_ACCOUNT', 'UI_KATEX', 'SUBMISSION_PROBLEM', 'PERFORMANCE', 'OTHER'], {
    required_error: 'Vui lòng chọn loại lỗi sự cố',
  }),
  description: z.string().optional(),
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

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: defaultEmail,
      errorType: 'LOGIN_ACCOUNT',
      description: '',
    },
  })

  useEffect(() => {
    if (open) {
      form.reset({
        email: defaultEmail,
        errorType: 'LOGIN_ACCOUNT',
        description: '',
      })
      setImageFiles([])
    }
  }, [open, defaultEmail, form])

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
      URL.revokeObjectURL(updated[index].preview)
      updated.splice(index, 1)
      return updated
    })
  }

  const onSubmit = async (values: FormValues) => {
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
      }

      if (isAuthenticated) {
        await bugReportService.createAuthenticatedReport(payload)
      } else {
        await bugReportService.createPublicReport(payload)
      }

      toast.success('Cảm ơn bạn! Báo cáo lỗi đã được gửi thành công đến Quản trị viên.')
      onClose()
    } catch (error: any) {
      console.error('Submit report error:', error)
      toast.error(error?.response?.data?.message || 'Có lỗi xảy ra khi gửi báo cáo sự cố')
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
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 pt-3">
            {/* Field Email */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold">
                    Email liên hệ <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="you@example.com"
                      disabled={isAuthenticated}
                      className={isAuthenticated ? 'bg-muted text-muted-foreground' : ''}
                      {...field}
                    />
                  </FormControl>
                  {isAuthenticated && (
                    <p className="text-xs text-muted-foreground">
                      Tự động sử dụng Email tài khoản đang đăng nhập của bạn.
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Field Loại lỗi */}
            <FormField
              control={form.control}
              name="errorType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold">
                    Lựa chọn loại lỗi <span className="text-destructive">*</span>
                  </FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                      rows={4}
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
