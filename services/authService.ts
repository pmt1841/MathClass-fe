import api from '@/lib/axios'

export interface LoginCredentials {
  email: string
  password: string
}

export interface SignupCredentials {
  fullName: string
  email: string
  phoneNumber: string
  password: string
  role: string
}

export interface GoogleAuthCredentials {
  credential: string
  role: string
}

export interface LoginResponse {
  token: string
  role?: string
  userRole?: string
  permissions?: string[]
  [key: string]: any // Allows for dynamic user fields
}

export interface ResetPasswordPayload {
  token: string
  newPassword: string
}

export const authService = {
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    const { data } = await api.post<LoginResponse>('/auth/login', credentials)
    return data
  },
  register: async (credentials: SignupCredentials) => {
    const response = await api.post('/auth/register', {
      ...credentials,
      fullName: credentials.fullName.normalize('NFC'),
    })
    return response.data
  },
  googleAuth: async (credentials: GoogleAuthCredentials) => {
    const response = await api.post('/auth/google', credentials)
    return response.data
  },
  verifyEmail: async (token: string) => {
    const response = await api.get(`/auth/verify?token=${token}`)
    return response.data
  },
  forgotPassword: async (email: string): Promise<{ message: string }> => {
    const { data } = await api.post<{ message: string }>('/auth/forgot-password', { email })
    return data
  },
  resetPassword: async (payload: ResetPasswordPayload): Promise<{ message: string, role?: string }> => {
    const { data } = await api.post<{ message: string, role?: string }>('/auth/reset-password', payload)
    return data
  }
}
