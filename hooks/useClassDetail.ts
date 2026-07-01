import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/axios'
import { ClassroomDetail, Student } from '@/types'

export function useClassDetail(classCode: string) {
  return useQuery({
    queryKey: ['classroom', classCode],
    queryFn: async () => {
      const res = await api.get(`/classrooms/${classCode}`)
      return res.data as ClassroomDetail
    },
    enabled: !!classCode
  })
}

export function useUpdateClassroom(classCode: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: { className: string; description?: string; maxStudents: number }) => {
      await api.put(`/classrooms/${classCode}`, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classroom', classCode] })
      queryClient.invalidateQueries({ queryKey: ['my-classrooms'] })
    }
  })
}

export function useDeleteClassroom() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (classCode: string) => {
      await api.delete(`/classrooms/${classCode}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-classrooms'] })
    }
  })
}

export function useClassStudents(classCode: string, page: number, size: number, sortParam: string) {
  return useQuery({
    queryKey: ['classroom-students', classCode, page, size, sortParam],
    queryFn: async () => {
      const res = await api.get(`/classrooms/${classCode}/students`, {
        params: { page, size, sort: sortParam }
      })
      if (res.data && res.data.content) {
        return {
          content: res.data.content as Student[],
          totalPages: res.data.totalPages,
          totalElements: res.data.totalElements
        }
      }
      return { content: (Array.isArray(res.data) ? res.data : []) as Student[], totalPages: 0, totalElements: 0 }
    },
    enabled: !!classCode
  })
}

export function useAddStudent(classCode: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (email: string) => {
      await api.post(`/classrooms/${classCode}/students/add`, { studentEmail: email })
    },
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
    mutationFn: async (studentId: number) => {
      await api.delete(`/classrooms/${classCode}/students/${studentId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classroom-students', classCode] })
      queryClient.invalidateQueries({ queryKey: ['classroom', classCode] })
      queryClient.invalidateQueries({ queryKey: ['teacher-stats'] })
    }
  })
}
