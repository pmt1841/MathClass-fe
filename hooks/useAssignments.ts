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
      let assignments = (data?.content || []) as AssignmentSheet[]
      assignments = assignments.map(a => ({ ...a, type: 'ASSIGNMENT' }))

      // Only fetch sheets for teacher's ARCHIVED or PUBLISHED, or for student
      if ((userRole === 'TEACHER' && (activeTab === 'ARCHIVED' || activeTab === 'PUBLISHED')) || userRole === 'STUDENT') {
        try {
          const sheetData = await assignmentService.getAssignmentSheets(params)
          const sheets = (sheetData?.content || []) as AssignmentSheet[]
          
          assignments = [...assignments, ...sheets]
          
          // Sort by updated at descending
          assignments.sort((a, b) => {
             const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime()
             const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime()
             return timeB - timeA
          })
        } catch (error) {
          console.error("Failed to fetch assignment sheets", error)
        }
      }

      return assignments
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
