'use client'

import React, { useState } from 'react'
import {
  CreditCard,
  ChevronLeft,
  ChevronRight,
  User,
  GraduationCap,
} from 'lucide-react'
import { RecentTransaction } from '@/types/admin-dashboard'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'

interface RecentTransactionsCardProps {
  recentTransactions: RecentTransaction[]
}

export function RecentTransactionsCard({
  recentTransactions,
}: RecentTransactionsCardProps) {
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(10)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString)
      return new Intl.DateTimeFormat('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).format(date)
    } catch {
      return isoString
    }
  }

  const totalItems = recentTransactions.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))

  // Đảm bảo trang hiện tại không vượt quá tổng số trang
  const validPage = Math.min(currentPage, totalPages)
  const startIndex = (validPage - 1) * pageSize
  const paginatedTransactions = recentTransactions.slice(
    startIndex,
    startIndex + pageSize
  )

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage)
    }
  }

  return (
    <div className="rounded-2xl border bg-card/60 backdrop-blur-sm p-6 shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <CreditCard className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground text-sm">
              Lịch Sử Nạp Tiền
            </h3>
            <p className="text-xs text-muted-foreground">
              50 giao dịch nạp credit thành công gần nhất trong kỳ báo cáo
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Số dòng/trang:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value))
              setCurrentPage(1)
            }}
            aria-label="Chọn số dòng hiển thị mỗi trang"
            className="h-8 rounded-lg border bg-background px-2 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>

      {/* Table Content */}
      <div className="mt-4 overflow-x-auto">
        {totalItems === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-xs text-muted-foreground">
            <CreditCard className="h-10 w-10 text-muted-foreground/30 mb-2" />
            Chưa phát sinh giao dịch nạp tiền nào trong hệ thống
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b text-muted-foreground/80 font-medium">
                <th className="pb-3 font-semibold">Người Nạp</th>
                <th className="pb-3 font-semibold">Vai Trò</th>
                <th className="pb-3 font-semibold">Gói Nạp</th>
                <th className="pb-3 font-semibold">Credit</th>
                <th className="pb-3 font-semibold">Số Tiền</th>
                <th className="pb-3 font-semibold text-right">Thời Gian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {paginatedTransactions.map((tx) => (
                <tr
                  key={tx.orderId}
                  className="transition-colors hover:bg-muted/30"
                >
                  {/* Người nạp */}
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2.5">
                      <Avatar className="h-7 w-7 border">
                        {tx.avatarUrl && (
                          <AvatarImage src={tx.avatarUrl} alt={tx.fullName} />
                        )}
                        <AvatarFallback className="font-bold text-[11px] text-muted-foreground">
                          {tx.fullName?.charAt(0)?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-semibold text-foreground truncate max-w-[160px]">
                        {tx.fullName}
                      </span>
                    </div>
                  </td>

                  {/* Vai trò */}
                  <td className="py-3 pr-4">
                    {tx.role === 'TEACHER' ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-purple-500/10 px-2 py-0.5 text-[11px] font-medium text-purple-600 dark:text-purple-400">
                        <GraduationCap className="h-3 w-3" /> Giáo viên
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-md bg-blue-500/10 px-2 py-0.5 text-[11px] font-medium text-blue-600 dark:text-blue-400">
                        <User className="h-3 w-3" /> Học sinh
                      </span>
                    )}
                  </td>

                  {/* Gói nạp */}
                  <td className="py-3 pr-4 font-medium text-foreground">
                    {tx.packageName}
                  </td>

                  {/* Credits */}
                  <td className="py-3 pr-4">
                    <span className="font-bold text-amber-600 dark:text-amber-400">
                      +{tx.credits.toLocaleString()}
                    </span>
                  </td>

                  {/* Số tiền */}
                  <td className="py-3 pr-4 font-semibold text-foreground">
                    {formatCurrency(tx.price)}
                  </td>

                  {/* Thời gian */}
                  <td className="py-3 text-right text-muted-foreground">
                    {formatTime(tx.paidAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Controls */}
      {totalItems > 0 && (
        <div className="mt-4 pt-3 border-t flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <div>
            Hiển thị Trang <span className="font-semibold text-foreground">{validPage}</span> / {totalPages} (Tổng số <span className="font-semibold text-foreground">{totalItems}</span> giao dịch)
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(validPage - 1)}
              disabled={validPage <= 1}
              className="h-8 px-2.5 rounded-lg text-xs"
            >
              <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Trước
            </Button>

            {/* Render các nút số trang */}
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - validPage) <= 1)
              .map((p, idx, arr) => {
                const prev = arr[idx - 1]
                return (
                  <React.Fragment key={p}>
                    {prev && p - prev > 1 && <span className="px-1 text-muted-foreground">...</span>}
                    <Button
                      variant={validPage === p ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handlePageChange(p)}
                      className={`h-8 w-8 p-0 rounded-lg text-xs font-semibold ${
                        validPage === p ? 'bg-primary text-primary-foreground' : ''
                      }`}
                    >
                      {p}
                    </Button>
                  </React.Fragment>
                )
              })}

            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(validPage + 1)}
              disabled={validPage >= totalPages}
              className="h-8 px-2.5 rounded-lg text-xs"
            >
              Sau <ChevronRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
