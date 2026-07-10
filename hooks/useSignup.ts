import { useMutation } from '@tanstack/react-query'
import { authService, SignupCredentials } from '@/services/authService'

export function useSignup() {
  return useMutation({
    mutationFn: async (credentials: SignupCredentials) => {
      return authService.register(credentials)
    },
  })
}
