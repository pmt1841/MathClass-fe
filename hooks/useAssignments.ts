import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { assignmentService } from '@/services/assignmentService'

export interface Assignment {
  id: number
  title: string
  description: string
  deadline: string
  status: string
  isOpen: boolean
  teacherName: string
  classCode: string
  className: string
  hasSubmissions?: boolean
  submissionStatus?: 'DRAFT' | 'SUBMITTED' | 'GRADED' | null
  submissionCreatedAt?: string
  submissionUpdatedAt?: string
}

interface FetchAssignmentsParams {
  userRole: string
  activeTab: string
  searchQuery: string
  selectedClassCode: string
}

export function useAssignments({ userRole, activeTab, searchQuery, selectedClassCode }: FetchAssignmentsParams) {
  return useQuery({
    queryKey: ['assignments', userRole, activeTab, searchQuery, selectedClassCode],
    queryFn: async () => {
      const params: any = {}
      if (userRole === 'TEACHER') {
        params.status = activeTab
      } else {
        params.status = 'PUBLISHED'
        if (selectedClassCode) {
          params.classCode = selectedClassCode
        }
      }
      if (searchQuery) {
        params.keyword = searchQuery
      }

      const data = await assignmentService.getAssignments(params)
      return (data?.content || []) as Assignment[]
    },
    enabled: !(userRole === 'TEACHER' && activeTab === 'PENDING')
  })
}

export function useDeleteAssignment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: assignmentService.deleteAssignment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] })
    }
  })
}
