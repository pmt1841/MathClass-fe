import { useQuery } from '@tanstack/react-query'
import api from '@/lib/axios'

export interface MyClassroom {
  id: number
  classCode: string
  className: string
  teacherId: number
  teacherName: string
  studentCount: number
  maxStudents: number
}

export function useMyClassrooms() {
  return useQuery({
    queryKey: ['my-classrooms'],
    queryFn: async () => {
      const res = await api.get('/classrooms/my-classroom')
      return (Array.isArray(res.data) ? res.data : []) as MyClassroom[]
    }
  })
}
