'use client'

import { CreditBalanceCard } from '@/components/credits/credit-balance-card'
import { CreditPackagesSection } from '@/components/credits/credit-packages-section'
import { CreditTransactionsTable } from '@/components/credits/credit-transactions-table'
import { Coins } from 'lucide-react'

export default function CreditsPage() {
  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/50">
      <div className="border-b border-border bg-white py-6">
        <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <Coins className="h-5.5 w-5.5 text-primary" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Ví Credit AI</h1>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Credit dùng chung cho các tính năng AI (gợi ý, chấm bài, sinh đề...). Hết credit vui lòng nạp thêm.
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 py-6 sm:py-8 space-y-6 w-full">
          <div className="grid gap-6 lg:grid-cols-2">
            <CreditBalanceCard />
            <div className="space-y-6">
              <CreditPackagesSection />
            </div>
          </div>
          <CreditTransactionsTable />
        </div>
      </div>
    </div>
  )
}

