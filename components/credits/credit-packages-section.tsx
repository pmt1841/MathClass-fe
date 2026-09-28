'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Coins, Loader2, Zap, Wrench } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useCreditPackages, usePurchaseCredit, CreditPackage } from '@/hooks/useCredits'
import { usePublicPaymentConfig } from '@/hooks/usePaymentConfig'
import { CreditPurchaseOrder } from '@/services/creditService'
import { PaymentQrModal } from '@/components/credits/PaymentQrModal'
import { PaymentMaintenanceModal } from '@/components/credits/PaymentMaintenanceModal'
import { handleApiError } from '@/lib/utils/error-handler'

export function formatVnd(price: number): string {
  return `${new Intl.NumberFormat('vi-VN').format(price)}đ`
}

export function CreditPackagesSection() {
  const { data: packages, isLoading } = useCreditPackages()
  const { data: paymentConfig } = usePublicPaymentConfig()
  const purchaseMutation = usePurchaseCredit()
  const [buyingId, setBuyingId] = useState<number | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<CreditPurchaseOrder | null>(null)
  const [selectedPackage, setSelectedPackage] = useState<CreditPackage | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isMaintenanceOpen, setIsMaintenanceOpen] = useState(false)

  const handleBuy = async (pkg: CreditPackage) => {
    // Nếu kênh VietQR đang tắt kích hoạt trong cài đặt quản trị -> Hiển thị Modal bảo trì
    if (paymentConfig && paymentConfig.isActive === false) {
      setIsMaintenanceOpen(true)
      return
    }

    setBuyingId(pkg.id)
    setSelectedPackage(pkg)
    try {
      const order = await purchaseMutation.mutateAsync(pkg.id)
      if (order.status === 'SUCCESS') {
        const added = order.creditsAdded ?? pkg.credits
        toast.success(`Đã nạp ${added} credit vào tài khoản. Số dư mới: ${order.newBalance ?? ''}`)
      } else {
        setSelectedOrder(order)
        setIsModalOpen(true)
      }
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } }
      const msg = (err?.response?.data?.message || '').toLowerCase()
      if (msg.includes('bảo trì') || msg.includes('maintenance')) {
        setIsMaintenanceOpen(true)
      } else {
        toast.error(handleApiError(e, 'Không thể khởi tạo đơn mua credit lúc này. Vui lòng thử lại sau.'))
      }
    } finally {
      setBuyingId(null)
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-violet-500" />
            Nạp thêm credit
          </CardTitle>
          <CardDescription>
            Chọn gói để nạp. Quét mã VietQR chuyển tiền tự động, credit sẽ được cộng ngay lập tức.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {paymentConfig?.isActive === false && (
            <div className="mb-4 flex items-center gap-2.5 rounded-xl border border-amber-200 bg-amber-50/80 px-3.5 py-2.5 text-xs text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300">
              <Wrench className="h-4 w-4 shrink-0 text-amber-600 animate-pulse" />
              <span>
                Cổng VietQR đang trong quá trình bảo trì định kỳ. Quý khách vẫn có thể nhấn vào gói để xem chi tiết hướng dẫn.
              </span>
            </div>
          )}

          {isLoading ? (
            <div className="grid gap-3 sm:grid-cols-3">
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-3">
              {(packages || []).map((pkg) => (
                <div
                  key={pkg.id}
                  className="flex flex-col rounded-xl border border-slate-200 bg-slate-50/60 p-5 transition-shadow hover:shadow-md"
                >
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-100 text-violet-600">
                      <Coins className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{pkg.name}</p>
                      <p className="text-xs text-slate-500">{formatVnd(pkg.price)}</p>
                    </div>
                  </div>

                  <p className="mt-4 text-2xl font-extrabold text-violet-700">
                    {pkg.credits}
                    <span className="ml-1 text-sm font-medium text-slate-400">credit</span>
                  </p>

                  <Button
                    className="mt-4"
                    disabled={buyingId === pkg.id || purchaseMutation.isPending}
                    onClick={() => handleBuy(pkg)}
                  >
                    {buyingId === pkg.id ? (
                      <>
                        <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                        Đang tạo đơn...
                      </>
                    ) : (
                      'Nạp ngay'
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <PaymentQrModal
        order={selectedOrder}
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onNewOrder={() => {
          setIsModalOpen(false)
          if (selectedPackage) {
            handleBuy(selectedPackage)
          }
        }}
      />

      <PaymentMaintenanceModal
        open={isMaintenanceOpen}
        onClose={() => setIsMaintenanceOpen(false)}
      />
    </>
  )
}
