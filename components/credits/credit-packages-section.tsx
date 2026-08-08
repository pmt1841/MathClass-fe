'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Coins, Loader2, Zap } from 'lucide-react'
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
import { handleApiError } from '@/lib/utils/error-handler'

export function formatVnd(price: number): string {
  return `${new Intl.NumberFormat('vi-VN').format(price)}đ`
}

export function CreditPackagesSection() {
  const { data: packages, isLoading } = useCreditPackages()
  const purchaseMutation = usePurchaseCredit()
  const [buyingId, setBuyingId] = useState<number | null>(null)

  const handleBuy = async (pkg: CreditPackage) => {
    setBuyingId(pkg.id)
    try {
      const order = await purchaseMutation.mutateAsync(pkg.id)
      const added = order.creditsAdded ?? pkg.credits
      toast.success(`Đã nạp ${added} credit vào tài khoản. Số dư mới: ${order.newBalance ?? ''}`)
    } catch (e) {
      toast.error(handleApiError(e, 'Không thể mua gói credit lúc này. Vui lòng thử lại sau.'))
    } finally {
      setBuyingId(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-violet-500" />
          Nạp thêm credit
        </CardTitle>
        <CardDescription>
          Chọn gói để nạp. Credit được cộng ngay sau khi thanh toán (đang dùng cổng thanh toán thử nghiệm).
        </CardDescription>
      </CardHeader>

      <CardContent>
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
                      Đang nạp...
                    </>
                  ) : (
                    'Mua ngay'
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
