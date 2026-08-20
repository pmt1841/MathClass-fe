'use client'

import { History } from 'lucide-react'
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
import { useMyCreditTransactions, CreditTransactionItem } from '@/hooks/useCredits'
import { getCreditTaskLabel } from '@/lib/constants/credit'
import { formatDateTime } from '@/lib/utils'

const TRANSACTION_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  GRANT_DEFAULT: { label: 'Cấp mặc định', color: 'bg-blue-100 text-blue-700' },
  PURCHASE: { label: 'Nạp credit', color: 'bg-emerald-100 text-emerald-700' },
  ADMIN_ADJUST: { label: 'Điều chỉnh', color: 'bg-amber-100 text-amber-700' },
  CONSUME: { label: 'Tiêu thụ', color: 'bg-rose-100 text-rose-700' },
  REFUND: { label: 'Hoàn lại', color: 'bg-violet-100 text-violet-700' },
}

export function CreditTransactionsTable() {
  const { data: transactions, isLoading } = useMyCreditTransactions()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5 text-slate-500" />
          Lịch sử giao dịch
        </CardTitle>
        <CardDescription>Toàn bộ biến động credit của tài khoản.</CardDescription>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
          </div>
        ) : (transactions || []).length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">Chưa có giao dịch nào.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Thời gian</TableHead>
                <TableHead>Loại</TableHead>
                <TableHead>Nội dung</TableHead>
                <TableHead className="text-right">Số credit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(transactions || []).map((txn) => (
                <TableRow key={txn.id}>
                  <TableCell className="text-xs text-slate-500">
                    {formatDateTime(txn.createdAt)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={`font-medium ${TRANSACTION_TYPE_LABELS[txn.type]?.color ?? 'bg-slate-100 text-slate-600'}`}
                    >
                      {TRANSACTION_TYPE_LABELS[txn.type]?.label ?? txn.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-slate-600">
                    {txn.description ||
                      (txn.task ? `Tác vụ ${getCreditTaskLabel(txn.task)}` : '') ||
                      '—'}
                  </TableCell>
                  <TableCell
                    className={`text-right font-bold ${
                      (txn.amount ?? 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {(txn.amount ?? 0) >= 0 ? '+' : ''}
                    {txn.amount}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}

export type { CreditTransactionItem }
