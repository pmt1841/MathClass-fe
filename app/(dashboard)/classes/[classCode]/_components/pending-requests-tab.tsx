'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Check, X, UserPlus, Search } from 'lucide-react'
import { toast } from 'sonner'
import { joinRequestService } from '@/services/joinRequestService'
import { ClassroomDetail } from '@/types'
import { PermissionGuard } from '@/components/ui/with-permission'

export function PendingRequestsTab({
  classCode,
  classroom,
}: {
  classCode: string
  classroom: ClassroomDetail | null
}) {
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIds, setSelectedIds] = useState<number[]>([])

  const isFull = classroom ? (classroom.studentCount ?? 0) >= (classroom.maxStudents ?? Infinity) : false

  const { data: pendingRequests = [], isLoading } = useQuery({
    queryKey: ['pending-requests', classCode],
    queryFn: () => joinRequestService.getPendingRequests(classCode),
    enabled: !!classCode,
  })

  const processRequestMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: 'APPROVED' | 'REJECTED' }) =>
      joinRequestService.processJoinRequest(id, { status }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pending-requests', classCode] })
      queryClient.invalidateQueries({ queryKey: ['teacher-stats'] })
      if (variables.status === 'APPROVED') {
        queryClient.invalidateQueries({ queryKey: ['classroom', classCode] })
        queryClient.invalidateQueries({ queryKey: ['classroom-students', classCode] })
      }
    },
    onError: () => toast.error('Xử lý yêu cầu thất bại'),
  })

  const handleBulkAction = async (status: 'APPROVED' | 'REJECTED') => {
    if (selectedIds.length === 0) return
    if (status === 'APPROVED' && isFull) {
      toast.error('Lớp đã đầy, không thể duyệt thêm học sinh.')
      return
    }

    const promises = selectedIds.map((id) =>
      processRequestMutation.mutateAsync({ id, status })
    )

    toast.promise(Promise.all(promises), {
      loading: status === 'APPROVED' ? 'Đang duyệt...' : 'Đang từ chối...',
      success: () => {
        setSelectedIds([])
        return status === 'APPROVED'
          ? `Đã duyệt ${promises.length} học sinh`
          : `Đã từ chối ${promises.length} học sinh`
      },
      error: 'Có lỗi xảy ra khi xử lý một số yêu cầu',
    })
  }

  const filteredRequests = pendingRequests.filter(
    (req) =>
      req.studentName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.studentEmail?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const allFilteredIds = filteredRequests.map((req) => req.id)
  const isAllSelected = filteredRequests.length > 0 && allFilteredIds.every((id) => selectedIds.includes(id))

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(selectedIds.filter((id) => !allFilteredIds.includes(id)))
    } else {
      const newIds = new Set([...selectedIds, ...allFilteredIds])
      setSelectedIds(Array.from(newIds))
    }
  }

  const toggleSelect = (id: number) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((selectedId) => selectedId !== id))
    } else {
      setSelectedIds([...selectedIds, id])
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-border bg-gradient-to-r from-slate-50 to-transparent">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-100">
            <UserPlus className="h-4.5 w-4.5 text-orange-600" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-foreground">Học sinh chờ duyệt</h2>
            <p className="text-xs text-muted-foreground">
              {isLoading ? 'Đang tải...' : `${pendingRequests.length} yêu cầu`}
            </p>
          </div>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Tìm kiếm tên, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-9 pr-3 rounded-lg border border-border bg-white text-xs outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>
      </div>

      {pendingRequests.length === 0 ? (
        <div className="p-8 text-center flex flex-col items-center">
          <div className="h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center mb-3">
            <Check className="h-6 w-6 text-slate-400" />
          </div>
          <h3 className="text-sm font-semibold text-foreground mb-1">Tất cả đã được xử lý</h3>
          <p className="text-xs text-muted-foreground max-w-sm">
            Hiện tại không có học sinh nào đang chờ duyệt vào lớp.
          </p>
        </div>
      ) : (
        <>
          {selectedIds.length > 0 && (
            <div className="bg-primary/5 border-b border-primary/10 px-5 py-3 flex items-center justify-between animate-in slide-in-from-top-2">
              <span className="text-sm font-medium text-primary">
                Đã chọn {selectedIds.length} yêu cầu
              </span>
              <div className="flex gap-2">
                <PermissionGuard permission="classroom:manage_requests">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleBulkAction('APPROVED')}
                      disabled={processRequestMutation.isPending || isFull}
                      className="flex items-center gap-1.5 h-8 px-4 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 transition-colors disabled:opacity-50 text-xs font-semibold shadow-sm"
                    >
                      <Check className="h-3.5 w-3.5" /> Duyệt tất cả
                    </button>
                    <button
                      onClick={() => handleBulkAction('REJECTED')}
                      disabled={processRequestMutation.isPending}
                      className="flex items-center gap-1.5 h-8 px-4 rounded-md bg-rose-600 text-white hover:bg-rose-700 transition-colors disabled:opacity-50 text-xs font-semibold shadow-sm"
                    >
                      <X className="h-3.5 w-3.5" /> Từ chối tất cả
                    </button>
                  </div>
                </PermissionGuard>
              </div>
            </div>
          )}

          <div className="divide-y divide-border">
            {filteredRequests.length > 0 ? (
              <>
                <div className="flex items-center p-4 bg-slate-50/50">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary mr-4 cursor-pointer"
                  />
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Thông tin học sinh
                  </span>
                </div>
                {filteredRequests.map((req) => (
                  <div key={req.id} className="flex items-center p-4 bg-white hover:bg-slate-50 transition-colors">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(req.id)}
                      onChange={() => toggleSelect(req.id)}
                      className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary mr-4 cursor-pointer"
                    />
                    <div className="flex-1 flex flex-col">
                      <span className="text-sm font-semibold text-foreground">{req.studentName}</span>
                      <span className="text-xs text-muted-foreground">{req.studentEmail}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <PermissionGuard permission="classroom:manage_requests">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              toast.promise(processRequestMutation.mutateAsync({ id: req.id, status: 'APPROVED' }), {
                                loading: 'Đang duyệt...',
                                success: 'Đã duyệt yêu cầu tham gia',
                                error: 'Duyệt thất bại'
                              })
                            }}
                            disabled={processRequestMutation.isPending || isFull}
                            className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100 transition-colors disabled:opacity-50 text-xs font-semibold"
                          >
                            <Check className="h-3.5 w-3.5" /> Duyệt
                          </button>
                          <button
                            onClick={() => {
                              toast.promise(processRequestMutation.mutateAsync({ id: req.id, status: 'REJECTED' }), {
                                loading: 'Đang từ chối...',
                                success: 'Đã từ chối yêu cầu tham gia',
                                error: 'Từ chối thất bại'
                              })
                            }}
                            disabled={processRequestMutation.isPending}
                            className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 transition-colors disabled:opacity-50 text-xs font-semibold"
                          >
                            <X className="h-3.5 w-3.5" /> Từ chối
                          </button>
                        </div>
                      </PermissionGuard>
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <div className="p-8 text-center text-muted-foreground text-sm">
                Không tìm thấy kết quả nào phù hợp với "{searchQuery}"
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
