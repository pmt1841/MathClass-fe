'use client'

import React from 'react'
import Link from 'next/link'
import { AlertTriangle, ArrowUpRight } from 'lucide-react'
import { RecentBugReport } from '@/types/admin-dashboard'
import { Button } from '@/components/ui/button'

interface RecentBugReportsCardProps {
  reports?: RecentBugReport[]
}

export function RecentBugReportsCard({ reports = [] }: RecentBugReportsCardProps) {
  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString)
      return new Intl.DateTimeFormat('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
      }).format(date)
    } catch {
      return isoString
    }
  }

  const getStatusBadge = (status?: string) => {
    switch (status?.toUpperCase()) {
      case 'RESOLVED':
        return {
          label: 'Đã xử lý',
          className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
        }
      case 'IN_PROGRESS':
        return {
          label: 'Đang xử lý',
          className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
        }
      case 'REJECTED':
        return {
          label: 'Đã hủy',
          className: 'bg-muted text-muted-foreground border-border',
        }
      default:
        return {
          label: 'Chờ xử lý',
          className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
        }
    }
  }

  return (
    <div className="rounded-2xl border bg-card/60 backdrop-blur-sm p-6 shadow-sm flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 pb-4 border-b">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground text-sm">
              Báo Cáo Sự Cố
            </h3>
            <p className="text-xs text-muted-foreground">
              5 sự cố và phản hồi gần nhất
            </p>
          </div>
        </div>

        <Link href="/admin/bug-reports" passHref>
          <Button variant="outline" size="sm" className="h-8 gap-1 text-xs font-medium">
            <span>Xem chi tiết</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </div>

      {/* Table */}
      <div className="overflow-x-auto flex-1 mt-3">
        <table className="w-full text-xs text-left">
          <thead className="text-muted-foreground border-b uppercase tracking-wider font-medium text-[11px]">
            <tr>
              <th className="py-2.5 px-3">Người gửi</th>
              <th className="py-2.5 px-3">Loại sự cố</th>
              <th className="py-2.5 px-3 text-center">Trạng thái</th>
              <th className="py-2.5 px-3 text-right">Thời gian</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {reports.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-muted-foreground">
                  Chưa có báo cáo sự cố nào
                </td>
              </tr>
            ) : (
              reports.slice(0, 5).map((report) => {
                const badge = getStatusBadge(report.status)
                return (
                  <tr
                    key={report.id}
                    className="hover:bg-muted/40 transition-colors group"
                  >
                    <td className="py-2.5 px-3 font-medium text-foreground max-w-[150px] truncate" title={report.reporterEmail}>
                      {report.reporterEmail}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-muted text-muted-foreground border">
                        {report.errorType}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium border ${badge.className}`}
                      >
                        {badge.label}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right text-muted-foreground whitespace-nowrap font-mono text-[11px]">
                      {formatTime(report.createdAt)}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
