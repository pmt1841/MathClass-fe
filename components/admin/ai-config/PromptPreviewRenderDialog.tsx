'use client'

import React, { useState, useEffect, useMemo } from 'react'
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
import { Spinner } from '@/components/ui/spinner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Play,
  Copy,
  Check,
  Sparkles,
  Zap,
  Clock,
  Cpu,
  FileCode,
  Eye,
  FileText,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  Bot,
  Terminal,
  Code2,
} from 'lucide-react'
import {
  SystemPrompt,
  PromptTestExecuteResponse,
  systemPromptService,
} from '@/services/systemPromptService'
import { useToast } from '@/components/ui/use-toast'

import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import remarkGfm from 'remark-gfm'
import rehypeKatex from 'rehype-katex'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize from 'rehype-sanitize'
import 'katex/dist/katex.min.css'
import { sanitizeSchema } from '@/lib/markdown'

interface PromptPreviewRenderDialogProps {
  prompt: SystemPrompt | null
  open: boolean
  onOpenChange: (open: boolean) => void
  draftContent?: string
  customTaskCode?: string
}

export function PromptPreviewRenderDialog({
  prompt,
  open,
  onOpenChange,
  draftContent,
  customTaskCode,
}: PromptPreviewRenderDialogProps) {
  const { toast } = useToast()
  const [variableValues, setVariableValues] = useState<Record<string, string>>({})
  const [isExecuting, setIsExecuting] = useState(false)
  const [executionResult, setExecutionResult] = useState<PromptTestExecuteResponse | null>(null)
  const [isCopiedPrompt, setIsCopiedPrompt] = useState(false)
  const [isCopiedOutput, setIsCopiedOutput] = useState(false)
  const [outputTab, setOutputTab] = useState<'katex' | 'raw'>('katex')
  const [showPromptPreview, setShowPromptPreview] = useState(false)

  const effectiveTaskCode = customTaskCode || prompt?.taskCode || 'STUDENT_HINT'
  const effectiveTemplate = draftContent ?? (prompt?.currentContent || '')

  const allowedVariables = prompt?.allowedVariables || []

  // Initialize variables with empty values
  useEffect(() => {
    if (open && prompt) {
      const initialValues: Record<string, string> = {}
      allowedVariables.forEach((v) => {
        initialValues[v] = ''
      })
      setVariableValues(initialValues)
      setExecutionResult(null)
      setShowPromptPreview(false)
    }
  }, [prompt, open, draftContent])

  // Real-time client-side interpolation
  const liveRenderedPrompt = useMemo(() => {
    if (!effectiveTemplate) return ''
    let result = effectiveTemplate
    Object.entries(variableValues).forEach(([key, val]) => {
      result = result.replaceAll(`{{${key}}}`, val || '')
    })
    return result
  }, [effectiveTemplate, variableValues])

  // Check if result is valid JSON
  const parsedJson = useMemo(() => {
    if (!executionResult?.aiResponse) return null
    try {
      const trimmed = executionResult.aiResponse.trim()
      const clean = trimmed.startsWith('```json')
        ? trimmed.replace(/^```json\s*/i, '').replace(/\s*```$/, '')
        : trimmed
      const parsed = JSON.parse(clean)
      return JSON.stringify(parsed, null, 2)
    } catch {
      return null
    }
  }, [executionResult])

  if (!prompt) return null

  const handleClearVariables = () => {
    const cleared: Record<string, string> = {}
    allowedVariables.forEach((v) => {
      cleared[v] = ''
    })
    setVariableValues(cleared)
  }

  const handleExecuteAI = async () => {
    setIsExecuting(true)
    try {
      const response = await systemPromptService.testExecutePrompt({
        promptCode: prompt.code,
        taskCode: effectiveTaskCode,
        customContent: draftContent,
        variables: variableValues,
      })
      setExecutionResult(response)

      if (response.success) {
        toast({
          title: 'Thực thi AI thành công!',
          description: `Phản hồi trong ${response.executionTimeMs}ms từ ${response.modelName || 'Model'}`,
        })
      } else {
        toast({
          title: 'AI phản hồi lỗi',
          description: response.errorMessage || 'Không thể kết nối đến nhà cung cấp AI',
          variant: 'destructive',
        })
      }
    } catch (err: any) {
      toast({
        title: 'Lỗi thực thi kiểm thử',
        description: err.response?.data?.message || 'Không thể chạy thử nghiệm prompt với AI',
        variant: 'destructive',
      })
    } finally {
      setIsExecuting(false)
    }
  }

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(liveRenderedPrompt)
    setIsCopiedPrompt(true)
    setTimeout(() => setIsCopiedPrompt(false), 2000)
  }

  const handleCopyOutput = () => {
    if (executionResult?.aiResponse) {
      navigator.clipboard.writeText(executionResult.aiResponse)
      setIsCopiedOutput(true)
      setTimeout(() => setIsCopiedOutput(false), 2000)
    }
  }

  const isLongField = (varName: string) => {
    return ['question_content', 'student_answer', 'correct_answer', 'solution_text'].includes(varName)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[95vw] lg:max-w-5xl max-h-[92vh] overflow-y-auto p-4 sm:p-6"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {/* Modal Header */}
        <DialogHeader className="pb-3 border-b">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="space-y-1">
              <DialogTitle className="flex items-center gap-2.5 text-lg sm:text-xl font-bold">
                <div className="h-8 w-8 rounded-lg bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <Sparkles className="h-4 w-4" />
                </div>
                <span>Thử nghiệm AI: {prompt.name}</span>
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm text-muted-foreground">
                Mô phỏng dữ liệu đầu vào và kiểm thử câu trả lời thực tế từ mô hình AI trước khi áp dụng.
              </DialogDescription>
            </div>

            {draftContent !== undefined && (
              <Badge
                variant="secondary"
                className="bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border-amber-300 self-start sm:self-center text-xs"
              >
                Đang thử nghiệm bản nháp
              </Badge>
            )}
          </div>
        </DialogHeader>

        {/* Main Grid: Left (Inputs & Actions) | Right (Output & Stats) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 py-2">
          {/* LEFT PANEL: Variables & Prompt Preview */}
          <div className="flex flex-col space-y-4">
            {/* Variable Inputs Section */}
            <div className="bg-card border rounded-xl p-4 shadow-sm space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Code2 className="h-4 w-4 text-indigo-500" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-foreground">
                    Biến đầu vào ({allowedVariables.length})
                  </span>
                </div>
                {allowedVariables.length > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleClearVariables}
                    className="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground"
                  >
                    <RotateCcw className="mr-1 h-3 w-3" />
                    Xóa trắng
                  </Button>
                )}
              </div>

              {allowedVariables.length === 0 ? (
                <div className="py-6 text-center text-xs text-muted-foreground bg-muted/30 rounded-lg border border-dashed">
                  Prompt này là câu lệnh tĩnh (không sử dụng biến số nào).
                </div>
              ) : (
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  {allowedVariables.map((v) => (
                    <div key={v} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <Label
                          htmlFor={`var-${v}`}
                          className="font-mono text-xs font-medium text-indigo-600 dark:text-indigo-400"
                        >
                          {`{{${v}}}`}
                        </Label>
                      </div>
                      {isLongField(v) ? (
                        <Textarea
                          id={`var-${v}`}
                          value={variableValues[v] || ''}
                          onChange={(e) =>
                            setVariableValues({ ...variableValues, [v]: e.target.value })
                          }
                          placeholder={`Nhập nội dung cho {{${v}}}...`}
                          rows={2}
                          className="text-xs font-mono resize-none bg-muted/20"
                        />
                      ) : (
                        <Input
                          id={`var-${v}`}
                          value={variableValues[v] || ''}
                          onChange={(e) =>
                            setVariableValues({ ...variableValues, [v]: e.target.value })
                          }
                          placeholder={`Nhập ${v}...`}
                          className="h-8 text-xs font-mono bg-muted/20"
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Prompt Preview (Collapsible) */}
            <div className="bg-card border rounded-xl p-3.5 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setShowPromptPreview(!showPromptPreview)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-foreground hover:text-indigo-600 transition-colors"
                >
                  <Eye className="h-3.5 w-3.5 text-indigo-500" />
                  <span>Xem trước câu lệnh hoàn chỉnh ({liveRenderedPrompt.length} ký tự)</span>
                </button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyPrompt}
                  className="h-6 px-2 text-[11px] text-muted-foreground hover:text-foreground"
                >
                  {isCopiedPrompt ? (
                    <>
                      <Check className="mr-1 h-3 w-3 text-emerald-500" /> Đã chép
                    </>
                  ) : (
                    <>
                      <Copy className="mr-1 h-3 w-3" /> Chép prompt
                    </>
                  )}
                </Button>
              </div>

              {showPromptPreview && (
                <div className="p-3 bg-muted/50 rounded-lg text-xs font-mono leading-relaxed whitespace-pre-wrap max-h-[160px] overflow-y-auto border text-muted-foreground">
                  {liveRenderedPrompt || 'Chưa có nội dung prompt.'}
                </div>
              )}
            </div>

            {/* Primary Action Button */}
            <Button
              onClick={handleExecuteAI}
              disabled={isExecuting || !liveRenderedPrompt.trim()}
              className="w-full h-11 bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold shadow-md transition-all text-xs sm:text-sm flex items-center justify-center gap-2"
            >
              {isExecuting ? (
                <>
                  <Spinner className="h-4 w-4 text-white" />
                  <span>Đang gửi và chờ phản hồi từ AI...</span>
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 text-amber-300 fill-amber-300" />
                  <span>Chạy thử nghiệm AI</span>
                </>
              )}
            </Button>
          </div>

          {/* RIGHT PANEL: AI Execution Results */}
          <div className="flex flex-col space-y-3">
            {/* Status & Performance Bar */}
            <div className="p-3 bg-card border rounded-xl shadow-sm flex flex-wrap items-center justify-between gap-2 min-h-[46px]">
              <div className="flex items-center gap-2">
                {executionResult ? (
                  executionResult.success ? (
                    <Badge
                      variant="secondary"
                      className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 flex items-center gap-1 text-xs"
                    >
                      <CheckCircle2 className="h-3 w-3" />
                      Phản hồi thành công
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="flex items-center gap-1 text-xs">
                      <AlertCircle className="h-3 w-3" />
                      Lỗi phản hồi
                    </Badge>
                  )
                ) : (
                  <Badge variant="outline" className="text-muted-foreground text-xs">
                    Sẵn sàng thử nghiệm
                  </Badge>
                )}

                {executionResult && (
                  <span className="flex items-center gap-1 text-muted-foreground font-mono text-[11px]">
                    <Clock className="h-3 w-3" />
                    {executionResult.executionTimeMs} ms
                  </span>
                )}
              </div>

              {executionResult?.providerCode && (
                <div className="flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
                  <Cpu className="h-3 w-3 text-indigo-500" />
                  <span>{executionResult.providerCode}</span>
                  <span>/</span>
                  <span className="font-semibold text-foreground">
                    {executionResult.modelName || 'Model'}
                  </span>
                </div>
              )}
            </div>

            {/* Response Viewer Container */}
            <div className="border rounded-xl flex-1 flex flex-col bg-card overflow-hidden shadow-sm min-h-[360px]">
              <Tabs
                value={outputTab}
                onValueChange={(val: any) => setOutputTab(val)}
                className="flex-1 flex flex-col"
              >
                <div className="flex items-center justify-between border-b px-3 py-2 bg-muted/30">
                  <TabsList className="h-8 p-0.5 bg-muted">
                    <TabsTrigger value="katex" className="text-xs h-7 px-3 flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5" />
                      Định dạng (KaTeX & Markdown)
                    </TabsTrigger>
                    <TabsTrigger value="raw" className="text-xs h-7 px-3 flex items-center gap-1.5">
                      <Terminal className="h-3.5 w-3.5" />
                      Văn bản gốc (Raw / JSON)
                    </TabsTrigger>
                  </TabsList>

                  {executionResult?.aiResponse && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopyOutput}
                      className="h-7 px-2.5 text-xs text-muted-foreground hover:text-foreground"
                    >
                      {isCopiedOutput ? (
                        <>
                          <Check className="mr-1 h-3 w-3 text-emerald-600" /> Đã chép
                        </>
                      ) : (
                        <>
                          <Copy className="mr-1 h-3 w-3" /> Sao chép
                        </>
                      )}
                    </Button>
                  )}
                </div>

                {/* Tab 1: KaTeX Markdown Render */}
                <TabsContent
                  value="katex"
                  className="flex-1 p-4 overflow-y-auto max-h-[380px] text-xs sm:text-sm leading-relaxed"
                >
                  {isExecuting ? (
                    <div className="flex flex-col items-center justify-center h-48 text-muted-foreground gap-3">
                      <Spinner className="h-7 w-7 text-indigo-600" />
                      <p className="text-xs">Đang nhận dữ liệu và render công thức Toán...</p>
                    </div>
                  ) : executionResult?.aiResponse ? (
                    <div className="prose dark:prose-invert max-w-none text-xs sm:text-sm space-y-2">
                      <ReactMarkdown
                        remarkPlugins={[remarkMath, remarkGfm]}
                        rehypePlugins={[rehypeRaw, [rehypeSanitize, sanitizeSchema], rehypeKatex]}
                      >
                        {executionResult.aiResponse}
                      </ReactMarkdown>
                    </div>
                  ) : executionResult?.errorMessage ? (
                    <div className="p-3 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 rounded-lg border border-red-200 text-xs">
                      <strong>Lỗi phản hồi:</strong> {executionResult.errorMessage}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-52 text-muted-foreground text-center space-y-2">
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                        <Bot className="h-5 w-5" />
                      </div>
                      <p className="text-xs font-medium">Chưa có kết quả phản hồi</p>
                      <p className="text-[11px] text-muted-foreground max-w-xs">
                        Điền các biến đầu vào và bấm <strong>"Chạy thử nghiệm AI"</strong> để xem phản hồi thực tế từ mô hình AI.
                      </p>
                    </div>
                  )}
                </TabsContent>

                {/* Tab 2: Raw / JSON Text */}
                <TabsContent
                  value="raw"
                  className="flex-1 p-3.5 overflow-y-auto max-h-[380px] bg-slate-950 text-slate-100 font-mono text-xs"
                >
                  <pre className="whitespace-pre-wrap leading-relaxed text-slate-200">
                    {parsedJson || executionResult?.aiResponse || 'Chưa có kết quả.'}
                  </pre>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <DialogFooter className="pt-3 border-t">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="text-xs">
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
