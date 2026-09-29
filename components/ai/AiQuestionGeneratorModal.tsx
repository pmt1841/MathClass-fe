'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Sparkles, Loader2, RefreshCw, CheckCircle, X, HelpCircle, BookOpen, Layers, Target, PlusCircle, Replace } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import remarkGfm from 'remark-gfm'
import rehypeKatex from 'rehype-katex'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize from 'rehype-sanitize'
import 'katex/dist/katex.min.css'
import { toast } from 'sonner'
import { useI18n } from '@/lib/i18n/i18n-context'

import { sanitizeSchema } from '@/lib/markdown'
import { markdownComponents } from '@/components/ui/markdown-components'
import { cn, normalizeKatexDelimiters } from '@/lib/utils'
import { aiQuestionService, AiGeneratedQuestionDTO, GenerateQuestionRequestDTO } from '@/services/aiQuestionService'
import { aiJobService } from '@/services/aiJobService'
import { AiJobStatus } from '@/types/aiJob'
import { AiJobCancelConfirmDialog } from '@/components/ai/AiJobCancelConfirmDialog'
import { useQueryClient } from '@tanstack/react-query'
import dynamic from 'next/dynamic'

const JsxGraphBoard = dynamic(() => import('@/components/ui/jsxgraph-board').then(mod => mod.JsxGraphBoard), { ssr: false })

interface AiQuestionGeneratorModalProps {
  isOpen: boolean
  onClose: () => void
  onInsertQuestion: (question: AiGeneratedQuestionDTO, mode: 'append' | 'replace') => void
}

