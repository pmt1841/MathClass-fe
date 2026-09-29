'use client'

import { useState, useRef, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { RefreshCw, Check, ChevronDown } from 'lucide-react'
import { aiConfigService } from '@/services/aiConfigService'
import { useToast } from '@/components/ui/use-toast'
import { useI18n } from '@/lib/i18n/i18n-context'

interface ModelInputWithFetchProps {
  providerId: number
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  placeholder?: string
  id?: string
}

export function ModelInputWithFetch({
  providerId,
  value,
  onChange,
  disabled = false,
  placeholder,
  id,
}: ModelInputWithFetchProps) {
  const { t } = useI18n()
  const { toast } = useToast()
  const [fetching, setFetching] = useState(false)
  const [models, setModels] = useState<string[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const actualPlaceholder = placeholder || t('Vui lòng chọn hoặc gõ tên Model...')

  // Tự động đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleFetchModels = async () => {
    if (!providerId) {
      toast({
        title: t('Chưa chọn Provider'),
        description: t('Vui lòng chọn Provider trước khi tải danh sách Model.'),
        variant: 'destructive',
      })
      return
    }

    setFetching(true)
    try {
      const fetchedList = await aiConfigService.getProviderModels(providerId)
      setModels(fetchedList)

      if (fetchedList.length > 0) {
        setShowDropdown(true)
        toast({
          title: t('⚡ Tải danh sách Model thành công!'),
          description: t('Đã tìm thấy {count} models từ Provider API.', { count: fetchedList.length }),
        })
      } else {
        toast({
          title: t('Không tìm thấy Model'),
          description: t('Provider API không trả về danh sách model hoặc chưa cấu hình API Key.'),
          variant: 'destructive',
        })
      }
    } catch (err: any) {
      toast({
        title: t('Tải danh sách Model thất bại'),
        description: err.response?.data?.message || err.message,
        variant: 'destructive',
      })
    } finally {
      setFetching(false)
    }
  }

  // Lọc danh sách model theo từ khóa vừa gõ
  const filteredModels = models.filter((m) =>
    m.toLowerCase().includes((value || '').toLowerCase())
  )

  const displayList = filteredModels.length > 0 ? filteredModels : models

  return (
    <div className="space-y-1 relative" ref={containerRef}>
      <div className="flex gap-1.5">
        <div className="relative flex-1">
          <Input
            id={id}
            className="h-9 text-xs font-mono pr-7"
            placeholder={actualPlaceholder}
            value={value}
            onChange={(e) => {
              onChange(e.target.value)
              if (models.length > 0) setShowDropdown(true)
            }}
            onFocus={() => {
              if (models.length > 0) setShowDropdown(true)
            }}
            disabled={disabled}
          />

          {models.length > 0 && (
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
              onClick={() => setShowDropdown((prev) => !prev)}
              tabIndex={-1}
            >
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 px-2.5 text-[11px] whitespace-nowrap shrink-0"
          onClick={handleFetchModels}
          disabled={disabled || fetching || !providerId}
          title={t('Tải danh sách Model trực tiếp từ Provider API')}
        >
          {fetching ? (
            <Spinner className="h-3.5 w-3.5" />
          ) : (
            <>
              <RefreshCw className="h-3.5 w-3.5 mr-1" />
              {t('Tải Models')}
            </>
          )}
        </Button>
      </div>

      {/* Floating Dropdown Panel */}
      {showDropdown && displayList.length > 0 && (
        <div className="absolute left-0 top-10 z-[10002] w-full max-h-52 overflow-y-auto rounded-md border bg-popover text-popover-foreground shadow-lg p-1 font-mono text-xs">
          <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground border-b mb-1">
            Gợi ý Model ({displayList.length}):
          </div>
          {displayList.map((m) => (
            <button
              key={m}
              type="button"
              className={`w-full text-left px-2 py-1.5 rounded text-xs transition-colors hover:bg-accent hover:text-accent-foreground flex items-center justify-between ${
                value === m ? 'bg-indigo-50 font-bold text-indigo-700' : ''
              }`}
              onClick={() => {
                onChange(m)
                setShowDropdown(false)
              }}
            >
              <span className="truncate">{m}</span>
              {value === m && <Check className="h-3.5 w-3.5 shrink-0 text-indigo-600 ml-1" />}
            </button>
          ))}
        </div>
      )}

      {models.length > 0 && !showDropdown && (
        <p className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
          <Check className="h-3 w-3" /> Đã tải {models.length} model gợi ý. Bấm nút mũi tên hoặc ô nhập để chọn.
        </p>
      )}
    </div>
  )
}
