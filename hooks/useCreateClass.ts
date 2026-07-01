import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/axios'

export interface ClassData {
  name: string
  maxStudents: number | null
  description: string
}

export function useCreateClass() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: ClassData) => {
      const response = await api.post('/classrooms/create', payload)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classrooms'] })
    }
  })
}
