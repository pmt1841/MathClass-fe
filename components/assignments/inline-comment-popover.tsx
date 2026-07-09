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
import rehypeKatex from 'rehype-katex'
import rehypeRaw from 'rehype-raw'
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
          className="w-[500px] p-4 shadow-xl" 
          align="start" 
          sideOffset={10}
          onInteractOutside={(e) => {
            if (isAdding) {
              e.preventDefault()
            }
          }}
        >
          <div className="space-y-3 w-full">
            <h4 className="font-semibold text-sm text-slate-800">Thêm nhận xét</h4>
            <div className="border border-slate-300 rounded-md overflow-hidden focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-blue-500">
              <LatexToolbar onInsert={handleInsertLatex} onFormatText={handleFormatText} />
              <Textarea
                ref={textareaRef}
                placeholder="Nhập nội dung nhận xét..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[80px] max-h-[140px] overflow-y-auto text-sm border-0 focus-visible:ring-0 rounded-none resize-none p-3"
              />
            </div>
            {content && (
              <div className="p-2 bg-slate-50 rounded border border-slate-100 text-sm max-h-[100px] overflow-y-auto">
                <ReactMarkdown
                  remarkPlugins={[remarkMath]}
                  rehypePlugins={[rehypeKatex, rehypeRaw]}
                >
                  {content}
                </ReactMarkdown>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={onClose} disabled={isAdding}>
                Hủy
              </Button>
              <Button size="sm" onClick={handleAdd} disabled={!content.trim() || isAdding}>
                {isAdding ? 'Đang lưu...' : 'Nhận xét'}
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
