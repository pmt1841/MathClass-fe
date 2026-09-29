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
  Timer,
} from 'lucide-react'
import {
  AiProvider,
  ApiKeyItem,
  aiConfigService,
  ProviderCreateRequest,
  ProviderUpdateRequest,
  ApiKeyCreateRequest,
  ApiKeyUpdateRequest,
} from '@/services/aiConfigService'
import { ProviderDialog } from './ProviderDialog'
import { ApiKeyDialog } from './ApiKeyDialog'
import { useToast } from '@/components/ui/use-toast'
import { formatDateTime } from '@/lib/utils'
import { useI18n } from '@/lib/i18n/i18n-context'

function KeyCooldownBadge({ expiresAt, initialSeconds }: { expiresAt?: string; initialSeconds?: number }) {
  const { t } = useI18n()
  const calculateRemaining = () => {
    if (expiresAt) {
      const diff = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000))
      return diff
    }
    return initialSeconds ?? 0
  }

  const [remaining, setRemaining] = useState<number>(calculateRemaining)

  useEffect(() => {
    setRemaining(calculateRemaining())
    if (!expiresAt && !initialSeconds) return

    const interval = setInterval(() => {
      const rem = calculateRemaining()
      setRemaining(rem)
      if (rem <= 0) {
        clearInterval(interval)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [expiresAt, initialSeconds])

  if (remaining <= 0) return null

  const minutes = Math.floor(remaining / 60)
  const seconds = remaining % 60
  const formatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`

  return (
    <div
      className="inline-flex items-center justify-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60 mt-1 whitespace-nowrap w-[116px] select-none"
      title={t('API Key đang trong thời gian tạm nghỉ do lỗi 429 Vượt hạn mức (Quota Exceeded). Tự động phục hồi sau {time}', { time: formatted })}
    >
      <Timer className="w-3 h-3 text-amber-500 shrink-0" />
      <span>{t('Tạm nghỉ')} <span className="font-mono tabular-nums font-bold">({formatted})</span></span>
    </div>
  )
}

export function ProviderTab() {
  const { t } = useI18n()
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
  const [selectedKeyForEdit, setSelectedKeyForEdit] = useState<{ providerId: number; key: ApiKeyItem } | null>(null)

  const [openAccordions, setOpenAccordions] = useState<string[]>([])

  const [verifyingKeyId, setVerifyingKeyId] = useState<number | null>(null)

  const loadProviders = async (showSpinner = false) => {
    if (showSpinner) setLoading(true)
    try {
      const data = await aiConfigService.getProviders()
      setProviders(data)
    } catch (err: any) {
      toast({
        title: t('Lỗi tải danh sách Provider'),
        description: err.response?.data?.message || err.message,
        variant: 'destructive',
      })
    } finally {
      if (showSpinner) setLoading(false)
    }
  }

  const loadKeysForProvider = async (providerId: number) => {
    setLoadingKeysMap((prev) => ({ ...prev, [providerId]: true }))
    try {
      const keys = await aiConfigService.getKeysByProvider(providerId)
      setKeysMap((prev) => ({ ...prev, [providerId]: keys }))
    } catch (err: any) {
      toast({
        title: t('Lỗi tải danh sách Key'),
        description: err.response?.data?.message || err.message,
        variant: 'destructive',
      })
    } finally {
      setLoadingKeysMap((prev) => ({ ...prev, [providerId]: false }))
    }
  }

  useEffect(() => {
    loadProviders(true)
  }, [])

  const handleCreateProvider = async (data: ProviderCreateRequest) => {
    try {
      await aiConfigService.createProvider(data)
      toast({
        title: t('Tạo Provider thành công'),
        description: t('Đã tạo Provider {name} ({code})', { name: data.name, code: data.code }),
      })
      loadProviders(false)
    } catch (err: any) {
      toast({
        title: t('Tạo Provider thất bại'),
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
        title: t('Cập nhật Provider thành công'),
      })
      loadProviders(false)
    } catch (err: any) {
      toast({
        title: t('Cập nhật Provider thất bại'),
        description: err.response?.data?.message || err.message,
        variant: 'destructive',
      })
      throw err
    }
  }

  const handleDeleteProvider = async (id: number, name: string) => {
    if (!confirm(t('Bạn có chắc chắn muốn xóa Provider "{name}" không?', { name }))) return
    try {
      await aiConfigService.deleteProvider(id)
      toast({
        title: t('Xóa Provider thành công'),
      })
      loadProviders(false)
    } catch (err: any) {
      toast({
        title: t('Xóa Provider thất bại'),
        description: err.response?.data?.message || err.message,
        variant: 'destructive',
      })
    }
  }

  const handleSaveKey = async (data: ApiKeyCreateRequest | ApiKeyUpdateRequest) => {
    if (selectedKeyForEdit) {
      try {
        await aiConfigService.updateKey(selectedKeyForEdit.key.id, data as ApiKeyUpdateRequest)
        toast({
          title: t('Cập nhật API Key thành công'),
          description: t('Đã cập nhật thông tin Key #{id}', { id: selectedKeyForEdit.key.id }),
        })
        loadKeysForProvider(selectedKeyForEdit.providerId)
        loadProviders(false)
        setSelectedKeyForEdit(null)
      } catch (err: any) {
        toast({
          title: t('Cập nhật Key thất bại'),
          description: err.response?.data?.message || err.message,
          variant: 'destructive',
        })
        throw err
      }
    } else if (targetProviderForKey) {
      try {
        await aiConfigService.addKey(targetProviderForKey.id, data as ApiKeyCreateRequest)
        toast({
          title: t('Thêm API Key thành công'),
          description: t('Đã thêm Key mới cho Provider {name}', { name: targetProviderForKey.name }),
        })
        loadKeysForProvider(targetProviderForKey.id)
        loadProviders(false)
      } catch (err: any) {
        toast({
          title: t('Thêm Key thất bại'),
          description: err.response?.data?.message || err.message,
          variant: 'destructive',
        })
        throw err
      }
    }
  }

  const handleToggleKeyStatus = async (providerId: number, keyId: number, currentStatus: 'ACTIVE' | 'INACTIVE') => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
    try {
      await aiConfigService.updateKeyStatus(keyId, nextStatus)
      toast({
        title: t('Đã chuyển trạng thái Key sang {status}', { status: nextStatus }),
      })
      loadKeysForProvider(providerId)
      loadProviders(false)
    } catch (err: any) {
      toast({
        title: t('Cập nhật trạng thái Key thất bại'),
        description: err.response?.data?.message || err.message,
        variant: 'destructive',
      })
    }
  }

  const handleDeleteKey = async (providerId: number, keyId: number) => {
    if (!confirm(t('Bạn có chắc chắn muốn xóa API Key này không?'))) return
    try {
      await aiConfigService.deleteKey(keyId)
      toast({
        title: t('Xóa Key thành công'),
      })
      loadKeysForProvider(providerId)
      loadProviders(false)
    } catch (err: any) {
      toast({
        title: t('Xóa Key thất bại'),
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
          title: t('⚡ Kiểm tra Key hợp lệ!'),
          description: t('Key hoạt động bình thường. Độ trễ: {ms} ms.', { ms: res.latencyMs || 0 }),
        })
      } else {
        toast({
          title: t('❌ Key không hợp lệ hoặc hết Quota'),
          description: (res.message || res.errorCode || t('Kiểm tra thất bại')) + ' - ' + t('Trạng thái Key đã được chuyển thành INACTIVE.'),
          variant: 'destructive',
        })
      }
      await loadKeysForProvider(providerId)
      await loadProviders(false)
    } catch (err: any) {
      toast({
        title: t('Lỗi kiểm tra Key'),
        description: err.response?.data?.message || err.message,
        variant: 'destructive',
      })
    } finally {
      setVerifyingKeyId(null)
    }
  }

  const formatDateStr = (dateStr?: string) => {
    if (!dateStr) return t('Chưa sử dụng')
    return formatDateTime(dateStr) || t('Chưa sử dụng')
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
          <h3 className="text-base sm:text-lg font-semibold">{t('Danh sách Nhà cung cấp AI (Providers)')}</h3>
          <p className="text-xs text-muted-foreground">
            {t('Quản lý tập trung các AI Provider, định nghĩa chiến lược failover và danh sách API Keys.')}
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
          {t('Thêm Provider mới')}
        </Button>
      </div>

      {providers.length === 0 ? (
        <div className="rounded-lg border bg-white p-6 sm:p-8 text-center text-xs sm:text-sm text-muted-foreground">
          {t('Chưa có Nhà cung cấp AI nào được cấu hình. Hãy bấm nút "Thêm Provider mới" ở trên.')}
        </div>
      ) : (
        <Accordion
          type="multiple"
          value={openAccordions}
          onValueChange={(values) => {
            setOpenAccordions(values)
            values.forEach((val) => {
              const providerId = parseInt(val)
              if (providerId && !keysMap[providerId]) {
                loadKeysForProvider(providerId)
              }
            })
          }}
          className="space-y-3 sm:space-y-4"
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
                      {t('Sửa')}
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
                        setSelectedKeyForEdit(null)
                        setKeyModalOpen(true)
                        setOpenAccordions((prev) => Array.from(new Set([...prev, p.id.toString()])))
                        if (!keysMap[p.id]) {
                          loadKeysForProvider(p.id)
                        }
                      }}
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      {t('Thêm Key')}
                    </Button>
                  </div>
                </div>

                <AccordionContent className="pt-2 pb-4">
                  <div className="border-t pt-3">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                        <Key className="h-4 w-4 text-amber-500" />
                        {t('Danh sách API Keys ({count})', { count: keys.length })}
                      </div>
                    </div>

                    {isKeysLoading ? (
                      <div className="py-6 text-center">
                        <Spinner className="mx-auto h-5 w-5" />
                      </div>
                    ) : keys.length === 0 ? (
                      <div className="rounded-md border border-dashed p-4 text-center text-xs text-muted-foreground">
                        {t('Chưa có API Key nào cho nhà cung cấp này. Bấm "+ Thêm Key" để bổ sung.')}
                      </div>
                    ) : (
                      <div className="rounded-md border overflow-x-auto">
                        <Table className="min-w-[900px] table-fixed w-full">
                          <TableHeader>
                            <TableRow className="bg-slate-50 text-xs">
                              <TableHead className="w-[180px] px-3">{t('Tên Key / Ghi chú')}</TableHead>
                              <TableHead className="w-[170px] px-3">{t('Mã API Key')}</TableHead>
                              <TableHead className="w-[110px] px-3 text-center">{t('Ưu tiên')}</TableHead>
                              <TableHead className="w-[150px] px-3 text-center">{t('Sử dụng cuối')}</TableHead>
                              <TableHead className="w-[140px] px-3 text-center">{t('Trạng thái')}</TableHead>
                              <TableHead className="w-[150px] px-3 text-right">{t('Thao tác')}</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {keys.map((k) => (
                              <TableRow key={k.id} className="text-xs">
                                <TableCell className="font-medium truncate px-3" title={k.name || `Key #${k.id}`}>
                                  {k.name || `Key #${k.id}`}
                                </TableCell>
                                <TableCell className="font-mono text-xs text-slate-600 px-3">
                                  <span className="bg-slate-50 px-2 py-1 rounded border border-slate-200 inline-block my-1 truncate max-w-full">
                                    {k.maskedApiKey || t('API Key đã mã hóa')}
                                  </span>
                                </TableCell>
                                <TableCell className="text-center px-3">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setTargetProviderForKey(p)
                                      setSelectedKeyForEdit({ providerId: p.id, key: k })
                                      setKeyModalOpen(true)
                                    }}
                                    className="group inline-flex items-center gap-1 cursor-pointer focus:outline-hidden"
                                    title={t('Bấm để chỉnh sửa độ ưu tiên và thông tin API Key')}
                                  >
                                    <Badge
                                      variant="secondary"
                                      className="font-mono text-xs group-hover:bg-slate-200 dark:group-hover:bg-slate-700 transition-colors"
                                    >
                                      {t('Ưu tiên: {priority}', { priority: k.priority })}
                                      <Edit2 className="w-2.5 h-2.5 ml-1 opacity-0 group-hover:opacity-100 transition-opacity text-slate-500" />
                                    </Badge>
                                  </button>
                                </TableCell>
                                <TableCell className="text-center text-muted-foreground font-mono text-[11px] px-3 whitespace-nowrap">
                                  {formatDateStr(k.lastUsed)}
                                </TableCell>
                                <TableCell className="text-center px-3">
                                  <div className="flex flex-col items-center justify-center gap-1">
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
                                    {k.status === 'ACTIVE' && (k.cooldownExpiresAt || (k.cooldownRemainingSeconds && k.cooldownRemainingSeconds > 0)) && (
                                      <KeyCooldownBadge
                                        expiresAt={k.cooldownExpiresAt}
                                        initialSeconds={k.cooldownRemainingSeconds}
                                      />
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="text-right space-x-1 whitespace-nowrap px-3">
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
                                    {t('Verify')}
                                  </Button>

                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0 text-slate-600 hover:text-slate-900"
                                    title={t('Chỉnh sửa Key / Độ ưu tiên')}
                                    onClick={() => {
                                      setTargetProviderForKey(p)
                                      setSelectedKeyForEdit({ providerId: p.id, key: k })
                                      setKeyModalOpen(true)
                                    }}
                                  >
                                    <Edit2 className="h-3.5 w-3.5" />
                                  </Button>

                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0 text-red-500 hover:text-red-700"
                                    title={t('Xóa Key')}
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
        onOpenChange={(isOpen) => {
          setKeyModalOpen(isOpen)
          if (!isOpen) setSelectedKeyForEdit(null)
        }}
        providerName={targetProviderForKey?.name}
        initialData={selectedKeyForEdit?.key}
        onSubmit={handleSaveKey}
      />
    </div>
  )
}
