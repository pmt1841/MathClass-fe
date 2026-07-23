'use client'

import React, { useState, useEffect } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { MessageSquarePlus } from 'lucide-react'
import { LatexToolbar } from '@/components/ui/latex-toolbar'
import { useTextEditor } from '@/hooks/use-text-editor'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import remarkGfm from 'remark-gfm'
import rehypeKatex from 'rehype-katex'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize from 'rehype-sanitize'
import { sanitizeSchema } from '@/lib/markdown'
import { markdownComponents } from '@/components/ui/markdown-components'
import 'katex/dist/katex.min.css'

interface InlineCommentPopoverProps {
  onAddComment: (content: string) => Promise<void>
  isAdding: boolean
  position: { top: number; left: number } | null
  onClose: () => void
}

export function InlineCommentPopover({ onAddComment, isAdding, position, onClose }: InlineCommentPopoverProps) {
  const [content, setContent] = useState('')
  const [isOpen, setIsOpen] = useState(false)

  const textareaRef = React.useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (position) {
      setIsOpen(true)
      setTimeout(() => textareaRef.current?.focus(), 100)
    } else {
      setIsOpen(false)
      setContent('')
    }
  }, [position])

  const handleAdd = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (!content.trim()) return
    try {
      await onAddComment(content)
      setContent('')
      onClose()
    } catch (err) {
      // Error handled by parent
    }
  }

  const { handleFormatText, handleInsertLatex } = useTextEditor({
    textareaRef,
    content,
    onChange: setContent
  })

  if (!position) return null

  return (
    <div
      className="absolute z-50"
      style={{ top: position.top, left: position.left }}
    >
      <Popover open={isOpen} onOpenChange={(open) => {
        setIsOpen(open)
        if (!open) onClose()
      }}>
        <PopoverTrigger asChild>
          <Button size="icon" variant="default" className="h-8 w-8 rounded-full shadow-lg bg-blue-600 hover:bg-blue-700 animate-in fade-in zoom-in duration-200">
            <MessageSquarePlus className="h-4 w-4 text-white" />
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-[90vw] max-w-[420px] max-h-[var(--radix-popover-content-available-height)] p-3 shadow-xl z-[9999] overflow-hidden flex flex-col" 
          align="start" 
          side="top"
          sideOffset={6}
          collisionPadding={8}
          avoidCollisions={true}
          onInteractOutside={(e) => {
            if (isAdding) {
              e.preventDefault()
            }
          }}
        >
          <div className="flex flex-col h-full max-h-full overflow-hidden gap-2">
            <h4 className="font-semibold text-sm text-slate-800 shrink-0">Thêm nhận xét</h4>
            
            <div className="flex-1 min-h-0 overflow-y-auto space-y-2 pr-0.5">
              <div className="border border-slate-300 rounded-md overflow-hidden focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-blue-500">
                <LatexToolbar onInsert={handleInsertLatex} onFormatText={handleFormatText} />
                <Textarea
                  ref={textareaRef}
                  placeholder="Nhập nội dung nhận xét..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="min-h-[50px] max-h-[80px] text-sm border-0 focus-visible:ring-0 rounded-none resize-none p-2"
                />
              </div>

              <div className="px-2 py-1 bg-slate-50 rounded border border-slate-200 text-xs text-slate-600 flex items-center gap-1.5 overflow-hidden h-7 shrink-0">
                <span className="font-medium text-slate-500 shrink-0 select-none">Xem trước:</span>
                <div className="line-clamp-1 text-slate-700 flex-1 [&_p]:inline [&_p]:m-0 [&_p]:p-0 truncate">
                  {content.trim() ? (
                    <ReactMarkdown
                      remarkPlugins={[remarkMath, remarkGfm]}
                      rehypePlugins={[rehypeRaw, [rehypeSanitize, sanitizeSchema], rehypeKatex]}
                      components={markdownComponents}
                    >
                      {content}
                    </ReactMarkdown>
                  ) : (
                    <span className="text-slate-400 italic">Chưa có nội dung...</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 shrink-0 pt-2 border-t border-slate-100 bg-white">
              <Button variant="outline" size="sm" onClick={onClose} disabled={isAdding} className="h-7 text-xs px-3">
                Hủy
              </Button>
              <Button size="sm" onClick={handleAdd} disabled={!content.trim() || isAdding} className="h-7 text-xs px-3 bg-blue-600 hover:bg-blue-700">
                {isAdding ? 'Đang lưu...' : 'Nhận xét'}
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
