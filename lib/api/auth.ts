import api from '@/lib/axios'

export interface LoginCredentials {
  email: string
  password: string
}

export interface LoginResponse {
  token: string
  role?: string
  userRole?: string
  [key: string]: any // Allows for dynamic user fields
}

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    const { data } = await api.post<LoginResponse>('/auth/login', credentials)
    return data
  },
}
