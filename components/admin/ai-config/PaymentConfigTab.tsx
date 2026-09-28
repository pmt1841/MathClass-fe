'use client'

import { useState, useEffect } from 'react'
import {
  Building2,
  Save,
  Eye,
  EyeOff,
  ShieldCheck,
  HelpCircle,
  QrCode,
} from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  useAdminPaymentConfig,
  useUpdatePaymentConfig,
  useTogglePaymentActive,
} from '@/hooks/usePaymentConfig'
import { handleApiError } from '@/lib/utils/error-handler'

const POPULAR_BANKS = [
  { code: 'MB', name: 'MBBank (Quân Đội)' },
  { code: 'VCB', name: 'Vietcombank' },
  { code: 'ICB', name: 'VietinBank' },
  { code: 'TCB', name: 'Techcombank' },
  { code: 'ACB', name: 'ACB (Á Châu)' },
  { code: 'VPB', name: 'VPBank' },
  { code: 'BIDV', name: 'BIDV' },
  { code: 'TPB', name: 'TPBank' },
  { code: 'STB', name: 'Sacombank' },
  { code: 'HDB', name: 'HDBank' },
  { code: 'MSB', name: 'MSB (Hàng Hải)' },
]

export function PaymentConfigTab() {
  const { data: config, isLoading } = useAdminPaymentConfig()
  const updateMutation = useUpdatePaymentConfig()
  const toggleMutation = useTogglePaymentActive()

  const [bankCode, setBankCode] = useState('MB')
  const [accountNumber, setAccountNumber] = useState('')
  const [accountHolderName, setAccountHolderName] = useState('')
  const [transferSyntaxPrefix, setTransferSyntaxPrefix] = useState('MAT')
  const [sepayApiKey, setSepayApiKey] = useState('')
  const [qrTemplate, setQrTemplate] = useState('compact2')
  const [isActive, setIsActive] = useState(true)
  const [showApiKey, setShowApiKey] = useState(false)

  useEffect(() => {
    if (config) {
      setBankCode(config.bankCode || 'MB')
      setAccountNumber(config.accountNumber || '')
      setAccountHolderName(config.accountHolderName || '')
      setTransferSyntaxPrefix(config.transferSyntaxPrefix || 'MAT')
      setSepayApiKey(config.sepayApiKey || '')
      setQrTemplate(config.qrTemplate || 'compact2')
      setIsActive(config.isActive ?? true)
    }
  }, [config])

  const handleToggleActive = async (checked: boolean) => {
    setIsActive(checked)
    try {
      await toggleMutation.mutateAsync(checked)
      toast.success(
        checked
          ? 'Đã kích hoạt cổng thanh toán VietQR thành công!'
          : 'Đã tạm dừng cổng thanh toán VietQR thành công!'
      )
    } catch (e) {
      setIsActive(!checked)
      toast.error(handleApiError(e, 'Không thể cập nhật trạng thái VietQR lúc này.'))
    }
  }

  const handleSave = async () => {
    if (!bankCode.trim()) {
      toast.error('Vui lòng chọn ngân hàng')
      return
    }
    if (!accountNumber.trim()) {
      toast.error('Vui lòng nhập số tài khoản nhận tiền')
      return
    }
    if (!accountHolderName.trim()) {
      toast.error('Vui lòng nhập tên chủ tài khoản')
      return
    }

    const prefixTrimmed = transferSyntaxPrefix.trim().toUpperCase()
    if (!prefixTrimmed) {
      toast.error('Vui lòng nhập tiền tố cú pháp chuyển khoản')
      return
    }
    if (prefixTrimmed.length < 2 || prefixTrimmed.length > 10) {
      toast.error('Tiền tố cú pháp chuyển khoản phải có từ 2 đến 10 ký tự')
      return
    }
    if (!/^[A-Z][A-Z0-9]*$/.test(prefixTrimmed)) {
      toast.error('Tiền tố phải bắt đầu bằng chữ cái và chỉ chứa chữ cái hoặc số')
      return
    }
    const RESERVED_PREFIXES = ['REFUND', 'HOAN', 'HOANTIEN', 'DUP', 'TMP', 'SEPAY']
    if (RESERVED_PREFIXES.includes(prefixTrimmed)) {
      toast.error(`Tiền tố "${prefixTrimmed}" trùng với từ khóa hệ thống, vui lòng chọn tiền tố khác`)
      return
    }

    try {
      await updateMutation.mutateAsync({
        bankCode,
        accountNumber,
        accountHolderName,
        sepayApiKey,
        transferSyntaxPrefix: prefixTrimmed,
        qrTemplate,
        isActive,
      })
      toast.success('Đã lưu cấu hình thanh toán thành công!')
    } catch (e) {
      toast.error(handleApiError(e, 'Không thể cập nhật cấu hình thanh toán lúc này.'))
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Building2 className="h-5 w-5 text-violet-600" />
                Cấu hình Tài khoản Ngân hàng Nhận tiền (VietQR)
              </CardTitle>
              <CardDescription>
                Thiết lập thông tin tài khoản ngân hàng để tự động sinh mã VietQR khi người dùng nạp Credit.
              </CardDescription>
            </div>

            <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-900">
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Kích hoạt VietQR:
              </span>
              <Switch
                checked={isActive}
                disabled={toggleMutation.isPending}
                onCheckedChange={handleToggleActive}
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="bankCode">Ngân hàng thụ hưởng</Label>
              <Select value={bankCode} onValueChange={setBankCode}>
                <SelectTrigger id="bankCode">
                  <SelectValue placeholder="Chọn ngân hàng" />
                </SelectTrigger>
                <SelectContent>
                  {POPULAR_BANKS.map((b) => (
                    <SelectItem key={b.code} value={b.code}>
                      {b.code} - {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="accountNumber">Số tài khoản nhận tiền</Label>
              <Input
                id="accountNumber"
                placeholder="VD: 0348714099"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="accountHolderName">Tên chủ tài khoản (Không dấu)</Label>
              <Input
                id="accountHolderName"
                placeholder="VD: NGUYEN VAN A"
                value={accountHolderName}
                onChange={(e) => setAccountHolderName(e.target.value.toUpperCase())}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="transferSyntaxPrefix">Tiền tố cú pháp chuyển khoản (Prefix)</Label>
              <Input
                id="transferSyntaxPrefix"
                placeholder="VD: MAT"
                maxLength={10}
                value={transferSyntaxPrefix}
                onChange={(e) => setTransferSyntaxPrefix(e.target.value.toUpperCase())}
              />
              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                Từ 2-10 ký tự, bắt đầu bằng chữ cái (VD: MAT, MC, MATH)
              </span>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="qrTemplate">Kiểu hiển thị VietQR</Label>
              <Select value={qrTemplate} onValueChange={setQrTemplate}>
                <SelectTrigger id="qrTemplate">
                  <SelectValue placeholder="Chọn mẫu QR" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="compact2">compact2 (Khuyên dùng - Chuẩn thẻ kèm logo)</SelectItem>
                  <SelectItem value="compact">compact (Nhỏ gọn)</SelectItem>
                  <SelectItem value="qr_only">qr_only (Chỉ mã QR)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-lg border border-violet-100 bg-violet-50/60 p-3 dark:border-violet-900/50 dark:bg-violet-950/20 sm:col-span-2">
              <span className="text-xs font-semibold text-violet-900 dark:text-violet-200 block mb-0.5">
                💡 Cú pháp chuyển khoản tự động
              </span>
              <p className="text-[11px] text-violet-700 dark:text-violet-300">
                Hệ thống tự động kết hợp tiền tố cấu hình với mã đơn hàng duy nhất (Ví dụ: <strong>{transferSyntaxPrefix || 'MAT'} 2609280001</strong>). Cú pháp này được điền sẵn vào mã VietQR giúp hệ thống SePay nhận diện và cộng Credit tức thì cho học sinh.
              </p>
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              onClick={handleSave}
              disabled={updateMutation.isPending}
              className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white"
            >
              <Save className="h-4 w-4" />
              {updateMutation.isPending ? 'Đang lưu...' : 'Lưu thông tin ngân hàng'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
            Tích hợp Webhook Biến động Số dư (SePay)
          </CardTitle>
          <CardDescription>
            Kết nối với dịch vụ SePay (sepay.vn) để tự động nhận thông báo khi có tiền vào và cộng Credit ngay lập tức.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="sepayApiKey" className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span>SePay API Key (Secret Token)</span>
                {config?.hasSepayApiKey && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800">
                    <ShieldCheck className="h-3 w-3" />
                    Đã mã hóa AES-256 trong Database
                  </span>
                )}
              </div>
              <span className="text-[11px] text-slate-400">Dùng để xác thực request gửi từ Webhook</span>
            </Label>
            <div className="relative">
              <Input
                id="sepayApiKey"
                type={showApiKey ? 'text' : 'password'}
                placeholder={config?.hasSepayApiKey ? 'Nhập API Key mới nếu muốn thay đổi...' : 'Nhập API Key do SePay cấp...'}
                value={sepayApiKey}
                onChange={(e) => setSepayApiKey(e.target.value)}
                className="pr-10 font-mono text-sm"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 text-slate-400 hover:text-slate-700"
                onClick={() => setShowApiKey(!showApiKey)}
                title={showApiKey ? 'Ẩn chuỗi mã hóa' : 'Xem chuỗi mã hóa'}
              >
                {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              🔒 Chuỗi hiển thị đã được che mờ (masking) để bảo vệ Secret Token. Để thay đổi, vui lòng nhập key mới và bấm <strong>Lưu thông tin ngân hàng</strong>.
            </p>
          </div>

          <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 text-xs text-blue-900 dark:border-blue-900/40 dark:bg-blue-950/20 dark:text-blue-300 space-y-2">
            <div className="flex items-center gap-2 font-semibold">
              <HelpCircle className="h-4 w-4 text-blue-600" />
              Hướng dẫn cấu hình trên trang quản trị SePay (sepay.vn):
            </div>
            <ul className="list-disc pl-5 space-y-1 text-slate-600 dark:text-slate-400">
              <li>
                <strong>Webhook URL:</strong> <code className="rounded bg-blue-100 px-1 py-0.5 font-mono text-blue-800 dark:bg-blue-900 dark:text-blue-200">https://&lt;domain-backend&gt;/api/v1/payment/webhook/sepay</code>
              </li>
              <li>
                <strong>Phương thức:</strong> POST, Kiểu dữ liệu: JSON.
              </li>
              <li>
                <strong>Authorization Header:</strong> Chọn Apikey và dán đúng chuỗi token phía trên vào ô cấu hình Webhook trên SePay.
              </li>
            </ul>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              onClick={handleSave}
              disabled={updateMutation.isPending}
              className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-xs h-9"
            >
              <Save className="h-4 w-4" />
              {updateMutation.isPending ? 'Đang lưu...' : 'Lưu cấu hình'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
