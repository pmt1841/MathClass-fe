'use client'

import { useState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { AlertCircle, MessageSquareCode, Zap } from 'lucide-react'
import { SystemPrompt, systemPromptService } from '@/services/systemPromptService'
import { PromptPreviewRenderDialog } from '@/components/admin/ai-config/PromptPreviewRenderDialog'
import { useI18n } from '@/lib/i18n/i18n-context'
import { useToast } from '@/components/ui/use-toast'

const systemPromptSchema = z.object({
  name: z.string().trim().min(1, 'Vui lòng nhập tên hiển thị cho System Prompt'),
  currentContent: z.string().trim().min(1, 'Vui lòng nhập nội dung System Prompt'),
  description: z.string().optional().default(''),
  changeReason: z.string().optional().default(''),
})

type SystemPromptFormValues = z.infer<typeof systemPromptSchema>

interface SystemPromptDialogProps {
  prompt: SystemPrompt | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function SystemPromptDialog({
  prompt,
  open,
  onOpenChange,
  onSuccess,
}: SystemPromptDialogProps) {
  const { t } = useI18n()
  const { toast } = useToast()
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  const [invalidVars, setInvalidVars] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isPlaygroundOpen, setIsPlaygroundOpen] = useState(false)

  const form = useForm<SystemPromptFormValues>({
    resolver: zodResolver(systemPromptSchema),
    defaultValues: {
      name: '',
      currentContent: '',
      description: '',
      changeReason: '',
    },
  })

  const currentContentValue = form.watch('currentContent')

  useEffect(() => {
    if (prompt && open) {
      form.reset({
        name: prompt.name || '',
        currentContent: prompt.currentContent || '',
        description: prompt.description || '',
        changeReason: '',
      })
    }
  }, [prompt, open, form])

  // Real-time validation of variables in currentContent
  useEffect(() => {
    if (!prompt) return

    const allowed = prompt.allowedVariables || []
    const regex = /\{\{([a-zA-Z0-9_]+)\}\}/g
    const found = new Set<string>()
    let match
    const textToCheck = currentContentValue || ''
    while ((match = regex.exec(textToCheck)) !== null) {
      found.add(match[1])
    }

    const invalid: string[] = []
    found.forEach((v) => {
      if (!allowed.includes(v)) {
        invalid.push(v)
      }
    })
    setInvalidVars(invalid)
  }, [currentContentValue, prompt])

  // Insert variable {{var_name}} at cursor position in Textarea with native Undo (Ctrl+Z) support
  const handleInsertVariable = (varName: string) => {
    const textarea = textareaRef.current
    const varText = `{{${varName}}}`

    if (!textarea) {
      const currentVal = form.getValues('currentContent') || ''
      form.setValue('currentContent', currentVal + varText, { shouldValidate: true, shouldDirty: true })
      return
    }

    textarea.focus({ preventScroll: true })

    let success = false
    try {
      success = document.execCommand('insertText', false, varText)
    } catch {
      success = false
    }

    if (success) {
      form.setValue('currentContent', textarea.value, { shouldValidate: true, shouldDirty: true })
    } else {
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const currentVal = textarea.value
      const updated = currentVal.substring(0, start) + varText + currentVal.substring(end)
      form.setValue('currentContent', updated, { shouldValidate: true, shouldDirty: true })
      setTimeout(() => {
        textarea.focus({ preventScroll: true })
        textarea.setSelectionRange(start + varText.length, start + varText.length)
      }, 0)
    }
  }

  const onSubmit = async (values: SystemPromptFormValues) => {
    if (invalidVars.length > 0) {
      toast({
        title: t('Biến không hợp lệ!'),
        description: `${t('Vui lòng bỏ hoặc khai báo thêm các biến:')} ${invalidVars.map((v) => `{{${v}}}`).join(', ')}`,
        variant: 'destructive',
      })
      return
    }

    if (!prompt) return

    setIsSubmitting(true)
    try {
      await systemPromptService.updatePrompt(prompt.id, {
        name: values.name.trim(),
        currentContent: values.currentContent.trim(),
        description: values.description?.trim(),
        changeReason: values.changeReason?.trim(),
      })
      toast({
        title: t('Cập nhật thành công!'),
        description: t('Cấu hình System Prompt đã được lưu.'),
      })
      onSuccess()
      onOpenChange(false)
    } catch (err: any) {
      toast({
        title: t('Lỗi lưu Prompt'),
        description: err.response?.data?.message || t('Không thể lưu System Prompt'),
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[95vw] sm:max-w-3xl max-h-[90vh] overflow-y-auto"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <MessageSquareCode className="h-5 w-5 text-indigo-500 shrink-0" />
            {t('Chỉnh sửa System Prompt')}
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            {t('Chỉnh sửa câu lệnh điều khiển AI. Mọi thay đổi sẽ được lưu vào lịch sử phiên bản.')}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t('Tên hiển thị')} <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder={t('Prompt Gợi ý giải toán từng bước')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Prompt Content Section */}
            <FormField
              control={form.control}
              name="currentContent"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <div className="flex items-center justify-between">
                    <FormLabel className="font-semibold">
                      {t('Nội dung Prompt hiện tại (Current Content)')} <span className="text-red-500">*</span>
                    </FormLabel>
                    <span className="text-[11px] text-muted-foreground">
                      {t('Nhấp vào Chip bên dưới để chèn biến vào vị trí con trỏ')}
                    </span>
                  </div>

                  {/* Variable Chips Insertion Toolbar */}
                  {prompt?.allowedVariables && prompt.allowedVariables.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 p-2 bg-slate-100 dark:bg-slate-900 rounded-md border text-xs">
                      <span className="font-semibold text-[11px] text-muted-foreground mr-1">
                        {t('Chèn biến:')}
                      </span>
                      {prompt.allowedVariables.map((v) => (
                        <Badge
                          key={v}
                          variant="secondary"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => handleInsertVariable(v)}
                          className="cursor-pointer hover:bg-indigo-100 hover:text-indigo-700 dark:hover:bg-indigo-900 dark:hover:text-indigo-200 transition-colors font-mono text-[11px] border-indigo-200 select-none"
                        >
                          + {`{{${v}}}`}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <FormControl>
                    <Textarea
                      {...field}
                      ref={(e) => {
                        field.ref(e)
                        textareaRef.current = e
                      }}
                      rows={7}
                      placeholder={t('Bạn là giáo viên Toán cho học sinh {{grade_level}}...')}
                      className="font-mono text-xs leading-relaxed"
                    />
                  </FormControl>
                  <FormMessage />

                  {/* Real-time Variable Validation Warning */}
                  {invalidVars.length > 0 && (
                    <div className="flex items-center gap-2 p-2.5 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 rounded-md border border-red-200 text-xs">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>
                        {t('Phát hiện biến không hợp lệ:')} <strong>{invalidVars.map((v) => `{{${v}}}`).join(', ')}</strong>.
                        {' '}{t('Vui lòng xóa hoặc khai báo thêm vào danh sách biến.')}
                      </span>
                    </div>
                  )}
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('Mô tả mục đích sử dụng')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('Ví dụ: Chỉ đưa ra gợi ý hướng giải, tuyệt đối không giải hộ đáp án chi tiết.')}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="changeReason"
              render={({ field }) => (
                <FormItem className="pt-2 border-t">
                  <FormLabel className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                    {t('Ghi chú lý do thay đổi (lưu vào History Log)')}
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('Ví dụ: Tối ưu hóa yêu cầu render LaTeX chuẩn KaTeX')}
                      className="text-xs"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsPlaygroundOpen(true)}
                className="w-full sm:w-auto border-indigo-200 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 flex items-center gap-1.5 text-xs"
              >
                <Zap className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                {t('Chạy thử với AI (Playground)')}
              </Button>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  {t('Hủy')}
                </Button>
                <Button type="submit" disabled={isSubmitting || invalidVars.length > 0} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                  {isSubmitting ? <Spinner className="mr-2 h-4 w-4" /> : null}
                  {t('Cập nhật Prompt')}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>

        {isPlaygroundOpen && prompt && (
          <PromptPreviewRenderDialog
            open={isPlaygroundOpen}
            onOpenChange={setIsPlaygroundOpen}
            prompt={prompt}
            draftContent={form.getValues('currentContent')}
            customTaskCode={prompt.taskCode}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

