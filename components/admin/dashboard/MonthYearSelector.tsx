'use client'

import React from 'react'
import { Calendar, RotateCcw, Filter } from 'lucide-react'
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

  // Tạo danh sách 5 năm gần đây (ví dụ: 2026, 2025, 2024, 2023, 2022)
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
    <div className="flex flex-wrap items-center gap-2.5">
      {/* Container Bộ chọn */}
      <div className="flex items-center gap-1.5 rounded-xl border bg-card/80 px-3 py-1.5 shadow-sm backdrop-blur-sm">
        <Calendar className="h-4 w-4 text-primary shrink-0" />
        <span className="text-xs font-medium text-muted-foreground mr-1 hidden sm:inline">
          Kỳ báo cáo:
        </span>

        {/* Dropdown Tháng */}
        <select
          value={selectedMonth}
          onChange={handleMonthChange}
          disabled={disabled}
          aria-label="Chọn tháng báo cáo"
          className="h-8 rounded-lg border border-input bg-background px-2.5 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer hover:border-primary/50 transition-colors"
        >
          {MONTHS.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>

        {/* Dropdown Năm */}
        <select
          value={selectedYear}
          onChange={handleYearChange}
          disabled={disabled}
          aria-label="Chọn năm báo cáo"
          className="h-8 rounded-lg border border-input bg-background px-2.5 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer hover:border-primary/50 transition-colors"
        >
          {years.map((y) => (
            <option key={y} value={y}>
              Năm {y}
            </option>
          ))}
        </select>
      </div>

      {/* Badge Trạng thái & Nút Về Tháng Này */}
      {!isCurrentPeriod ? (
        <Button
          variant="outline"
          size="sm"
          onClick={handleResetToCurrent}
          disabled={disabled}
          className="h-9 rounded-xl inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600 border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 dark:text-amber-400"
        >
          <RotateCcw className="h-3 w-3" /> Về tháng hiện tại
        </Button>
      ) : (
        <span className="hidden sm:inline-flex items-center rounded-md bg-emerald-500/10 px-2 py-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
          ● Tháng hiện tại
        </span>
      )}
    </div>
  )
}
