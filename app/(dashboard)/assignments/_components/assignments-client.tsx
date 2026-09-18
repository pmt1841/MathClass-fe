'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { Plus, BookMarked, Search, Edit, Layers, Clock, BookOpen, CheckCircle, AlertCircle, Filter, Sparkles } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { AssignmentTagInput } from '@/components/assignments/assignment-tag-input'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { PublishAssignmentModal } from '@/components/assignments/publish-assignment-modal'
import { PublishSheetModal } from '@/components/assignments/publish-sheet-modal'
import { EditSheetModal } from '@/components/assignments/edit-sheet-modal'
import { DeleteAssignmentModal } from './delete-assignment-modal'
import { AiBatchQuestionGeneratorModal } from '@/components/ai/AiBatchQuestionGeneratorModal'
import { useAiFeatures, AI_FEATURE_TASKS } from '@/hooks/useAiFeatures'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import { useAssignments, useDeleteAssignment } from '@/hooks/useAssignments'
import { useMyClassrooms } from '@/hooks/useClassrooms'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@/components/ui/pagination'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { AssignmentCard } from './assignment-card'
import { PermissionGuard } from '@/components/ui/with-permission'
import { assignmentService, AssignmentTag } from '@/services/assignmentService'

export function AssignmentsPageClient() {
  const router = useRouter()
  const { user } = useAuth()
  const userRole = user?.role || 'STUDENT'

  const [activeTab, setActiveTab] = useState<string>('PENDING')
  const [assignmentType, setAssignmentType] = useState<'ALL' | 'SINGLE' | 'SHEET'>('ALL')
  const [selectedAssignmentDetails, setSelectedAssignmentDetails] = useState<{ id: number, title: string, maxScore?: number }[]>([])
  const selectedAssignments = useMemo(() => selectedAssignmentDetails.map(a => a.id), [selectedAssignmentDetails])
  const [publishSheetModalOpen, setPublishSheetModalOpen] = useState(false)
  const [showAiBatchModal, setShowAiBatchModal] = useState(false)
  const { data: aiFeatures } = useAiFeatures()
  const isAiBatchGenEnabled = aiFeatures?.[AI_FEATURE_TASKS.BATCH_QUESTION_GEN] === true
  const [page, setPage] = useState(0)

  useEffect(() => {
    if (userRole === 'TEACHER' && activeTab === 'PENDING') {
      setActiveTab('DRAFT')
    }
    // Clear selections when tab changes
    setSelectedAssignmentDetails([])
    setPage(0)
  }, [userRole, activeTab])

  useEffect(() => {
    setPage(0)
  }, [assignmentType])

  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedClassCode, setSelectedClassCode] = useState<string>('')
  const [tags, setTags] = useState<AssignmentTag[]>([])
  const [selectedTagNames, setSelectedTagNames] = useState<string[]>([])

  useEffect(() => { assignmentService.getTags().then(setTags).catch(() => toast.error('Không thể tải danh sách tag')) }, [])
  useEffect(() => { setPage(0) }, [selectedTagNames])

  const [publishModalOpen, setPublishModalOpen] = useState(false)
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<number | null>(null)

  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null)
  const [deleteTargetTitle, setDeleteTargetTitle] = useState<string>('')

  const [editSheetModalOpen, setEditSheetModalOpen] = useState(false)
  const [editSheetTarget, setEditSheetTarget] = useState<any>(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput)
      setPage(0)
    }, 500)
    return () => clearTimeout(timer)
  }, [searchInput])

  const [pageSize, setPageSize] = useState(6)

  const { data: myClasses = [] } = useMyClassrooms()

  const { data: assignmentsData, isLoading: loading } = useAssignments({
    userRole,
    activeTab,
    searchQuery,
    selectedClassCode,
    page,
    size: pageSize,
    assignmentType,
    tagNames: selectedTagNames
  })

  const assignments = assignmentsData?.items || []
  let totalPages = assignmentsData?.totalPages || 1

  const queryClient = useQueryClient()
  const deleteMutation = useDeleteAssignment()
  const [deleteIsSheet, setDeleteIsSheet] = useState(false)

  const handleDeleteClick = (id: number, title: string, isSheet?: boolean) => {
    setDeleteTargetId(id)
    setDeleteTargetTitle(title)
    setDeleteIsSheet(!!isSheet)
    setDeleteModalOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (deleteTargetId === null) return
    if (deleteIsSheet) {
      try {
        await assignmentService.deleteAssignmentSheet(deleteTargetId)
        toast.success('Đã xóa phiếu bài tập thành công')
        queryClient.invalidateQueries({ queryKey: ['assignments'] })
        setDeleteModalOpen(false)
        setDeleteTargetId(null)
      } catch (error) {
        toast.error('Xóa phiếu bài tập thất bại. Vui lòng thử lại.')
      }
    } else {
      deleteMutation.mutate(deleteTargetId, {
        onSuccess: () => {
          toast.success('Đã xóa bài tập thành công')
          setDeleteModalOpen(false)
          setDeleteTargetId(null)
        },
        onError: () => toast.error('Xóa bài tập thất bại. Vui lòng thử lại.')
      })
    }
  }

  const [publishingTarget, setPublishingTarget] = useState<any>(null)
  const [sheetModalAssignmentIds, setSheetModalAssignmentIds] = useState<number[]>([])

  const handlePublishClick = (id: number, isSheet?: boolean) => {
    const targetObj = assignments.find((a: any) => a.id === id && (isSheet ? a.type === 'SHEET' : a.type !== 'SHEET'))
    setPublishingTarget(targetObj || null)
    if (isSheet) {
      const itemIds = targetObj?.items?.map((it: any) => it.id) || []
      setSheetModalAssignmentIds(itemIds)
      setPublishSheetModalOpen(true)
    } else {
      setSelectedAssignmentId(id)
      setPublishModalOpen(true)
    }
  }

  const handleEditClick = (id: number, hasSubmissions?: boolean, isSheet?: boolean) => {
    if (isSheet) {
      const sheet = assignments.find((a: any) => a.id === id && a.type === 'SHEET')
      if (sheet) {
        setEditSheetTarget(sheet)
        setEditSheetModalOpen(true)
      }
      return
    }
    if (hasSubmissions) return
    router.push(`/assignments/${id}/edit`)
  }

  const handleClearFilters = useCallback(() => {
    setAssignmentType('ALL')
    setSelectedClassCode('')
    setSelectedTagNames([])
  }, [])

  const handleSelectAssignment = useCallback((id: number, selected: boolean) => {
    if (selected) {
      if (selectedAssignmentDetails.length >= 5) {
        toast.error('Chỉ được chọn tối đa 5 bài tập cho một phiếu')
        return
      }
      const assignment = assignments.find((a: any) => a.id === id)
      if (assignment) {
        setSelectedAssignmentDetails(prev => {
          if (prev.some(p => p.id === id)) return prev
          return [...prev, { id: assignment.id, title: assignment.title, maxScore: assignment.maxScore }]
        })
      }
    } else {
      setSelectedAssignmentDetails(prev => prev.filter(a => a.id !== id))
    }
  }, [assignments, selectedAssignmentDetails.length])

  const displaySingleItems = assignmentsData?.singleItems || []
  const displaySheetItems = assignmentsData?.sheetItems || []
  const displayAssignments = assignments

  const showEmptyState = useMemo(() => {
    return userRole === 'STUDENT' && assignmentType === 'ALL'
      ? displaySingleItems.length === 0 && displaySheetItems.length === 0
      : displayAssignments.length === 0
  }, [userRole, assignmentType, displaySingleItems.length, displaySheetItems.length, displayAssignments.length])

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/50">
      <div className="border-b border-border bg-white py-6">
        <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
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
                {isAiBatchGenEnabled && (
                  <button
                    type="button"
                    onClick={() => setShowAiBatchModal(true)}
                    className="flex items-center gap-2 h-10 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 text-sm font-semibold text-white hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md shadow-indigo-500/15 hover:shadow-indigo-500/25 active:scale-98 cursor-pointer"
                  >
                    <Sparkles className="h-4.5 w-4.5" />
                    Tạo hàng loạt bằng AI
                  </button>
                )}
                <Link
                  href="/assignments/create"
                  className="flex items-center gap-2 h-10 rounded-xl bg-primary px-4 text-sm font-semibold text-white hover:bg-primary/95 transition-all shadow-md shadow-primary/10 hover:shadow-primary/20 active:scale-98"
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
        <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 py-6 sm:py-8 space-y-6 w-full">

          {/* Thanh công cụ lọc bài tập flex-wrap mượt mà */}
          <div className="flex flex-wrap items-center gap-3 w-full">
            {/* Ô tìm kiếm tự động dãn dài lấp đầy khoảng trống */}
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Tìm kiếm bài tập..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full h-11 pl-10 pr-4 rounded-xl border border-border bg-white text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/15"
              />
            </div>

            {/* Popover Bộ lọc chứa Loại bài, Lớp học và Môn học/Khối lớp/Độ khó */}
            <Popover>
              <PopoverTrigger asChild>
                <button className="relative flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all shrink-0">
                  <Filter className="h-4 w-4" />
                  Bộ lọc
                  {(Boolean(assignmentType !== 'ALL') || Boolean(selectedClassCode) || selectedTagNames.length > 0) && (
                    <span className="rounded-full bg-primary px-1.5 text-xs text-white">
                      {(assignmentType !== 'ALL' ? 1 : 0) + (selectedClassCode ? 1 : 0) + selectedTagNames.length}
                    </span>
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-80 space-y-4 p-4">
                <div className="flex items-center justify-between border-b pb-2">
                  <p className="text-sm font-bold text-foreground">Bộ lọc bài tập</p>
                  {(assignmentType !== 'ALL' || selectedClassCode || selectedTagNames.length > 0) && (
                    <button
                      onClick={handleClearFilters}
                      className="text-xs font-semibold text-primary hover:underline"
                    >
                      Xóa bộ lọc
                    </button>
                  )}
                </div>

                {userRole === 'STUDENT' && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-600">Loại bài tập</label>
                    <select
                      value={assignmentType}
                      onChange={(e) => setAssignmentType(e.target.value as 'ALL' | 'SINGLE' | 'SHEET')}
                      className="w-full h-10 pl-3 pr-8 rounded-lg border border-border bg-white text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/15 appearance-none cursor-pointer truncate"
                      style={{ backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'/%3e%3c/svg%3e")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1em' }}
                    >
                      <option value="ALL">Tất cả loại bài</option>
                      <option value="SINGLE">Bài tập lẻ</option>
                      <option value="SHEET">Phiếu bài tập</option>
                    </select>
                  </div>
                )}

                {userRole === 'STUDENT' && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-600">Lớp học</label>
                    <select
                      value={selectedClassCode}
                      onChange={(e) => setSelectedClassCode(e.target.value)}
                      className="w-full h-10 pl-3 pr-8 rounded-lg border border-border bg-white text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/15 appearance-none cursor-pointer truncate"
                      style={{ backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'/%3e%3c/svg%3e")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1em' }}
                    >
                      <option value="">Tất cả lớp học</option>
                      {myClasses.map((c) => (
                        <option key={c.classCode} value={c.classCode}>{c.className}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600">Thẻ bài tập</label>
                  <AssignmentTagInput
                    value={selectedTagNames}
                    onChange={(tags) => setSelectedTagNames(tags)}
                    placeholder="Nhập tag để lọc..."
                  />
                </div>
              </PopoverContent>
            </Popover>

            {/* Thanh Tabs chuyển đổi trạng thái bài tập */}
            <div className="flex bg-slate-200/60 p-1 rounded-xl items-center gap-1 flex-wrap sm:flex-nowrap shrink-0 max-w-full">
              {userRole === 'TEACHER' ? (
                <>
                  <button onClick={() => setActiveTab('DRAFT')} className={`whitespace-nowrap flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'DRAFT' ? 'bg-white text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
                    <Edit className="h-4 w-4" /> Bản nháp
                  </button>
                  <button onClick={() => setActiveTab('SINGLE')} className={`whitespace-nowrap flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'SINGLE' ? 'bg-white text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
                    <BookOpen className="h-4 w-4" /> Bài tập lẻ
                  </button>
                  <button onClick={() => setActiveTab('SHEET')} className={`whitespace-nowrap flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'SHEET' ? 'bg-white text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
                    <Layers className="h-4 w-4" /> Phiếu bài tập
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => setActiveTab('PENDING')} className={`whitespace-nowrap flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'PENDING' ? 'bg-white text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
                    <Clock className="h-4 w-4" /> Chưa nộp
                  </button>
                  <button onClick={() => setActiveTab('SUBMITTED')} className={`whitespace-nowrap flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'SUBMITTED' ? 'bg-white text-emerald-600 shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
                    <CheckCircle className="h-4 w-4" /> Đã nộp
                  </button>
                  <button onClick={() => setActiveTab('GRADED')} className={`whitespace-nowrap flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'GRADED' ? 'bg-white text-blue-600 shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
                    <BookOpen className="h-4 w-4" /> Đã chấm điểm
                  </button>
                  <button onClick={() => setActiveTab('OVERDUE')} className={`whitespace-nowrap flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'OVERDUE' ? 'bg-white text-rose-600 shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
                    <AlertCircle className="h-4 w-4" /> Quá hạn
                  </button>
                </>
              )}
            </div>

            {userRole === 'TEACHER' && (activeTab === 'DRAFT' || activeTab === 'SINGLE') && selectedAssignments.length > 0 && (
              <button
                onClick={() => {
                  setPublishingTarget(null)
                  setSheetModalAssignmentIds(selectedAssignments)
                  setPublishSheetModalOpen(true)
                }}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all shadow-sm animate-in zoom-in-95 duration-200 shrink-0"
              >
                <Layers className="h-4 w-4" />
                Giao {selectedAssignments.length} bài thành phiếu
              </button>
            )}
          </div>

          {loading ? (
            <div className={activeTab === 'SHEET' ? "flex flex-col gap-4" : "grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"}>
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className={`rounded-2xl border border-border bg-white p-6 shadow-sm animate-pulse flex flex-col justify-between ${activeTab === 'SHEET' ? 'h-24' : 'h-48'
                    }`}
                >
                  <div className="space-y-3">
                    <div className="h-6 bg-slate-200 rounded w-3/4" />
                    <div className="h-4 bg-slate-100 rounded w-1/2" />
                  </div>
                  {activeTab !== 'SHEET' && <div className="h-10 bg-slate-100 rounded-xl" />}
                </div>
              ))}
            </div>
          ) : showEmptyState ? (
            <div className="flex flex-col items-center justify-center py-20 px-4 bg-white border border-border rounded-2xl text-center space-y-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/5 text-primary">
                <BookOpen className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Không tìm thấy bài tập nào</h3>
              <p className="text-sm text-muted-foreground">
                {userRole === 'TEACHER'
                  ? activeTab === 'DRAFT'
                    ? 'Bạn chưa tạo bản nháp nào. Hãy bắt đầu bằng cách tạo bài tập mới.'
                    : activeTab === 'SINGLE'
                      ? 'Kho bài tập lẻ của bạn đang trống.'
                      : 'Bạn chưa tạo phiếu bài tập nào.'
                  : activeTab === 'PENDING'
                    ? 'Bạn không có bài tập nào cần làm lúc này.'
                    : activeTab === 'SUBMITTED'
                      ? 'Bạn chưa nộp bài tập nào.'
                      : activeTab === 'GRADED'
                        ? 'Bạn chưa có bài tập nào được chấm điểm.'
                        : 'Bạn không có bài tập nào quá hạn.'}
              </p>
            </div>
          ) : userRole === 'STUDENT' && assignmentType === 'ALL' ? (
            <div className="space-y-12">
              {displaySingleItems.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-foreground">Bài tập lẻ</h3>
                    <button
                      onClick={() => setAssignmentType('SINGLE')}
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      Tất cả bài tập lẻ
                    </button>
                  </div>
                  <Carousel className="w-full relative px-2">
                    <CarouselContent className="-ml-4 py-4">
                      {displaySingleItems.map((assignment, index) => (
                        <CarouselItem key={`single-${assignment.id}`} className="pl-4 md:basis-1/2 lg:basis-1/3">
                          <AssignmentCard
                            assignment={assignment}
                            userRole={userRole}
                            activeTab={activeTab}
                            index={index}
                            isHorizontal={false}
                            onEdit={handleEditClick}
                            onPublish={handlePublishClick}
                            onDelete={handleDeleteClick}
                          />
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    <CarouselPrevious className="left-0 bg-white shadow-md border-border text-foreground hover:bg-slate-100 z-10" />
                    <CarouselNext className="right-0 bg-white shadow-md border-border text-foreground hover:bg-slate-100 z-10" />
                  </Carousel>
                </div>
              )}

              {displaySheetItems.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-foreground">Phiếu bài tập</h3>
                    <button
                      onClick={() => setAssignmentType('SHEET')}
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      Tất cả phiếu bài tập
                    </button>
                  </div>
                  <Carousel className="w-full relative px-2">
                    <CarouselContent className="-ml-4 py-4">
                      {displaySheetItems.map((assignment, index) => (
                        <CarouselItem key={`sheet-${assignment.id}`} className="pl-4 md:basis-1/2 lg:basis-1/3">
                          <AssignmentCard
                            assignment={assignment}
                            userRole={userRole}
                            activeTab={activeTab}
                            index={index}
                            isHorizontal={false}
                            onEdit={handleEditClick}
                            onPublish={handlePublishClick}
                            onDelete={handleDeleteClick}
                          />
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    <CarouselPrevious className="left-0 bg-white shadow-md border-border text-foreground hover:bg-slate-100 z-10" />
                    <CarouselNext className="right-0 bg-white shadow-md border-border text-foreground hover:bg-slate-100 z-10" />
                  </Carousel>
                </div>
              )}
            </div>
          ) : (
            <div className={activeTab === 'SHEET' || assignmentType === 'SHEET' ? "flex flex-col gap-4" : "grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"}>
              {displayAssignments.map((assignment, index) => (
                <AssignmentCard
                  key={assignment.type === 'SHEET' ? `sheet-${assignment.id}` : `assignment-${assignment.id}`}
                  assignment={assignment}
                  userRole={userRole}
                  activeTab={activeTab}
                  index={index}
                  isHorizontal={activeTab === 'SHEET' || assignmentType === 'SHEET'}
                  selectable={userRole === 'TEACHER' && (activeTab === 'DRAFT' || activeTab === 'SINGLE') && assignment.type !== 'SHEET'}
                  selected={selectedAssignments.includes(assignment.id)}
                  onSelect={handleSelectAssignment}
                  onEdit={handleEditClick}
                  onDelete={handleDeleteClick}
                  onPublish={handlePublishClick}
                />
              ))}
            </div>
          )}

          {!loading && displayAssignments.length > 0 && (totalPages > 1 || (assignmentsData?.totalElements || 0) > 6) && (
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border pt-6">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Hiển thị:</span>
                <Select
                  value={String(pageSize)}
                  onValueChange={(val) => {
                    setPageSize(Number(val))
                    setPage(0)
                  }}
                >
                  <SelectTrigger className="h-8 w-[70px] bg-white text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="6">6</SelectItem>
                    <SelectItem value="12">12</SelectItem>
                    <SelectItem value="24">24</SelectItem>
                    <SelectItem value="48">48</SelectItem>
                  </SelectContent>
                </Select>
                <span>bài / trang</span>
                {(assignmentsData?.totalElements || 0) > 0 && (
                  <>
                    <span className="hidden sm:inline text-muted-foreground/40">|</span>
                    <span className="hidden sm:inline">Tổng cộng: {assignmentsData?.totalElements} bài</span>
                  </>
                )}
              </div>

              {totalPages > 1 && (
                <Pagination className="w-auto mx-0">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(e) => {
                          e.preventDefault()
                          if (page > 0) setPage(page - 1)
                        }}
                        className={page === 0 ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>

                    {[...Array(totalPages)].map((_, i) => {
                      if (i === 0 || i === totalPages - 1 || (i >= page - 1 && i <= page + 1)) {
                        return (
                          <PaginationItem key={i}>
                            <PaginationLink
                              href="#"
                              isActive={page === i}
                              onClick={(e) => {
                                e.preventDefault()
                                setPage(i)
                              }}
                            >
                              {i + 1}
                            </PaginationLink>
                          </PaginationItem>
                        )
                      } else if (i === page - 2 || i === page + 2) {
                        return (
                          <PaginationItem key={i}>
                            <PaginationEllipsis />
                          </PaginationItem>
                        )
                      }
                      return null
                    })}

                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(e) => {
                          e.preventDefault()
                          if (page < totalPages - 1) setPage(page + 1)
                        }}
                        className={page >= totalPages - 1 ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
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
        publishedClassCodes={publishingTarget?.publishedClassCodes}
      />

      <PublishSheetModal
        open={publishSheetModalOpen}
        assignmentIds={sheetModalAssignmentIds}
        assignments={
          publishingTarget?.type === 'SHEET'
            ? publishingTarget.items?.map((it: any) => ({ id: it.id, title: it.title, maxScore: it.maxScore })) || []
            : selectedAssignmentDetails
        }
        publishedClassCodes={publishingTarget?.publishedClassCodes}
        defaultTitle={publishingTarget?.title || ''}
        defaultDescription={publishingTarget?.description || ''}
        masterSheetId={publishingTarget?.type === 'SHEET' ? publishingTarget?.id : undefined}
        onClose={() => {
          setPublishSheetModalOpen(false)
          setSheetModalAssignmentIds([])
        }}
        onSuccess={() => {
          setPublishSheetModalOpen(false)
          setSelectedAssignmentDetails([])
          setSheetModalAssignmentIds([])
          queryClient.invalidateQueries({ queryKey: ['assignments'] })
        }}
      />

      <DeleteAssignmentModal
        open={deleteModalOpen}
        assignmentTitle={deleteTargetTitle}
        isDraft={activeTab === 'DRAFT'}
        isDeleting={deleteMutation.isPending}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
      />

      <EditSheetModal
        open={editSheetModalOpen}
        sheetId={editSheetTarget?.id || null}
        initialTitle={editSheetTarget?.title || ''}
        initialDescription={editSheetTarget?.description || ''}
        items={editSheetTarget?.items || []}
        onClose={() => {
          setEditSheetModalOpen(false)
          setEditSheetTarget(null)
        }}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['assignments'] })
        }}
      />

      <AiBatchQuestionGeneratorModal
        isOpen={showAiBatchModal}
        onClose={() => setShowAiBatchModal(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['assignments'] })
        }}
      />
    </div>
  )
}
