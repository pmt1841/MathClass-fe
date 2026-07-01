'use client'

import React, { useState, useEffect } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { MessageSquarePlus } from 'lucide-react'
import { LatexToolbar } from '@/components/ui/latex-toolbar'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
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

  const handleAdd = async () => {
    if (!content.trim()) return
    await onAddComment(content)
    setContent('')
    onClose()
  }

  const handleInsertLatex = (latexCommand: string) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const before = content.substring(0, start)
    const after = content.substring(end)
    const selectedText = content.substring(start, end)

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
    setContent(newVal)

    setTimeout(() => {
      textarea.focus()
      let newCursorPos = start + insertText.length
      const emptyBrackets = insertText.indexOf('{ }')
      if (emptyBrackets !== -1) {
        newCursorPos = start + emptyBrackets + 1
      } else if (!isInsideMath && !selectedText) {
        newCursorPos = isMathBlock ? start + insertText.length - 4 : start + insertText.length - 3
      }
      textarea.setSelectionRange(newCursorPos, newCursorPos)
    }, 0)
  }

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
        <PopoverContent className="w-[500px] p-4 shadow-xl" align="start" sideOffset={10}>
          <div className="space-y-3 w-full">
            <h4 className="font-semibold text-sm text-slate-800">Thêm nhận xét</h4>
            <div className="border border-slate-300 rounded-md overflow-hidden focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-blue-500">
              <LatexToolbar onInsert={handleInsertLatex} />
              <Textarea
                ref={textareaRef}
                placeholder="Nhập nội dung nhận xét... Có thể dùng LaTeX"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[80px] max-h-[140px] overflow-y-auto text-sm border-0 focus-visible:ring-0 rounded-none resize-none p-3"
              />
            </div>
            {content && (
              <div className="p-2 bg-slate-50 rounded border border-slate-100 text-sm max-h-[100px] overflow-y-auto">
                <ReactMarkdown
                  remarkPlugins={[remarkMath]}
                  rehypePlugins={[rehypeKatex]}
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
