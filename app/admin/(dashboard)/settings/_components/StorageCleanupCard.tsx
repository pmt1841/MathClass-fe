'use client'

import React, { useState, useEffect } from 'react'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  HardDrive,
  Trash2,
  Clock,
  RefreshCw,
  Sparkles,
  Calendar,
  Layers,
  Settings,
  Save,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { storageAdminService } from '@/services/storageAdminService'
import { StorageCleanupModal } from '@/components/admin/StorageCleanupModal'
import { formatDateTime } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

const CRON_PRESETS = [
  {
    label: 'Chủ Nhật hàng tuần lúc 03:00 sáng (Khuyên dùng)',
    value: '0 0 3 * * SUN',
  },
  {
    label: 'Mỗi đêm lúc 02:00 sáng',
    value: '0 0 2 * * *',
  },
  {
    label: 'Ngày 1 hàng tháng lúc 00:00',
    value: '0 0 0 1 * *',
  },
  {
    label: 'Tùy chỉnh lịch chạy nâng cao...',
    value: 'custom',
  },
]

export function StorageCleanupCard() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [showConfig, setShowConfig] = useState(false)

  // Local state for configuration form
  const [enabled, setEnabled] = useState<boolean>(true)
  const [selectedPreset, setSelectedPreset] = useState<string>('0 0 3 * * SUN')
  const [customCron, setCustomCron] = useState<string>('0 0 3 * * SUN')
  const [gracePeriodHours, setGracePeriodHours] = useState<number>(24)

  const { data: status, isLoading } = useQuery({
    queryKey: ['storageCleanupStatus'],
    queryFn: storageAdminService.getCleanupStatus,
  })

  // Sync state when data loads
  useEffect(() => {
    if (status) {
      setEnabled(status.enabled)
      setGracePeriodHours(status.gracePeriodHours || 24)

      const matched = CRON_PRESETS.find((p) => p.value === status.cronExpression)
      if (matched) {
        setSelectedPreset(matched.value)
        setCustomCron(status.cronExpression)
      } else {
        setSelectedPreset('custom')
        setCustomCron(status.cronExpression || '0 0 3 * * SUN')
      }
    }
  }, [status])

  const configMutation = useMutation({
    mutationFn: storageAdminService.updateConfig,
    onSuccess: (updatedStatus) => {
      queryClient.setQueryData(['storageCleanupStatus'], updatedStatus)
      toast({
        title: 'Cập nhật thành công',
        description: 'Đã lưu cấu hình và cập nhật lịch dọn dẹp theo thời gian thực.',
      })
      setShowConfig(false)
    },
    onError: (error: any) => {
      toast({
        title: 'Lỗi cập nhật cấu hình',
        description:
          error?.response?.data?.message || 'Có lỗi xảy ra khi lưu cấu hình.',
        variant: 'destructive',
      })
    },
  })

  const handleSaveConfig = () => {
    const finalCron = selectedPreset === 'custom' ? customCron.trim() : selectedPreset
    if (!finalCron) {
      toast({
        title: 'Định dạng lịch chạy không hợp lệ',
        description: 'Vui lòng kiểm tra lại cấu hình hẹn giờ hệ thống.',
        variant: 'destructive',
      })
      return
    }

    configMutation.mutate({
      enabled,
      cronExpression: finalCron,
      gracePeriodHours,
    })
  }

  const handlePresetChange = (value: string) => {
    setSelectedPreset(value)
    if (value !== 'custom') {
      setCustomCron(value)
    }
  }

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['storageCleanupStatus'] })
  }

  const formatLastRunTime = (isoString: string | null | undefined) => {
    if (!isoString) return 'Chưa chạy lần nào'
    return formatDateTime(isoString) || 'Chưa chạy lần nào'
  }

  const getCronDescription = (cron: string | undefined) => {
    if (!cron) return 'Chưa thiết lập'
    const preset = CRON_PRESETS.find((p) => p.value === cron)
    return preset ? preset.label.replace(' (Khuyên dùng)', '') : 'Lịch chạy tùy chỉnh'
  }

  return (
    <>
      <Card className="shadow-sm border-slate-200 bg-white overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div className="space-y-1">
              <CardTitle className="text-xl flex items-center gap-2 text-slate-800">
                <HardDrive className="w-5 h-5 text-indigo-600" />
                Quản lý Bộ nhớ Hình ảnh Đám mây
              </CardTitle>
              <CardDescription className="text-slate-500 text-sm">
                Tự động dọn dẹp định kỳ và thu hồi dung lượng từ ảnh không còn sử dụng.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Badge
                variant="outline"
                className={
                  status?.enabled
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 gap-1.5 py-1 px-2.5 font-medium'
                    : 'bg-slate-100 text-slate-600 border-slate-200 gap-1.5 py-1 px-2.5 font-medium'
                }
              >
                <span
                  className={`w-2 h-2 rounded-full ${status?.enabled ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                    }`}
                />
                {status?.enabled ? 'Tự động: Đang bật' : 'Tự động: Đã tắt'}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowConfig(!showConfig)}
                className={`w-[118px] justify-center gap-1.5 text-xs font-medium border-slate-200 ${showConfig
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
                    : 'text-slate-700 hover:bg-slate-50'
                  }`}
              >
                <Settings className="w-3.5 h-3.5" />
                {showConfig ? 'Đóng cài đặt' : 'Cài đặt lịch'}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="py-6 flex items-center justify-center text-slate-400 gap-2 text-sm">
              <RefreshCw className="w-4 h-4 animate-spin" />
              Đang tải thông tin lưu trữ...
            </div>
          ) : (
            <>
              {/* Panel chỉnh sửa cấu hình lịch dọn dẹp */}
              {showConfig && (
                <div className="p-4 bg-slate-50/90 rounded-xl border border-indigo-100 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
                    <span className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      <Settings className="w-4 h-4 text-indigo-600" />
                      Cấu hình Tự động Dọn dẹp & Lịch chạy
                    </span>
                    <span className="text-xs text-slate-500">
                      Áp dụng tức thì sau khi lưu
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Bật/Tắt switch */}
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200">
                      <div className="space-y-0.5">
                        <Label
                          htmlFor="cleanup-enabled-switch"
                          className="text-sm font-semibold text-slate-800 cursor-pointer"
                        >
                          Bật dọn dẹp định kỳ
                        </Label>
                        <p className="text-xs text-slate-500">
                          Kích hoạt tác vụ chạy ngầm tự động
                        </p>
                      </div>
                      <Switch
                        id="cleanup-enabled-switch"
                        checked={enabled}
                        onCheckedChange={setEnabled}
                        className="data-[state=checked]:bg-indigo-600"
                      />
                    </div>

                    {/* Thời gian bảo vệ ảnh mới */}
                    <div
                      className={`p-3 bg-white rounded-lg border border-slate-200 space-y-1.5 transition-all ${!enabled ? 'opacity-75 pointer-events-none bg-slate-50/50' : ''
                        }`}
                    >
                      <Label
                        htmlFor="grace-period-setting"
                        className={`text-sm font-semibold flex items-center gap-1.5 ${enabled ? 'text-slate-800' : 'text-slate-400'
                          }`}
                      >
                        <Clock
                          className={`w-3.5 h-3.5 ${enabled ? 'text-amber-500' : 'text-slate-400'
                            }`}
                        />
                        Thời gian bảo vệ ảnh mới tải (Giờ)
                      </Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="grace-period-setting"
                          type="number"
                          min={1}
                          max={168}
                          disabled={!enabled}
                          value={gracePeriodHours}
                          onChange={(e) =>
                            setGracePeriodHours(
                              Math.max(1, parseInt(e.target.value) || 1)
                            )
                          }
                          className="h-9 w-24 border-slate-200 text-sm disabled:bg-slate-100 disabled:text-slate-400"
                        />
                        <span className="text-xs text-slate-500">
                          (Bảo vệ ảnh đang soạn thảo dưới {gracePeriodHours} giờ)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Lịch chạy định kỳ */}
                  <div
                    className={`p-3 bg-white rounded-lg border border-slate-200 space-y-2.5 transition-all ${!enabled ? 'opacity-75 pointer-events-none bg-slate-50/50' : ''
                      }`}
                  >
                    <Label
                      className={`text-sm font-semibold flex items-center gap-1.5 ${enabled ? 'text-slate-800' : 'text-slate-400'
                        }`}
                    >
                      <Calendar
                        className={`w-3.5 h-3.5 ${enabled ? 'text-indigo-500' : 'text-slate-400'
                          }`}
                      />
                      Tần suất dọn dẹp tự động
                    </Label>
                    <Select
                      value={selectedPreset}
                      onValueChange={handlePresetChange}
                      disabled={!enabled}
                    >
                      <SelectTrigger className="w-full bg-white border-slate-200 text-sm disabled:bg-slate-100 disabled:text-slate-400">
                        <SelectValue placeholder="Chọn tần suất dọn dẹp" />
                      </SelectTrigger>
                      <SelectContent>
                        {CRON_PRESETS.map((preset) => (
                          <SelectItem key={preset.value} value={preset.value}>
                            {preset.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {selectedPreset === 'custom' && (
                      <div className="space-y-1 pt-1.5">
                        <Label
                          htmlFor="custom-cron-input"
                          className="text-xs font-medium text-slate-600"
                        >
                          Nhập định dạng lịch nâng cao (dành cho kỹ thuật viên):
                        </Label>
                        <Input
                          id="custom-cron-input"
                          placeholder="0 0 3 * * SUN"
                          value={customCron}
                          disabled={!enabled}
                          onChange={(e) => setCustomCron(e.target.value)}
                          className="font-mono text-sm border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowConfig(false)}
                      disabled={configMutation.isPending}
                      className="border-slate-200 text-slate-600"
                    >
                      Hủy
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSaveConfig}
                      disabled={configMutation.isPending}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 font-medium shadow-sm"
                    >
                      {configMutation.isPending ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          Đang lưu...
                        </>
                      ) : (
                        <>
                          <Save className="w-3.5 h-3.5" />
                          Lưu cấu hình
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* Thông tin tóm tắt 3 cột */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                {/* Lịch quét tự động */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5">
                  <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                    <Calendar className="w-4 h-4 text-indigo-500" />
                    Lịch quét tự động
                  </div>
                  <p className="text-sm font-bold text-slate-800">
                    {status?.enabled
                      ? getCronDescription(status?.cronExpression)
                      : 'Đang tạm dừng'}
                  </p>
                  <p className="text-xs text-slate-400">
                    {status?.enabled ? 'Tác vụ chạy ngầm định kỳ' : 'Chưa bật dọn dẹp tự động'}
                  </p>
                </div>

                {/* Bảo vệ ảnh mới */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5">
                  <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                    <Clock className="w-4 h-4 text-amber-500" />
                    Bảo vệ ảnh đang soạn
                  </div>
                  <p className="text-sm font-bold text-slate-800">
                    {status?.gracePeriodHours || 24} Giờ
                  </p>
                  <p className="text-xs text-slate-400">
                    Giữ an toàn ảnh vừa tải lên trong ngày
                  </p>
                </div>

                {/* Lần dọn dẹp gần nhất */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5">
                  <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                    <Sparkles className="w-4 h-4 text-emerald-500" />
                    Lần chạy gần nhất
                  </div>
                  <p className="text-sm font-bold text-slate-800">
                    {formatLastRunTime(status?.lastRunAt)}
                  </p>
                  <p className="text-xs text-slate-500">
                    {status?.lastRunResult ? (
                      <span className="text-emerald-600 font-medium">
                        Đã dọn {status.lastRunResult.filesDeletedSuccessfully} file rác
                      </span>
                    ) : (
                      'Sẵn sàng dọn dẹp'
                    )}
                  </p>
                </div>
              </div>
            </>
          )}

          {/* Dòng ghi chú an toàn */}
          <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 flex items-center gap-2 text-xs text-indigo-900">
            <Layers className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>
              Phạm vi quét dọn: <span className="font-semibold text-indigo-700">Ảnh đại diện người dùng</span> và <span className="font-semibold text-indigo-700">Ảnh đề thi & bài tập</span>
            </span>
          </div>
        </CardContent>

        <CardFooter className="bg-slate-50/80 px-6 py-4 border-t border-slate-100 flex items-center justify-between rounded-b-xl">
          <p className="text-xs text-slate-500 max-w-md">
            Quản trị viên có thể kích hoạt dọn dẹp ngay bất cứ lúc nào hoặc quét thử nghiệm trước khi dọn dẹp.
          </p>
          <Button
            onClick={() => setModalOpen(true)}
            className="bg-amber-600 hover:bg-amber-700 text-white shadow-sm font-medium gap-2 text-sm"
          >
            <Trash2 className="w-4 h-4" />
            Dọn dẹp ảnh rác ngay
          </Button>
        </CardFooter>
      </Card>

      <StorageCleanupModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSuccess={handleSuccess}
      />
    </>
  )
}
