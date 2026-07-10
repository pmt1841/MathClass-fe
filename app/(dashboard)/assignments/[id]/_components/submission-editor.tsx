'use client'

import { useState, useEffect, useRef } from 'react'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize from 'rehype-sanitize'
import { sanitizeSchema } from '@/lib/markdown'
import 'katex/dist/katex.min.css'
import { LatexToolbar } from '@/components/ui/latex-toolbar'
import { useTextEditor } from '@/hooks/use-text-editor'
import { formatDateTime } from '@/lib/utils'
import { Save, Check, Type, Eye } from 'lucide-react'

interface SubmissionEditorProps {
  assignmentId: number
  initialContent?: string
  onChange?: (content: string) => void
  readOnly?: boolean
  isSavingExternal?: boolean
  lastSavedExternal?: Date | null
  onAutoSave?: (content: string) => Promise<void>
  teacherFeedback?: string
}

export function SubmissionEditor({
  assignmentId,
  initialContent = '',
  onChange,
  readOnly = false,
  isSavingExternal,
  lastSavedExternal,
  onAutoSave,
  teacherFeedback
}: SubmissionEditorProps) {
  const [content, setContent] = useState(initialContent)
  const [debouncedContent, setDebouncedContent] = useState(initialContent)

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const isDirtyRef = useRef(false)
  const onChangeRef = useRef(onChange)

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  // Reset dirty state when assignment changes
  useEffect(() => {
    isDirtyRef.current = false
  }, [assignmentId])

  // Cập nhật content nếu initialContent từ bên ngoài thay đổi (e.g. fetch API xong)
  useEffect(() => {
    if (initialContent !== undefined && !isDirtyRef.current) {
      setContent(initialContent)
      setDebouncedContent(initialContent)
    }
  }, [initialContent])

  // Debounce for preview
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedContent(content)
    }, 300)
    return () => clearTimeout(timer)
  }, [content])



  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value
    isDirtyRef.current = true
    setContent(val)
    if (onChangeRef.current) {
      onChangeRef.current(val)
    }
  }

  const { handleFormatText, handleInsertLatex } = useTextEditor({
    textareaRef,
    content,
    onChange: (newVal) => {
      isDirtyRef.current = true
      setContent(newVal)
      if (onChangeRef.current) {
        onChangeRef.current(newVal)
      }
    }
  })

  const isSaving = isSavingExternal
  const lastSaved = lastSavedExternal

  return (
    <div className={`h-full w-full flex flex-col bg-white rounded-2xl border border-border overflow-hidden shadow-sm ${readOnly ? 'opacity-90' : ''}`}>
      {teacherFeedback && (
        <div className="bg-sky-50 border-b border-sky-200 p-4 shrink-0">
          <h4 className="text-sky-800 font-semibold mb-2 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-sky-200 flex items-center justify-center text-sky-800 text-xs">i</span>
            Nhận xét từ giáo viên
          </h4>
          <div className="prose prose-slate prose-sm max-w-none text-sky-900">
            <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeRaw, [rehypeSanitize, sanitizeSchema], rehypeKatex]}>
              {teacherFeedback}
            </ReactMarkdown>
          </div>
        </div>
      )}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-slate-50 shrink-0">
        <h3 className="font-semibold text-slate-800 flex items-center gap-2">
          <Type className="h-4 w-4 text-primary" />
          Khu vực làm bài {readOnly && <span className="text-xs text-rose-500 font-normal bg-rose-50 px-2 py-0.5 rounded-full ml-2 border border-rose-100">Chỉ xem</span>}
        </h3>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          {isSaving ? (
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
              Đang lưu...
            </span>
          ) : lastSaved ? (
            <span className="flex items-center gap-1.5 text-emerald-600">
              <Check className="h-3 w-3" />
              Đã lưu ({formatDateTime(lastSaved)})
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <PanelGroup direction="vertical">
          <Panel defaultSize={50} minSize={20} className="flex flex-col">
            {!readOnly && <LatexToolbar onInsert={handleInsertLatex} onFormatText={handleFormatText} />}
            <textarea
              ref={textareaRef}
              value={content}
              onChange={handleChange}
              readOnly={readOnly}
              placeholder={readOnly ? "Bài nộp đã khóa." : "Nhập bài làm của bạn tại đây... Hỗ trợ Markdown và công thức toán học LaTeX (ví dụ: $$x = \\frac{-b \\pm \\sqrt{\\Delta}}{2a}$$)"}
              className={`w-full h-full flex-1 p-4 resize-none outline-none text-slate-700 leading-relaxed font-mono text-sm bg-transparent ${readOnly ? 'cursor-not-allowed bg-slate-50/50' : ''}`}
            />
          </Panel>

          <PanelResizeHandle className="h-2 bg-slate-50 border-y border-border hover:bg-slate-200 transition-colors cursor-row-resize flex items-center justify-center">
            <div className="w-8 h-1 rounded-full bg-slate-300" />
          </PanelResizeHandle>

          <Panel defaultSize={50} minSize={20} className="bg-slate-50/50">
            <div className="h-full flex flex-col">
              <div className="px-4 py-2 border-b border-border/50 bg-slate-100/50 text-xs font-semibold text-slate-500 flex items-center gap-2">
                <Eye className="h-3.5 w-3.5" />
                Xem trước
              </div>
              <div className="flex-1 p-4 overflow-y-auto prose prose-slate max-w-none prose-sm">
                {debouncedContent ? (
                  <ReactMarkdown
                    remarkPlugins={[remarkMath]}
                    rehypePlugins={[rehypeRaw, [rehypeSanitize, sanitizeSchema], rehypeKatex]}
                  >
                    {debouncedContent}
                  </ReactMarkdown>
                ) : (
                  <p className="text-slate-400 italic mt-0">Nội dung xem trước sẽ hiển thị ở đây...</p>
                )}
              </div>
            </div>
          </Panel>
        </PanelGroup>
      </div>
    </div>
  )
}
