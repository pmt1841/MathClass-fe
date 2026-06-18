'use client'

import React, { useState, useEffect, useRef } from 'react'
import { ArrowLeft, ChevronRight, Save, Send, Eye, XCircle, CheckCircle, Check, CircleDot, Edit3, X, Type, FileText } from 'lucide-react'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import dynamic from 'next/dynamic'
import { LatexToolbar } from '@/components/ui/latex-toolbar'
import { CountdownTimer } from './countdown-timer'

const JsxGraphEditorModal = dynamic(() => import('@/components/ui/jsxgraph-editor-modal').then(mod => mod.JsxGraphEditorModal), { ssr: false })
const JsxGraphBoard = dynamic(() => import('@/components/ui/jsxgraph-board').then(mod => mod.JsxGraphBoard), { ssr: false })

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

export const embedDrawings = (content: string, drawings: any[]) => {
  if (!drawings || drawings.length === 0) return content
  let newContent = content.replace(/\n\n<!-- DRAWINGS_DATA_START[\s\S]*?DRAWINGS_DATA_END -->/g, '')
  newContent += `\n\n<!-- DRAWINGS_DATA_START\n${JSON.stringify(drawings)}\nDRAWINGS_DATA_END -->`
  return newContent
}

interface StudentAssignmentLayoutProps {
  assignment: {
    title: string
    description: string
    content: string
    deadline: string
  }
  submissionContent: string
  setSubmissionContent: (val: string) => void
  isReadOnly: boolean
  isSavingExternal: boolean
  lastSavedExternal: Date | null
  onSaveDraft: () => void
  onSubmit: () => void
  onUnsubmit: () => void
  submissionStatus: 'DRAFT' | 'SUBMITTED' | 'GRADED' | 'LATE' | null
  submissionScore: number | null
  teacherFeedback: string
  onBack: () => void
  fromText: string
  onAutoSave: (content: string) => Promise<void>
}

