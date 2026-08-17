'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import {
  MessageSquareCode,
  Search,
  Edit,
  History,
  Zap,
} from 'lucide-react'
import { SystemPrompt, systemPromptService } from '@/services/systemPromptService'
import { SystemPromptDialog } from '@/components/admin/ai-config/SystemPromptDialog'
import { SystemPromptHistoryDialog } from '@/components/admin/ai-config/SystemPromptHistoryDialog'
import { PromptPreviewRenderDialog } from '@/components/admin/ai-config/PromptPreviewRenderDialog'
import { useToast } from '@/components/ui/use-toast'

export function SystemPromptTab() {
  const { toast } = useToast()

  const [prompts, setPrompts] = useState<SystemPrompt[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [search, setSearch] = useState('')

  // Dialog States
  const [selectedPromptForEdit, setSelectedPromptForEdit] = useState<SystemPrompt | null>(null)
  const [isPromptDialogOpen, setIsPromptDialogOpen] = useState(false)

  const [selectedPromptForHistory, setSelectedPromptForHistory] = useState<SystemPrompt | null>(null)
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false)

  const [selectedPromptForRender, setSelectedPromptForRender] = useState<SystemPrompt | null>(null)
  const [isRenderDialogOpen, setIsRenderDialogOpen] = useState(false)

  useEffect(() => {
    fetchPrompts()
  }, [])

  const fetchPrompts = async () => {
    setIsLoading(true)
    try {
      const data = await systemPromptService.getAllPrompts({
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

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header & Filter Controls */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <div>
              <CardTitle className="text-lg sm:text-xl font-bold flex items-center gap-2">
                <MessageSquareCode className="h-5 w-5 text-indigo-500 shrink-0" />
                Quản lý câu lệnh mẫu System Prompts
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm mt-1">
                Tùy chỉnh các câu lệnh điều khiển AI cho từng tác vụ hệ thống, khôi phục mặc định và theo dõi lịch sử phiên bản.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm theo mã code, tên prompt..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-xs h-9 w-full"
            />
          </form>
        </CardContent>
      </Card>

      {/* Prompts Cards Grid */}
      {isLoading ? (
        <div className="flex justify-center p-12">
          <Spinner className="h-8 w-8 text-indigo-500" />
        </div>
      ) : prompts.length === 0 ? (
        <Card className="p-6 sm:p-8 text-center border-dashed">
          <CardContent className="pt-6">
            <MessageSquareCode className="h-12 w-12 text-muted-foreground mx-auto mb-3 stroke-1" />
            <p className="font-semibold text-sm sm:text-base">Chưa có System Prompt nào</p>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Thử thay đổi bộ lọc tìm kiếm.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:gap-4">
          {prompts.map((item) => (
            <Card key={item.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 sm:p-5">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                      <h3 className="font-bold text-sm sm:text-base text-foreground">{item.name}</h3>
                    </div>

                    {item.description && (
                      <p className="text-xs text-muted-foreground italic">{item.description}</p>
                    )}
                  </div>

                  {/* Actions Column */}
                  <div className="flex flex-wrap items-center justify-start sm:justify-end gap-1.5 sm:gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedPromptForRender(item)
                        setIsRenderDialogOpen(true)
                      }}
                      className="text-xs text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950 h-8 flex-1 sm:flex-initial font-medium border-indigo-200"
                    >
                      <Zap className="mr-1.5 h-3.5 w-3.5 text-amber-500 fill-amber-500" /> Thử nghiệm AI
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedPromptForEdit(item)
                        setIsPromptDialogOpen(true)
                      }}
                      className="text-xs h-8 flex-1 sm:flex-initial"
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
                      className="text-xs h-8 flex-1 sm:flex-initial"
                    >
                      <History className="mr-1.5 h-3.5 w-3.5" /> Lịch sử
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
