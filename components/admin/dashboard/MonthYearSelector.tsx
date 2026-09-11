'use client'

import React from 'react'
import { Calendar, RotateCcw, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'

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

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(Number(e.target.value), selectedYear)
  }

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(selectedMonth, Number(e.target.value))
  }

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
        <div className="relative">
          <select
            value={selectedMonth}
            onChange={handleMonthChange}
            disabled={disabled}
            aria-label="Chọn tháng báo cáo"
            className="h-9.5 pl-3.5 pr-8 rounded-xl border border-slate-200 bg-slate-50/80 hover:bg-white text-xs font-bold text-slate-800 outline-none transition-all focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/15 appearance-none cursor-pointer shadow-xs"
          >
            {MONTHS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        </div>

        {/* Dropdown Năm */}
        <div className="relative">
          <select
            value={selectedYear}
            onChange={handleYearChange}
            disabled={disabled}
            aria-label="Chọn năm báo cáo"
            className="h-9.5 pl-3.5 pr-8 rounded-xl border border-slate-200 bg-slate-50/80 hover:bg-white text-xs font-bold text-slate-800 outline-none transition-all focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/15 appearance-none cursor-pointer shadow-xs"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                Năm {y}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        </div>
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
