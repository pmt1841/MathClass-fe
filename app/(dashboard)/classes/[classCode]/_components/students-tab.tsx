import React, { useState } from 'react'
import { useFormik } from 'formik'
import * as yup from 'yup'
import { Users, UserPlus, Search, Loader2, RefreshCw, UserX, CheckCircle2, AlertCircle, ChevronLeft, ChevronRight, Check, X } from 'lucide-react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { ClassroomDetail } from '@/types'
import { StatCard } from './stat-card'
import { StudentRow } from './student-row'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { joinRequestsApi } from '@/lib/api/join-requests'
import { useClassStudents, useAddStudent, useRemoveStudent } from '@/hooks/useClassDetail'

export function StudentsTab({
  classCode,
  classroom,
  loadingClass,
}: {
  classCode: string
  classroom: ClassroomDetail | null
  loadingClass: boolean
}) {
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(10)
  const [sortAsc, setSortAsc] = useState(true)
  
  const [addError, setAddError] = useState<string | null>(null)
  const [addSuccess, setAddSuccess] = useState<string | null>(null)
  
  const [studentToRemove, setStudentToRemove] = useState<{ id: number; name: string } | null>(null)

  const isFull = classroom ? (classroom.studentCount ?? 0) >= (classroom.maxStudents ?? Infinity) : false

  const { data: pendingRequests } = useQuery({
    queryKey: ['pending-requests', classCode],
    queryFn: () => joinRequestsApi.getPendingRequests(classCode),
    enabled: !!classCode,
  })

  const processRequestMutation = useMutation({
    mutationFn: ({ id, status }: { id: number, status: 'APPROVED' | 'REJECTED' }) =>
      joinRequestsApi.processJoinRequest(id, { status }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pending-requests', classCode] })
      queryClient.invalidateQueries({ queryKey: ['teacher-stats'] })
      if (variables.status === 'APPROVED') {
        toast.success('Đã duyệt yêu cầu tham gia')
        queryClient.invalidateQueries({ queryKey: ['classroom', classCode] })
        queryClient.invalidateQueries({ queryKey: ['classroom-students', classCode] })
      } else {
        toast.success('Đã từ chối yêu cầu tham gia')
      }
    },
    onError: () => toast.error('Xử lý yêu cầu thất bại')
  })

  const sortParam = `s.fullName,${sortAsc ? 'asc' : 'desc'}`
  const { data: studentsData, isLoading: loadingStudents, refetch: refetchStudents } = useClassStudents(classCode, page, size, sortParam)
  
  const addStudentMutation = useAddStudent(classCode)
  const removeStudentMutation = useRemoveStudent(classCode)

  const students = studentsData?.content || []
  const totalPages = studentsData?.totalPages || 0
  const totalElements = studentsData?.totalElements || 0

  const addStudentForm = useFormik({
    initialValues: { email: '' },
    validationSchema: yup.object({
      email: yup.string().email('Email không hợp lệ').required('Vui lòng nhập email'),
    }),
    onSubmit: (values, { setSubmitting, resetForm }) => {
      setAddError(null)
      setAddSuccess(null)
      addStudentMutation.mutate(values.email, {
        onSuccess: () => {
          setAddSuccess(`Đã thêm học sinh với email: ${values.email}`)
          resetForm()
          toast.success(`Thêm thành công: ${values.email}`)
          setSubmitting(false)
        },
        onError: (err: any) => {
          const msg = err?.response?.data?.message || err?.response?.data || 'Không thể thêm học sinh. Vui lòng kiểm tra email.'
          setAddError(typeof msg === 'string' ? msg : 'Đã xảy ra lỗi. Vui lòng thử lại.')
          toast.error('Thêm học sinh thất bại')
          setSubmitting(false)
        }
      })
    },
  })

  const confirmRemoveStudent = () => {
    if (!studentToRemove) return
    const { id: studentId, name: studentName } = studentToRemove
    removeStudentMutation.mutate(studentId, {
      onSuccess: () => {
        toast.success(`Đã xóa học sinh: ${studentName}`)
        setStudentToRemove(null)
      },
      onError: () => {
        toast.error('Không thể xóa học sinh')
        setStudentToRemove(null)
      }
    })
  }

  const filteredStudents = students.filter(
    (s) =>
      s.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <>
      {!loadingClass && classroom && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <StatCard
            label="Sĩ số hiện tại"
            value={`${classroom.studentCount ?? 0}`}
            sub={`/ ${classroom.maxStudents ?? '∞'} học sinh`}
            color="from-indigo-500 to-purple-600"
            icon={<Users className="h-5 w-5 text-white" />}
          />

          <div className="rounded-2xl border border-border bg-white shadow-sm flex items-center gap-4 p-4 overflow-hidden relative">
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${isFull ? 'from-rose-500 to-pink-600' : 'from-emerald-400 to-teal-500'}`} />
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-slate-100">
              <UserPlus className="h-5 w-5 text-slate-500" />
            </div>
            <form onSubmit={addStudentForm.handleSubmit} className="flex-1 flex flex-col gap-1">
              <div className="flex gap-2 w-full">
                <div className="relative flex-1">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={addStudentForm.values.email}
                    onChange={(e) => {
                      addStudentForm.handleChange(e)
                      if (addError) setAddError(null)
                      if (addSuccess) setAddSuccess(null)
                    }}
                    onBlur={addStudentForm.handleBlur}
                    placeholder={isFull ? 'Lớp đã đầy' : 'Email học sinh...'}
                    disabled={addStudentForm.isSubmitting || isFull}
                    className={`w-full h-10 px-3 rounded-lg border ${addStudentForm.touched.email && addStudentForm.errors.email ? 'border-destructive' : 'border-border'} bg-slate-50/50 text-sm outline-none transition-all focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/15 disabled:opacity-50 disabled:cursor-not-allowed`}
                  />
                </div>
                <button
                  id="submit-add-student"
                  type="submit"
                  disabled={addStudentForm.isSubmitting || !addStudentForm.values.email.trim() || isFull}
                  className="flex-shrink-0 flex items-center justify-center h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all shadow-sm active:scale-[.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {addStudentForm.isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Thêm'}
                </button>
              </div>
              {addStudentForm.touched.email && addStudentForm.errors.email && (
                <p className="text-xs text-destructive mt-1 px-1">{addStudentForm.errors.email as string}</p>
              )}
            </form>
          </div>
        </div>
      )}

      {(addSuccess || addError) && (
        <div className={`flex items-start gap-2.5 rounded-xl border px-4 py-3 animate-in slide-in-from-top-2 ${addSuccess ? 'bg-emerald-50 border-emerald-200' : 'bg-destructive/10 border-destructive/20'}`}>
          {addSuccess ? (
            <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="h-4.5 w-4.5 text-destructive flex-shrink-0 mt-0.5" />
          )}
          <p className={`text-xs font-medium ${addSuccess ? 'text-emerald-700' : 'text-destructive'}`}>
            {addSuccess || addError}
          </p>
        </div>
      )}

      {pendingRequests && pendingRequests.length > 0 && (
        <div className="rounded-2xl border border-orange-200 bg-white shadow-sm overflow-hidden mt-4">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-orange-100 bg-orange-50/50">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-100">
              <UserPlus className="h-4.5 w-4.5 text-orange-600" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-orange-800">Yêu cầu xin vào lớp</h2>
              <p className="text-xs text-orange-600/80">Có {pendingRequests.length} yêu cầu đang chờ duyệt</p>
            </div>
          </div>
          <div className="divide-y divide-border">
            {pendingRequests.map(req => (
              <div key={req.id} className="flex items-center justify-between p-4 bg-white hover:bg-slate-50 transition-colors">
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-foreground">{req.studentName}</span>
                  <span className="text-xs text-muted-foreground">{req.studentEmail}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => processRequestMutation.mutate({ id: req.id, status: 'APPROVED' })}
                    disabled={processRequestMutation.isPending || isFull}
                    className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100 transition-colors disabled:opacity-50 text-xs font-semibold"
                  >
                    <Check className="h-3.5 w-3.5" /> Duyệt
                  </button>
                  <button
                    onClick={() => processRequestMutation.mutate({ id: req.id, status: 'REJECTED' })}
                    disabled={processRequestMutation.isPending}
                    className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 transition-colors disabled:opacity-50 text-xs font-semibold"
                  >
                    <X className="h-3.5 w-3.5" /> Từ chối
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden mt-4">
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-border bg-gradient-to-r from-slate-50 to-transparent">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100">
              <Users className="h-4.5 w-4.5 text-slate-600" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">Danh sách học sinh</h2>
              <p className="text-xs text-muted-foreground">
                {loadingStudents ? 'Đang tải...' : `${totalElements} học sinh`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => { setSortAsc(!sortAsc); setPage(0) }}
              className="flex items-center gap-1.5 h-9 px-3 rounded-lg border border-border bg-white text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              title="Sắp xếp theo tên"
            >
              <Users className="h-3.5 w-3.5" />
              {sortAsc ? 'A-Z' : 'Z-A'}
            </button>

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
                placeholder="Tìm trong danh sách..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 pl-9 pr-3 rounded-lg border border-border bg-slate-50/80 text-xs outline-none transition-all focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/15"
              />
            </div>

            <button
              onClick={() => refetchStudents()}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-white text-muted-foreground hover:text-foreground hover:bg-slate-50 transition-all"
              title="Làm mới"
            >
              <RefreshCw className={`h-4 w-4 ${loadingStudents ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loadingStudents ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl animate-pulse">
                  <div className="h-10 w-10 rounded-full bg-slate-200 flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 bg-slate-200 rounded-lg w-2/5" />
                    <div className="h-3 bg-slate-100 rounded-lg w-3/5" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center space-y-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
                <UserX className="h-8 w-8 text-slate-400" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">
                  {searchQuery ? 'Không tìm thấy học sinh' : 'Chưa có học sinh nào'}
                </p>
                <p className="text-xs text-muted-foreground max-w-xs">
                  {searchQuery ? 'Thử thay đổi từ khoá tìm kiếm.' : 'Thêm học sinh vào lớp bằng email bên trên.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4 space-y-2">
              {filteredStudents.map((student, idx) => (
                <StudentRow
                  key={student.id}
                  student={student}
                  index={page * size + idx + 1}
                  isRemoving={removeStudentMutation.isPending && studentToRemove?.id === student.id}
                  onRemove={() => setStudentToRemove({ id: student.id, name: student.fullName })}
                />
              ))}
            </div>
          )}
        </div>

        {!loadingStudents && totalPages > 1 && (
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

      <AlertDialog open={!!studentToRemove} onOpenChange={(open) => !open && setStudentToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa học sinh</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn xóa học sinh &quot;{studentToRemove?.name}&quot; khỏi lớp không?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white text-black border border-slate-200 hover:bg-slate-300 hover:text-black transition-colors">
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRemoveStudent}
              className="bg-white text-destructive border border-destructive hover:bg-destructive hover:text-white transition-colors"
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
