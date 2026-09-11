import { describe, it, expect, vi, beforeEach } from 'vitest'
import api from '@/lib/axios'
import {
  aiConfigService,
  AiProvider,
  ApiKeyItem,
  TaskConfig,
  TestConnectionRequest,
  ProviderCreateRequest,
  ProviderUpdateRequest,
  ApiKeyCreateRequest,
  ApiKeyUpdateRequest,
  TaskConfigUpdateRequest,
} from '@/services/aiConfigService'

vi.mock('@/lib/axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    patch: vi.fn(),
  },
}))

describe('aiConfigService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Provider APIs', () => {
    it('getProviders - gọi GET /providers và trả về mảng providers unwrap response.data.data', async () => {
      const mockProviders: AiProvider[] = [
        {
          id: 1,
          code: 'GEMINI',
          name: 'Google Gemini',
          baseUrl: 'https://generativelanguage.googleapis.com',
          protocol: 'GOOGLE_GEMINI_COMPATIBLE',
          strategy: 'PRIORITY',
          status: 'ACTIVE',
        },
      ]
      vi.mocked(api.get).mockResolvedValueOnce({ data: { data: mockProviders } })

      const result = await aiConfigService.getProviders()

      expect(api.get).toHaveBeenCalledWith('/providers')
      expect(result).toEqual(mockProviders)
    })

    it('getProviderModels - gọi GET /providers/:id/models và unwrap response.data.data', async () => {
      const mockModels = ['gemini-2.0-flash', 'gemini-1.5-pro']
      vi.mocked(api.get).mockResolvedValueOnce({ data: { data: mockModels } })

      const result = await aiConfigService.getProviderModels(1)

      expect(api.get).toHaveBeenCalledWith('/providers/1/models')
      expect(result).toEqual(mockModels)
    })

    it('createProvider - gọi POST /providers và unwrap response.data', async () => {
      const req: ProviderCreateRequest = {
        code: 'OPENAI',
        name: 'OpenAI GPT-4',
        baseUrl: 'https://api.openai.com',
        protocol: 'OPENAI_COMPATIBLE',
        strategy: 'ROUND_ROBIN',
      }
      const mockCreated: AiProvider = {
        id: 2,
        code: req.code,
        name: req.name,
        baseUrl: req.baseUrl,
        protocol: 'OPENAI_COMPATIBLE',
        strategy: 'ROUND_ROBIN',
        status: 'ACTIVE',
      }
      vi.mocked(api.post).mockResolvedValueOnce({ data: mockCreated })

      const result = await aiConfigService.createProvider(req)

      expect(api.post).toHaveBeenCalledWith('/providers', req)
      expect(result).toEqual(mockCreated)
    })

    it('updateProvider - gọi PUT /providers/:id và unwrap response.data', async () => {
      const updateReq: ProviderUpdateRequest = {
        name: 'Google Gemini Pro',
        baseUrl: 'https://generativelanguage.googleapis.com',
        strategy: 'PRIORITY',
        status: 'ACTIVE',
      }
      const mockUpdated: AiProvider = {
        id: 1,
        code: 'GEMINI',
        name: updateReq.name,
        baseUrl: updateReq.baseUrl,
        protocol: 'GOOGLE_GEMINI_COMPATIBLE',
        strategy: 'PRIORITY',
        status: 'ACTIVE',
      }
      vi.mocked(api.put).mockResolvedValueOnce({ data: mockUpdated })

      const result = await aiConfigService.updateProvider(1, updateReq)

      expect(api.put).toHaveBeenCalledWith('/providers/1', updateReq)
      expect(result).toEqual(mockUpdated)
    })

    it('deleteProvider - gọi DELETE /providers/:id thành công', async () => {
      vi.mocked(api.delete).mockResolvedValueOnce({ data: null })

      await aiConfigService.deleteProvider(1)

      expect(api.delete).toHaveBeenCalledWith('/providers/1')
    })

    it('testConnection - gọi POST /providers/test và trả về kết quả kiểm tra', async () => {
      const testReq: TestConnectionRequest = {
        providerCode: 'GEMINI',
        apiKey: 'AIzaSyDummyKey',
      }
      const mockResponse = {
        success: true,
        latencyMs: 120,
        message: 'Kết nối thành công',
      }
      vi.mocked(api.post).mockResolvedValueOnce({ data: mockResponse })

      const result = await aiConfigService.testConnection(testReq)

      expect(api.post).toHaveBeenCalledWith('/providers/test', testReq)
      expect(result).toEqual(mockResponse)
    })
  })

  describe('API Key APIs', () => {
    it('getKeysByProvider - gọi GET /providers/:id/keys và unwrap data.data', async () => {
      const mockKeys: ApiKeyItem[] = [
        {
          id: 10,
          maskedApiKey: 'AIzaSy***xyz',
          priority: 1,
          status: 'ACTIVE',
        },
      ]
      vi.mocked(api.get).mockResolvedValueOnce({ data: { data: mockKeys } })

      const result = await aiConfigService.getKeysByProvider(1)

      expect(api.get).toHaveBeenCalledWith('/providers/1/keys')
      expect(result).toEqual(mockKeys)
    })

    it('addKey - gọi POST /providers/:id/keys và unwrap response.data', async () => {
      const keyReq: ApiKeyCreateRequest = {
        name: 'Primary Key',
        apiKey: 'secret-key-123',
        priority: 1,
      }
      const mockCreatedKey: ApiKeyItem = {
        id: 11,
        name: 'Primary Key',
        maskedApiKey: 'sec***123',
        priority: 1,
        status: 'ACTIVE',
      }
      vi.mocked(api.post).mockResolvedValueOnce({ data: mockCreatedKey })

      const result = await aiConfigService.addKey(1, keyReq)

      expect(api.post).toHaveBeenCalledWith('/providers/1/keys', keyReq)
      expect(result).toEqual(mockCreatedKey)
    })

    it('deleteKey - gọi DELETE /keys/:id', async () => {
      vi.mocked(api.delete).mockResolvedValueOnce({ data: null })

      await aiConfigService.deleteKey(11)

      expect(api.delete).toHaveBeenCalledWith('/keys/11')
    })

    it('updateKeyStatus - gọi PATCH /keys/:id với payload status', async () => {
      const mockResult: ApiKeyItem = {
        id: 11,
        priority: 1,
        status: 'INACTIVE',
      }
      vi.mocked(api.patch).mockResolvedValueOnce({ data: mockResult })

      const result = await aiConfigService.updateKeyStatus(11, 'INACTIVE')

      expect(api.patch).toHaveBeenCalledWith('/keys/11', { status: 'INACTIVE' })
      expect(result.status).toBe('INACTIVE')
    })

    it('updateKey - gọi PUT /keys/:id với data cập nhật', async () => {
      const updateData: ApiKeyUpdateRequest = {
        priority: 2,
        name: 'Secondary Key',
      }
      const mockResult: ApiKeyItem = {
        id: 11,
        priority: 2,
        name: 'Secondary Key',
        status: 'ACTIVE',
      }
      vi.mocked(api.put).mockResolvedValueOnce({ data: mockResult })

      const result = await aiConfigService.updateKey(11, updateData)

      expect(api.put).toHaveBeenCalledWith('/keys/11', updateData)
      expect(result).toEqual(mockResult)
    })

    it('verifyKey - gọi POST /keys/:id/verify để kiểm tra trạng thái hoạt động của key', async () => {
      const mockVerifyResponse = {
        success: true,
        latencyMs: 95,
        message: 'API Key hợp lệ',
      }
      vi.mocked(api.post).mockResolvedValueOnce({ data: mockVerifyResponse })

      const result = await aiConfigService.verifyKey(11)

      expect(api.post).toHaveBeenCalledWith('/keys/11/verify')
      expect(result).toEqual(mockVerifyResponse)
    })
  })

  describe('Task Config APIs', () => {
    it('getTaskConfig - gọi GET /tasks/:task và unwrap response.data', async () => {
      const mockConfig: TaskConfig = {
        task: 'SUBMISSION_GRADING',
        providerId: 1,
        model: 'gemini-2.0-flash',
        temperature: 0.2,
        maxToken: 2048,
        enabled: true,
      }
      vi.mocked(api.get).mockResolvedValueOnce({ data: mockConfig })

      const result = await aiConfigService.getTaskConfig('SUBMISSION_GRADING')

      expect(api.get).toHaveBeenCalledWith('/tasks/SUBMISSION_GRADING')
      expect(result).toEqual(mockConfig)
    })

    it('updateTaskConfig - gọi PUT /tasks/:task và unwrap response.data', async () => {
      const updateReq: TaskConfigUpdateRequest = {
        providerId: 2,
        model: 'gpt-4o-mini',
        temperature: 0.3,
        maxToken: 4096,
        enabled: true,
      }
      const mockUpdated: TaskConfig = {
        task: 'SUBMISSION_GRADING',
        providerId: updateReq.providerId,
        model: updateReq.model,
        temperature: updateReq.temperature,
        maxToken: updateReq.maxToken,
        enabled: true,
      }
      vi.mocked(api.put).mockResolvedValueOnce({ data: mockUpdated })

      const result = await aiConfigService.updateTaskConfig('SUBMISSION_GRADING', updateReq)

      expect(api.put).toHaveBeenCalledWith('/tasks/SUBMISSION_GRADING', updateReq)
      expect(result).toEqual(mockUpdated)
    })
  })
})
