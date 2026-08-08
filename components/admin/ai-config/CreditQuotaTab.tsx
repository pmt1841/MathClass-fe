'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Save, Loader2, Plus, Pencil, Trash2, UserCog, ReceiptText, Coins } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
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
import { getCreditTaskLabel } from '@/lib/constants/credit'
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
  useAdminCreditTransactions,
} from '@/hooks/useAdminCredits'

const ROLE_LABELS: Record<string, string> = {
  STUDENT: 'Học sinh',
  TEACHER: 'Giáo viên',
}

/**
 * MAT-255: Tab quản trị Credit & Hạn mức AI.
 * Gồm: chi phí theo task, credit mặc định theo role, quản lý gói credit,
 * điều chỉnh credit thủ công và sổ cái giao dịch.
 */
export function CreditQuotaTab() {
  return (
    <div className="space-y-6">
      <CostPerTaskSection />
      <DefaultCreditsSection />
      <PackagesSection />
      <AdjustAndLedgerSection />
    </div>
  )
}

// ── 1. Chi phí credit theo task ──────────────────────────────────────────────
function CostPerTaskSection() {
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
      toast.success(`Đã lưu chi phí cho "${getCreditTaskLabel(task)}"`)
    } catch (e) {
      toast.error(handleApiError(e, 'Không thể lưu cấu hình chi phí.'))
    } finally {
      setSaving(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Coins className="h-5 w-5 text-amber-500" />
          Chi phí Credit theo Tác vụ AI
        </CardTitle>
        <CardDescription>
          Credit trừ theo token đầu ra của mỗi lượt gọi AI: 1 credit = N token (cột Token/credit), tối thiểu bằng phí cột đầu.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tác vụ AI</TableHead>
                <TableHead className="w-28">Phí tối thiểu</TableHead>
                <TableHead className="w-28">Token/credit</TableHead>
                <TableHead className="w-24">Áp dụng</TableHead>
                <TableHead className="w-28 text-right">Thao tác</TableHead>
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
                    <TableCell className="font-medium">{getCreditTaskLabel(config.task)}</TableCell>
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
                        Lưu
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}

// ── 2. Credit mặc định theo role ─────────────────────────────────────────────
function DefaultCreditsSection() {
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
      toast.success(`Đã lưu credit mặc định cho ${ROLE_LABELS[role] ?? role}`)
    } catch (e) {
      toast.error(handleApiError(e, 'Không thể lưu credit mặc định.'))
    } finally {
      setSaving(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCog className="h-5 w-5 text-blue-500" />
          Credit mặc định khi tạo tài khoản
        </CardTitle>
        <CardDescription>
          Số credit tự động cấp cho người dùng mới theo vai trò (tài khoản cũ được backfill khi khởi động).
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {(defaults || []).map((def) => {
              const value = drafts[def.role] ?? def.defaultCredits
              const dirty = value !== def.defaultCredits
              return (
                <div key={def.role} className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                  <p className="text-sm font-semibold text-slate-800">{ROLE_LABELS[def.role] ?? def.role}</p>
                  <div className="mt-3 flex items-center gap-2">
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
                      Lưu
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
        toast.success('Đã cập nhật gói credit')
      } else {
        await createMutation.mutateAsync(form)
        toast.success('Đã tạo gói credit mới')
      }
      setDialogOpen(false)
    } catch (e) {
      toast.error(handleApiError(e, 'Không thể lưu gói credit.'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (pkg: CreditPackage) => {
    if (typeof window !== 'undefined' && !window.confirm(`Xóa gói "${pkg.name}"?`)) return
    try {
      await deleteMutation.mutateAsync(pkg.id)
      toast.success('Đã xóa gói credit')
    } catch (e) {
      toast.error(handleApiError(e, 'Không thể xóa gói credit.'))
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-emerald-500" />
            Gói nạp Credit
          </CardTitle>
          <CardDescription>Người dùng chọn gói để nạp credit khi hết hạn mức.</CardDescription>
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus className="mr-1.5 h-4 w-4" /> Thêm gói
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên gói</TableHead>
                <TableHead className="w-24">Số credit</TableHead>
                <TableHead className="w-28">Giá</TableHead>
                <TableHead className="w-24">Trạng thái</TableHead>
                <TableHead className="w-28 text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(packages || []).map((pkg) => (
                <TableRow key={pkg.id}>
                  <TableCell className="font-medium">{pkg.name}</TableCell>
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
                      {pkg.enabled ? 'Đang bán' : 'Đã tắt'}
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
        )}
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Sửa gói credit' : 'Thêm gói credit'}</DialogTitle>
            <DialogDescription>
              Thiết lập tên, số credit, giá bán và trạng thái của gói.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Tên gói</Label>
              <Input
                value={form.name}
                placeholder="Ví dụ: Gói Cơ bản"
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Số credit</Label>
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
                <Label className="text-xs">Giá (VND)</Label>
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
              <Label className="text-xs">Đang bán</Label>
              <Switch
                checked={form.enabled}
                onCheckedChange={(val) => setForm((prev) => ({ ...prev, enabled: val }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Hủy
            </Button>
            <Button
              disabled={saving || !form.name.trim() || form.credits <= 0 || form.price <= 0}
              onClick={handleSave}
            >
              {saving ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
              Lưu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

// ── 4. Điều chỉnh credit & sổ cái giao dịch ──────────────────────────────────
function AdjustAndLedgerSection() {
  const adjustMutation = useAdjustCredit()
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [adjustForm, setAdjustForm] = useState({ userId: '', amount: '', reason: '' })
  const [adjusting, setAdjusting] = useState(false)

  const { data: transactions, isLoading: txLoading } = useAdminCreditTransactions({
    type: typeFilter === 'ALL' ? undefined : typeFilter,
  })

  const handleAdjust = async () => {
    const userId = parseInt(adjustForm.userId)
    const amount = parseInt(adjustForm.amount)
    if (Number.isNaN(userId) || Number.isNaN(amount) || amount === 0) return
    setAdjusting(true)
    try {
      await adjustMutation.mutateAsync({
        userId,
        amount,
        reason: adjustForm.reason.trim() || undefined,
      })
      toast.success(`Đã điều chỉnh ${amount >= 0 ? '+' : ''}${amount} credit cho user #${userId}`)
      setAdjustForm({ userId: '', amount: '', reason: '' })
    } catch (e) {
      toast.error(handleApiError(e, 'Không thể điều chỉnh credit.'))
    } finally {
      setAdjusting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ReceiptText className="h-5 w-5 text-slate-500" />
          Điều chỉnh Credit & Sổ cái giao dịch
        </CardTitle>
        <CardDescription>
          Admin cộng/trừ credit thủ công cho người dùng (ví dụ hoàn tiền lỗi hệ thống) và tra cứu sổ cái.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Form điều chỉnh */}
        <div className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4 sm:grid-cols-4">
          <div className="space-y-1.5">
            <Label className="text-xs">User ID</Label>
            <Input
              type="number"
              placeholder="123"
              value={adjustForm.userId}
              onChange={(e) => setAdjustForm((prev) => ({ ...prev, userId: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Số credit (+/-)</Label>
            <Input
              type="number"
              placeholder="100 hoặc -50"
              value={adjustForm.amount}
              onChange={(e) => setAdjustForm((prev) => ({ ...prev, amount: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Lý do</Label>
            <Input
              placeholder="Hoàn tiền lỗi hệ thống"
              value={adjustForm.reason}
              onChange={(e) => setAdjustForm((prev) => ({ ...prev, reason: e.target.value }))}
            />
          </div>
          <div className="flex items-end">
            <Button
              className="w-full"
              disabled={adjusting || !adjustForm.userId || !adjustForm.amount}
              onClick={handleAdjust}
            >
              {adjusting ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
              Điều chỉnh
            </Button>
          </div>
        </div>

        {/* Bộ lọc + sổ cái */}
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-800">Sổ cái giao dịch</p>
          <div className="w-44">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Lọc theo loại" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tất cả loại</SelectItem>
                <SelectItem value="GRANT_DEFAULT">Cấp mặc định</SelectItem>
                <SelectItem value="PURCHASE">Nạp credit</SelectItem>
                <SelectItem value="ADMIN_ADJUST">Điều chỉnh</SelectItem>
                <SelectItem value="CONSUME">Tiêu thụ</SelectItem>
                <SelectItem value="REFUND">Hoàn lại</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {txLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
          </div>
        ) : (transactions || []).length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">Chưa có giao dịch nào.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User ID</TableHead>
                <TableHead>Thời gian</TableHead>
                <TableHead>Loại</TableHead>
                <TableHead>Nội dung</TableHead>
                <TableHead className="text-right">Số credit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(transactions || []).map((txn) => (
                <TableRow key={txn.id}>
                  <TableCell className="font-mono text-xs">#{txn.userId}</TableCell>
                  <TableCell className="text-xs text-slate-500">
                    {new Date(txn.createdAt).toLocaleString('vi-VN')}
                  </TableCell>
                  <TableCell>
                    <Badge className="bg-slate-100 text-slate-700">{txn.type}</Badge>
                  </TableCell>
                  <TableCell className="text-xs text-slate-600">
                    {txn.description || (txn.task ? getCreditTaskLabel(txn.task) : '') || '—'}
                  </TableCell>
                  <TableCell
                    className={`text-right font-bold ${
                      (txn.amount ?? 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {(txn.amount ?? 0) >= 0 ? '+' : ''}
                    {txn.amount}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}


