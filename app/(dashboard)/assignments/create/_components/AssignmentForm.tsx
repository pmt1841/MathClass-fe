'use client'

import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import remarkGfm from 'remark-gfm'
import rehypeKatex from 'rehype-katex'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize from 'rehype-sanitize'
import { sanitizeSchema } from '@/lib/markdown'
import { markdownComponents } from '@/components/ui/markdown-components'
import 'katex/dist/katex.min.css'
import { Save, Send, Eye, Edit3, ArrowLeft, ChevronRight, Check, CircleDot, X, ImagePlus, Bold, Italic, Underline, Settings, Upload, FileText, Sparkles } from 'lucide-react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'

import { markdownToHtml, htmlToMarkdown, separateAdjacentMath } from '@/lib/editor-utils'

const TiptapEditor = dynamic(() => import('@/components/ui/tiptap'), { ssr: false })
import { formatDateTime } from '@/lib/utils'
import { assignmentService, AssignmentTag } from '@/services/assignmentService'
import { toast } from 'sonner'
import { MediaUploadModal, UploadModalMode } from '@/components/ui/media-upload-modal'
import { AssignmentTagInput } from '@/components/assignments/assignment-tag-input'
import { AiQuestionGeneratorModal } from '@/components/ai/AiQuestionGeneratorModal'
import { AiGeneratedQuestionDTO } from '@/services/aiQuestionService'
import { useAiFeatures, AI_FEATURE_TASKS } from '@/hooks/useAiFeatures'

import { normalizeCanvasElements } from '@/components/ui/jsxgraph-editor-modal'

