'use client'

import {
  Wrench,
  ShieldAlert,
  Clock,
  Sparkles,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface PaymentMaintenanceModalProps {
  open: boolean
  onClose: () => void
}

export function PaymentMaintenanceModal({ open, onClose }: PaymentMaintenanceModalProps) {
  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="sm:max-w-md overflow-hidden p-0 rounded-2xl border border-amber-200 dark:border-amber-900/60 shadow-xl">
        {/* Banner trang trí với dải màu ấm áp & chuyên nghiệp */}
        <div className="relative bg-gradient-to-br from-amber-500/15 via-violet-500/10 to-transparent p-6 pb-4 border-b border-amber-100 dark:border-amber-950/80">
          <div className="flex items-center gap-3">
            <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-600 shadow-sm ring-4 ring-amber-50 dark:bg-amber-950/60 dark:text-amber-400 dark:ring-amber-950/40">
              <Wrench className="h-6 w-6 animate-pulse" />
              <div className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-violet-600 text-white shadow">
                <Sparkles className="h-2.5 w-2.5" />
              </div>
            </div>

            <div className="space-y-1">
              <Badge
                variant="outline"
                className="border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-300 text-[10px] font-semibold tracking-wide uppercase"
              >
                Bảo trì & Nâng cấp Kênh VietQR
              </Badge>
              <DialogTitle className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                Thông Báo Bảo Trì Kênh Thanh Toán
              </DialogTitle>
            </div>
          </div>
          <DialogDescription className="sr-only">
            Thông báo bảo trì hệ thống thanh toán tự động VietQR
          </DialogDescription>
        </div>

        {/* Thân thông điệp chuyên nghiệp, trang trọng */}
        <div className="px-6 py-4 space-y-4 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          <p>
            Kính gửi <strong>Quý Thầy/Cô và các bạn Học viên</strong>,
          </p>

          <p>
            Cổng nạp Credit tự động qua <strong>VietQR (Napas247)</strong> hiện đang tạm dừng tiếp nhận giao dịch mới để tiến hành bảo trì hạ tầng định kỳ và nâng cấp hệ thống đối soát thanh toán an toàn.
          </p>

          {/* Hộp cam kết an toàn & trạng thái */}
          <div className="rounded-xl border border-amber-200/80 bg-amber-50/60 p-3.5 dark:border-amber-900/40 dark:bg-amber-950/20 space-y-2 text-xs">
            <div className="flex items-start gap-2">
              <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  Số dư tài khoản an toàn tuyệt đối:
                </span>{' '}
                <span className="text-slate-600 dark:text-slate-400">
                  Số Credit hiện có của Quý khách vẫn được bảo lưu 100%. Mọi tính năng trợ lý AI vẫn hoạt động bình thường nếu tài khoản còn số dư.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2 pt-1 border-t border-amber-200/50 dark:border-amber-900/30">
              <Clock className="h-4 w-4 text-violet-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  Thời gian mở lại dự kiến:
                </span>{' '}
                <span className="text-slate-600 dark:text-slate-400">
                  Đội ngũ kỹ thuật đang khẩn trương tối ưu và sẽ mở lại kênh nạp tự động trong thời gian sớm nhất.
                </span>
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            Nếu Quý khách có nhu cầu bổ sung Credit khẩn cấp phục vụ giảng dạy hoặc làm bài tập, xin vui lòng liên hệ Ban Quản Trị để được hỗ trợ nạp thủ công nhanh chóng.
          </p>
        </div>

        {/* Footer điều hướng hành động */}
        <DialogFooter className="px-6 py-3 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={onClose}
            className="text-xs h-8 px-5 bg-violet-600 hover:bg-violet-700 text-white font-medium"
          >
            Đã hiểu
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
