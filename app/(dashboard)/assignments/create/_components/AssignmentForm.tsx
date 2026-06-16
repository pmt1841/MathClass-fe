'use client'

import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import { Save, Send, Eye, Edit3, ArrowLeft, ChevronRight, Check, CircleDot } from 'lucide-react'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import { useRouter } from 'next/navigation'
import { LatexToolbar } from '@/components/ui/latex-toolbar'
import dynamic from 'next/dynamic'

export const embedDrawings = (content: string, drawings: any[]) => {
  if (!drawings || drawings.length === 0) return content
  let newContent = content.replace(/\n\n<!-- DRAWINGS_DATA_START[\s\S]*?DRAWINGS_DATA_END -->/g, '')
  newContent += `\n\n<!-- DRAWINGS_DATA_START\n${JSON.stringify(drawings)}\nDRAWINGS_DATA_END -->`
  return newContent
}

export const extractDrawings = (content: string) => {
  if (!content) return { content: '', extractedDrawings: [] }
  let extractedDrawings: any[] = []
  let newContent = content
  const match = content.match(/<!-- DRAWINGS_DATA_START\n([\s\S]*?)\nDRAWINGS_DATA_END -->/)
  if (match) {
    try {
      extractedDrawings = JSON.parse(match[1])
      newContent = content.replace(/\n\n<!-- DRAWINGS_DATA_START[\s\S]*?DRAWINGS_DATA_END -->/g, '')
    } catch (e) {
      console.error("Failed to parse drawings", e)
    }
  }
  return { content: newContent, extractedDrawings }
}

const JsxGraphEditorModal = dynamic(() => import('@/components/ui/jsxgraph-editor-modal').then(mod => mod.JsxGraphEditorModal), { ssr: false })
const JsxGraphBoard = dynamic(() => import('@/components/ui/jsxgraph-board').then(mod => mod.JsxGraphBoard), { ssr: false })

const assignmentSchema = z.object({
  title: z.string().min(1, 'Tiêu đề bài tập không được để trống'),
  description: z.string().min(1, 'Mô tả bài tập không được để trống'),
  content: z.string().min(1, 'Nội dung bài tập không được để trống'),
  drawings: z.array(z.any()).optional()
})

export type AssignmentFormValues = z.infer<typeof assignmentSchema>

interface AssignmentFormProps {
  pageTitle: string
  backHref: string
  backText: string
  onSubmitDraft: (data: AssignmentFormValues) => void
  onPublishClick?: (data: AssignmentFormValues) => void
  isSubmitting?: boolean
  defaultValues?: AssignmentFormValues
  submitDraftText?: string
  assignmentId?: string
  onAutoSave?: (data: AssignmentFormValues) => Promise<void>
}

