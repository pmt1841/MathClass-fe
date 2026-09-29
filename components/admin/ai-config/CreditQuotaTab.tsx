'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import {
  Save,
  Loader2,
  Plus,
  Pencil,
  Trash2,
  UserCog,
  ReceiptText,
  Coins,
  ChevronLeft,
  ChevronRight,
  Search,
  ChevronsUpDown,
  Check,
  X,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RefreshButton } from '@/components/ui/refresh-button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover'
import { useAdminUsers } from '@/hooks/useAdmin'
import { useDebounce } from '@/hooks/useDebounce'
import { AdminUser } from '@/types'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { handleApiError } from '@/lib/utils/error-handler'
import { cn, formatDateTime } from '@/lib/utils'
import { getCreditTaskLabel, formatCreditTransactionDescription } from '@/lib/constants/credit'
import { formatVnd } from '@/components/credits/credit-packages-section'
import { CreditPackage } from '@/services/creditService'
import {
  useAdminTaskCreditConfigs,
  useUpdateTaskCreditConfig,
  useAdminDefaultCredits,
  useUpdateDefaultCredits,
  useAdminPackages,
  useCreateCreditPackage,
  useUpdateCreditPackage,
  useDeleteCreditPackage,
  useAdjustCredit,
  useBatchAdjustCredit,
  useAdminCreditTransactions,
} from '@/hooks/useAdminCredits'
import { useI18n } from '@/lib/i18n/i18n-context'

const ROLE_LABELS: Record<string, string> = {
  STUDENT: 'Học sinh',
  TEACHER: 'Giáo viên',
  ADMIN: 'Quản trị viên',
}

/**
 * MAT-255: Tab quản trị Credit & Hạn mức AI.
 * Gồm: chi phí theo task, credit mặc định theo role, quản lý gói credit,
 * điều chỉnh credit thủ công và sổ cái giao dịch.
 */
export function CreditQuotaTab() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <CostPerTaskSection />
      <DefaultCreditsSection />
      <PackagesSection />
      <AdjustAndLedgerSection />
    </div>
  )
}

