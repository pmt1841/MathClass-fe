'use client'

import React, { useEffect, useState } from 'react'
import katex from 'katex'
import 'katex/dist/katex.min.css'
import { Bold, Italic, Underline } from 'lucide-react'

interface LatexItem {
  id: string
  label: string
  tex: string
  insert: string
}

const latexItems: LatexItem[] = [
  // Căn bản
  { id: 'frac', label: 'Phân số', tex: '\\frac{a}{b}', insert: '\\frac{ }{ }' },
  { id: 'sqrt', label: 'Căn bậc hai', tex: '\\sqrt{x}', insert: '\\sqrt{ }' },
  { id: 'nroot', label: 'Căn bậc n', tex: '\\sqrt[n]{x}', insert: '\\sqrt[ ]{ }' },
  { id: 'pow', label: 'Số mũ', tex: 'x^{n}', insert: '^{ }' },
  { id: 'sub', label: 'Chỉ số dưới', tex: 'x_{n}', insert: '_{ }' },
  { id: 'abs', label: 'Trị tuyệt đối', tex: '|x|', insert: '| |' },

  // Chữ cái Hy Lạp
  { id: 'pi', label: 'Pi', tex: '\\pi', insert: '\\pi ' },
  { id: 'delta', label: 'Delta', tex: '\\Delta', insert: '\\Delta ' },
  { id: 'alpha', label: 'Alpha', tex: '\\alpha', insert: '\\alpha ' },
  { id: 'beta', label: 'Beta', tex: '\\beta', insert: '\\beta ' },

  // So sánh & Quan hệ
  { id: 'neq', label: 'Khác', tex: '\\neq', insert: '\\neq ' },
  { id: 'leq', label: 'Nhỏ hơn hoặc bằng', tex: '\\leq', insert: '\\leq ' },
  { id: 'geq', label: 'Lớn hơn hoặc bằng', tex: '\\geq', insert: '\\geq ' },
  { id: 'perp', label: 'Vuông góc', tex: '\\perp', insert: '\\perp ' },
  { id: 'parallel', label: 'Song song', tex: '\\parallel', insert: '\\parallel ' },
  { id: 'sim', label: 'Đồng dạng', tex: '\\sim', insert: '\\sim ' },

  // Giải tích & Đại số
  { id: 'infty', label: 'Vô cùng', tex: '\\infty', insert: '\\infty ' },
  { id: 'sum', label: 'Tổng (Sigma)', tex: '\\sum', insert: '\\sum_{i=1}^{n} ' },
  { id: 'int', label: 'Tích phân', tex: '\\int', insert: '\\int_{a}^{b} ' },
  { id: 'lim', label: 'Giới hạn', tex: '\\lim_{x \\to 0}', insert: '\\lim_{x \\to \\infty} ' },
  { id: 'deriv', label: 'Đạo hàm', tex: '\\frac{d}{dx}', insert: '\\frac{d}{dx} ' },

  // Hình học & Vector
  { id: 'angle', label: 'Góc', tex: '\\widehat{ABC}', insert: '\\widehat{ }' },
  { id: 'vector', label: 'Vector', tex: '\\vec{v}', insert: '\\vec{ }' },

  // Cấu trúc phức tạp
  { id: 'cases', label: 'Hệ phương trình', tex: '\\tiny \\begin{cases} x \\\\ y \\end{cases}', insert: '\\begin{cases}\n  x = 0 \\\\\n  y = 0\n\\end{cases}\n' },
  { id: 'matrix', label: 'Ma trận', tex: '\\scriptsize \\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}', insert: '\\begin{pmatrix}\n  a & b \\\\\n  c & d\n\\end{pmatrix}\n' },
]

interface LatexToolbarProps {
  onInsert: (latex: string) => void
  onFormatText?: (format: 'bold' | 'italic' | 'underline') => void
}

export function LatexToolbar({ onInsert, onFormatText }: LatexToolbarProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <div className="flex flex-col border-b border-border bg-slate-50">
      {onFormatText && (
        <div className="flex items-center gap-1 p-2 border-b border-slate-200">
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); onFormatText('bold') }}
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded transition-colors"
            title="In đậm"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); onFormatText('italic') }}
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded transition-colors"
            title="In nghiêng"
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); onFormatText('underline') }}
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded transition-colors"
            title="Gạch chân"
          >
            <Underline className="w-4 h-4" />
          </button>
        </div>
      )}
      <div className="flex flex-wrap gap-1 p-2 max-h-32 overflow-y-auto">
        {latexItems.map((item) => {
          const html = katex.renderToString(item.tex, {
            throwOnError: false,
            displayMode: false,
          })

          return (
            <button
              key={item.id}
              onClick={(e) => {
                e.preventDefault()
                onInsert(item.insert)
              }}
              title={item.label}
              className="flex items-center justify-center min-w-[36px] h-9 px-2 rounded-md hover:bg-slate-200 transition-colors text-slate-700 bg-white border border-slate-200 shadow-sm"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          )
        })}
      </div>
    </div>
  )
}
