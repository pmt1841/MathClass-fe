'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { AlertCircle, Plus, Sparkles, MessageSquareCode } from 'lucide-react'
import { SystemPrompt, systemPromptService } from '@/services/systemPromptService'
import { useToast } from '@/components/ui/use-toast'

interface SystemPromptDialogProps {
  prompt: SystemPrompt | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

const SYSTEM_TASKS = [
  { code: 'HINT_EXPLANATION', label: 'Gợi ý & Hướng dẫn Toán (HINT_EXPLANATION)' },
  { code: 'LATEX_CANVAS_FORMAT', label: 'Định dạng LaTeX / Canvas (LATEX_CANVAS_FORMAT)' },
  { code: 'SUBMISSION_GRADING', label: 'Chấm bài Tự luận AI (SUBMISSION_GRADING)' },
  { code: 'QUESTION_GEN', label: 'Sinh Đề thi & Bài tập (QUESTION_GEN)' },
]

export function SystemPromptDialog({
  prompt,
  open,
  onOpenChange,
  onSuccess,
}: SystemPromptDialogProps) {
  const { toast } = useToast()
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  const isEditMode = !!prompt

  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [taskCode, setTaskCode] = useState('HINT_EXPLANATION')
  const [defaultContent, setDefaultContent] = useState('')
  const [currentContent, setCurrentContent] = useState('')
  const [allowedVariablesInput, setAllowedVariablesInput] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE')
  const [changeReason, setChangeReason] = useState('')

  const [invalidVars, setInvalidVars] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (prompt) {
      setCode(prompt.code)
      setName(prompt.name)
      setTaskCode(prompt.taskCode)
      setDefaultContent(prompt.defaultContent)
      setCurrentContent(prompt.currentContent)
      setAllowedVariablesInput(prompt.allowedVariables.join(', '))
      setDescription(prompt.description || '')
      setStatus(prompt.status)
      setChangeReason('')
    } else {
      setCode('')
      setName('')
      setTaskCode('HINT_EXPLANATION')
      setDefaultContent('Bạn là trợ lý môn {{subject}} cấp {{grade_level}}...')
      setCurrentContent('Bạn là trợ lý môn {{subject}} cấp {{grade_level}}...')
      setAllowedVariablesInput('grade_level, subject, student_answer, question_content')
      setDescription('')
      setStatus('ACTIVE')
      setChangeReason('')
    }
  }, [prompt, open])

  // Real-time validation of variables in currentContent
  useEffect(() => {
    const allowed = allowedVariablesInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)

    const regex = /\{\{([a-zA-Z0-9_]+)\}\}/g
    const found = new Set<string>()
    let match
    const textToCheck = isEditMode ? currentContent : defaultContent
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
  }, [currentContent, defaultContent, allowedVariablesInput, isEditMode])

  // Insert variable {{var_name}} at cursor position in Textarea
  const handleInsertVariable = (varName: string) => {
    const textarea = textareaRef.current
    const varText = `{{${varName}}}`
    if (!textarea) {
      if (isEditMode) setCurrentContent((prev) => prev + varText)
      else setDefaultContent((prev) => prev + varText)
      return
    }

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const content = isEditMode ? currentContent : defaultContent
    const updated = content.substring(0, start) + varText + content.substring(end)

    if (isEditMode) {
      setCurrentContent(updated)
    } else {
      setDefaultContent(updated)
      setCurrentContent(updated)
    }

    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + varText.length, start + varText.length)
    }, 50)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (invalidVars.length > 0) {
      toast({
        title: 'Biến không hợp lệ!',
        description: `Vui lòng bỏ hoặc khai báo thêm các biến: ${invalidVars.map((v) => `{{${v}}}`).join(', ')}`,
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)
    try {
      const allowedVarsArray = allowedVariablesInput
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)

      if (isEditMode && prompt) {
        await systemPromptService.updatePrompt(prompt.id, {
          name,
          currentContent,
          description,
          status,
          changeReason,
        })
        toast({
          title: 'Cập nhật thành công!',
          description: 'Cấu hình System Prompt đã được lưu.',
        })
      } else {
        await systemPromptService.createPrompt({
          code,
          name,
          taskCode,
          defaultContent,
          allowedVariables: allowedVarsArray,
          description,
        })
        toast({
          title: 'Tạo mới thành công!',
          description: 'System Prompt mới đã được thêm vào hệ thống.',
        })
      }
      onSuccess()
      onOpenChange(false)
    } catch (err: any) {
      toast({
        title: 'Lỗi lưu Prompt',
        description: err.response?.data?.message || 'Không thể lưu System Prompt',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const allowedVarsList = allowedVariablesInput
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <MessageSquareCode className="h-5 w-5 text-indigo-500" />
            {isEditMode ? 'Chỉnh sửa System Prompt' : 'Tạo mới System Prompt'}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Chỉnh sửa câu lệnh điều khiển AI. Mọi thay đổi sẽ được lưu vào lịch sử phiên bản.'
              : 'Tạo câu lệnh System Prompt mới để điều khiển phản hồi của AI cho từng tác vụ.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="prompt-code">Mã Prompt Code (*)</Label>
              <Input
                id="prompt-code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="PROMPT_SOLVE_HINT"
                disabled={isEditMode}
                className="font-mono text-xs"
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="prompt-name">Tên hiển thị (*)</Label>
              <Input
                id="prompt-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Prompt Gợi ý giải toán từng bước"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="prompt-task">Tác vụ AI (Task Code) (*)</Label>
              <Select value={taskCode} onValueChange={setTaskCode} disabled={isEditMode}>
                <SelectTrigger id="prompt-task">
                  <SelectValue placeholder="Chọn Task Code..." />
                </SelectTrigger>
                <SelectContent>
                  {SYSTEM_TASKS.map((t) => (
                    <SelectItem key={t.code} value={t.code}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="prompt-status">Trạng thái (*)</Label>
              <Select
                value={status}
                onValueChange={(val: 'ACTIVE' | 'INACTIVE') => setStatus(val)}
              >
                <SelectTrigger id="prompt-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">ACTIVE (Kích hoạt)</SelectItem>
                  <SelectItem value="INACTIVE">INACTIVE (Vô hiệu hóa)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="prompt-vars">Danh sách Biến môi trường hợp lệ (phân cách bởi dấu phẩy) (*)</Label>
            <Input
              id="prompt-vars"
              value={allowedVariablesInput}
              onChange={(e) => setAllowedVariablesInput(e.target.value)}
              placeholder="grade_level, subject, student_answer, question_content"
              disabled={isEditMode}
              className="font-mono text-xs"
              required
            />
          </div>

          {/* Prompt Content Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="prompt-content" className="font-semibold">
                Nội dung Prompt hiện tại (Current Content) (*)
              </Label>
              <span className="text-[11px] text-muted-foreground">
                Nhấp vào Chip bên dưới để chèn biến vào vị trí con trỏ
              </span>
            </div>

            {/* Variable Chips Insertion Toolbar */}
            {allowedVarsList.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 p-2 bg-slate-100 dark:bg-slate-900 rounded-md border text-xs">
                <span className="font-semibold text-[11px] text-muted-foreground mr-1">
                  Chèn biến:
                </span>
                {allowedVarsList.map((v) => (
                  <Badge
                    key={v}
                    variant="secondary"
                    onClick={() => handleInsertVariable(v)}
                    className="cursor-pointer hover:bg-indigo-100 hover:text-indigo-700 dark:hover:bg-indigo-900 dark:hover:text-indigo-200 transition-colors font-mono text-[11px] border-indigo-200"
                  >
                    + {`{{${v}}}`}
                  </Badge>
                ))}
              </div>
            )}

            <Textarea
              id="prompt-content"
              ref={textareaRef}
              value={isEditMode ? currentContent : defaultContent}
              onChange={(e) => {
                if (isEditMode) setCurrentContent(e.target.value)
                else {
                  setDefaultContent(e.target.value)
                  setCurrentContent(e.target.value)
                }
              }}
              rows={7}
              placeholder="Bạn là giáo viên Toán cho học sinh {{grade_level}}..."
              className="font-mono text-xs leading-relaxed"
              required
            />

            {/* Real-time Variable Validation Warning */}
            {invalidVars.length > 0 && (
              <div className="flex items-center gap-2 p-2.5 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 rounded-md border border-red-200 text-xs">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>
                  Phát hiện biến không hợp lệ: <strong>{invalidVars.map((v) => `{{${v}}}`).join(', ')}</strong>.
                  Vui lòng xóa hoặc khai báo thêm vào danh sách biến.
                </span>
              </div>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="prompt-desc">Mô tả mục đích sử dụng</Label>
            <Input
              id="prompt-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ví dụ: Chỉ đưa ra gợi ý hướng giải, tuyệt đối không giải hộ đáp án chi tiết."
            />
          </div>

          {isEditMode && (
            <div className="space-y-1 pt-2 border-t">
              <Label htmlFor="change-reason" className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                Ghi chú lý do thay đổi (lưu vào History Log)
              </Label>
              <Input
                id="change-reason"
                value={changeReason}
                onChange={(e) => setChangeReason(e.target.value)}
                placeholder="Ví dụ: Tối ưu hóa yêu cầu render LaTeX chuẩn KaTeX"
                className="text-xs"
              />
            </div>
          )}

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={isSubmitting || invalidVars.length > 0} className="bg-indigo-600 hover:bg-indigo-700 text-white">
              {isSubmitting ? <Spinner className="mr-2 h-4 w-4" /> : null}
              {isEditMode ? 'Cập nhật Prompt' : 'Tạo mới Prompt'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
