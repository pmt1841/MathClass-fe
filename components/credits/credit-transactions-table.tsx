'use client'

import { useState } from 'react'
import { History, Filter, ChevronLeft, ChevronRight } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useMyCreditTransactions, CreditTransactionItem } from '@/hooks/useCredits'
import { formatCreditTransactionDescription } from '@/lib/constants/credit'
import { formatDateTime, cn } from '@/lib/utils'
import { useI18n } from '@/lib/i18n/i18n-context'

export function CreditTransactionsTable() {
  const { t } = useI18n()
  const [typeFilter, setTypeFilter] = useState<string>('ALL')
  const [page, setPage] = useState<number>(0)
  const [pageSize, setPageSize] = useState<number>(15)

  const transactionTypeLabels: Record<string, { labelKey: string; color: string }> = {
    GRANT_DEFAULT: { labelKey: 'credits.grantDefault', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
    PURCHASE: { labelKey: 'credits.purchase', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' },
    ADMIN_ADJUST: { labelKey: 'credits.adminAdjust', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
    CONSUME: { labelKey: 'credits.consume', color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300' },
    REFUND: { labelKey: 'credits.refund', color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300' },
  }

  const { data, isLoading, isFetching } = useMyCreditTransactions({
    type: typeFilter === 'ALL' ? undefined : typeFilter,
    page,
    size: pageSize,
  })

  const isInitialLoading = isLoading && !data
  const transactions = data?.content ?? []
  const totalPages = data?.totalPages ?? 0
  const totalElements = data?.totalElements ?? 0

  const handleFilterChange = (value: string) => {
    setTypeFilter(value)
    setPage(0)
  }

  const handlePageSizeChange = (value: string) => {
    setPageSize(Number(value))
    setPage(0)
  }

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-slate-500" />
            {t('credits.transactionsTitle')}
          </CardTitle>
          <CardDescription>{t('credits.transactionsSubheading')}</CardDescription>
        </div>

        {/* Nút select đổi qua lại giữa các loại giao dịch */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
          <Select value={typeFilter} onValueChange={handleFilterChange}>
            <SelectTrigger className="w-[190px] h-9 text-xs">
              <SelectValue placeholder={t('credits.filterPlaceholder')} />
            </SelectTrigger>
            <SelectContent onCloseAutoFocus={(e) => e.preventDefault()}>
              <SelectItem value="ALL">{t('credits.allTransactions')}</SelectItem>
              <SelectItem value="CONSUME">{t('credits.consume')}</SelectItem>
              <SelectItem value="PURCHASE">{t('credits.purchase')}</SelectItem>
              <SelectItem value="REFUND">{t('credits.refund')}</SelectItem>
              <SelectItem value="GRANT_DEFAULT">{t('credits.grantDefault')}</SelectItem>
              <SelectItem value="ADMIN_ADJUST">{t('credits.adminAdjust')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {isInitialLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
          </div>
        ) : transactions.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">
            {typeFilter !== 'ALL'
              ? t('credits.noTransactionsFilter')
              : t('credits.noTransactionsYet')}
          </p>
        ) : (
          <div className={cn('overflow-x-auto transition-opacity duration-200', isFetching && 'opacity-60')}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('credits.time')}</TableHead>
                  <TableHead>{t('credits.type')}</TableHead>
                  <TableHead>{t('credits.description')}</TableHead>
                  <TableHead className="text-right">{t('credits.amount')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((txn) => (
                  <TableRow key={txn.id}>
                    <TableCell className="text-xs text-slate-500 whitespace-nowrap">
                      {formatDateTime(txn.createdAt)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={cn(
                          'font-medium',
                          transactionTypeLabels[txn.type]?.color ?? 'bg-slate-100 text-slate-600'
                        )}
                      >
                        {transactionTypeLabels[txn.type]?.labelKey ? t(transactionTypeLabels[txn.type].labelKey) : txn.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-slate-600">
                      {formatCreditTransactionDescription(txn.description, txn.task, t)}
                    </TableCell>
                    <TableCell
                      className={cn(
                        'text-right font-bold whitespace-nowrap',
                        (txn.amount ?? 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'
                      )}
                    >
                      {(txn.amount ?? 0) >= 0 ? '+' : ''}
                      {txn.amount}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Thanh phân trang */}
        {!isInitialLoading && totalElements > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span>
                {t('credits.paginationInfo', { page: page + 1, total: Math.max(1, totalPages), count: totalElements })}
              </span>
              <div className="flex items-center gap-1.5">
                <span>{t('credits.rowsPerPage')}</span>
                <Select value={String(pageSize)} onValueChange={handlePageSizeChange}>
                  <SelectTrigger className="h-7 w-[68px] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent onCloseAutoFocus={(e) => e.preventDefault()}>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="15">15</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-2.5 text-xs gap-1"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page <= 0 || isFetching}
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  <span>{t('credits.prev')}</span>
                </Button>

                <div className="flex items-center gap-1">
                  {totalPages <= 5
                    ? Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                        <Button
                          key={p}
                          variant={page === p - 1 ? 'default' : 'outline'}
                          size="sm"
                          className={cn(
                            'h-8 w-8 p-0 text-xs',
                            page === p - 1 && 'bg-slate-900 text-white hover:bg-slate-800'
                          )}
                          onClick={() => setPage(p - 1)}
                          disabled={isFetching}
                        >
                          {p}
                        </Button>
                      ))
                    : Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter((p) => p === 1 || p === totalPages || Math.abs(p - 1 - page) <= 1)
                        .reduce<(number | string)[]>((acc, p, idx, arr) => {
                          if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) {
                            acc.push('...')
                          }
                          acc.push(p)
                          return acc
                        }, [])
                        .map((p, idx) =>
                          typeof p === 'string' ? (
                            <span key={`ellipsis-${idx}`} className="px-1 text-xs text-muted-foreground">
                              ...
                            </span>
                          ) : (
                            <Button
                              key={p}
                              variant={page === (p as number) - 1 ? 'default' : 'outline'}
                              size="sm"
                              className={cn(
                                'h-8 w-8 p-0 text-xs',
                                page === (p as number) - 1 && 'bg-slate-900 text-white hover:bg-slate-800'
                              )}
                              onClick={() => setPage((p as number) - 1)}
                              disabled={isFetching}
                            >
                              {p}
                            </Button>
                          )
                        )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-2.5 text-xs gap-1"
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1 || isFetching}
                >
                  <span>{t('credits.next')}</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export type { CreditTransactionItem }
