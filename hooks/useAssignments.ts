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
  publishedClassCodes?: string[]
  createdAt?: string
  updatedAt?: string
  maxScore?: number
}

interface FetchAssignmentsParams {
  userRole: string
  activeTab: string
  searchQuery: string
  selectedClassCode: string
}

export interface AssignmentSheet extends Assignment {
  type?: 'ASSIGNMENT' | 'SHEET';
  items?: Assignment[];
}

export function useAssignments({ userRole, activeTab, searchQuery, selectedClassCode }: FetchAssignmentsParams) {
  return useQuery({
    queryKey: ['assignments', userRole, activeTab, searchQuery, selectedClassCode],
    queryFn: async () => {
      const params: any = {}
      if (searchQuery) {
        params.keyword = searchQuery
      }

      const sortByNewest = (list: AssignmentSheet[]) => {
        return list.sort((a, b) => {
          const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0
          const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0
          if (timeA !== timeB) {
            return timeB - timeA
          }
          return (b.id || 0) - (a.id || 0)
        })
      }

      if (userRole === 'TEACHER') {
        if (activeTab === 'DRAFT') {
          params.status = 'DRAFT'
          const data = await assignmentService.getAssignments(params)
          let assignments = (data?.content || []) as AssignmentSheet[]
          assignments = sortByNewest(assignments)
          return assignments.map(a => ({ ...a, type: 'ASSIGNMENT' as const }))
        }

        if (activeTab === 'SINGLE') {
          params.status = 'ARCHIVED'
          const data = await assignmentService.getAssignments(params)
          let assignments = (data?.content || []) as AssignmentSheet[]
          assignments = sortByNewest(assignments)
          return assignments.map(a => ({ ...a, type: 'ASSIGNMENT' as const }))
        }

        if (activeTab === 'SHEET') {
          const sheetData = await assignmentService.getAssignmentSheets(params)
          let sheets = (sheetData?.content || []) as AssignmentSheet[]
          return sortByNewest(sheets)
        }
      }

      // Student logic
      params.status = 'PUBLISHED'
      if (selectedClassCode) {
        params.classCode = selectedClassCode
      }

      const data = await assignmentService.getAssignments(params)
      let assignments = (data?.content || []) as AssignmentSheet[]
      assignments = assignments.map(a => ({ ...a, type: 'ASSIGNMENT' as const }))

      try {
        const sheetData = await assignmentService.getAssignmentSheets(params)
        const sheets = (sheetData?.content || []) as AssignmentSheet[]
        assignments = [...assignments, ...sheets]
      } catch (error) {
        console.error("Failed to fetch assignment sheets", error)
      }

      return sortByNewest(assignments)
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
