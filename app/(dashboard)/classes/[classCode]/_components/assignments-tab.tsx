import React, { useState, useCallback, useEffect } from 'react'
import { Search, RefreshCw, BookOpen, FileText, ChevronLeft, ChevronRight } from 'lucide-react'
import api from '@/lib/axios'
import { toast } from 'sonner'
import { Assignment } from '@/types'
import { AssignmentRow } from './assignment-row'
import { PublishAssignmentModal } from '@/components/assignments/publish-assignment-modal'

export function AssignmentsTab({ classCode }: { classCode: string }) {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(0)
  const [size] = useState(10)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)

  // Publish modal state
  const [publishModalOpen, setPublishModalOpen] = useState(false)
  const [publishingAssignment, setPublishingAssignment] = useState<Assignment | null>(null)

  const fetchAssignments = useCallback(async () => {
    try {
      setLoading(true)
      const params: Record<string, any> = { page, size }
      if (keyword.trim()) params.keyword = keyword.trim()
      if (statusFilter) params.status = statusFilter
      const res = await api.get(`/classrooms/${classCode}/assignments`, { params })
      if (res.data?.content !== undefined) {
        setAssignments(res.data.content)
        setTotalPages(res.data.totalPages)
        setTotalElements(res.data.totalElements)
      } else {
        setAssignments(Array.isArray(res.data) ? res.data : [])
      }
    } catch (err: any) {
      toast.error('Không thể tải danh sách bài tập')
    } finally {
      setLoading(false)
    }
  }, [classCode, keyword, statusFilter, page, size])

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
      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white p-3.5 rounded-2xl border border-border shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            id="assignment-search"
            type="text"
            placeholder="Tìm kiếm theo tiêu đề bài tập..."
            value={keywordInput}
            onChange={(e) => setKeywordInput(e.target.value)}
            className="w-full h-11 pl-10 pr-4 rounded-xl border border-border bg-slate-50/50 text-sm outline-none transition-all focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/15"
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            id="assignment-status-filter"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(0) }}
            className="h-11 px-3 rounded-xl border border-border bg-slate-50/50 text-sm outline-none transition-all focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/15 min-w-[160px]"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="DRAFT">Bản nháp</option>
            <option value="PUBLISHED">Đã giao</option>
          </select>
          <button
            onClick={() => fetchAssignments()}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-white text-muted-foreground hover:text-foreground hover:bg-slate-50 transition-all shadow-sm flex-shrink-0"
            title="Làm mới"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Assignment list panel */}
      <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
        {/* Panel header */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-border bg-gradient-to-r from-slate-50 to-transparent">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100">
              <BookOpen className="h-4.5 w-4.5 text-slate-600" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">Danh sách bài tập</h2>
              <p className="text-xs text-muted-foreground">
                {loading ? 'Đang tải...' : `${totalElements} bài tập`}
              </p>
            </div>
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
                {keyword || statusFilter ? 'Không tìm thấy bài tập phù hợp' : 'Chưa có bài tập nào'}
              </p>
              <p className="text-xs text-muted-foreground max-w-xs">
                {keyword || statusFilter ? 'Thử thay đổi bộ lọc tìm kiếm.' : 'Tạo bài tập mới và giao cho lớp này.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {assignments.map((assignment) => (
              <AssignmentRow
                key={assignment.id}
                assignment={assignment}
                onPublish={() => openPublishModal(assignment)}
              />
            ))}
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
