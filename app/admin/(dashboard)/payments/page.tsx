'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CreditCard, Building2, Receipt, Loader2 } from 'lucide-react'
import { PaymentConfigTab } from '@/components/admin/ai-config/PaymentConfigTab'
import { CreditOrdersTab } from '@/components/admin/ai-config/CreditOrdersTab'

function AdminPaymentsContent() {
  const searchParams = useSearchParams()
  const tabParam = searchParams.get('tab')
  const [activeTab, setActiveTab] = useState('payment-config')

  useEffect(() => {
    if (tabParam === 'orders' || tabParam === 'credit-orders') {
      setActiveTab('credit-orders')
    } else if (tabParam === 'config' || tabParam === 'payment-config') {
      setActiveTab('payment-config')
    }
  }, [tabParam])

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/50">
      {/* ── Synchronized Header ── */}
      <div className="border-b border-border bg-white py-6">
        <div className="mx-auto max-w-screen-xl px-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400">
                <CreditCard className="h-5.5 w-5.5" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Cổng VietQR & Đơn nạp
              </h1>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Quản lý tài khoản ngân hàng nhận tiền VietQR, webhook SePay và theo dõi, đối soát lịch sử đơn nạp credit.
            </p>
          </div>
        </div>
      </div>

      {/* ── Main Scroll Area ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-screen-xl px-6 py-8 space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
            <TabsList className="flex flex-wrap h-auto w-full max-w-md gap-1.5 p-1.5 bg-slate-200/60 rounded-xl">
              <TabsTrigger
                value="payment-config"
                className="flex-1 min-w-[150px] h-9 sm:h-10 flex items-center justify-center gap-2 px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-lg whitespace-nowrap data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm"
              >
                <Building2 className="h-4 w-4 shrink-0" />
                <span>Cổng VietQR & SePay</span>
              </TabsTrigger>
              <TabsTrigger
                value="credit-orders"
                className="flex-1 min-w-[150px] h-9 sm:h-10 flex items-center justify-center gap-2 px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-lg whitespace-nowrap data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm"
              >
                <Receipt className="h-4 w-4 shrink-0" />
                <span>Lịch sử Đơn nạp</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="payment-config" className="space-y-4">
              <PaymentConfigTab />
            </TabsContent>

            <TabsContent value="credit-orders" className="space-y-4">
              <CreditOrdersTab />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

export default function AdminPaymentsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <AdminPaymentsContent />
    </Suspense>
  )
}
