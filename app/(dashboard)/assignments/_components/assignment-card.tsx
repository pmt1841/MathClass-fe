import Link from 'next/link'
import { Clock, CheckCircle, Edit, Trash2, Send, ChevronDown, Layers, GitFork, User } from 'lucide-react'
import { AssignmentSheet } from '@/hooks/useAssignments'
import { formatDateTime, parseDateSafe } from '@/lib/utils'
import { PermissionGuard } from '@/components/ui/with-permission'
import { VisibilityToggle } from '@/components/ui/visibility-toggle'
import { useState } from 'react'

interface AssignmentCardProps {
  assignment: AssignmentSheet
  userRole: string
  activeTab: string
  index: number
  selectable?: boolean
  selected?: boolean
  isHorizontal?: boolean
  /** 'personal' = kho cá nhân (default), 'library' = thư viện dùng chung */
  mode?: 'personal' | 'library'
  onSelect?: (id: number, selected: boolean) => void
  onEdit: (id: number, hasSubmissions?: boolean, isSheet?: boolean) => void
  onDelete: (id: number, title: string, isSheet?: boolean) => void
  onPublish: (id: number, isSheet?: boolean) => void
  /** Callback khi bấm Clone (chỉ dùng ở mode='library') */
  onClone?: (id: number, title: string, isSheet: boolean, authorName?: string) => void
}

