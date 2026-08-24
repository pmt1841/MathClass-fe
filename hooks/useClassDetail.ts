import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { classroomService } from '@/services/classroomService'
import { assignmentService } from '@/services/assignmentService'
import { ClassroomDetail, Student, Assignment } from '@/types'

export function useClassDetail(classCode: string) {
  return useQuery({
    queryKey: ['classroom', classCode],
    queryFn: () => classroomService.getClassroomDetail(classCode),
    enabled: !!classCode
  })
}

export function useUpdateClassroom(classCode: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: { className: string; description?: string; maxStudents: number }) => 
      classroomService.updateClassroom(classCode, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classroom', classCode] })
      queryClient.invalidateQueries({ queryKey: ['my-classrooms'] })
    }
  })
}

export function useDeleteClassroom() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (classCode: string) => classroomService.deleteClassroom(classCode),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-classrooms'] })
    }
  })
}

export function useClassStudents(classCode: string, page: number, size: number, sortParam: string, keyword?: string) {
  return useQuery({
    queryKey: ['classroom-students', classCode, page, size, sortParam, keyword],
    queryFn: async () => {
      const data = await classroomService.getClassroomStudents(classCode, { page, size, sort: sortParam, keyword })
      if (data && data.content) {
        return {
          content: data.content as Student[],
          totalPages: data.totalPages,
          totalElements: data.totalElements
        }
      }
      return { content: (Array.isArray(data) ? data : []) as Student[], totalPages: 0, totalElements: 0 }
    },
    placeholderData: keepPreviousData,
    enabled: !!classCode
  })
}

export function useClassAssignments(
  classCode: string,
  activeTab: 'individual' | 'sheet',
  params: { page: number; size: number; keyword?: string }
) {
  const { page, size, keyword } = params
  return useQuery({
    queryKey: ['classroom-assignments', classCode, activeTab, page, size, keyword],
    queryFn: async () => {
      const queryParams = {
        page,
        size,
        status: 'PUBLISHED',
        keyword: keyword?.trim() || undefined
      }
      if (activeTab === 'individual') {
        const data = await classroomService.getClassroomAssignments(classCode, queryParams)
        return {
          content: (data?.content !== undefined ? data.content : (Array.isArray(data) ? data : [])) as Assignment[],
          totalPages: data?.totalPages || 0,
          totalElements: data?.totalElements || 0
        }
      } else {
        const sheetsData = await assignmentService.getAssignmentSheets({ ...queryParams, classCode, status: 'PUBLISHED' })
        const sheetsList = sheetsData?.content !== undefined ? sheetsData.content : (Array.isArray(sheetsData) ? sheetsData : [])
        const mappedSheets = sheetsList.map((sheet: any) => ({
          ...sheet,
          isSheet: true
        }))
        return {
          content: mappedSheets as Assignment[],
          totalPages: sheetsData?.totalPages || 0,
          totalElements: sheetsData?.totalElements || 0
        }
      }
    },
    placeholderData: keepPreviousData,
    enabled: !!classCode
  })
}

export function useAddStudent(classCode: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (email: string) => classroomService.addStudent(classCode, email),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classroom-students', classCode] })
      queryClient.invalidateQueries({ queryKey: ['classroom', classCode] })
      queryClient.invalidateQueries({ queryKey: ['teacher-stats'] })
    }
  })
}

export function useRemoveStudent(classCode: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (studentId: number) => classroomService.removeStudent(classCode, studentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classroom-students', classCode] })
      queryClient.invalidateQueries({ queryKey: ['classroom', classCode] })
      queryClient.invalidateQueries({ queryKey: ['teacher-stats'] })
    }
  })
}
