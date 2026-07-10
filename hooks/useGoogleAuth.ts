import { useMutation } from '@tanstack/react-query'
import { authService, GoogleAuthCredentials } from '@/services/authService'

export function useGoogleAuth() {
  return useMutation({
    mutationFn: async (credentials: GoogleAuthCredentials) => {
      return authService.googleAuth(credentials)
    },
  })
}
