import api from '@/lib/axios'

export type ProviderProtocol =
  | 'OPENAI_COMPATIBLE'
  | 'GOOGLE_GEMINI_COMPATIBLE'
  | 'ANTHROPIC_COMPATIBLE'
  | 'CUSTOM_REST'

export interface AiProvider {
  id: number
  code: string
  name: string
  baseUrl: string
  protocol: ProviderProtocol
  authHeaderName?: string
  authHeaderPrefix?: string
  authQueryParam?: string
  healthCheckPath?: string
  strategy: 'PRIORITY' | 'ROUND_ROBIN'
  status: 'ACTIVE' | 'INACTIVE'
  createdAt?: string
  updatedAt?: string
}

export interface ApiKeyItem {
  id: number
  name?: string
  maskedApiKey?: string
  priority: number
  status: 'ACTIVE' | 'INACTIVE'
  lastUsed?: string
  cooldownRemainingSeconds?: number
  cooldownExpiresAt?: string
  createdAt?: string
  updatedAt?: string
}

export interface TaskConfig {
  task: string
  providerId: number
  model: string
  temperature: number
  maxToken: number
  enabled: boolean
  updatedAt?: string
}

export interface TestConnectionRequest {
  providerCode: string
  apiKey: string
  model?: string
  baseUrl?: string
  protocol?: ProviderProtocol
  authHeaderName?: string
  authHeaderPrefix?: string
  authQueryParam?: string
  healthCheckPath?: string
}

export interface TestConnectionResponse {
  success: boolean
  valid?: boolean
  latencyMs: number
  message: string
  errorCode?: string
}

export interface ProviderCreateRequest {
  code: string
  name: string
  baseUrl: string
  protocol?: ProviderProtocol
  authHeaderName?: string
  authHeaderPrefix?: string
  authQueryParam?: string
  healthCheckPath?: string
  strategy: 'PRIORITY' | 'ROUND_ROBIN'
  apiKey?: string
}

export interface ProviderUpdateRequest {
  name: string
  baseUrl: string
  protocol?: ProviderProtocol
  authHeaderName?: string
  authHeaderPrefix?: string
  authQueryParam?: string
  healthCheckPath?: string
  strategy: 'PRIORITY' | 'ROUND_ROBIN'
  status: 'ACTIVE' | 'INACTIVE'
}

export interface ApiKeyCreateRequest {
  name?: string
  apiKey: string
  priority?: number
}

export interface ApiKeyUpdateRequest {
  name?: string
  apiKey?: string
  priority?: number
  status?: 'ACTIVE' | 'INACTIVE'
}

export interface TaskConfigUpdateRequest {
  providerId: number
  model: string
  temperature: number
  maxToken: number
  enabled?: boolean
}

export const aiConfigService = {
  // Provider APIs
  getProviders: async (): Promise<AiProvider[]> => {
    const response = await api.get<{ data: AiProvider[] }>('/providers')
    return response.data.data
  },

  getProviderModels: async (providerId: number): Promise<string[]> => {
    const response = await api.get<{ data: string[] }>(`/providers/${providerId}/models`)
    return response.data.data
  },

  createProvider: async (data: ProviderCreateRequest): Promise<AiProvider> => {
    const response = await api.post<AiProvider>('/providers', data)
    return response.data
  },

  updateProvider: async (id: number, data: ProviderUpdateRequest): Promise<AiProvider> => {
    const response = await api.put<AiProvider>(`/providers/${id}`, data)
    return response.data
  },

  deleteProvider: async (id: number): Promise<void> => {
    await api.delete(`/providers/${id}`)
  },

  testConnection: async (data: TestConnectionRequest): Promise<TestConnectionResponse> => {
    const response = await api.post<TestConnectionResponse>('/providers/test', data)
    return response.data
  },

  // API Key APIs
  getKeysByProvider: async (providerId: number): Promise<ApiKeyItem[]> => {
    const response = await api.get<{ data: ApiKeyItem[] }>(`/providers/${providerId}/keys`)
    return response.data.data
  },

  addKey: async (providerId: number, data: ApiKeyCreateRequest): Promise<ApiKeyItem> => {
    const response = await api.post<ApiKeyItem>(`/providers/${providerId}/keys`, data)
    return response.data
  },

  deleteKey: async (keyId: number): Promise<void> => {
    await api.delete(`/keys/${keyId}`)
  },

  updateKeyStatus: async (keyId: number, status: 'ACTIVE' | 'INACTIVE'): Promise<ApiKeyItem> => {
    const response = await api.patch<ApiKeyItem>(`/keys/${keyId}`, { status })
    return response.data
  },

  updateKey: async (keyId: number, data: ApiKeyUpdateRequest): Promise<ApiKeyItem> => {
    const response = await api.put<ApiKeyItem>(`/keys/${keyId}`, data)
    return response.data
  },

  verifyKey: async (keyId: number): Promise<TestConnectionResponse> => {
    const response = await api.post<TestConnectionResponse>(`/keys/${keyId}/verify`)
    return response.data
  },

  // Task Config APIs
  getTaskConfig: async (task: string): Promise<TaskConfig> => {
    const response = await api.get<TaskConfig>(`/tasks/${task}`)
    return response.data
  },

  updateTaskConfig: async (task: string, data: TaskConfigUpdateRequest): Promise<TaskConfig> => {
    const response = await api.put<TaskConfig>(`/tasks/${task}`, data)
    return response.data
  }
}
