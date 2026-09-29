'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useFormik } from 'formik'
import * as yup from 'yup'
import {
  ArrowLeft,
  Users,
  GraduationCap,
  Mail,
  Loader2,
  BookMarked,
  Edit,
  Copy,
  Check,
  ClipboardList,
  Trash2,
  UserPlus,
  MessageSquare,
} from 'lucide-react'
import { toast } from 'sonner'
import { ClassroomTeacherChatPanel } from '@/components/chat/ClassroomTeacherChatPanel'
import { useClassStudents } from '@/hooks/useClassDetail'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { TabType } from '@/types'
import { TabButton } from './tab-button'
import { PermissionGuard } from '@/components/ui/with-permission'
import { StudentsTab } from './students-tab'
import { AssignmentsTab } from './assignments-tab'
import { PendingRequestsTab } from './pending-requests-tab'
import { useClassDetail, useUpdateClassroom, useDeleteClassroom } from '@/hooks/useClassDetail'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { joinRequestService } from '@/services/joinRequestService'
import { chatService } from '@/services/chatService'
import { useClassroomChatUnread } from '@/hooks/useClassroomChatUnread'
import { RefreshButton } from '@/components/ui/refresh-button'
import { useI18n } from '@/lib/i18n/i18n-context'

export function ClassDetailPageClient() {
  const { t } = useI18n()
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()
  const classCode = params?.classCode as string

  const initialTab = (searchParams.get('tab') as TabType) || 'students'
  const initialStudentId = searchParams.get('studentId') ? Number(searchParams.get('studentId')) : undefined

  const [activeTab, setActiveTab] = useState<TabType>(initialTab)
  const { hasGroupUnread, hasAnyStudentUnread } = useClassroomChatUnread(classCode)
  const hasUnreadChat = hasGroupUnread || hasAnyStudentUnread

  useEffect(() => {
    const tabParam = searchParams.get('tab') as TabType
    if (tabParam) {
      setActiveTab(tabParam)
    }
  }, [searchParams])

  const { user } = useAuth()
  const isStudent = user?.role === 'STUDENT' || user?.userRole === 'STUDENT'

  useEffect(() => {
    if (isStudent) {
      router.replace(`/classes/${classCode}/student`)
    }
  }, [isStudent, classCode, router])

  const { data: classroom, isLoading: loadingClass, refetch: refetchClassroom } = useClassDetail(classCode)
  const updateMutation = useUpdateClassroom(classCode)
  const deleteMutation = useDeleteClassroom()

  const { data: pendingRequests } = useQuery({
    queryKey: ['pending-requests', classCode],
    queryFn: () => joinRequestService.getPendingRequests(classCode),
    enabled: !!classCode && !isStudent,
    refetchInterval: 5000, // Tự động cập nhật mỗi 5 giây
  })

  const pendingCount = pendingRequests?.length || 0
  const { data: studentsData } = useClassStudents(classCode, 0, 100)

  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [codeCopied, setCodeCopied] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const handleDeleteClassroom = () => {
    deleteMutation.mutate(classCode, {
      onSuccess: () => {
        toast.success(t('Đã xóa lớp học thành công'))
        setIsDeleteDialogOpen(false)
        setIsEditModalOpen(false)
        router.push('/classes')
      },
      onError: (err: any) => {
        toast.error(err?.response?.data?.message || t('Không thể xóa lớp học'))
      }
    })
  }

  const handleCopyCode = () => {
    navigator.clipboard.writeText(classCode)
    setCodeCopied(true)
    toast.success(t('Đã sao chép mã lớp: {code}', { code: classCode }))
    setTimeout(() => setCodeCopied(false), 2000)
  }

  const editClassroomForm = useFormik({
    initialValues: {
      className: classroom?.className || '',
      maxStudents: classroom?.maxStudents || 0,
      description: classroom?.description || '',
    },
    enableReinitialize: true,
    validationSchema: yup.object({
      className: yup.string().required('Vui lòng nhập tên lớp'),
      maxStudents: yup
        .number()
        .required('Vui lòng nhập sĩ số tối đa')
        .integer('Sĩ số tối đa phải là số nguyên')
        .positive('Sĩ số tối đa phải lớn hơn 0')
        .min(
          classroom?.studentCount || 0,
          `Sĩ số tối đa không được nhỏ hơn sĩ số hiện tại (${classroom?.studentCount || 0})`
        ),
      description: yup.string().nullable(),
    }),
    onSubmit: (values, { setSubmitting }) => {
      updateMutation.mutate(values, {
        onSuccess: () => {
          toast.success('Đã cập nhật thông tin lớp học')
          setIsEditModalOpen(false)
          setSubmitting(false)
        },
        onError: (err: any) => {
          toast.error(err?.response?.data?.message || 'Không thể cập nhật lớp học')
          setSubmitting(false)
        }
      })
    },
  })

  if (isStudent) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div>
      <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/50">
        <div className="border-b border-border bg-white py-5">
          <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/classes')}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-white text-muted-foreground hover:text-foreground hover:bg-slate-50 transition-all shadow-sm"
                title={t('Quay lại')}
              >
                <ArrowLeft className="h-4.5 w-4.5" />
              </button>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <BookMarked className="h-5 w-5 text-primary" />
              </div>
              <div>
                {loadingClass ? (
                  <div className="space-y-1.5">
                    <div className="h-5 w-48 bg-slate-200 rounded-lg animate-pulse" />
                    <div className="h-3.5 w-32 bg-slate-100 rounded-lg animate-pulse" />
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <h1 className="text-xl font-bold tracking-tight text-foreground">
                        {classroom?.className ?? classCode}
                      </h1>
                      <PermissionGuard permission="classroom:update">
                        <button
                          onClick={() => setIsEditModalOpen(true)}
                          className="p-1 rounded-lg text-slate-400 hover:text-primary hover:bg-primary/5 transition-all cursor-pointer"
                          title={t('Chỉnh sửa thông tin')}
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                      </PermissionGuard>
                    </div>
                    <div className="text-xs text-muted-foreground flex flex-col sm:flex-row sm:items-center gap-2 mt-1">
                      <span className="flex items-center gap-1.5">
                        <GraduationCap className="h-3.5 w-3.5" />
                        {classroom?.teacherName ?? ''}
                      </span>
                      <span className="hidden sm:inline text-border">•</span>
                      <span className="flex items-center gap-1.5 text-slate-500 line-clamp-1 max-w-md">
                        <Mail className="h-3.5 w-3.5" />
                        {classroom?.description || ''}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <RefreshButton
                onClick={() => refetchClassroom()}
                iconOnly
                title={t('Làm mới thông tin lớp học')}
              />
              <button
                onClick={handleCopyCode}
                className="flex items-center gap-2 h-9 px-3.5 rounded-xl border border-border bg-white text-sm font-mono font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm cursor-pointer"
              >
                {codeCopied ? (
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                ) : (
                  <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                )}
                {classCode}
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white border-b border-border">
          <div className="mx-auto max-w-screen-2xl px-4 sm:px-6">
            <div className="flex gap-1">
              <TabButton
                id="tab-students"
                active={activeTab === 'students'}
                onClick={() => setActiveTab('students')}
                icon={<Users className="h-4 w-4" />}
                label={t('Học sinh')}
              />
              <TabButton
                id="tab-assignments"
                active={activeTab === 'assignments'}
                onClick={() => setActiveTab('assignments')}
                icon={<ClipboardList className="h-4 w-4" />}
                label={t('Bài tập')}
              />

              <TabButton
                id="tab-chat"
                active={activeTab === 'chat'}
                onClick={() => setActiveTab('chat')}
                icon={
                  <div className="relative">
                    <MessageSquare className="h-4 w-4" />
                    {hasUnreadChat && (
                      <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                      </span>
                    )}
                  </div>
                }
                label={t('Trò chuyện')}
              />
              <TabButton
                id="tab-requests"
                active={activeTab === 'requests'}
                onClick={() => setActiveTab('requests')}
                icon={
                  <div className="relative">
                    <UserPlus className="h-4 w-4" />
                    {pendingCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                      </span>
                    )}
                  </div>
                }
                label={
                  <span className="flex items-center gap-1.5">
                    {t('Chờ duyệt')}
                    {pendingCount > 0 && (
                      <span className="inline-flex items-center justify-center px-1.5 min-w-[1.25rem] h-5 text-[10px] font-bold text-white bg-red-500 rounded-full">
                        {pendingCount}
                      </span>
                    )}
                  </span>
                }
              />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 py-6 sm:py-8 space-y-6 w-full">
            {activeTab === 'students' ? (
              <StudentsTab classCode={classCode} classroom={classroom || null} loadingClass={loadingClass} />
            ) : activeTab === 'assignments' ? (
              <AssignmentsTab classCode={classCode} />
            ) : activeTab === 'chat' ? (
              <ClassroomTeacherChatPanel
                classId={classroom?.id || 0}
                classCode={classCode}
                students={studentsData?.content || []}
                initialStudentId={initialStudentId}
              />
            ) : (
              <PendingRequestsTab classCode={classCode} classroom={classroom || null} />
            )}
          </div>
        </div>
      </div>

      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t('Cập nhật thông tin lớp học')}</DialogTitle>
            <DialogDescription>
              {t('Thay đổi tên lớp, sĩ số tối đa và mô tả của lớp học này.')}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={editClassroomForm.handleSubmit} noValidate className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold">{t('Tên lớp')}</label>
              <input
                id="className"
                name="className"
                value={editClassroomForm.values.className}
                onChange={editClassroomForm.handleChange}
                onBlur={editClassroomForm.handleBlur}
                className={`w-full h-10 px-3 rounded-lg border ${editClassroomForm.touched.className && editClassroomForm.errors.className ? 'border-destructive' : 'border-border'} bg-white text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all`}
                placeholder={t('Nhập tên lớp...')}
              />
              {editClassroomForm.touched.className && editClassroomForm.errors.className && (
                <p className="text-xs text-destructive">{editClassroomForm.errors.className as string}</p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">
                {t('Sĩ số tối đa')}{' '}
                <span className="text-xs font-normal text-muted-foreground">
                  {t('(Hiện tại: {count})', { count: classroom?.studentCount || 0 })}
                </span>
              </label>
              <input
                type="number"
                id="maxStudents"
                name="maxStudents"
                min={classroom?.studentCount || 1}
                value={editClassroomForm.values.maxStudents}
                onChange={editClassroomForm.handleChange}
                onBlur={editClassroomForm.handleBlur}
                className={`w-full h-10 px-3 rounded-lg border ${editClassroomForm.touched.maxStudents && editClassroomForm.errors.maxStudents ? 'border-destructive' : 'border-border'} bg-white text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all`}
              />
              {editClassroomForm.touched.maxStudents && editClassroomForm.errors.maxStudents && (
                <p className="text-xs text-destructive">{editClassroomForm.errors.maxStudents as string}</p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">{t('Mô tả lớp học')}</label>
              <textarea
                id="description"
                name="description"
                value={editClassroomForm.values.description}
                onChange={editClassroomForm.handleChange}
                onBlur={editClassroomForm.handleBlur}
                className="w-full h-24 p-3 rounded-lg border border-border bg-white text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                placeholder={t('Nhập mô tả lớp học...')}
              />
            </div>
            <DialogFooter className="mt-6 sm:justify-between">
              <PermissionGuard permission="classroom:delete">
                <button
                  type="button"
                  onClick={() => setIsDeleteDialogOpen(true)}
                  className="px-4 py-2 rounded-lg bg-destructive/10 text-destructive text-sm font-semibold hover:bg-destructive/20 transition-colors flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  {t('Xóa lớp học')}
                </button>
              </PermissionGuard>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-lg border text-sm font-semibold hover:bg-slate-50 transition-colors"
                >
                  {t('Hủy')}
                </button>
                <button
                  type="submit"
                  disabled={editClassroomForm.isSubmitting}
                  className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {editClassroomForm.isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {t('Lưu thay đổi')}
                </button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <Trash2 className="h-5 w-5" /> {t('Xóa lớp học')}
            </DialogTitle>
            <DialogDescription>
              {t('Bạn có chắc chắn muốn xóa lớp học {className} không? Lưu ý: Chỉ có thể xóa lớp khi chưa có học sinh nào. Hành động này không thể hoàn tác.', {
                className: classroom?.className || ''
              })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6">
            <button
              type="button"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={deleteMutation.isPending}
              className="px-4 py-2 rounded-lg border text-sm font-semibold hover:bg-slate-50 transition-colors"
            >
              {t('Hủy')}
            </button>
            <button
              onClick={handleDeleteClassroom}
              disabled={deleteMutation.isPending}
              className="px-4 py-2 rounded-lg bg-destructive text-white text-sm font-semibold hover:bg-destructive/90 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {t('Xác nhận xóa')}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
