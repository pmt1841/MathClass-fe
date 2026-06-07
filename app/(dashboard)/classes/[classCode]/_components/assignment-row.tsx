import React from 'react'
import { useRouter } from 'next/navigation'
import { ClipboardList, Clock, Pencil, Send } from 'lucide-react'
import { Assignment } from '../types'

export function AssignmentRow({
  assignment,
  onPublish,
}: {
  assignment: Assignment
  onPublish: () => void
}) {
  const router = useRouter()

  const statusConfig = {
    DRAFT: {
      label: 'Bản nháp',
      className: 'bg-amber-50 text-amber-700 border-amber-200',
      dot: 'bg-amber-400',
    },
    PUBLISHED: {
      label: 'Đã giao',
      className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      dot: 'bg-emerald-500',
    },
    ARCHIVED: {
      label: 'Lưu trữ',
      className: 'bg-slate-100 text-slate-500 border-slate-200',
      dot: 'bg-slate-400',
    },
  }

  const config = statusConfig[assignment.status] ?? statusConfig['DRAFT']

  return (
    <div className="group flex items-center gap-4 px-5 py-4 hover:bg-slate-50/80 transition-all duration-150">
      {/* Icon */}
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary/8 border border-primary/10">
        <ClipboardList className="h-5 w-5 text-primary/70" />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">{assignment.title}</p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
          {assignment.deadline && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {new Date(assignment.deadline).toLocaleDateString('vi-VN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          )}
          {assignment.className && (
            <span className="text-xs text-muted-foreground">
              📚 {assignment.className}
            </span>
          )}
        </div>
      </div>

      {/* Status badge */}
      <span className={`hidden sm:flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${config.className} flex-shrink-0`}>
        <span className={`inline-block h-1.5 w-1.5 rounded-full ${config.dot}`} />
        {config.label}
      </span>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
        <button
          id={`edit-assignment-${assignment.id}`}
          onClick={() => router.push(`/assignments/${assignment.id}/edit`)}
          className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-border bg-white text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-foreground transition-colors"
          title="Chỉnh sửa bài tập"
        >
          <Pencil className="h-3.5 w-3.5" />
          Sửa
        </button>

        {assignment.status === 'DRAFT' && (
          <button
            id={`publish-assignment-${assignment.id}`}
            onClick={onPublish}
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors shadow-sm"
            title="Giao bài tập này"
          >
            <Send className="h-3.5 w-3.5" />
            Giao bài
          </button>
        )}
      </div>
    </div>
  )
}
