import { describe, it, expect, vi, beforeEach } from 'vitest'
import api from '@/lib/axios'
import { storageAdminService } from '@/services/storageAdminService'

vi.mock('@/lib/axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}))

describe('storageAdminService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('getCleanupStatus calls GET /admin/storage/cleanup/status and returns data', async () => {
    const mockStatus = {
      enabled: true,
      cronExpression: '0 0 3 * * SUN',
      gracePeriodHours: 24,
      lastRunAt: '2026-08-28T03:00:00',
    }

    vi.mocked(api.get).mockResolvedValue({ data: mockStatus } as any)

    const result = await storageAdminService.getCleanupStatus()

    expect(api.get).toHaveBeenCalledWith('/admin/storage/cleanup/status')
    expect(result).toEqual(mockStatus)
  })

  it('triggerCleanup calls POST /admin/storage/cleanup with parameters', async () => {
    const mockResponse = {
      scannedBuckets: ['avatar', 'assignment_image'],
      totalFilesScanned: 50,
      orphanFilesDetected: 5,
      filesDeletedSuccessfully: 5,
      failedDeletions: 0,
      executionTimeMs: 1200,
      dryRun: false,
      completedAt: '2026-08-28T15:00:00',
    }

    vi.mocked(api.post).mockResolvedValue({ data: mockResponse } as any)

    const result = await storageAdminService.triggerCleanup({
      gracePeriodHours: 12,
      dryRun: true,
    })

    expect(api.post).toHaveBeenCalledWith('/admin/storage/cleanup', {
      gracePeriodHours: 12,
      dryRun: true,
    })
    expect(result).toEqual(mockResponse)
  })

  it('updateConfig calls PUT /admin/storage/cleanup/config with parameters and returns updated status', async () => {
    const updateRequest = {
      enabled: false,
      cronExpression: '0 0 2 * * *',
      gracePeriodHours: 48,
    }

    const mockUpdatedStatus = {
      enabled: false,
      cronExpression: '0 0 2 * * *',
      gracePeriodHours: 48,
      lastRunAt: '2026-08-28T03:00:00',
    }

    vi.mocked(api.put).mockResolvedValue({ data: mockUpdatedStatus } as any)

    const result = await storageAdminService.updateConfig(updateRequest)

    expect(api.put).toHaveBeenCalledWith('/admin/storage/cleanup/config', updateRequest)
    expect(result).toEqual(mockUpdatedStatus)
  })
})
