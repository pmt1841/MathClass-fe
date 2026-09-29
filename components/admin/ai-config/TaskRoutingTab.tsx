'use client'

import { useState, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import {
  FileText,
  CheckSquare,
  Palette,
  Lightbulb,
  AlertTriangle,
  Save,
  FileStack,
  GraduationCap,
  Route,
} from 'lucide-react'
import {
  AiProvider,
  TaskConfig,
  aiConfigService,
} from '@/services/aiConfigService'
import { ModelInputWithFetch } from '@/components/admin/ai-config/ModelInputWithFetch'
import { toast } from 'sonner'
import { useI18n } from '@/lib/i18n/i18n-context'

interface TaskMetadata {
  taskCode: string
  title: string
  description: string
  icon: any
}

const SYSTEM_TASKS: TaskMetadata[] = [
  {
    taskCode: 'QUESTION_GEN',
    title: 'Sinh Đề thi & Khởi tạo Bài tập',
    description: 'Tự động tạo câu hỏi trắc nghiệm, tự luận toán theo ma trận kiến thức.',
    icon: FileText,
  },
  {
    taskCode: 'BATCH_QUESTION_GEN',
    title: 'Tạo Hàng Loạt Bài Tập từ File / Ảnh AI',
    description: 'Tự động phân tích tài liệu Word/PDF/Ảnh, bóc tách cấu trúc thành danh sách bài tập.',
    icon: FileStack,
  },
  {
    taskCode: 'SUBMISSION_GRADING',
    title: 'Chấm bài Tự luận AI',
    description: 'Phân tích lời giải bài tập học sinh, chấm điểm và gợi ý lời nhận xét.',
    icon: CheckSquare,
  },
  {
    taskCode: 'CANVAS_LATEX',
    title: 'Nhận diện Canvas & Công thức LaTeX',
    description: 'Chuyển đổi hình vẽ, công thức toán viết tay thành định dạng LaTeX / JSXGraph.',
    icon: Palette,
  },
  {
    taskCode: 'STUDENT_HINT',
    title: 'Gợi ý Tư duy Làm bài',
    description: 'Đưa ra gợi ý định hướng từng bước theo phương pháp Socratic, không cho đáp án trực tiếp.',
    icon: Lightbulb,
  },
  {
    taskCode: 'STUDENT_REMARK',
    title: 'AI Đánh giá & Nhận xét Học sinh',
    description: 'Quét dữ liệu bài tập và bài nộp theo mốc thời gian để sinh nhận xét điểm mạnh, điểm yếu và phương pháp cải thiện.',
    icon: GraduationCap,
  },
]

export function TaskRoutingTab() {
  const { t } = useI18n()
  const queryClient = useQueryClient()
  const [providers, setProviders] = useState<AiProvider[]>([])
  const [initialTaskConfigs, setInitialTaskConfigs] = useState<Record<string, TaskConfig | null>>({})
  const [taskConfigs, setTaskConfigs] = useState<Record<string, TaskConfig>>({})
  const [loading, setLoading] = useState(true)
  const [savingTask, setSavingTask] = useState<string | null>(null)

  const loadData = async () => {
    setLoading(true)
    try {
      const pList = await aiConfigService.getProviders()
      setProviders(pList.filter((p) => p.status === 'ACTIVE'))

      const initialMap: Record<string, TaskConfig | null> = {}
      const currentMap: Record<string, TaskConfig> = {}

      for (const task of SYSTEM_TASKS) {
        try {
          const cfg = await aiConfigService.getTaskConfig(task.taskCode)
          initialMap[task.taskCode] = { ...cfg }
          currentMap[task.taskCode] = { ...cfg }
        } catch {
          // Chưa được cấu hình trong CSDL -> Để trống providerId (0), model ("") và mặc định TẮT
          // (khớp với /ai/features: task chưa cấu hình => enabled=false)
          initialMap[task.taskCode] = null
          currentMap[task.taskCode] = {
            task: task.taskCode,
            providerId: 0,
            model: '',
            temperature: 0.7,
            maxToken: 2048,
            enabled: false,
          }
        }
      }

      setInitialTaskConfigs(initialMap)
      setTaskConfigs(currentMap)
    } catch (err: any) {
      toast.error(t('Lỗi nạp cấu hình Task'), {
        description: err.response?.data?.message || err.message,
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleUpdateTaskField = (taskCode: string, field: keyof TaskConfig, value: any) => {
    setTaskConfigs((prev) => ({
      ...prev,
      [taskCode]: {
        ...prev[taskCode],
        [field]: value,
      },
    }))
  }

  // Kiểm tra xem cấu hình của task có sự thay đổi (Dirty state) hay không
  const isTaskDirty = (taskCode: string): boolean => {
    const current = taskConfigs[taskCode]
    const initial = initialTaskConfigs[taskCode]

    if (!current) return false

    // Nếu chưa từng cấu hình trong DB (initial === null)
    if (!initial) {
      // Chỉ cho phép lưu nếu Admin đã chọn Provider (providerId > 0) và gõ Model
      return current.providerId > 0 && current.model.trim().length > 0
    }

    // Nếu đã cấu hình trong DB, so sánh từng trường
    return (
      current.providerId !== initial.providerId ||
      current.model !== initial.model ||
      current.temperature !== initial.temperature ||
      current.maxToken !== initial.maxToken ||
      current.enabled !== initial.enabled
    )
  }

  const handleSaveTaskConfig = async (taskCode: string) => {
    const config = taskConfigs[taskCode]
    if (!config || !config.providerId || config.providerId === 0) {
      toast.error(t('Chưa chọn Provider'), {
        description: t('Vui lòng chọn Provider cho tác vụ trước khi lưu.'),
      })
      return
    }

    if (!config.model.trim()) {
      toast.error(t('Chưa nhập Model'), {
        description: t('Vui lòng nhập hoặc chọn Model AI cho tác vụ.'),
      })
      return
    }

    setSavingTask(taskCode)
    try {
      const updated = await aiConfigService.updateTaskConfig(taskCode, {
        providerId: config.providerId,
        model: config.model.trim(),
        temperature: config.temperature,
        maxToken: config.maxToken,
        enabled: config.enabled,
      })

      // Cập nhật cả state hiển thị và state lưu ban đầu
      setTaskConfigs((prev) => ({ ...prev, [taskCode]: { ...updated } }))
      setInitialTaskConfigs((prev) => ({ ...prev, [taskCode]: { ...updated } }))

      toast.success(t('⚡ Lưu cấu hình Task thành công!'), {
        description: t('Đã cập nhật định tuyến cho tác vụ thành công.'),
      })
    } catch (err: any) {
      toast.error(t('Lưu thất bại'), {
        description: err.response?.data?.message || err.message,
      })
    } finally {
      setSavingTask(null)
    }
  }

  /**
   * MAT-254: Bật/Tắt nhanh tính năng AI (Feature Flag) — OPTIMISTIC UPDATE.
   *
   * UI phản hồi ngay lập tức khi bấm Switch (không chờ backend trả về để tránh giật),
   * sau đó gửi request lên server ở nền. Nếu thất bại, tự động rollback về trạng thái cũ.
   * Chỉ thay đổi field `enabled`, không ghi đè các field khác đang được chỉnh sửa dở.
   */
  const handleToggleTask = async (taskCode: string, newEnabled: boolean) => {
    // Chống spam click khi request cho task này chưa hoàn tất
    if (savingTask === taskCode) return

    const config = taskConfigs[taskCode]
    if (!config) return

    // Bật tính năng khi chưa chọn Provider/Model -> chặn với thông báo rõ ràng
    if (newEnabled && (!config.providerId || config.providerId === 0 || !config.model.trim())) {
      toast.error(t('Chưa thể bật tính năng'), {
        description: t('Vui lòng chọn Provider và Model AI trước khi bật tính năng này.'),
      })
      return
    }

    const prevEnabled = config.enabled

    // ── 1. OPTIMISTIC UI: cập nhật ngay lập tức (không await) → Switch không giật ──
    setTaskConfigs((prev) => ({
      ...prev,
      [taskCode]: { ...prev[taskCode], enabled: newEnabled },
    }))
    setInitialTaskConfigs((prev) => ({
      ...prev,
      [taskCode]: prev[taskCode] ? { ...prev[taskCode], enabled: newEnabled } : prev[taskCode],
    }))

    // ── 2. Chuẩn bị payload dựa trên config ĐÃ LƯU (tránh ghi đè thay đổi đang gõ dở) ──
    const persisted = initialTaskConfigs[taskCode]
    const payload = persisted
      ? {
        providerId: persisted.providerId,
        model: persisted.model,
        temperature: persisted.temperature,
        maxToken: persisted.maxToken,
        enabled: newEnabled,
      }
      : {
        providerId: config.providerId,
        model: config.model.trim(),
        temperature: config.temperature,
        maxToken: config.maxToken,
        enabled: newEnabled,
      }

    setSavingTask(taskCode)
    try {
      const updated = await aiConfigService.updateTaskConfig(taskCode, payload)

      // Chốt theo kết quả server (chỉ merge field enabled để giữ nguyên chỉnh sửa đang dở)
      setTaskConfigs((prev) => ({
        ...prev,
        [taskCode]: { ...prev[taskCode], enabled: updated.enabled, updatedAt: updated.updatedAt },
      }))
      setInitialTaskConfigs((prev) => ({
        ...prev,
        [taskCode]: { ...updated },
      }))

      // Làm mới trạng thái /ai/features để giao diện GV/HS phản ánh ngay
      queryClient.invalidateQueries({ queryKey: ['ai-features'] })

      if (newEnabled) {
        toast.success(t('✅ Đã bật tính năng'), {
          description: t('Task {taskCode} đã được bật. Giao diện Giáo viên/Học sinh sẽ hiển thị nút tương ứng ngay lập tức.', { taskCode }),
        })
      } else {
        toast.success(t('⏻ Đã tắt tính năng'), {
          description: t('Task {taskCode} đã bị tắt. Giao diện Giáo viên/Học sinh sẽ ẩn nút tương ứng ngay lập tức.', { taskCode }),
        })
      }
    } catch (err: any) {
      // ── 3. ROLLBACK về trạng thái cũ khi lưu thất bại ──
      setTaskConfigs((prev) => ({
        ...prev,
        [taskCode]: { ...prev[taskCode], enabled: prevEnabled },
      }))
      setInitialTaskConfigs((prev) => ({
        ...prev,
        [taskCode]: prev[taskCode] ? { ...prev[taskCode], enabled: prevEnabled } : prev[taskCode],
      }))
      toast.error(t('Cập nhật thất bại'), {
        description: err.response?.data?.message || err.message,
      })
    } finally {
      setSavingTask(null)
    }
  }

  const getTemperatureLabel = (temp: number) => {
    if (temp <= 0.2) return `${temp} (${t('Rất chính xác / Logic')})`
    if (temp <= 0.7) return `${temp} (${t('Cân bằng logic & linh hoạt')})`
    return `${temp} (${t('Sáng tạo phong phú')})`
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
      <div>
        <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2">
          <Route className="h-5 w-5 text-indigo-600 shrink-0" />
          {t('Định tuyến Tác vụ Hệ thống (Task Routing)')}
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          {t('Phân công nhà cung cấp, phiên bản Model AI và các tham số tối ưu cho từng loại tác vụ chuyên biệt.')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {SYSTEM_TASKS.map((taskItem) => {
          const Icon = taskItem.icon
          const cfg = taskConfigs[taskItem.taskCode] || {
            task: taskItem.taskCode,
            providerId: 0,
            model: '',
            temperature: 0.7,
            maxToken: 2048,
            enabled: false,
          }
          const isConfigured = !!initialTaskConfigs[taskItem.taskCode]
          const dirty = isTaskDirty(taskItem.taskCode)
          const isSaving = savingTask === taskItem.taskCode

          return (
            <Card key={taskItem.taskCode} className="shadow-sm hover:shadow transition-shadow border">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                    <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                      <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                        <CardTitle className="text-sm sm:text-base font-semibold">{t(taskItem.title)}</CardTitle>
                        <Badge
                          variant="outline"
                          className={
                            isConfigured
                              ? 'border-emerald-500 text-emerald-600 bg-emerald-50 text-[10px]'
                              : 'border-amber-500 text-amber-600 bg-amber-50 text-[10px]'
                          }
                        >
                          {isConfigured ? t('Đã cấu hình') : t('Chưa cấu hình')}
                        </Badge>
                      </div>
                      <CardDescription className="text-xs line-clamp-2 mt-0.5">
                        {t(taskItem.description)}
                      </CardDescription>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 pt-0.5">
                    <Switch
                      checked={cfg.enabled}
                      onCheckedChange={(val) => handleToggleTask(taskItem.taskCode, val)}
                    />
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4 text-xs pt-1">
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs">{t('Nhà cung cấp (Provider)')}</Label>
                    <Select
                      value={cfg.providerId ? cfg.providerId.toString() : '0'}
                      onValueChange={(val) => {
                        const newProviderId = parseInt(val) || 0
                        if (newProviderId !== cfg.providerId) {
                          setTaskConfigs((prev) => ({
                            ...prev,
                            [taskItem.taskCode]: {
                              ...prev[taskItem.taskCode],
                              providerId: newProviderId,
                              model: '', // Reset model khi thay đổi Provider
                            },
                          }))
                        }
                      }}
                    >
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue placeholder={t('Vui lòng chọn Provider...')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0" disabled className="text-xs text-muted-foreground">
                          {t('-- Chưa chọn Provider --')}
                        </SelectItem>
                        {providers.map((p) => (
                          <SelectItem key={p.id} value={p.id.toString()} className="text-xs">
                            {p.name} ({p.code}) - [{p.protocol}]
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">{t('Tên Model AI')}</Label>
                    <ModelInputWithFetch
                      providerId={cfg.providerId}
                      value={cfg.model}
                      onChange={(val) => handleUpdateTaskField(taskItem.taskCode, 'model', val)}
                      placeholder={t('Vui lòng chọn hoặc gõ tên Model...')}
                    />
                  </div>
                </div>

                <div className="space-y-2 pt-1">
                  <div className="flex justify-between items-center text-xs">
                    <Label className="text-xs">{t('Temperature (Độ sáng tạo)')}</Label>
                    <span className="font-semibold text-indigo-600 font-mono text-[11px]">
                      {getTemperatureLabel(cfg.temperature)}
                    </span>
                  </div>
                  <Slider
                    min={0}
                    max={2}
                    step={0.1}
                    value={[cfg.temperature]}
                    onValueChange={(vals) =>
                      handleUpdateTaskField(taskItem.taskCode, 'temperature', vals[0])
                    }
                  />
                </div>

                <div className="space-y-1.5 pt-1">
                  <Label className="text-xs">{t('Max Tokens (Giới hạn phản hồi)')}</Label>
                  <Input
                    type="number"
                    className="h-9 text-xs font-mono"
                    placeholder="2048"
                    value={cfg.maxToken}
                    onChange={(e) => {
                      const val = e.target.value
                      handleUpdateTaskField(taskItem.taskCode, 'maxToken', val === '' ? '' : parseInt(val) || 2048)
                    }}
                  />
                </div>
              </CardContent>

              <CardFooter className="pt-2 flex justify-end">
                <Button
                  size="sm"
                  className="w-full sm:w-auto"
                  onClick={() => handleSaveTaskConfig(taskItem.taskCode)}
                  disabled={!dirty || isSaving || !cfg.providerId || !cfg.model.trim()}
                >
                  {isSaving ? (
                    <Spinner className="mr-1.5 h-3.5 w-3.5" />
                  ) : (
                    <Save className="mr-1.5 h-3.5 w-3.5" />
                  )}
                  {t('Lưu cấu hình Task')}
                </Button>
              </CardFooter>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
