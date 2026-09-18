'use client'

import React from 'react'
import { Calendar, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface MonthYearSelectorProps {
  selectedMonth: number
  selectedYear: number
  onChange: (month: number, year: number) => void
  disabled?: boolean
}

const MONTHS = [
  { value: 1, label: 'Tháng 1' },
  { value: 2, label: 'Tháng 2' },
  { value: 3, label: 'Tháng 3' },
  { value: 4, label: 'Tháng 4' },
  { value: 5, label: 'Tháng 5' },
  { value: 6, label: 'Tháng 6' },
  { value: 7, label: 'Tháng 7' },
  { value: 8, label: 'Tháng 8' },
  { value: 9, label: 'Tháng 9' },
  { value: 10, label: 'Tháng 10' },
  { value: 11, label: 'Tháng 11' },
  { value: 12, label: 'Tháng 12' },
]

export function MonthYearSelector({
  selectedMonth,
  selectedYear,
  onChange,
  disabled = false,
}: MonthYearSelectorProps) {
  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()

  // Tạo danh sách 6 năm gần đây (ví dụ: 2026, 2025, 2024...)
  const years = Array.from({ length: 6 }, (_, i) => currentYear - i)

  const isCurrentPeriod =
    selectedMonth === currentMonth && selectedYear === currentYear

  const handleResetToCurrent = () => {
    onChange(currentMonth, currentYear)
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Nhãn Kỳ Báo Cáo Bôi Đậm */}
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Calendar className="h-4 w-4" />
        </div>
        <span className="text-xs font-bold tracking-tight text-foreground whitespace-nowrap">
          Kỳ báo cáo:
        </span>
      </div>

      {/* 2 Dropdown Tháng & Năm Cao Cấp */}
      <div className="flex items-center gap-2">
        {/* Dropdown Tháng */}
        <Select
          value={String(selectedMonth)}
          onValueChange={(val) => onChange(Number(val), selectedYear)}
          disabled={disabled}
        >
          <SelectTrigger className="h-9.5 w-[110px] rounded-xl border border-slate-200 bg-slate-50/80 hover:bg-white text-xs font-bold text-slate-800 focus:ring-2 focus:ring-primary/15 shadow-xs">
            <SelectValue placeholder="Chọn tháng" />
          </SelectTrigger>
          <SelectContent className="bg-white border border-slate-200 shadow-lg rounded-xl p-1">
            {MONTHS.map((m) => (
              <SelectItem
                key={m.value}
                value={String(m.value)}
                hideIndicator
                className="text-xs font-semibold cursor-pointer rounded-lg px-3 py-1.5 focus:bg-slate-100 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground data-[state=checked]:font-bold transition-colors"
              >
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Dropdown Năm */}
        <Select
          value={String(selectedYear)}
          onValueChange={(val) => onChange(selectedMonth, Number(val))}
          disabled={disabled}
        >
          <SelectTrigger className="h-9.5 w-[110px] rounded-xl border border-slate-200 bg-slate-50/80 hover:bg-white text-xs font-bold text-slate-800 focus:ring-2 focus:ring-primary/15 shadow-xs">
            <SelectValue placeholder="Chọn năm" />
          </SelectTrigger>
          <SelectContent className="bg-white border border-slate-200 shadow-lg rounded-xl p-1">
            {years.map((y) => (
              <SelectItem
                key={y}
                value={String(y)}
                hideIndicator
                className="text-xs font-semibold cursor-pointer rounded-lg px-3 py-1.5 focus:bg-slate-100 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground data-[state=checked]:font-bold transition-colors"
              >
                Năm {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Badge Trạng thái / Nút Trở về Tháng hiện tại */}
      {!isCurrentPeriod ? (
        <Button
          variant="outline"
          size="sm"
          onClick={handleResetToCurrent}
          disabled={disabled}
          className="h-9.5 rounded-xl inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 border-amber-200 bg-amber-50 hover:bg-amber-100 transition-all shadow-xs"
        >
          <RotateCcw className="h-3.5 w-3.5" /> Về tháng hiện tại
        </Button>
      ) : (
        <span className="hidden sm:inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 border border-emerald-200/60 shadow-xs">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          Tháng hiện tại
        </span>
      )}
    </div>
  )
}

