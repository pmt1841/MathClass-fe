import Link from 'next/link'
import { Clock, CheckCircle, Edit, Trash2, Send } from 'lucide-react'
import { Assignment } from '@/hooks/useAssignments'
import { formatDateTime, parseDateSafe } from '@/lib/utils'

interface AssignmentCardProps {
  assignment: Assignment
  userRole: string
  activeTab: string
  index: number
  onEdit: (id: number, hasSubmissions?: boolean) => void
  onDelete: (id: number, title: string) => void
  onPublish: (id: number) => void
}

export function AssignmentCard({
  assignment,
  userRole,
  activeTab,
  index,
  onEdit,
  onDelete,
  onPublish
}: AssignmentCardProps) {
  const isTeacher = userRole === 'TEACHER'
  
  return (
    <div
      className="group flex flex-col justify-between rounded-2xl border border-border bg-white overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 animate-in fade-in slide-in-from-bottom-4"
      style={{ animationFillMode: 'both', animationDuration: '500ms', animationDelay: `${index * 50}ms` }}
    >
      <div className={`h-1.5 w-full ${isTeacher && activeTab === 'ARCHIVED'
        ? 'bg-gradient-to-r from-emerald-400 to-teal-500'
        : 'bg-gradient-to-r from-blue-500 to-indigo-600'
      }`} />

      <div className="p-5 flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className="font-bold text-foreground text-lg line-clamp-2 leading-tight">
            {assignment.title}
          </h3>
        </div>

        <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">
          {assignment.description || 'Không có mô tả'}
        </p>

        {assignment.status !== 'DRAFT' && !isTeacher && (
          <div className="bg-slate-50 rounded-xl p-3 mb-4 space-y-2 border border-slate-100">
            {assignment.className && (
              <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                Lớp: {assignment.className}
              </div>
            )}
            {assignment.submissionStatus === 'GRADED' && assignment.submissionUpdatedAt ? (
              <div className="flex items-center gap-2 text-xs font-medium text-blue-600">
                <Clock className="h-3.5 w-3.5" />
                Chấm điểm: {formatDateTime(assignment.submissionUpdatedAt)}
              </div>
            ) : assignment.deadline ? (
              <div className="flex items-center gap-2 text-xs font-medium text-rose-600">
                <Clock className="h-3.5 w-3.5" />
                Hạn nộp: {formatDateTime(assignment.deadline)}
              </div>
            ) : null}
            
            {assignment.submissionStatus === 'SUBMITTED' && assignment.submissionCreatedAt && (
              <div className="flex items-center gap-2 text-xs font-medium text-emerald-600">
                <CheckCircle className="h-3.5 w-3.5" />
                Thời gian nộp: {formatDateTime(assignment.submissionCreatedAt)}
              </div>
            )}
          </div>
        )}
      </div>

      {isTeacher ? (
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-2">
          <div className="flex gap-2">
            <button
              onClick={() => onEdit(assignment.id, assignment.hasSubmissions)}
              disabled={assignment.hasSubmissions}
              className={`p-2 rounded-lg transition-all relative group/editbtn ${assignment.hasSubmissions
                ? 'text-slate-400 bg-slate-100 cursor-not-allowed'
                : 'text-muted-foreground hover:bg-white hover:text-primary hover:shadow-sm'
              }`}
              title={assignment.hasSubmissions ? "" : "Sửa nội dung"}
            >
              <Edit className="h-4 w-4" />
              {assignment.hasSubmissions && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover/editbtn:opacity-100 transition-opacity pointer-events-none z-10">
                  Không thể sửa đề bài do đã có học sinh nộp bài làm
                </div>
              )}
            </button>
            <button
              onClick={() => onDelete(assignment.id, assignment.title)}
              className="p-2 rounded-lg text-muted-foreground hover:bg-white hover:text-destructive hover:shadow-sm transition-all"
              title="Xóa bài tập"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          <button
            onClick={() => onPublish(assignment.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-sm ${activeTab === 'DRAFT'
              ? 'bg-primary text-primary-foreground hover:bg-primary/95 hover:shadow-md hover:shadow-primary/20'
              : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            <Send className="h-4 w-4" />
            {activeTab === 'DRAFT' ? 'Giao bài' : 'Giao lại'}
          </button>
        </div>
      ) : (
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <Link
            href={`/assignments/${assignment.id}?classCode=${assignment.classCode}`}
            className={`flex w-full items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold shadow-sm transition-all active:scale-95 ${
              assignment.deadline && (parseDateSafe(assignment.deadline)?.getTime() ?? 0) < Date.now()
              ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
              : 'bg-primary text-primary-foreground hover:bg-primary/95'
            }`}
          >
            {(() => {
              const isOverdue = assignment.deadline && (parseDateSafe(assignment.deadline)?.getTime() ?? 0) < Date.now()
              const status = assignment.submissionStatus

              if (status === 'GRADED') return 'Xem điểm'
              if (status === 'SUBMITTED') return isOverdue ? 'Xem bài nộp' : 'Sửa bài nộp'
              return isOverdue ? 'Xem đề bài' : 'Vào làm bài'
            })()}
          </Link>
        </div>
      )}
    </div>
  )
}