export function AiQuestionGeneratorModal({
  isOpen,
  onClose,
  onInsertQuestion
}: AiQuestionGeneratorModalProps) {
  const { t } = useI18n()
  const [prompt, setPrompt] = useState('')
  const [grade, setGrade] = useState<number>(9)
  const [difficulty, setDifficulty] = useState<string>('THONG_HIEU')
  const [topic, setTopic] = useState('')
  const [includeCanvasDiagram, setIncludeCanvasDiagram] = useState<boolean>(false)
  const [includeExplanation, setIncludeExplanation] = useState<boolean>(false)

  const queryClient = useQueryClient()
  const [isLoading, setIsLoading] = useState(false)
  const [jobStatus, setJobStatus] = useState<AiJobStatus | null>(null)
  const [jobStatusMessage, setJobStatusMessage] = useState<string>('')
  const [activeJobId, setActiveJobId] = useState<string | null>(null)
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [reservedCredits, setReservedCredits] = useState<number>(0)
  const [generatedQuestion, setGeneratedQuestion] = useState<AiGeneratedQuestionDTO | null>(null)
  const [activeTab, setActiveTab] = useState<'content' | 'explanation'>('content')

  const cancelRequestedRef = useRef(false)
  const abortControllerRef = useRef<AbortController | null>(null)
  const activeJobIdRef = useRef<string | null>(null)
  const isOpenRef = useRef(isOpen)

  useEffect(() => {
    isOpenRef.current = isOpen
  }, [isOpen])

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
        abortControllerRef.current = null
      }
    }
  }, [])

  const handleClose = () => {
    if (isLoading) {
      toast.info(t('AI đang tiếp tục soạn đề bài toán ở chế độ nền. Bạn có thể mở lại bất cứ lúc nào.'))
    }
    onClose()
  }

  const executeCancelJob = async (force = false) => {
    const jobId = activeJobIdRef.current
    setIsCancelling(true)

    try {
      if (jobId) {
        const res = await aiJobService.cancelJob(jobId, force)

        if (res.code === 'ALREADY_PROCESSING' || (!res.cancelled && res.status === 'PROCESSING')) {
          // Graceful Fallback: AI đã chạy sang PROCESSING, từ chối hủy ngầm để bảo vệ credit cho user
          setJobStatus('PROCESSING')
          setJobStatusMessage('AI đang soạn đề bài toán và lời giải...')
          setIsCancelling(false)
          setIsCancelDialogOpen(false)
          toast.info(
            'AI vừa bắt đầu xử lý đề bài cho bạn! Tác vụ đang tiếp tục chạy để không lãng phí credit. Bạn vui lòng đợi kết quả nhé!',
            { duration: 5000 }
          )
          return
        }

        if (res.refunded) {
          toast.success(res.message || t('Đã dừng tác vụ và hoàn lại credit.'))
        } else if (res.cancelled) {
          toast.info(res.message || t('Đã dừng tác vụ đang xử lý (không hoàn credit).'))
        } else {
          toast.info(res.message)
        }
      } else {
        toast.info(t('Đã dừng tác vụ sinh đề AI'))
      }

      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
        abortControllerRef.current = null
      }
      setIsLoading(false)
      setJobStatus(null)
      setJobStatusMessage('')
      setReservedCredits(0)
      activeJobIdRef.current = null
      setActiveJobId(null)
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || t('Lỗi khi hủy tác vụ')
      toast.error(msg)
    } finally {
      queryClient.invalidateQueries({ queryKey: ['credits'] })
      setIsCancelling(false)
      setIsCancelDialogOpen(false)
    }
  }

  const handleCancelJob = async () => {
    // Nếu tác vụ đã hoàn thành hoặc đã có câu hỏi tạo xong thì không thể hủy
    if (jobStatus === 'COMPLETED' || generatedQuestion) {
      setJobStatus('COMPLETED')
      setIsCancelling(false)
      setIsCancelDialogOpen(true)
      return
    }

    const jobId = activeJobIdRef.current
    if (!jobId) {
      // Người dùng bấm Dừng khi request submit đang bay lên server
      cancelRequestedRef.current = true
      setIsCancelling(true)
      setJobStatusMessage('Đang hủy tác vụ và hoàn credit...')
      return
    }

    // Tra cứu realtime trạng thái thực tế từ Backend và mở dialog xác nhận
    setIsCancelling(true)
    try {
      const currentJob = await aiJobService.getJobStatus(jobId)
      setJobStatus(currentJob.status)
      if (typeof currentJob.reservedCredits === 'number') {
        setReservedCredits(currentJob.reservedCredits)
      }
    } catch {
      // Giữ nguyên status hiện tại nếu có lỗi mạng
    } finally {
      setIsCancelling(false)
      setIsCancelDialogOpen(true)
    }
  }

  const hasContent = Boolean(
    isLoading ||
    generatedQuestion ||
    prompt.trim() ||
    topic.trim()
  )

  if (!isOpen && !hasContent) return null

  const handleReset = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    activeJobIdRef.current = null
    setActiveJobId(null)
    setPrompt('')
    setTopic('')
    setIncludeCanvasDiagram(false)
    setIncludeExplanation(false)
    setGeneratedQuestion(null)
    setReservedCredits(0)
    setIsLoading(false)
    setJobStatus(null)
    setJobStatusMessage('')
    setActiveTab('content')
    toast.info(t('Đã xóa dữ liệu và làm mới'))
  }

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error(t('Vui lòng nhập nội dung yêu cầu bài toán'))
      return
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    const controller = new AbortController()
    abortControllerRef.current = controller

    cancelRequestedRef.current = false
    setIsLoading(true)
    setJobStatus('QUEUED')
    setJobStatusMessage('Đang tiếp nhận yêu cầu trong hàng chờ...')
    setGeneratedQuestion(null)
    setActiveTab('content')

    const requestDTO: GenerateQuestionRequestDTO = {
      prompt: prompt.trim(),
      grade,
      difficulty,
      topic: topic.trim() || undefined,
      includeCanvasDiagram,
      includeExplanation
    }

    try {
      const result = await aiQuestionService.generateQuestionAsync(requestDTO, {
        signal: controller.signal,
        onJobCreated: async (jobId) => {
          activeJobIdRef.current = jobId
          setActiveJobId(jobId)
          if (cancelRequestedRef.current) {
            try {
              const res = await aiJobService.cancelJob(jobId)
              if (res.refunded) {
                toast.success(res.message || `Đã dừng tác vụ và hoàn lại ${res.refundedCredits || ''} credit.`)
              } else {
                toast.info(res.message || 'Đã dừng tác vụ AI.')
              }
            } catch (err: any) {
              toast.error(err?.response?.data?.message || 'Lỗi khi hủy tác vụ')
            } finally {
              queryClient.invalidateQueries({ queryKey: ['credits'] })
              setIsCancelling(false)
              controller.abort()
            }
          }
        },
        onStatusChange: (status, message, job) => {
          setJobStatus(status)
          if (typeof job?.reservedCredits === 'number') {
            setReservedCredits(job.reservedCredits)
          }
          if (status === 'QUEUED') {
            setJobStatusMessage('Đang tiếp nhận yêu cầu trong hàng chờ...')
          } else if (status === 'PROCESSING') {
            setJobStatusMessage('AI đang soạn đề bài toán và lời giải...')
          } else if (status === 'RETRYING') {
            setJobStatusMessage(message || 'Đang kết nối lại với hệ thống AI...')
          } else if (status === 'COMPLETED') {
            queryClient.invalidateQueries({ queryKey: ['credits'] })
          }
        }
      })
      const normalizedResult: AiGeneratedQuestionDTO = {
        ...result,
        content: normalizeKatexDelimiters(result.content),
        explanation: result.explanation ? normalizeKatexDelimiters(result.explanation) : result.explanation
      }
      setGeneratedQuestion(normalizedResult)
      setJobStatus('COMPLETED')
      setActiveTab('content')
      queryClient.invalidateQueries({ queryKey: ['credits'] })
      if (!isOpenRef.current) {
        toast.success('AI đã soạn xong bài toán! Bấm vào Trợ lý AI để xem kết quả.')
      } else {
        toast.success('Sinh đề bài toán bằng AI thành công!')
      }
    } catch (error: any) {
      setJobStatus(null)
      if (controller.signal.aborted || error?.name === 'AbortError' || error?.message?.includes('hủy bỏ')) {
        return
      }
      const serverMsg = error?.response?.data?.message || error?.message || ''
      const lower = serverMsg.toLowerCase()
      if (
        !serverMsg ||
        lower.includes('key') ||
        lower.includes('quota') ||
        lower.includes('429') ||
        lower.includes('resource_exhausted') ||
        lower.includes('exceeded') ||
        lower.includes('http') ||
        lower.includes('exception') ||
        lower.includes('gemini') ||
        lower.includes('openai') ||
        lower.includes('lỗi chi tiết')
      ) {
        toast.error('Dịch vụ AI hiện đang quá tải hoặc gặp sự cố. Vui lòng thử lại sau.')
      } else {
        toast.error(serverMsg)
      }
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null
      }
      setIsLoading(false)
      activeJobIdRef.current = null
      setActiveJobId(null)
    }
  }

  const handleApply = (mode: 'append' | 'replace' = 'append') => {
    if (!generatedQuestion) return
    onInsertQuestion(generatedQuestion, mode)
    if (mode === 'replace') {
      toast.success(t('Đã thay thế nội dung bài tập!'))
    } else {
      toast.success(t('Đã bổ sung bài toán vào trình soạn thảo!'))
    }
    handleClose()
  }

  return (
    <div
      className={cn(
        "fixed inset-0 z-[150] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-200",
        !isOpen && "hidden"
      )}
      aria-hidden={!isOpen}
    >
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">

        {/* MODAL HEADER */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-blue-500/10 dark:from-purple-950/30 dark:via-indigo-950/30 dark:to-blue-950/30">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-500/20">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                {t("Trợ lý Sinh Đề Toán AI")}
                <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded-full border border-purple-200 dark:border-purple-800">
                  AI Assistant
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t("Nhập yêu cầu bằng câu lệnh tự nhiên để AI tự động soạn đề bài toán kèm công thức KaTeX")}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* INPUT FORM SECTION */}
          <div className="space-y-4 bg-slate-50 dark:bg-slate-850/50 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800">
            {/* Prompt Textarea */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                  {t("Yêu cầu / Ý tưởng đề bài toán")}
                </label>
              </div>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={t("Ví dụ: Cho tam giác ABC nhọn nội tiếp đường tròn (O; R). Gọi H là chân đường cao hạ từ A xuống BC. Chứng minh rằng...")}
                rows={3}
                className="w-full text-sm p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400 resize-none"
              />
            </div>

            {/* Filters Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Grade */}
              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase block mb-1">
                  Khối lớp
                </label>
                <select
                  value={grade}
                  onChange={(e) => setGrade(Number(e.target.value))}
                  className="w-full text-xs font-medium p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-indigo-500"
                >
                  {[6, 7, 8, 9, 10, 11, 12].map((g) => (
                    <option key={g} value={g}>{t("Lớp")} {g}</option>
                  ))}
                </select>
              </div>

              {/* Difficulty */}
              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase block mb-1">
                  Mức độ tư duy
                </label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full text-xs font-medium p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-indigo-500"
                >
                  <option value="NHAN_BIET">{t("Nhận biết")}</option>
                  <option value="THONG_HIEU">{t("Thông hiểu")}</option>
                  <option value="VAN_DUNG">{t("Vận dụng")}</option>
                  <option value="VAN_DUNG_CAO">{t("Vận dụng cao")}</option>
                </select>
              </div>

              {/* Topic */}
              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase block mb-1">
                  Chủ đề (Tùy chọn)
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder={t("Ví dụ: Hình học 9 - Đường tròn")}
                  className="w-full text-xs p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Options Checkbox Row & Action Button */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex flex-wrap items-center gap-4">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={includeCanvasDiagram}
                    onChange={(e) => setIncludeCanvasDiagram(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 rounded-md cursor-pointer"
                  />
                  {t("Kèm hình vẽ minh họa / đồ thị")}
                </label>

                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={includeExplanation}
                    onChange={(e) => setIncludeExplanation(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 rounded-md cursor-pointer"
                  />
                  {t("Kèm lời giải chi tiết")}
                </label>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={handleReset}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-200/80 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-all cursor-pointer disabled:opacity-60"
                  title="Xóa tất cả nội dung cũ"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                  Làm mới
                </button>

                <button
                  type="button"
                  disabled={isLoading}
                  onClick={handleGenerate}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-md hover:shadow-indigo-500/25 active:scale-98 transition-all disabled:opacity-60 cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Đang sinh đề...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Sinh đề bằng AI
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* GENERATED RESULT PREVIEW SECTION */}
          {isLoading && (
            <div className="p-8 text-center border border-dashed border-indigo-200 dark:border-indigo-900/50 rounded-2xl bg-indigo-50/30 dark:bg-indigo-950/10 space-y-3">
              <div className="inline-flex p-3 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
              <div className="flex items-center justify-center gap-2">
                <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300">
                  {jobStatus === 'QUEUED'
                    ? 'ĐANG CHỜ'
                    : jobStatus === 'PROCESSING'
                      ? 'ĐANG SOẠN ĐỀ'
                      : jobStatus === 'RETRYING'
                        ? 'THỬ LẠI'
                        : 'ĐANG XỬ LÝ'}
                </span>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  {jobStatusMessage || 'Hệ thống đang chuẩn bị đề toán...'}
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                Hệ thống đang tiếp nhận yêu cầu và sẽ tạo đề toán trong giây lát. Vui lòng đợi một chút nhé!
              </p>
            </div>
          )}

          {generatedQuestion && !isLoading && (
            <div className="space-y-4 border border-emerald-200 dark:border-emerald-900/50 rounded-2xl p-5 bg-emerald-50/20 dark:bg-emerald-950/10">
              {/* Title & Metadata Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-100 dark:border-emerald-900/30 pb-3">
                <div>
                  <span className="text-[10px] font-extrabold uppercase text-emerald-600 dark:text-emerald-400 tracking-wider block">
                    Kết quả AI sinh ra
                  </span>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    {generatedQuestion.title || 'Đề bài toán mới'}
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  {/* Tab switches */}
                  <div className="flex bg-slate-100 dark:bg-slate-850 p-1 rounded-xl text-xs font-bold">
                    <button
                      onClick={() => setActiveTab('content')}
                      className={`px-3 py-1 rounded-lg transition-all ${activeTab === 'content'
                          ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-xs'
                          : 'text-slate-500 hover:text-slate-800'
                        }`}
                    >
                      Đề bài toán
                    </button>
                    {generatedQuestion.explanation && (
                      <button
                        onClick={() => setActiveTab('explanation')}
                        className={`px-3 py-1 rounded-lg transition-all ${activeTab === 'explanation'
                            ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-xs'
                            : 'text-slate-500 hover:text-slate-800'
                          }`}
                      >
                        Lời giải chi tiết
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Render Tab Content */}
              <div className="prose prose-slate dark:prose-invert prose-sm max-w-none bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 min-h-[160px] max-h-[300px] overflow-y-auto">
                <ReactMarkdown
                  remarkPlugins={[remarkMath, remarkGfm]}
                  rehypePlugins={[rehypeRaw, [rehypeSanitize, sanitizeSchema], rehypeKatex]}
                  components={markdownComponents}
                >
                  {activeTab === 'explanation' && generatedQuestion.explanation
                    ? generatedQuestion.explanation
                    : generatedQuestion.content}
                </ReactMarkdown>
              </div>

              {/* Canvas Data Summary if available */}
              {generatedQuestion.canvasData?.elements && generatedQuestion.canvasData.elements.length > 0 && (
                <div className="mt-4 border border-indigo-100 dark:border-indigo-900/50 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
                  <div className="bg-indigo-50 dark:bg-indigo-950/40 p-2.5 border-b border-indigo-100 dark:border-indigo-900/50 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                      <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                        Hình vẽ minh họa Canvas ({generatedQuestion.canvasData.elements.length} phần tử)
                      </span>
                    </div>
                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 italic">
                      💡 Có thể dùng chuột kéo di chuyển các điểm để căn chỉnh
                    </span>
                  </div>
                  <div className="w-full">
                    <JsxGraphBoard
                      shapeCode="ai_preview"
                      jsxGraphData={generatedQuestion.canvasData}
                      width="100%"
                      height={300}
                      readOnly={false}
                      onChange={(updatedCanvasData) => {
                        setGeneratedQuestion(prev => prev ? { ...prev, canvasData: updatedCanvasData } : prev)
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900">
          {isLoading ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCancelJob}
                className="px-3.5 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-xl transition-colors cursor-pointer"
              >
                Dừng tác vụ
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
              >
                Chạy ngầm & Đóng
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
            >
              {generatedQuestion ? t('Đóng') : t('Hủy bỏ')}
            </button>
          )}

          {generatedQuestion && (
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => handleApply('replace')}
                className="flex items-center gap-2 px-4 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700/50 text-xs font-bold rounded-xl active:scale-98 transition-all cursor-pointer"
                title={t("Xóa nội dung cũ trong trình soạn thảo và thay bằng bài toán mới này")}
              >
                <Replace className="w-4 h-4" />
                {t("Thay thế bài tập hiện tại")}
              </button>

              <button
                type="button"
                onClick={() => handleApply('append')}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md hover:shadow-emerald-600/20 active:scale-98 transition-all cursor-pointer"
                title={t("Chèn thêm bài toán này nối tiếp dưới nội dung hiện tại")}
              >
                <PlusCircle className="w-4 h-4" />
                {t("Bổ sung vào bài tập")}
              </button>
            </div>
          )}
        </div>
      </div>

      <AiJobCancelConfirmDialog
        open={isCancelDialogOpen}
        status={jobStatus}
        reservedCredits={reservedCredits}
        hasResult={Boolean(generatedQuestion)}
        isCancelling={isCancelling}
        onClose={() => setIsCancelDialogOpen(false)}
        onConfirmCancel={executeCancelJob}
      />
    </div>
  )
}
