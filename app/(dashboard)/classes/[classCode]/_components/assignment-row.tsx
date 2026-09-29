import React, { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ClipboardList, Clock, Pencil, Send, ListChecks, RotateCcw } from 'lucide-react'
import { Assignment } from '@/types'
import { formatDateTime } from '@/lib/utils'
import { PermissionGuard } from '@/components/ui/with-permission'
import { assignmentService } from '@/services/assignmentService'
import { toast } from 'sonner'
import { useI18n } from '@/lib/i18n/i18n-context'

export function AssignmentRow({
  assignment,
  onPublish,
}: {
  assignment: Assignment
  onPublish: () => void
}) {
  const router = useRouter()
  const params = useParams()
  const { t } = useI18n()
  const classCode = params.classCode as string

  const [allowResubmit, setAllowResubmit] = useState<boolean>(assignment.allowResubmit ?? false)
  const [isToggling, setIsToggling] = useState(false)

  const handleToggleResubmit = async () => {
    try {
      setIsToggling(true)
      const nextVal = !allowResubmit
      await assignmentService.toggleAllowResubmit(assignment.id, nextVal)
      setAllowResubmit(nextVal)
      if (nextVal) {
        toast.success(`Đã bật cho phép nộp lại bài "${assignment.title}"`)
      } else {
        toast.info(`Đã tắt cho phép nộp lại bài "${assignment.title}"`)
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể thay đổi quyền nộp lại bài')
    } finally {
      setIsToggling(false)
    }
  }

  const statusConfig = {
    DRAFT: {
      label: t('Bản nháp'),
      className: 'bg-amber-50 text-amber-700 border-amber-200',
      dot: 'bg-amber-400',
    },
    PUBLISHED: {
      label: t('Đã giao'),
      className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      dot: 'bg-emerald-500',
    },
    ARCHIVED: {
      label: t('Lưu trữ'),
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
              {formatDateTime(assignment.deadline)}
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
      <div className="flex items-center gap-2 flex-shrink-0 opacity-90 group-hover:opacity-100 transition-opacity duration-150">
        {assignment.status !== 'DRAFT' && (
          <PermissionGuard permission="assignment:update">
            <button
              type="button"
              onClick={handleToggleResubmit}
              disabled={isToggling}
              className={`flex items-center gap-1.5 h-8 px-2.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                allowResubmit
                  ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                  : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100 hover:text-slate-700'
              }`}
              title={allowResubmit ? t('Bấm để tắt cho phép học sinh nộp lại') : t('Bấm để bật cho phép học sinh nộp lại')}
            >
              <RotateCcw className={`h-3.5 w-3.5 ${allowResubmit ? 'text-blue-600 animate-spin-reverse' : 'text-slate-400'}`} />
              <span className="hidden md:inline">
                {allowResubmit ? t('Cho nộp lại: Bật') : t('Cho nộp lại: Tắt')}
              </span>
            </button>
          </PermissionGuard>
        )}

        {assignment.status !== 'DRAFT' && (
          <button
            id={`view-submissions-${assignment.id}`}
            onClick={() => {
              const url = classCode 
                ? `/assignments/${assignment.id}/submissions?classCode=${classCode}` 
                : `/assignments/${assignment.id}/submissions`
              router.push(url)
            }}
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-primary/20 bg-primary/5 text-primary text-xs font-semibold hover:bg-primary/10 transition-colors"
            title={t('Xem bài nộp')}
          >
            <ListChecks className="h-3.5 w-3.5" />
            {t('Bài nộp')}
          </button>
        )}

        <PermissionGuard permission="assignment:update">
          <button
            id={`edit-assignment-${assignment.id}`}
            onClick={() => {
              const url = classCode 
                ? `/assignments/${assignment.id}/edit?returnUrl=/classes/${classCode}` 
                : `/assignments/${assignment.id}/edit`
              router.push(url)
            }}
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-border bg-white text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-foreground transition-colors"
            title={t('Chỉnh sửa bài tập')}
          >
            <Pencil className="h-3.5 w-3.5" />
            {t('Sửa')}
          </button>
        </PermissionGuard>

        {assignment.status === 'DRAFT' && (
          <PermissionGuard permission="assignment:publish">
            <button
              id={`publish-assignment-${assignment.id}`}
              onClick={onPublish}
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors shadow-sm"
              title={t('assignments.assign')}
            >
              <Send className="h-3.5 w-3.5" />
              {t('assignments.assign')}
            </button>
          </PermissionGuard>
        )}
      </div>

    </div>
  )
}
