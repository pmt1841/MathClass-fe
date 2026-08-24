import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { classroomService } from '@/services/classroomService'
import { ClassroomDetail, Student } from '@/types'

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
