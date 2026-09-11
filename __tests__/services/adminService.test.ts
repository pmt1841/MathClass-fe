import { describe, it, expect, vi, beforeEach } from 'vitest'
import api from '@/lib/axios'
import { adminService, Permission, SystemLog } from '@/services/adminService'
import { AdminUser, PageResponse } from '@/types'

vi.mock('@/lib/axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
  },
}))

describe('adminService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('User Management', () => {
    it('getUsers - gọi GET /admin/users với các query params cơ bản', async () => {
      const mockPage = {
        content: [
          {
            id: 1,
            fullName: 'Nguyen Van A',
            email: 'teacher1@example.com',
            role: 'TEACHER',
            active: true,
          } as AdminUser,
        ],
        totalElements: 1,
        totalPages: 1,
        size: 10,
        number: 0,
      } as unknown as PageResponse<AdminUser>

      vi.mocked(api.get).mockResolvedValueOnce({ data: mockPage })

      const result = await adminService.getUsers(0)

      expect(api.get).toHaveBeenCalledWith('/admin/users?page=0&size=10')
      expect(result).toEqual(mockPage)
    })

    it('getUsers - gọi GET kèm filter đầy đủ (role, isActive, search, size)', async () => {
      const mockPage = {
        content: [],
        totalElements: 0,
        totalPages: 0,
        size: 20,
        number: 1,
      } as unknown as PageResponse<AdminUser>

      vi.mocked(api.get).mockResolvedValueOnce({ data: mockPage })

      const result = await adminService.getUsers(1, 'STUDENT', false, 'Bình', 20)

      expect(api.get).toHaveBeenCalledWith('/admin/users?page=1&size=20&role=STUDENT&isActive=false&search=B%C3%ACnh')
      expect(result).toEqual(mockPage)
    })

    it('updateUserStatus - gọi PATCH /admin/users/:id/status với isActive và reason', async () => {
      const mockResponse = { message: 'Khóa tài khoản thành công' }
      vi.mocked(api.patch).mockResolvedValueOnce({ data: mockResponse })

      const result = await adminService.updateUserStatus(5, false, 'Vi phạm quy chế')

      expect(api.patch).toHaveBeenCalledWith('/admin/users/5/status', {
        isActive: false,
        reason: 'Vi phạm quy chế',
      })
      expect(result).toEqual(mockResponse)
    })
  })

  describe('System Logs', () => {
    it('getLogs - gọi GET /admin/logs lọc theo level và resourceType khác ALL', async () => {
      const mockLogs = {
        content: [
          {
            id: 1,
            timestamp: '2026-09-11T10:00:00Z',
            actor: 'admin',
            action: 'UPDATE_CONFIG',
            level: 'INFO',
            resourceType: 'AI_PROVIDER',
            status: 'SUCCESS',
          },
        ],
        totalElements: 1,
        totalPages: 1,
        size: 10,
        number: 0,
      } as unknown as PageResponse<SystemLog>

      vi.mocked(api.get).mockResolvedValueOnce({ data: mockLogs })

      const result = await adminService.getLogs(0, 'INFO', 'AI_PROVIDER', '2026-09-01', '2026-09-11', 10)

      expect(api.get).toHaveBeenCalledWith(
        '/admin/logs?page=0&size=10&level=INFO&resourceType=AI_PROVIDER&startDate=2026-09-01&endDate=2026-09-11'
      )
      expect(result).toEqual(mockLogs)
    })

    it('getLogs - bỏ qua level và resourceType nếu là ALL', async () => {
      const mockLogs = {
        content: [],
        totalElements: 0,
        totalPages: 0,
        size: 10,
        number: 0,
      } as unknown as PageResponse<SystemLog>

      vi.mocked(api.get).mockResolvedValueOnce({ data: mockLogs })

      await adminService.getLogs(0, 'ALL', 'ALL')

      expect(api.get).toHaveBeenCalledWith('/admin/logs?page=0&size=10')
    })
  })

  describe('Permissions & Role Management', () => {
    it('getAllPermissions - gọi GET /admin/roles/permissions', async () => {
      const mockPermissions: Permission[] = [
        { id: 1, name: 'MANAGE_USERS', description: 'Quản lý người dùng' },
        { id: 2, name: 'VIEW_LOGS', description: 'Xem nhật ký hệ thống' },
      ]
      vi.mocked(api.get).mockResolvedValueOnce({ data: mockPermissions })

      const result = await adminService.getAllPermissions()

      expect(api.get).toHaveBeenCalledWith('/admin/roles/permissions')
      expect(result).toEqual(mockPermissions)
    })

    it('getRolePermissions - gọi GET /admin/roles/:role/permissions', async () => {
      const mockPermissions: Permission[] = [
        { id: 1, name: 'MANAGE_USERS', description: 'Quản lý người dùng' },
      ]
      vi.mocked(api.get).mockResolvedValueOnce({ data: mockPermissions })

      const result = await adminService.getRolePermissions('ADMIN')

      expect(api.get).toHaveBeenCalledWith('/admin/roles/ADMIN/permissions')
      expect(result).toEqual(mockPermissions)
    })

    it('updateRolePermissions - gọi PUT /admin/roles/:role/permissions với permissionIds', async () => {
      const mockResponse = { message: 'Cập nhật quyền thành công' }
      vi.mocked(api.put).mockResolvedValueOnce({ data: mockResponse })

      const result = await adminService.updateRolePermissions('TEACHER', [1, 2, 3])

      expect(api.put).toHaveBeenCalledWith('/admin/roles/TEACHER/permissions', {
        permissionIds: [1, 2, 3],
      })
      expect(result).toEqual(mockResponse)
    })

    it('resetRolePermissions - gọi POST /admin/roles/:role/reset-permissions', async () => {
      const mockResponse = { message: 'Khôi phục quyền mặc định thành công' }
      vi.mocked(api.post).mockResolvedValueOnce({ data: mockResponse })

      const result = await adminService.resetRolePermissions('TEACHER')

      expect(api.post).toHaveBeenCalledWith('/admin/roles/TEACHER/reset-permissions')
      expect(result).toEqual(mockResponse)
    })
  })
})
