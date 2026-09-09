import React from 'react'
import { Coins, Package, TrendingUp } from 'lucide-react'
import { PackageSales } from '@/types/admin-dashboard'

interface CreditPackageSalesCardProps {
  packageSales: PackageSales[]
}

export function CreditPackageSalesCard({ packageSales }: CreditPackageSalesCardProps) {
  const maxSales = Math.max(...packageSales.map((p) => p.salesCount), 1)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="flex flex-col h-full rounded-2xl border bg-card/60 backdrop-blur-sm p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <Coins className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground text-sm flex items-center gap-1.5">
              Thống Kê Lượt Mua Gói Credit
            </h3>
            <p className="text-xs text-muted-foreground">
              Độ phổ biến của các gói nạp trong hệ thống
            </p>
          </div>
        </div>
      </div>

      {/* Package List */}
      <div className="mt-5 space-y-4 flex-1">
        {packageSales.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center text-xs text-muted-foreground">
            <Package className="h-8 w-8 text-muted-foreground/40 mb-2" />
            Chưa có gói credit nào được cấu hình
          </div>
        ) : (
          packageSales.map((pkg, idx) => {
            const percentage = Math.round((pkg.salesCount / maxSales) * 100)
            return (
              <div key={pkg.packageId} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted font-bold text-[10px] text-muted-foreground">
                      #{idx + 1}
                    </span>
                    <span className="font-semibold text-foreground truncate">
                      {pkg.packageName}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      ({pkg.credits.toLocaleString()} credits)
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-bold text-foreground">
                      {pkg.salesCount} lượt
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      • {formatCurrency(pkg.price)}
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="h-2 w-full rounded-full bg-muted/40 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            )
          })
        )}
      </div>

      <div className="mt-4 pt-3 border-t flex items-center justify-between text-xs text-muted-foreground">
        <span>Tự động cập nhật theo đơn mua thành công</span>
        <span className="inline-flex items-center gap-1 font-medium text-amber-600 dark:text-amber-400">
          <TrendingUp className="h-3.5 w-3.5" /> Doanh số thực tế
        </span>
      </div>
    </div>
  )
}
