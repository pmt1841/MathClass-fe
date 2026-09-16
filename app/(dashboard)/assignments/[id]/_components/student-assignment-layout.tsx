'use client'

import React, { useState, useEffect, useRef } from 'react'
import { ArrowLeft, ChevronRight, Save, Send, Eye, XCircle, CheckCircle, Check, CircleDot, Edit3, X, Type, FileText, Sparkles, Lightbulb, Loader2, History, RotateCcw } from 'lucide-react'
import { useSubmissionHints } from '@/hooks/useSubmissionHints'
import { submissionService, SubmissionVersionResponse } from '@/services/submissionService'
import { useAiFeatures, AI_FEATURE_TASKS } from '@/hooks/useAiFeatures'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import remarkGfm from 'remark-gfm'
import rehypeKatex from 'rehype-katex'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize from 'rehype-sanitize'
import { sanitizeSchema } from '@/lib/markdown'
import { markdownComponents } from '@/components/ui/markdown-components'
import 'katex/dist/katex.min.css'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import TiptapEditor from '@/components/ui/tiptap'
import { markdownToHtml, normalizeLatexToMarkdown, separateAdjacentMath, extractDrawings, embedDrawings } from '@/lib/editor-utils'
import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSubmissionComments } from '@/hooks/useSubmissionComments'
import rehypeMarkComments from '@/lib/rehype-mark-comments'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CountdownTimer } from './countdown-timer'
import { formatDateTime, parseDateSafe } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

import { normalizeAiGeometryJson } from '@/lib/jsxgraph-utils'

const JsxGraphEditorModal = dynamic(() => import('@/components/ui/jsxgraph-editor-modal').then(mod => mod.JsxGraphEditorModal), { ssr: false })
const JsxGraphBoard = dynamic(() => import('@/components/ui/jsxgraph-board').then(mod => mod.JsxGraphBoard), { ssr: false })
const HandwritingSketchModal = dynamic(() => import('@/components/assignments/HandwritingSketchModal').then(mod => mod.HandwritingSketchModal), { ssr: false })

interface StudentAssignmentLayoutProps {
  assignment: any
  submissionId?: number | null
  onSubmissionCreated?: (id: number) => void
  submissionContent: string
  setSubmissionContent: (val: string) => void
  isReadOnly: boolean
  isSavingExternal: boolean
  lastSavedExternal: Date | null
  onSaveDraft: () => void
  onSubmit: () => void
  onUnsubmit: () => void
  isEditingResubmit?: boolean
  onStartResubmit?: () => void
  onCancelResubmit?: () => void
  onResubmit?: () => void
  allowResubmit?: boolean
  submissionStatus: 'DRAFT' | 'SUBMITTED' | 'GRADED' | 'LATE' | null
  submissionScore: number | null
  teacherFeedback: string
  onBack: () => void
  fromText: string
  onAutoSave: (content: string) => Promise<void>
}

