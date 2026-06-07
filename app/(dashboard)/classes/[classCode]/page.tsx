'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
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
} from 'lucide-react'
import api from '@/lib/axios'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ClassroomDetail, TabType } from './types'
import { TabButton } from './_components/tab-button'
import { StudentsTab } from './_components/students-tab'
import { AssignmentsTab } from './_components/assignments-tab'

export default function ClassDetailPage() {
  const params = useParams()
  const router = useRouter()
  const classCode = params?.classCode as string

  const [classroom, setClassroom] = useState<ClassroomDetail | null>(null)
  const [loadingClass, setLoadingClass] = useState(true)
  const [activeTab, setActiveTab] = useState<TabType>('students')

  const fetchClassroom = useCallback(async () => {
    try {
      setLoadingClass(true)
      const res = await api.get(`/classrooms/${classCode}`)
      setClassroom(res.data)
    } catch (err: any) {
      toast.error('Không thể tải thông tin lớp học')
      console.error(err)
    } finally {
      setLoadingClass(false)
    }
  }, [classCode])

  useEffect(() => {
    fetchClassroom()
  }, [fetchClassroom])

  // ── Edit classroom modal ──
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [codeCopied, setCodeCopied] = useState(false)

  const handleCopyCode = () => {
    navigator.clipboard.writeText(classCode)
    setCodeCopied(true)
    toast.success(`Đã sao chép mã lớp: ${classCode}`)
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
        .min(
          classroom?.studentCount || 0,
          `Sĩ số tối đa không được nhỏ hơn sĩ số hiện tại (${classroom?.studentCount || 0})`
        ),
      description: yup.string().nullable(),
    }),
    onSubmit: async (values, { setSubmitting }) => {
      try {
        await api.put(`/classrooms/${classCode}`, {
          className: values.className,
          description: values.description,
          maxStudents: values.maxStudents,
        })
        toast.success('Đã cập nhật thông tin lớp học')
        setIsEditModalOpen(false)
        fetchClassroom()
      } catch (err: any) {
        toast.error(err?.response?.data?.message || 'Không thể cập nhật lớp học')
      } finally {
        setSubmitting(false)
      }
    },
  })

  return (
    <div>
      <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/50">
        {/* Header */}
        <div className="border-b border-border bg-white py-5">
          <div className="mx-auto max-w-screen-xl px-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.back()}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-white text-muted-foreground hover:text-foreground hover:bg-slate-50 transition-all shadow-sm"
                title="Quay lại"
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
                      <button
                        onClick={() => setIsEditModalOpen(true)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-slate-100 text-muted-foreground hover:text-foreground transition-colors"
                        title="Chỉnh sửa thông tin"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="text-xs text-muted-foreground flex flex-col sm:flex-row sm:items-center gap-2 mt-1">
                      <span className="flex items-center gap-1.5">
                        <GraduationCap className="h-3.5 w-3.5" />
                        {classroom?.teacherName ?? ''}
                      </span>
                      <span className="hidden sm:inline text-border">•</span>
                      <span className="flex items-center gap-1.5 text-slate-500 line-clamp-1 max-w-md">
                        <Mail className="h-3.5 w-3.5" />
                        {classroom?.description || 'Chưa có mô tả'}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Class code badge + refresh */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyCode}
                className="flex items-center gap-2 h-9 px-3.5 rounded-xl border border-border bg-white text-sm font-mono font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
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

        {/* Tab Navigation */}
        <div className="bg-white border-b border-border">
          <div className="mx-auto max-w-screen-xl px-6">
            <div className="flex gap-1">
              <TabButton
                id="tab-students"
                active={activeTab === 'students'}
                onClick={() => setActiveTab('students')}
                icon={<Users className="h-4 w-4" />}
                label="Học sinh"
              />
              <TabButton
                id="tab-assignments"
                active={activeTab === 'assignments'}
                onClick={() => setActiveTab('assignments')}
                icon={<ClipboardList className="h-4 w-4" />}
                label="Bài tập"
              />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-screen-xl px-6 py-8 space-y-6">
            {activeTab === 'students' ? (
              <StudentsTab classCode={classCode} classroom={classroom} loadingClass={loadingClass} onClassroomUpdate={fetchClassroom} />
            ) : (
              <AssignmentsTab classCode={classCode} />
            )}
          </div>
        </div>
      </div>

      {/* Edit Classroom Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Cập nhật thông tin lớp học</DialogTitle>
            <DialogDescription>
              Thay đổi tên lớp, sĩ số tối đa và mô tả của lớp học này.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={editClassroomForm.handleSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold">Tên lớp</label>
              <input
                id="className"
                name="className"
                value={editClassroomForm.values.className}
                onChange={editClassroomForm.handleChange}
                onBlur={editClassroomForm.handleBlur}
                className={`w-full h-10 px-3 rounded-lg border ${editClassroomForm.touched.className && editClassroomForm.errors.className ? 'border-destructive' : 'border-border'} bg-white text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all`}
                placeholder="Nhập tên lớp..."
              />
              {editClassroomForm.touched.className && editClassroomForm.errors.className && (
                <p className="text-xs text-destructive">{editClassroomForm.errors.className as string}</p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">
                Sĩ số tối đa{' '}
                <span className="text-xs font-normal text-muted-foreground">
                  (Hiện tại: {classroom?.studentCount || 0})
                </span>
              </label>
              <input
                type="number"
                id="maxStudents"
                name="maxStudents"
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
              <label className="text-sm font-semibold">Mô tả lớp học</label>
              <textarea
                id="description"
                name="description"
                value={editClassroomForm.values.description}
                onChange={editClassroomForm.handleChange}
                onBlur={editClassroomForm.handleBlur}
                className="w-full h-24 p-3 rounded-lg border border-border bg-white text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                placeholder="Nhập mô tả lớp học..."
              />
            </div>
            <DialogFooter className="mt-6">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 rounded-lg border text-sm font-semibold hover:bg-slate-50 transition-colors"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={editClassroomForm.isSubmitting}
                className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {editClassroomForm.isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Lưu thay đổi
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
