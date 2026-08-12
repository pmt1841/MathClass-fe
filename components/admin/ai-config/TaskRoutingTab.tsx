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
  Sparkles,
} from 'lucide-react'
import {
  AiProvider,
  TaskConfig,
  aiConfigService,
} from '@/services/aiConfigService'
import { ModelInputWithFetch } from '@/components/admin/ai-config/ModelInputWithFetch'
import { toast } from 'sonner'

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
    taskCode: 'ERROR_ANALYSIS',
    title: 'Phân tích Lỗi sai & Gợi ý Sửa',
    description: 'Bắt lỗi sai trong các bước biến đổi toán học và giải thích chi tiết.',
    icon: AlertTriangle,
  },
]

export function TaskRoutingTab() {
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

      for (const t of SYSTEM_TASKS) {
        try {
          const cfg = await aiConfigService.getTaskConfig(t.taskCode)
          initialMap[t.taskCode] = { ...cfg }
          currentMap[t.taskCode] = { ...cfg }
        } catch {
          // Chưa được cấu hình trong CSDL -> Để trống providerId (0), model ("") và mặc định TẮT
          // (khớp với /ai/features: task chưa cấu hình => enabled=false)
          initialMap[t.taskCode] = null
          currentMap[t.taskCode] = {
            task: t.taskCode,
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
      toast.error('Lỗi nạp cấu hình Task', {
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
      toast.error('Chưa chọn Provider', {
        description: 'Vui lòng chọn Provider cho tác vụ trước khi lưu.',
      })
      return
    }

    if (!config.model.trim()) {
      toast.error('Chưa nhập Model', {
        description: 'Vui lòng nhập hoặc chọn Model AI cho tác vụ.',
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

      toast.success('⚡ Lưu cấu hình Task thành công!', {
        description: `Đã cập nhật định tuyến cho tác vụ thành công.`,
      })
    } catch (err: any) {
      toast.error('Lưu thất bại', {
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
      toast.error('Chưa thể bật tính năng', {
        description: 'Vui lòng chọn Provider và Model AI trước khi bật tính năng này.',
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
        toast.success('✅ Đã bật tính năng', {
          description: `Task ${taskCode} đã được bật. Giao diện Giáo viên/Học sinh sẽ hiển thị nút tương ứng ngay lập tức.`,
        })
      } else {
        toast.success('⏻ Đã tắt tính năng', {
          description: `Task ${taskCode} đã bị tắt. Giao diện Giáo viên/Học sinh sẽ ẩn nút tương ứng ngay lập tức.`,
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
      toast.error('Cập nhật thất bại', {
        description: err.response?.data?.message || err.message,
      })
    } finally {
      setSavingTask(null)
    }
  }

  const getTemperatureLabel = (temp: number) => {
    if (temp <= 0.2) return `${temp} (Rất chính xác / Logic)`
    if (temp <= 0.7) return `${temp} (Cân bằng logic & linh hoạt)`
    return `${temp} (Sáng tạo phong phú)`
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-amber-500" />
          Định tuyến Tác vụ Hệ thống (Task Routing)
        </h3>
        <p className="text-xs text-muted-foreground">
          Phân công nhà cung cấp, phiên bản Model AI và các tham số tối ưu cho từng loại tác vụ chuyên biệt.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {SYSTEM_TASKS.map((t) => {
          const Icon = t.icon
          const cfg = taskConfigs[t.taskCode] || {
            task: t.taskCode,
            providerId: 0,
            model: '',
            temperature: 0.7,
            maxToken: 2048,
            enabled: false,
          }
          const isConfigured = !!initialTaskConfigs[t.taskCode]
          const dirty = isTaskDirty(t.taskCode)
          const isSaving = savingTask === t.taskCode

          return (
            <Card key={t.taskCode} className="shadow-sm hover:shadow transition-shadow border">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base font-semibold">{t.title}</CardTitle>
                        <Badge
                          variant="outline"
                          className={
                            isConfigured
                              ? 'border-emerald-500 text-emerald-600 bg-emerald-50 text-[10px]'
                              : 'border-amber-500 text-amber-600 bg-amber-50 text-[10px]'
                          }
                        >
                          {isConfigured ? 'Đã cấu hình' : 'Chưa cấu hình'}
                        </Badge>
                      </div>
                      <CardDescription className="text-xs line-clamp-1 mt-0.5">
                        {t.description}
                      </CardDescription>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Switch
                      checked={cfg.enabled}
                      onCheckedChange={(val) => handleToggleTask(t.taskCode, val)}
                    />
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4 text-xs pt-1">
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Nhà cung cấp (Provider)</Label>
                    <Select
                      value={cfg.providerId ? cfg.providerId.toString() : '0'}
                      onValueChange={(val) => {
                        const newProviderId = parseInt(val) || 0
                        if (newProviderId !== cfg.providerId) {
                          setTaskConfigs((prev) => ({
                            ...prev,
                            [t.taskCode]: {
                              ...prev[t.taskCode],
                              providerId: newProviderId,
                              model: '', // Reset model khi thay đổi Provider
                            },
                          }))
                        }
                      }}
                    >
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue placeholder="Vui lòng chọn Provider..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0" disabled className="text-xs text-muted-foreground">
                          -- Chưa chọn Provider --
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
                    <Label className="text-xs">Tên Model AI</Label>
                    <ModelInputWithFetch
                      providerId={cfg.providerId}
                      value={cfg.model}
                      onChange={(val) => handleUpdateTaskField(t.taskCode, 'model', val)}
                      placeholder="Vui lòng chọn hoặc gõ tên Model..."
                    />
                  </div>
                </div>

                <div className="space-y-2 pt-1">
                  <div className="flex justify-between items-center text-xs">
                    <Label className="text-xs">Temperature (Độ sáng tạo)</Label>
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
                      handleUpdateTaskField(t.taskCode, 'temperature', vals[0])
                    }
                  />
                </div>

                <div className="space-y-1.5 pt-1">
                  <Label className="text-xs">Max Tokens (Giới hạn phản hồi)</Label>
                  <Input
                    type="number"
                    className="h-9 text-xs font-mono"
                    placeholder="2048"
                    value={cfg.maxToken}
                    onChange={(e) => {
                      const val = e.target.value
                      handleUpdateTaskField(t.taskCode, 'maxToken', val === '' ? '' : parseInt(val) || 2048)
                    }}
                  />
                </div>
              </CardContent>

              <CardFooter className="pt-2 flex justify-end">
                <Button
                  size="sm"
                  onClick={() => handleSaveTaskConfig(t.taskCode)}
                  disabled={!dirty || isSaving || !cfg.providerId || !cfg.model.trim()}
                >
                  {isSaving ? (
                    <Spinner className="mr-1.5 h-3.5 w-3.5" />
                  ) : (
                    <Save className="mr-1.5 h-3.5 w-3.5" />
                  )}
                  Lưu cấu hình Task
                </Button>
              </CardFooter>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
