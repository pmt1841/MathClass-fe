'use client'

import React from 'react'
import Link from 'next/link'
import { ScrollText, ArrowUpRight } from 'lucide-react'
import { RecentSystemLog } from '@/types/admin-dashboard'
import { Button } from '@/components/ui/button'

interface RecentSystemLogsCardProps {
  logs?: RecentSystemLog[]
}

const RESOURCE_TYPE_LABELS: Record<string, string> = {
  AI_CONFIG: 'Cấu hình AI',
  USER: 'Người dùng',
  ROLE: 'Phân quyền',
  COMMUNITY_REPO: 'Kho tài nguyên',
  SYSTEM: 'Hệ thống',
  STORAGE: 'Lưu trữ Đám mây',
  CREDIT: 'Giao dịch Credit',
  BUG_REPORT: 'Báo cáo sự cố',
}

const ACTION_LABELS: Record<string, string> = {
  CREATE_AI_PROVIDER: 'Thêm mới Nhà cung cấp AI',
  UPDATE_AI_PROVIDER: 'Cập nhật thông tin Nhà cung cấp AI',
  DELETE_AI_PROVIDER: 'Xóa Nhà cung cấp AI',
  ADD_AI_API_KEY: 'Thêm mới API Key AI',
  DELETE_AI_API_KEY: 'Xóa API Key AI',
  PATCH_AI_API_KEY_STATUS: 'Thay đổi trạng thái API Key AI',
  UPDATE_AI_API_KEY: 'Cập nhật thông tin API Key AI',
  UPDATE_AI_TASK_CONFIG: 'Cập nhật cấu hình tác vụ AI',
  UPDATE_PROMPT: 'Cập nhật System Prompt',
  RESET_PROMPT: 'Khôi phục System Prompt về mặc định',
  ROLLBACK_PROMPT: 'Hoàn tác System Prompt về phiên bản trước',
}

const formatActionDescription = (action?: string) => {
  if (!action) return '---'
  return ACTION_LABELS[action] || action
}

export function RecentSystemLogsCard({ logs = [] }: RecentSystemLogsCardProps) {
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

  const getLevelBadgeClass = (level?: string) => {
    switch (level?.toUpperCase()) {
      case 'ERROR':
        return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
      case 'WARN':
      case 'WARNING':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
      default:
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
    }
  }

  return (
    <div className="rounded-2xl border bg-card/60 backdrop-blur-sm p-6 shadow-sm flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 pb-4 border-b">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <ScrollText className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground text-sm">
              Nhật Ký Hệ Thống
            </h3>
            <p className="text-xs text-muted-foreground">
              5 hoạt động hệ thống gần nhất
            </p>
          </div>
        </div>

        <Button variant="outline" size="sm" asChild className="h-8 gap-1 text-xs font-medium">
          <Link href="/admin/logs">
            <span>Xem chi tiết</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto flex-1 mt-3">
        <table className="w-full text-xs text-left">
          <thead className="text-muted-foreground border-b uppercase tracking-wider font-medium text-[11px]">
            <tr>
              <th className="py-2.5 px-3">Mức độ</th>
              <th className="py-2.5 px-3">Người thực hiện</th>
              <th className="py-2.5 px-3">Danh mục</th>
              <th className="py-2.5 px-3">Mô tả hành động</th>
              <th className="py-2.5 px-3 text-right">Thời gian</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-muted-foreground">
                  Chưa có nhật ký ghi nhận
                </td>
              </tr>
            ) : (
              logs.slice(0, 5).map((log) => (
                <tr
                  key={log.id}
                  className="hover:bg-muted/40 transition-colors group"
                >
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold border ${getLevelBadgeClass(
                        log.level
                      )}`}
                    >
                      {log.level || 'INFO'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-medium text-foreground max-w-[150px] truncate" title={log.actor}>
                    {log.actor}
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-muted text-muted-foreground border">
                      {(log.resourceType && RESOURCE_TYPE_LABELS[log.resourceType]) || log.resourceType || 'Hệ thống'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-foreground/80 max-w-[200px] truncate" title={formatActionDescription(log.action)}>
                    {formatActionDescription(log.action)}
                  </td>
                  <td className="py-2.5 px-3 text-right text-muted-foreground whitespace-nowrap font-mono text-[11px]">
                    {formatTime(log.createdAt)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
