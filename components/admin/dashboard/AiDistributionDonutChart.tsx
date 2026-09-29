'use client'

import React, { useState } from 'react'
import { Bot, Info } from 'lucide-react'
import { AiTaskUsage } from '@/types/admin-dashboard'
import { useI18n } from '@/lib/i18n/i18n-context'
import { getCreditTaskLabel } from '@/lib/constants/credit'

interface AiDistributionDonutChartProps {
  aiTaskUsages: AiTaskUsage[]
}

// 6 Màu sắc nhận diện riêng biệt cho 6 con AI
const TASK_COLORS: Record<string, { stroke: string; bg: string; text: string }> = {
  BATCH_QUESTION_GEN: {
    stroke: '#8b5cf6', // Violet
    bg: 'bg-violet-500/15',
    text: 'text-violet-600 dark:text-violet-400',
  },
  QUESTION_GEN: {
    stroke: '#3b82f6', // Blue
    bg: 'bg-blue-500/15',
    text: 'text-blue-600 dark:text-blue-400',
  },
  SUBMISSION_GRADING: {
    stroke: '#10b981', // Emerald
    bg: 'bg-emerald-500/15',
    text: 'text-emerald-600 dark:text-emerald-400',
  },
  STUDENT_HINT: {
    stroke: '#f59e0b', // Amber
    bg: 'bg-amber-500/15',
    text: 'text-amber-600 dark:text-amber-400',
  },
  STUDENT_REMARK: {
    stroke: '#f97316', // Orange
    bg: 'bg-orange-500/15',
    text: 'text-orange-600 dark:text-orange-400',
  },
  CANVAS_LATEX: {
    stroke: '#ec4899', // Pink
    bg: 'bg-pink-500/15',
    text: 'text-pink-600 dark:text-pink-400',
  },
}