export function AssignmentCard({
  assignment,
  userRole,
  activeTab,
  index,
  selectable,
  selected,
  isHorizontal,
  mode = 'personal',
  onSelect,
  onEdit,
  onDelete,
  onPublish,
  onClone,
}: AssignmentCardProps) {
  const isTeacher = userRole === 'TEACHER'
  const isSheet = assignment.type === 'SHEET'
  const isLibraryMode = mode === 'library'
  const [expanded, setExpanded] = useState(false)

  if (isHorizontal) {
    return (
      <div
        className={`group flex flex-col rounded-2xl border ${selected ? 'border-primary shadow-md ring-1 ring-primary' : 'border-border'} bg-white overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 relative w-full`}
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

        <div className={`h-1.5 w-full ${isSheet
          ? 'bg-gradient-to-r from-indigo-500 to-purple-600'
          : activeTab === 'SINGLE'
            ? 'bg-gradient-to-r from-emerald-400 to-teal-500'
            : 'bg-gradient-to-r from-blue-500 to-indigo-600'
          }`} />

        <div
          className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/50 transition-colors"
          onClick={() => isSheet && setExpanded(!expanded)}
        >
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100/80 shadow-xs">
              <Layers className="h-6 w-6" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2.5 mb-1">
                <h3 className="font-bold text-foreground text-base sm:text-lg truncate">
                  {assignment.title}
                </h3>
                {isSheet && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 flex-shrink-0">
                    {assignment.items?.length || 0} bài tập
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground line-clamp-1">
                {assignment.description || 'Không có mô tả'}
              </p>

              {assignment.status !== 'DRAFT' && !isTeacher && (
                <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-600">
                  {assignment.className && (
                    <div className="flex items-center gap-1.5 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                      Lớp: {assignment.className}
                    </div>
                  )}
                  {assignment.submissionStatus === 'GRADED' && assignment.submissionUpdatedAt ? (
                    <div className="flex items-center gap-1.5 font-medium text-blue-600">
                      <Clock className="h-3.5 w-3.5" />
                      Chấm điểm: {formatDateTime(assignment.submissionUpdatedAt)}
                    </div>
                  ) : assignment.deadline ? (
                    <div className="flex items-center gap-1.5 font-medium text-rose-600">
                      <Clock className="h-3.5 w-3.5" />
                      Hạn nộp: {formatDateTime(assignment.deadline)}
                    </div>
                  ) : null}

                  {assignment.submissionStatus === 'SUBMITTED' && assignment.submissionCreatedAt && (
                    <div className="flex items-center gap-1.5 font-medium text-emerald-600">
                      <CheckCircle className="h-3.5 w-3.5" />
                      Thời gian nộp: {formatDateTime(assignment.submissionCreatedAt)}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between md:justify-end gap-3 flex-shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
            {isTeacher ? (
              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                <PermissionGuard permission="assignment:update">
                  <button
                    onClick={() => onEdit(assignment.id, assignment.hasSubmissions, isSheet)}
                    disabled={!isSheet && assignment.hasSubmissions}
                    className={`p-2 rounded-lg transition-all relative group/editbtn ${!isSheet && assignment.hasSubmissions
                      ? 'text-slate-400 bg-slate-100 cursor-not-allowed'
                      : 'text-muted-foreground hover:bg-slate-100 hover:text-primary'
                      }`}
                    title={isSheet ? "Sửa tên đề mục và mô tả phiếu" : (assignment.hasSubmissions ? "" : "Sửa nội dung")}
                  >
                    <Edit className="h-4.5 w-4.5" />
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
                    className="p-2 rounded-lg text-muted-foreground hover:bg-slate-100 hover:text-destructive transition-all"
                    title={isSheet ? "Xóa phiếu bài tập" : "Xóa bài tập"}
                  >
                    <Trash2 className="h-4.5 w-4.5" />
                  </button>
                </PermissionGuard>

                <PermissionGuard permission="assignment:publish">
                  <button
                    onClick={() => onPublish(assignment.id, isSheet)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-sm ${activeTab === 'DRAFT'
                      ? 'bg-primary text-white hover:bg-primary/95 hover:shadow-md hover:shadow-primary/20'
                      : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200'
                      }`}
                  >
                    <Send className="h-4 w-4" />
                    {isSheet ? 'Giao lại' : 'Giao bài'}
                  </button>
                </PermissionGuard>
              </div>
            ) : !isSheet && (
              <div onClick={(e) => e.stopPropagation()}>
                <Link
                  href={`/assignments/${assignment.id}?classCode=${assignment.classCode}`}
                  className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold shadow-sm transition-all active:scale-95 ${assignment.deadline && (parseDateSafe(assignment.deadline)?.getTime() ?? 0) < Date.now()
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

            {isSheet && (
              <div className="flex items-center gap-1 text-xs font-semibold text-slate-500 bg-slate-100 group-hover:bg-slate-200/80 px-3 py-2 rounded-xl transition-all">
                <span>{expanded ? 'Thu gọn' : 'Chi tiết'}</span>
                <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`} />
              </div>
            )}
          </div>
        </div>

        {isSheet && expanded && (
          <div className="bg-slate-50/80 border-t border-slate-100 p-4 space-y-2.5">
            {assignment.items?.map((item, i) => (
              <div key={item.id} className="bg-white p-3.5 rounded-xl border border-slate-200/80 text-sm flex items-center justify-between shadow-xs hover:border-indigo-200 transition-all">
                <div className="font-semibold text-slate-700 flex-1 truncate pr-3 flex items-center gap-2.5">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-500 flex-shrink-0">
                    {i + 1}
                  </span>
                  <span className="truncate">{item.title}</span>
                  {item.maxScore !== undefined && item.maxScore !== null && (
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 flex-shrink-0">
                      {item.maxScore} đ
                    </span>
                  )}
                </div>

                {!isTeacher && (
                  <Link
                    href={`/assignments/${item.id}?classCode=${assignment.classCode}`}
                    className="px-3 py-1.5 rounded-lg bg-primary/10 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors flex-shrink-0"
                  >
                    Làm bài
                  </Link>
                )}

                {isTeacher && (
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <PermissionGuard permission="assignment:update">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onEdit(item.id, false, false)
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
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

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

      <div className={`h-1.5 w-full ${isSheet
        ? 'bg-gradient-to-r from-indigo-500 to-purple-600'
        : activeTab === 'SINGLE'
          ? 'bg-gradient-to-r from-emerald-400 to-teal-500'
          : 'bg-gradient-to-r from-blue-500 to-indigo-600'
        }`} />

      <div className="p-6 flex-1 flex flex-col cursor-pointer" onClick={() => isSheet && setExpanded(!expanded)}>
        <div className="flex items-start justify-between gap-4 mb-3">
          <h3 className="font-bold text-foreground text-lg line-clamp-2 leading-tight flex items-center gap-2">
            {isSheet && <Layers className="h-5 w-5 text-indigo-500 flex-shrink-0" />}
            {assignment.title}
            {/* Badge nguồn gốc: hiển thị khi bài được clone từ tác giả khác */}
            {!isLibraryMode && assignment.originalAuthor && (
              <span
                title={`Nguồn gốc: ${assignment.originalAuthor.fullName}`}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-violet-50 text-violet-600 border border-violet-200 flex-shrink-0"
              >
                <GitFork className="h-2.5 w-2.5" />
                Clone
              </span>
            )}
          </h3>
          {isSheet && (
            <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform flex-shrink-0 ${expanded ? 'rotate-180' : ''}`} />
          )}
        </div>

        {/* Tên tác giả — chỉ hiển thị ở mode library */}
        {isLibraryMode && assignment.teacherName && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
            <User className="h-3 w-3" />
            <span>{assignment.teacherName}</span>
          </div>
        )}

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
              <div className="font-medium text-slate-700 flex-1 truncate pr-2 flex items-center gap-2">
                <span className="truncate">{i + 1}. {item.title}</span>
                {item.maxScore !== undefined && item.maxScore !== null && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200 flex-shrink-0">
                    {item.maxScore} đ
                  </span>
                )}
              </div>
              {!isTeacher && (
                <Link
                  href={`/assignments/${item.id}?classCode=${assignment.classCode}`}
                  className="text-xs font-semibold text-primary hover:underline flex-shrink-0"
                >
                  Làm bài
                </Link>
              )}
              {isTeacher && (
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <PermissionGuard permission="assignment:update">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onEdit(item.id, false, false)
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
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {isTeacher && !isLibraryMode ? (
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-2">
          <div className="flex gap-2 items-center">
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

            {/* Visibility Toggle — chỉ Teacher ở mode personal */}
            <VisibilityToggle
              value={assignment.visibility ?? 'PRIVATE'}
              assignmentId={assignment.id}
              isSheet={isSheet}
            />
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
              {isSheet ? 'Giao lại' : 'Giao bài'}
            </button>
          </PermissionGuard>
        </div>
      ) : isLibraryMode ? (
        /* Footer ở mode library: nút Clone */
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end">
          <PermissionGuard permission="library:clone">
            <button
              onClick={() => onClone?.(assignment.id, assignment.title, isSheet, assignment.teacherName)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-violet-600 text-white hover:bg-violet-700 transition-all shadow-sm active:scale-95"
            >
              <GitFork className="h-4 w-4" />
              Clone về
            </button>
          </PermissionGuard>
        </div>
      ) : !isSheet && (
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <Link
            href={`/assignments/${assignment.id}?classCode=${assignment.classCode}`}
            className={`flex w-full items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold shadow-sm transition-all active:scale-95 ${assignment.deadline && (parseDateSafe(assignment.deadline)?.getTime() ?? 0) < Date.now()
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
