'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, BookMarked, Search, Edit, Layers, Clock, BookOpen, CheckCircle, AlertCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { PublishAssignmentModal } from '@/components/assignments/publish-assignment-modal'
import { DeleteAssignmentModal } from './delete-assignment-modal'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import { useAssignments, useDeleteAssignment } from '@/hooks/useAssignments'
import { useMyClassrooms } from '@/hooks/useClassrooms'
import { AssignmentCard } from './assignment-card'
import { parseDateSafe } from '@/lib/utils'
import { PermissionGuard } from '@/components/ui/with-permission'

export function AssignmentsPageClient() {
  const router = useRouter()
  const { user } = useAuth()
  const userRole = user?.role || 'STUDENT'
  const queryClient = useQueryClient()
  
  const [activeTab, setActiveTab] = useState<string>('PENDING')
  
  useEffect(() => {
    if (user?.role === 'TEACHER' && activeTab === 'PENDING') {
      setActiveTab('DRAFT')
    }
  }, [user, activeTab])

  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedClassCode, setSelectedClassCode] = useState<string>('')

  const [publishModalOpen, setPublishModalOpen] = useState(false)
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<number | null>(null)

  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null)
  const [deleteTargetTitle, setDeleteTargetTitle] = useState<string>('')

  useEffect(() => {
    const timer = setTimeout(() => setSearchQuery(searchInput), 500)
    return () => clearTimeout(timer)
  }, [searchInput])

  const { data: myClasses = [] } = useMyClassrooms()
  
  const { data: assignments = [], isLoading: loading } = useAssignments({
    userRole,
    activeTab,
    searchQuery,
    selectedClassCode
  })

  const deleteMutation = useDeleteAssignment()

  const handleDeleteClick = (id: number, title: string) => {
    setDeleteTargetId(id)
    setDeleteTargetTitle(title)
    setDeleteModalOpen(true)
  }

  const handleDeleteConfirm = () => {
    if (deleteTargetId === null) return
    deleteMutation.mutate(deleteTargetId, {
      onSuccess: () => {
        toast.success('Đã xóa bài tập thành công')
        setDeleteModalOpen(false)
        setDeleteTargetId(null)
      },
      onError: () => toast.error('Xóa bài tập thất bại. Vui lòng thử lại.')
    })
  }

  const handlePublishClick = (id: number) => {
    setSelectedAssignmentId(id)
    setPublishModalOpen(true)
  }

  const handleEditClick = (id: number, hasSubmissions?: boolean) => {
    if (hasSubmissions) return
    router.push(`/assignments/${id}/edit`)
  }

  const displayAssignments = assignments.filter(assignment => {
    if (userRole === 'TEACHER') return true

    const status = assignment.submissionStatus
    const isOverdue = assignment.deadline && (parseDateSafe(assignment.deadline)?.getTime() ?? 0) < Date.now()

    if (activeTab === 'PENDING') return (status === null || status === 'DRAFT') && !isOverdue
    if (activeTab === 'SUBMITTED') return status === 'SUBMITTED'
    if (activeTab === 'GRADED') return status === 'GRADED'
    if (activeTab === 'OVERDUE') return (status === null || status === 'DRAFT') && isOverdue

    return true
  })

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
              <PermissionGuard permission="assignment:create">
                <Link
                  href="/assignments/create"
                  className="flex items-center gap-2 h-10 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/95 transition-all shadow-md shadow-primary/10 hover:shadow-primary/20 active:scale-98"
                >
                  <Plus className="h-4.5 w-4.5" />
                  Tạo bài tập mới
                </Link>
              </PermissionGuard>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-screen-xl px-6 py-8 space-y-6">

          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex bg-slate-200/50 p-1 rounded-xl w-full sm:w-auto">
              {userRole === 'TEACHER' ? (
                <>
                  <button onClick={() => setActiveTab('DRAFT')} className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'DRAFT' ? 'bg-white text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
                    <Edit className="h-4 w-4" /> Bản nháp
                  </button>
                  <button onClick={() => setActiveTab('ARCHIVED')} className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'ARCHIVED' ? 'bg-white text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
                    <Layers className="h-4 w-4" /> Kho lưu trữ
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => setActiveTab('PENDING')} className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'PENDING' ? 'bg-white text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
                    <Clock className="h-4 w-4" /> Chưa nộp
                  </button>
                  <button onClick={() => setActiveTab('SUBMITTED')} className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'SUBMITTED' ? 'bg-white text-emerald-600 shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
                    <CheckCircle className="h-4 w-4" /> Đã nộp
                  </button>
                  <button onClick={() => setActiveTab('GRADED')} className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'GRADED' ? 'bg-white text-blue-600 shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
                    <BookOpen className="h-4 w-4" /> Đã chấm điểm
                  </button>
                  <button onClick={() => setActiveTab('OVERDUE')} className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'OVERDUE' ? 'bg-white text-rose-600 shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
                    <AlertCircle className="h-4 w-4" /> Quá hạn
                  </button>
                </>
              )}
            </div>

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
                    <option key={c.classCode} value={c.classCode}>{c.className}</option>
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
          ) : displayAssignments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-4 bg-white border border-border rounded-2xl text-center space-y-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/5 text-primary">
                <BookOpen className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Không tìm thấy bài tập nào</h3>
              <p className="text-sm text-muted-foreground">
                {userRole === 'TEACHER'
                  ? activeTab === 'DRAFT'
                    ? 'Bạn chưa tạo bản nháp nào. Hãy bắt đầu bằng cách tạo bài tập mới.'
                    : 'Kho lưu trữ của bạn đang trống.'
                  : activeTab === 'PENDING'
                    ? 'Bạn không có bài tập nào cần làm lúc này.'
                    : activeTab === 'SUBMITTED'
                      ? 'Bạn chưa nộp bài tập nào.'
                      : activeTab === 'GRADED'
                        ? 'Bạn chưa có bài tập nào được chấm điểm.'
                        : 'Bạn không có bài tập nào quá hạn.'}
              </p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {displayAssignments.map((assignment, index) => (
                <AssignmentCard 
                  key={assignment.id} 
                  assignment={assignment} 
                  userRole={userRole}
                  activeTab={activeTab}
                  index={index}
                  onEdit={handleEditClick}
                  onDelete={handleDeleteClick}
                  onPublish={handlePublishClick}
                />
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
          queryClient.invalidateQueries({ queryKey: ['assignments'] })
        }}
        assignmentId={selectedAssignmentId}
      />

      <DeleteAssignmentModal
        open={deleteModalOpen}
        assignmentTitle={deleteTargetTitle}
        isDraft={activeTab === 'DRAFT'}
        isDeleting={deleteMutation.isPending}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  )
}
