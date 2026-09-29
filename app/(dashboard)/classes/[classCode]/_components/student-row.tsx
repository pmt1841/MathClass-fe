import React from 'react'
import { Mail, Trash2, Loader2, MessageSquareQuote } from 'lucide-react'
import { Student } from '@/types'
import { formatDate } from '@/lib/utils'
import { PermissionGuard } from '@/components/ui/with-permission'
import { useI18n } from '@/lib/i18n/i18n-context'

export function StudentRow({
  student,
  index,
  isRemoving,
  onRemove,
  onOpenRemarks,
}: {
  student: Student
  index: number
  isRemoving: boolean
  onRemove: () => void
  onOpenRemarks?: () => void
}) {
  const { t } = useI18n()
  const colors = [
    'from-indigo-400 to-purple-500',
    'from-blue-400 to-indigo-500',
    'from-emerald-400 to-teal-500',
    'from-rose-400 to-pink-500',
    'from-amber-400 to-orange-500',
    'from-violet-400 to-fuchsia-500',
  ]
  const color = colors[student.id % colors.length]
  const initials = student.fullName
    ? student.fullName.split(' ').slice(-2).map((n) => n[0]).join('').toUpperCase()
    : '?'

  return (
    <div className="group flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50/80 border border-transparent hover:border-slate-100 transition-all duration-200">
      <span className="text-xs text-muted-foreground/60 font-mono w-5 text-right flex-shrink-0">{index}</span>
      <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${color} text-white text-xs font-bold shadow-sm`}>
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">{student.fullName}</p>
        <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
          <Mail className="h-3 w-3 flex-shrink-0" />
          {student.email}
        </p>
      </div>
      {student.joinedAt && (
        <span className="hidden sm:block text-[11px] text-muted-foreground/70 flex-shrink-0">
          {formatDate(student.joinedAt)}
        </span>
      )}
      
      <div className="flex items-center gap-1">
        {onOpenRemarks && (
          <button
            onClick={onOpenRemarks}
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-transparent text-muted-foreground opacity-0 group-hover:opacity-100 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 transition-all duration-200"
            title={t('Lịch sử nhận xét (Điểm mạnh & Điểm yếu)')}
          >
            <MessageSquareQuote className="h-4 w-4" />
          </button>
        )}

        <PermissionGuard permission="classroom:remove_student">
          <button
            onClick={onRemove}
            disabled={isRemoving}
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-transparent text-muted-foreground opacity-0 group-hover:opacity-100 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 transition-all duration-200 disabled:opacity-50"
            title={t('Xóa học sinh khỏi lớp')}
          >
            {isRemoving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
          </button>
        </PermissionGuard>
      </div>
    </div>
  )
}