export function StudentAssignmentLayout({
  assignment,
  submissionId,
  onSubmissionCreated,
  submissionContent,
  setSubmissionContent,
  isReadOnly,
  isSavingExternal,
  lastSavedExternal,
  onSaveDraft,
  onSubmit,
  onUnsubmit,
  isEditingResubmit = false,
  onStartResubmit,
  onCancelResubmit,
  onResubmit,
  allowResubmit = false,
  submissionStatus,
  submissionScore,
  teacherFeedback,
  onBack,
  fromText,
  onAutoSave
}: StudentAssignmentLayoutProps) {
  const [activeTab, setActiveTab] = useState<'ASSIGNMENT' | 'PREVIEW'>('ASSIGNMENT')
  const [showHintModal, setShowHintModal] = useState(false)
  const [showConfirmHintModal, setShowConfirmHintModal] = useState(false)
  const [showHandwritingModal, setShowHandwritingModal] = useState(false)

  // Danh sách các phiên bản bài nộp (Snapshots)
  const { data: versions = [] } = useQuery({
    queryKey: ['submission-versions', submissionId],
    queryFn: () => submissionService.getSubmissionVersions(submissionId || 0),
    enabled: !!submissionId,
  })

  const [selectedVersionNumber, setSelectedVersionNumber] = useState<number | null>(null)

  // Tự động chuyển về phiên bản mới nhất khi nộp bài lại hoặc khi số lượng version thay đổi
  useEffect(() => {
    setSelectedVersionNumber(null)
  }, [submissionStatus, isEditingResubmit, versions.length])

  const activeVersion = useMemo(() => {
    if (!versions || versions.length === 0) return null
    if (selectedVersionNumber === null) {
      return versions[versions.length - 1]
    }
    return versions.find(v => v.versionNumber === selectedVersionNumber) || versions[versions.length - 1]
  }, [versions, selectedVersionNumber])

  const isViewingOlderVersion = useMemo(() => {
    if (!versions || versions.length <= 1) return false
    if (selectedVersionNumber === null) return false
    return selectedVersionNumber !== versions[versions.length - 1].versionNumber
  }, [versions, selectedVersionNumber])

  const olderVersionData = useMemo(() => {
    if (!isViewingOlderVersion || !activeVersion) return null
    return extractDrawings(activeVersion.content || '')
  }, [isViewingOlderVersion, activeVersion])

  const effectiveScore = isViewingOlderVersion && activeVersion ? activeVersion.score : submissionScore
  const effectiveFeedback = isViewingOlderVersion && activeVersion ? (activeVersion.teacherFeedback || '') : teacherFeedback
  const effectiveIsReadOnly = isViewingOlderVersion || isReadOnly

  const { comments = [] } = useSubmissionComments(submissionId || 0, activeVersion?.versionNumber || null)
  // MAT-254: Chỉ hiển thị nút "Gợi ý AI" khi admin đã cấu hình + bật task STUDENT_HINT
  const { data: aiFeatures } = useAiFeatures()
  const studentHintEnabled = aiFeatures?.[AI_FEATURE_TASKS.STUDENT_HINT] === true
  const handwritingEnabled = aiFeatures?.[AI_FEATURE_TASKS.CANVAS_LATEX] === true

  const {
    hints,
    totalUsed,
    remainingHints,
    isLoading: isHintLoading,
    isRequesting: isHintRequesting,
    error: hintError,
    insufficientCredit: isHintInsufficientCredit,
    fetchHistory: fetchHintHistory,
    requestHint: executeRequestHint
  } = useSubmissionHints(submissionId, onSubmissionCreated)

  useEffect(() => {
    if (submissionId) {
      fetchHintHistory(submissionId)
    }
  }, [submissionId, fetchHintHistory])

  // Tự động chuyển sang tab XEM TRƯỚC BÀI LÀM khi bài đã có nhận xét hoặc đã chấm để học sinh thấy ngay các đoạn tô vàng
  useEffect(() => {
    if (submissionStatus === 'GRADED' || comments.length > 0) {
      setActiveTab('PREVIEW')
    }
  }, [submissionStatus, comments.length])

  const memoizedComponents = useMemo(() => ({
    ...markdownComponents,
    mark: ({ node, ...props }: any) => {
      const id = Number(props['data-comment-id'])
      const comment = comments.find((c: any) => c.id === id)
      if (!comment) return <mark {...props} />

      return (
        <Popover>
          <PopoverTrigger asChild>
            <mark
              {...props}
              className="bg-yellow-200 hover:bg-yellow-300 cursor-pointer transition-colors"
            />
          </PopoverTrigger>
          <PopoverContent className="w-80 p-4 shadow-xl z-[9999]">
            <div className="flex justify-between items-start mb-2 border-b pb-2">
              <div>
                <div className="font-semibold text-sm text-slate-800">{comment.teacherName}</div>
                <div className="text-[10px] text-slate-500">
                  {comment.createdAt && parseDateSafe(comment.createdAt) ? formatDateTime(parseDateSafe(comment.createdAt)!) : ''}
                </div>
              </div>
            </div>
            <div className="prose prose-slate prose-sm max-w-none mt-2">
              <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeRaw, [rehypeSanitize, sanitizeSchema], [rehypeKatex, katexConfig]]} components={markdownComponents}>
                {comment.content}
              </ReactMarkdown>
            </div>
          </PopoverContent>
        </Popover>
      )
    }
  }), [comments])

  const katexConfig = useMemo(() => ({
    throwOnError: false,
    errorColor: '#64748b',
    macros: { '\\placeholder': '\\square' }
  }), [])

  const submissionRehypePlugins = useMemo(() => [
    rehypeRaw,
    [rehypeSanitize, sanitizeSchema],
    [rehypeKatex, katexConfig],
    ...(comments.length > 0 ? [[rehypeMarkComments, { comments, activeCommentId: null }]] : [])
  ], [comments, katexConfig])

  const baseRehypePlugins = useMemo(() => [
    rehypeRaw,
    [rehypeSanitize, sanitizeSchema],
    [rehypeKatex, katexConfig]
  ], [katexConfig])

  const [studentDrawings, setStudentDrawings] = useState<any[]>([])
  const [editingShape, setEditingShape] = useState<{ shapeCode: string, jsxGraphData: any } | null>(null)
  const [showJsxGraphModal, setShowJsxGraphModal] = useState(false)
  const [debouncedContent, setDebouncedContent] = useState(submissionContent)
  const [editorInstance, setEditorInstance] = useState<any>(null)

  // Extract student drawings ONLY on first load if we have submissionContent
  const isLoaded = useRef(false)
  useEffect(() => {
    if (!isLoaded.current) {
      if (submissionContent) {
        const { content, extractedDrawings } = extractDrawings(submissionContent)
        setStudentDrawings(extractedDrawings || [])
        setDebouncedContent(content)
      } else {
        setStudentDrawings([])
        setDebouncedContent('')
      }
      isLoaded.current = true
    }
  }, [submissionContent])

  // Content without drawings appended
  const [pureContent, setPureContent] = useState(() => extractDrawings(submissionContent).content)

  // Debounce for preview
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedContent(pureContent)
    }, 300)
    return () => clearTimeout(timer)
  }, [pureContent])

  const displayPureContent = isViewingOlderVersion && olderVersionData ? olderVersionData.content : pureContent
  const displayDrawings = isViewingOlderVersion && olderVersionData ? olderVersionData.extractedDrawings : studentDrawings
  const displayPreviewContent = isViewingOlderVersion && olderVersionData ? olderVersionData.content : debouncedContent

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isDirtyRef = useRef(false)

  // Bubble up content with drawings to parent whenever it changes
  useEffect(() => {
    if (isLoaded.current && isDirtyRef.current) {
      const newFullContent = embedDrawings(pureContent, studentDrawings)
      setSubmissionContent(newFullContent)

      // Auto save after typing
      if (!isReadOnly && submissionStatus !== 'SUBMITTED' && onAutoSave) {
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
        saveTimeoutRef.current = setTimeout(() => {
          onAutoSave(newFullContent)
          isDirtyRef.current = false
        }, 5000)
      } else if (isReadOnly || submissionStatus === 'SUBMITTED') {
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current)
          saveTimeoutRef.current = null
        }
      }
    }
  }, [pureContent, studentDrawings, isReadOnly, submissionStatus])

  const handleContentChange = (newVal: string) => {
    isDirtyRef.current = true
    setPureContent(newVal)
  }

  const handleInsertHandwritingContent = (rawText: string) => {
    isDirtyRef.current = true
    if (!rawText) return

    // Chuẩn hóa mọi định dạng AI / LaTeX thành Markdown chuẩn (text tiếng Việt thường + toán $...$)
    const normalizedMd = normalizeLatexToMarkdown(rawText)

    if (editorInstance) {
      const htmlToInsert = markdownToHtml(normalizedMd)
      editorInstance.commands.insertContent(htmlToInsert)
    } else {
      setPureContent(prev => prev ? `${prev}\n\n${normalizedMd}` : normalizedMd)
    }
  }

  const handleInsertLatex = (latexCommand: string) => {
    isDirtyRef.current = true
    if (editorInstance) {
      editorInstance.chain().focus().insertContent({
        type: 'mathInline',
        attrs: {
          latex: latexCommand,
          displayMode: false,
        }
      }).run()
    } else {
      setPureContent(prev => prev + ` $${latexCommand}$ `)
    }
  }

  const handleConfirmJsxGraph = (jsxGraphData: any) => {
    isDirtyRef.current = true
    if (editingShape) {
      const updatedDrawings = studentDrawings.map(d =>
        d.shapeCode === editingShape.shapeCode ? { ...d, jsxGraphData } : d
      )
      setStudentDrawings(updatedDrawings)
    } else {
      const existingIndices = studentDrawings
        .map(d => parseInt(d.shapeCode.replace('SHAPE_', '')))
        .filter(n => !isNaN(n))

      let nextIndex = 1
      while (existingIndices.includes(nextIndex)) {
        nextIndex++
      }

      const shapeCode = `SHAPE_${nextIndex}`
      const newDrawing = { shapeCode, jsxGraphData }
      setStudentDrawings(prev => [...prev, newDrawing])

      if (editorInstance) {
        editorInstance.chain().focus().insertContent(`\n\n[${shapeCode}]\n\n`).run()
      } else {
        setPureContent(pureContent + `\n[${shapeCode}]`)
      }
    }

    setShowJsxGraphModal(false)
    setEditingShape(null)
  }

  const handleEditDrawing = (shapeCode: string) => {
    const drawing = studentDrawings.find(d => d.shapeCode === shapeCode)
    if (drawing) {
      setEditingShape({ shapeCode: drawing.shapeCode, jsxGraphData: drawing.jsxGraphData })
      setShowJsxGraphModal(true)
    }
  }

  const handleDeleteDrawing = (shapeCode: string) => {
    isDirtyRef.current = true
    setStudentDrawings(prev => prev.filter(d => d.shapeCode !== shapeCode))
    const newVal = pureContent.replace(new RegExp(`\\[${shapeCode}\\]`, 'g'), '')
    setPureContent(newVal)
    if (editorInstance) {
      // also remove from editor content if present
      const currentHtml = editorInstance.getHTML()
      const updatedHtml = currentHtml.replace(new RegExp(`\\[${shapeCode}\\]`, 'g'), '')
      if (currentHtml !== updatedHtml) {
        editorInstance.commands.setContent(updatedHtml)
      }
    }
  }

  const handleInsertDrawing = (shapeCode: string) => {
    isDirtyRef.current = true
    if (editorInstance) {
      editorInstance.chain().focus().insertContent(` [${shapeCode}] `).run()
    } else {
      setPureContent(prev => prev + `\n[${shapeCode}]`)
    }
  }

  const renderContentWithDrawings = (rawContent: string, drawingList: any[], isSubmission: boolean = false) => {
    if (!rawContent) return null

    const normalizedContent = separateAdjacentMath(rawContent)
    // We already passed pureContent, so it shouldn't have JSON embedded. 
    // Just replace tags.
    const parts = normalizedContent.split(/(\[SHAPE_[a-zA-Z0-9_]+(?:\|[^\]]*)?\]|\[IMAGE_[a-zA-Z0-9_]+(?:\|[^\]]*)?\])/g)

    return parts.map((part, index) => {
      const match = part.match(/^\[(SHAPE_[a-zA-Z0-9_]+)(?:\|([^\]]+))?\]$/)
      if (match) {
        const shapeCode = match[1]
        const drawing = drawingList.find(d => d.shapeCode === shapeCode)
        if (drawing) {
          let width: string | number = '100%'
          let height: string | number = 300
          if (match[2]) {
            const [w, h] = match[2].split('x')
            if (w) width = isNaN(Number(w)) ? w : Number(w)
            if (h) height = isNaN(Number(h)) ? h : Number(h)
          }
          return <JsxGraphBoard key={index} shapeCode={shapeCode} jsxGraphData={drawing.jsxGraphData} width={width} height={height} />
        }
      }

      const imageMatch = part.match(/^\[(IMAGE_[a-zA-Z0-9_]+)(?:\|([^\]]+))?\]$/)
      if (imageMatch) {
        const imageCode = imageMatch[1]
        const image = assignment.images?.find((img: any) => img.imageCode === `[${imageCode}]`)
        if (image) {
          let width: string | number = 'auto'
          let height: string | number = 'auto'
          if (imageMatch[2]) {
            const [w, h] = imageMatch[2].split('x')
            if (w) width = isNaN(Number(w)) ? w : Number(w)
            if (h) height = isNaN(Number(h)) ? h : Number(h)
          }
          // eslint-disable-next-line @next/next/no-img-element
          return <img key={index} src={image.imageUrl} alt="Assignment image" className="max-w-full rounded-lg my-4 shadow-sm border border-slate-200" style={{ width, height }} />
        }
      }

      return (
        <ReactMarkdown
          key={index}
          remarkPlugins={[remarkMath, remarkGfm]}
          rehypePlugins={(isSubmission ? submissionRehypePlugins : baseRehypePlugins) as any}
          components={isSubmission ? memoizedComponents : markdownComponents}
        >
          {part}
        </ReactMarkdown>
      )
    })
  }

  const searchParams = useSearchParams()
  const classCodeUrl = searchParams.get('classCode') || ''

  const isPastDeadline = assignment.deadline ? Date.now() > (parseDateSafe(assignment.deadline)?.getTime() ?? Infinity) : false
  const isGraded = submissionScore !== null

  return (
    <div className="fixed inset-0 z-50 bg-slate-100 flex flex-col overflow-hidden">
      {/* TOOLBAR */}
      <div className="h-14 bg-white border-b border-border px-3 sm:px-4 flex items-center justify-between gap-2 sm:gap-3 shrink-0 shadow-sm z-10">
        {/* Left: Back button & Breadcrumb */}
        <div className="flex items-center gap-2 min-w-0 flex-shrink">
          <button
            onClick={onBack}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 border border-slate-200 text-slate-600 hover:bg-white hover:border-slate-300 hover:shadow-sm hover:text-slate-900 transition-all shrink-0"
            title="Quay lại"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="hidden md:flex items-center gap-1.5 text-sm text-slate-500 font-medium truncate min-w-0">
            <span className="hover:text-slate-800 transition-colors cursor-pointer shrink-0 truncate max-w-[120px] 2xl:max-w-[180px]" onClick={onBack} title={fromText}>
              {fromText}
            </span>
            <ChevronRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span className="text-slate-900 truncate max-w-[100px] lg:max-w-[160px] xl:max-w-[220px] 2xl:max-w-[320px]" title={assignment.title}>
              {assignment.title}
            </span>
          </div>
        </div>

        {/* Center: Sheet Siblings & Countdown Timer */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Nav Buttons for Sheet */}
          {assignment.sheetSiblings && assignment.sheetSiblings.length > 0 && (
            <div className="flex items-center gap-1">
              {assignment.sheetSiblings.map((sibling: any, idx: number) => {
                const isActive = sibling.id === assignment.id
                const isSubmitted = isActive
                  ? (submissionStatus === 'SUBMITTED' || submissionStatus === 'GRADED')
                  : (sibling.submissionStatus === 'SUBMITTED' || sibling.submissionStatus === 'GRADED')

                return (
                  <Link
                    key={sibling.id}
                    replace
                    href={`/assignments/${sibling.id}?classCode=${classCodeUrl}&from=${searchParams.get('from') || 'class'}`}
                    className={`
                      w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-md text-xs sm:text-sm font-bold transition-all shadow-xs shrink-0
                      ${isActive
                        ? isSubmitted
                          ? 'ring-2 ring-emerald-500 ring-offset-1 bg-emerald-600 text-white'
                          : 'ring-2 ring-primary ring-offset-1 bg-primary text-white'
                        : isSubmitted
                          ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border border-emerald-200'
                          : 'bg-slate-50 text-slate-600 hover:bg-slate-200 border border-slate-200'}
                    `}
                    title={sibling.title}
                  >
                    {idx + 1}
                  </Link>
                )
              })}
            </div>
          )}

          {assignment.deadline && !isGraded && (
            <div className="shrink-0">
              <CountdownTimer deadline={assignment.deadline} />
            </div>
          )}
        </div>

        {/* Right Section: AutoSave, Version Switcher, Score, Hints, Actions */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {isSavingExternal ? (
            <span className="hidden xl:flex items-center gap-1.5 text-xs text-amber-600 font-medium whitespace-nowrap">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
              <span>Đang lưu...</span>
            </span>
          ) : lastSavedExternal ? (
            <span className="hidden xl:flex items-center gap-1.5 text-xs text-emerald-600 font-medium whitespace-nowrap" title={`Đã lưu tự động (${formatDateTime(lastSavedExternal)})`}>
              <Check className="h-3 w-3" />
              <span className="hidden 2xl:inline">Đã lưu ({formatDateTime(lastSavedExternal)})</span>
              <span className="2xl:hidden">Đã lưu</span>
            </span>
          ) : null}

          {/* Version Switcher */}
          {versions.length > 1 && (
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0">
              <span className="text-[11px] font-bold text-slate-500 px-1.5 sm:px-2 flex items-center gap-1 whitespace-nowrap">
                <History className="w-3.5 h-3.5 text-slate-400" />
                <span className="hidden sm:inline">Lần nộp:</span>
              </span>
              {versions.map((ver, idx) => {
                const isLatest = idx === versions.length - 1
                const isSelected = selectedVersionNumber === ver.versionNumber || (selectedVersionNumber === null && isLatest)

                return (
                  <button
                    key={ver.id || ver.versionNumber}
                    type="button"
                    onClick={() => {
                      if (isEditingResubmit) {
                        onCancelResubmit?.()
                      }
                      setSelectedVersionNumber(ver.versionNumber)
                    }}
                    className={`px-2 sm:px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                      isSelected
                        ? 'bg-white text-primary shadow-xs font-bold border border-slate-200/80'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                    }`}
                    title={ver.submittedAt ? `Lần ${ver.versionNumber} - Nộp lúc ${formatDateTime(parseDateSafe(ver.submittedAt)!)}` : undefined}
                  >
                    Lần {ver.versionNumber} {isLatest ? <span className="hidden 2xl:inline">(Mới nhất)</span> : ''}
                  </button>
                )
              })}
            </div>
          )}

          {effectiveScore !== null && effectiveScore !== undefined && (
            <span className="text-xs sm:text-sm font-semibold text-emerald-700 bg-emerald-100 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-emerald-200 whitespace-nowrap shrink-0">
              <span className="hidden sm:inline">Điểm của bạn: </span>
              <span className="sm:hidden">Điểm: </span>
              {effectiveScore}
            </span>
          )}

          {/* Nút Gợi ý AI: Bấm để xin gợi ý mới (nếu chưa nộp) hoặc xem lại lịch sử (nếu đã nộp / hết lượt).
              MAT-254: Ẩn nút khi admin chưa bật task STUDENT_HINT (fail-closed). */}
          {studentHintEnabled && (
            <button
              type="button"
              onClick={() => {
                const canRequestNewHint = !isPastDeadline && !isGraded && submissionStatus !== 'SUBMITTED' && remainingHints > 0
                if (canRequestNewHint && !isHintRequesting) {
                  setShowConfirmHintModal(true)
                } else {
                  setShowHintModal(true)
                }
              }}
              disabled={isHintRequesting}
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold rounded-lg shadow-sm transition-all border bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 active:scale-95 disabled:opacity-50 shrink-0 whitespace-nowrap"
              title={
                submissionStatus === 'SUBMITTED' || isGraded || isPastDeadline
                  ? 'Xem lại lịch sử gợi ý AI đã dùng'
                  : remainingHints <= 0
                    ? 'Đã dùng hết 3/3 lượt gợi ý (bấm để xem lại lịch sử)'
                    : 'Bấm để nhận gợi ý tư duy cho bước tiếp theo'
              }
            >
              {isHintRequesting ? (
                <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
              ) : (
                <Lightbulb className="w-4 h-4 text-amber-500" />
              )}
              <span>{submissionStatus === 'SUBMITTED' || isGraded || isPastDeadline ? 'Gợi ý AI' : 'Cần gợi ý'}</span>
              <span className="ml-0.5 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-amber-200/60 text-amber-800">
                {totalUsed}/3
              </span>
            </button>
          )}

          {!isPastDeadline && !isViewingOlderVersion && (
            <>
              {isEditingResubmit ? (
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={onCancelResubmit}
                    disabled={isSavingExternal}
                    className="flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 sm:py-2 bg-slate-100 text-slate-700 text-xs sm:text-sm font-semibold rounded-lg hover:bg-slate-200 shadow-sm transition-all disabled:opacity-50 shrink-0 whitespace-nowrap"
                  >
                    <X className="w-4 h-4" />
                    Hủy sửa
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (saveTimeoutRef.current) {
                        clearTimeout(saveTimeoutRef.current)
                        saveTimeoutRef.current = null
                      }
                      isDirtyRef.current = false
                      const latestFullContent = embedDrawings(pureContent, studentDrawings)
                      setSubmissionContent(latestFullContent)
                      onResubmit?.()
                    }}
                    disabled={isSavingExternal}
                    className="flex items-center gap-2 px-3.5 sm:px-4 py-1.5 sm:py-2 bg-primary text-white text-xs sm:text-sm font-semibold rounded-lg hover:bg-primary/90 shadow-sm active:scale-95 transition-all disabled:opacity-50 shrink-0 whitespace-nowrap"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Nộp lại bài (Lần {versions.length + 1}/3)
                  </button>
                </div>
              ) : (
                <>
                  {allowResubmit && (isGraded || submissionStatus === 'SUBMITTED') && (
                    versions.length >= 3 ? (
                      <span className="flex items-center gap-1.5 px-3 py-1.5 sm:py-2 bg-slate-100 text-slate-500 text-xs sm:text-sm font-semibold rounded-lg border border-slate-200 shrink-0 whitespace-nowrap" title="Bạn đã sử dụng hết tối đa 3 lần nộp bài">
                        <RotateCcw className="w-4 h-4" />
                        Đã hết lượt làm lại (3/3)
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={onStartResubmit}
                        className="flex items-center gap-2 px-3.5 py-1.5 sm:py-2 bg-primary text-white text-xs sm:text-sm font-semibold rounded-lg hover:bg-primary/90 shadow-sm active:scale-95 transition-all shrink-0 whitespace-nowrap"
                      >
                        <RotateCcw className="w-4 h-4" />
                        Làm lại bài ({versions.length}/3)
                      </button>
                    )
                  )}

                  {!isGraded && submissionStatus !== 'SUBMITTED' && (
                    <button
                      onClick={() => {
                        if (saveTimeoutRef.current) {
                          clearTimeout(saveTimeoutRef.current)
                          saveTimeoutRef.current = null
                        }
                        isDirtyRef.current = false
                        const latestFullContent = embedDrawings(pureContent, studentDrawings)
                        setSubmissionContent(latestFullContent)
                        onSubmit()
                      }}
                      disabled={isSavingExternal}
                      className="flex items-center gap-2 px-4 py-1.5 sm:py-2 bg-emerald-600 text-white text-xs sm:text-sm font-semibold rounded-lg hover:bg-emerald-700 shadow-sm active:scale-95 transition-all disabled:opacity-50 shrink-0 whitespace-nowrap"
                    >
                      <Send className="w-4 h-4" />
                      Nộp bài
                    </button>
                  )}
                </>
              )}
            </>
          )}

          {isPastDeadline && !isGraded && (
            <span className="text-sm font-medium text-rose-600 bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-100">
              Đã hết hạn nộp bài
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 min-h-0 flex flex-col p-2 sm:p-4 gap-4">
        {/* ROW 1: Title and Description (Read-Only) */}
        <div className="flex flex-col gap-2 bg-white p-5 rounded-2xl border border-border shadow-sm shrink-0">
          <h1 className="text-xl font-bold text-slate-900 leading-tight">
            {assignment.title}
          </h1>
          {assignment.description && (
            <p className="text-sm text-slate-600 leading-relaxed">
              {assignment.description}
            </p>
          )}
          {effectiveFeedback && (
            <div className="mt-2 bg-sky-50 border border-sky-200 p-3 rounded-lg">
              <h4 className="text-sky-800 font-semibold mb-1 flex items-center gap-2 text-sm">
                <span className="w-4 h-4 rounded-full bg-sky-200 flex items-center justify-center text-sky-800 text-[10px]">i</span>
                Nhận xét từ giáo viên {isViewingOlderVersion && activeVersion ? `(Lần nộp ${activeVersion.versionNumber})` : ''}
              </h4>
              <div className="prose prose-slate prose-sm max-w-none text-sky-900">
                <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeRaw, [rehypeSanitize, sanitizeSchema], rehypeKatex]} components={markdownComponents}>
                  {effectiveFeedback}
                </ReactMarkdown>
              </div>
            </div>
          )}
        </div>

        {/* Older version banner */}
        {isViewingOlderVersion && activeVersion && (
          <div className="bg-amber-50 border border-amber-200 px-4 py-2.5 rounded-xl text-xs text-amber-800 flex items-center justify-between shrink-0 shadow-xs">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                Đang xem lịch sử <strong>Lần nộp {activeVersion.versionNumber}</strong> (Đã chấm: <strong>{activeVersion.score !== null && activeVersion.score !== undefined ? `${activeVersion.score} điểm` : 'Chưa chấm'}</strong>).
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedVersionNumber(null)}
              className="text-xs font-bold text-amber-900 hover:underline cursor-pointer ml-2"
            >
              Xem lần nộp mới nhất
            </button>
          </div>
        )}

        {/* ROW 2: Editor and Preview Split */}
        <div className="flex-1 min-h-0 relative">
          <PanelGroup direction="horizontal" className="h-full w-full">

            {/* EDITOR */}
            <Panel defaultSize={50} minSize={20} className={`bg-white rounded-2xl border shadow-sm flex flex-col overflow-hidden mr-2 focus-within:ring-2 focus-within:ring-primary/15 transition-all ${effectiveIsReadOnly ? 'bg-slate-50 opacity-90 border-slate-200' : 'border-border focus-within:border-primary'}`}>
              <div className="bg-slate-50 px-4 py-2 border-b border-border text-xs font-semibold text-slate-600 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <Edit3 className="w-3.5 h-3.5" /> Bài làm của bạn {isViewingOlderVersion && activeVersion ? `(Lần nộp ${activeVersion.versionNumber})` : ''}
                </div>
                {!effectiveIsReadOnly && (
                  <div className="flex items-center gap-2">
                    {handwritingEnabled && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setShowHandwritingModal(true);
                        }}
                        className="px-3 py-1.5 bg-purple-50 text-purple-700 rounded flex items-center gap-1.5 hover:bg-purple-100 transition-colors shadow-sm border border-purple-200"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                        Vẽ tự do / Tải ảnh chữ viết
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setEditingShape(null);
                        setShowJsxGraphModal(true);
                      }}
                      className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded flex items-center gap-1.5 hover:bg-blue-100 transition-colors shadow-sm border border-blue-200"
                    >
                      <CircleDot className="w-3.5 h-3.5" />
                      Thêm hình vẽ và đồ thị
                    </button>
                  </div>
                )}
              </div>

              {/* Danh sách hình vẽ của học sinh */}
              {displayDrawings.length > 0 && (
                <div className="bg-slate-50 border-b border-border px-4 py-2 flex flex-wrap gap-2 items-center shrink-0">
                  <span className="text-xs font-semibold text-slate-500 mr-1">Hình vẽ của bạn:</span>
                  {displayDrawings.map(d => (
                    <div key={d.shapeCode} className="flex items-center gap-1 bg-white border border-slate-200 shadow-sm rounded-md overflow-hidden group">
                      <button
                        type="button"
                        onClick={() => handleInsertDrawing(d.shapeCode)}
                        className="px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors"
                        title={`Chèn ${d.shapeCode} vào văn bản`}
                        disabled={effectiveIsReadOnly}
                      >
                        {d.shapeCode}
                      </button>
                      {!effectiveIsReadOnly && (
                        <>
                          <div className="w-px h-4 bg-slate-200"></div>
                          <button
                            type="button"
                            onClick={() => handleEditDrawing(d.shapeCode)}
                            className="px-1.5 py-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            title="Sửa hình vẽ"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteDrawing(d.shapeCode)}
                            className="px-1.5 py-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Xoá hình vẽ"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="flex-1 flex flex-col min-h-0 relative p-2 sm:p-3 overflow-hidden">
                <TiptapEditor
                  value={displayPureContent || ''}
                  onChange={handleContentChange}
                  onReady={(editor) => setEditorInstance(editor)}
                  readOnly={effectiveIsReadOnly}
                  placeholder={effectiveIsReadOnly ? "Bài nộp đã khóa." : "Nhập bài làm của bạn tại đây... Soạn thảo toán học trực quan (click 'Hiện bảng công thức Toán' để chèn công thức nhanh)..."}
                />
              </div>
            </Panel>

            <PanelResizeHandle className="w-2 mx-1 rounded-full bg-slate-200 hover:bg-primary/50 transition-colors cursor-col-resize flex flex-col items-center justify-center gap-1">
              <div className="w-1 h-1 rounded-full bg-slate-400" />
              <div className="w-1 h-1 rounded-full bg-slate-400" />
              <div className="w-1 h-1 rounded-full bg-slate-400" />
            </PanelResizeHandle>

            {/* PREVIEW & ASSIGNMENT TABS */}
            <Panel defaultSize={50} minSize={20} className="bg-white rounded-2xl border border-border shadow-sm flex flex-col overflow-hidden ml-2">
              <div className="flex items-center border-b border-border bg-slate-50 shrink-0">
                <button
                  onClick={() => setActiveTab('ASSIGNMENT')}
                  className={`flex items-center gap-2 px-5 py-3 text-xs font-semibold transition-colors border-b-2 ${activeTab === 'ASSIGNMENT'
                    ? 'border-primary text-primary bg-white'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100/50'
                    }`}
                >
                  <FileText className="w-3.5 h-3.5" /> ĐỀ BÀI
                </button>
                <button
                  onClick={() => setActiveTab('PREVIEW')}
                  className={`flex items-center gap-2 px-5 py-3 text-xs font-semibold transition-colors border-b-2 ${activeTab === 'PREVIEW'
                    ? 'border-primary text-primary bg-white'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100/50'
                    }`}
                >
                  <Eye className="w-3.5 h-3.5" /> XEM TRƯỚC BÀI LÀM
                  {comments.length > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                      {comments.length} nhận xét
                    </span>
                  )}
                </button>
              </div>

              <div className="flex-1 w-full p-6 prose prose-slate prose-sm max-w-none overflow-y-auto">
                {activeTab === 'ASSIGNMENT' ? (
                  <>
                    {(() => {
                      if (!assignment.content) return "Không có nội dung chi tiết."
                      const { content, extractedDrawings } = extractDrawings(assignment.content)
                      return renderContentWithDrawings(content, extractedDrawings, false)
                    })()}
                  </>
                ) : (
                  <>
                    {displayPreviewContent ? (
                      renderContentWithDrawings(displayPreviewContent, displayDrawings, true)
                    ) : (
                      <p className="text-muted-foreground italic text-sm mt-0">Bài làm của bạn sẽ hiển thị ở đây...</p>
                    )}
                  </>
                )}
              </div>
            </Panel>

          </PanelGroup>
        </div>
      </div>

      <JsxGraphEditorModal
        open={showJsxGraphModal}
        onClose={() => {
          setShowJsxGraphModal(false)
          setEditingShape(null)
        }}
        onConfirm={handleConfirmJsxGraph}
        initialData={editingShape?.jsxGraphData}
      />

      {/* AI HINT MODAL — MAT-254: chỉ hiển thị khi admin bật task STUDENT_HINT */}
      {studentHintEnabled && (
        <Dialog open={showHintModal} onOpenChange={setShowHintModal}>
          <DialogContent className="max-w-2xl max-h-[85vh] p-0 flex flex-col overflow-hidden border-slate-200 shadow-2xl rounded-2xl">
            {/* Modal Header */}
            <DialogHeader className="px-6 py-4 bg-gradient-to-r from-amber-500 to-amber-600 text-white flex flex-row items-center justify-between shrink-0 space-y-0">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-5 h-5 text-amber-200 animate-pulse" />
                <DialogTitle className="text-lg font-bold text-white">Trợ lý Gợi ý Tư duy AI</DialogTitle>
                <span className="bg-amber-700/60 px-2.5 py-0.5 rounded-full text-xs font-semibold text-amber-100">
                  Đã dùng {totalUsed}/3 gợi ý
                </span>
              </div>
              <DialogDescription className="sr-only">Lịch sử và danh sách các gợi ý tư duy AI cho bài tập</DialogDescription>
            </DialogHeader>

            {/* Modal Content */}
            <div className="p-6 flex-1 overflow-y-auto space-y-4">
              {hintError &&
                (isHintInsufficientCredit ? (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-3">
                    <p className="text-sm font-medium text-amber-800">
                      Bạn đã dùng hết credit AI trong ngày. Vui lòng mua thêm credit để tiếp tục sử dụng tính năng gợi ý.
                    </p>
                    <Link href="/credits" passHref>
                      <Button size="sm" className="bg-amber-600 text-white hover:bg-amber-700">
                        <Sparkles className="mr-1.5 h-4 w-4" />
                        Mua thêm credit
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700 font-medium">
                    {hintError}
                  </div>
                ))}

              {isHintRequesting && (
                <div className="p-6 bg-amber-50/50 border border-amber-200 rounded-xl flex items-center gap-3 text-amber-800 animate-pulse">
                  <Loader2 className="w-5 h-5 animate-spin text-amber-600 shrink-0" />
                  <div className="text-sm font-medium">
                    AI đang đọc đề bài và tiến độ làm bài của bạn để soạn gợi ý bước tiếp theo...
                  </div>
                </div>
              )}

              {hints.length === 0 && !isHintRequesting && !isHintLoading && (
                <div className="py-10 text-center text-slate-500 space-y-2">
                  <Lightbulb className="w-10 h-10 mx-auto text-slate-300" />
                  <p className="text-sm font-medium">Bạn chưa sử dụng lượt gợi ý nào cho bài tập này.</p>
                </div>
              )}

              {hints.map((h, idx) => (
                <div key={h.id || idx} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2.5 py-1 rounded-md">
                      Gợi ý #{h.hintNumber}
                    </span>
                    {h.createdAt && (
                      <span className="text-[11px] text-slate-400 font-mono">
                        {formatDateTime(parseDateSafe(h.createdAt) || new Date())}
                      </span>
                    )}
                  </div>
                  <div className="prose prose-slate prose-sm max-w-none text-slate-800 leading-relaxed">
                    <ReactMarkdown
                      remarkPlugins={[remarkMath, remarkGfm]}
                      rehypePlugins={[rehypeRaw, [rehypeSanitize, sanitizeSchema], rehypeKatex]}
                      components={markdownComponents}
                    >
                      {h.aiHintContent}
                    </ReactMarkdown>
                  </div>
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <DialogFooter className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex flex-row items-center justify-between shrink-0">
              <span className="text-xs text-slate-500 font-medium">
                Gợi ý chỉ hỗ trợ hướng tư duy, không cho đáp số trực tiếp.
              </span>
              <div className="flex items-center gap-3">
                {!isPastDeadline && !isGraded && submissionStatus !== 'SUBMITTED' && remainingHints > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowHintModal(false)
                      setShowConfirmHintModal(true)
                    }}
                    className="px-3 py-2 bg-amber-600 text-white text-xs font-semibold rounded-lg hover:bg-amber-700 transition-colors flex items-center gap-1.5 shadow-sm active:scale-95"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                    <span>Xin lượt gợi ý #{totalUsed + 1}</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowHintModal(false)}
                  className="px-4 py-2 bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-300 transition-colors"
                >
                  Đóng
                </button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal Xác nhận Xin Gợi ý AI — MAT-254: chỉ hiển thị khi admin bật task STUDENT_HINT */}
      {studentHintEnabled && (
        <Dialog open={showConfirmHintModal} onOpenChange={setShowConfirmHintModal}>
          <DialogContent className="max-w-md p-6 space-y-5 rounded-2xl border-slate-100 shadow-2xl">
            <DialogHeader className="p-0 space-y-0 text-left">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                  <Lightbulb className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <DialogTitle className="text-base font-bold text-slate-800">Xác nhận xin Gợi ý Tư duy AI</DialogTitle>
                  <span className="text-xs font-semibold text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full inline-block mt-0.5">
                    Lượt {totalUsed + 1}/3
                  </span>
                </div>
              </div>
              <DialogDescription className="sr-only">Xác nhận gửi yêu cầu xin gợi ý từ AI</DialogDescription>
            </DialogHeader>

            <div className="space-y-3 text-sm text-slate-600">
              <p>
                Bạn sắp sử dụng lượt gợi ý tư duy lần thứ <strong className="text-amber-800 font-bold">{totalUsed + 1}</strong> (còn lại {remainingHints} lượt).
              </p>

              {remainingHints === 1 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs font-semibold flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Đây là lượt gợi ý cuối cùng cho bài tập này!</span>
                </div>
              )}

              <p className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-200/80 leading-relaxed">
                AI sẽ đọc tiến độ bài làm hiện tại của bạn để đưa ra gợi ý tư duy cho bước tiếp theo. Bạn đã sẵn sàng chưa?
              </p>
            </div>

            <DialogFooter className="p-0 flex flex-row items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmHintModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
              >
                Để mình thử lại
              </button>
              <button
                type="button"
                onClick={async () => {
                  setShowConfirmHintModal(false)
                  setShowHintModal(true)
                  const latestFullContent = embedDrawings(pureContent, studentDrawings)
                  await executeRequestHint(assignment.id, latestFullContent)
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 rounded-lg hover:bg-amber-700 shadow-sm transition-all flex items-center gap-1.5 active:scale-95"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                <span>Nhận gợi ý ngay</span>
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {showHandwritingModal && (
        <HandwritingSketchModal
          isOpen={showHandwritingModal}
          onClose={() => setShowHandwritingModal(false)}
          onInsertLatex={(latex) => {
            handleInsertHandwritingContent(latex)
          }}
          onInsertGeometry={(geometryJson) => {
            try {
              const parsed = JSON.parse(geometryJson)
              const normalized = normalizeAiGeometryJson(parsed)
              handleConfirmJsxGraph(normalized)
            } catch {
              handleInsertLatex(`\n\`\`\`json\n${geometryJson}\n\`\`\`\n`)
            }
          }}
        />
      )}
    </div>
  )
}
