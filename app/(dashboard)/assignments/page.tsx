'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Plus, BookMarked, Search, Edit, Trash2, Send, Clock, BookOpen, Layers } from 'lucide-react'
import api from '@/lib/axios'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { PublishAssignmentModal } from '@/components/dashboard/publish-assignment-modal'
import { DeleteAssignmentModal } from '@/components/dashboard/delete-assignment-modal'

interface Assignment {
  id: number
  title: string
  description: string
  deadline: string
  status: string
  isOpen: boolean
  teacherName: string
  classCode: string
  className: string
  hasSubmissions?: boolean
}

export default function AssignmentsPage() {
  const router = useRouter()
  const [userRole, setUserRole] = useState<string>('STUDENT')
  const [isRoleLoaded, setIsRoleLoaded] = useState(false)
  const [activeTab, setActiveTab] = useState<'DRAFT' | 'ARCHIVED'>('DRAFT')
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [myClasses, setMyClasses] = useState<{ id: number, classCode: string, className: string }[]>([])
  const [selectedClassCode, setSelectedClassCode] = useState<string>('')

  // Publish Modal State
  const [publishModalOpen, setPublishModalOpen] = useState(false)
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<number | null>(null)

  // Delete Confirm Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null)
  const [deleteTargetTitle, setDeleteTargetTitle] = useState<string>('')
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const stored = sessionStorage.getItem('user_info') || localStorage.getItem('user_info')
    if (stored) {
      try {
        const info = JSON.parse(stored)
        setUserRole(info.role || info.userRole || 'STUDENT')
      } catch { }
    }
    setIsRoleLoaded(true)
  }, [])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput)
    }, 500)
    return () => clearTimeout(timer)
  }, [searchInput])

  useEffect(() => {
    if (userRole === 'STUDENT') {
      const fetchClasses = async () => {
        try {
          const res = await api.get('/classrooms/my-classroom')
          if (Array.isArray(res.data)) {
            setMyClasses(res.data)
          }
        } catch (error) {
          console.error('Error fetching classes:', error)
        }
      }
      fetchClasses()
    }
  }, [userRole])

  const fetchAssignments = useCallback(async () => {
    if (!isRoleLoaded) return

    try {
      setLoading(true)
      let url = '/assignments?'
      if (userRole === 'TEACHER') {
        url += `status=${activeTab}`
      } else {
        url += `status=PUBLISHED`
        if (selectedClassCode) {
          url += `&classCode=${selectedClassCode}`
        }
      }
      if (searchQuery) {
        url += `&keyword=${encodeURIComponent(searchQuery)}`
      }

      const response = await api.get(url)
      if (response.data && response.data.content) {
        setAssignments(response.data.content)
      } else {
        setAssignments([])
      }
    } catch (error) {
      console.error('Error fetching assignments:', error)
      toast.error('Lỗi khi tải danh sách bài tập')
    } finally {
      setLoading(false)
    }
  }, [activeTab, userRole, searchQuery, isRoleLoaded, selectedClassCode])

  useEffect(() => {
    fetchAssignments()
  }, [fetchAssignments])

  const handleDeleteClick = (id: number, title: string) => {
    setDeleteTargetId(id)
    setDeleteTargetTitle(title)
    setDeleteModalOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (deleteTargetId === null) return
    try {
      setIsDeleting(true)
      await api.delete(`/assignments/${deleteTargetId}`)
      toast.success('Đã xóa bài tập thành công')
      setDeleteModalOpen(false)
      setDeleteTargetId(null)
      fetchAssignments()
    } catch (error) {
      console.error('Error deleting assignment:', error)
      toast.error('Xóa bài tập thất bại. Vui lòng thử lại.')
    } finally {
      setIsDeleting(false)
    }
  }

  const handlePublishClick = (id: number) => {
    setSelectedAssignmentId(id)
    setPublishModalOpen(true)
  }

  const handleEditClick = (id: number, hasSubmissions?: boolean) => {
    if (hasSubmissions) return
    router.push(`/assignments/${id}/edit`)
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/50">
      <div className="border-b border-border bg-white py-6">
        <div className="mx-auto max-w-screen-xl px-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <BookMarked className="h-5.5 w-5.5 text-primary" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                {userRole === 'TEACHER' ? 'Kho bài tập' : 'Bài tập được giao'}
              </h1>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {userRole === 'TEACHER'
                ? 'Quản lý, chỉnh sửa và giao bài tập cho học sinh của bạn.'
                : 'Xem các bài tập được giáo viên giao cho lớp của bạn.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {userRole === 'TEACHER' && (
              <Link
                href="/assignments/create"
                className="flex items-center gap-2 h-10 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/95 transition-all shadow-md shadow-primary/10 hover:shadow-primary/20 active:scale-98"
              >
                <Plus className="h-4.5 w-4.5" />
                Tạo bài tập mới
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-screen-xl px-6 py-8 space-y-6">

          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            {/* Tabs for TEACHER */}
            {userRole === 'TEACHER' ? (
              <div className="flex bg-slate-200/50 p-1 rounded-xl w-full sm:w-auto">
                <button
                  onClick={() => setActiveTab('DRAFT')}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'DRAFT'
                      ? 'bg-white text-primary shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                  <Edit className="h-4 w-4" />
                  Bản nháp
                </button>
                <button
                  onClick={() => setActiveTab('ARCHIVED')}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'ARCHIVED'
                      ? 'bg-white text-primary shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                  <Layers className="h-4 w-4" />
                  Kho lưu trữ
                </button>
              </div>
            ) : (
              <div /> // Empty div to push search to right
            )}

            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
              {userRole === 'STUDENT' && (
                <select
                  value={selectedClassCode}
                  onChange={(e) => setSelectedClassCode(e.target.value)}
                  className="w-full sm:w-auto h-11 pl-4 pr-10 rounded-xl border border-border bg-white text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/15 appearance-none cursor-pointer"
                  style={{ backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'/%3e%3c/svg%3e")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1em' }}
                >
                  <option value="">Tất cả lớp học</option>
                  {myClasses.map((c) => (
                    <option key={c.classCode} value={c.classCode}>
                      {c.className}
                    </option>
                  ))}
                </select>
              )}
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Tìm kiếm bài tập..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full h-11 pl-10 pr-4 rounded-xl border border-border bg-white text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/15"
                />
              </div>
            </div>
          </div>

          {/* Assignments Grid */}
          {loading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-48 rounded-2xl border border-border bg-white p-6 shadow-sm animate-pulse flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="h-6 bg-slate-200 rounded w-3/4" />
                    <div className="h-4 bg-slate-100 rounded w-full" />
                  </div>
                  <div className="h-10 bg-slate-100 rounded-xl" />
                </div>
              ))}
            </div>
          ) : assignments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-4 bg-white border border-border rounded-2xl text-center space-y-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/5 text-primary">
                <BookOpen className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Không tìm thấy bài tập nào</h3>
              <p className="text-sm text-muted-foreground">
                {activeTab === 'DRAFT'
                  ? 'Bạn chưa tạo bản nháp nào. Hãy bắt đầu bằng cách tạo bài tập mới.'
                  : activeTab === 'ARCHIVED'
                    ? 'Kho lưu trữ của bạn đang trống.'
                    : 'Chưa có bài tập nào được giao cho bạn.'}
              </p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {assignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="group flex flex-col justify-between rounded-2xl border border-border bg-white overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1"
                >
                  <div className={`h-1.5 w-full ${userRole === 'TEACHER' && activeTab === 'ARCHIVED'
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

                    {assignment.status !== 'DRAFT' && userRole !== "TEACHER" && (
                      <div className="bg-slate-50 rounded-xl p-3 mb-4 space-y-2 border border-slate-100">
                        {assignment.className && (
                          <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                            Lớp: {assignment.className}
                          </div>
                        )}
                        {assignment.deadline && (
                          <div className="flex items-center gap-2 text-xs font-medium text-rose-600">
                            <Clock className="h-3.5 w-3.5" />
                            Hạn nộp: {new Date(assignment.deadline).toLocaleString('vi-VN', {
                              day: '2-digit', month: '2-digit', year: 'numeric',
                              hour: '2-digit', minute: '2-digit'
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {userRole === 'TEACHER' ? (
                    <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-2">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditClick(assignment.id, assignment.hasSubmissions)}
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
                          onClick={() => handleDeleteClick(assignment.id, assignment.title)}
                          className="p-2 rounded-lg text-muted-foreground hover:bg-white hover:text-destructive hover:shadow-sm transition-all"
                          title="Xóa bài tập"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <button
                        onClick={() => handlePublishClick(assignment.id)}
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
                        href={`/assignments/submit?id=${assignment.id}`}
                        className="flex w-full items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-semibold shadow-sm hover:bg-primary/95 transition-all active:scale-95"
                      >
                        Vào làm bài
                      </Link>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <PublishAssignmentModal
        open={publishModalOpen}
        onClose={() => setPublishModalOpen(false)}
        onSuccess={() => {
          setPublishModalOpen(false)
          fetchAssignments()
        }}
        assignmentId={selectedAssignmentId}
      />

      <DeleteAssignmentModal
        open={deleteModalOpen}
        assignmentTitle={deleteTargetTitle}
        isDraft={activeTab === 'DRAFT'}
        isDeleting={isDeleting}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  )
}
