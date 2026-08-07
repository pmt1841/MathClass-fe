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
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { History, RotateCcw, GitCompare, User, Calendar } from 'lucide-react'
import { SystemPrompt, SystemPromptHistory, systemPromptService } from '@/services/systemPromptService'
import { useToast } from '@/components/ui/use-toast'

interface SystemPromptHistoryDialogProps {
  prompt: SystemPrompt | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onRollbackSuccess: () => void
}

export function SystemPromptHistoryDialog({
  prompt,
  open,
  onOpenChange,
  onRollbackSuccess,
}: SystemPromptHistoryDialogProps) {
  const { toast } = useToast()
  const [historyList, setHistoryList] = useState<SystemPromptHistory[]>([])
  const [selectedHistory, setSelectedHistory] = useState<SystemPromptHistory | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isRollbacking, setIsRollbacking] = useState(false)

  useEffect(() => {
    if (prompt && open) {
      fetchHistory()
    }
  }, [prompt, open])

  const fetchHistory = async () => {
    if (!prompt) return
    setIsLoading(true)
    try {
      const data = await systemPromptService.getPromptHistory(prompt.id)
      setHistoryList(data)
      if (data.length > 0) {
        setSelectedHistory(data[0])
      }
    } catch (err: any) {
      toast({
        title: 'Lỗi nạp lịch sử',
        description: err.response?.data?.message || 'Không thể tải lịch sử phiên bản',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRollback = async (historyId: number) => {
    if (!prompt) return
    if (!confirm(`Bạn có chắc chắn muốn khôi phục về phiên bản v${selectedHistory?.version}?`)) {
      return
    }

    setIsRollbacking(true)
    try {
      await systemPromptService.rollbackToVersion(prompt.id, historyId)
      toast({
        title: 'Rollback thành công!',
        description: `Đã khôi phục prompt về phiên bản v${selectedHistory?.version}.`,
      })
      onRollbackSuccess()
      onOpenChange(false)
    } catch (err: any) {
      toast({
        title: 'Rollback thất bại',
        description: err.response?.data?.message || 'Không thể rollback phiên bản',
        variant: 'destructive',
      })
    } finally {
      setIsRollbacking(false)
    }
  }

  // Simple Word-level Diff logic between currentContent and historical content
  const renderSimpleDiff = (current: string, historical: string) => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground border-b pb-1">
            <span>Phiên bản hiện tại (Current)</span>
            <Badge variant="secondary" className="text-[10px]">Active</Badge>
          </div>
          <div className="bg-slate-900 text-slate-100 p-3 rounded text-xs font-mono whitespace-pre-wrap leading-relaxed max-h-[220px] overflow-y-auto border">
            {current}
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground border-b pb-1">
            <span>Phiên bản v{selectedHistory?.version} được chọn</span>
            <Badge variant="outline" className="text-[10px]">v{selectedHistory?.version}</Badge>
          </div>
          <div className="bg-slate-900 text-indigo-100 p-3 rounded text-xs font-mono whitespace-pre-wrap leading-relaxed max-h-[220px] overflow-y-auto border border-indigo-500/30">
            {historical}
          </div>
        </div>
      </div>
    )
  }

  if (!prompt) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <History className="h-5 w-5 text-indigo-500" />
            Lịch sử phiên bản System Prompt
          </DialogTitle>
          <DialogDescription>
            Xem lại lịch sử các lần chỉnh sửa, so sánh khác biệt và thực hiện Rollback phiên bản.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center p-8">
            <Spinner className="h-6 w-6 text-indigo-500" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-2">
            {/* Left side: Version list */}
            <div className="md:col-span-1 space-y-2 max-h-[450px] overflow-y-auto pr-1 border-r">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Danh sách phiên bản ({historyList.length})
              </p>
              {historyList.map((item) => {
                const isSelected = selectedHistory?.id === item.id
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedHistory(item)}
                    className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40 shadow-sm'
                        : 'hover:bg-muted/50 border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-indigo-600 dark:text-indigo-400">
                        Version v{item.version}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                      {item.changeReason || 'Chỉnh sửa prompt'}
                    </p>
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-2">
                      <User className="h-3 w-3" />
                      <span className="truncate">{item.createdBy}</span>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Right side: Diff view and Rollback action */}
            <div className="md:col-span-2 space-y-4">
              {selectedHistory ? (
                <>
                  <div className="bg-muted/30 p-3 rounded-lg border space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold">
                        Chi tiết phiên bản v{selectedHistory.version}
                      </span>
                      <Button
                        size="sm"
                        variant="default"
                        disabled={isRollbacking}
                        onClick={() => handleRollback(selectedHistory.id)}
                        className="bg-amber-600 hover:bg-amber-700 text-white text-xs h-8"
                      >
                        {isRollbacking ? (
                          <Spinner className="mr-1 h-3.5 w-3.5" />
                        ) : (
                          <RotateCcw className="mr-1 h-3.5 w-3.5" />
                        )}
                        Rollback về bản v{selectedHistory.version}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium">Lý do:</span> {selectedHistory.changeReason || 'Không có ghi chú'}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      <span className="font-medium">Bởi:</span> {selectedHistory.createdBy} vào {new Date(selectedHistory.createdAt).toLocaleString('vi-VN')}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-semibold">
                      <GitCompare className="h-4 w-4 text-indigo-500" />
                      <span>So sánh khác biệt (Diff View):</span>
                    </div>
                    {renderSimpleDiff(prompt.currentContent, selectedHistory.content)}
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground italic text-center p-8">
                  Vui lòng chọn một phiên bản lịch sử để xem chi tiết.
                </p>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
