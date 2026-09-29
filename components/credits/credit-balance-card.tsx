'use client'

import { Coins, TrendingUp, TrendingDown } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useMyCreditBalance } from '@/hooks/useCredits'
import { getCreditTaskLabel } from '@/lib/constants/credit'
import { useI18n } from '@/lib/i18n/i18n-context'

export function CreditBalanceCard() {
  const { t } = useI18n()
  const { data, isLoading } = useMyCreditBalance()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Coins className="h-5 w-5 text-amber-500" />
          {t('credits.title')}
        </CardTitle>
        <CardDescription>
          {t('credits.subheading')}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="flex items-center gap-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 p-5">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-500 text-white shadow">
            <Coins className="h-7 w-7" />
          </div>
          <div>
            <p className="text-xs font-medium text-amber-700">{t('credits.currentBalance')}</p>
            {isLoading ? (
              <Skeleton className="mt-1 h-9 w-28" />
            ) : (
              <p className="text-3xl font-extrabold text-amber-900">
                {data?.balance ?? 0}
                <span className="ml-1 text-base font-semibold text-amber-600">credit</span>
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-emerald-100 bg-emerald-50/60 p-3">
            <p className="flex items-center gap-1.5 text-xs font-medium text-emerald-700">
              <TrendingUp className="h-3.5 w-3.5" /> {t('credits.totalEarned')}
            </p>
            <p className="mt-1 text-lg font-bold text-emerald-900">{data?.totalEarned ?? 0}</p>
          </div>
          <div className="rounded-lg border border-rose-100 bg-rose-50/60 p-3">
            <p className="flex items-center gap-1.5 text-xs font-medium text-rose-700">
              <TrendingDown className="h-3.5 w-3.5" /> {t('credits.totalSpent')}
            </p>
            <p className="mt-1 text-lg font-bold text-rose-900">{data?.totalSpent ?? 0}</p>
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold text-slate-800">{t('credits.pricingTitle')}</p>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : (
            <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
              {(data?.costs || [])
                .filter((cost) => cost.task !== 'HANDWRITING_LATEX' && cost.task !== 'SKETCH_GEOMETRY')
                .map((cost) => (
                <li key={cost.task} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                  <span className="text-slate-700">{getCreditTaskLabel(cost.task, t)}</span>
                  <div className="text-right">
                    <span className="block font-semibold text-slate-900">
                      {cost.tokensPerCredit && cost.tokensPerCredit > 0
                        ? t('credits.tokenPricing', { tokens: cost.tokensPerCredit })
                        : t('credits.callPricing', { cost: cost.costPerCall })}
                    </span>
                    <span className="block text-[11px] text-slate-400">
                      {t('credits.minCallPricing', { cost: cost.costPerCall })}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
