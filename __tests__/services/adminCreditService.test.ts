import { describe, it, expect, vi, beforeEach } from 'vitest'
import api from '@/lib/axios'
import {
  adminCreditService,
  TaskCreditConfig,
  DefaultCreditConfig,
  CreditPackage,
  TaskCreditConfigUpdateRequest,
  DefaultCreditUpdateRequest,
  CreditPackageCreateRequest,
  CreditAdjustRequest,
} from '@/services/adminCreditService'

vi.mock('@/lib/axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('adminCreditService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Task Credit Configs', () => {
    it('getTaskCreditConfigs - gọi GET /admin/ai-credit-config/tasks và trả về danh sách cấu hình chi phí', async () => {
      const mockConfigs: TaskCreditConfig[] = [
        {
          id: 1,
          task: 'SUBMISSION_GRADING',
          costPerCall: 5,
          tokensPerCredit: 1000,
          enabled: true,
        },
      ]
      vi.mocked(api.get).mockResolvedValueOnce({ data: mockConfigs })

      const result = await adminCreditService.getTaskCreditConfigs()

      expect(api.get).toHaveBeenCalledWith('/admin/ai-credit-config/tasks')
      expect(result).toEqual(mockConfigs)
    })

    it('updateTaskCreditConfig - gọi PUT /admin/ai-credit-config/tasks/:task và cập nhật chi phí task', async () => {
      const req: TaskCreditConfigUpdateRequest = {
        costPerCall: 10,
        tokensPerCredit: 2000,
        enabled: true,
      }
      const mockUpdated: TaskCreditConfig = {
        id: 1,
        task: 'SUBMISSION_GRADING',
        ...req,
      }
      vi.mocked(api.put).mockResolvedValueOnce({ data: mockUpdated })

      const result = await adminCreditService.updateTaskCreditConfig('SUBMISSION_GRADING', req)

      expect(api.put).toHaveBeenCalledWith('/admin/ai-credit-config/tasks/SUBMISSION_GRADING', req)
      expect(result).toEqual(mockUpdated)
    })
  })

  describe('Default Credits by Role', () => {
    it('getDefaultCredits - gọi GET /admin/ai-credit-config/defaults', async () => {
      const mockDefaults: DefaultCreditConfig[] = [
        { role: 'STUDENT', defaultCredits: 50 },
        { role: 'TEACHER', defaultCredits: 200 },
      ]
      vi.mocked(api.get).mockResolvedValueOnce({ data: mockDefaults })

      const result = await adminCreditService.getDefaultCredits()

      expect(api.get).toHaveBeenCalledWith('/admin/ai-credit-config/defaults')
      expect(result).toEqual(mockDefaults)
    })

    it('updateDefaultCredits - gọi PUT /admin/ai-credit-config/defaults/:role', async () => {
      const req: DefaultCreditUpdateRequest = {
        defaultCredits: 100,
      }
      const mockUpdated: DefaultCreditConfig = {
        role: 'STUDENT',
        defaultCredits: 100,
      }
      vi.mocked(api.put).mockResolvedValueOnce({ data: mockUpdated })

      const result = await adminCreditService.updateDefaultCredits('STUDENT', req)

      expect(api.put).toHaveBeenCalledWith('/admin/ai-credit-config/defaults/STUDENT', req)
      expect(result).toEqual(mockUpdated)
    })
  })

  describe('Credit Packages', () => {
    it('getPackages - gọi GET /admin/credit-packages', async () => {
      const mockPackages: CreditPackage[] = [
        {
          id: 1,
          name: 'Gói Cơ Bản',
          credits: 100,
          price: 50000,
          enabled: true,
          sortOrder: 1,
        },
      ]
      vi.mocked(api.get).mockResolvedValueOnce({ data: mockPackages })

      const result = await adminCreditService.getPackages()

      expect(api.get).toHaveBeenCalledWith('/admin/credit-packages')
      expect(result).toEqual(mockPackages)
    })

    it('createPackage - gọi POST /admin/credit-packages tạo gói mới', async () => {
      const req: CreditPackageCreateRequest = {
        name: 'Gói VIP',
        credits: 500,
        price: 200000,
        enabled: true,
        sortOrder: 2,
      }
      const mockCreated: CreditPackage = {
        id: 2,
        name: req.name,
        credits: req.credits,
        price: req.price,
        enabled: true,
        sortOrder: 2,
      }
      vi.mocked(api.post).mockResolvedValueOnce({ data: mockCreated })

      const result = await adminCreditService.createPackage(req)

      expect(api.post).toHaveBeenCalledWith('/admin/credit-packages', req)
      expect(result).toEqual(mockCreated)
    })

    it('updatePackage - gọi PUT /admin/credit-packages/:id sửa thông tin gói', async () => {
      const updateData = {
        name: 'Gói VIP Khuyến Mãi',
        credits: 600,
        price: 180000,
        enabled: true,
        sortOrder: 2,
      }
      const mockUpdated: CreditPackage = {
        id: 2,
        name: updateData.name,
        credits: updateData.credits,
        price: updateData.price,
        enabled: true,
        sortOrder: 2,
      }
      vi.mocked(api.put).mockResolvedValueOnce({ data: mockUpdated })

      const result = await adminCreditService.updatePackage(2, updateData)

      expect(api.put).toHaveBeenCalledWith('/admin/credit-packages/2', updateData)
      expect(result).toEqual(mockUpdated)
    })

    it('deletePackage - gọi DELETE /admin/credit-packages/:id', async () => {
      vi.mocked(api.delete).mockResolvedValueOnce({ data: null })

      await adminCreditService.deletePackage(2)

      expect(api.delete).toHaveBeenCalledWith('/admin/credit-packages/2')
    })
  })

  describe('Credit Adjust & Transactions', () => {
    it('adjust - gọi POST /admin/credits/adjust điều chỉnh credit thủ công cho người dùng', async () => {
      const adjustReq: CreditAdjustRequest = {
        userId: 10,
        amount: 50,
        reason: 'Thưởng học sinh xuất sắc',
      }
      const mockResponse = { message: 'Cộng 50 credit thành công' }
      vi.mocked(api.post).mockResolvedValueOnce({ data: mockResponse })

      const result = await adminCreditService.adjust(adjustReq)

      expect(api.post).toHaveBeenCalledWith('/admin/credits/adjust', adjustReq)
      expect(result).toEqual(mockResponse)
    })

    it('getTransactions - gọi GET /admin/credits/transactions với params mặc định', async () => {
      const mockPage = {
        content: [],
        totalElements: 0,
        totalPages: 0,
        size: 10,
        number: 0,
      }
      vi.mocked(api.get).mockResolvedValueOnce({ data: mockPage })

      const result = await adminCreditService.getTransactions()

      expect(api.get).toHaveBeenCalledWith('/admin/credits/transactions', {
        params: {
          userId: undefined,
          type: undefined,
          page: 0,
          size: 10,
        },
      })
      expect(result).toEqual(mockPage)
    })

    it('getTransactions - gọi GET với filter params đầy đủ', async () => {
      const mockPage = {
        content: [
          {
            id: 1,
            userId: 10,
            amount: 50,
            type: 'MANUAL_ADJUST',
            description: 'Thưởng',
            createdAt: '2026-09-11T10:00:00Z',
          },
        ],
        totalElements: 1,
        totalPages: 1,
        size: 5,
        number: 1,
      }
      vi.mocked(api.get).mockResolvedValueOnce({ data: mockPage })

      const result = await adminCreditService.getTransactions({
        userId: 10,
        type: 'MANUAL_ADJUST',
        page: 1,
        size: 5,
      })

      expect(api.get).toHaveBeenCalledWith('/admin/credits/transactions', {
        params: {
          userId: 10,
          type: 'MANUAL_ADJUST',
          page: 1,
          size: 5,
        },
      })
      expect(result).toEqual(mockPage)
      expect(result.content).toHaveLength(1)
    })
  })
})
