'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { useToast } from '@/components/ui/use-toast'
import { useI18n } from '@/lib/i18n/i18n-context'
import { handwritingService } from '@/services/handwritingService'
import { Loader2, Eraser, Upload, Sparkles, Check, Wand2 } from 'lucide-react'
import 'katex/dist/katex.min.css'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import remarkGfm from 'remark-gfm'
import rehypeKatex from 'rehype-katex'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize from 'rehype-sanitize'
import { sanitizeSchema } from '@/lib/markdown'
import { markdownComponents } from '@/components/ui/markdown-components'
import dynamic from 'next/dynamic'
import { normalizeAiGeometryJson } from '@/lib/jsxgraph-utils'
import { normalizeLatexToMarkdown } from '@/lib/editor-utils'

const JsxGraphBoard = dynamic(() => import('@/components/ui/jsxgraph-board').then(mod => mod.JsxGraphBoard), { ssr: false })

interface HandwritingSketchModalProps {
  isOpen: boolean
  onClose: () => void
  onInsertLatex?: (latex: string) => void
  onInsertGeometry?: (geometryJson: string) => void
}

export function HandwritingSketchModal({
  isOpen,
  onClose,
  onInsertLatex,
  onInsertGeometry,
}: HandwritingSketchModalProps) {
  const { toast } = useToast()
  const { t } = useI18n()
  const [activeTab, setActiveTab] = useState<'handwriting' | 'sketch'>('handwriting')
  const [isProcessing, setIsProcessing] = useState(false)

  // Tab 1: Handwriting state
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const handwritingFileInputRef = useRef<HTMLInputElement | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [latexResult, setLatexResult] = useState<string>('')
  const previewRef = useRef<HTMLDivElement | null>(null)

  // Tab 2: Sketch state
  const sketchCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const sketchFileInputRef = useRef<HTMLInputElement | null>(null)
  const [isSketchDrawing, setIsSketchDrawing] = useState(false)
  const [geometryResult, setGeometryResult] = useState<{ shapeType: string; geometryJson: string } | null>(null)

  // Clear Canvas 1
  const clearHandwritingCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    setLatexResult('')
  }

  // Clear Canvas 2
  const clearSketchCanvas = () => {
    const canvas = sketchCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    setGeometryResult(null)
  }

  // Setup initial canvas backgrounds
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        clearHandwritingCanvas()
        clearSketchCanvas()
      }, 100)
    }
  }, [isOpen])

  const katexConfig = useMemo(() => ({
    throwOnError: false,
    errorColor: '#64748b',
    macros: { '\\placeholder': '\\square' }
  }), [])

  // Canvas Coordinate Helper
  const getCanvasCoords = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
    canvas: HTMLCanvasElement
  ) => {
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const clientX = 'touches' in e ? e.touches[0]?.clientX ?? 0 : e.clientX
    const clientY = 'touches' in e ? e.touches[0]?.clientY ?? 0 : e.clientY
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    }
  }

  // Drawing Handlers for Canvas 1
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true)
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const coords = getCanvasCoords(e, canvas)
    ctx.beginPath()
    ctx.moveTo(coords.x, coords.y)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const coords = getCanvasCoords(e, canvas)
    ctx.lineWidth = 3
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = '#1e293b'
    ctx.lineTo(coords.x, coords.y)
    ctx.stroke()
  }

  const stopDrawing = () => {
    setIsDrawing(false)
  }

  // Drawing Handlers for Canvas 2
  const startSketchDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsSketchDrawing(true)
    const canvas = sketchCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const coords = getCanvasCoords(e, canvas)
    ctx.beginPath()
    ctx.moveTo(coords.x, coords.y)
  }

  const sketchDraw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isSketchDrawing) return
    const canvas = sketchCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const coords = getCanvasCoords(e, canvas)
    ctx.lineWidth = 3
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = '#2563eb'
    ctx.lineTo(coords.x, coords.y)
    ctx.stroke()
  }

  const stopSketchDrawing = () => {
    setIsSketchDrawing(false)
  }

  // File Upload Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, isSketch = false) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (evt) => {
      const img = new Image()
      img.onload = () => {
        const targetCanvas = isSketch ? sketchCanvasRef.current : canvasRef.current
        if (!targetCanvas) return
        const ctx = targetCanvas.getContext('2d')
        if (!ctx) return
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, targetCanvas.width, targetCanvas.height)
        const scale = Math.min(targetCanvas.width / img.width, targetCanvas.height / img.height)
        const x = (targetCanvas.width - img.width * scale) / 2
        const y = (targetCanvas.height - img.height * scale) / 2
        ctx.drawImage(img, x, y, img.width * scale, img.height * scale)
      }
      img.src = evt.target?.result as string
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  // Helper check if canvas is blank
  const isCanvasBlank = (canvas: HTMLCanvasElement | null): boolean => {
    if (!canvas) return true
    const ctx = canvas.getContext('2d')
    if (!ctx) return true
    const pixelData = ctx.getImageData(0, 0, canvas.width, canvas.height).data
    for (let i = 0; i < pixelData.length; i += 4) {
      const r = pixelData[i]
      const g = pixelData[i + 1]
      const b = pixelData[i + 2]
      const a = pixelData[i + 3]
      if (a > 10 && (r < 250 || g < 250 || b < 250)) {
        return false
      }
    }
    return true
  }

  // Submit Handwriting to AI
  const handleRecognizeHandwriting = async () => {
    const canvas = canvasRef.current
    if (!canvas || isCanvasBlank(canvas)) {
      toast({
        title: t('Chưa có nội dung'),
        description: t('Vui lòng vẽ chữ viết tay hoặc tải ảnh chữ viết tay lên trước khi bấm nhận diện.'),
        variant: 'destructive',
      })
      return
    }

    const imageData = canvas.toDataURL('image/png')
    setIsProcessing(true)
    try {
      const res = await handwritingService.convertHandwritingToLatex(imageData, 'image/png')
      const rawText = res.latex ? res.latex.trim() : ''
      const cleanLatex = normalizeLatexToMarkdown(rawText)

      if (!cleanLatex || cleanLatex.includes('NO_HANDWRITING_DETECTED')) {
        toast({
          title: t('Không tìm thấy chữ viết'),
          description: t('Không nhận diện thấy chữ viết tay hoặc công thức toán trong ảnh. Vui lòng kiểm tra lại nét vẽ hoặc ảnh tải lên.'),
          variant: 'destructive',
        })
        setLatexResult('')
        return
      }

      setLatexResult(cleanLatex)
      toast({
        title: t('Nhận diện thành công'),
        description: t('Đã chuyển chữ viết tay sang mã LaTeX.'),
      })
    } catch (err: any) {
      toast({
        title: t('Lỗi nhận diện'),
        description: err.response?.data?.message || t('Không thể nhận diện chữ viết tay. Vui lòng thử lại.'),
        variant: 'destructive',
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // Submit Sketch to AI
  const handleNormalizeSketch = async () => {
    const canvas = sketchCanvasRef.current
    if (!canvas || isCanvasBlank(canvas)) {
      toast({
        title: 'Chưa có nội dung',
        description: t('Vui lòng phác thảo hình vẽ hoặc tải ảnh phác thảo lên trước khi bấm nắn chỉnh.'),
        variant: 'destructive',
      })
      return
    }

    const imageData = canvas.toDataURL('image/png')
    setIsProcessing(true)
    try {
      const res = await handwritingService.normalizeSketchToGeometry(imageData, 'image/png')
      const jsonStr = res.geometryJson || ''

      if (res.shapeType === 'NO_GEOMETRY' || jsonStr.includes('NO_GEOMETRY_DETECTED') || !jsonStr.trim()) {
        toast({
          title: t('Không tìm thấy hình phác thảo'),
          description: t('Không nhận diện thấy nét vẽ hình học trong ảnh. Vui lòng phác thảo lại hình vẽ rõ ràng hơn.'),
          variant: 'destructive',
        })
        setGeometryResult(null)
        return
      }

      try {
        const parsed = JSON.parse(jsonStr)
        if (!parsed.elements || !Array.isArray(parsed.elements) || parsed.elements.length === 0) {
          toast({
            title: 'Không tìm thấy hình phác thảo',
            description: t('Ảnh không chứa đối tượng hình học hợp lệ. Vui lòng thử vẽ lại.'),
            variant: 'destructive',
          })
          setGeometryResult(null)
          return
        }
      } catch {
        // ignore parse error
      }

      setGeometryResult(res)
      toast({
        title: t('Nắn chỉnh thành công'),
        description: `${t('Đã nắn chỉnh hình phác thảo')} (${res.shapeType}).`,
      })
    } catch (err: any) {
      toast({
        title: t('Lỗi nắn chỉnh'),
        description: err.response?.data?.message || t('Không thể nắn chỉnh hình phác thảo. Vui lòng thử lại.'),
        variant: 'destructive',
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleInsertLatexAction = () => {
    if (latexResult && onInsertLatex) {
      onInsertLatex(latexResult)
      onClose()
    }
  }

  const normalizedGeometryData = useMemo(() => {
    if (!geometryResult?.geometryJson) return null
    try {
      const parsed = JSON.parse(geometryResult.geometryJson)
      return normalizeAiGeometryJson(parsed)
    } catch {
      return null
    }
  }, [geometryResult])

  const handleInsertGeometryAction = () => {
    if (geometryResult && onInsertGeometry) {
      const dataToInsert = normalizedGeometryData
        ? JSON.stringify(normalizedGeometryData)
        : geometryResult.geometryJson
      onInsertGeometry(dataToInsert)
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-5xl w-[92vw] max-h-[88vh] flex flex-col p-0 overflow-hidden bg-white rounded-2xl shadow-2xl border border-slate-200">
        <DialogHeader className="p-5 border-b shrink-0 bg-white">
          <DialogTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600" /> {t("Trợ lý AI: Số hóa chữ viết & Phác thảo hình học")}
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-500">
            {t("Vẽ tự do hoặc tải ảnh lên để AI tự động trích xuất công thức toán hoặc nắn chỉnh hình phác thảo.")}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="handwriting" onValueChange={(val) => setActiveTab(val as any)} className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="px-5 pt-3 shrink-0 bg-slate-50 border-b">
            <TabsList className="grid w-full grid-cols-2 bg-slate-200/60 p-1 rounded-lg">
              <TabsTrigger value="handwriting" className="font-semibold text-xs sm:text-sm">
                ✍️ {t("Chữ viết tay ➔ LaTeX")}
              </TabsTrigger>
              <TabsTrigger value="sketch" className="font-semibold text-xs sm:text-sm">
                📐 {t("Phác thảo nét ➔ Canvas chuẩn")}
              </TabsTrigger>
            </TabsList>
          </div>

          {/* TAB 1: HANDWRITING */}
          <div className={activeTab === 'handwriting' ? 'flex-1 flex flex-col min-h-0' : 'hidden'}>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600 font-medium">{t("Vẽ công thức lên khung bên dưới hoặc tải ảnh lên:")}</span>
                <div className="flex items-center gap-2">
                  <input
                    ref={handwritingFileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, false)}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    type="button"
                    onClick={() => handwritingFileInputRef.current?.click()}
                    className="text-xs border-slate-300"
                  >
                    <Upload className="w-3.5 h-3.5 mr-1" /> {t("Tải ảnh")}
                  </Button>
                  <Button variant="outline" size="sm" type="button" onClick={clearHandwritingCanvas} className="text-xs border-slate-300">
                    <Eraser className="w-3.5 h-3.5 mr-1" /> {t("Xóa khung")}
                  </Button>
                </div>
              </div>

              <div className="border border-slate-300 rounded-lg overflow-hidden bg-white shadow-inner flex justify-center">
                <canvas
                  ref={canvasRef}
                  width={720}
                  height={220}
                  className="cursor-crosshair touch-none bg-white max-w-full"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                />
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handleRecognizeHandwriting}
                  disabled={isProcessing}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs h-9 px-4"
                >
                  {isProcessing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Wand2 className="w-4 h-4 mr-2" />}
                  {isProcessing ? t('Đang trích xuất văn bản...') : t('Trích xuất văn bản (AI)')}
                </Button>
              </div>

              {/* Preview Section */}
              {latexResult && (
                <div className="p-4 bg-slate-50 border border-blue-200 rounded-lg space-y-2">
                  <span className="text-xs font-bold text-blue-700 block uppercase tracking-wider">{t("Xem trước kết quả nhận diện:")}</span>
                  <div className="py-3 px-4 text-left bg-white rounded-lg border border-slate-200 min-h-[60px] prose prose-slate max-w-none text-sm leading-relaxed overflow-x-auto">
                    <ReactMarkdown
                      remarkPlugins={[remarkMath, remarkGfm]}
                      rehypePlugins={[rehypeRaw, [rehypeSanitize, sanitizeSchema], [rehypeKatex, katexConfig]]}
                      components={markdownComponents}
                    >
                      {latexResult}
                    </ReactMarkdown>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="p-4 border-t shrink-0 bg-slate-50 flex flex-row items-center justify-end gap-2">
              <Button variant="ghost" type="button" onClick={onClose} className="text-xs">{t("Hủy")}</Button>
              <Button
                disabled={!latexResult}
                onClick={handleInsertLatexAction}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs"
              >
                <Check className="w-4 h-4 mr-1" /> {t("Chèn văn bản vào bài")}
              </Button>
            </DialogFooter>
          </div>

          {/* TAB 2: SKETCH GEOMETRY */}
          <div className={activeTab === 'sketch' ? 'flex-1 flex flex-col min-h-0' : 'hidden'}>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600 font-medium">{t("Vẽ phác thảo hình học tay (tam giác, đường tròn, tứ giác...):")}</span>
                <div className="flex items-center gap-2">
                  <input
                    ref={sketchFileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, true)}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    type="button"
                    onClick={() => sketchFileInputRef.current?.click()}
                    className="text-xs border-slate-300"
                  >
                    <Upload className="w-3.5 h-3.5 mr-1" /> Tải ảnh
                  </Button>
                  <Button variant="outline" size="sm" type="button" onClick={clearSketchCanvas} className="text-xs border-slate-300">
                    <Eraser className="w-3.5 h-3.5 mr-1" /> Xóa khung
                  </Button>
                </div>
              </div>

              <div className="border border-slate-300 rounded-lg overflow-hidden bg-white shadow-inner flex justify-center">
                <canvas
                  ref={sketchCanvasRef}
                  width={720}
                  height={220}
                  className="cursor-crosshair touch-none bg-white max-w-full"
                  onMouseDown={startSketchDrawing}
                  onMouseMove={sketchDraw}
                  onMouseUp={stopSketchDrawing}
                  onMouseLeave={stopSketchDrawing}
                  onTouchStart={startSketchDrawing}
                  onTouchMove={sketchDraw}
                  onTouchEnd={stopSketchDrawing}
                />
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handleNormalizeSketch}
                  disabled={isProcessing}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs h-9 px-4"
                >
                  {isProcessing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                  {isProcessing ? t('Đang chuẩn hóa phác thảo...') : t('Chuẩn hóa hình phác thảo (AI)')}
                </Button>
              </div>

              {geometryResult && (
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg space-y-2">
                  <span className="text-xs font-bold text-purple-700 block uppercase tracking-wider">
                    {t("Kết quả nhận diện:")} {geometryResult.shapeType}
                  </span>
                  {normalizedGeometryData && (
                    <div className="bg-white rounded-lg border border-purple-200 overflow-hidden">
                      <JsxGraphBoard jsxGraphData={normalizedGeometryData} width="100%" height={240} readOnly={true} />
                    </div>
                  )}
                </div>
              )}
            </div>

            <DialogFooter className="p-4 border-t shrink-0 bg-slate-50 flex flex-row items-center justify-end gap-2">
              <Button variant="ghost" type="button" onClick={onClose} className="text-xs">Hủy</Button>
              <Button
                disabled={!geometryResult}
                onClick={handleInsertGeometryAction}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs"
              >
                <Check className="w-4 h-4 mr-1" /> {t("Chèn hình chuẩn vào bài làm")}
              </Button>
            </DialogFooter>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
