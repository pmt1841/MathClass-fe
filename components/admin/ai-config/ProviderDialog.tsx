'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PasswordInput } from '@/components/ui/password-input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import {
  AiProvider,
  ProviderProtocol,
  ProviderCreateRequest,
  ProviderUpdateRequest,
} from '@/services/aiConfigService'
import { useToast } from '@/components/ui/use-toast'
import { useI18n } from '@/lib/i18n/i18n-context'

interface ProviderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  provider?: AiProvider | null
  onSubmitCreate: (data: ProviderCreateRequest) => Promise<void>
  onSubmitUpdate: (id: number, data: ProviderUpdateRequest) => Promise<void>
}

export function ProviderDialog({
  open,
  onOpenChange,
  provider,
  onSubmitCreate,
  onSubmitUpdate,
}: ProviderDialogProps) {
  const { t } = useI18n()
  const { toast } = useToast()
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [baseUrl, setBaseUrl] = useState('')
  const [protocol, setProtocol] = useState<ProviderProtocol | ''>('')
  const [authHeaderName, setAuthHeaderName] = useState('')
  const [authHeaderPrefix, setAuthHeaderPrefix] = useState('')
  const [authQueryParam, setAuthQueryParam] = useState('')
  const [healthCheckPath, setHealthCheckPath] = useState('')
  const [strategy, setStrategy] = useState<'PRIORITY' | 'ROUND_ROBIN'>('PRIORITY')
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE')
  const [apiKey, setApiKey] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const isEdit = !!provider

  useEffect(() => {
    if (provider) {
      setCode(provider.code)
      setName(provider.name)
      setBaseUrl(provider.baseUrl)
      setProtocol(provider.protocol || 'OPENAI_COMPATIBLE')
      setAuthHeaderName(provider.authHeaderName || '')
      setAuthHeaderPrefix(provider.authHeaderPrefix || '')
      setAuthQueryParam(provider.authQueryParam || '')
      setHealthCheckPath(provider.healthCheckPath || '')
      setStrategy(provider.strategy)
      setStatus(provider.status)
      setApiKey('')
    } else {
      setCode('')
      setName('')
      setBaseUrl('')
      setProtocol('')
      setAuthHeaderName('')
      setAuthHeaderPrefix('')
      setAuthQueryParam('')
      setHealthCheckPath('')
      setStrategy('PRIORITY')
      setStatus('ACTIVE')
      setApiKey('')
    }
  }, [provider, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!protocol) {
      toast({
        title: t('Chưa chọn giao thức'),
        description: t('Vui lòng chọn giao thức API (Protocol) cho Provider.'),
        variant: 'destructive',
      })
      return
    }

    setSubmitting(true)
    try {
      if (isEdit && provider) {
        await onSubmitUpdate(provider.id, {
          name,
          baseUrl,
          protocol,
          authHeaderName: authHeaderName || undefined,
          authHeaderPrefix: authHeaderPrefix || undefined,
          authQueryParam: authQueryParam || undefined,
          healthCheckPath: healthCheckPath || undefined,
          strategy,
          status,
        })
      } else {
        await onSubmitCreate({
          code: code.toUpperCase(),
          name,
          baseUrl,
          protocol,
          authHeaderName: authHeaderName || undefined,
          authHeaderPrefix: authHeaderPrefix || undefined,
          authQueryParam: authQueryParam || undefined,
          healthCheckPath: healthCheckPath || undefined,
          strategy,
          apiKey: apiKey.trim() || undefined,
        })
      }
      onOpenChange(false)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[95vw] sm:max-w-[540px] max-h-[90vh] overflow-y-auto"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">
              {isEdit ? t('Chỉnh sửa Provider: {name}', { name: provider?.name }) : t('Thêm Nhà cung cấp AI (Provider)')}
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              {isEdit
                ? t('Cập nhật thông tin cấu hình nhà cung cấp dịch vụ AI.')
                : t('Thêm nhà cung cấp dịch vụ AI mới vào hệ thống (Mã provider viết hoa, duy nhất).')}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4 text-xs">
            {!isEdit && (
              <div className="grid gap-2">
                <Label htmlFor="code">{t('Mã Provider (Code)')}</Label>
                <Input
                  id="code"
                  className="h-9 text-xs"
                  placeholder={t('VD: GEMINI, OPENAI, DEEPSEEK, MISTRAL, OLLAMA')}
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  required
                />
                <p className="text-[11px] text-muted-foreground">
                  {t('Chỉ chứa chữ cái viết hoa, số và dấu gạch dưới. Không thể sửa sau khi tạo.')}
                </p>
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="name">{t('Tên hiển thị')}</Label>
              <Input
                id="name"
                className="h-9 text-xs"
                placeholder={t('VD: Google Gemini, DeepSeek AI, OpenAI...')}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="baseUrl">{t('Base URL Endpoint (HTTPS)')}</Label>
              <Input
                id="baseUrl"
                className="h-9 text-xs font-mono"
                placeholder="https://api.deepseek.com/v1"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="protocol">
                {t('Giao thức API (Protocol)')} <span className="text-red-500">*</span>
              </Label>
              <Select
                value={protocol}
                onValueChange={(val: ProviderProtocol) => setProtocol(val)}
              >
                <SelectTrigger id="protocol" className="h-9 text-xs">
                  <SelectValue placeholder={t('-- Chọn giao thức API --')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OPENAI_COMPATIBLE" className="text-xs">
                    {t('OPENAI_COMPATIBLE (Chuẩn OpenAI / DeepSeek / Groq / Ollama / Mistral...)')}
                  </SelectItem>
                  <SelectItem value="GOOGLE_GEMINI_COMPATIBLE" className="text-xs">
                    {t('GOOGLE_GEMINI_COMPATIBLE (Chuẩn Google Gemini REST API)')}
                  </SelectItem>
                  <SelectItem value="ANTHROPIC_COMPATIBLE" className="text-xs">
                    {t('ANTHROPIC_COMPATIBLE (Chuẩn Anthropic Claude API)')}
                  </SelectItem>
                  <SelectItem value="CUSTOM_REST" className="text-xs">
                    {t('CUSTOM_REST (Tùy chỉnh linh hoạt 100% cho AI mới)')}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {protocol === 'CUSTOM_REST' && (
              <div className="p-3 border rounded-md bg-slate-50 space-y-3">
                <p className="font-semibold text-xs text-slate-700">
                  {t('⚙️ Thông số Tùy chỉnh Giao thức Custom REST:')}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-1">
                    <Label htmlFor="authHeaderName" className="text-[11px]">{t('Tên Header Xác thực')}</Label>
                    <Input
                      id="authHeaderName"
                      className="h-8 text-xs font-mono"
                      placeholder="Authorization"
                      value={authHeaderName}
                      onChange={(e) => setAuthHeaderName(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-1">
                    <Label htmlFor="authHeaderPrefix" className="text-[11px]">{t('Tiền tố Header')}</Label>
                    <Input
                      id="authHeaderPrefix"
                      className="h-8 text-xs font-mono"
                      placeholder="Bearer "
                      value={authHeaderPrefix}
                      onChange={(e) => setAuthHeaderPrefix(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-1">
                    <Label htmlFor="authQueryParam" className="text-[11px]">{t('Query Param Xác thực')}</Label>
                    <Input
                      id="authQueryParam"
                      className="h-8 text-xs font-mono"
                      placeholder={t('key hoặc api_key')}
                      value={authQueryParam}
                      onChange={(e) => setAuthQueryParam(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-1">
                    <Label htmlFor="healthCheckPath" className="text-[11px]">{t('Đường dẫn Test Endpoint')}</Label>
                    <Input
                      id="healthCheckPath"
                      className="h-8 text-xs font-mono"
                      placeholder="/models"
                      value={healthCheckPath}
                      onChange={(e) => setHealthCheckPath(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {!isEdit && (
              <div className="grid gap-2">
                <Label htmlFor="apiKey">{t('API Key ban đầu (Plaintext - Tùy chọn)')}</Label>
                <PasswordInput
                  id="apiKey"
                  className="h-9 text-xs"
                  placeholder={t('Nhập API Key ban đầu nếu muốn tạo ngay...')}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="strategy">{t('Chiến lược chọn Key (Key Strategy)')}</Label>
              <Select
                value={strategy}
                onValueChange={(val: 'PRIORITY' | 'ROUND_ROBIN') => setStrategy(val)}
              >
                <SelectTrigger id="strategy" className="h-9 text-xs">
                  <SelectValue placeholder={t('Chọn chiến lược')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PRIORITY" className="text-xs">
                    {t('PRIORITY (Ưu tiên theo độ ưu tiên cao nhất)')}
                  </SelectItem>
                  <SelectItem value="ROUND_ROBIN" className="text-xs">
                    {t('ROUND_ROBIN (Luân phiên chia đều tải)')}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isEdit && (
              <div className="grid gap-2">
                <Label htmlFor="status">{t('Trạng thái hoạt động')}</Label>
                <Select
                  value={status}
                  onValueChange={(val: 'ACTIVE' | 'INACTIVE') => setStatus(val)}
                >
                  <SelectTrigger id="status" className="h-9 text-xs">
                    <SelectValue placeholder={t('Chọn trạng thái')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE" className="text-xs">
                      {t('ACTIVE (Hoạt động)')}
                    </SelectItem>
                    <SelectItem value="INACTIVE" className="text-xs">
                      {t('INACTIVE (Vô hiệu hóa)')}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('Hủy')}
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Spinner className="mr-2 h-4 w-4" />}
              {isEdit ? t('Cập nhật') : t('Thêm Provider')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
