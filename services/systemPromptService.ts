import api from '@/lib/axios'

export type SystemPromptStatus = 'ACTIVE' | 'INACTIVE'

export interface SystemPrompt {
  id: number
  code: string
  name: string
  taskCode: string
  defaultContent: string
  currentContent: string
  allowedVariables: string[]
  description?: string
  status: SystemPromptStatus
  createdAt?: string
  updatedAt?: string
}

export interface SystemPromptHistory {
  id: number
  promptId: number
  version: number
  content: string
  changeReason?: string
  createdBy: string
  createdAt: string
}

export interface SystemPromptCreateRequest {
  code: string
  name: string
  taskCode: string
  defaultContent: string
  allowedVariables: string[]
  description?: string
}

export interface SystemPromptUpdateRequest {
  name: string
  currentContent: string
  description?: string
  status: SystemPromptStatus
  changeReason?: string
}

export interface SystemPromptResetRequest {
  reason?: string
}

export interface RenderPromptRequest {
  promptCode: string
  variables?: Record<string, any>
}

export interface RenderPromptResponse {
  promptCode: string
  renderedPrompt: string
  usedVariables: string[]
}

export const systemPromptService = {
  async getAllPrompts(params?: { taskCode?: string; status?: string; search?: string }): Promise<SystemPrompt[]> {
    const res = await api.get<{ data: SystemPrompt[] }>('/system-prompts', { params })
    return res.data.data
  },

  async getPromptById(id: number): Promise<SystemPrompt> {
    const res = await api.get<SystemPrompt>(`/system-prompts/${id}`)
    return res.data
  },

  async createPrompt(data: SystemPromptCreateRequest): Promise<SystemPrompt> {
    const res = await api.post<SystemPrompt>('/system-prompts', data)
    return res.data
  },

  async updatePrompt(id: number, data: SystemPromptUpdateRequest): Promise<SystemPrompt> {
    const res = await api.put<SystemPrompt>(`/system-prompts/${id}`, data)
    return res.data
  },

  async resetToDefault(id: number, reason?: string): Promise<SystemPrompt> {
    const res = await api.post<SystemPrompt>(`/system-prompts/${id}/reset`, { reason })
    return res.data
  },

  async getPromptHistory(id: number): Promise<SystemPromptHistory[]> {
    const res = await api.get<{ data: SystemPromptHistory[] }>(`/system-prompts/${id}/history`)
    return res.data.data
  },

  async rollbackToVersion(id: number, historyId: number): Promise<SystemPrompt> {
    const res = await api.post<SystemPrompt>(`/system-prompts/${id}/rollback/${historyId}`)
    return res.data
  },

  async deletePrompt(id: number): Promise<void> {
    await api.delete(`/system-prompts/${id}`)
  },

  async renderPrompt(data: RenderPromptRequest): Promise<RenderPromptResponse> {
    const res = await api.post<RenderPromptResponse>('/system-prompts/render', data)
    return res.data
  },
}
