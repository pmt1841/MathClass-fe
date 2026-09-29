'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  FlaskConical,
  CheckCircle2,
  AlertCircle,
  Zap,
  Clock,
  ShieldCheck,
  KeyRound,
} from 'lucide-react'
import {
  AiProvider,
  TestConnectionResponse,
  aiConfigService,
} from '@/services/aiConfigService'
import { useI18n } from '@/lib/i18n/i18n-context'
import { useToast } from '@/components/ui/use-toast'

export function TestConnectionTab() {
  const { t } = useI18n()
  const { toast } = useToast()
  const [providers, setProviders] = useState<AiProvider[]>([])
  const [selectedProviderId, setSelectedProviderId] = useState<string>('')
  const [apiKey, setApiKey] = useState('')
  const [baseUrl, setBaseUrl] = useState('')

  const [testing, setTesting] = useState(false)
  const [result, setResult] = useState<TestConnectionResponse | null>(null)

  useEffect(() => {
    aiConfigService
      .getProviders()
      .then((list) => {
        setProviders(list)
        setSelectedProviderId('')
        setBaseUrl('')
      })
      .catch(() => { })
  }, [])

  const selectedProvider = providers.find((p) => p.id.toString() === selectedProviderId)

  const handleProviderChange = (idStr: string) => {
    setSelectedProviderId(idStr)
    setResult(null)
    const found = providers.find((p) => p.id.toString() === idStr)
    if (found) {
      setBaseUrl(found.baseUrl)
    } else {
      setBaseUrl('')
    }
  }

  const handleTestConnection = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProvider) {
      toast({
        title: t('Chưa chọn Provider'),
        description: t('Vui lòng chọn Provider hoặc tạo Provider mới ở Tab 1'),
        variant: 'destructive',
      })
      return
    }

    if (!apiKey.trim()) {
      toast({
        title: t('Chưa nhập API Key'),
        description: t('Vui lòng nhập chuỗi API Key để thử nghiệm kết nối'),
        variant: 'destructive',
      })
      return
    }

    setTesting(true)
    setResult(null)
    try {
      const res = await aiConfigService.testConnection({
        providerCode: selectedProvider.code,
        apiKey,
        baseUrl: baseUrl.trim() || selectedProvider.baseUrl,
        protocol: selectedProvider.protocol,
        authHeaderName: selectedProvider.authHeaderName,
        authHeaderPrefix: selectedProvider.authHeaderPrefix,
        authQueryParam: selectedProvider.authQueryParam,
        healthCheckPath: selectedProvider.healthCheckPath,
      })
      setResult(res)
      if (res.success || res.valid) {
        toast({
          title: t('⚡ Thử nghiệm kết nối thành công!'),
          description: `${t('Độ trễ phản hồi:')} ${res.latencyMs || 0} ms`,
        })
      } else {
        const rawMsg = (res.message || res.errorCode || t('Kết nối không thành công')).trim()
        const shortMsg = rawMsg.length > 90 ? rawMsg.substring(0, 90) + '...' : rawMsg
        toast({
          title: t('Kết nối thất bại'),
          description: shortMsg,
          variant: 'destructive',
        })
      }
    } catch (err: any) {
      const rawErrMsg = (err.response?.data?.message || err.message || t('Lỗi gửi yêu cầu kết nối')).trim()
      const shortErrMsg = rawErrMsg.length > 90 ? rawErrMsg.substring(0, 90) + '...' : rawErrMsg
      setResult({
        success: false,
        valid: false,
        latencyMs: 0,
        message: rawErrMsg,
        errorCode: 'REQUEST_ERROR',
      })
      toast({
        title: t('Lỗi thực thi kiểm thử'),
        description: shortErrMsg,
        variant: 'destructive',
      })
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2">
          <FlaskConical className="h-5 w-5 text-purple-600 shrink-0" />
          {t('Công cụ Kiểm tra Kết nối Trực tiếp')}
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          {t('Thử nghiệm kết nối thực tế tới Provider với API Key và Giao thức đã cấu hình.')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Form nhập dữ liệu bên trái */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">{t('Thông tin Thử nghiệm')}</CardTitle>
            <CardDescription className="text-xs">
              {t('Nhập API Key để kiểm tra tính hợp lệ và hạn ngạch (Quota) đối với Provider đã chọn.')}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleTestConnection} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <Label className="text-xs">{t('Nhà cung cấp (Provider)')}</Label>
                <Select value={selectedProviderId} onValueChange={handleProviderChange} disabled={providers.length === 0}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder={providers.length > 0 ? t('Chọn Provider') : t('Chưa có Provider nào')} />
                  </SelectTrigger>
                  <SelectContent>
                    {providers.length > 0 ? (
                      providers.map((p) => (
                        <SelectItem key={p.id} value={p.id.toString()} className="text-xs">
                          {p.name} ({p.code}) - [{p.protocol}]
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled className="text-xs">
                        {t('Chưa có Provider nào (Vui lòng tạo ở Tab 1)')}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {providers.length === 0 && (
                  <p className="text-[11px] text-amber-600 font-medium">
                    {t('⚠️ Vui lòng sang Tab 1 để tạo Provider trước khi sử dụng Công cụ Kiểm tra kết nối.')}
                  </p>
                )}
              </div>

              {selectedProvider ? (
                <>
                  <div className="p-2.5 bg-slate-50 border rounded text-[11px] space-y-1 text-slate-700 font-mono">
                    <div><strong>{t('Giao thức (Protocol):')}</strong> {selectedProvider.protocol}</div>
                    <div><strong>Base URL:</strong> {baseUrl || selectedProvider.baseUrl}</div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">{t('API Key (Plaintext)')}</Label>
                    <PasswordInput
                      className="h-9 text-xs"
                      placeholder={t('Nhập API Key cần thử nghiệm...')}
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-mono">{t('Base URL Override (Tùy chọn)')}</Label>
                    <Input
                      className="h-9 text-xs font-mono"
                      placeholder={selectedProvider?.baseUrl || "https://api.openai.com/v1"}
                      value={baseUrl}
                      onChange={(e) => setBaseUrl(e.target.value)}
                    />
                  </div>

                  <Button type="submit" className="w-full mt-2" disabled={testing || !apiKey.trim()}>
                    {testing ? (
                      <>
                        <Spinner className="mr-2 h-4 w-4" />
                        {t('Đang kết nối tới Provider API...')}
                      </>
                    ) : (
                      <>
                        <FlaskConical className="mr-2 h-4 w-4" />
                        {t('Kiểm tra kết nối')}
                      </>
                    )}
                  </Button>
                </>
              ) : providers.length > 0 ? (
                <div className="p-6 border border-dashed rounded-lg bg-slate-50/60 text-center text-muted-foreground space-y-1">
                  <p className="font-medium text-slate-700 text-xs">{t('Chưa chọn Nhà cung cấp')}</p>
                  <p className="text-[11px]">{t('Vui lòng chọn một Provider ở danh sách trên để nhập API Key và tiến hành kiểm tra kết nối.')}</p>
                </div>
              ) : null}
            </form>
          </CardContent>
        </Card>

        {/* Live Result Panel bên phải */}
        <Card className="shadow-sm border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center justify-between">
              <span>{t('Kết quả Thử nghiệm')}</span>
              {result && (
                <Badge
                  variant={result.success || result.valid ? 'outline' : 'destructive'}
                  className={
                    result.success || result.valid
                      ? 'border-emerald-500 text-emerald-600 bg-emerald-50'
                      : ''
                  }
                >
                  {result.success || result.valid ? 'SUCCESS' : 'FAILED'}
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="text-xs">
              {t('Đo lường thời gian phản hồi, trạng thái xác thực API Key và lý do sự cố (nếu có).')}
            </CardDescription>
          </CardHeader>

          <CardContent className="flex flex-col justify-center min-h-[260px]">
            {testing ? (
              <div className="py-12 text-center space-y-3">
                <Spinner className="mx-auto h-8 w-8 text-indigo-600" />
                <p className="text-xs font-medium text-slate-600 animate-pulse">
                  {t('Đang gửi yêu cầu xác thực API Key tới Provider...')}
                </p>
              </div>
            ) : !result ? (
              <div className="py-12 text-center text-muted-foreground space-y-2">
                <ShieldCheck className="mx-auto h-12 w-12 text-slate-300" />
                <p className="text-xs">
                  {t('Vui lòng điền thông tin bên cột trái và bấm')} <strong>{t('Kiểm tra kết nối')}</strong>.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {result.success || result.valid ? (
                  <Alert className="border-emerald-200 bg-emerald-50 text-emerald-900">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    <AlertTitle className="font-bold text-sm">{t('Kết nối thành công!')}</AlertTitle>
                    <AlertDescription className="text-xs mt-1">
                      {result.message || t('API Key hoàn toàn hợp lệ, Provider phản hồi tốt và còn Quota/Credits.')}
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert variant="destructive">
                    <AlertCircle className="h-5 w-5" />
                    <AlertTitle className="font-bold text-sm">
                      {t('Kết nối thất bại')} ({result.errorCode || 'ERROR'})
                    </AlertTitle>
                    <AlertDescription className="text-xs mt-1">
                      {result.message || t('Không thể xác thực API Key hoặc Provider không phản hồi.')}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="grid grid-cols-2 gap-4 rounded-lg bg-slate-50 p-4 border text-xs">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-amber-500" />
                    <div>
                      <span className="text-muted-foreground block text-[11px]">{t('Độ trễ phản hồi:')}</span>
                      <span className="font-bold font-mono text-slate-800">
                        {result.latencyMs || 0} ms
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <KeyRound className="h-4 w-4 text-blue-500" />
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Provider Code:</span>
                      <span className="font-bold font-mono text-slate-800">
                        {selectedProvider?.code || 'N/A'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-purple-500" />
                    <div>
                      <span className="text-muted-foreground block text-[11px]">{t('Giao thức Protocol:')}</span>
                      <span className="font-mono font-medium text-slate-800">
                        {selectedProvider?.protocol || 'N/A'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-500" />
                    <div>
                      <span className="text-muted-foreground block text-[11px]">{t('Xác thực Key:')}</span>
                      <span className="font-semibold text-slate-800">
                        {result.success || result.valid ? t('Hợp lệ') : t('Không hợp lệ')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
