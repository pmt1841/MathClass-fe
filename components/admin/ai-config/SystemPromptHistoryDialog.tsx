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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  History,
  RotateCcw,
  GitCompare,
  User,
  AlertTriangle,
  Copy,
  Check,
  Calendar,
  FileText,
  Clock,
  ArrowRight,
  Sparkles,
} from 'lucide-react'
import {
  SystemPrompt,
  SystemPromptHistory,
  systemPromptService,
} from '@/services/systemPromptService'
import { useToast } from '@/components/ui/use-toast'
import { useI18n } from '@/lib/i18n/i18n-context'
import { formatDate, formatDateTime, formatTime } from '@/lib/utils'

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
  const { t } = useI18n()
  const { toast } = useToast()
  const [historyList, setHistoryList] = useState<SystemPromptHistory[]>([])
  const [selectedHistory, setSelectedHistory] = useState<SystemPromptHistory | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isRollbacking, setIsRollbacking] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [viewTab, setViewTab] = useState<'diff' | 'full'>('diff')
  const [isCopied, setIsCopied] = useState(false)

  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false)
  const [isRollbackConfirmOpen, setIsRollbackConfirmOpen] = useState(false)

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
        title: t('Lỗi nạp lịch sử'),
        description: err.response?.data?.message || t('Không thể tải lịch sử phiên bản'),
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRollbackClick = () => {
    if (!prompt || !selectedHistory) return
    setIsRollbackConfirmOpen(true)
  }

  const confirmRollback = async () => {
    if (!prompt || !selectedHistory) return

    setIsRollbacking(true)
    try {
      await systemPromptService.rollbackToVersion(prompt.id, selectedHistory.id)
      toast({
        title: t('Rollback thành công!'),
        description: t('Đã khôi phục prompt về phiên bản v{version}.', { version: selectedHistory.version }),
      })
      setIsRollbackConfirmOpen(false)
      onRollbackSuccess()
      onOpenChange(false)
    } catch (err: any) {
      toast({
        title: t('Rollback thất bại'),
        description: err.response?.data?.message || t('Không thể rollback phiên bản'),
        variant: 'destructive',
      })
    } finally {
      setIsRollbacking(false)
    }
  }

  const handleResetClick = () => {
    if (!prompt) return
    setIsResetConfirmOpen(true)
  }

  const confirmResetToDefault = async () => {
    if (!prompt) return

    setIsResetting(true)
    try {
      await systemPromptService.resetToDefault(
        prompt.id,
        t('Khôi phục về nội dung mặc định của hệ thống từ lịch sử')
      )
      toast({
        title: t('Khôi phục thành công!'),
        description: t('Prompt "{name}" đã được đặt về nội dung mặc định.', { name: prompt.name }),
      })
      setIsResetConfirmOpen(false)
      onRollbackSuccess()
      onOpenChange(false)
    } catch (err: any) {
      toast({
        title: t('Khôi phục thất bại'),
        description: err.response?.data?.message || t('Không thể khôi phục prompt về mặc định'),
        variant: 'destructive',
      })
    } finally {
      setIsResetting(false)
    }
  }

  const handleCopySelectedContent = () => {
    if (selectedHistory?.content) {
      navigator.clipboard.writeText(selectedHistory.content)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    }
  }

  if (!prompt) return null

  const isCurrentVersion = selectedHistory?.content === prompt.currentContent

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="max-w-[95vw] lg:max-w-5xl max-h-[92vh] overflow-y-auto p-4 sm:p-6"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          {/* Header */}
          <DialogHeader className="pb-3 border-b">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="space-y-1">
                <DialogTitle className="flex items-center gap-2.5 text-lg sm:text-xl font-bold">
                  <div className="h-8 w-8 rounded-lg bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                    <History className="h-4 w-4" />
                  </div>
                  <span>{t('Lịch sử phiên bản: {name}', { name: t(prompt.name) })}</span>
                </DialogTitle>
                <DialogDescription className="text-xs sm:text-sm text-muted-foreground">
                  {t('Theo dõi các mốc chỉnh sửa, so sánh khác biệt nội dung và khôi phục về các phiên bản trước đó.')}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-16 gap-3">
              <Spinner className="h-8 w-8 text-indigo-600" />
              <p className="text-xs text-muted-foreground">{t('Đang tải danh sách lịch sử phiên bản...')}</p>
            </div>
          ) : historyList.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <History className="h-10 w-10 text-muted-foreground mx-auto stroke-1" />
              <p className="text-sm font-semibold">{t('Chưa có lịch sử phiên bản')}</p>
              <p className="text-xs text-muted-foreground">
                {t('Lịch sử sẽ được tự động ghi lại mỗi khi bạn chỉnh sửa và lưu Prompt.')}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 py-2">
              {/* LEFT COLUMN: Visual Version Timeline (5 cols) */}
              <div className="lg:col-span-4 flex flex-col space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {t('Dòng thời gian ({count} phiên bản)', { count: historyList.length })}
                  </span>
                </div>

                <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
                  {historyList.map((item, index) => {
                    const isSelected = selectedHistory?.id === item.id
                    const isLatest = index === 0
                    const isOriginal = index === historyList.length - 1

                    return (
                      <div
                        key={item.id}
                        onClick={() => setSelectedHistory(item)}
                        className={`p-3 rounded-xl border text-left cursor-pointer transition-all relative ${
                          isSelected
                            ? 'border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/50 shadow-sm ring-1 ring-indigo-500/20'
                            : 'border-border hover:bg-muted/40'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1.5 mb-1.5">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`font-bold text-xs sm:text-sm ${
                                isSelected
                                  ? 'text-indigo-600 dark:text-indigo-400'
                                  : 'text-foreground'
                              }`}
                            >
                              {t('Phiên bản v{version}', { version: item.version })}
                            </span>
                            {isLatest && (
                              <Badge
                                variant="secondary"
                                className="text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 font-medium px-1.5 py-0"
                              >
                                {t('Hiện tại')}
                              </Badge>
                            )}
                            {isOriginal && !isLatest && (
                              <Badge
                                variant="outline"
                                className="text-[10px] text-muted-foreground px-1.5 py-0"
                              >
                                {t('Bản gốc v1')}
                              </Badge>
                            )}
                          </div>
                          <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                            {formatDate(item.createdAt)}
                          </span>
                        </div>

                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                          {item.changeReason || t('Chỉnh sửa và cập nhật nội dung prompt')}
                        </p>

                        <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-2 pt-2 border-t border-border/50">
                          <div className="flex items-center gap-1 truncate max-w-[120px]">
                            <User className="h-3 w-3 shrink-0" />
                            <span className="truncate">{item.createdBy || 'Admin'}</span>
                          </div>
                          <span className="font-mono text-[10px]">
                            {formatTime(item.createdAt)}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* RIGHT COLUMN: Detail & Diff Viewer (7 cols) */}
              <div className="lg:col-span-8 flex flex-col space-y-3">
                {selectedHistory ? (
                  <>
                    {/* Version Metadata & Action Banner */}
                    <div className="p-3.5 bg-card border rounded-xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-foreground">
                            {t('Chi tiết phiên bản v{version}', { version: selectedHistory.version })}
                          </span>
                          {isCurrentVersion && (
                            <Badge
                              variant="outline"
                              className="text-[10px] border-emerald-400 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40"
                            >
                              {t('Khớp với bản đang chạy')}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          <span className="font-medium text-foreground">{t('Lý do thay đổi:')}</span>{' '}
                          {selectedHistory.changeReason || t('Không có ghi chú chi tiết')}
                        </p>
                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground pt-0.5">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3 text-indigo-500" />
                            {selectedHistory.createdBy || 'Admin'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-indigo-500" />
                            {formatDateTime(selectedHistory.createdAt)}
                          </span>
                        </div>
                      </div>

                      {!isCurrentVersion && (
                        <Button
                          size="sm"
                          disabled={isRollbacking || isResetting}
                          onClick={handleRollbackClick}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-9 px-3 shrink-0 shadow-sm flex items-center gap-1.5"
                        >
                          {isRollbacking ? (
                            <Spinner className="h-3.5 w-3.5" />
                          ) : (
                            <RotateCcw className="h-3.5 w-3.5" />
                          )}
                          <span>{t('Khôi phục về bản v{version}', { version: selectedHistory.version })}</span>
                        </Button>
                      )}
                    </div>

                    {/* View Options Tabs */}
                    <div className="border rounded-xl flex-1 flex flex-col bg-card overflow-hidden shadow-sm min-h-[340px]">
                      <Tabs
                        value={viewTab}
                        onValueChange={(val: any) => setViewTab(val)}
                        className="flex-1 flex flex-col"
                      >
                        <div className="flex items-center justify-between border-b px-3 py-2 bg-muted/30">
                          <TabsList className="h-8 p-0.5 bg-muted">
                            <TabsTrigger
                              value="diff"
                              className="text-xs h-7 px-3 flex items-center gap-1.5"
                            >
                              <GitCompare className="h-3.5 w-3.5" />
                              {t('So sánh khác biệt (Side-by-side)')}
                            </TabsTrigger>
                            <TabsTrigger
                              value="full"
                              className="text-xs h-7 px-3 flex items-center gap-1.5"
                            >
                              <FileText className="h-3.5 w-3.5" />
                              {t('Xem toàn văn')}
                            </TabsTrigger>
                          </TabsList>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleCopySelectedContent}
                            className="h-7 px-2.5 text-xs text-muted-foreground hover:text-foreground"
                          >
                            {isCopied ? (
                              <>
                                <Check className="mr-1 h-3 w-3 text-emerald-600" /> {t('Đã chép')}
                              </>
                            ) : (
                              <>
                                <Copy className="mr-1 h-3 w-3" /> {t('Sao chép bản này')}
                              </>
                            )}
                          </Button>
                        </div>

                        {/* Tab 1: Side-by-side Diff */}
                        <TabsContent
                          value="diff"
                          className="flex-1 p-3.5 overflow-y-auto max-h-[350px]"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 h-full">
                            {/* Left Box: Current Version */}
                            <div className="space-y-1.5 flex flex-col">
                              <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground px-1">
                                <span className="flex items-center gap-1">
                                  {t('Bản hiện tại')}
                                  <Badge variant="outline" className="text-[10px] py-0 px-1 font-mono">
                                    Active
                                  </Badge>
                                </span>
                                <span className="font-mono text-[10px] text-muted-foreground">
                                  {t('{count} ký tự', { count: prompt.currentContent.length })}
                                </span>
                              </div>
                              <div className="flex-1 bg-muted/40 p-3 rounded-lg border text-xs font-mono whitespace-pre-wrap leading-relaxed max-h-[300px] overflow-y-auto text-foreground">
                                {prompt.currentContent}
                              </div>
                            </div>

                            {/* Right Box: Selected History Version */}
                            <div className="space-y-1.5 flex flex-col">
                              <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground px-1">
                                <span className="flex items-center gap-1">
                                  {t('Bản v{version}', { version: selectedHistory.version })}
                                  <Badge
                                    variant="secondary"
                                    className="text-[10px] py-0 px-1 font-mono bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300"
                                  >
                                    {t('Đang chọn')}
                                  </Badge>
                                </span>
                                <span className="font-mono text-[10px] text-muted-foreground">
                                  {t('{count} ký tự', { count: selectedHistory.content.length })}
                                </span>
                              </div>
                              <div className="flex-1 bg-indigo-50/40 dark:bg-indigo-950/20 p-3 rounded-lg border border-indigo-200 dark:border-indigo-800 text-xs font-mono whitespace-pre-wrap leading-relaxed max-h-[300px] overflow-y-auto text-foreground">
                                {selectedHistory.content}
                              </div>
                            </div>
                          </div>
                        </TabsContent>

                        {/* Tab 2: Full Text View */}
                        <TabsContent
                          value="full"
                          className="flex-1 p-3.5 overflow-y-auto max-h-[350px] bg-slate-950 text-slate-100 font-mono text-xs rounded-b-xl"
                        >
                          <pre className="whitespace-pre-wrap leading-relaxed text-slate-200">
                            {selectedHistory.content}
                          </pre>
                        </TabsContent>
                      </Tabs>
                    </div>
                  </>
                ) : (
                  <div className="p-12 text-center text-xs text-muted-foreground">
                    {t('Vui lòng chọn một phiên bản ở cột trái để xem chi tiết.')}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Modal Footer */}
          <DialogFooter className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-3 border-t">
            <Button
              type="button"
              variant="outline"
              disabled={isResetting || isRollbacking}
              onClick={handleResetClick}
              className="w-full sm:w-auto text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950 border-amber-300 dark:border-amber-700 text-xs h-8"
            >
              {isResetting ? (
                <Spinner className="mr-1.5 h-3.5 w-3.5" />
              ) : (
                <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
              )}
              {t('Khôi phục về bản gốc mặc định')}
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs h-8 w-full sm:w-auto"
            >
              {t('Đóng')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Modal for Reset to Default */}
      <AlertDialog open={isResetConfirmOpen} onOpenChange={setIsResetConfirmOpen}>
        <AlertDialogContent onOpenAutoFocus={(e) => e.preventDefault()}>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-500">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              {t('Xác nhận khôi phục bản gốc ban đầu?')}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs sm:text-sm leading-relaxed text-muted-foreground">
              {t('Bạn có chắc chắn muốn đưa System Prompt {name} về nội dung mặc định ban đầu của hệ thống không?', { name: prompt.name })}
              <br />
              <span className="text-amber-600 dark:text-amber-400 mt-2 block font-medium">
                {t('Hành động này sẽ ghi đè nội dung hiện tại bằng cấu hình gốc xuất xưởng của hệ thống.')}
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isResetting}>{t('Hủy')}</AlertDialogCancel>
            <AlertDialogAction
              disabled={isResetting}
              onClick={confirmResetToDefault}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {isResetting ? <Spinner className="mr-2 h-4 w-4" /> : null}
              {t('Xác nhận khôi phục')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirmation Modal for Rollback */}
      <AlertDialog open={isRollbackConfirmOpen} onOpenChange={setIsRollbackConfirmOpen}>
        <AlertDialogContent onOpenAutoFocus={(e) => e.preventDefault()}>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
              <RotateCcw className="h-5 w-5 shrink-0" />
              {t('Xác nhận Rollback phiên bản?')}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs sm:text-sm leading-relaxed text-muted-foreground">
              {t('Bạn có chắc chắn muốn khôi phục System Prompt {name} về phiên bản v{version} không?', { name: prompt.name, version: selectedHistory?.version })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRollbacking}>{t('Hủy')}</AlertDialogCancel>
            <AlertDialogAction
              disabled={isRollbacking}
              onClick={confirmRollback}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {isRollbacking ? <Spinner className="mr-2 h-4 w-4" /> : null}
              {t('Xác nhận Rollback')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
