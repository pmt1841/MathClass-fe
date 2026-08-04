'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Link } from '@tiptap/extension-link'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableHeader } from '@tiptap/extension-table-header'
import { TableCell } from '@tiptap/extension-table-cell'
import Image from '@tiptap/extension-image'
import { markdownToHtml, htmlToMarkdown } from '@/lib/editor-utils'
import { LatexToolbar } from '@/components/ui/latex-toolbar'
import { MediaUploadModal, UploadModalMode } from '@/components/ui/media-upload-modal'
import {
  Bold,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Quote,
  Table as TableIcon,
  Undo,
  Redo,
  Heading1,
  Heading2,
  Trash2,
  Plus,
  Image as ImageIcon,
  FileText
} from 'lucide-react'

interface TiptapProps {
  value: string
  onChange: (data: string) => void
  onReady?: (editor: any) => void
  onUploadImage?: (file: File, onProgress?: (percent: number) => void) => void | Promise<void>
  onUploadImages?: (files: File[]) => void | Promise<void>
  onUploadFile?: (file: File) => void
  placeholder?: string
  images?: { imageCode: string, imageUrl: string }[]
}

export default function TiptapEditor({ value, onChange, onReady, onUploadImage, onUploadImages, onUploadFile, placeholder, images }: TiptapProps) {
  const [showMathToolbar, setShowMathToolbar] = useState(false)
  const [uploadModalState, setUploadModalState] = useState<{ isOpen: boolean, mode: UploadModalMode }>({
    isOpen: false,
    mode: 'image'
  })

  // Debounce helper to prevent heavy HTML-Markdown conversions on every key stroke
  const debouncedOnChange = React.useMemo(() => {
    const fn = (md: string) => {
      onChange(md)
    }

    let timeout: NodeJS.Timeout | null = null
    let lastArgs: any[] | null = null

    const debounced = (...args: any[]) => {
      lastArgs = args
      if (timeout) clearTimeout(timeout)
      timeout = setTimeout(() => {
        fn(...args as [string])
        timeout = null
        lastArgs = null
      }, 400)
    }

    debounced.cancel = () => {
      if (timeout) {
        clearTimeout(timeout)
        timeout = null
      }
    }

    debounced.flush = () => {
      if (timeout && lastArgs) {
        clearTimeout(timeout)
        fn(...lastArgs as [string])
        timeout = null
        lastArgs = null
      }
    }

    return debounced
  }, [onChange])

  // Clean up debounce on unmount
  useEffect(() => {
    return () => {
      debouncedOnChange.cancel()
    }
  }, [debouncedOnChange])

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2],
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 dark:text-blue-400 underline cursor-pointer',
        },
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'border-collapse table-fixed w-full my-4 border-2 border-slate-200 dark:border-slate-800',
        },
      }),
      TableRow,
      TableHeader,
      TableCell,
      Image.configure({
        inline: true,
        allowBase64: true,
        HTMLAttributes: {
          class: 'max-w-full rounded-lg inline-block'
        }
      })
    ],
    content: markdownToHtml(value, images),
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      const md = htmlToMarkdown(html)
      debouncedOnChange(md)
    },
    onBlur: ({ editor }) => {
      // Force sync immediately when user clicks away (e.g. to save draft or publish)
      debouncedOnChange.flush()
    }
  })

  // Sync external changes (e.g. undo, reset) back to editor without resetting cursor on user typing
  useEffect(() => {
    if (editor && value !== undefined) {
      // Only set content if the editor is NOT focused (meaning the change came externally like draft load or undo)
      if (!editor.isFocused) {
        const htmlValue = markdownToHtml(value, images)
        if (editor.getHTML() !== htmlValue) {
          editor.commands.setContent(htmlValue, { emitUpdate: false })
        }
      }
    }
  }, [value, editor])

  // Trigger onReady when editor initializes
  useEffect(() => {
    if (editor && onReady) {
      onReady(editor)
    }
  }, [editor, onReady])

  if (!editor) {
    return null
  }

  const handleInsertLinkModal = (url: string, text?: string) => {
    if (text) {
      editor.chain().focus().insertContent(`<a href="${url}">${text}</a>`).run()
    } else {
      if (editor.state.selection.empty) {
        editor.chain().focus().insertContent(`<a href="${url}">${url}</a>`).run()
      } else {
        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
      }
    }
  }

  const handleInsertLatex = (latexCommand: string) => {
    const isMathBlock = latexCommand.includes('\\begin')
    const insertText = isMathBlock ? `$$ \n${latexCommand} \n$$` : `$${latexCommand}$`

    // Insert text at current cursor position
    editor.chain().focus().insertContent(insertText).run()

    // Force form state sync
    const htmlData = editor.getHTML()
    const mdData = htmlToMarkdown(htmlData)
    onChange(mdData)
  }

  const isTableActive = editor.isActive('table')

  return (
    <div className="tiptap-wrapper w-full flex-1 min-h-0 flex flex-col gap-3">
      <style>
        {`
        .tiptap-wrapper {
          flex: 1 1 0%;
          min-height: 0;
          display: flex;
          flex-direction: column;
        }
        .ProseMirror {
          flex: 1 1 0%;
          min-height: 0;
          overflow-y: auto;
          outline: none;
          padding: 1.5rem;
          font-size: 15px;
          line-height: 1.7;
          color: #1e293b;
          background-color: #ffffff;
          border-bottom-left-radius: 12px;
          border-bottom-right-radius: 12px;
          border: 1px solid #e2e8f0;
          border-top: none;
        }
        .dark .ProseMirror {
          background-color: #0f172a;
          color: #e2e8f0;
          border-color: #1e293b;
        }
        .ProseMirror:focus {
          border-color: #6366f1;
          box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.1);
        }
        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #adb5bd;
          pointer-events: none;
          height: 0;
        }
        .ProseMirror p {
          margin-bottom: 1rem;
        }
        .ProseMirror ul {
          list-style-type: disc;
          padding-left: 1.5rem;
          margin-bottom: 1rem;
        }
        .ProseMirror ol {
          list-style-type: decimal;
          padding-left: 1.5rem;
          margin-bottom: 1rem;
        }
        .ProseMirror blockquote {
          border-left: 4px solid #e2e8f0;
          padding-left: 1rem;
          color: #64748b;
          font-style: italic;
          margin-bottom: 1rem;
        }
        .dark .ProseMirror blockquote {
          border-left-color: #334155;
          color: #94a3b8;
        }
        .ProseMirror table {
          border-collapse: collapse;
          table-layout: fixed;
          width: 100%;
          margin: 1rem 0;
          overflow: hidden;
        }
        .ProseMirror td, .ProseMirror th {
          min-width: 1em;
          border: 1px solid #cbd5e1;
          padding: 8px 12px;
          vertical-align: top;
          box-sizing: border-box;
          position: relative;
        }
        .dark .ProseMirror td, .dark .ProseMirror th {
          border-color: #334155;
        }
        .ProseMirror th {
          font-weight: bold;
          text-align: left;
          background-color: #f8fafc;
        }
        .dark .ProseMirror th {
          background-color: #1e293b;
        }
        .ProseMirror .selectedCell::after {
          background: rgba(200, 200, 255, 0.4);
          content: "";
          left: 0; right: 0; top: 0; bottom: 0;
          pointer-events: none;
          position: absolute;
          z-index: 2;
        }
      `}
      </style>

      {/* Math Formulas Toggle Button */}
      <div className="flex items-center justify-between mb-0.5 shrink-0">
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setShowMathToolbar(!showMathToolbar)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border shadow-xs cursor-pointer ${showMathToolbar
            ? 'bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/50'
            : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850'
            }`}
        >
          <span className="font-mono text-sm leading-none">∑</span>
          {showMathToolbar ? 'Ẩn bảng công thức Toán' : 'Hiện bảng công thức Toán'}
        </button>
      </div>

      {/* Embedded LaTeX Toolbar, toggleable */}
      {showMathToolbar && (
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shrink-0 animate-in slide-in-from-top-2 duration-200">
          <LatexToolbar onInsert={handleInsertLatex} />
        </div>
      )}

      {/* Tiptap Rich Text Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-t-xl shrink-0">
        {/* Headings */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors ${editor.isActive('heading', { level: 1 }) ? 'bg-slate-200 dark:bg-slate-800 text-primary' : 'text-slate-600 dark:text-slate-400'
            }`}
          title="Tiêu đề lớn"
        >
          <Heading1 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors ${editor.isActive('heading', { level: 2 }) ? 'bg-slate-200 dark:bg-slate-800 text-primary' : 'text-slate-600 dark:text-slate-400'
            }`}
          title="Tiêu đề vừa"
        >
          <Heading2 className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-slate-200 dark:bg-slate-800 mx-1" />

        {/* Basic formatting */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors ${editor.isActive('bold') ? 'bg-slate-200 dark:bg-slate-800 text-primary font-bold' : 'text-slate-600 dark:text-slate-400'
            }`}
          title="In đậm"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors ${editor.isActive('italic') ? 'bg-slate-200 dark:bg-slate-800 text-primary font-bold' : 'text-slate-600 dark:text-slate-400'
            }`}
          title="In nghiêng"
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setUploadModalState({ isOpen: true, mode: 'link' })}
          className={`p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors ${editor.isActive('link') ? 'bg-slate-200 dark:bg-slate-800 text-primary font-bold' : 'text-slate-600 dark:text-slate-400'
            }`}
          title="Chèn liên kết"
        >
          <LinkIcon className="w-4 h-4" />
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setUploadModalState({ isOpen: true, mode: 'image' })}
          className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
          title="Tải lên ảnh từ máy tính"
        >
          <ImageIcon className="w-4 h-4" />
        </button>
        {onUploadFile && (
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setUploadModalState({ isOpen: true, mode: 'file' })}
            className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
            title="Tải lên file"
          >
            <FileText className="w-4 h-4" />
          </button>
        )}

        <div className="w-px h-5 bg-slate-200 dark:bg-slate-800 mx-1" />

        {/* Lists */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors ${editor.isActive('bulletList') ? 'bg-slate-200 dark:bg-slate-800 text-primary' : 'text-slate-600 dark:text-slate-400'
            }`}
          title="Danh sách dấu đầu dòng"
        >
          <List className="w-4 h-4" />
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors ${editor.isActive('orderedList') ? 'bg-slate-200 dark:bg-slate-800 text-primary' : 'text-slate-600 dark:text-slate-400'
            }`}
          title="Danh sách số"
        >
          <ListOrdered className="w-4 h-4" />
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors ${editor.isActive('blockquote') ? 'bg-slate-200 dark:bg-slate-800 text-primary' : 'text-slate-600 dark:text-slate-400'
            }`}
          title="Trích dẫn"
        >
          <Quote className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-slate-200 dark:bg-slate-800 mx-1" />

        {/* Tables */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
          className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
          title="Chèn bảng"
        >
          <TableIcon className="w-4 h-4" />
        </button>

        {isTableActive && (
          <>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => editor.chain().focus().addColumnAfter().run()}
              className="px-1.5 py-0.5 text-[10px] font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded transition-colors"
              title="Thêm cột bên phải"
            >
              + Cột
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => editor.chain().focus().addRowAfter().run()}
              className="px-1.5 py-0.5 text-[10px] font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded transition-colors"
              title="Thêm dòng bên dưới"
            >
              + Dòng
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => editor.chain().focus().deleteColumn().run()}
              className="px-1.5 py-0.5 text-[10px] font-bold bg-rose-50 hover:bg-rose-100 text-rose-600 rounded transition-colors"
              title="Xóa cột hiện tại"
            >
              Xóa Cột
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => editor.chain().focus().deleteRow().run()}
              className="px-1.5 py-0.5 text-[10px] font-bold bg-rose-50 hover:bg-rose-100 text-rose-600 rounded transition-colors"
              title="Xóa dòng hiện tại"
            >
              Xóa Dòng
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => editor.chain().focus().deleteTable().run()}
              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded transition-colors"
              title="Xóa toàn bộ bảng"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </>
        )}

        <div className="flex-1" />

        {/* Undo/Redo */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 disabled:opacity-40 transition-colors"
          title="Hoàn tác"
        >
          <Undo className="w-4 h-4" />
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 disabled:opacity-40 transition-colors"
          title="Làm lại"
        >
          <Redo className="w-4 h-4" />
        </button>
      </div>

      {/* Editor Content Area */}
      <EditorContent editor={editor} className="flex-1 min-h-0 flex flex-col" placeholder={placeholder} />

      {/* Unified Media & Upload Modal */}
      <MediaUploadModal
        isOpen={uploadModalState.isOpen}
        initialMode={uploadModalState.mode}
        onClose={() => setUploadModalState(prev => ({ ...prev, isOpen: false }))}
        onUploadImage={(file, onProgress) => {
          if (onUploadImage) {
            return onUploadImage(file, onProgress) as any
          }
        }}
        onUploadFile={(file) => {
          if (onUploadFile) {
            onUploadFile(file)
          }
        }}
        onInsertLink={handleInsertLinkModal}
        initialLinkUrl={editor ? editor.getAttributes('link').href || '' : ''}
      />
    </div>
  )
}
