import Link from 'next/link'
import { Clock, CheckCircle, Edit, Trash2, Send, ChevronDown, Layers } from 'lucide-react'
import { AssignmentSheet } from '@/hooks/useAssignments'
import { formatDateTime, parseDateSafe } from '@/lib/utils'
import { PermissionGuard } from '@/components/ui/with-permission'
import { useState } from 'react'

interface AssignmentCardProps {
  assignment: AssignmentSheet
  userRole: string
  activeTab: string
  index: number
  selectable?: boolean
  selected?: boolean
  onSelect?: (id: number, selected: boolean) => void
  onEdit: (id: number, hasSubmissions?: boolean, isSheet?: boolean) => void
  onDelete: (id: number, title: string, isSheet?: boolean) => void
  onPublish: (id: number, isSheet?: boolean) => void
}

export function AssignmentCard({
  assignment,
  userRole,
  activeTab,
  index,
  selectable,
  selected,
  onSelect,
  onEdit,
  onDelete,
  onPublish
}: AssignmentCardProps) {
  const isTeacher = userRole === 'TEACHER'
  const isSheet = assignment.type === 'SHEET'
  const [expanded, setExpanded] = useState(false)
  
  return (
    <div
      className={`group flex flex-col justify-between rounded-2xl border ${selected ? 'border-primary shadow-md ring-1 ring-primary' : 'border-border'} bg-white overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 relative`}
      style={{ animationFillMode: 'both', animationDuration: '500ms', animationDelay: `${index * 50}ms` }}
    >
      {selectable && (
        <div className="absolute top-4 right-4 z-10">
          <input
            type="checkbox"
            checked={selected}
            onChange={(e) => onSelect?.(assignment.id, e.target.checked)}
            className="h-5 w-5 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer"
          />
        </div>
      )}

      <div className={`h-1.5 w-full ${isTeacher && activeTab === 'ARCHIVED'
        ? 'bg-gradient-to-r from-emerald-400 to-teal-500'
        : 'bg-gradient-to-r from-blue-500 to-indigo-600'
      }`} />

      <div className="p-6 flex-1 flex flex-col cursor-pointer" onClick={() => isSheet && setExpanded(!expanded)}>
        <div className="flex items-start justify-between gap-4 mb-3">
          <h3 className="font-bold text-foreground text-lg line-clamp-2 leading-tight flex items-center gap-2">
            {isSheet && <Layers className="h-5 w-5 text-indigo-500 flex-shrink-0" />}
            {assignment.title}
          </h3>
          {isSheet && (
             <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform flex-shrink-0 ${expanded ? 'rotate-180' : ''}`} />
          )}
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

      {isSheet && expanded && (
        <div className="bg-slate-50 border-t border-slate-100 p-3 space-y-2 max-h-60 overflow-y-auto">
           {assignment.items?.map((item, i) => (
              <div key={item.id} className="bg-white p-3 rounded-lg border border-slate-200 text-sm flex items-center justify-between shadow-sm">
                <div className="font-medium text-slate-700 flex-1 truncate pr-2">
                  {i + 1}. {item.title}
                </div>
                {!isTeacher && (
                  <Link
                    href={`/assignments/${item.id}?classCode=${assignment.classCode}`}
                    className="px-3 py-1.5 bg-primary/10 text-primary rounded-md font-semibold text-xs hover:bg-primary/20 transition-colors whitespace-nowrap"
                  >
                     {(() => {
                        const isItemOverdue = assignment.deadline && (parseDateSafe(assignment.deadline)?.getTime() ?? 0) < Date.now();
                        if (item.submissionStatus === 'GRADED') return 'Xem điểm';
                        if (item.submissionStatus === 'SUBMITTED' || item.submissionStatus === 'LATE') return isItemOverdue ? 'Xem bài nộp' : 'Sửa bài nộp';
                        return isItemOverdue ? 'Xem đề bài' : 'Làm bài';
                     })()}
                  </Link>
                )}
                {isTeacher && (
                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    {assignment.classCode && item.submissionStatus ? (
                      <Link
                        href={`/assignments/${item.id}/grading`}
                        className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-md font-semibold text-xs hover:bg-blue-100 transition-colors whitespace-nowrap"
                      >
                         Chấm bài
                      </Link>
                    ) : (
                      <>
                        <PermissionGuard permission="assignment:update">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              onEdit(item.id, false)
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-primary transition-all"
                            title="Sửa bài tập này"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                        </PermissionGuard>

                        <PermissionGuard permission="assignment:delete">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              onDelete(item.id, item.title, false)
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-destructive transition-all"
                            title="Xóa bài tập này"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </PermissionGuard>
                      </>
                    )}
                  </div>
                )}
              </div>
           ))}
        </div>
      )}

      {isTeacher ? (
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-2">
          <div className="flex gap-2">
            <PermissionGuard permission="assignment:update">
              <button
                onClick={() => onEdit(assignment.id, assignment.hasSubmissions, isSheet)}
                disabled={!isSheet && assignment.hasSubmissions}
                className={`p-2 rounded-lg transition-all relative group/editbtn ${!isSheet && assignment.hasSubmissions
                  ? 'text-slate-400 bg-slate-100 cursor-not-allowed'
                  : 'text-muted-foreground hover:bg-white hover:text-primary hover:shadow-sm'
                }`}
                title={isSheet ? "Sửa tên đề mục và mô tả phiếu" : (assignment.hasSubmissions ? "" : "Sửa nội dung")}
              >
                <Edit className="h-4 w-4" />
                {!isSheet && assignment.hasSubmissions && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover/editbtn:opacity-100 transition-opacity pointer-events-none z-10">
                    Không thể sửa đề bài do đã có học sinh nộp bài làm
                  </div>
                )}
              </button>
            </PermissionGuard>
            <PermissionGuard permission="assignment:delete">
              <button
                onClick={() => onDelete(assignment.id, assignment.title, isSheet)}
                className="p-2 rounded-lg text-muted-foreground hover:bg-white hover:text-destructive hover:shadow-sm transition-all"
                title={isSheet ? "Xóa phiếu bài tập" : "Xóa bài tập"}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </PermissionGuard>
          </div>

          <PermissionGuard permission="assignment:publish">
            <button
              onClick={() => onPublish(assignment.id, isSheet)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-sm ${activeTab === 'DRAFT'
                ? 'bg-primary text-white hover:bg-primary/95 hover:shadow-md hover:shadow-primary/20'
                : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200'
              }`}
            >
              <Send className="h-4 w-4" />
              {activeTab === 'DRAFT' ? 'Giao bài' : 'Giao lại'}
            </button>
          </PermissionGuard>
        </div>
      ) : !isSheet && (
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <Link
            href={`/assignments/${assignment.id}?classCode=${assignment.classCode}`}
            className={`flex w-full items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold shadow-sm transition-all active:scale-95 ${
              assignment.deadline && (parseDateSafe(assignment.deadline)?.getTime() ?? 0) < Date.now()
              ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
              : 'bg-primary text-white hover:bg-primary/95'
            }`}
          >
            {(() => {
              const isOverdue = assignment.deadline && (parseDateSafe(assignment.deadline)?.getTime() ?? 0) < Date.now()
              const status = assignment.submissionStatus

              if (status === 'GRADED') return 'Xem điểm'
              if (status === 'SUBMITTED' || status === 'LATE') return isOverdue ? 'Xem bài nộp' : 'Sửa bài nộp'
              return isOverdue ? 'Xem đề bài' : 'Vào làm bài'
            })()}
          </Link>
        </div>
      )}
    </div>
  )
}
