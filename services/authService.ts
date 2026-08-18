import api from '@/lib/axios'

export interface LoginCredentials {
  email: string
  password: string
  rememberMe?: boolean
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
  rememberMe?: boolean
}

export interface LoginResponse {
  id?: number
  email?: string
  fullName?: string
  token?: string
  role?: string
  userRole?: string
  avatarUrl?: string
  permissions?: string[]
  is2faRequired?: boolean
  isSetupRequired?: boolean
  preAuthToken?: string
  message?: string
  [key: string]: any // Allows for dynamic user fields
}

export interface TwoFactorSetupResponse {
  secretKey: string
  qrCodeDataUrl: string
  manualEntryKey: string
}

export interface TwoFactorConfirmPayload {
  code: string
}

export interface TwoFactorConfirmResponse {
  userInfo: LoginResponse
  backupCodes: string[]
  message: string
}

export interface TwoFactorVerifyPayload {
  code: string
  isBackupCode?: boolean
  rememberMe?: boolean
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
  },

  // 2FA Google Authenticator Endpoints
  initiate2faSetup: async (preAuthToken: string): Promise<TwoFactorSetupResponse> => {
    const { data } = await api.post<TwoFactorSetupResponse>(
      '/auth/2fa/setup',
      {},
      {
        headers: { Authorization: `Bearer ${preAuthToken}` },
      }
    )
    return data
  },

  confirm2faSetup: async (
    payload: TwoFactorConfirmPayload,
    preAuthToken: string
  ): Promise<TwoFactorConfirmResponse> => {
    const { data } = await api.post<TwoFactorConfirmResponse>(
      '/auth/2fa/setup/confirm',
      payload,
      {
        headers: { Authorization: `Bearer ${preAuthToken}` },
      }
    )
    return data
  },

  verify2faLogin: async (
    payload: TwoFactorVerifyPayload,
    preAuthToken: string
  ): Promise<LoginResponse> => {
    const { data } = await api.post<LoginResponse>(
      '/auth/2fa/verify',
      payload,
      {
        headers: { Authorization: `Bearer ${preAuthToken}` },
      }
    )
    return data
  },
}