export function AiDistributionDonutChart({ aiTaskUsages }: AiDistributionDonutChartProps) {
  const { t } = useI18n()
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  const totalCalls = aiTaskUsages.reduce((sum, item) => sum + item.callCount, 0)

  // Tính toán các thông số SVG Donut
  const radius = 70
  const strokeWidth = 26
  const circumference = 2 * Math.PI * radius

  let cumulativePercent = 0
  const segments = aiTaskUsages.map((task, index) => {
    const percent = totalCalls > 0 ? (task.callCount / totalCalls) * 100 : 0
    const strokeDasharray = `${(percent / 100) * circumference} ${circumference}`
    const strokeDashoffset = -((cumulativePercent / 100) * circumference)
    cumulativePercent += percent

    const colors = TASK_COLORS[task.taskCode] || {
      stroke: '#94a3b8',
      bg: 'bg-slate-500/15',
      text: 'text-slate-600',
    }

    const translatedName = getCreditTaskLabel(task.taskCode, t)

    return {
      ...task,
      taskName: translatedName || task.taskName,
      index,
      percent: Math.round(percent * 10) / 10,
      strokeDasharray,
      strokeDashoffset,
      colors,
    }
  })

  const activeSegment = hoveredIndex !== null ? segments[hoveredIndex] : null

  return (
    <div className="flex flex-col h-full rounded-2xl border bg-card/60 backdrop-blur-sm p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground text-sm">
              {t('Phân Bổ Lượt Dùng AI')}
            </h3>
            <p className="text-xs text-muted-foreground">
              {t('Thống kê tỷ lệ sử dụng theo từng nghiệp vụ AI')}
            </p>
          </div>
        </div>

        <div className="rounded-full bg-muted/60 px-3 py-1 text-xs font-semibold text-muted-foreground">
          {t('Tổng: {count} lượt', { count: totalCalls.toLocaleString() })}
        </div>
      </div>

      {/* Main Content: Chart + Legend */}
      <div className="mt-6 flex flex-col md:flex-row items-center justify-between gap-6 flex-1">
        {/* SVG Donut Chart */}
        <div className="relative flex items-center justify-center shrink-0">
          <svg
            width="200"
            height="200"
            viewBox="0 0 200 200"
            className="transform -rotate-90 transition-transform"
          >
            {/* Vòng tròn nền (Track) */}
            <circle
              cx="100"
              cy="100"
              r={radius}
              stroke="currentColor"
              strokeWidth={strokeWidth}
              className="text-muted/20"
              fill="none"
            />

            {/* Các múi Donut */}
            {totalCalls > 0 &&
              segments.map((seg) => (
                <circle
                  key={seg.taskCode}
                  cx="100"
                  cy="100"
                  r={radius}
                  stroke={seg.colors.stroke}
                  strokeWidth={hoveredIndex === seg.index ? strokeWidth + 4 : strokeWidth}
                  strokeDasharray={seg.strokeDasharray}
                  strokeDashoffset={seg.strokeDashoffset}
                  fill="none"
                  className="transition-all duration-300 cursor-pointer"
                  style={{
                    opacity: hoveredIndex === null || hoveredIndex === seg.index ? 1 : 0.45,
                  }}
                  onMouseEnter={() => setHoveredIndex(seg.index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                />
              ))}
          </svg>

          {/* Tâm Donut hiển thị Thông tin tương tác */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-3">
            {activeSegment ? (
              <>
                <span className="text-2xl font-bold tracking-tight text-foreground">
                  {activeSegment.percent}%
                </span>
                <span className="text-[11px] font-medium text-muted-foreground line-clamp-1 max-w-[110px]">
                  {activeSegment.taskName}
                </span>
                <span className="text-[10px] text-muted-foreground/80 mt-0.5">
                  {t('{count} lượt', { count: activeSegment.callCount.toLocaleString() })}
                </span>
              </>
            ) : (
              <>
                <span className="text-xl font-bold tracking-tight text-foreground">
                  {totalCalls > 0 ? totalCalls.toLocaleString() : '0'}
                </span>
                <span className="text-xs text-muted-foreground">{t('Lượt gọi AI')}</span>
                <span className="text-[10px] text-muted-foreground/70">
                  {totalCalls > 0 ? t('Rê chuột để xem') : t('Chưa có dữ liệu')}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Legend List (Danh sách 6 con AI) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full flex-1">
          {segments.map((task) => {
            const isHovered = hoveredIndex === task.index
            return (
              <div
                key={task.taskCode}
                onMouseEnter={() => setHoveredIndex(task.index)}
                onMouseLeave={() => setHoveredIndex(null)}
                className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                  isHovered
                    ? 'border-primary/50 bg-accent/40 shadow-sm scale-[1.02]'
                    : 'border-transparent bg-muted/25 hover:bg-muted/40'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
                  <span
                    className="h-3 w-3 rounded-full shrink-0 transition-transform"
                    style={{
                      backgroundColor: task.colors.stroke,
                      transform: isHovered ? 'scale(1.25)' : 'scale(1)',
                    }}
                  />
                  <div className="truncate min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">
                      {task.taskName}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      <span className="text-[11px] text-muted-foreground">
                        {t('{count} lượt', { count: task.callCount.toLocaleString() })}
                      </span>
                      <span className="text-[10px] text-muted-foreground/40">•</span>
                      {task.callCount > 0 ? (
                        <span
                          className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                            task.successRate >= 95
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              : task.successRate >= 85
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                          }`}
                          title={`${t('Thành công')}: ${task.successCount} | ${t('Thất bại')}: ${task.failedCount}`}
                        >
                          {t('{rate}% thành công ({success}/{total})', {
                            rate: task.successRate,
                            success: task.successCount,
                            total: task.callCount
                          })}
                        </span>
                      ) : (
                        <span className="text-[10px] text-muted-foreground/60">{t('Chưa có lượt')}</span>
                      )}
                    </div>
                  </div>
                </div>

                <span
                  className={`text-xs font-bold pl-2 shrink-0 ${task.colors.text}`}
                >
                  {task.percent}%
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
