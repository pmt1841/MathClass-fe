'use client'

import { useState, useEffect } from 'react'
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
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { Play, Copy, Check, Sparkles } from 'lucide-react'
import { SystemPrompt, systemPromptService } from '@/services/systemPromptService'
import { useToast } from '@/components/ui/use-toast'

interface PromptPreviewRenderDialogProps {
  prompt: SystemPrompt | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PromptPreviewRenderDialog({
  prompt,
  open,
  onOpenChange,
}: PromptPreviewRenderDialogProps) {
  const { toast } = useToast()
  const [variableValues, setVariableValues] = useState<Record<string, string>>({})
  const [renderedResult, setRenderedResult] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isCopied, setIsCopied] = useState(false)

  useEffect(() => {
    if (prompt) {
      const initialValues: Record<string, string> = {}
      prompt.allowedVariables.forEach((v) => {
        // Sample default values for testing
        if (v === 'grade_level') initialValues[v] = 'Lớp 10'
        else if (v === 'subject') initialValues[v] = 'Đại số'
        else if (v === 'student_answer') initialValues[v] = 'x^2 - 4 = 0 => x = 2'
        else if (v === 'question_content') initialValues[v] = 'Giải phương trình x^2 - 4 = 0'
        else if (v === 'math_expression') initialValues[v] = '\\frac{a+b}{c}'
        else if (v === 'output_format') initialValues[v] = 'KaTeX'
        else if (v === 'correct_answer') initialValues[v] = 'x = ±2'
        else if (v === 'max_score') initialValues[v] = '10'
        else if (v === 'topic') initialValues[v] = 'Hàm số bậc hai'
        else if (v === 'difficulty') initialValues[v] = 'Thông hiểu'
        else if (v === 'question_count') initialValues[v] = '5'
        else initialValues[v] = 'Dữ liệu thử nghiệm'
      })
      setVariableValues(initialValues)
      setRenderedResult(null)
    }
  }, [prompt, open])

  if (!prompt) return null

  const handleRender = async () => {
    setIsLoading(true)
    try {
      const response = await systemPromptService.renderPrompt({
        promptCode: prompt.code,
        variables: variableValues,
      })
      setRenderedResult(response.renderedPrompt)
      toast({
        title: 'Render thành công!',
        description: 'Đã thay thế toàn bộ biến môi trường vào prompt.',
      })
    } catch (err: any) {
      toast({
        title: 'Lỗi Render',
        description: err.response?.data?.message || 'Không thể render prompt',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopy = () => {
    if (renderedResult) {
      navigator.clipboard.writeText(renderedResult)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="h-5 w-5 text-indigo-500" />
            Thử nghiệm Render System Prompt
          </DialogTitle>
          <DialogDescription>
            Nhập các giá trị mẫu cho biến để xem trước chuỗi System Prompt hoàn chỉnh trước khi áp dụng.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="flex items-center justify-between bg-muted/40 p-3 rounded-lg border">
            <div>
              <p className="font-semibold text-sm">{prompt.name}</p>
              <p className="text-xs text-muted-foreground font-mono">{prompt.code}</p>
            </div>
            <Badge variant="outline">{prompt.taskCode}</Badge>
          </div>

          <div>
            <Label className="text-sm font-semibold mb-2 block">Giá trị biến thử nghiệm:</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border">
              {prompt.allowedVariables.map((v) => (
                <div key={v} className="space-y-1">
                  <Label htmlFor={`var-${v}`} className="text-xs font-mono font-medium text-indigo-600 dark:text-indigo-400">
                    {`{{${v}}}`}
                  </Label>
                  <Input
                    id={`var-${v}`}
                    value={variableValues[v] || ''}
                    onChange={(e) =>
                      setVariableValues({ ...variableValues, [v]: e.target.value })
                    }
                    placeholder={`Nhập ${v}...`}
                    className="h-8 text-xs font-mono"
                  />
                </div>
              ))}
            </div>
          </div>

          <Button
            onClick={handleRender}
            disabled={isLoading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {isLoading ? <Spinner className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
            Chạy Render Prompt
          </Button>

          {renderedResult !== null && (
            <div className="space-y-2 pt-2 border-t">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">Kết quả Prompt hoàn chỉnh:</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  className="h-7 text-xs"
                >
                  {isCopied ? (
                    <>
                      <Check className="mr-1 h-3.5 w-3.5 text-green-500" /> Đã chép
                    </>
                  ) : (
                    <>
                      <Copy className="mr-1 h-3.5 w-3.5" /> Sao chép
                    </>
                  )}
                </Button>
              </div>
              <div className="bg-slate-950 text-slate-100 p-4 rounded-lg text-xs font-mono leading-relaxed whitespace-pre-wrap max-h-[250px] overflow-y-auto border border-slate-800">
                {renderedResult}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