export const filterReferencedImages = (content: string, description: string, images: any[]) => {
  if (!images || images.length === 0) return []
  const fullText = (content || '') + ' ' + (description || '')
  return images.filter(img => {
    if (!img) return false
    const code = (img.imageCode || '').replace('[', '').replace(']', '')
    const url = img.imageUrl || ''
    return (
      (img.imageCode && fullText.includes(img.imageCode)) ||
      (code && fullText.includes(code)) ||
      (url && fullText.includes(url))
    )
  })
}

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
  description: z.string().optional().default(''),
  content: z.string().min(1, 'Nội dung bài tập không được để trống'),
  drawings: z.array(z.any()).optional(),
  images: z.array(z.any()).optional(),
  tagIds: z.array(z.number()).optional(),
  tagNames: z.array(z.string()).optional(),
  allowResubmit: z.boolean().optional().default(false)
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
  const [showSidebar, setShowSidebar] = useState(true)
  const [availableTags, setAvailableTags] = useState<AssignmentTag[]>([])

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
  const [isUploadingFile, setIsUploadingFile] = useState(false)

  const [showUploadConfirmModal, setShowUploadConfirmModal] = useState(false)
  const [pendingUploadData, setPendingUploadData] = useState<any>(null)
  const [pendingUploadFile, setPendingUploadFile] = useState<File | null>(null)

  // Media & Upload Modal State
  const [mediaModalState, setMediaModalState] = useState<{ isOpen: boolean, mode: UploadModalMode }>({
    isOpen: false,
    mode: 'image'
  })

  // AI Generator Modal State
  const [showAiModal, setShowAiModal] = useState(false)
  const { data: aiFeatures } = useAiFeatures()
  const isAiQuestionGenEnabled = aiFeatures?.[AI_FEATURE_TASKS.QUESTION_GEN] === true

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors, isSubmitted }
  } = useForm<AssignmentFormValues>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: defaultValues || {
      title: '',
      description: '',
      content: '',
      drawings: [],
      images: [],
      tagIds: [],
      allowResubmit: false
    }
  })

  useEffect(() => { assignmentService.getTags().then(setAvailableTags).catch(() => toast.error('Không thể tải danh sách tag')) }, [])

  useEffect(() => {
    let mergedValues = defaultValues || { title: '', description: '', content: '', drawings: [], allowResubmit: false }
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



  const contentValue = watch('content')
  const [debouncedContentValue, setDebouncedContentValue] = useState(contentValue)

  // Debounce for preview
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedContentValue(contentValue)
    }, 300)
    return () => clearTimeout(timer)
  }, [contentValue])

  const [isSubmittedSuccessfully, setIsSubmittedSuccessfully] = useState(false)

  const isFormDirty = React.useMemo(() => {
    const initial = defaultValues || { title: '', description: '', content: '', drawings: [], images: [], allowResubmit: false }

    const currentTitle = (formValues.title || '').trim()
    const initialTitle = (initial.title || '').trim()
    const titleChanged = currentTitle !== initialTitle

    const currentDesc = (formValues.description || '').trim()
    const initialDesc = (initial.description || '').trim()
    const descChanged = currentDesc !== initialDesc

    const currentContent = (formValues.content || '').trim()
    const initialContent = (initial.content || '').trim()
    const contentChanged = currentContent !== initialContent

    const initialDrawings = initial.drawings || []
    const drawingsChanged = JSON.stringify(drawings) !== JSON.stringify(initialDrawings)

    const initialImages = initial.images || []
    const imagesChanged = JSON.stringify(images) !== JSON.stringify(initialImages)

    const allowResubmitChanged = Boolean(formValues.allowResubmit) !== Boolean(initial.allowResubmit)

    return titleChanged || descChanged || contentChanged || drawingsChanged || imagesChanged || allowResubmitChanged
  }, [formValues.title, formValues.description, formValues.content, formValues.allowResubmit, drawings, images, defaultValues])

  // Reset isSubmittedSuccessfully if user modifies any input field after submit
  useEffect(() => {
    setIsSubmittedSuccessfully(false)
  }, [formValues.title, formValues.description, formValues.content, drawings, images])

  const shouldWarn = isFormDirty && !isSubmittedSuccessfully

  const isPushedRef = React.useRef(false)

  const handleDraft = (data: AssignmentFormValues) => {
    setIsSubmittedSuccessfully(true)
    if (isPushedRef.current) {
      isPushedRef.current = false
      window.history.back()
    }
    const activeImages = filterReferencedImages(data.content, data.description || '', images)
    onSubmitDraft({ ...data, content: embedDrawings(data.content, drawings), drawings, images: activeImages })
    setLastSavedTime(new Date())
  }

  const handlePublish = (data: AssignmentFormValues) => {
    if (onPublishClick) {
      setIsSubmittedSuccessfully(true)
      if (isPushedRef.current) {
        isPushedRef.current = false
        window.history.back()
      }
      const activeImages = filterReferencedImages(data.content, data.description || '', images)
      onPublishClick({ ...data, content: embedDrawings(data.content, drawings), drawings, images: activeImages })
    }
  }

  const handleBackClick = (e: React.MouseEvent) => {
    e.preventDefault()
    if (shouldWarn) {
      setShowLeaveModal(true)
    } else {
      router.push(backHref)
    }
  }

  const handleLeaveConfirm = () => {
    setShowLeaveModal(false)
    setIsSubmittedSuccessfully(true)
    if (isPushedRef.current) {
      isPushedRef.current = false
      window.history.back()
    }
    router.push(backHref)
  }

  // Handle Before Unload for unsaved changes (F5, Ctrl+R, Close tab)
  const shouldWarnRef = React.useRef(false)
  useEffect(() => {
    shouldWarnRef.current = shouldWarn
  }, [shouldWarn])

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (shouldWarnRef.current) {
        e.preventDefault()
        e.returnValue = ''
        return ''
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [])

  // Handle Browser Back Arrow Button (popstate) to show custom showLeaveModal
  useEffect(() => {
    if (!shouldWarn) {
      if (isPushedRef.current) {
        isPushedRef.current = false
        window.history.back()
      }
      return
    }

    if (!isPushedRef.current) {
      window.history.pushState({ isFormGuarded: true }, '', window.location.href)
      isPushedRef.current = true
    }

    const handlePopState = () => {
      isPushedRef.current = false
      if (shouldWarnRef.current) {
        setShowLeaveModal(true)
      }
    }

    window.addEventListener('popstate', handlePopState)
    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [shouldWarn])

  const [editorInstance, setEditorInstance] = useState<any>(null)

  useEffect(() => {
    register('content')
  }, [register])

  const insertTextIntoEditor = (text: string) => {
    if (editorInstance) {
      // Use Tiptap command to insert content at cursor position
      editorInstance.chain().focus().insertContent(text).run();
      // Force react-hook-form value sync with Markdown output
      const htmlData = editorInstance.getHTML();
      const mdData = htmlToMarkdown(htmlData);
      setValue('content', mdData, { shouldValidate: isSubmitted, shouldDirty: true });
    }
  };

  const handleInsertDrawing = (shapeCode: string) => {
    const drawing = drawings.find(d => d.shapeCode === shapeCode)
    let insertText = `[${shapeCode}]`
    if (drawing && (drawing.width || drawing.height)) {
      insertText = `[${shapeCode}|${drawing.width || '100%'}x${drawing.height || '300'}]`
    }
    insertTextIntoEditor(insertText);
  };

  const handleInsertImage = (imageCode: string) => {
    insertTextIntoEditor(imageCode);
  };

  // handleInsertLatex is now managed inside CKEditor Component

  const handleConfirmJsxGraph = (jsxGraphData: any, w?: string, h?: string) => {
    if (editingShape) {
      // Cập nhật hình cũ
      const updatedDrawings = drawings.map(d =>
        d.shapeCode === editingShape.shapeCode
          ? { ...d, jsxGraphData, width: w, height: h }
          : d
      )
      setDrawings(updatedDrawings)

      // Kích hoạt auto-save bằng cách set lại content
      const currentVal = formValues.content || ''
      setValue('content', currentVal, { shouldValidate: isSubmitted, shouldDirty: true })
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
      const newDrawing = { shapeCode, jsxGraphData, width: w, height: h }
      setDrawings(prev => [...prev, newDrawing])

      let insertText = `[${shapeCode}]`
      if (w || h) {
        insertText = `[${shapeCode}|${w || '100%'}x${h || '300'}]`
      }
      insertTextIntoEditor(insertText)
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
    const newVal = currentVal.replace(new RegExp(`\\[${shapeCode}(?:\\|[^\\]]*)?\\]`, 'g'), '')
    setValue('content', newVal, { shouldValidate: isSubmitted, shouldDirty: true })
    if (editorInstance) {
      editorInstance.commands.setContent(markdownToHtml(newVal))
    }
  }

  const handleInsertLink = (url: string, text?: string) => {
    if (editorInstance) {
      if (text) {
        editorInstance.chain().focus().insertContent(`<a href="${url}">${text}</a>`).run()
      } else {
        if (editorInstance.state.selection.empty) {
          editorInstance.chain().focus().insertContent(`<a href="${url}">${url}</a>`).run()
        } else {
          editorInstance.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
        }
      }
      const htmlData = editorInstance.getHTML()
      const mdData = htmlToMarkdown(htmlData)
      setValue('content', mdData, { shouldValidate: isSubmitted, shouldDirty: true })
    } else {
      const currentMd = formValues.content || ''
      const mdLink = text ? `[${text}](${url})` : `[${url}](${url})`
      setValue('content', currentMd + '\n' + mdLink, { shouldValidate: isSubmitted, shouldDirty: true })
    }
  }

  const handleImageUploadFromEditor = async (file: File, onProgress?: (percent: number) => void) => {
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
      const data = await assignmentService.uploadImage(formData, (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          onProgress(percent)
        }
      })
      const { imageCode, imageUrl } = data
      setImages(prev => {
        const updated = [...prev, { imageCode, imageUrl }]
        setValue('images', updated, { shouldValidate: isSubmitted, shouldDirty: true })
        return updated
      })

      if (editorInstance) {
        editorInstance.chain().focus().setImage({ src: imageUrl, alt: imageCode }).run()
      } else {
        insertTextIntoEditor(imageCode)
      }
    } catch (error: any) {
      const msg = typeof error.response?.data === 'string'
        ? error.response.data
        : error.response?.data?.message || error.message || 'Có lỗi xảy ra khi tải ảnh lên'
      toast.error(msg)
      throw error
    } finally {
      setIsUploading(false)
    }
  }

  const processFileUpload = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Dung lượng file vượt quá 10MB.')
      return
    }

    setIsUploadingFile(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const rawResponse = await assignmentService.extractText(formData)
      const uploadData = rawResponse.data || rawResponse
      if (uploadData.content) {
        const hasData = formValues.title?.trim() || formValues.content?.trim() || images.length > 0 || drawings.length > 0;
        if (!hasData) {
          applyUploadData('replace', uploadData, file)
        } else {
          setPendingUploadData(uploadData)
          setPendingUploadFile(file)
          setShowUploadConfirmModal(true)
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Có lỗi xảy ra khi trích xuất nội dung file')
    } finally {
      setIsUploadingFile(false)
    }
  }

  const applyUploadData = (mode: 'append' | 'replace', uploadData: any, uploadFile: File) => {
    const { content, images: newImagesArr } = uploadData

    if (mode === 'replace') {
      const fileNameWithoutExt = uploadFile.name.replace(/\.[^/.]+$/, "")
      setValue('title', fileNameWithoutExt, { shouldValidate: true, shouldDirty: true })

      const htmlData = markdownToHtml(content)
      if (editorInstance) {
        editorInstance.commands.setContent(htmlData)
      }
      setValue('content', content, { shouldValidate: true, shouldDirty: true })

      setDrawings([])
      setValue('drawings', [], { shouldValidate: true, shouldDirty: true })

      if (newImagesArr && newImagesArr.length > 0) {
        setImages(newImagesArr)
        setValue('images', newImagesArr, { shouldValidate: true, shouldDirty: true })
        toast.success(`Đã thay thế nội dung và thêm ${newImagesArr.length} hình ảnh`)
      } else {
        setImages([])
        setValue('images', [], { shouldValidate: true, shouldDirty: true })
        toast.success('Đã thay thế nội dung thành công')
      }
    } else { // 'append'
      const appendHtml = `<p></p><p></p>` + markdownToHtml(content)

      if (editorInstance) {
        const currentHtml = editorInstance.getHTML()
        editorInstance.commands.setContent(currentHtml + appendHtml)
      }

      const currentMd = formValues.content || ''
      const appendMd = `\n\n${content}`
      setValue('content', currentMd + appendMd, { shouldValidate: true, shouldDirty: true })

      if (newImagesArr && newImagesArr.length > 0) {
        const updatedImages = [...images, ...newImagesArr]
        setImages(updatedImages)
        setValue('images', updatedImages, { shouldValidate: true, shouldDirty: true })
        toast.success(`Đã bổ sung nội dung và ${newImagesArr.length} hình ảnh`)
      } else {
        toast.success('Đã bổ sung nội dung thành công')
      }
    }
  }

  const handleConfirmUpload = (mode: 'append' | 'replace') => {
    setShowUploadConfirmModal(false)
    if (!pendingUploadData || !pendingUploadFile) return
    applyUploadData(mode, pendingUploadData, pendingUploadFile)
    setPendingUploadData(null)
    setPendingUploadFile(null)
  }

  const handleDeleteImage = (imageCode: string) => {
    const updatedImages = images.filter(img => img.imageCode !== imageCode)
    setImages(updatedImages)
    setValue('images', updatedImages, { shouldValidate: isSubmitted, shouldDirty: true })
    const currentVal = formValues.content || ''
    const code = imageCode.replace('[', '').replace(']', '')
    const newVal = currentVal.replace(new RegExp(`\\[${code}(?:\\|[^\\]]*)?\\]`, 'g'), '')
    setValue('content', newVal, { shouldValidate: isSubmitted, shouldDirty: true })
    if (editorInstance) {
      editorInstance.commands.setContent(markdownToHtml(newVal))
    }
  }

  const handleInsertAiQuestion = (question: AiGeneratedQuestionDTO, mode: 'append' | 'replace' = 'append') => {
    if (mode === 'replace') {
      if (question.title) {
        setValue('title', question.title, { shouldValidate: true, shouldDirty: true })
      }
    } else {
      if (question.title && (!formValues.title || !formValues.title.trim())) {
        setValue('title', question.title, { shouldValidate: true, shouldDirty: true })
      }
    }

    let formattedContent = question.content

    // Automatically register AI-generated canvasData as a drawing if present
    if (question.canvasData?.elements && question.canvasData.elements.length > 0) {
      const normalizedElements = normalizeCanvasElements(question.canvasData.elements)
      const normalizedCanvasData = {
        ...question.canvasData,
        elements: normalizedElements
      }

      const baseDrawings = mode === 'replace' ? [] : drawings
      const existingIndices = baseDrawings
        .map(d => parseInt(d.shapeCode.replace('SHAPE_', '')))
        .filter(n => !isNaN(n))

      let nextIndex = 1
      while (existingIndices.includes(nextIndex)) {
        nextIndex++
      }

      const shapeCode = `SHAPE_${nextIndex}`
      const newDrawing = {
        shapeCode,
        jsxGraphData: normalizedCanvasData,
        width: '100%',
        height: '300'
      }

      const updatedDrawings = [...baseDrawings, newDrawing]
      setDrawings(updatedDrawings)
      setValue('drawings', updatedDrawings, { shouldValidate: true, shouldDirty: true })

      formattedContent += `\n\n[${shapeCode}|100%x300]`
    } else if (mode === 'replace') {
      setDrawings([])
      setValue('drawings', [], { shouldValidate: true, shouldDirty: true })
    }

    if (question.explanation) {
      formattedContent += `\n\n**Lời giải chi tiết:**\n${question.explanation}`
    }

    if (editorInstance) {
      const htmlToInsert = markdownToHtml(formattedContent)
      if (mode === 'replace') {
        editorInstance.commands.setContent(htmlToInsert)
      } else {
        const currentHtml = editorInstance.getHTML()
        if (!currentHtml || currentHtml === '<p></p>') {
          editorInstance.commands.setContent(htmlToInsert)
        } else {
          editorInstance.commands.setContent(currentHtml + '<p></p>' + htmlToInsert)
        }
      }
    }

    if (mode === 'replace') {
      setValue('content', formattedContent, { shouldValidate: true, shouldDirty: true })
    } else {
      const currentMd = formValues.content || ''
      const newMd = currentMd ? `${currentMd}\n\n${formattedContent}` : formattedContent
      setValue('content', newMd, { shouldValidate: true, shouldDirty: true })
    }
  }

  // Render function for Content with JSXGraph replacing
  const renderContentWithDrawings = (content: string) => {
    if (!content) return null

    const normalizedContent = separateAdjacentMath(content)
    // Split content by [SHAPE_XXX|options] or [IMAGE_XXX|options] pattern
    const parts = normalizedContent.split(/(\[SHAPE_[a-zA-Z0-9_]+(?:\|[^\]]*)?\]|\[IMAGE_[a-zA-Z0-9_]+(?:\|[^\]]*)?\])/g)

    return parts.map((part, index) => {
      // Check if it's a shape placeholder
      const shapeMatch = part.match(/^\[(SHAPE_[a-zA-Z0-9_]+)(?:\|([^\]]+))?\]$/)
      if (shapeMatch) {
        const shapeCode = shapeMatch[1]
        const drawing = drawings.find(d => d.shapeCode === shapeCode)
        if (drawing) {
          let width: string | number = drawing.width || '100%'
          let height: string | number = drawing.height || 300
          if (shapeMatch[2]) {
            const [w, h] = shapeMatch[2].split('x')
            if (w) width = isNaN(Number(w)) ? w : Number(w)
            if (h) height = isNaN(Number(h)) ? h : Number(h)
          }
          return <JsxGraphBoard key={index} shapeCode={shapeCode} jsxGraphData={drawing.jsxGraphData} width={width} height={height} />
        }
      }

      // Check if it's an image placeholder
      const imageMatch = part.match(/^\[(IMAGE_[a-zA-Z0-9_]+)(?:\|([^\]]+))?\]$/)
      if (imageMatch) {
        const imageCode = imageMatch[1]
        const image = images.find(img => img.imageCode === `[${imageCode}]`)
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

      // Regular markdown parsing
      return (
        <ReactMarkdown
          key={index}
          remarkPlugins={[remarkMath, remarkGfm]}
          rehypePlugins={[rehypeRaw, [rehypeSanitize, sanitizeSchema], [rehypeKatex, { throwOnError: false, errorColor: '#64748b', macros: { '\\placeholder': '\\square' } }]]}
          components={markdownComponents}
        >
          {part}
        </ReactMarkdown>
      )
    })
  }

  return (
    <div className="fixed inset-0 z-[100] bg-slate-50 dark:bg-slate-950 flex flex-col overflow-hidden select-none">
      {/* TOOLBAR */}
      <div className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 flex items-center justify-between shrink-0 shadow-sm z-20">
        {/* Left: Back & Breadcrumb & Status */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleBackClick}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-sm hover:text-slate-900 dark:hover:text-slate-100 transition-all"
            title={backText}
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{backText}</span>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate max-w-[200px] sm:max-w-[300px]">
              {pageTitle}
            </span>
          </div>

          <div className="ml-4 flex items-center border-l border-slate-200 dark:border-slate-800 pl-4">
            {isAutoSaving ? (
              <span className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-500 font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                Đang lưu...
              </span>
            ) : lastSavedTime ? (
              <span className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-500 font-medium">
                <Check className="h-3.5 w-3.5" />
                Đã lưu ({formatDateTime(lastSavedTime)})
              </span>
            ) : null}
          </div>
        </div>

        {/* Right: Submit & Toolbar Options */}
        <div className="flex items-center gap-2">
          {/* Mode switch */}
          <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800/80 mr-2">
            <button
              type="button"
              onClick={() => setViewMode('edit')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'edit'
                ? 'bg-white dark:bg-slate-900 text-primary shadow-sm ring-1 ring-slate-200 dark:ring-slate-800'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-900/50'
                }`}
            >
              <Edit3 className="w-3.5 h-3.5" /> Soạn thảo
            </button>
            <button
              type="button"
              onClick={() => setViewMode('preview')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'preview'
                ? 'bg-white dark:bg-slate-900 text-primary shadow-sm ring-1 ring-slate-200 dark:ring-slate-800'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-900/50'
                }`}
            >
              <Eye className="w-3.5 h-3.5" /> Xem trước
            </button>
          </div>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleSubmit(handleDraft)}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-350 text-xs font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-750 shadow-sm border border-slate-200 dark:border-slate-700 transition-all disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            {submitDraftText}
          </button>

          {onPublishClick && (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleSubmit(handlePublish)}
              className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-xl hover:bg-primary/95 shadow-sm active:scale-98 transition-all disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              Giao bài
            </button>
          )}

          <div className="w-px h-6 bg-slate-200 dark:bg-slate-800 mx-1" />

          {/* Toggle Sidebar */}
          <button
            type="button"
            onClick={() => setShowSidebar(!showSidebar)}
            className={`flex h-9 w-9 items-center justify-center rounded-xl border transition-all ${showSidebar
              ? 'bg-primary/10 text-primary border-primary/20'
              : 'bg-background text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-900'
              }`}
            title="Cài đặt bài tập"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* BODY WORKSPACE */}
      <div className="flex-1 min-h-0 flex relative overflow-hidden bg-slate-50/50 dark:bg-slate-950/10">

        {/* Left Column: Editor Sheet Canvas */}
        <div className="flex-1 overflow-hidden p-4 sm:p-8 flex flex-col min-w-0 h-full">
          <div className="max-w-4xl mx-auto w-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl shadow-xs flex-1 flex flex-col p-6 sm:p-10 relative min-h-0 h-full">
            {viewMode === 'edit' ? (
              <>
                {/* Title */}
                <div className="relative mb-6">
                  <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Tiêu đề bài tập</label>
                  <input
                    type="text"
                    {...register('title')}
                    placeholder="Nhập tiêu đề bài tập..."
                    className={`w-full text-3xl font-extrabold bg-transparent border-none outline-none border-b border-slate-100 dark:border-slate-800 pb-3 focus:border-primary/50 transition-all placeholder:text-slate-200 dark:placeholder:text-slate-800 ${errors.title ? 'border-destructive' : ''
                      }`}
                  />
                  {errors.title && (
                    <span className="absolute left-0 -bottom-5 text-[10px] text-destructive font-medium">
                      {errors.title.message}
                    </span>
                  )}
                </div>

                {/* Content Separator Label */}
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Nội dung chi tiết</label>
                  {isAiQuestionGenEnabled && (
                    <button
                      type="button"
                      onClick={() => setShowAiModal(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm hover:shadow-indigo-500/20 active:scale-98 transition-all cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Dùng AI sinh đề bài
                    </button>
                  )}
                </div>

                {/* LaTeX Toolbar is embedded inside CKEditor Component */}

                {/* Content CKEditor */}
                <div className="flex-1 flex flex-col relative min-h-0 h-full">
                  {errors.content && (
                    <span className="absolute right-0 -top-6 bg-destructive/10 text-destructive px-2 py-0.5 rounded text-[11px] font-medium border border-destructive/20 z-10">
                      {errors.content.message}
                    </span>
                  )}
                  <TiptapEditor
                    value={formValues.content || ''}
                    onReady={(editor) => setEditorInstance(editor)}
                    onChange={(newVal) => setValue('content', newVal, { shouldValidate: isSubmitted, shouldDirty: true })}
                    onUploadImage={handleImageUploadFromEditor}
                    onUploadFile={processFileUpload}
                    images={images}
                    placeholder="Soạn thảo nội dung bài tập ở đây (hỗ trợ chèn công thức toán học từ thanh công cụ)..."
                  />
                </div>
              </>
            ) : (
              /* Preview Mode */
              <div className="space-y-6 flex-1 flex flex-col min-h-0">
                <div className="border-b border-slate-100 dark:border-slate-800 pb-4 shrink-0">
                  <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-50">
                    {watch('title') || <span className="text-slate-300 dark:text-slate-700 italic">Chưa nhập tiêu đề</span>}
                  </h1>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                    {watch('description')}
                  </p>
                </div>
                <div className="flex-1 min-h-0 prose prose-slate dark:prose-invert prose-sm sm:prose-base max-w-none overflow-y-auto pr-2">
                  {debouncedContentValue ? (
                    renderContentWithDrawings(debouncedContentValue)
                  ) : (
                    <p className="text-slate-400 dark:text-slate-600 italic text-sm mt-0">Nội dung xem trước sẽ hiển thị ở đây...</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Backdrop for Mobile Sidebar */}
        {showSidebar && (
          <div
            onClick={() => setShowSidebar(false)}
            className="fixed inset-0 bg-slate-900/25 backdrop-blur-xs z-30 lg:hidden"
          />
        )}

        {/* Right Settings Sidebar */}
        <aside className={`fixed inset-y-0 right-0 z-40 w-80 border-l border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col h-full shadow-2xl transition-transform duration-300 lg:static lg:shadow-none lg:translate-x-0 ${showSidebar ? 'translate-x-0' : 'translate-x-full lg:hidden'
          }`}>
          {/* Sidebar Header */}
          <div className="h-14 px-4 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900 shrink-0">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Cấu hình bài tập</span>
            <button
              type="button"
              onClick={() => setShowSidebar(false)}
              className="lg:hidden p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Sidebar Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Section 1: Thông tin chung */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Thông tin chung</h3>
              <div className="space-y-1 relative">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Mô tả ngắn gọn (Tùy chọn)</label>
                <textarea
                  {...register('description')}
                  placeholder="Mô tả tóm tắt nội dung bài tập này cho học sinh..."
                  rows={4}
                  className={`w-full px-3 py-2 text-sm rounded-xl border bg-slate-50/30 dark:bg-slate-950/20 text-slate-800 dark:text-slate-200 outline-none transition-all focus:bg-white dark:focus:bg-slate-950/40 focus:ring-2 focus:ring-primary/10 ${errors.description ? 'border-destructive focus:border-destructive' : 'border-slate-200 dark:border-slate-800 focus:border-primary'
                    }`}
                />
                {errors.description && (
                  <span className="text-[10px] text-destructive font-medium block mt-0.5">{errors.description.message}</span>
                )}
              </div>
            </div>

            <div className="h-px bg-slate-100 dark:bg-slate-850" />

            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Phân loại bài tập</h3>
              <AssignmentTagInput value={formValues.tagNames || []} onChange={tagNames => setValue('tagNames', tagNames, { shouldDirty: true })} />
              <p className="text-xs text-slate-500">Cần có ít nhất 1 tag để đăng lên Thư viện cộng đồng.</p>
            </div>

            <div className="h-px bg-slate-100 dark:bg-slate-850" />

            {/* Section 2: Tài nguyên học liệu */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Thư viện tài nguyên</h3>

              {/* JSXGraph & Image Section */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 block">Hình vẽ, Đồ thị & Ảnh</span>

                {/* Upload Image Button */}
                <button
                  type="button"
                  disabled={viewMode === 'preview' || isUploading}
                  onClick={() => setMediaModalState({ isOpen: true, mode: 'image' })}
                  className={`w-full py-2 px-3 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center gap-1.5 transition-all text-xs font-semibold border border-emerald-200 dark:border-emerald-900/50 cursor-pointer ${viewMode === 'preview' || isUploading ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''
                    }`}
                  title={viewMode === 'preview' ? 'Quay lại soạn thảo để thêm ảnh' : undefined}
                >
                  {isUploading ? (
                    <span className="w-3.5 h-3.5 border-2 border-emerald-600 dark:border-emerald-400 border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    <ImagePlus className="w-3.5 h-3.5" />
                  )}
                  Thêm ảnh
                </button>

                {/* Uploaded Images List */}
                {images.length > 0 && (
                  <div className="space-y-1.5 my-2 max-h-[150px] overflow-y-auto">
                    {images.map(img => (
                      <div key={img.imageCode} className="flex items-center justify-between p-2 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-950/10 hover:bg-slate-50 dark:hover:bg-slate-950/30 transition-all group">
                        <button
                          type="button"
                          disabled={viewMode === 'preview'}
                          onClick={() => handleInsertImage(img.imageCode)}
                          className="text-xs font-semibold text-slate-700 dark:text-slate-350 hover:text-primary dark:hover:text-primary transition-colors truncate max-w-[170px] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                          title="Nhấp để chèn vào vị trí con trỏ"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={img.imageUrl} alt={img.imageCode} className="w-5 h-5 rounded object-cover border border-slate-200 dark:border-slate-700 shrink-0" />
                          <span className="truncate">{img.imageCode}</span>
                        </button>
                        <button
                          type="button"
                          disabled={viewMode === 'preview'}
                          onClick={() => handleDeleteImage(img.imageCode)}
                          className="p-1 text-slate-400 hover:text-destructive hover:bg-destructive/10 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed opacity-0 group-hover:opacity-100"
                          title="Xóa ảnh"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Graph / Drawing Button */}
                <button
                  type="button"
                  title={viewMode === 'preview' ? 'Quay lại soạn thảo để thêm đồ thị' : undefined}
                  disabled={viewMode === 'preview'}
                  onClick={(e) => {
                    e.preventDefault();
                    setEditingShape(null);
                    setShowJsxGraphModal(true);
                  }}
                  className="w-full py-2 px-3 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/20 dark:hover:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center gap-1.5 transition-all text-xs font-semibold border border-blue-200 dark:border-blue-900/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-50"
                >
                  <CircleDot className="w-3.5 h-3.5" />
                  Thêm hình vẽ đồ thị
                </button>

                {drawings.length > 0 ? (
                  <div className="space-y-1.5 mt-2 max-h-[200px] overflow-y-auto">
                    {drawings.map(d => (
                      <div key={d.shapeCode} className="flex items-center justify-between p-2 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-950/10 hover:bg-slate-50 dark:hover:bg-slate-950/30 transition-all group">
                        <button
                          type="button"
                          disabled={viewMode === 'preview'}
                          onClick={() => handleInsertDrawing(d.shapeCode)}
                          className="text-xs font-semibold text-slate-700 dark:text-slate-350 hover:text-primary dark:hover:text-primary transition-colors truncate max-w-[170px] disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Nhấp để chèn vào vị trí con trỏ"
                        >
                          {d.shapeCode} {d.width || d.height ? `(${d.width || '100%'}x${d.height || '300'})` : ''}
                        </button>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            disabled={viewMode === 'preview'}
                            onClick={() => handleEditDrawing(d.shapeCode)}
                            className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Sửa hình vẽ"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={viewMode === 'preview'}
                            onClick={() => handleDeleteDrawing(d.shapeCode)}
                            className="p-1 text-slate-400 hover:text-destructive hover:bg-destructive/10 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Xóa hình vẽ"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 italic mt-1">Chưa có hình vẽ JSXGraph nào.</p>
                )}
              </div>


              {/* HDSD Note */}
              <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                💡 <b>Mẹo:</b> Thiết lập kích thước mong muốn ở trên, sau đó nhấp vào hình vẽ hoặc ảnh để chèn mã tương ứng (ví dụ: <code className="text-primary font-mono">{`[SHAPE_1|500x250]`}</code>, <code className="text-primary font-mono">{`[IMAGE_1|300xauto]`}</code>) vào vị trí con trỏ.
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Leave Confirmation Modal */}
      {showLeaveModal && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">Hủy bỏ các thay đổi?</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Bạn có chắc chắn muốn quay lại không? Các thông tin bạn vừa nhập có thể bị mất.
              </p>
            </div>
            <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-950/40 border-t border-slate-200 dark:border-slate-800 justify-end">
              <button
                onClick={() => setShowLeaveModal(false)}
                className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 bg-slate-100 dark:bg-slate-900 rounded-xl transition-colors"
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

      {/* Upload Confirmation Modal */}
      {showUploadConfirmModal && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 pb-2">
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Tải nội dung file</h3>
              <button
                onClick={() => {
                  setShowUploadConfirmModal(false)
                  setPendingUploadData(null)
                  setPendingUploadFile(null)
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                title="Đóng"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 pb-6 pt-2">
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Bạn muốn <b>thay thế toàn bộ</b> dữ liệu cũ bằng file này, hay muốn <b>bổ sung thêm</b> dữ liệu mới vào cuối bài tập hiện tại?
              </p>
            </div>
            <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-950/40 border-t border-slate-200 dark:border-slate-800 justify-end">
              <button
                onClick={() => handleConfirmUpload('replace')}
                className="px-4 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors shadow-sm"
              >
                Thay thế
              </button>
              <button
                onClick={() => handleConfirmUpload('append')}
                className="px-4 py-2 text-sm font-semibold text-white bg-primary hover:bg-primary/90 rounded-xl transition-colors shadow-sm"
              >
                Bổ sung
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Media & Upload Modal */}
      <MediaUploadModal
        isOpen={mediaModalState.isOpen}
        initialMode={mediaModalState.mode}
        onClose={() => setMediaModalState(prev => ({ ...prev, isOpen: false }))}
        onUploadImage={handleImageUploadFromEditor}
        onUploadFile={processFileUpload}
        onInsertLink={handleInsertLink}
        isUploading={isUploading || isUploadingFile}
      />

      {/* JSXGraph Editor Modal */}
      <JsxGraphEditorModal
        open={showJsxGraphModal}
        onClose={() => {
          setShowJsxGraphModal(false)
          setEditingShape(null)
        }}
        onConfirm={handleConfirmJsxGraph}
        initialData={editingShape?.jsxGraphData}
        initialWidth={editingShape ? drawings.find(d => d.shapeCode === editingShape.shapeCode)?.width : undefined}
        initialHeight={editingShape ? drawings.find(d => d.shapeCode === editingShape.shapeCode)?.height : undefined}
      />

      {/* AI Question Generator Modal */}
      <AiQuestionGeneratorModal
        isOpen={showAiModal}
        onClose={() => setShowAiModal(false)}
        onInsertQuestion={handleInsertAiQuestion}
      />
    </div>
  )
}
