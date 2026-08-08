'use client'

import { CreditBalanceCard } from '@/components/credits/credit-balance-card'
import { CreditPackagesSection } from '@/components/credits/credit-packages-section'
import { CreditTransactionsTable } from '@/components/credits/credit-transactions-table'

export default function CreditsPage() {
  return (
    <div className="flex-1 space-y-6 p-8 pt-6 overflow-y-auto">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Ví Credit AI</h2>
        <p className="text-sm text-muted-foreground">
          Credit dùng chung cho các tính năng AI (gợi ý, chấm bài, sinh đề...). Hết credit vui lòng nạp thêm.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <CreditBalanceCard />
        <div className="space-y-6">
          <CreditPackagesSection />
        </div>
      </div>

      <CreditTransactionsTable />
    </div>
  )
}
