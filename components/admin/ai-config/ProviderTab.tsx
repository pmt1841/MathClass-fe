'use client'

import { useState, useEffect } from 'react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Spinner } from '@/components/ui/spinner'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Key,
  ShieldCheck,
  Zap,
} from 'lucide-react'
import {
  AiProvider,
  ApiKeyItem,
  aiConfigService,
  ProviderCreateRequest,
  ProviderUpdateRequest,
  ApiKeyCreateRequest,
} from '@/services/aiConfigService'
import { ProviderDialog } from './ProviderDialog'
import { ApiKeyDialog } from './ApiKeyDialog'
import { useToast } from '@/components/ui/use-toast'
import { parseDateSafe } from '@/lib/utils'
import { format } from 'date-fns'

export function ProviderTab() {
  const { toast } = useToast()
  const [providers, setProviders] = useState<AiProvider[]>([])
  const [loading, setLoading] = useState(true)

  // Keys by provider ID map
  const [keysMap, setKeysMap] = useState<Record<number, ApiKeyItem[]>>({})
  const [loadingKeysMap, setLoadingKeysMap] = useState<Record<number, boolean>>({})

  // Modals state
  const [providerModalOpen, setProviderModalOpen] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<AiProvider | null>(null)

  const [keyModalOpen, setKeyModalOpen] = useState(false)
  const [targetProviderForKey, setTargetProviderForKey] = useState<AiProvider | null>(null)

  const [verifyingKeyId, setVerifyingKeyId] = useState<number | null>(null)

  const loadProviders = async () => {
    setLoading(true)
    try {
      const data = await aiConfigService.getProviders()
      setProviders(data)
    } catch (err: any) {
      toast({
        title: 'Lỗi tải danh sách Provider',
        description: err.response?.data?.message || err.message,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const loadKeysForProvider = async (providerId: number) => {
    setLoadingKeysMap((prev) => ({ ...prev, [providerId]: true }))
    try {
      const keys = await aiConfigService.getKeysByProvider(providerId)
      setKeysMap((prev) => ({ ...prev, [providerId]: keys }))
    } catch (err: any) {
      toast({
        title: 'Lỗi tải danh sách Key',
        description: err.response?.data?.message || err.message,
        variant: 'destructive',
      })
    } finally {
      setLoadingKeysMap((prev) => ({ ...prev, [providerId]: false }))
    }
  }

  useEffect(() => {
    loadProviders()
  }, [])

  const handleCreateProvider = async (data: ProviderCreateRequest) => {
    try {
      await aiConfigService.createProvider(data)
      toast({
        title: 'Tạo Provider thành công',
        description: `Đã tạo Provider ${data.name} (${data.code})`,
      })
      loadProviders()
    } catch (err: any) {
      toast({
        title: 'Tạo Provider thất bại',
        description: err.response?.data?.message || err.message,
        variant: 'destructive',
      })
      throw err
    }
  }

  const handleUpdateProvider = async (id: number, data: ProviderUpdateRequest) => {
    try {
      await aiConfigService.updateProvider(id, data)
      toast({
        title: 'Cập nhật Provider thành công',
      })
      loadProviders()
    } catch (err: any) {
      toast({
        title: 'Cập nhật Provider thất bại',
        description: err.response?.data?.message || err.message,
        variant: 'destructive',
      })
      throw err
    }
  }

  const handleDeleteProvider = async (id: number, name: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa Provider "${name}" không?`)) return
    try {
      await aiConfigService.deleteProvider(id)
      toast({
        title: 'Xóa Provider thành công',
      })
      loadProviders()
    } catch (err: any) {
      toast({
        title: 'Xóa Provider thất bại',
        description: err.response?.data?.message || err.message,
        variant: 'destructive',
      })
    }
  }

  const handleAddKey = async (data: ApiKeyCreateRequest) => {
    if (!targetProviderForKey) return
    try {
      await aiConfigService.addKey(targetProviderForKey.id, data)
      toast({
        title: 'Thêm API Key thành công',
        description: `Đã thêm Key mới cho Provider ${targetProviderForKey.name}`,
      })
      loadKeysForProvider(targetProviderForKey.id)
    } catch (err: any) {
      toast({
        title: 'Thêm Key thất bại',
        description: err.response?.data?.message || err.message,
        variant: 'destructive',
      })
      throw err
    }
  }

  const handleToggleKeyStatus = async (providerId: number, keyId: number, currentStatus: 'ACTIVE' | 'INACTIVE') => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
    try {
      await aiConfigService.updateKeyStatus(keyId, nextStatus)
      toast({
        title: `Đã chuyển trạng thái Key sang ${nextStatus}`,
      })
      loadKeysForProvider(providerId)
    } catch (err: any) {
      toast({
        title: 'Cập nhật trạng thái Key thất bại',
        description: err.response?.data?.message || err.message,
        variant: 'destructive',
      })
    }
  }

  const handleDeleteKey = async (providerId: number, keyId: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa API Key này không?')) return
    try {
      await aiConfigService.deleteKey(keyId)
      toast({
        title: 'Xóa Key thành công',
      })
      loadKeysForProvider(providerId)
    } catch (err: any) {
      toast({
        title: 'Xóa Key thất bại',
        description: err.response?.data?.message || err.message,
        variant: 'destructive',
      })
    }
  }

  const handleVerifyKey = async (providerId: number, keyId: number) => {
    setVerifyingKeyId(keyId)
    try {
      const res = await aiConfigService.verifyKey(keyId)
      if (res.success || res.valid) {
        toast({
          title: '⚡ Kiểm tra Key hợp lệ!',
          description: `Key hoạt động bình thường. Độ trễ: ${res.latencyMs || 0} ms.`,
        })
      } else {
        toast({
          title: '❌ Key không hợp lệ hoặc hết Quota',
          description: (res.message || res.errorCode || 'Kiểm tra thất bại') + ' - Trạng thái Key đã được chuyển thành INACTIVE.',
          variant: 'destructive',
        })
      }
      await loadKeysForProvider(providerId)
      await loadProviders()
    } catch (err: any) {
      toast({
        title: 'Lỗi kiểm tra Key',
        description: err.response?.data?.message || err.message,
        variant: 'destructive',
      })
    } finally {
      setVerifyingKeyId(null)
    }
  }

  const formatDateStr = (dateStr?: string) => {
    if (!dateStr) return 'Chưa sử dụng'
    const date = parseDateSafe(dateStr)
    if (!date) return 'Chưa sử dụng'
    return format(date, 'HH:mm dd/MM/yyyy')
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base sm:text-lg font-semibold">Danh sách Nhà cung cấp AI (Providers)</h3>
          <p className="text-xs text-muted-foreground">
            Quản lý tập trung các AI Provider, định nghĩa chiến lược failover và danh sách API Keys.
          </p>
        </div>

        <Button
          className="w-full sm:w-auto"
          onClick={() => {
            setSelectedProvider(null)
            setProviderModalOpen(true)
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Thêm Provider mới
        </Button>
      </div>

      {providers.length === 0 ? (
        <div className="rounded-lg border bg-white p-6 sm:p-8 text-center text-xs sm:text-sm text-muted-foreground">
          Chưa có Nhà cung cấp AI nào được cấu hình. Hãy bấm nút "Thêm Provider mới" ở trên.
        </div>
      ) : (
        <Accordion
          type="multiple"
          className="space-y-3 sm:space-y-4"
          onValueChange={(values) => {
            values.forEach((val) => {
              const providerId = parseInt(val)
              if (providerId && !keysMap[providerId]) {
                loadKeysForProvider(providerId)
              }
            })
          }}
        >
          {providers.map((p) => {
            const keys = keysMap[p.id] || []
            const isKeysLoading = loadingKeysMap[p.id]

            return (
              <AccordionItem
                key={p.id}
                value={p.id.toString()}
                className="rounded-lg border bg-white shadow-sm overflow-hidden px-3 sm:px-4"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 py-2">
                  <AccordionTrigger className="hover:no-underline py-2 flex-1 text-left">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 font-bold text-xs sm:text-sm">
                        {p.code.substring(0, 3)}
                      </div>

                      <div className="text-left min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                          <span className="font-semibold text-sm sm:text-base">{p.name}</span>
                          <Badge variant="outline" className="font-mono text-[10px] sm:text-[11px]">
                            {p.code}
                          </Badge>
                        </div>
                        <span className="text-[11px] sm:text-xs text-muted-foreground font-mono truncate block max-w-[280px] sm:max-w-md">
                          {p.baseUrl}
                        </span>
                      </div>
                    </div>
                  </AccordionTrigger>

                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 shrink-0 pb-1 lg:pb-0" onClick={(e) => e.stopPropagation()}>
                    <Badge
                      variant="secondary"
                      className={`text-[11px] ${
                        p.strategy === 'PRIORITY'
                          ? 'bg-purple-100 text-purple-700 border-purple-200'
                          : 'bg-indigo-100 text-indigo-700 border-indigo-200'
                      }`}
                    >
                      <Zap className="mr-1 h-3 w-3" />
                      {p.strategy}
                    </Badge>

                    <Badge
                      variant={p.status === 'ACTIVE' ? 'outline' : 'destructive'}
                      className={`text-[11px] ${
                        p.status === 'ACTIVE'
                          ? 'border-emerald-500 text-emerald-600 bg-emerald-50'
                          : ''
                      }`}
                    >
                      {p.status === 'ACTIVE' ? (
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                      ) : (
                        <XCircle className="mr-1 h-3 w-3" />
                      )}
                      {p.status}
                    </Badge>

                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs"
                      onClick={() => {
                        setSelectedProvider(p)
                        setProviderModalOpen(true)
                      }}
                    >
                      <Edit2 className="h-3.5 w-3.5 mr-1" />
                      Sửa
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleDeleteProvider(p.id, p.name)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>

                    <Button
                      size="sm"
                      className="h-8 text-xs"
                      onClick={() => {
                        setTargetProviderForKey(p)
                        setKeyModalOpen(true)
                      }}
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      Thêm Key
                    </Button>
                  </div>
                </div>

                <AccordionContent className="pt-2 pb-4">
                  <div className="border-t pt-3">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                        <Key className="h-4 w-4 text-amber-500" />
                        Danh sách API Keys ({keys.length})
                      </div>
                    </div>

                    {isKeysLoading ? (
                      <div className="py-6 text-center">
                        <Spinner className="mx-auto h-5 w-5" />
                      </div>
                    ) : keys.length === 0 ? (
                      <div className="rounded-md border border-dashed p-4 text-center text-xs text-muted-foreground">
                        Chưa có API Key nào cho Provider này. Bấm "+ Thêm Key" để bổ sung.
                      </div>
                    ) : (
                      <div className="rounded-md border overflow-x-auto">
                        <Table className="min-w-[620px]">
                          <TableHeader>
                            <TableRow className="bg-slate-50 text-xs">
                              <TableHead>Tên Key / Ghi chú</TableHead>
                              <TableHead className="w-[180px]">API Key</TableHead>
                              <TableHead className="w-[100px] text-center">Ưu tiên</TableHead>
                              <TableHead className="w-[120px]">Sử dụng cuối</TableHead>
                              <TableHead className="w-[110px] text-center">Trạng thái</TableHead>
                              <TableHead className="w-[180px] text-right">Thao tác</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {keys.map((k) => (
                              <TableRow key={k.id} className="text-xs">
                                <TableCell className="font-medium">
                                  {k.name || `Key #${k.id}`}
                                </TableCell>
                                <TableCell className="font-mono text-xs text-slate-600 bg-slate-50 px-2 py-1 rounded border border-slate-200 inline-block my-1">
                                  {k.maskedApiKey || 'Key đã mã hóa'}
                                </TableCell>
                                <TableCell className="text-center">
                                  <Badge variant="secondary" className="font-mono text-xs">
                                    Priority: {k.priority}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-muted-foreground font-mono text-[11px]">
                                  {formatDateStr(k.lastUsed)}
                                </TableCell>
                                <TableCell className="text-center">
                                  <div className="flex items-center justify-center gap-2">
                                    <Switch
                                      checked={k.status === 'ACTIVE'}
                                      onCheckedChange={() =>
                                        handleToggleKeyStatus(p.id, k.id, k.status)
                                      }
                                    />
                                    <span
                                      className={
                                        k.status === 'ACTIVE'
                                          ? 'text-emerald-600 font-medium'
                                          : 'text-muted-foreground'
                                      }
                                    >
                                      {k.status}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-right space-x-1">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 px-2 text-[11px]"
                                    disabled={verifyingKeyId === k.id}
                                    onClick={() => handleVerifyKey(p.id, k.id)}
                                  >
                                    {verifyingKeyId === k.id ? (
                                      <Spinner className="h-3 w-3 mr-1" />
                                    ) : (
                                      <ShieldCheck className="h-3 w-3 mr-1 text-emerald-600" />
                                    )}
                                    Verify
                                  </Button>

                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0 text-red-500 hover:text-red-700"
                                    onClick={() => handleDeleteKey(p.id, k.id)}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            )
          })}
        </Accordion>
      )}

      {/* Provider Dialog */}
      <ProviderDialog
        open={providerModalOpen}
        onOpenChange={setProviderModalOpen}
        provider={selectedProvider}
        onSubmitCreate={handleCreateProvider}
        onSubmitUpdate={handleUpdateProvider}
      />

      {/* Api Key Dialog */}
      <ApiKeyDialog
        open={keyModalOpen}
        onOpenChange={setKeyModalOpen}
        providerName={targetProviderForKey?.name}
        onSubmit={handleAddKey}
      />
    </div>
  )
}
