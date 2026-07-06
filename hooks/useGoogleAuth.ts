import { useMutation } from '@tanstack/react-query'
import api from '@/lib/axios'

export interface GoogleAuthCredentials {
  credential: string
  role: string
}

export function useGoogleAuth() {
  return useMutation({
    mutationFn: async (credentials: GoogleAuthCredentials) => {
      const response = await api.post('/auth/google', credentials)
      return response.data
    },
  })
}
