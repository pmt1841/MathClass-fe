'use client'

import React, { useState } from 'react'
import { UserPlus, Banknote } from 'lucide-react'
import { MonthlyUserTrend, MonthlyRevenueTrend } from '@/types/admin-dashboard'

interface AnnualTrendCardsProps {
  userTrends?: MonthlyUserTrend[]
  revenueTrends?: MonthlyRevenueTrend[]
  year: number
}

export function AnnualTrendCards({
  userTrends = [],
  revenueTrends = [],
  year,
}: AnnualTrendCardsProps) {
  const [hoveredUserPoint, setHoveredUserPoint] = useState<number | null>(null)
  const [hoveredRevPoint, setHoveredRevPoint] = useState<number | null>(null)

  // 1. Chuẩn hóa dữ liệu User Trends 12 tháng
  const normalizedUserTrends = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1
    const found = userTrends.find((t) => t.month === month)
    return { month, count: found ? found.count : 0 }
  })

  // 2. Chuẩn hóa dữ liệu Revenue Trends 12 tháng
  const normalizedRevenueTrends = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1
    const found = revenueTrends.find((t) => t.month === month)
    return { month, revenue: found ? found.revenue : 0 }
  })

  const formatVND = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Kích thước SVG chuẩn cho biểu đồ mở rộng, thoáng đãng
  const svgWidth = 640
  const svgHeight = 180
  const padX = 28
  const padTop = 24
  const padBottom = 32
  const graphW = svgWidth - padX * 2
  const graphH = svgHeight - padTop - padBottom

  // ===== TÍNH TOÁN BIỂU ĐỒ USER (12 THÁNG) =====
  const maxUserVal = Math.max(...normalizedUserTrends.map((t) => t.count), 5)
  const userSvgPoints = normalizedUserTrends.map((item, idx) => {
    const x = padX + (idx / 11) * graphW
    const y = padTop + (1 - item.count / maxUserVal) * graphH
    return {
      idx,
      month: item.month,
      count: item.count,
      x,
      y,
    }
  })

  const userLinePath = userSvgPoints
    .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(' ')
  const userAreaPath = `${userLinePath} L ${userSvgPoints[11].x.toFixed(1)},${(padTop + graphH).toFixed(1)} L ${userSvgPoints[0].x.toFixed(1)},${(padTop + graphH).toFixed(1)} Z`

  // ===== TÍNH TOÁN BIỂU ĐỒ REVENUE (12 THÁNG) =====
  const maxRevVal = Math.max(...normalizedRevenueTrends.map((t) => t.revenue), 100000)
  const revSvgPoints = normalizedRevenueTrends.map((item, idx) => {
    const x = padX + (idx / 11) * graphW
    const y = padTop + (1 - item.revenue / maxRevVal) * graphH
    return {
      idx,
      month: item.month,
      revenue: item.revenue,
      x,
      y,
    }
  })

  const revLinePath = revSvgPoints
    .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(' ')
  const revAreaPath = `${revLinePath} L ${revSvgPoints[11].x.toFixed(1)},${(padTop + graphH).toFixed(1)} L ${revSvgPoints[0].x.toFixed(1)},${(padTop + graphH).toFixed(1)} Z`

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* ================= BIỂU ĐỒ 1: ĐĂNG KÝ TÀI KHOẢN (12 THÁNG) ================= */}
      <div className="relative rounded-2xl border bg-card/60 backdrop-blur-sm p-5 shadow-sm transition-all hover:shadow-md hover:border-primary/40">
        <div className="flex items-center justify-between pb-1">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <UserPlus className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                Tăng Trưởng Đăng Ký Năm {year}
              </h4>
              <p className="text-[11px] text-muted-foreground">
                Số lượng tài khoản mới qua 12 tháng
              </p>
            </div>
          </div>

          {/* Góc phải: Tag trạng thái 12 Tháng (Bỏ số tổng ở góc) */}
          <div>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-muted text-muted-foreground border">
              12 Tháng
            </span>
          </div>
        </div>

        {/* SVG Sparkline Area Chart (Mở rộng chiều cao h-52) */}
        <div className="mt-2 relative">
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-52 overflow-visible"
          >
            <defs>
              <linearGradient id="userTrendGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.32" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Các đường lưới ngang phân tầng */}
            <line
              x1={padX}
              y1={padTop}
              x2={svgWidth - padX}
              y2={padTop}
              stroke="currentColor"
              strokeDasharray="4 4"
              className="stroke-border/40"
            />
            <line
              x1={padX}
              y1={padTop + graphH / 2}
              x2={svgWidth - padX}
              y2={padTop + graphH / 2}
              stroke="currentColor"
              strokeDasharray="4 4"
              className="stroke-border/40"
            />
            <line
              x1={padX}
              y1={padTop + graphH}
              x2={svgWidth - padX}
              y2={padTop + graphH}
              stroke="currentColor"
              className="stroke-border/60"
            />

            {/* Dải gradient nền */}
            <path d={userAreaPath} fill="url(#userTrendGradient)" />

            {/* Đường nét tia mảnh */}
            <path
              d={userLinePath}
              fill="none"
              stroke="#10b981"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Render 12 mốc tháng */}
            {userSvgPoints.map((pt) => {
              const isHovered = hoveredUserPoint === pt.idx

              return (
                <g key={pt.month}>
                  <text
                    x={pt.x}
                    y={svgHeight - 8}
                    textAnchor="middle"
                    className={`text-[10px] transition-colors select-none ${
                      isHovered
                        ? 'fill-emerald-600 dark:fill-emerald-400 font-bold'
                        : 'fill-muted-foreground/70'
                    }`}
                  >
                    T{pt.month}
                  </text>

                  {/* Vùng hover tương tác */}
                  <rect
                    x={pt.x - graphW / 22}
                    y={padTop}
                    width={graphW / 11}
                    height={graphH + 24}
                    fill="transparent"
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredUserPoint(pt.idx)}
                    onMouseLeave={() => setHoveredUserPoint(null)}
                  />

                  {/* Hiệu ứng Highlight khi hover */}
                  {isHovered && (
                    <>
                      <line
                        x1={pt.x}
                        y1={padTop}
                        x2={pt.x}
                        y2={padTop + graphH}
                        stroke="#10b981"
                        strokeWidth="1"
                        strokeDasharray="2 2"
                        className="opacity-60"
                      />
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r="4.5"
                        fill="#10b981"
                        stroke="white"
                        strokeWidth="2"
                      />
                    </>
                  )}
                </g>
              )
            })}
          </svg>

          {/* Tooltip khi hover */}
          {hoveredUserPoint !== null && userSvgPoints[hoveredUserPoint] && (
            <div
              className="absolute pointer-events-none -top-1 transform -translate-x-1/2 rounded-lg border bg-popover/95 backdrop-blur-sm px-2.5 py-1 text-[11px] shadow-sm z-10"
              style={{
                left: `${((userSvgPoints[hoveredUserPoint].x / svgWidth) * 100).toFixed(1)}%`,
              }}
            >
              <span className="font-semibold text-foreground">
                Tháng {userSvgPoints[hoveredUserPoint].month}:
              </span>{' '}
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                +{userSvgPoints[hoveredUserPoint].count}
              </span>{' '}
              tài khoản
            </div>
          )}
        </div>
      </div>

      {/* ================= BIỂU ĐỒ 2: DOANH THU NẠP TIỀN (12 THÁNG) ================= */}
      <div className="relative rounded-2xl border bg-card/60 backdrop-blur-sm p-5 shadow-sm transition-all hover:shadow-md hover:border-primary/40">
        <div className="flex items-center justify-between pb-1">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Banknote className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                Xu Hướng Doanh Thu Năm {year}
              </h4>
              <p className="text-[11px] text-muted-foreground">
                Doanh số nạp credit qua 12 tháng
              </p>
            </div>
          </div>

          {/* Góc phải: Tag trạng thái 12 Tháng (Bỏ số tổng ở góc) */}
          <div>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-muted text-muted-foreground border">
              12 Tháng
            </span>
          </div>
        </div>

        {/* SVG Sparkline Area Chart (Mở rộng chiều cao h-52) */}
        <div className="mt-2 relative">
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-52 overflow-visible"
          >
            <defs>
              <linearGradient id="revTrendGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.32" />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Các đường lưới ngang phân tầng */}
            <line
              x1={padX}
              y1={padTop}
              x2={svgWidth - padX}
              y2={padTop}
              stroke="currentColor"
              strokeDasharray="4 4"
              className="stroke-border/40"
            />
            <line
              x1={padX}
              y1={padTop + graphH / 2}
              x2={svgWidth - padX}
              y2={padTop + graphH / 2}
              stroke="currentColor"
              strokeDasharray="4 4"
              className="stroke-border/40"
            />
            <line
              x1={padX}
              y1={padTop + graphH}
              x2={svgWidth - padX}
              y2={padTop + graphH}
              stroke="currentColor"
              className="stroke-border/60"
            />

            {/* Dải gradient nền */}
            <path d={revAreaPath} fill="url(#revTrendGradient)" />

            {/* Đường nét tia mảnh */}
            <path
              d={revLinePath}
              fill="none"
              stroke="#f59e0b"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Render 12 mốc tháng */}
            {revSvgPoints.map((pt) => {
              const isHovered = hoveredRevPoint === pt.idx

              return (
                <g key={pt.month}>
                  <text
                    x={pt.x}
                    y={svgHeight - 8}
                    textAnchor="middle"
                    className={`text-[10px] transition-colors select-none ${
                      isHovered
                        ? 'fill-amber-600 dark:fill-amber-400 font-bold'
                        : 'fill-muted-foreground/70'
                    }`}
                  >
                    T{pt.month}
                  </text>

                  {/* Vùng hover tương tác */}
                  <rect
                    x={pt.x - graphW / 22}
                    y={padTop}
                    width={graphW / 11}
                    height={graphH + 24}
                    fill="transparent"
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredRevPoint(pt.idx)}
                    onMouseLeave={() => setHoveredRevPoint(null)}
                  />

                  {/* Hiệu ứng Highlight khi hover */}
                  {isHovered && (
                    <>
                      <line
                        x1={pt.x}
                        y1={padTop}
                        x2={pt.x}
                        y2={padTop + graphH}
                        stroke="#f59e0b"
                        strokeWidth="1"
                        strokeDasharray="2 2"
                        className="opacity-60"
                      />
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r="4.5"
                        fill="#f59e0b"
                        stroke="white"
                        strokeWidth="2"
                      />
                    </>
                  )}
                </g>
              )
            })}
          </svg>

          {/* Tooltip khi hover */}
          {hoveredRevPoint !== null && revSvgPoints[hoveredRevPoint] && (
            <div
              className="absolute pointer-events-none -top-1 transform -translate-x-1/2 rounded-lg border bg-popover/95 backdrop-blur-sm px-2.5 py-1 text-[11px] shadow-sm z-10"
              style={{
                left: `${((revSvgPoints[hoveredRevPoint].x / svgWidth) * 100).toFixed(1)}%`,
              }}
            >
              <span className="font-semibold text-foreground">
                Tháng {revSvgPoints[hoveredRevPoint].month}:
              </span>{' '}
              <span className="text-amber-600 dark:text-amber-400 font-bold">
                {formatVND(revSvgPoints[hoveredRevPoint].revenue)}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
