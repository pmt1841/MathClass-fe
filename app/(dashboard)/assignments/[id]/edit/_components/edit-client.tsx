'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { assignmentService } from '@/services/assignmentService'
import { AssignmentForm, AssignmentFormValues } from '../../../create/_components/AssignmentForm'

import { authStorage } from '@/lib/auth-storage'

export function EditAssignmentPageClient() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const searchParams = useSearchParams()
  const returnUrl = searchParams.get('returnUrl')

  const backHref = returnUrl || '/assignments'

  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [isFetching, setIsFetching] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [assignmentData, setAssignmentData] = useState<AssignmentFormValues | null>(null)

  useEffect(() => {
    // Check role
    const info = authStorage.getUserInfo()
    if (info) {
      try {
        const role = info.role || info.userRole || 'STUDENT'
        if (role !== 'TEACHER') {
          toast.error('Bạn không có quyền truy cập trang này')
          router.replace('/assignments')
          return
        }
      } catch (err) {
        router.replace('/assignments')
        return
      }
    } else {
      router.replace('/')
      return
    }
    setIsCheckingAuth(false)
  }, [router])

  useEffect(() => {
    if (isCheckingAuth || !id) return

    const fetchAssignment = async () => {
      try {
        setIsFetching(true)
        const data = await assignmentService.getAssignmentById(Number(id))

        // We only allow editing DRAFT, ARCHIVED, or PUBLISHED (handled by backend logic).
        // But if it's already published and has submissions, the backend will throw an error when saving.
        setAssignmentData({
          title: data.title || '',
          description: data.description || '',
          content: data.content || '',
          drawings: data.drawings || [],
          images: data.images || []
        })
      } catch (err: any) {
        console.error('Error fetching assignment:', err)
        toast.error('Không thể tải dữ liệu bài tập hoặc bạn không có quyền truy cập')
        router.replace(backHref)
      } finally {
        setIsFetching(false)
      }
    }

    fetchAssignment()
  }, [id, isCheckingAuth, router, backHref])

  const handleUpdate = async (data: AssignmentFormValues) => {
    try {
      setIsSubmitting(true)
      await assignmentService.updateAssignment(Number(id), data)
      toast.success('Đã cập nhật bài tập thành công!')
      router.push(backHref)
    } catch (err: any) {
      console.error('Error updating assignment:', err)
      const msg = err.response?.data?.message || err.response?.data || 'Có lỗi xảy ra khi cập nhật'
      toast.error(typeof msg === 'string' ? msg : 'Không thể cập nhật bài tập')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAutoSave = async (data: AssignmentFormValues) => {
    await assignmentService.updateAssignment(Number(id), data)
  }

  if (isCheckingAuth || isFetching) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50/50">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <AssignmentForm
      assignmentId={id}
      pageTitle="Sửa bài tập"
      backHref={backHref}
      backText={returnUrl ? 'Quay lại lớp học' : 'Quay lại danh sách'}
      isSubmitting={isSubmitting}
      onSubmitDraft={handleUpdate}
      defaultValues={assignmentData || undefined}
      submitDraftText="Lưu thay đổi"
      onAutoSave={handleAutoSave}
    />
  )
}
