import { useQuery } from '@tanstack/react-query'
import { classroomService, Classroom } from '@/services/classroomService'

export function useMyClassrooms() {
  return useQuery({
    queryKey: ['my-classrooms'],
    queryFn: classroomService.getMyClassrooms
  })
}