export function AssignmentForm({
  pageTitle,
  backHref,
  backText,
  onSubmitDraft,
  onPublishClick,
  isSubmitting,
  defaultValues,
  submitDraftText = 'Lưu nháp',
  assignmentId,
  onAutoSave
}: AssignmentFormProps) {
  const router = useRouter()
  const [showLeaveModal, setShowLeaveModal] = useState(false)
  
  const [isAutoSaving, setIsAutoSaving] = useState(false)
  const [lastSavedTime, setLastSavedTime] = useState<Date | null>(null)
  const saveTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)
  const isFormLoadedRef = React.useRef(false)

  // JSXGraph State
  const [showJsxGraphModal, setShowJsxGraphModal] = useState(false)
  const [drawings, setDrawings] = useState<any[]>(defaultValues?.drawings || [])

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors }
  } = useForm<AssignmentFormValues>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: defaultValues || {
      title: '',
      description: '',
      content: '',
      drawings: []
    },
    mode: 'onChange'
  })

  useEffect(() => {
    let mergedValues = defaultValues || { title: '', description: '', content: '', drawings: [] }
    if (mergedValues.content) {
      const { content, extractedDrawings } = extractDrawings(mergedValues.content)
      mergedValues = { ...mergedValues, content }
      if (!mergedValues.drawings || mergedValues.drawings.length === 0) {
        mergedValues.drawings = extractedDrawings
      }
    }
    reset(mergedValues)
    if (mergedValues.drawings) {
      setDrawings(mergedValues.drawings)
    }
    
    // Allow a small delay before enabling auto-save to avoid saving empty/initial values immediately
    setTimeout(() => {
      isFormLoadedRef.current = true
    }, 500)
  }, [defaultValues, reset])

  const formValues = watch()

  // Auto save to database
  useEffect(() => {
    if (!isFormLoadedRef.current || !onAutoSave) return
    if (!formValues.title && !formValues.description && !formValues.content) return

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)

    saveTimeoutRef.current = setTimeout(async () => {
      setIsAutoSaving(true)
      try {
        await onAutoSave({ ...formValues, content: embedDrawings(formValues.content, drawings) })
        setLastSavedTime(new Date())
      } catch (err) {
        console.error('Lỗi autosave', err)
      } finally {
        setIsAutoSaving(false)
      }
    }, 5000)

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    }
  }, [formValues, onAutoSave])

  const contentValue = watch('content')
  const [debouncedContentValue, setDebouncedContentValue] = useState(contentValue)

  // Debounce for preview
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedContentValue(contentValue)
    }, 300)
    return () => clearTimeout(timer)
  }, [contentValue])

  const handleDraft = (data: AssignmentFormValues) => {
    onSubmitDraft({ ...data, content: embedDrawings(data.content, drawings), drawings })
  }

  const handlePublish = (data: AssignmentFormValues) => {
    if (onPublishClick) {
      onPublishClick({ ...data, content: embedDrawings(data.content, drawings), drawings })
    }
  }

  const handleBackClick = (e: React.MouseEvent) => {
    e.preventDefault()
    setShowLeaveModal(true)
  }

  const handleLeaveConfirm = () => {
    setShowLeaveModal(false)
    router.push(backHref)
  }

  // Handle Before Unload for unsaved changes
  const isSavingRef = React.useRef(false)
  useEffect(() => {
    isSavingRef.current = isAutoSaving || !!isSubmitting
  }, [isAutoSaving, isSubmitting])

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isSavingRef.current) {
        e.preventDefault()
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [])

  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null)
  const { ref: formContentRef, ...formContentRest } = register('content')

  const handleInsertLatex = (latexCommand: string) => {
    if (!textareaRef.current) return

    const textarea = textareaRef.current
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const currentVal = formValues.content || ''

    const before = currentVal.substring(0, start)
    const after = currentVal.substring(end)
    const selectedText = currentVal.substring(start, end)
    
    // Check if we are already inside a math block ($$ or $)
    const countDoubleDollar = (before.match(/\$\$/g) || []).length
    const countSingleDollar = (before.replace(/\$\$/g, '').match(/\$/g) || []).length
    const isInsideMath = (countDoubleDollar % 2 !== 0) || (countSingleDollar % 2 !== 0)

    // Replace { } with {selectedText} if user highlighted text
    let cmd = latexCommand
    if (selectedText && cmd.includes('{ }')) {
      cmd = cmd.replace('{ }', `{${selectedText}}`)
    }

    const isMathBlock = cmd.includes('\\begin')
    let insertText = cmd
    
    if (!isInsideMath) {
      insertText = isMathBlock ? `$$ \n${cmd} \n$$` : `$$ ${cmd} $$`
    }

    const newVal = before + insertText + after
    
    setValue('content', newVal, { shouldValidate: true, shouldDirty: true })

    setTimeout(() => {
      textarea.focus()
      let newCursorPos = start + insertText.length
      
      const emptyBrackets = insertText.indexOf('{ }')
      if (emptyBrackets !== -1) {
        newCursorPos = start + emptyBrackets + 1
      } else if (isMathBlock) {
        const slashIndex = insertText.indexOf('\\\\')
        if (slashIndex !== -1) {
          newCursorPos = start + slashIndex
        }
      } else if (!isInsideMath && !selectedText) {
        newCursorPos = start + insertText.length - 3
      }

      textarea.setSelectionRange(newCursorPos, newCursorPos)
    }, 0)
  }

  const handleConfirmJsxGraph = (jsxGraphData: any) => {
    const nextIndex = drawings.length + 1
    const shapeCode = `SHAPE_${nextIndex}`
    
    // Add to drawings array
    const newDrawing = { shapeCode, jsxGraphData }
    setDrawings(prev => [...prev, newDrawing])
    
    // Insert into textarea
    if (textareaRef.current) {
      const textarea = textareaRef.current
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const currentVal = formValues.content || ''
      const before = currentVal.substring(0, start)
      const after = currentVal.substring(end)
      
      const insertText = `[${shapeCode}]`
      const newVal = before + insertText + after
      setValue('content', newVal, { shouldValidate: true, shouldDirty: true })
      
      setTimeout(() => {
        textarea.focus()
        const newCursorPos = start + insertText.length
        textarea.setSelectionRange(newCursorPos, newCursorPos)
      }, 0)
    }
    
    setShowJsxGraphModal(false)
  }

  // Render function for Content with JSXGraph replacing
  const renderContentWithDrawings = (content: string) => {
    if (!content) return null
    
    // Split content by [SHAPE_XXX] pattern
    const parts = content.split(/(\[SHAPE_[a-zA-Z0-9_]+\])/g)
    
    return parts.map((part, index) => {
      // Check if it's a shape placeholder
      const match = part.match(/^\[(SHAPE_[a-zA-Z0-9_]+)\]$/)
      if (match) {
        const shapeCode = match[1]
        const drawing = drawings.find(d => d.shapeCode === shapeCode)
        if (drawing) {
          return <JsxGraphBoard key={index} shapeCode={shapeCode} jsxGraphData={drawing.jsxGraphData} />
        }
      }
      
      // Regular markdown parsing
      return (
        <ReactMarkdown
          key={index}
          remarkPlugins={[remarkMath]}
          rehypePlugins={[rehypeKatex]}
        >
          {part}
        </ReactMarkdown>
      )
    })
  }

  return (
    <div className="fixed inset-0 z-[100] bg-slate-100 flex flex-col overflow-hidden">
      {/* TOOLBAR */}
      <div className="h-14 bg-white border-b border-border px-4 flex items-center justify-between shrink-0 shadow-sm z-10">
        {/* Left: Back & Breadcrumb */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleBackClick}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 border border-slate-200 text-slate-600 hover:bg-white hover:border-slate-300 hover:shadow-sm hover:text-slate-900 transition-all"
            title={backText}
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          <div className="hidden sm:flex items-center gap-2 text-sm text-slate-500 font-medium">
            <button onClick={handleBackClick} className="hover:text-slate-800 transition-colors">
              {backText}
            </button>
            <ChevronRight className="h-4 w-4 text-slate-400" />
            <span className="text-slate-900 truncate max-w-[300px]">
              {pageTitle}
            </span>
          </div>
        </div>

        {/* Right: Submit Buttons */}
        <div className="flex items-center gap-3">
          {isAutoSaving ? (
            <span className="hidden sm:flex items-center gap-1.5 text-xs text-amber-600 font-medium mr-2">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
              Đang lưu nháp...
            </span>
          ) : lastSavedTime ? (
            <span className="hidden sm:flex items-center gap-1.5 text-xs text-emerald-600 font-medium mr-2">
              <Check className="h-3 w-3" />
              Đã lưu ({lastSavedTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })})
            </span>
          ) : null}

          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleSubmit(handleDraft)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-200 shadow-sm transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {submitDraftText}
          </button>

          {onPublishClick && (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleSubmit(handlePublish)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:bg-primary/95 shadow-sm active:scale-95 transition-all disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              Giao bài
            </button>
          )}
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 min-h-0 flex flex-col p-2 sm:p-4 gap-4">

        {/* ROW 1: Title and Description */}
        <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-2xl border border-border shadow-sm shrink-0">
          <div className="flex-1 relative">
            <input
              type="text"
              {...register('title')}
              placeholder="Nhập tiêu đề (VD: Bài tập giải tích)..."
              className={`w-full h-11 px-4 rounded-xl border bg-slate-50/50 text-base font-semibold outline-none transition-all focus:bg-white focus:ring-2 focus:ring-primary/15 ${errors.title ? 'border-destructive focus:border-destructive' : 'border-border focus:border-primary'
                }`}
            />
            {errors.title && (
              <span className="absolute -bottom-5 left-2 text-[10px] text-destructive font-medium">{errors.title.message}</span>
            )}
          </div>

          <div className="flex-1 md:flex-[2] relative">
            <input
              type="text"
              {...register('description')}
              placeholder="Nhập mô tả ngắn gọn cho bài tập..."
              className={`w-full h-11 px-4 rounded-xl border bg-slate-50/50 text-sm outline-none transition-all focus:bg-white focus:ring-2 focus:ring-primary/15 ${errors.description ? 'border-destructive focus:border-destructive' : 'border-border focus:border-primary'
                }`}
            />
            {errors.description && (
              <span className="absolute -bottom-5 left-2 text-[10px] text-destructive font-medium">{errors.description.message}</span>
            )}
          </div>
        </div>

        {/* ROW 2: Editor and Preview Split */}
        <div className="flex-1 min-h-0 relative">
          {errors.content && (
            <div className="absolute top-0 right-4 -translate-y-full pb-1 z-10">
              <span className="bg-destructive/10 text-destructive px-2 py-0.5 rounded text-[11px] font-medium border border-destructive/20">{errors.content.message}</span>
            </div>
          )}
          <PanelGroup direction="horizontal" className="h-full w-full">
            {/* EDITOR */}
            <Panel defaultSize={50} minSize={20} className={`bg-white rounded-2xl border shadow-sm flex flex-col overflow-hidden mr-2 focus-within:ring-2 focus-within:ring-primary/15 transition-all ${errors.content ? 'border-destructive focus-within:border-destructive' : 'border-border focus-within:border-primary'}`}>
              <div className="bg-slate-50 px-4 py-2 border-b border-border text-xs font-semibold text-slate-600 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <Edit3 className="w-3.5 h-3.5" /> Soạn thảo Markdown & LaTeX
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setShowJsxGraphModal(true);
                  }}
                  className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded flex items-center gap-1.5 hover:bg-blue-100 transition-colors shadow-sm border border-blue-200"
                >
                  <CircleDot className="w-3.5 h-3.5" />
                  Thêm hình vẽ JSXGraph
                </button>
              </div>
              <LatexToolbar onInsert={handleInsertLatex} />
              <textarea
                {...formContentRest}
                ref={(e) => {
                  formContentRef(e)
                  textareaRef.current = e
                }}
                placeholder="Nhập nội dung bài tập...&#10;Hỗ trợ LaTeX: $$ x = \frac{-b \pm \sqrt{\Delta}}{2a} $$"
                className="flex-1 w-full p-4 text-sm bg-transparent outline-none resize-none font-mono leading-relaxed"
              />
            </Panel>

            {/* RESIZER */}
            <PanelResizeHandle className="w-2 mx-1 rounded-full bg-slate-200 hover:bg-primary/50 transition-colors cursor-col-resize flex flex-col items-center justify-center gap-1">
              <div className="w-1 h-1 rounded-full bg-slate-400" />
              <div className="w-1 h-1 rounded-full bg-slate-400" />
              <div className="w-1 h-1 rounded-full bg-slate-400" />
            </PanelResizeHandle>

            {/* PREVIEW */}
            <Panel defaultSize={50} minSize={20} className="bg-white rounded-2xl border border-border shadow-sm flex flex-col overflow-hidden ml-2">
              <div className="bg-slate-50 px-4 py-2 border-b border-border text-xs font-semibold text-slate-600 flex items-center gap-2 shrink-0">
                <Eye className="w-3.5 h-3.5" /> Xem trước
              </div>
              <div className="flex-1 w-full p-6 prose prose-slate prose-sm max-w-none overflow-y-auto">
                {debouncedContentValue ? (
                  renderContentWithDrawings(debouncedContentValue)
                ) : (
                  <p className="text-muted-foreground italic text-sm mt-0">Nội dung xem trước sẽ hiển thị ở đây...</p>
                )}
              </div>
            </Panel>
          </PanelGroup>
        </div>

      </div>

      {/* Leave Confirmation Modal */}
      {showLeaveModal && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <h3 className="text-xl font-bold text-slate-900 mb-2">Hủy bỏ các thay đổi?</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Bạn có chắc chắn muốn quay lại không? Các thông tin bạn vừa nhập có thể bị mất.
              </p>
            </div>
            <div className="flex items-center gap-3 p-4 bg-slate-50 border-t border-border justify-end">
              <button
                onClick={() => setShowLeaveModal(false)}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200 bg-slate-100 rounded-xl transition-colors"
              >
                Tiếp tục ở lại
              </button>
              <button
                onClick={handleLeaveConfirm}
                className="px-4 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors shadow-sm"
              >
                Vẫn quay lại
              </button>
            </div>
          </div>
        </div>
      )}

      {/* JSXGraph Editor Modal */}
      <JsxGraphEditorModal
        open={showJsxGraphModal}
        onClose={() => setShowJsxGraphModal(false)}
        onConfirm={handleConfirmJsxGraph}
      />
    </div>
  )
}
