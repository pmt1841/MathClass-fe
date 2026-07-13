import { useMutation } from '@tanstack/react-query'
import { authService, ResetPasswordPayload } from '@/services/authService'

export const useResetPassword = () => {
  return useMutation({
    mutationFn: (payload: ResetPasswordPayload) => authService.resetPassword(payload),
  })
}
