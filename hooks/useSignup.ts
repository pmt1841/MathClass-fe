import { useMutation } from '@tanstack/react-query'
import api from '@/lib/axios'

export interface SignupCredentials {
  fullName: string
  email: string
  phoneNumber: string
  password: string
  role: string
}

export function useSignup() {
  return useMutation({
    mutationFn: async (credentials: SignupCredentials) => {
      const response = await api.post('/auth/register', {
        ...credentials,
        fullName: credentials.fullName.normalize('NFC'),
      })
      return response.data
    },
  })
}
