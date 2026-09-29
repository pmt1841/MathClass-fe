'use client'

import * as React from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getDaysInMonthAndYear } from '@/lib/date-utils'
import { useI18n } from '@/lib/i18n/i18n-context'

interface DateSelectGroupProps {
  value?: string // Format: "dd-MM-yyyy" or partial like "13--"
  onChange: (value: string) => void
  disabled?: boolean
  className?: string
}

export function DateSelectGroup({
  value = '',
  onChange,
  disabled = false,
  className,
}: DateSelectGroupProps) {
  const { t } = useI18n()
  const [dayVal, monthVal, yearVal] = value ? value.split('-') : ['', '', '']

  const currentYear = new Date().getFullYear()

  const years = React.useMemo(() => {
    return Array.from({ length: 100 }, (_, i) => String(currentYear - i))
  }, [currentYear])

  const months = React.useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'))
  }, [])

  const days = React.useMemo(() => {
    const selectedMonth = monthVal ? Number(monthVal) : 1
    const selectedYear = yearVal ? Number(yearVal) : currentYear
    const daysInMonth = getDaysInMonthAndYear(selectedMonth, selectedYear)
    return Array.from({ length: daysInMonth }, (_, i) => String(i + 1).padStart(2, '0'))
  }, [monthVal, yearVal, currentYear])

  const handleSelectChange = (type: 'day' | 'month' | 'year', val: string) => {
    let nextD = dayVal
    let nextM = monthVal
    let nextY = yearVal

    if (type === 'day') nextD = val
    if (type === 'month') nextM = val
    if (type === 'year') nextY = val

    // Adjust day if it exceeds max days of the new month/year
    if (nextD && nextM) {
      const maxDays = getDaysInMonthAndYear(Number(nextM), nextY ? Number(nextY) : currentYear)
      if (Number(nextD) > maxDays) {
        nextD = String(maxDays).padStart(2, '0')
      }
    }

    onChange(`${nextD}-${nextM}-${nextY}`)
  }

  return (
    <div className={className || "grid grid-cols-[1fr_1.6fr_1.2fr] gap-2"}>
      <Select
        disabled={disabled}
        value={dayVal || undefined}
        onValueChange={(val) => handleSelectChange('day', val)}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder={t('Ngày')} />
        </SelectTrigger>
        <SelectContent>
          {days.map((d) => (
            <SelectItem key={d} value={d}>
              {d}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        disabled={disabled}
        value={monthVal || undefined}
        onValueChange={(val) => handleSelectChange('month', val)}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder={t('Tháng')} />
        </SelectTrigger>
        <SelectContent>
          {months.map((m) => (
            <SelectItem key={m} value={m}>
              {t('Tháng {month}', { month: m })}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        disabled={disabled}
        value={yearVal || undefined}
        onValueChange={(val) => handleSelectChange('year', val)}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder={t('Năm')} />
        </SelectTrigger>
        <SelectContent>
          {years.map((y) => (
            <SelectItem key={y} value={y}>
              {y}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
