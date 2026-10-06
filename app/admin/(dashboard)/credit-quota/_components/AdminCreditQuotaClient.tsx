'use client'

import { Coins } from 'lucide-react'
import { CreditQuotaTab } from '@/components/admin/ai-config/CreditQuotaTab'
import { useI18n } from '@/lib/i18n/i18n-context'

export function AdminCreditQuotaClient() {
  const { t } = useI18n()

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/50">
      {/* ── Synchronized Admin Header ── */}
      <div className="border-b border-border bg-white py-6">
        <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
                <Coins className="h-5.5 w-5.5" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                {t('Hạn mức Credit')}
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              {t('Quản lý chi phí tác vụ AI, hạn mức mặc định theo vai trò, gói credit và lịch sử biến động số dư.')}
            </p>
          </div>
        </div>
      </div>

      {/* ── Main Scroll Area ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 py-6 sm:py-8 space-y-6 w-full">
          <CreditQuotaTab />
        </div>
      </div>
    </div>
  )
}
