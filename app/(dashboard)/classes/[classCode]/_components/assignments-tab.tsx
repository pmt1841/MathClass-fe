import React, { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search, RefreshCw, BookOpen, FileText, ChevronLeft, ChevronRight, ChevronDown, ListChecks, Pencil } from 'lucide-react'
import { classroomService } from '@/services/classroomService'
import { toast } from 'sonner'
import { Assignment } from '@/types'
import { AssignmentRow } from './assignment-row'
import { PermissionGuard } from '@/components/ui/with-permission'
import { assignmentService } from '@/services/assignmentService'
import { PublishAssignmentModal } from '@/components/assignments/publish-assignment-modal'

export function AssignmentsTab({ classCode }: { classCode: string }) {
  const router = useRouter()
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [keyword, setKeyword] = useState('')
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(10)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [activeTab, setActiveTab] = useState<'individual' | 'sheet'>('individual')

  // Publish modal state
  const [publishModalOpen, setPublishModalOpen] = useState(false)
  const [publishingAssignment, setPublishingAssignment] = useState<Assignment | null>(null)

  const fetchAssignments = useCallback(async () => {
    try {
      setLoading(true)
      const params = {
        page,
        size,
        status: 'PUBLISHED',
        keyword: keyword.trim() || undefined
      }
      if (activeTab === 'individual') {
        const data = await classroomService.getClassroomAssignments(classCode, params)
        setAssignments(data?.content !== undefined ? data.content : (Array.isArray(data) ? data : []))
        setTotalPages(data?.totalPages || 0)
        setTotalElements(data?.totalElements || 0)
      } else {
        const sheetsData = await assignmentService.getAssignmentSheets({ ...params, classCode, status: 'PUBLISHED' })
        const sheetsList = sheetsData?.content !== undefined ? sheetsData.content : (Array.isArray(sheetsData) ? sheetsData : [])
        const mappedSheets = sheetsList.map((sheet: any) => ({
          ...sheet,
          isSheet: true
        }))
        setAssignments(mappedSheets)
        setTotalPages(sheetsData?.totalPages || 0)
        setTotalElements(sheetsData?.totalElements || 0)
      }
    } catch (err: any) {
      toast.error('Không thể tải danh sách bài tập')
    } finally {
      setLoading(false)
    }
  }, [classCode, keyword, page, size, activeTab])

  useEffect(() => {
    fetchAssignments()
  }, [fetchAssignments])

  // Debounce keyword search
  const [keywordInput, setKeywordInput] = useState('')
  useEffect(() => {
    const t = setTimeout(() => {
      setKeyword(keywordInput)
      setPage(0)
    }, 400)
    return () => clearTimeout(t)
  }, [keywordInput])

  const openPublishModal = (assignment: Assignment) => {
    setPublishingAssignment(assignment)
    setPublishModalOpen(true)
  }

  const onPublishSuccess = () => {
    setPublishModalOpen(false)
    setPublishingAssignment(null)
    fetchAssignments()
  }

  return (
    <>
      {/* Assignment list panel */}
      <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
        {/* Panel header */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-border bg-gradient-to-r from-slate-50 to-transparent">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100">
              <BookOpen className="h-4.5 w-4.5 text-slate-600" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">Danh sách bài tập</h2>
              <p className="text-xs text-muted-foreground">
                {loading ? 'Đang tải...' : `${totalElements} ${activeTab === 'individual' ? 'bài tập' : 'phiếu bài tập'}`}
              </p>
            </div>
          </div>

          <div className="flex items-center bg-slate-100/80 p-1 rounded-xl">
            <button
              onClick={() => { setActiveTab('individual'); setPage(0) }}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'individual' 
                  ? 'bg-white text-primary shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
              }`}
            >
              Bài tập lẻ
            </button>
            <button
              onClick={() => { setActiveTab('sheet'); setPage(0) }}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'sheet' 
                  ? 'bg-white text-primary shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
              }`}
            >
              Phiếu bài tập
            </button>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={size}
              onChange={(e) => { setSize(Number(e.target.value)); setPage(0) }}
              className="h-9 px-2 rounded-lg border border-border bg-white text-xs text-slate-600 outline-none hover:bg-slate-50 transition-colors"
            >
              <option value={5}>5 / trang</option>
              <option value={10}>10 / trang</option>
              <option value={15}>15 / trang</option>
              <option value={20}>20 / trang</option>
            </select>

            <div className="relative w-48 hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Tìm bài tập..."
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                className="w-full h-9 pl-9 pr-3 rounded-lg border border-border bg-slate-50/80 text-xs outline-none transition-all focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/15"
              />
            </div>

            <button
              onClick={() => fetchAssignments()}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-white text-muted-foreground hover:text-foreground hover:bg-slate-50 transition-all"
              title="Làm mới"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Body */}
        {loading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3 p-4 rounded-xl animate-pulse">
                <div className="h-10 w-10 rounded-xl bg-slate-200 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-200 rounded-lg w-1/3" />
                  <div className="h-3 bg-slate-100 rounded-lg w-1/2" />
                </div>
                <div className="h-7 w-20 bg-slate-200 rounded-lg" />
              </div>
            ))}
          </div>
        ) : assignments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center space-y-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
              <FileText className="h-8 w-8 text-slate-400" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">
                {keyword ? 'Không tìm thấy kết quả phù hợp' : (activeTab === 'individual' ? 'Chưa có bài tập nào' : 'Chưa có phiếu bài tập nào')}
              </p>
              <p className="text-xs text-muted-foreground max-w-xs">
                {keyword ? 'Thử thay đổi bộ lọc tìm kiếm.' : (activeTab === 'individual' ? 'Tạo bài tập mới và giao cho lớp này.' : 'Tạo phiếu bài tập mới và giao cho lớp này.')}
              </p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {assignments.map((assignment: any) => {
              if (assignment.isSheet) {
                return (
                  <details
                    key={`sheet-${assignment.id}`}
                    className="group flex flex-col bg-white [&_summary::-webkit-details-marker]:hidden"
                  >
                    <summary className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-primary-50/50 transition-colors border-b border-slate-100">
                      <div className="flex items-center gap-4 min-w-0 flex-1">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
                          <BookOpen className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">{assignment.title} (Phiếu bài tập)</p>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                            <span className="text-xs text-muted-foreground">
                              {assignment.items?.length || 0} bài tập
                            </span>
                          </div>
                        </div>
                        <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex justify-end gap-2 items-center">
                          {assignment.items && assignment.items.length > 0 && (
                            <button
                              onClick={(e) => {
                                e.preventDefault()
                                router.push(`/assignments/sheets/${assignment.id}/submissions?classCode=${classCode}`)
                              }}
                              className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-primary/20 bg-primary/5 text-primary text-xs font-semibold hover:bg-primary/10 transition-colors"
                              title="Xem bài nộp của phiếu"
                            >
                              <ListChecks className="h-3.5 w-3.5" />
                              Bài nộp
                            </button>
                          )}
                          <div className="flex items-center justify-center gap-2 h-8 px-3 rounded-lg text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 transition-colors border border-primary/20">
                            Mở phiếu
                            <ChevronDown className="h-4 w-4 details-chevron transition-transform duration-300" />
                          </div>
                        </div>
                      </div>
                    </summary>
                    <div className="p-4 bg-slate-50/50 border-b border-slate-200 space-y-2">
                      {assignment.items?.map((item: any, i: number) => (
                        <div key={item.id} className="group flex items-center gap-4 p-3 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all ml-12">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <span className="text-sm font-semibold text-slate-500 w-5">{i + 1}.</span>
                            <div className="flex-1 min-w-0 flex items-center gap-2">
                              <p className="text-sm font-semibold text-slate-800 truncate">{item.title}</p>
                              {item.maxScore !== undefined && item.maxScore !== null && (
                                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 flex-shrink-0">
                                  {item.maxScore} đ
                                </span>
                              )}
                            </div>
                          </div>

                          <span className="hidden sm:flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200 flex-shrink-0">
                            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            Đã giao
                          </span>

                          <div className="flex items-center gap-2 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150">


                            <PermissionGuard permission="assignment:update">
                              <button
                                onClick={() => {
                                  const url = classCode
                                    ? `/assignments/${item.id}/edit?returnUrl=/classes/${classCode}`
                                    : `/assignments/${item.id}/edit`
                                  router.push(url)
                                }}
                                className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-border bg-white text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-foreground transition-colors"
                                title="Chỉnh sửa bài tập"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                                Sửa
                              </button>
                            </PermissionGuard>
                          </div>
                        </div>
                      ))}
                    </div>
                  </details>
                )
              }

              return (
                <AssignmentRow
                  key={assignment.id}
                  assignment={assignment}
                  onPublish={() => openPublishModal(assignment)}
                />
              )
            })}
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-5 py-3 bg-slate-50">
            <p className="text-xs text-muted-foreground hidden sm:block">
              Đang hiển thị {page * size + 1} - {Math.min((page + 1) * size, totalElements)} trên tổng số {totalElements}
            </p>
            <div className="flex items-center gap-1">
              <button
                disabled={page === 0}
                onClick={() => setPage(page - 1)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-50 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i)}
                  className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-semibold transition-colors ${page === i ? 'bg-primary text-white' : 'border border-border bg-white text-slate-600 hover:bg-slate-100'}`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                disabled={page === totalPages - 1}
                onClick={() => setPage(page + 1)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-50 transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Publish Modal */}
      {publishingAssignment && (
        <PublishAssignmentModal
          open={publishModalOpen}
          assignmentId={publishingAssignment.id}
          assignmentTitle={publishingAssignment.title}
          defaultClassCode={classCode}
          onClose={() => { setPublishModalOpen(false); setPublishingAssignment(null) }}
          onSuccess={onPublishSuccess}
        />
      )}
    </>
  )
}