export function StudentAssignmentLayout({
  assignment,
  submissionContent,
  setSubmissionContent,
  isReadOnly,
  isSavingExternal,
  lastSavedExternal,
  onSaveDraft,
  onSubmit,
  onUnsubmit,
  submissionStatus,
  submissionScore,
  teacherFeedback,
  onBack,
  fromText,
  onAutoSave
}: StudentAssignmentLayoutProps) {
  const [activeTab, setActiveTab] = useState<'ASSIGNMENT' | 'PREVIEW'>('ASSIGNMENT')

  const [studentDrawings, setStudentDrawings] = useState<any[]>([])
  const [editingShape, setEditingShape] = useState<{ shapeCode: string, jsxGraphData: any } | null>(null)
  const [showJsxGraphModal, setShowJsxGraphModal] = useState(false)
  const [debouncedContent, setDebouncedContent] = useState(submissionContent)
  
  // Extract student drawings ONLY on first load if we have submissionContent
  const isLoaded = useRef(false)
  useEffect(() => {
    if (!isLoaded.current && submissionContent) {
      const { content, extractedDrawings } = extractDrawings(submissionContent)
      setStudentDrawings(extractedDrawings || [])
      setDebouncedContent(content)
      isLoaded.current = true
    }
  }, [submissionContent])

  // Content without drawings appended
  const [pureContent, setPureContent] = useState(() => extractDrawings(submissionContent).content)

  // Auto update pureContent when parent changes submissionContent from outside
  useEffect(() => {
    if (isLoaded.current) {
      const { content } = extractDrawings(submissionContent)
      if (content !== pureContent) {
        setPureContent(content)
      }
    }
  }, [submissionContent])

  // Debounce for preview
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedContent(pureContent)
    }, 300)
    return () => clearTimeout(timer)
  }, [pureContent])

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isDirtyRef = useRef(false)

  // Bubble up content with drawings to parent whenever it changes
  useEffect(() => {
    if (isLoaded.current && isDirtyRef.current) {
      const newFullContent = embedDrawings(pureContent, studentDrawings)
      setSubmissionContent(newFullContent)
      
      // Auto save after typing
      if (!isReadOnly && onAutoSave) {
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
        saveTimeoutRef.current = setTimeout(() => {
          onAutoSave(newFullContent)
          isDirtyRef.current = false
        }, 5000)
      }
    }
  }, [pureContent, studentDrawings])

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    isDirtyRef.current = true
    setPureContent(e.target.value)
  }

  const handleInsertLatex = (latexCommand: string) => {
    if (isReadOnly || !textareaRef.current) return

    const textarea = textareaRef.current
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const currentVal = pureContent

    const before = currentVal.substring(0, start)
    const after = currentVal.substring(end)
    const selectedText = currentVal.substring(start, end)

    const countDoubleDollar = (before.match(/\$\$/g) || []).length
    const countSingleDollar = (before.replace(/\$\$/g, '').match(/\$/g) || []).length
    const isInsideMath = (countDoubleDollar % 2 !== 0) || (countSingleDollar % 2 !== 0)

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

    isDirtyRef.current = true
    setPureContent(newVal)

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

      if (textareaRef.current) {
        const textarea = textareaRef.current
        const start = textarea.selectionStart
        const end = textarea.selectionEnd
        const before = pureContent.substring(0, start)
        const after = pureContent.substring(end)

        const insertText = `[${shapeCode}]`
        const newVal = before + insertText + after
        setPureContent(newVal)

        setTimeout(() => {
          textarea.focus()
          const newCursorPos = start + insertText.length
          textarea.setSelectionRange(newCursorPos, newCursorPos)
        }, 0)
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
  }

  const handleInsertDrawing = (shapeCode: string) => {
    if (textareaRef.current) {
      isDirtyRef.current = true
      const textarea = textareaRef.current
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const before = pureContent.substring(0, start)
      const after = pureContent.substring(end)

      const insertText = `[${shapeCode}]`
      const newVal = before + insertText + after
      setPureContent(newVal)

      setTimeout(() => {
        textarea.focus()
        const newCursorPos = start + insertText.length
        textarea.setSelectionRange(newCursorPos, newCursorPos)
      }, 0)
    } else {
      isDirtyRef.current = true
      setPureContent(pureContent + `\n[${shapeCode}]`)
    }
  }

  const renderContentWithDrawings = (rawContent: string, drawingList: any[]) => {
    if (!rawContent) return null
    
    // We already passed pureContent, so it shouldn't have JSON embedded. 
    // Just replace tags.
    const parts = rawContent.split(/(\[SHAPE_[a-zA-Z0-9_]+\])/g)

    return parts.map((part, index) => {
      const match = part.match(/^\[(SHAPE_[a-zA-Z0-9_]+)\]$/)
      if (match) {
        const shapeCode = match[1]
        const drawing = drawingList.find(d => d.shapeCode === shapeCode)
        if (drawing) {
          return <JsxGraphBoard key={index} shapeCode={shapeCode} jsxGraphData={drawing.jsxGraphData} />
        }
      }

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

  const isPastDeadline = assignment.deadline ? new Date() > new Date(assignment.deadline) : false
  const isGraded = submissionScore !== null

  return (
    <div className="fixed inset-0 z-50 bg-slate-100 flex flex-col overflow-hidden">
      {/* TOOLBAR */}
      <div className="h-14 bg-white border-b border-border px-4 flex items-center justify-between shrink-0 shadow-sm z-10">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 border border-slate-200 text-slate-600 hover:bg-white hover:border-slate-300 hover:shadow-sm hover:text-slate-900 transition-all"
            title="Quay lại"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="hidden sm:flex items-center gap-2 text-sm text-slate-500 font-medium">
            <span className="hover:text-slate-800 transition-colors cursor-pointer" onClick={onBack}>
              {fromText}
            </span>
            <ChevronRight className="h-4 w-4 text-slate-400" />
            <span className="text-slate-900 truncate max-w-[300px]" title={assignment.title}>
              {assignment.title}
            </span>
          </div>
        </div>

        <div className="flex-1 flex justify-center">
          {assignment.deadline && (
            <CountdownTimer deadline={assignment.deadline} />
          )}
        </div>

        <div className="flex items-center gap-3">
          {isSavingExternal ? (
            <span className="hidden sm:flex items-center gap-1.5 text-xs text-amber-600 font-medium mr-2">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
              Đang lưu nháp...
            </span>
          ) : lastSavedExternal ? (
            <span className="hidden sm:flex items-center gap-1.5 text-xs text-emerald-600 font-medium mr-2">
              <Check className="h-3 w-3" />
              Đã lưu ({`${lastSavedExternal.getHours().toString().padStart(2, '0')}:${lastSavedExternal.getMinutes().toString().padStart(2, '0')}:${lastSavedExternal.getSeconds().toString().padStart(2, '0')} ${lastSavedExternal.getDate().toString().padStart(2, '0')}/${(lastSavedExternal.getMonth() + 1).toString().padStart(2, '0')}/${lastSavedExternal.getFullYear()}`})
            </span>
          ) : null}

          {isGraded && (
            <span className="text-sm font-semibold text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-200">
              Điểm của bạn: {submissionScore}
            </span>
          )}

          {!isPastDeadline && !isGraded && (
            <>
              {submissionStatus !== 'SUBMITTED' ? (
                <>
                  <button
                    onClick={() => {
                       isDirtyRef.current = true; // force save
                       onSaveDraft();
                    }}
                    disabled={isSavingExternal}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-200 shadow-sm transition-all disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    Lưu nháp
                  </button>
                  <button
                    onClick={onSubmit}
                    disabled={isSavingExternal}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 shadow-sm active:scale-95 transition-all disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    Nộp bài
                  </button>
                </>
              ) : (
                <button
                  onClick={onUnsubmit}
                  disabled={isSavingExternal}
                  className="flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-600 border border-rose-200 text-sm font-semibold rounded-lg hover:bg-rose-100 shadow-sm transition-all disabled:opacity-50"
                >
                  <XCircle className="h-4 w-4" />
                  Hủy nộp bài
                </button>
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
          {teacherFeedback && (
             <div className="mt-2 bg-sky-50 border border-sky-200 p-3 rounded-lg">
               <h4 className="text-sky-800 font-semibold mb-1 flex items-center gap-2 text-sm">
                 <span className="w-4 h-4 rounded-full bg-sky-200 flex items-center justify-center text-sky-800 text-[10px]">i</span>
                 Nhận xét từ giáo viên
               </h4>
               <div className="prose prose-slate prose-sm max-w-none text-sky-900">
                 <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                   {teacherFeedback}
                 </ReactMarkdown>
               </div>
             </div>
          )}
        </div>

        {/* ROW 2: Editor and Preview Split */}
        <div className="flex-1 min-h-0 relative">
          <PanelGroup direction="horizontal" className="h-full w-full">
            
            {/* EDITOR */}
            <Panel defaultSize={50} minSize={20} className={`bg-white rounded-2xl border shadow-sm flex flex-col overflow-hidden mr-2 focus-within:ring-2 focus-within:ring-primary/15 transition-all ${isReadOnly ? 'bg-slate-50 opacity-90 border-slate-200' : 'border-border focus-within:border-primary'}`}>
              <div className="bg-slate-50 px-4 py-2 border-b border-border text-xs font-semibold text-slate-600 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <Edit3 className="w-3.5 h-3.5" /> Bài làm của bạn
                </div>
                {!isReadOnly && (
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
                    Thêm hình vẽ JSXGraph
                  </button>
                )}
              </div>

              {!isReadOnly && <LatexToolbar onInsert={handleInsertLatex} />}
              
              {/* Danh sách hình vẽ của học sinh */}
              {studentDrawings.length > 0 && (
                <div className="bg-slate-50 border-b border-border px-4 py-2 flex flex-wrap gap-2 items-center shrink-0">
                  <span className="text-xs font-semibold text-slate-500 mr-1">Hình vẽ của bạn:</span>
                  {studentDrawings.map(d => (
                    <div key={d.shapeCode} className="flex items-center gap-1 bg-white border border-slate-200 shadow-sm rounded-md overflow-hidden group">
                      <button 
                        type="button"
                        onClick={() => handleInsertDrawing(d.shapeCode)}
                        className="px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors"
                        title={`Chèn ${d.shapeCode} vào văn bản`}
                        disabled={isReadOnly}
                      >
                        {d.shapeCode}
                      </button>
                      {!isReadOnly && (
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
              <textarea
                ref={textareaRef}
                value={pureContent}
                onChange={handleContentChange}
                readOnly={isReadOnly}
                placeholder={isReadOnly ? "Bài nộp đã khóa." : "Nhập nội dung bài làm...\\nHỗ trợ LaTeX: $$ x = \\frac{-b \\pm \\sqrt{\\Delta}}{2a} $$"}
                className={`flex-1 w-full p-4 text-sm outline-none resize-none font-mono leading-relaxed ${isReadOnly ? 'bg-transparent text-slate-500 cursor-not-allowed' : 'bg-transparent'}`}
              />
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
                  className={`flex items-center gap-2 px-5 py-3 text-xs font-semibold transition-colors border-b-2 ${
                    activeTab === 'ASSIGNMENT' 
                      ? 'border-primary text-primary bg-white' 
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100/50'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" /> ĐỀ BÀI
                </button>
                <button
                  onClick={() => setActiveTab('PREVIEW')}
                  className={`flex items-center gap-2 px-5 py-3 text-xs font-semibold transition-colors border-b-2 ${
                    activeTab === 'PREVIEW' 
                      ? 'border-primary text-primary bg-white' 
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100/50'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" /> XEM TRƯỚC BÀI LÀM
                </button>
              </div>

              <div className="flex-1 w-full p-6 prose prose-slate prose-sm max-w-none overflow-y-auto">
                {activeTab === 'ASSIGNMENT' ? (
                  <>
                    {(() => {
                      if (!assignment.content) return "Không có nội dung chi tiết."
                      const { content, extractedDrawings } = extractDrawings(assignment.content)
                      return renderContentWithDrawings(content, extractedDrawings)
                    })()}
                  </>
                ) : (
                  <>
                    {debouncedContent ? (
                      renderContentWithDrawings(debouncedContent, studentDrawings)
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
    </div>
  )
}
