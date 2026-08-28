import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { studentRemarkService, CreateStudentRemarkPayload } from '@/services/studentRemarkService'

export function useStudentRemarks(classCode: string, studentId: number | null) {
  return useQuery({
    queryKey: ['student-remarks', classCode, studentId],
    queryFn: () => {
      if (!studentId) return Promise.resolve([])
      return studentRemarkService.getRemarks(classCode, studentId)
    },
    enabled: !!classCode && !!studentId,
  })
}

export function useCreateStudentRemark(classCode: string, studentId: number | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateStudentRemarkPayload) => {
      if (!studentId) throw new Error('Student ID is missing')
      return studentRemarkService.createRemark(classCode, studentId, payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-remarks', classCode, studentId] })
    },
  })
}

export function useDeleteStudentRemark(classCode: string, studentId: number | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (remarkId: number) => {
      if (!studentId) throw new Error('Student ID is missing')
      return studentRemarkService.deleteRemark(classCode, studentId, remarkId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-remarks', classCode, studentId] })
    },
  })
}

export function useAiStudentRemarkEvaluation(classCode: string, studentId: number | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: import('@/services/studentRemarkService').AiStudentRemarkEvaluatePayload) => {
      if (!studentId) throw new Error('Student ID is missing')
      return studentRemarkService.evaluateWithAi(classCode, studentId, payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-credit-balance'] })
      queryClient.invalidateQueries({ queryKey: ['user-credit-transactions'] })
    },
  })
}
