'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, BookMarked } from 'lucide-react'
import { toast } from 'sonner'
import api from '@/lib/axios'
import { AssignmentForm, AssignmentFormValues } from './components/AssignmentForm'
import { PublishModal } from './components/PublishModal'

export default function CreateAssignmentPage() {
  const router = useRouter()
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  
  // State for Draft & Publish
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [publishModalOpen, setPublishModalOpen] = useState(false)
  const [currentAssignmentData, setCurrentAssignmentData] = useState<AssignmentFormValues | null>(null)
  
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

  const handleDraft = async (data: AssignmentFormValues) => {
    try {
      setIsSubmitting(true)
      await api.post('/assignments/create', data)
      toast.success('Đã lưu nháp bài tập thành công!')
      router.push('/assignments')
    } catch (err: any) {
      console.error('Error drafting assignment:', err)
      const msg = err.response?.data || 'Có lỗi xảy ra khi lưu nháp'
      toast.error(typeof msg === 'string' ? msg : 'Không thể lưu nháp bài tập')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOpenPublishModal = (data: AssignmentFormValues) => {
    setCurrentAssignmentData(data)
    setPublishModalOpen(true)
  }

  const handlePublish = async (publishData: { classCodes: string[]; deadline: Date }) => {
    if (!currentAssignmentData) return

    try {
      setIsSubmitting(true)
      
      // Step 1: Create the assignment (Draft)
      const createResponse = await api.post('/assignments/create', currentAssignmentData)
      const assignmentId = createResponse.data?.id
      
      if (!assignmentId) {
        throw new Error('Không lấy được ID bài tập sau khi tạo.')
      }

      // Step 2: Publish it
      await api.put(`/assignments/${assignmentId}/publish`, {
        classCodes: publishData.classCodes,
        deadline: publishData.deadline.toISOString()
      })

      toast.success('Đã đăng bài tập thành công!')
      setPublishModalOpen(false)
      router.push('/assignments')
    } catch (err: any) {
      console.error('Error publishing assignment:', err)
      const msg = err.response?.data || 'Có lỗi xảy ra khi đăng bài'
      toast.error(typeof msg === 'string' ? msg : 'Không thể đăng bài tập')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isCheckingAuth) {
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
            href="/assignments"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại danh sách
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <BookMarked className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Tạo bài tập mới</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Soạn thảo nội dung bài tập, hỗ trợ LaTeX cho công thức toán học.
              </p>
            </div>
          </div>
        </div>

        {/* Main Form */}
        <AssignmentForm
          isSubmitting={isSubmitting}
          onSubmitDraft={handleDraft}
          onPublishClick={handleOpenPublishModal}
        />

        {/* Publish Modal */}
        <PublishModal
          open={publishModalOpen}
          onClose={() => setPublishModalOpen(false)}
          assignmentData={currentAssignmentData}
          onSubmit={handlePublish}
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  )
}
