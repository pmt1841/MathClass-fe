import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/axios'

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
      let url = '/assignments?'
      if (userRole === 'TEACHER') {
        url += `status=${activeTab}`
      } else {
        url += `status=PUBLISHED`
        if (selectedClassCode) {
          url += `&classCode=${selectedClassCode}`
        }
      }
      if (searchQuery) {
        url += `&keyword=${encodeURIComponent(searchQuery)}`
      }

      const response = await api.get(url)
      return (response.data?.content || []) as Assignment[]
    },
    enabled: !(userRole === 'TEACHER' && activeTab === 'PENDING')
  })
}

export function useDeleteAssignment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/assignments/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] })
    }
  })
}
