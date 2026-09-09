'use client'

import { useState, useEffect, useRef, KeyboardEvent } from 'react'
import { X, Tag as TagIcon, Loader2 } from 'lucide-react'
import { assignmentService, AssignmentTag } from '@/services/assignmentService'
import { cn } from '@/lib/utils'

interface AssignmentTagInputProps {
  value: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function AssignmentTagInput({
  value = [],
  onChange,
  placeholder = 'Nhập tag bài tập...',
  disabled = false,
  className,
}: AssignmentTagInputProps) {
  const [inputValue, setInputValue] = useState('')
  const [suggestions, setSuggestions] = useState<AssignmentTag[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Fetch tag suggestions with debounce only when user types text
  useEffect(() => {
    if (!inputValue.trim()) {
      setSuggestions([])
      setIsLoading(false)
      return
    }

    const timer = setTimeout(async () => {
      try {
        setIsLoading(true)
        const tags = await assignmentService.getTags(inputValue.trim())
        setSuggestions(tags)
      } catch {
        setSuggestions([])
      } finally {
        setIsLoading(false)
      }
    }, 150)

    return () => clearTimeout(timer)
  }, [inputValue])

  // Filter out suggestions already selected
  const availableSuggestions = suggestions.filter(
    (t) => !value.some((v) => v.toLowerCase() === t.name.toLowerCase())
  )

  // Handle click outside to close suggestion dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const addTag = (tagName: string) => {
    const trimmed = tagName.trim()
    if (!trimmed) return
    const isExist = value.some((v) => v.toLowerCase() === trimmed.toLowerCase())
    if (!isExist) {
      onChange([...value, trimmed])
    }
    setInputValue('')
    setIsOpen(false)
  }

  const removeTag = (indexToRemove: number) => {
    onChange(value.filter((_, idx) => idx !== indexToRemove))
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(inputValue)
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      removeTag(value.length - 1)
    }
  }

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      <div
        onClick={() => inputRef.current?.focus()}
        className={cn(
          'flex flex-wrap items-center gap-1.5 min-h-[42px] px-3 py-2 rounded-xl border bg-slate-50/30 dark:bg-slate-950/20 text-slate-800 dark:text-slate-200 outline-none transition-all cursor-text focus-within:bg-white dark:focus-within:bg-slate-950/40 focus-within:ring-2 focus-within:ring-primary/10 focus-within:border-primary border-slate-200 dark:border-slate-800',
          disabled && 'opacity-50 cursor-not-allowed pointer-events-none'
        )}
      >
        {value.map((tag, index) => (
          <span
            key={`${tag}-${index}`}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-primary/10 text-primary border border-primary/20 transition-all hover:bg-primary/20"
          >
            <span>{tag}</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                removeTag(index)
              }}
              className="rounded-full p-0.5 hover:bg-primary/30 text-primary transition-colors cursor-pointer"
              title="Xóa tag"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}

        <div className="flex-1 min-w-[120px] flex items-center gap-1.5">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            disabled={disabled}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            onChange={(e) => {
              setInputValue(e.target.value)
              setIsOpen(true)
            }}
            onFocus={() => {
              if (inputValue.trim()) setIsOpen(true)
            }}
            onKeyDown={handleKeyDown}
            placeholder={value.length === 0 ? placeholder : 'Thêm tag khác...'}
            className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
          />
          {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400 flex-shrink-0" />}
        </div>
      </div>

      {/* Autocomplete Dropdown Suggestions - Only rendered when user has typed text */}
      {isOpen && inputValue.trim().length > 0 && availableSuggestions.length > 0 && (
        <div className="absolute z-50 left-0 right-0 mt-1 max-h-48 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg p-1.5 space-y-0.5 animate-in fade-in slide-in-from-top-2 duration-150">
          <p className="px-2.5 py-1 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Gợi ý tag đã có
          </p>
          {availableSuggestions.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => addTag(item.name)}
              className="w-full text-left px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between transition-colors group cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <TagIcon className="w-3 h-3 text-slate-400 group-hover:text-primary transition-colors" />
                {item.name}
              </span>
              <span className="text-[10px] text-slate-400 font-normal">Nhấn chọn</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
