'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { assignmentService } from '@/services/assignmentService'
import { AssignmentForm, AssignmentFormValues } from './AssignmentForm'
import { PublishAssignmentModal } from '@/components/assignments/publish-assignment-modal'
import { useAuth } from '@/hooks/useAuth'
import { useQueryClient } from '@tanstack/react-query'

import { handleApiError } from '@/lib/utils/error-handler'

export function CreateAssignmentPageClient() {
  const router = useRouter()
  const { user, isInitializing } = useAuth()
  const queryClient = useQueryClient()

  // State for Draft & Publish
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [publishModalOpen, setPublishModalOpen] = useState(false)
  const [currentAssignmentData, setCurrentAssignmentData] = useState<AssignmentFormValues | null>(null)
  const [createdAssignmentId, setCreatedAssignmentId] = useState<number | null>(null)

  useEffect(() => {
    if (isInitializing) return
    
    if (user) {
      const role = user.role || user.userRole || 'STUDENT'
      if (role !== 'TEACHER') {
        toast.error('Bạn không có quyền truy cập trang này')
        router.replace('/assignments')
        return
      }
    } else {
      router.replace('/')
      return
    }
  }, [user, isInitializing, router])

  if (!user && !isInitializing) return null

  const handleDraft = async (data: AssignmentFormValues) => {
    try {
      setIsSubmitting(true)
      if (createdAssignmentId) {
        await assignmentService.updateAssignment(createdAssignmentId, data)
      } else {
        await assignmentService.createAssignment(data)
      }
      queryClient.invalidateQueries({ queryKey: ['assignments'] })
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

  const handleAutoSave = async (data: AssignmentFormValues) => {
    if (createdAssignmentId) {
      await assignmentService.updateAssignment(createdAssignmentId, data)
    } else {
      const createResponse = await assignmentService.createAssignment(data)
      const newId = createResponse?.id
      if (newId) {
        setCreatedAssignmentId(newId)
        window.history.replaceState(null, '', `/assignments/${newId}/edit`)
      }
    }
  }

  const handleOpenPublishModal = (data: AssignmentFormValues) => {
    setCurrentAssignmentData(data)
    setPublishModalOpen(true)
  }

  const handlePublish = async (targets: { classCode: string; deadline: string }[]) => {
    if (!currentAssignmentData) return

    try {
      setIsSubmitting(true)

      let assignmentId = createdAssignmentId

      if (!assignmentId) {
        const createRes = await assignmentService.createAssignment(currentAssignmentData)
        assignmentId = createRes?.id
        if (assignmentId) {
          setCreatedAssignmentId(assignmentId)
        }
      }

      if (!assignmentId) {
        throw new Error('Không lấy được ID bài tập sau khi tạo.')
      }

      // Step 2: Publish it
      await assignmentService.publishAssignment(assignmentId, {
        targets: targets.map(t => ({
          classCode: t.classCode,
          deadline: t.deadline,
        })),
      })

      queryClient.invalidateQueries({ queryKey: ['assignments'] })
      toast.success('Đã đăng bài tập thành công!')
      setPublishModalOpen(false)
      router.push('/assignments')
    } catch (err: any) {
      console.error('Error publishing assignment:', err)
      toast.error(handleApiError(err, 'Không thể giao bài tập'))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isInitializing) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50/50">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <>
      <AssignmentForm
        pageTitle="Tạo bài tập mới"
        backHref="/assignments"
        backText="Quay lại danh sách"
        isSubmitting={isSubmitting}
        onSubmitDraft={handleDraft}
        onPublishClick={handleOpenPublishModal}
        onAutoSave={handleAutoSave}
      />

      {/* Publish Modal */}
      <PublishAssignmentModal
        open={publishModalOpen}
        onClose={() => setPublishModalOpen(false)}
        assignmentId={null}
        assignmentTitle={currentAssignmentData?.title}
        onSubmit={handlePublish}
        onSuccess={() => { }} // Not used because we pass onSubmit instead
        isSubmitting={isSubmitting}
      />
    </>
  )
}
