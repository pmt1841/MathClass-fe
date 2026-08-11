'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  MessageSquareCode,
  Search,
  Plus,
  Edit,
  RotateCcw,
  History,
  Trash2,
  Play,
  Sparkles,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import { SystemPrompt, systemPromptService } from '@/services/systemPromptService'
import { SystemPromptDialog } from '@/components/admin/ai-config/SystemPromptDialog'
import { SystemPromptHistoryDialog } from '@/components/admin/ai-config/SystemPromptHistoryDialog'
import { PromptPreviewRenderDialog } from '@/components/admin/ai-config/PromptPreviewRenderDialog'
import { useToast } from '@/components/ui/use-toast'

const SYSTEM_TASKS = [
  { code: 'STUDENT_HINT', title: 'Gợi ý tư duy làm bài' },
  { code: 'LATEX_CANVAS_FORMAT', title: 'Định dạng LaTeX / Canvas' },
  { code: 'SUBMISSION_GRADING', title: 'Chấm bài Tự luận AI' },
  { code: 'QUESTION_GEN', title: 'Sinh Đề thi & Bài tập' },
]

export function SystemPromptTab() {
  const { toast } = useToast()

  const [prompts, setPrompts] = useState<SystemPrompt[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [taskFilter, setTaskFilter] = useState<string>('ALL')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')

  // Dialog States
  const [selectedPromptForEdit, setSelectedPromptForEdit] = useState<SystemPrompt | null>(null)
  const [isPromptDialogOpen, setIsPromptDialogOpen] = useState(false)

  const [selectedPromptForHistory, setSelectedPromptForHistory] = useState<SystemPrompt | null>(null)
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false)

  const [selectedPromptForRender, setSelectedPromptForRender] = useState<SystemPrompt | null>(null)
  const [isRenderDialogOpen, setIsRenderDialogOpen] = useState(false)

  useEffect(() => {
    fetchPrompts()
  }, [taskFilter, statusFilter])

  const fetchPrompts = async () => {
    setIsLoading(true)
    try {
      const data = await systemPromptService.getAllPrompts({
        taskCode: taskFilter !== 'ALL' ? taskFilter : undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        search: search ? search : undefined,
      })
      setPrompts(data)
    } catch (err: any) {
      toast({
        title: 'Lỗi tải dữ liệu',
        description: err.response?.data?.message || 'Không thể tải danh sách System Prompts',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    fetchPrompts()
  }

  const handleResetToDefault = async (prompt: SystemPrompt) => {
    if (!confirm(`Bạn có chắc chắn muốn khôi phục câu lệnh "${prompt.name}" về bản mặc định ban đầu?`)) {
      return
    }

    try {
      await systemPromptService.resetToDefault(prompt.id, 'Reset về bản gốc từ giao diện Admin')
      toast({
        title: 'Khôi phục thành công!',
        description: `Prompt "${prompt.name}" đã được đặt về nội dung mặc định.`,
      })
      fetchPrompts()
    } catch (err: any) {
      toast({
        title: 'Lỗi khôi phục',
        description: err.response?.data?.message || 'Không thể khôi phục prompt',
        variant: 'destructive',
      })
    }
  }

  const handleDelete = async (prompt: SystemPrompt) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa System Prompt "${prompt.name}" (${prompt.code})?`)) {
      return
    }

    try {
      await systemPromptService.deletePrompt(prompt.id)
      toast({
        title: 'Xóa thành công!',
        description: `System Prompt ${prompt.code} đã bị xóa.`,
      })
      fetchPrompts()
    } catch (err: any) {
      toast({
        title: 'Xóa thất bại',
        description: err.response?.data?.message || 'Không thể xóa prompt',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header & Filter Controls */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <MessageSquareCode className="h-5 w-5 text-indigo-500" />
                Quản lý câu lệnh mẫu System Prompts
              </CardTitle>
              <CardDescription>
                Tùy chỉnh các câu lệnh điều khiển AI cho từng tác vụ hệ thống, khôi phục mặc định và theo dõi lịch sử phiên bản.
              </CardDescription>
            </div>
            <Button
              onClick={() => {
                setSelectedPromptForEdit(null)
                setIsPromptDialogOpen(true)
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white shrink-0"
            >
              <Plus className="mr-2 h-4 w-4" />
              Tạo Prompt Mới
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2 relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm theo mã code, tên prompt..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 text-xs"
              />
            </div>
            <div>
              <Select value={taskFilter} onValueChange={setTaskFilter}>
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder="Lọc theo Task Code" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tất cả Tasks</SelectItem>
                  {SYSTEM_TASKS.map((t) => (
                    <SelectItem key={t.code} value={t.code}>
                      {t.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
                  <SelectItem value="ACTIVE">ACTIVE (Hoạt động)</SelectItem>
                  <SelectItem value="INACTIVE">INACTIVE (Vô hiệu hóa)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Prompts Cards Grid */}
      {isLoading ? (
        <div className="flex justify-center p-12">
          <Spinner className="h-8 w-8 text-indigo-500" />
        </div>
      ) : prompts.length === 0 ? (
        <Card className="p-8 text-center border-dashed">
          <CardContent className="pt-6">
            <MessageSquareCode className="h-12 w-12 text-muted-foreground mx-auto mb-3 stroke-1" />
            <p className="font-semibold text-base">Chưa có System Prompt nào</p>
            <p className="text-sm text-muted-foreground mt-1">
              Thử thay đổi bộ lọc tìm kiếm hoặc tạo System Prompt mới.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {prompts.map((item) => (
            <Card key={item.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-bold text-base text-foreground">{item.name}</h3>
                      <Badge variant="outline" className="font-mono text-[11px] bg-slate-100 dark:bg-slate-800">
                        {item.code}
                      </Badge>
                      <Badge
                        className={`text-[10px] ${
                          item.status === 'ACTIVE'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        }`}
                      >
                        {item.status === 'ACTIVE' ? (
                          <span className="flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" /> ACTIVE
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <XCircle className="h-3 w-3" /> INACTIVE
                          </span>
                        )}
                      </Badge>
                      <Badge variant="secondary" className="text-[10px]">
                        Task: {item.taskCode}
                      </Badge>
                    </div>

                    {item.description && (
                      <p className="text-xs text-muted-foreground italic">{item.description}</p>
                    )}

                    {/* Allowed Variables Chips */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[11px] font-semibold text-muted-foreground mr-1">
                        Biến hỗ trợ:
                      </span>
                      {item.allowedVariables.map((v) => (
                        <Badge
                          key={v}
                          variant="outline"
                          className="font-mono text-[10px] bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200"
                        >
                          {`{{${v}}}`}
                        </Badge>
                      ))}
                    </div>

                    {/* Content Snippet */}
                    <div className="bg-slate-950 text-slate-100 p-3 rounded-lg text-xs font-mono line-clamp-3 leading-relaxed border border-slate-800 mt-2">
                      {item.currentContent}
                    </div>
                  </div>

                  {/* Actions Column */}
                  <div className="flex lg:flex-col items-center lg:items-end justify-end gap-2 shrink-0 pt-2 lg:pt-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedPromptForRender(item)
                        setIsRenderDialogOpen(true)
                      }}
                      className="text-xs text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950"
                    >
                      <Play className="mr-1.5 h-3.5 w-3.5" /> Thử nghiệm Render
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedPromptForEdit(item)
                        setIsPromptDialogOpen(true)
                      }}
                      className="text-xs"
                    >
                      <Edit className="mr-1.5 h-3.5 w-3.5" /> Chỉnh sửa
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedPromptForHistory(item)
                        setIsHistoryDialogOpen(true)
                      }}
                      className="text-xs"
                    >
                      <History className="mr-1.5 h-3.5 w-3.5" /> Lịch sử
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleResetToDefault(item)}
                      className="text-xs text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950"
                    >
                      <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Khôi phục gốc
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(item)}
                      className="text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialogs */}
      <SystemPromptDialog
        prompt={selectedPromptForEdit}
        open={isPromptDialogOpen}
        onOpenChange={setIsPromptDialogOpen}
        onSuccess={fetchPrompts}
      />

      <SystemPromptHistoryDialog
        prompt={selectedPromptForHistory}
        open={isHistoryDialogOpen}
        onOpenChange={setIsHistoryDialogOpen}
        onRollbackSuccess={fetchPrompts}
      />

      <PromptPreviewRenderDialog
        prompt={selectedPromptForRender}
        open={isRenderDialogOpen}
        onOpenChange={setIsRenderDialogOpen}
      />
    </div>
  )
}