// ── 1. Chi phí credit theo task ──────────────────────────────────────────────
function CostPerTaskSection() {
  const { t } = useI18n()
  const { data: configs, isLoading } = useAdminTaskCreditConfigs()
  const updateMutation = useUpdateTaskCreditConfig()
  const [drafts, setDrafts] = useState<
    Record<string, { costPerCall: number; tokensPerCredit: number; enabled: boolean }>
  >({})
  const [saving, setSaving] = useState<string | null>(null)

  const draftFor = (
    task: string,
    costPerCall: number,
    tokensPerCredit: number | null | undefined,
    enabled: boolean
  ) => drafts[task] ?? { costPerCall, tokensPerCredit: tokensPerCredit ?? 0, enabled }

  const handleSave = async (
    task: string,
    costPerCall: number,
    tokensPerCredit: number,
    enabled: boolean
  ) => {
    setSaving(task)
    try {
      await updateMutation.mutateAsync({
        task,
        data: {
          costPerCall,
          tokensPerCredit: tokensPerCredit > 0 ? tokensPerCredit : null,
          enabled,
        },
      })
      setDrafts((prev) => {
        const next = { ...prev }
        delete next[task]
        return next
      })
      toast.success(t('Đã lưu chi phí cho "{task}"', { task: getCreditTaskLabel(task, t) }))
    } catch (e) {
      toast.error(handleApiError(e, t('Không thể lưu cấu hình chi phí.')))
    } finally {
      setSaving(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base sm:text-lg flex items-center gap-2">
          <Coins className="h-5 w-5 text-amber-500 shrink-0" />
          {t('Chi phí Credit theo Tác vụ AI')}
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          {t('Credit trừ theo tổng token (bao gồm prompt người dùng nhập + token đầu ra do AI sinh): 1 credit = N token (cột Token/credit), tối thiểu bằng phí cột đầu.')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table className="min-w-[580px]">
              <TableHeader>
                <TableRow>
                  <TableHead>{t('Tác vụ AI')}</TableHead>
                  <TableHead className="w-28">{t('Phí tối thiểu')}</TableHead>
                  <TableHead className="w-28">{t('Token/credit')}</TableHead>
                  <TableHead className="w-24">{t('Áp dụng')}</TableHead>
                  <TableHead className="w-28 text-right">{t('Thao tác')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(configs || []).map((config) => {
                  const draft = draftFor(config.task, config.costPerCall, config.tokensPerCredit, config.enabled)
                  const dirty =
                    draft.costPerCall !== config.costPerCall ||
                    draft.tokensPerCredit !== (config.tokensPerCredit ?? 0) ||
                    draft.enabled !== config.enabled
                  return (
                    <TableRow key={config.task}>
                      <TableCell className="font-medium">{getCreditTaskLabel(config.task, t)}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={0}
                          className="h-9 w-24 font-mono"
                          value={draft.costPerCall}
                          onChange={(e) =>
                            setDrafts((prev) => ({
                              ...prev,
                              [config.task]: {
                                ...draft,
                                costPerCall: Math.max(0, parseInt(e.target.value) || 0),
                              },
                            }))
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={0}
                          placeholder="1000"
                          className="h-9 w-24 font-mono"
                          value={draft.tokensPerCredit > 0 ? draft.tokensPerCredit : ''}
                          onChange={(e) =>
                            setDrafts((prev) => ({
                              ...prev,
                              [config.task]: {
                                ...draft,
                                tokensPerCredit: Math.max(0, parseInt(e.target.value) || 0),
                              },
                            }))
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={draft.enabled}
                          onCheckedChange={(val) =>
                            setDrafts((prev) => ({ ...prev, [config.task]: { ...draft, enabled: val } }))
                          }
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={!dirty || saving === config.task}
                          onClick={() =>
                            handleSave(config.task, draft.costPerCall, draft.tokensPerCredit, draft.enabled)
                          }
                        >
                          {saving === config.task ? (
                            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Save className="mr-1.5 h-3.5 w-3.5" />
                          )}
                          {t('Lưu')}
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ── 2. Credit mặc định theo role ─────────────────────────────────────────────
function DefaultCreditsSection() {
  const { t } = useI18n()
  const { data: defaults, isLoading } = useAdminDefaultCredits()
  const updateMutation = useUpdateDefaultCredits()
  const [drafts, setDrafts] = useState<Record<string, number>>({})
  const [saving, setSaving] = useState<string | null>(null)

  const handleSave = async (role: string, defaultCredits: number) => {
    setSaving(role)
    try {
      await updateMutation.mutateAsync({ role, defaultCredits })
      setDrafts((prev) => {
        const next = { ...prev }
        delete next[role]
        return next
      })
      toast.success(t('Đã lưu credit mặc định cho {role}', { role: t(ROLE_LABELS[role] ?? role) }))
    } catch (e) {
      toast.error(handleApiError(e, t('Không thể lưu credit mặc định.')))
    } finally {
      setSaving(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base sm:text-lg flex items-center gap-2">
          <UserCog className="h-5 w-5 text-blue-500 shrink-0" />
          {t('Credit mặc định khi tạo tài khoản')}
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          {t('Số credit tự động cấp cho người dùng mới theo vai trò (tài khoản cũ được backfill khi khởi động).')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
            {(defaults || []).map((def) => {
              const value = drafts[def.role] ?? def.defaultCredits
              const dirty = value !== def.defaultCredits
              return (
                <div key={def.role} className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                  <p className="text-sm font-semibold text-slate-800">{t(ROLE_LABELS[def.role] ?? def.role)}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Input
                      type="number"
                      min={0}
                      className="h-9 w-28 font-mono"
                      value={value}
                      onChange={(e) =>
                        setDrafts((prev) => ({
                          ...prev,
                          [def.role]: Math.max(0, parseInt(e.target.value) || 0),
                        }))
                      }
                    />
                    <span className="text-xs text-slate-400">credit</span>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!dirty || saving === def.role}
                      onClick={() => handleSave(def.role, value)}
                    >
                      {saving === def.role ? (
                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Save className="mr-1.5 h-3.5 w-3.5" />
                      )}
                      {t('Lưu')}
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ── 3. Quản lý gói credit ────────────────────────────────────────────────────
function PackagesSection() {
  const { t } = useI18n()
  const { data: packages, isLoading } = useAdminPackages()
  const createMutation = useCreateCreditPackage()
  const updateMutation = useUpdateCreditPackage()
  const deleteMutation = useDeleteCreditPackage()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<CreditPackage | null>(null)
  const [form, setForm] = useState({
    name: '',
    credits: 100,
    price: 20000,
    enabled: true,
    sortOrder: 0,
  })
  const [saving, setSaving] = useState(false)

  const openCreate = () => {
    setEditing(null)
    setForm({ name: '', credits: 100, price: 20000, enabled: true, sortOrder: 0 })
    setDialogOpen(true)
  }

  const openEdit = (pkg: CreditPackage) => {
    setEditing(pkg)
    setForm({
      name: pkg.name,
      credits: pkg.credits,
      price: pkg.price,
      enabled: pkg.enabled,
      sortOrder: pkg.sortOrder,
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.name.trim() || form.credits <= 0 || form.price <= 0) return
    setSaving(true)
    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, data: form })
        toast.success(t('Đã cập nhật gói credit'))
      } else {
        await createMutation.mutateAsync(form)
        toast.success(t('Đã tạo gói credit mới'))
      }
      setDialogOpen(false)
    } catch (e) {
      toast.error(handleApiError(e, t('Không thể lưu gói credit.')))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (pkg: CreditPackage) => {
    if (typeof window !== 'undefined' && !window.confirm(t('Xóa gói "{name}"?', { name: pkg.name }))) return
    try {
      await deleteMutation.mutateAsync(pkg.id)
      toast.success(t('Đã xóa gói credit'))
    } catch (e) {
      toast.error(handleApiError(e, t('Không thể xóa gói credit.')))
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <Coins className="h-5 w-5 text-emerald-500 shrink-0" />
            {t('Gói nạp Credit')}
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            {t('Người dùng chọn gói để nạp credit khi hết hạn mức.')}
          </CardDescription>
        </div>
        <Button size="sm" className="w-full sm:w-auto" onClick={openCreate}>
          <Plus className="mr-1.5 h-4 w-4" /> {t('Thêm gói')}
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table className="min-w-[520px]">
              <TableHeader>
                <TableRow>
                  <TableHead>{t('Tên gói')}</TableHead>
                  <TableHead className="w-24">{t('Số credit')}</TableHead>
                  <TableHead className="w-28">{t('Giá')}</TableHead>
                  <TableHead className="w-24">{t('Trạng thái')}</TableHead>
                  <TableHead className="w-28 text-right">{t('Thao tác')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(packages || []).map((pkg) => (
                  <TableRow key={pkg.id}>
                    <TableCell className="font-medium">{t(pkg.name)}</TableCell>
                    <TableCell>{pkg.credits}</TableCell>
                    <TableCell>{formatVnd(pkg.price)}</TableCell>
                    <TableCell>
                      <Badge
                        className={
                          pkg.enabled
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-100 text-slate-500'
                        }
                      >
                        {pkg.enabled ? t('Đang bán') : t('Đã tắt')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1.5">
                        <Button size="sm" variant="ghost" onClick={() => openEdit(pkg)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-rose-600" onClick={() => handleDelete(pkg)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>{editing ? t('Sửa gói credit') : t('Thêm gói credit')}</DialogTitle>
            <DialogDescription>
              {t('Thiết lập tên, số credit, giá bán và trạng thái của gói.')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">{t('Tên gói')}</Label>
              <Input
                value={form.name}
                placeholder={t('Ví dụ: Gói Cơ bản')}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">{t('Số credit')}</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.credits}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, credits: parseInt(e.target.value) || 0 }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{t('Giá (VND)')}</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.price}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, price: parseInt(e.target.value) || 0 }))
                  }
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-xs">{t('Đang bán')}</Label>
              <Switch
                checked={form.enabled}
                onCheckedChange={(val) => setForm((prev) => ({ ...prev, enabled: val }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {t('Hủy')}
            </Button>
            <Button
              disabled={saving || !form.name.trim() || form.credits <= 0 || form.price <= 0}
              onClick={handleSave}
            >
              {saving ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
              {t('Lưu')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

// ── 4. Điều chỉnh credit & sổ cái giao dịch ──────────────────────────────────
const TRANSACTION_TYPE_CONFIG: Record<
  string,
  { label: string; className: string }
> = {
  GRANT_DEFAULT: {
    label: 'Cấp mặc định',
    className: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  },
  PURCHASE: {
    label: 'Nạp credit',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  ADMIN_ADJUST: {
    label: 'Điều chỉnh',
    className: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  CONSUME: {
    label: 'Tiêu thụ',
    className: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  REFUND: {
    label: 'Hoàn lại',
    className: 'bg-purple-50 text-purple-700 border-purple-200',
  },
}

function TransactionTypeBadge({ type }: { type: string }) {
  const { t } = useI18n()
  const config = TRANSACTION_TYPE_CONFIG[type]
  return (
    <Badge
      variant="outline"
      className={cn(
        'text-[11px] font-medium whitespace-nowrap',
        config?.className ?? 'bg-slate-50 text-slate-700 border-slate-200'
      )}
    >
      {t(config?.label ?? type)}
    </Badge>
  )
}

function UserRoleBadge({ role }: { role?: string | null }) {
  const { t } = useI18n()
  if (!role) return <span className="text-slate-400 text-xs">—</span>
  const styles: Record<string, string> = {
    ADMIN: 'bg-red-50 text-red-700 border-red-200',
    TEACHER: 'bg-blue-50 text-blue-700 border-blue-200',
    STUDENT: 'bg-orange-50 text-orange-700 border-orange-200',
  }
  const labels: Record<string, string> = {
    ADMIN: 'Quản trị viên',
    TEACHER: 'Giáo viên',
    STUDENT: 'Học sinh',
  }
  return (
    <Badge
      variant="outline"
      className={cn(
        'text-[11px] font-medium whitespace-nowrap',
        styles[role] ?? 'bg-slate-50 text-slate-700 border-slate-200'
      )}
    >
      {t(labels[role] ?? role)}
    </Badge>
  )
}

interface UserMultiSelectProps {
  values: AdminUser[]
  onChange: (users: AdminUser[]) => void
  disabled?: boolean
}

function UserMultiSelect({ values, onChange, disabled }: UserMultiSelectProps) {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)

  const isSearchActive = Boolean(search.trim())
  const hasDebouncedQuery = Boolean(debouncedSearch.trim())

  const { data, isLoading, isFetching } = useAdminUsers(
    0,
    undefined,
    undefined,
    debouncedSearch.trim() || undefined,
    50,
    { enabled: open },
    'ADMIN'
  )
  const users = data?.content || []

  const isSelected = (userId: number) => values.some((u) => u.id === userId)

  const handleToggle = (user: AdminUser) => {
    if (isSelected(user.id)) {
      onChange(values.filter((u) => u.id !== user.id))
    } else {
      onChange([...values, user])
    }
  }

  const handleSelectAllInResult = () => {
    const newUsers = users.filter((u) => !isSelected(u.id))
    onChange([...values, ...newUsers])
  }

  const handleClearAll = () => {
    onChange([])
  }

  return (
    <Popover
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen)
        if (!isOpen) setSearch('')
      }}
    >
      <PopoverTrigger asChild>
        <div className="relative w-full">
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={cn(
              'w-full justify-between h-9 px-3 text-xs font-normal border-slate-200 bg-white hover:bg-slate-50',
              values.length > 0 && 'pr-14',
              values.length === 0 && 'text-slate-400'
            )}
          >
            <span className="truncate text-left flex-1 mr-2">
              {values.length === 0 ? (
                t('Chọn người dùng (email)...')
              ) : values.length === 1 ? (
                <span className="font-medium text-slate-800">
                  {values[0].email}
                  {values[0].fullName ? ` (${values[0].fullName})` : ''}
                </span>
              ) : (
                <span className="font-medium text-indigo-700">
                  {t('Đã chọn {count} người dùng ({email}, ...)', { count: values.length, email: values[0].email })}
                </span>
              )}
            </span>
            <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
          </Button>
          {values.length > 0 && !disabled && (
            <button
              type="button"
              tabIndex={-1}
              onClick={(e) => {
                e.stopPropagation()
                handleClearAll()
              }}
              className="absolute right-8 top-1/2 -translate-y-1/2 rounded-full p-0.5 hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
              title={t('Bỏ chọn tất cả')}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-[340px] sm:w-[420px] p-0 shadow-lg border-slate-200" align="start">
        <div className="p-2 border-b border-slate-100 flex items-center gap-2 bg-slate-50/70">
          {isFetching ? (
            <Loader2 className="h-3.5 w-3.5 text-indigo-600 animate-spin shrink-0 ml-1" />
          ) : (
            <Search className="h-3.5 w-3.5 text-slate-400 shrink-0 ml-1" />
          )}
          <input
            className="w-full bg-transparent text-xs outline-none placeholder:text-slate-400 text-slate-800"
            placeholder={t('Tìm theo email hoặc họ tên')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="text-slate-400 hover:text-slate-600 mr-1 p-0.5 rounded"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Quick action bar */}
        {(values.length > 0 || (isSearchActive && users.length > 0)) && (
          <div className="flex items-center justify-between px-3 py-1.5 bg-slate-50 text-[11px] border-b border-slate-100 text-slate-500">
            <span>
              {t('Đã chọn:')} <strong className="text-indigo-600">{values.length}</strong>
            </span>
            <div className="flex items-center gap-2">
              {isSearchActive && users.length > 0 && (
                <button
                  type="button"
                  onClick={handleSelectAllInResult}
                  className="text-indigo-600 hover:text-indigo-800 font-medium hover:underline"
                >
                  {t('Chọn tất cả kết quả ({count})', { count: users.length })}
                </button>
              )}
              {values.length > 0 && (
                <>
                  {isSearchActive && users.length > 0 && <span className="text-slate-300">|</span>}
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="text-rose-600 hover:text-rose-800 font-medium hover:underline"
                  >
                    {t('Bỏ chọn tất cả')}
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        <div className="max-h-60 overflow-y-auto p-1 text-xs">
          {isLoading || (isSearchActive && !hasDebouncedQuery) || isFetching ? (
            <div className="flex items-center justify-center py-6 text-slate-500 gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
              <span>{t('Đang tìm kiếm...')}</span>
            </div>
          ) : users.length === 0 ? (
            <div className="py-6 text-center text-slate-400 text-xs">
              {t('Không tìm thấy người dùng nào phù hợp')}
            </div>
          ) : (
            <div className="space-y-0.5">
              {users.map((user) => {
                const selected = isSelected(user.id)
                return (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => handleToggle(user)}
                    className={cn(
                      'w-full flex items-center justify-between p-2 rounded-md text-left transition-colors',
                      selected
                        ? 'bg-indigo-50/90 text-indigo-950 font-medium'
                        : 'hover:bg-slate-100/80 text-slate-700'
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
                      <div
                        className={cn(
                          'h-4 w-4 rounded border flex items-center justify-center shrink-0 transition-colors',
                          selected
                            ? 'bg-indigo-600 border-indigo-600 text-white'
                            : 'border-slate-300 bg-white'
                        )}
                      >
                        {selected && <Check className="h-3 w-3 stroke-[3]" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium text-slate-900">{user.email}</div>
                        <div className="text-[11px] text-slate-500 truncate">
                          {user.fullName || t('Chưa cập nhật tên')}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <UserRoleBadge role={user.role} />
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

function AdjustAndLedgerSection() {
  const { t } = useI18n()
  const batchAdjustMutation = useBatchAdjustCredit()
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [selectedUsers, setSelectedUsers] = useState<AdminUser[]>([])
  const [amount, setAmount] = useState('')
  const [reasonPreset, setReasonPreset] = useState<'SYSTEM_REFUND' | 'OTHER'>('SYSTEM_REFUND')
  const [customReason, setCustomReason] = useState('')
  const [adjusting, setAdjusting] = useState(false)
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)

  const {
    data: pageData,
    isLoading: txLoading,
    isPlaceholderData,
    refetch: refetchTransactions,
    isFetching: txFetching,
  } = useAdminCreditTransactions({
    type: typeFilter === 'ALL' ? undefined : typeFilter,
    page,
    size: pageSize,
  })

  const handleTypeFilterChange = (val: string) => {
    setTypeFilter(val)
    setPage(0)
  }

  const handlePageSizeChange = (val: string) => {
    setPageSize(Number(val))
    setPage(0)
  }

  const transactions = pageData?.content || []
  const totalElements = pageData?.totalElements ?? 0
  const totalPages = pageData?.totalPages ?? 0

  const handleAdjust = async () => {
    if (selectedUsers.length === 0) {
      toast.error(t('Vui lòng chọn ít nhất một người dùng.'))
      return
    }
    const parsedAmount = parseInt(amount, 10)
    if (Number.isNaN(parsedAmount) || parsedAmount === 0) {
      toast.error(t('Số credit điều chỉnh phải khác 0.'))
      return
    }

    let finalReason = ''
    if (reasonPreset === 'SYSTEM_REFUND') {
      finalReason = t('Hoàn tiền do lỗi hệ thống')
    } else {
      if (!customReason.trim()) {
        toast.error(t('Vui lòng nhập lý do cụ thể.'))
        return
      }
      finalReason = customReason.trim()
    }

    setAdjusting(true)
    try {
      const res = await batchAdjustMutation.mutateAsync({
        userIds: selectedUsers.map((u) => u.id),
        amount: parsedAmount,
        reason: finalReason,
      })

      if (res.failureCount === 0) {
        toast.success(
          t('Đã điều chỉnh {amount} credit cho {count} người dùng.', {
            amount: `${parsedAmount >= 0 ? '+' : ''}${parsedAmount}`,
            count: res.successCount,
          })
        )
      } else if (res.successCount > 0) {
        toast.warning(
          t('Thành công {success} người dùng, thất bại {fail} người dùng.', {
            success: res.successCount,
            fail: res.failureCount,
          })
        )
      } else {
        toast.error(res.message || t('Điều chỉnh thất bại cho tất cả người dùng.'))
      }

      setSelectedUsers([])
      setAmount('')
      setCustomReason('')
      setReasonPreset('SYSTEM_REFUND')
      refetchTransactions()
    } catch (e) {
      toast.error(handleApiError(e, t('Không thể điều chỉnh credit.')))
    } finally {
      setAdjusting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base sm:text-lg flex items-center gap-2">
          <ReceiptText className="h-5 w-5 text-slate-500 shrink-0" />
          {t('Điều chỉnh Credit & Sổ cái giao dịch')}
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          {t('Admin cộng/trừ credit thủ công cho một hoặc nhiều người dùng cùng lúc (ví dụ hoàn tiền lỗi hệ thống) và tra cứu sổ cái.')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Form điều chỉnh */}
        <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3 sm:p-4">
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5">
              <Label className="text-xs">{t('Người dùng (chọn nhiều)')}</Label>
              <UserMultiSelect
                values={selectedUsers}
                onChange={setSelectedUsers}
                disabled={adjusting}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{t('Số credit (+/-)')}</Label>
              <Input
                type="number"
                placeholder={t('100 hoặc -50')}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={adjusting}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{t('Lý do điều chỉnh')}</Label>
              <Select
                value={reasonPreset}
                onValueChange={(val: 'SYSTEM_REFUND' | 'OTHER') => setReasonPreset(val)}
                disabled={adjusting}
              >
                <SelectTrigger className="h-9 text-xs bg-white">
                  <SelectValue placeholder={t('Chọn lý do')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SYSTEM_REFUND">{t('Hoàn tiền do lỗi hệ thống')}</SelectItem>
                  <SelectItem value="OTHER">{t('Lý do khác')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                className="w-full"
                disabled={adjusting || selectedUsers.length === 0 || !amount}
                onClick={handleAdjust}
              >
                {adjusting ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
                {t('Điều chỉnh')} {selectedUsers.length > 0 ? `(${selectedUsers.length})` : ''}
              </Button>
            </div>
          </div>

          {/* Ô nhập khi chọn "Lý do khác" */}
          {reasonPreset === 'OTHER' && (
            <div className="pt-1 space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
              <Label className="text-xs text-slate-700">
                {t('Lý do cụ thể')} <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder={t('Nhập chi tiết lý do điều chỉnh credit (ví dụ: Thu bù credit, thưởng sự kiện...)')}
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                disabled={adjusting}
                className="bg-white"
                autoFocus
              />
            </div>
          )}

          {/* Danh sách chip các user đã chọn */}
          {selectedUsers.length > 0 && (
            <div className="pt-1 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-600">
                  {t('Người dùng đã chọn ({count}):', { count: selectedUsers.length })}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedUsers([])}
                  disabled={adjusting}
                  className="text-[11px] text-rose-600 hover:text-rose-800 hover:underline"
                >
                  {t('Xóa tất cả')}
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-2 bg-white rounded-lg border border-slate-200 shadow-inner">
                {selectedUsers.map((u) => (
                  <Badge
                    key={u.id}
                    variant="secondary"
                    className="pl-2 pr-1 py-0.5 text-xs font-normal bg-slate-50 text-slate-800 border border-slate-200 shadow-sm flex items-center gap-1 hover:bg-slate-100"
                  >
                    <span className="truncate max-w-[200px]">
                      {u.email}
                      {u.fullName ? ` (${u.fullName})` : ''}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedUsers((prev) => prev.filter((item) => item.id !== u.id))}
                      disabled={adjusting}
                      className="rounded-full p-0.5 hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors"
                      title={t('Bỏ chọn {email}', { email: u.email })}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bộ lọc + sổ cái */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-sm font-semibold text-slate-800">{t('Sổ cái giao dịch')}</p>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="w-full sm:w-44">
              <Select value={typeFilter} onValueChange={handleTypeFilterChange}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder={t('Lọc theo loại')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">{t('Tất cả loại')}</SelectItem>
                  <SelectItem value="GRANT_DEFAULT">{t('Cấp mặc định')}</SelectItem>
                  <SelectItem value="PURCHASE">{t('Nạp credit')}</SelectItem>
                  <SelectItem value="ADMIN_ADJUST">{t('Điều chỉnh')}</SelectItem>
                  <SelectItem value="CONSUME">{t('Tiêu thụ')}</SelectItem>
                  <SelectItem value="REFUND">{t('Hoàn lại')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <RefreshButton
              onClick={() => refetchTransactions()}
              title={t('Làm mới sổ cái giao dịch')}
            />
          </div>
        </div>

        {txLoading && !pageData ? (
          <div className="space-y-2">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
          </div>
        ) : totalElements === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">{t('Chưa có giao dịch nào.')}</p>
        ) : (
          <div className="space-y-4">
            <div
              className={cn(
                'overflow-x-auto transition-opacity duration-200',
                isPlaceholderData && 'opacity-50 pointer-events-none'
              )}
            >
              <Table className="min-w-[700px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-14 text-center">{t('STT')}</TableHead>
                    <TableHead>{t('Email')}</TableHead>
                    <TableHead className="w-28">{t('Vai trò')}</TableHead>
                    <TableHead className="w-36">{t('Thời gian')}</TableHead>
                    <TableHead className="w-32">{t('Loại')}</TableHead>
                    <TableHead>{t('Nội dung')}</TableHead>
                    <TableHead className="w-28 text-right">{t('Số credit')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((txn, index) => {
                    const stt = page * pageSize + index + 1
                    const email = txn.userEmail || txn.email || '—'
                    const role = txn.userRole || txn.role
                    return (
                      <TableRow key={txn.id}>
                        <TableCell className="text-center font-mono text-xs text-slate-500">
                          {stt}
                        </TableCell>
                        <TableCell className="text-xs font-medium text-slate-800">
                          {email}
                        </TableCell>
                        <TableCell>
                          <UserRoleBadge role={role} />
                        </TableCell>
                        <TableCell className="text-xs text-slate-500 whitespace-nowrap">
                          {formatDateTime(txn.createdAt)}
                        </TableCell>
                        <TableCell>
                          <TransactionTypeBadge type={txn.type} />
                        </TableCell>
                        <TableCell
                          className="text-xs text-slate-600 max-w-[240px] truncate"
                          title={formatCreditTransactionDescription(txn.description, txn.task, t)}
                        >
                          {formatCreditTransactionDescription(txn.description, txn.task, t)}
                        </TableCell>
                        <TableCell
                          className={`text-right font-bold text-xs whitespace-nowrap ${(txn.amount ?? 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'
                            }`}
                        >
                          {(txn.amount ?? 0) >= 0 ? '+' : ''}
                          {txn.amount}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Phân trang */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span>
                  {t('Hiển thị Trang')} <span className="font-semibold text-slate-700">{page + 1}</span> / {Math.max(1, totalPages)} ({t('Tổng số')} <span className="font-semibold text-slate-700">{totalElements}</span> {t('giao dịch')})
                </span>
                <div className="flex items-center gap-1.5">
                  <span>{t('Số dòng/trang:')}</span>
                  <Select value={String(pageSize)} onValueChange={handlePageSizeChange}>
                    <SelectTrigger className="h-7 w-[65px] text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-2.5 text-xs gap-1"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page <= 0}
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  <span>{t('Trước')}</span>
                </Button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => p === 1 || p === totalPages || Math.abs(p - 1 - page) <= 1)
                    .reduce<(number | string)[]>((acc, p, idx, arr) => {
                      if (idx > 0 && p - (arr[idx - 1] as number) > 1) {
                        acc.push('...')
                      }
                      acc.push(p)
                      return acc
                    }, [])
                    .map((p, idx) =>
                      typeof p === 'string' ? (
                        <span key={`ellipsis-${idx}`} className="px-1 text-xs text-slate-400">
                          ...
                        </span>
                      ) : (
                        <Button
                          key={p}
                          variant={page === p - 1 ? 'default' : 'outline'}
                          size="sm"
                          className={`h-8 w-8 p-0 text-xs ${page === p - 1 ? 'bg-slate-900 text-white hover:bg-slate-800' : ''
                            }`}
                          onClick={() => setPage(p - 1)}
                        >
                          {p}
                        </Button>
                      )
                    )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-2.5 text-xs gap-1"
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1 || totalPages <= 1}
                >
                  <span>{t('Sau')}</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}


