'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Edit } from 'lucide-react'
import { toast } from 'sonner'
import api from '@/lib/axios'
import { AssignmentForm, AssignmentFormValues } from '../../create/components/AssignmentForm'

export default function EditAssignmentPage() {
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
    const stored = sessionStorage.getItem('user_info') || localStorage.getItem('user_info')
    if (stored) {
      try {
        const info = JSON.parse(stored)
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
        const res = await api.get(`/assignments/${id}`)
        const data = res.data
        
        // We only allow editing DRAFT, ARCHIVED, or PUBLISHED (handled by backend logic).
        // But if it's already published and has submissions, the backend will throw an error when saving.
        setAssignmentData({
          title: data.title || '',
          description: data.description || '',
          content: data.content || ''
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
  }, [id, isCheckingAuth, router])

  const handleUpdate = async (data: AssignmentFormValues) => {
    try {
      setIsSubmitting(true)
      await api.put(`/assignments/${id}`, data)
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

  if (isCheckingAuth || isFetching) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50/50">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col overflow-y-auto bg-slate-50/50">
      <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        
        {/* Header Navigation */}
        <div>
          <Link
            href={backHref}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            {returnUrl ? 'Quay lại lớp học' : 'Quay lại danh sách'}
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Edit className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Sửa bài tập</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Chỉnh sửa nội dung bài tập. Chú ý: nếu bài đã có người nộp, bạn có thể không sửa được nội dung.
              </p>
            </div>
          </div>
        </div>

        {/* Main Form */}
        <AssignmentForm
          isSubmitting={isSubmitting}
          onSubmitDraft={handleUpdate}
          defaultValues={assignmentData || undefined}
          submitDraftText="Lưu thay đổi"
        />
      </div>
    </div>
  )
}
