'use client'

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import dynamic from 'next/dynamic'
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
  Copy,
  Check,
  Sparkles,
  Zap,
  Clock,
  Cpu,
  Eye,
  FileText,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  Bot,
  Terminal,
  Code2,
  PenTool,
  Eraser,
  Upload,
  Shapes,
  HelpCircle,
} from 'lucide-react'
import {
  SystemPrompt,
  PromptTestExecuteResponse,
  systemPromptService,
} from '@/services/systemPromptService'
import { useToast } from '@/components/ui/use-toast'
import { normalizeAiGeometryJson } from '@/lib/jsxgraph-utils'

import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import remarkGfm from 'remark-gfm'
import rehypeKatex from 'rehype-katex'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize from 'rehype-sanitize'
import 'katex/dist/katex.min.css'
import { sanitizeSchema } from '@/lib/markdown'

const JsxGraphBoard = dynamic(
  () => import('@/components/ui/jsxgraph-board').then((mod) => mod.JsxGraphBoard),
  { ssr: false }
)

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
  const [outputTab, setOutputTab] = useState<'preview' | 'katex' | 'raw'>('preview')
  const [showPromptPreview, setShowPromptPreview] = useState(false)

  // Canvas / Image state for Vision Prompts
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)

  const effectiveTaskCode = customTaskCode || prompt?.taskCode || 'STUDENT_HINT'
  const effectiveTemplate = draftContent ?? (prompt?.currentContent || '')
  const allowedVariables = prompt?.allowedVariables || []

  // Check if current prompt is a Vision / Canvas prompt
  const isVisionPrompt = useMemo(() => {
    if (!prompt) return false
    return (
      effectiveTaskCode === 'CANVAS_LATEX' ||
      prompt.code === 'PROMPT_HANDWRITING_LATEX' ||
      prompt.code === 'PROMPT_SKETCH_GEOMETRY' ||
      prompt.code.includes('HANDWRITING') ||
      prompt.code.includes('SKETCH')
    )
  }, [prompt, effectiveTaskCode])

  const isSketchGeometryPrompt = useMemo(() => {
    return prompt?.code === 'PROMPT_SKETCH_GEOMETRY' || prompt?.code?.includes('SKETCH')
  }, [prompt])

  // Clear Canvas Helper
  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }, [])

  // Preset Drawing Samples
  const drawSample = useCallback((type: 'equation' | 'triangle' | 'circle' | 'parabola' | 'fraction' | 'rectangle') => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Fill white background
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Set bold high-contrast drawing properties
    ctx.strokeStyle = '#000000'
    ctx.lineWidth = 4
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.fillStyle = '#000000'

    if (type === 'equation') {
      ctx.font = 'bold 26px sans-serif'
      ctx.fillText('x² - 5x + 6 = 0', 70, 95)
      ctx.fillText('=> (x - 2)(x - 3) = 0', 45, 155)
    } else if (type === 'fraction') {
      ctx.font = 'bold 24px sans-serif'
      ctx.fillText('x =', 50, 125)
      ctx.fillText('-b ± √(b² - 4ac)', 105, 100)
      ctx.beginPath()
      ctx.moveTo(100, 115)
      ctx.lineTo(310, 115)
      ctx.stroke()
      ctx.fillText('2a', 190, 150)
    } else if (type === 'triangle') {
      // Draw right triangle ABC
      ctx.beginPath()
      ctx.moveTo(90, 160)
      ctx.lineTo(310, 160)
      ctx.lineTo(90, 40)
      ctx.closePath()
      ctx.stroke()

      // Right angle box
      ctx.beginPath()
      ctx.moveTo(90, 140)
      ctx.lineTo(110, 140)
      ctx.lineTo(110, 160)
      ctx.stroke()

      ctx.font = 'bold 20px sans-serif'
      ctx.fillText('A', 65, 175)
      ctx.fillText('B', 320, 175)
      ctx.fillText('C', 80, 30)
    } else if (type === 'rectangle') {
      ctx.beginPath()
      ctx.strokeRect(80, 50, 240, 120)

      ctx.font = 'bold 20px sans-serif'
      ctx.fillText('A', 60, 50)
      ctx.fillText('B', 330, 50)
      ctx.fillText('C', 330, 185)
      ctx.fillText('D', 60, 185)
    } else if (type === 'circle') {
      // Draw circle with center O
      ctx.beginPath()
      ctx.arc(200, 105, 65, 0, 2 * Math.PI)
      ctx.stroke()

      // Center point O
      ctx.beginPath()
      ctx.arc(200, 105, 4, 0, 2 * Math.PI)
      ctx.fill()

      // Radius line
      ctx.beginPath()
      ctx.moveTo(200, 105)
      ctx.lineTo(265, 105)
      ctx.stroke()

      ctx.font = 'bold 18px sans-serif'
      ctx.fillText('O', 185, 95)
      ctx.fillText('R', 230, 95)
    } else if (type === 'parabola') {
      // Coordinate axes
      ctx.beginPath()
      ctx.moveTo(50, 160)
      ctx.lineTo(350, 160) // X
      ctx.moveTo(200, 20)
      ctx.lineTo(200, 180) // Y
      ctx.stroke()

      // Parabola y = x^2 curve
      ctx.beginPath()
      ctx.moveTo(90, 35)
      ctx.quadraticCurveTo(200, 185, 310, 35)
      ctx.stroke()

      ctx.font = 'bold 16px sans-serif'
      ctx.fillText('O', 180, 178)
      ctx.fillText('x', 355, 165)
      ctx.fillText('y', 195, 18)
    }
  }, [])

  // Initialize variables & canvas
  useEffect(() => {
    if (open && prompt) {
      const initialValues: Record<string, string> = {}
      allowedVariables.forEach((v) => {
        initialValues[v] = ''
      })
      setVariableValues(initialValues)
      setExecutionResult(null)
      setShowPromptPreview(false)
      setOutputTab(isVisionPrompt ? 'preview' : 'katex')

      if (isVisionPrompt) {
        const timer1 = setTimeout(() => {
          clearCanvas()
          if (isSketchGeometryPrompt) {
            drawSample('triangle')
          } else {
            drawSample('fraction')
          }
        }, 150)

        const timer2 = setTimeout(() => {
          if (canvasRef.current) {
            if (isSketchGeometryPrompt) {
              drawSample('triangle')
            } else {
              drawSample('fraction')
            }
          }
        }, 350)

        return () => {
          clearTimeout(timer1)
          clearTimeout(timer2)
        }
      }
    }
  }, [prompt, open, draftContent, isVisionPrompt, isSketchGeometryPrompt, clearCanvas, drawSample, allowedVariables])

  // Canvas Mouse / Touch Handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY

    ctx.beginPath()
    ctx.moveTo((clientX - rect.left) * scaleX, (clientY - rect.top) * scaleY)
    ctx.strokeStyle = '#000000'
    ctx.lineWidth = 4
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    setIsDrawing(true)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY

    ctx.lineTo((clientX - rect.left) * scaleX, (clientY - rect.top) * scaleY)
    ctx.stroke()
  }

  const stopDrawing = () => {
    setIsDrawing(false)
  }

  // Handle Image Upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.onload = () => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        const hRatio = canvas.width / img.width
        const vRatio = canvas.height / img.height
        const ratio = Math.min(hRatio, vRatio, 1)
        const centerShiftX = (canvas.width - img.width * ratio) / 2
        const centerShiftY = (canvas.height - img.height * ratio) / 2

        ctx.drawImage(img, 0, 0, img.width, img.height, centerShiftX, centerShiftY, img.width * ratio, img.height * ratio)
      }
      img.src = event.target?.result as string
    }
    reader.readAsDataURL(file)
  }

  // Real-time client-side interpolation
  const liveRenderedPrompt = useMemo(() => {
    if (!effectiveTemplate) return ''
    let result = effectiveTemplate
    Object.entries(variableValues).forEach(([key, val]) => {
      result = result.replaceAll(`{{${key}}}`, val || '')
    })
    return result
  }, [effectiveTemplate, variableValues])

  // Parse JSXGraph Geometry from AI Response
  const parsedJsxGraph = useMemo(() => {
    if (!executionResult?.aiResponse) return null
    try {
      const trimmed = executionResult.aiResponse.trim()
      const clean = trimmed.startsWith('```json')
        ? trimmed.replace(/^```json\s*/i, '').replace(/\s*```$/, '')
        : trimmed
      const parsed = JSON.parse(clean)
      if (parsed.error === 'NO_GEOMETRY_DETECTED' || parsed.shapeType === 'NO_GEOMETRY') {
        return null
      }
      return normalizeAiGeometryJson(parsed)
    } catch {
      return null
    }
  }, [executionResult])

  // Check if result is NO_GEOMETRY_DETECTED or NO_HANDWRITING_DETECTED
  const isNoGeometryDetected = useMemo(() => {
    if (!executionResult?.aiResponse) return false
    return (
      executionResult.aiResponse.includes('NO_GEOMETRY_DETECTED') ||
      executionResult.aiResponse.includes('NO_GEOMETRY')
    )
  }, [executionResult])

  const isNoHandwritingDetected = useMemo(() => {
    if (!executionResult?.aiResponse) return false
    return executionResult.aiResponse.includes('NO_HANDWRITING_DETECTED')
  }, [executionResult])

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
      let imageData: string | undefined = undefined
      if (isVisionPrompt && canvasRef.current) {
        imageData = canvasRef.current.toDataURL('image/png')
      }

      const response = await systemPromptService.testExecutePrompt({
        promptCode: prompt.code,
        taskCode: effectiveTaskCode,
        customContent: draftContent,
        variables: variableValues,
        imageData: imageData,
        mimeType: 'image/png',
      })
      setExecutionResult(response)

      if (response.success) {
        toast({
          title: 'Thực thi AI thành công!',
          description: `Phản hồi trong ${response.executionTimeMs}ms từ ${response.modelName || 'Model'}`,
        })
      } else {
        const rawErr = (response.errorMessage || 'Không thể kết nối đến nhà cung cấp AI').trim()
        const shortErr = rawErr.length > 90 ? rawErr.substring(0, 90) + '...' : rawErr
        toast({
          title: 'AI phản hồi lỗi',
          description: shortErr,
          variant: 'destructive',
        })
      }
    } catch (err: any) {
      const rawErr = (err.response?.data?.message || err.message || 'Không thể chạy thử nghiệm prompt với AI').trim()
      const shortErr = rawErr.length > 90 ? rawErr.substring(0, 90) + '...' : rawErr
      toast({
        title: 'Lỗi thực thi kiểm thử',
        description: shortErr,
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
        className="max-w-[95vw] lg:max-w-6xl max-h-[94vh] overflow-y-auto p-4 sm:p-6"
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
                <span>Thử nghiệm Prompt: {prompt.name}</span>
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm text-muted-foreground">
                {isVisionPrompt
                  ? 'Vẽ nét tay hoặc tải ảnh mẫu để kiểm thử khả năng nhận diện hình ảnh/chữ viết của mô hình Vision AI.'
                  : 'Mô phỏng dữ liệu đầu vào và kiểm thử câu trả lời thực tế từ mô hình AI trước khi áp dụng.'}
              </DialogDescription>
            </div>

            <div className="flex items-center gap-2">
              {draftContent !== undefined && (
                <Badge
                  variant="secondary"
                  className="bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border-amber-300 self-start sm:self-center text-xs"
                >
                  Đang thử nghiệm bản nháp
                </Badge>
              )}
            </div>
          </div>
        </DialogHeader>

        {/* Main Grid: Left (Inputs / Canvas) | Right (Output / JSXGraph) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 py-2">
          {/* LEFT PANEL: Variables / Canvas & Prompt Preview */}
          <div className="flex flex-col space-y-4">
            {/* Vision Canvas Area (If Vision Prompt) */}
            {isVisionPrompt && (
              <div className="bg-card border rounded-xl p-3.5 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <PenTool className="h-4 w-4 text-purple-600" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-foreground">
                      Bảng vẽ & Ảnh mẫu đầu vào
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="h-7 px-2.5 text-[11px] flex items-center gap-1"
                    >
                      <Upload className="h-3 w-3" />
                      Tải ảnh
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                    />

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={clearCanvas}
                      className="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground"
                    >
                      <Eraser className="h-3 w-3 mr-1" />
                      Xóa bảng
                    </Button>
                  </div>
                </div>

                {/* Interactive Drawing Canvas */}
                <div className="border-2 border-slate-300 dark:border-slate-700 rounded-lg overflow-hidden bg-white shadow-inner flex justify-center">
                  <canvas
                    ref={canvasRef}
                    width={480}
                    height={210}
                    className="w-full max-w-[480px] h-[210px] cursor-crosshair touch-none bg-white"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                  />
                </div>

                {/* Quick Sample Presets */}
                <div className="space-y-1.5">
                  <div className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                    <Shapes className="h-3 w-3 text-indigo-500" />
                    <span>Vẽ nhanh mẫu thử nghiệm:</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {isSketchGeometryPrompt ? (
                      <>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => drawSample('triangle')}
                          className="h-6 px-2 text-[11px] bg-slate-100 hover:bg-slate-200"
                        >
                          Tam giác vuông ABC
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => drawSample('rectangle')}
                          className="h-6 px-2 text-[11px] bg-slate-100 hover:bg-slate-200"
                        >
                          Hình chữ nhật ABCD
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => drawSample('circle')}
                          className="h-6 px-2 text-[11px] bg-slate-100 hover:bg-slate-200"
                        >
                          Đường tròn tâm O
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => drawSample('parabola')}
                          className="h-6 px-2 text-[11px] bg-slate-100 hover:bg-slate-200"
                        >
                          Đồ thị Parabol
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => drawSample('fraction')}
                          className="h-6 px-2 text-[11px] bg-slate-100 hover:bg-slate-200"
                        >
                          Công thức nghiệm bậc 2
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => drawSample('equation')}
                          className="h-6 px-2 text-[11px] bg-slate-100 hover:bg-slate-200"
                        >
                          Phương trình bậc hai
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Variable Inputs Section (If prompt has variables) */}
            {allowedVariables.length > 0 && (
              <div className="bg-card border rounded-xl p-4 shadow-sm space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Code2 className="h-4 w-4 text-indigo-500" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-foreground">
                      Biến đầu vào ({allowedVariables.length})
                    </span>
                  </div>
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
                </div>

                <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                  {allowedVariables.map((v) => (
                    <div key={v} className="space-y-1">
                      <Label
                        htmlFor={`var-${v}`}
                        className="font-mono text-xs font-medium text-indigo-600 dark:text-indigo-400"
                      >
                        {`{{${v}}}`}
                      </Label>
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
              </div>
            )}

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
                  <span>{isVisionPrompt ? 'Chạy thử nghiệm Vision AI' : 'Chạy thử nghiệm AI'}</span>
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
            <div className="border rounded-xl flex-1 flex flex-col bg-card overflow-hidden shadow-sm min-h-[380px]">
              <Tabs
                value={outputTab}
                onValueChange={(val: any) => setOutputTab(val)}
                className="flex-1 flex flex-col"
              >
                <div className="flex items-center justify-between border-b px-3 py-2 bg-muted/30">
                  <TabsList className="h-8 p-0.5 bg-muted">
                    {parsedJsxGraph && (
                      <TabsTrigger value="preview" className="text-xs h-7 px-3 flex items-center gap-1.5">
                        <Shapes className="h-3.5 w-3.5 text-purple-600" />
                        Bảng vẽ JSXGraph
                      </TabsTrigger>
                    )}
                    <TabsTrigger value="katex" className="text-xs h-7 px-3 flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5" />
                      Định dạng (KaTeX / UI)
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

                {/* Tab 1: JSXGraph Interactive Canvas (If Geometry JSON detected) */}
                {parsedJsxGraph && (
                  <TabsContent
                    value="preview"
                    className="flex-1 p-3 overflow-hidden flex flex-col space-y-2"
                  >
                    <div className="border rounded-lg overflow-hidden bg-white shadow-inner h-[320px]">
                      <JsxGraphBoard
                        jsxGraphData={parsedJsxGraph}
                        height={320}
                        readOnly={true}
                        shapeCode="test-preview-board"
                      />
                    </div>
                    <p className="text-[11px] text-muted-foreground italic text-center">
                      Hình vẽ JSXGraph Canvas được chuẩn hóa và render trực tiếp từ JSON mà AI sinh ra.
                    </p>
                  </TabsContent>
                )}

                {/* Tab 2: KaTeX Markdown Render & Friendly Detection Alerts */}
                <TabsContent
                  value="katex"
                  className="flex-1 p-4 overflow-y-auto max-h-[380px] text-xs sm:text-sm leading-relaxed"
                >
                  {isExecuting ? (
                    <div className="flex flex-col items-center justify-center h-48 text-muted-foreground gap-3">
                      <Spinner className="h-7 w-7 text-indigo-600" />
                      <p className="text-xs">Đang nhận dữ liệu và xử lý phản hồi từ AI...</p>
                    </div>
                  ) : isNoGeometryDetected ? (
                    <div className="p-4 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 rounded-xl border border-amber-200 space-y-2">
                      <div className="flex items-center gap-2 font-semibold text-amber-800 dark:text-amber-300">
                        <AlertCircle className="h-4 w-4 text-amber-600" />
                        <span>Không phát hiện hình vẽ phác thảo (NO_GEOMETRY_DETECTED)</span>
                      </div>
                      <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                        Mô hình Vision AI phản hồi rằng ảnh đầu vào chưa có hình học rõ ràng (hoặc bảng vẽ đang để trống).
                      </p>
                      <div className="pt-1 text-xs">
                        👉 <strong>Cách thử nghiệm:</strong> Hãy dùng chuột vẽ một hình học (tam giác, đường tròn, parabol) lên bảng vẽ bên trái, hoặc bấm vào các nút vẽ sẵn như <strong>"Tam giác vuông ABC"</strong> / <strong>"Đường tròn tâm O"</strong> rồi bấm lại nút <strong>"Chạy thử nghiệm Vision AI"</strong>.
                      </div>
                    </div>
                  ) : isNoHandwritingDetected ? (
                    <div className="p-4 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 rounded-xl border border-amber-200 space-y-2">
                      <div className="flex items-center gap-2 font-semibold text-amber-800 dark:text-amber-300">
                        <AlertCircle className="h-4 w-4 text-amber-600" />
                        <span>Không phát hiện chữ viết tay (NO_HANDWRITING_DETECTED)</span>
                      </div>
                      <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                        Mô hình Vision AI phản hồi rằng ảnh đầu vào chưa có chữ viết hoặc công thức toán.
                      </p>
                      <div className="pt-1 text-xs">
                        👉 <strong>Cách thử nghiệm:</strong> Hãy viết một công thức toán lên bảng vẽ hoặc bấm nút <strong>"Công thức nghiệm bậc 2"</strong> rồi bấm lại nút <strong>"Chạy thử nghiệm Vision AI"</strong>.
                      </div>
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
                        {isVisionPrompt
                          ? 'Vẽ nét chữ / hình học hoặc chọn mẫu vẽ sẵn rồi bấm "Chạy thử nghiệm Vision AI".'
                          : 'Điền các biến đầu vào và bấm "Chạy thử nghiệm AI" để xem phản hồi thực tế.'}
                      </p>
                    </div>
                  )}
                </TabsContent>

                {/* Tab 3: Raw / JSON Text */}
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
