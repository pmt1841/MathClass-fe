import { useMutation, useQueryClient } from '@tanstack/react-query'
import { classroomService } from '@/services/classroomService'

export interface ClassData {
  name: string
  maxStudents: number | null
  description: string
}

export function useCreateClass() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: classroomService.createClassroom,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classrooms'] })
    }
  })
}
