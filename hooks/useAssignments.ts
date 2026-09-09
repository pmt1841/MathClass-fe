import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { assignmentService } from '@/services/assignmentService'
import type { AssignmentTag } from '@/services/assignmentService'
import type { AssignmentVisibility, OriginalAuthor } from '@/types'
import { parseDateSafe } from '@/lib/utils'

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
  submissionStatus?: 'DRAFT' | 'SUBMITTED' | 'GRADED' | 'LATE' | null
  submissionCreatedAt?: string
  submissionUpdatedAt?: string
  publishedClassCodes?: string[]
  createdAt?: string
  updatedAt?: string
  maxScore?: number
  visibility?: AssignmentVisibility
  originalAuthor?: OriginalAuthor
  tags?: AssignmentTag[]
}

interface FetchAssignmentsParams {
  userRole: string
  activeTab: string
  searchQuery: string
  selectedClassCode: string
  page?: number
  size?: number
  assignmentType?: 'ALL' | 'SINGLE' | 'SHEET'
  gradeTagId?: number
  subjectTagId?: number
  difficultyTagId?: number
  tagNames?: string[]
}

export interface AssignmentSheet extends Assignment {
  type?: 'ASSIGNMENT' | 'SHEET';
  items?: Assignment[];
}

export function useAssignments({ userRole, activeTab, searchQuery, selectedClassCode, page = 0, size = 6, assignmentType = 'ALL', gradeTagId, subjectTagId, difficultyTagId, tagNames }: FetchAssignmentsParams) {
  return useQuery({
    queryKey: ['assignments', userRole, activeTab, searchQuery, selectedClassCode, page, size, assignmentType, gradeTagId, subjectTagId, difficultyTagId, tagNames],
    queryFn: async () => {
      const params: any = { page, size }
      if (searchQuery) {
        params.keyword = searchQuery
      }
      if (gradeTagId) params.gradeTagId = gradeTagId
      if (subjectTagId) params.subjectTagId = subjectTagId
      if (difficultyTagId) params.difficultyTagId = difficultyTagId
      if (tagNames && tagNames.length > 0) params.tagNames = tagNames

      const sortByNewest = (list: AssignmentSheet[]) => {
        return list.sort((a, b) => {
          const timeA = a.createdAt ? parseDateSafe(a.createdAt)?.getTime() ?? 0 : 0
          const timeB = b.createdAt ? parseDateSafe(b.createdAt)?.getTime() ?? 0 : 0
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
          return {
            items: assignments.map(a => ({ ...a, type: 'ASSIGNMENT' as const })),
            totalPages: data?.totalPages || 1,
            number: data?.number || 0,
            totalElements: data?.totalElements || 0
          }
        }

        if (activeTab === 'SINGLE') {
          params.status = 'ARCHIVED'
          const data = await assignmentService.getAssignments(params)
          let assignments = (data?.content || []) as AssignmentSheet[]
          assignments = sortByNewest(assignments)
          return {
            items: assignments.map(a => ({ ...a, type: 'ASSIGNMENT' as const })),
            totalPages: data?.totalPages || 1,
            number: data?.number || 0,
            totalElements: data?.totalElements || 0
          }
        }

        if (activeTab === 'SHEET') {
          const sheetData = await assignmentService.getAssignmentSheets(params)
          let sheets = (sheetData?.content || []) as AssignmentSheet[]
          return {
            items: sortByNewest(sheets),
            totalPages: sheetData?.totalPages || 1,
            number: sheetData?.number || 0,
            totalElements: sheetData?.totalElements || 0
          }
        }
      }

      // Student logic
      params.status = 'PUBLISHED'
      if (activeTab && activeTab !== 'ALL') {
        params.studentStatus = activeTab
      }
      if (selectedClassCode) {
        params.classCode = selectedClassCode
      }
      
      if (assignmentType === 'SINGLE') {
        params.page = page
        params.size = size
        const data = await assignmentService.getAssignments(params)
        let assignments = (data?.content || []) as AssignmentSheet[]
        assignments = assignments.map(a => ({ ...a, type: 'ASSIGNMENT' as const }))
        return {
          items: sortByNewest(assignments),
          totalPages: data?.totalPages || 1,
          number: data?.number || 0,
          totalElements: data?.totalElements || 0
        }
      }

      if (assignmentType === 'SHEET') {
        params.page = page
        params.size = size
        const sheetData = await assignmentService.getAssignmentSheets(params)
        let sheets = (sheetData?.content || []) as AssignmentSheet[]
        return {
          items: sortByNewest(sheets),
          totalPages: sheetData?.totalPages || 1,
          number: sheetData?.number || 0,
          totalElements: sheetData?.totalElements || 0
        }
      }

      // For 'ALL' filter, fetch up to 9 of each to display in carousels
      const allParams = { ...params, page: 0, size: 9 }
      const data = await assignmentService.getAssignments(allParams)
      let singleItems = (data?.content || []) as AssignmentSheet[]
      singleItems = singleItems.map(a => ({ ...a, type: 'ASSIGNMENT' as const }))
      singleItems = sortByNewest(singleItems)

      let sheetItems: AssignmentSheet[] = []
      try {
        const sheetData = await assignmentService.getAssignmentSheets(allParams)
        sheetItems = (sheetData?.content || []) as AssignmentSheet[]
        sheetItems = sortByNewest(sheetItems)
      } catch (error) {
        console.error("Failed to fetch assignment sheets", error)
      }

      return {
        items: [], // Left empty because UI uses singleItems and sheetItems
        singleItems,
        sheetItems,
        totalPages: 1,
        number: 0,
        totalElements: (data?.totalElements || 0) + (sheetItems.length)
      }
    },
    placeholderData: keepPreviousData,
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
