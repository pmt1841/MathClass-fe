'use client'

import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import { Save, Send, Eye, Edit3, ArrowLeft, ChevronRight, Check, CircleDot, X, ImagePlus, Bold, Italic, Underline } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { LatexToolbar } from '@/components/ui/latex-toolbar'
import dynamic from 'next/dynamic'
import api from '@/lib/axios'
import { toast } from 'sonner'

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
  drawings: z.array(z.any()).optional(),
  images: z.array(z.any()).optional()
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
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit')

  const [isAutoSaving, setIsAutoSaving] = useState(false)
  const [lastSavedTime, setLastSavedTime] = useState<Date | null>(null)
  const saveTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)
  const isFormLoadedRef = React.useRef(false)

  // JSXGraph State
  const [showJsxGraphModal, setShowJsxGraphModal] = useState(false)
  const [drawings, setDrawings] = useState<any[]>(defaultValues?.drawings || [])
  const [editingShape, setEditingShape] = useState<{ shapeCode: string, jsxGraphData: any } | null>(null)

  // Images State
  const [images, setImages] = useState<any[]>(defaultValues?.images || [])
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = React.useRef<HTMLInputElement | null>(null)

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
      drawings: [],
      images: []
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
    if (mergedValues.images) {
      setImages(mergedValues.images)
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
        await onAutoSave({ ...formValues, content: embedDrawings(formValues.content, drawings), drawings, images })
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
    onSubmitDraft({ ...data, content: embedDrawings(data.content, drawings), drawings, images })
    setLastSavedTime(new Date())
  }

  const handlePublish = (data: AssignmentFormValues) => {
    if (onPublishClick) {
      onPublishClick({ ...data, content: embedDrawings(data.content, drawings), drawings, images })
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

  const handleFormatText = (format: 'bold' | 'italic' | 'underline') => {
    if (!textareaRef.current) return

    const textarea = textareaRef.current
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const currentVal = formValues.content || ''

    const before = currentVal.substring(0, start)
    const after = currentVal.substring(end)
    const selectedText = currentVal.substring(start, end)

    let insertText = ''
    let newCursorPos = start

    if (format === 'bold') {
      insertText = `**${selectedText}**`
      newCursorPos = selectedText ? start + insertText.length : start + 2
    } else if (format === 'italic') {
      insertText = `*${selectedText}*`
      newCursorPos = selectedText ? start + insertText.length : start + 1
    } else if (format === 'underline') {
      insertText = `<u>${selectedText}</u>`
      newCursorPos = selectedText ? start + insertText.length : start + 3
    }

    const newVal = before + insertText + after

    setValue('content', newVal, { shouldValidate: true, shouldDirty: true })

    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(newCursorPos, newCursorPos)
    }, 0)
  }

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
    if (editingShape) {
      // Cập nhật hình cũ
      const updatedDrawings = drawings.map(d =>
        d.shapeCode === editingShape.shapeCode
          ? { ...d, jsxGraphData }
          : d
      )
      setDrawings(updatedDrawings)

      // Kích hoạt auto-save bằng cách set lại content
      const currentVal = formValues.content || ''
      setValue('content', currentVal, { shouldValidate: true, shouldDirty: true })
    } else {
      // Thuật toán lấp khoảng trống ID: Tìm số nguyên dương nhỏ nhất chưa được sử dụng
      const existingIndices = drawings
        .map(d => parseInt(d.shapeCode.replace('SHAPE_', '')))
        .filter(n => !isNaN(n))

      let nextIndex = 1
      while (existingIndices.includes(nextIndex)) {
        nextIndex++
      }

      const shapeCode = `SHAPE_${nextIndex}`
      const newDrawing = { shapeCode, jsxGraphData }
      setDrawings(prev => [...prev, newDrawing])

      // Chèn vào văn bản tại con trỏ
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
      } else {
        const currentVal = formValues.content || ''
        setValue('content', currentVal + `\n[${shapeCode}]`, { shouldValidate: true, shouldDirty: true })
      }
    }

    setShowJsxGraphModal(false)
    setEditingShape(null)
  }

  const handleEditDrawing = (shapeCode: string) => {
    const drawing = drawings.find(d => d.shapeCode === shapeCode)
    if (drawing) {
      setEditingShape({ shapeCode: drawing.shapeCode, jsxGraphData: drawing.jsxGraphData })
      setShowJsxGraphModal(true)
    }
  }

  const handleDeleteDrawing = (shapeCode: string) => {
    setDrawings(prev => prev.filter(d => d.shapeCode !== shapeCode))
    const currentVal = formValues.content || ''
    const newVal = currentVal.replace(new RegExp(`\\[${shapeCode}\\]`, 'g'), '')
    setValue('content', newVal, { shouldValidate: true, shouldDirty: true })
  }

  const handleInsertDrawing = (shapeCode: string) => {
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
    } else {
      const currentVal = formValues.content || ''
      setValue('content', currentVal + `\n[${shapeCode}]`, { shouldValidate: true, shouldDirty: true })
    }
  }

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (images.length >= 10) {
      toast.error('Chỉ được phép tải lên tối đa 10 ảnh.')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Dung lượng ảnh vượt quá 5MB.')
      return
    }

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!validTypes.includes(file.type)) {
      toast.error('Định dạng ảnh không hợp lệ. Vui lòng chọn .jpg, .png, .webp')
      return
    }

    setIsUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await api.post('/assignments/images/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      const { imageCode, imageUrl } = response.data
      const newImages = [...images, { imageCode, imageUrl }]
      setImages(newImages)
      setValue('images', newImages, { shouldValidate: true, shouldDirty: true })

      // Insert into markdown
      if (textareaRef.current) {
        const textarea = textareaRef.current
        const start = textarea.selectionStart
        const currentVal = formValues.content || ''
        const before = currentVal.substring(0, start)
        const after = currentVal.substring(start)

        const insertText = imageCode
        const newVal = before + insertText + after
        setValue('content', newVal, { shouldValidate: true, shouldDirty: true })

        setTimeout(() => {
          textarea.focus()
          const newCursorPos = start + insertText.length
          textarea.setSelectionRange(newCursorPos, newCursorPos)
        }, 0)
      } else {
        const currentVal = formValues.content || ''
        setValue('content', currentVal + `\n${imageCode}`, { shouldValidate: true, shouldDirty: true })
      }
      toast.success('Tải ảnh lên thành công')
    } catch (error: any) {
      toast.error(error.response?.data || 'Có lỗi xảy ra khi tải ảnh lên')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleDeleteImage = (imageCode: string) => {
    const updatedImages = images.filter(img => img.imageCode !== imageCode)
    setImages(updatedImages)
    setValue('images', updatedImages, { shouldValidate: true, shouldDirty: true })
    const currentVal = formValues.content || ''
    const newVal = currentVal.replace(new RegExp(imageCode.replace(/\[/g, '\\[').replace(/\]/g, '\\]'), 'g'), '')
    setValue('content', newVal, { shouldValidate: true, shouldDirty: true })
  }

  // Render function for Content with JSXGraph replacing
  const renderContentWithDrawings = (content: string) => {
    if (!content) return null

    // Split content by [SHAPE_XXX] or [IMAGE_XXX] pattern
    const parts = content.split(/(\[SHAPE_[a-zA-Z0-9_]+\]|\[IMAGE_[a-zA-Z0-9_]+\])/g)

    return parts.map((part, index) => {
      // Check if it's a shape placeholder
      const shapeMatch = part.match(/^\[(SHAPE_[a-zA-Z0-9_]+)\]$/)
      if (shapeMatch) {
        const shapeCode = shapeMatch[1]
        const drawing = drawings.find(d => d.shapeCode === shapeCode)
        if (drawing) {
          return <JsxGraphBoard key={index} shapeCode={shapeCode} jsxGraphData={drawing.jsxGraphData} />
        }
      }

      // Check if it's an image placeholder
      const imageMatch = part.match(/^(\[IMAGE_[a-zA-Z0-9_]+\])$/)
      if (imageMatch) {
        const imageCode = imageMatch[1]
        const image = images.find(img => img.imageCode === imageCode)
        if (image) {
          // eslint-disable-next-line @next/next/no-img-element
          return <img key={index} src={image.imageUrl} alt="Assignment image" className="max-w-full h-auto rounded-lg my-4 shadow-sm border border-slate-200" />
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
              Đã lưu ({`${lastSavedTime.getHours().toString().padStart(2, '0')}:${lastSavedTime.getMinutes().toString().padStart(2, '0')}:${lastSavedTime.getSeconds().toString().padStart(2, '0')} ${lastSavedTime.getDate().toString().padStart(2, '0')}/${(lastSavedTime.getMonth() + 1).toString().padStart(2, '0')}/${lastSavedTime.getFullYear()}`})
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
              placeholder="Nhập tiêu đề..."
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
          <div className={`h-full w-full bg-white rounded-2xl border shadow-sm flex flex-col overflow-hidden focus-within:ring-2 focus-within:ring-primary/15 transition-all ${errors.content ? 'border-destructive focus-within:border-destructive' : 'border-border focus-within:border-primary'}`}>
            <div className="bg-slate-50 px-4 py-2 border-b border-border text-xs font-semibold text-slate-600 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="flex bg-slate-200/50 p-0.5 rounded-lg border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setViewMode('edit')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                      viewMode === 'edit'
                        ? 'bg-white text-primary shadow-sm ring-1 ring-slate-200 font-semibold'
                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                    }`}
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Soạn thảo
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('preview')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                      viewMode === 'preview'
                        ? 'bg-white text-primary shadow-sm ring-1 ring-slate-200 font-semibold'
                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" /> Xem trước
                  </button>
                </div>
              </div>
              {viewMode === 'edit' && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center bg-slate-200/50 p-0.5 rounded-lg border border-slate-200 mr-2">
                    <button
                      type="button"
                      onClick={(e) => { e.preventDefault(); handleFormatText('bold') }}
                      className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded transition-colors"
                      title="In đậm"
                    >
                      <Bold className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.preventDefault(); handleFormatText('italic') }}
                      className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded transition-colors"
                      title="In nghiêng"
                    >
                      <Italic className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.preventDefault(); handleFormatText('underline') }}
                      className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded transition-colors"
                      title="Gạch chân"
                    >
                      <Underline className="w-4 h-4" />
                    </button>
                  </div>
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleUploadImage}
                  />
                  <button
                    type="button"
                    disabled={isUploading}
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded flex items-center gap-1.5 hover:bg-emerald-100 transition-colors shadow-sm border border-emerald-200 disabled:opacity-50"
                  >
                    <ImagePlus className="w-3.5 h-3.5" />
                    {isUploading ? 'Đang tải...' : 'Thêm ảnh'}
                  </button>
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

            {/* Editor Area */}
            <div className={`flex-1 flex-col overflow-hidden ${viewMode === 'edit' ? 'flex' : 'hidden'}`}>
              <LatexToolbar onInsert={handleInsertLatex} />

              {/* Danh sách hình vẽ & Ảnh */}
              {(drawings.length > 0 || images.length > 0) && (
                <div className="bg-slate-50 border-b border-border px-4 py-2 flex flex-wrap gap-2 items-center shrink-0">
                  {drawings.length > 0 && (
                    <>
                      <span className="text-xs font-semibold text-slate-500 mr-1">Hình vẽ:</span>
                      {drawings.map(d => (
                        <div key={d.shapeCode} className="flex items-center gap-1 bg-white border border-slate-200 shadow-sm rounded-md overflow-hidden group">
                          <button
                            type="button"
                            onClick={() => handleInsertDrawing(d.shapeCode)}
                            className="px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors"
                            title="Chèn vào văn bản"
                          >
                            {d.shapeCode}
                          </button>
                          <div className="w-px h-4 bg-slate-200"></div>
                          <button
                            type="button"
                            onClick={() => handleEditDrawing(d.shapeCode)}
                            className="px-1.5 py-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            title="Chỉnh sửa"
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
                        </div>
                      ))}
                    </>
                  )}
                  {images.length > 0 && (
                    <>
                      {drawings.length > 0 && <div className="w-px h-4 bg-slate-300 mx-2"></div>}
                      <span className="text-xs font-semibold text-slate-500 mr-1">Ảnh:</span>
                      {images.map(img => (
                        <div key={img.imageCode} className="flex items-center gap-1 bg-white border border-slate-200 shadow-sm rounded-md overflow-hidden group">
                          <button
                            type="button"
                            onClick={() => {
                              const textarea = textareaRef.current
                              if (!textarea) return
                              const start = textarea.selectionStart
                              const currentVal = formValues.content || ''
                              const newVal = currentVal.substring(0, start) + img.imageCode + currentVal.substring(start)
                              setValue('content', newVal, { shouldValidate: true, shouldDirty: true })
                              setTimeout(() => {
                                textarea.focus()
                                textarea.setSelectionRange(start + img.imageCode.length, start + img.imageCode.length)
                              }, 0)
                            }}
                            className="px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors"
                            title={`Chèn ${img.imageCode} vào văn bản`}
                          >
                            {img.imageCode}
                          </button>
                          <div className="w-px h-4 bg-slate-200"></div>
                          <button
                            type="button"
                            onClick={() => handleDeleteImage(img.imageCode)}
                            className="px-1.5 py-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Xoá ảnh"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}
              <textarea
                {...formContentRest}
                ref={(e) => {
                  formContentRef(e)
                  textareaRef.current = e
                }}
                placeholder="Nhập nội dung bài tập..."
                className="flex-1 w-full p-4 text-sm bg-transparent outline-none resize-none font-mono leading-relaxed"
              />
            </div>

            {/* Preview Area */}
            <div className={`flex-1 w-full p-6 prose prose-slate prose-sm max-w-none overflow-y-auto ${viewMode === 'preview' ? 'block' : 'hidden'}`}>
              {debouncedContentValue ? (
                renderContentWithDrawings(debouncedContentValue)
              ) : (
                <p className="text-muted-foreground italic text-sm mt-0">Nội dung xem trước sẽ hiển thị ở đây...</p>
              )}
            </div>
          </div>
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
        onClose={() => {
          setShowJsxGraphModal(false)
          setEditingShape(null)
        }}
        onConfirm={handleConfirmJsxGraph}
        initialData={editingShape?.jsxGraphData}
      />
    </div>
  )
}
