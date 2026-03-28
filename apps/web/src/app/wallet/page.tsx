"use client"

import WalletCard from '@/components/wallet/WalletCard'
import Card from '@/components/ui/Card'
import { ArrowUpRight, ArrowDownLeft, Clock } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import Container from '@/components/ui/Container'
import Badge from '@/components/ui/Badge'
import { useI18n } from '@/components/i18n/I18nProvider'

export default function WalletPage() {
  const { t } = useI18n()

  const mockTransactions = [
    {
      id: '1',
      type: 'CHALLENGE_WIN',
      amount: 45000,
      description: 'FIFA 24 1v1 Championship - 1st Place',
      status: 'COMPLETED',
      createdAt: new Date().toISOString(),
    },
    {
      id: '2',
      type: 'CHALLENGE_ENTRY',
      amount: -5000,
      description: 'Joined COD Warzone Squad Battle',
      status: 'COMPLETED',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: '3',
      type: 'DEPOSIT',
      amount: 100000,
      description: 'Deposit via Flutterwave',
      status: 'COMPLETED',
      createdAt: new Date(Date.now() - 7200000).toISOString(),
    },
    {
      id: '4',
      type: 'WITHDRAWAL',
      amount: -50000,
      description: 'Withdrawal to bank account',
      status: 'PENDING',
      createdAt: new Date(Date.now() - 10800000).toISOString(),
    },
    {
      id: '5',
      type: 'CHALLENGE_WIN',
      amount: 30000,
      description: 'Fortnite Solo Tournament - 2nd Place',
      status: 'COMPLETED',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
  ]

  const getTransactionIcon = (type: string) => {
    if (type === 'DEPOSIT' || type === 'CHALLENGE_WIN') {
      return <ArrowDownLeft className="w-5 h-5 text-secondary" />
    }
    return <ArrowUpRight className="w-5 h-5 text-accent" />
  }

  const getStatusColor = (status: string) => {
    // Strict palette: no green/yellow. Use secondary for success/info, accent for danger.
    if (status === 'COMPLETED') return 'success'
    if (status === 'PENDING') return 'info'
    return 'danger'
  }

  const formatCompactAmount = (amount: number) => {
    const absoluteAmount = Math.abs(amount)

    if (absoluteAmount >= 1000000) {
      return `${amount > 0 ? '+' : ''}${(absoluteAmount / 1000000).toFixed(absoluteAmount % 1000000 === 0 ? 0 : 1)}M XOF`
    }

    if (absoluteAmount >= 1000) {
      return `${amount > 0 ? '+' : ''}${(absoluteAmount / 1000).toFixed(absoluteAmount % 1000 === 0 ? 0 : 1)}K XOF`
    }

    return `${amount > 0 ? '+' : ''}${formatCurrency(absoluteAmount)}`
  }

  return (
    <div className="min-h-screen">
      <main className="pb-12">
        <Container>
        <h1 className="text-4xl font-bold text-primary dark:text-white mb-8 title-tech">{t('wallet.title')}</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <WalletCard balance={125000} />
          </div>

          <Card>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-primary/70 dark:text-white/60 mb-1">Total Deposits</p>
                <p className="text-2xl font-bold text-secondary">
                  {formatCurrency(500000)}
                </p>
              </div>
              <div>
                <p className="text-sm text-primary/70 dark:text-white/60 mb-1">Total Withdrawals</p>
                <p className="text-2xl font-bold text-accent">
                  {formatCurrency(250000)}
                </p>
              </div>
              <div>
                <p className="text-sm text-primary/70 dark:text-white/60 mb-1">Total Winnings</p>
                <p className="text-2xl font-bold text-secondary">
                  {formatCurrency(375000)}
                </p>
              </div>
            </div>
          </Card>
        </div>

        <Card>
          <div className="mb-4 flex items-center justify-between sm:mb-6">
            <h2 className="text-xl font-bold text-primary dark:text-white sm:text-2xl">Transaction History</h2>
            <Clock className="w-4 h-4 text-primary/60 dark:text-white/55 sm:w-5 sm:h-5" />
          </div>

          <div className="space-y-3">
            {mockTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="rounded-lg bg-white/40 dark:bg-white/5 border border-primary/10 dark:border-white/10 p-3 sm:p-4 hover:border-primary/20 dark:hover:border-white/20 transition duration-200"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 dark:bg-black/25 border border-primary/20 dark:border-white/10">
                      {getTransactionIcon(transaction.type)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-base font-semibold text-primary dark:text-white sm:text-lg break-words">
                        {transaction.description}
                      </p>
                      <p className="text-sm text-primary/70 dark:text-white/60">{formatDate(transaction.createdAt)}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 border-t border-white/10 pt-3 sm:block sm:border-t-0 sm:pt-0 sm:text-right">
                    <p className={`truncate text-base font-bold tabular-nums sm:text-lg ${
                      transaction.amount > 0 ? 'text-secondary' : 'text-accent'
                    }`}>
                      <span className="sm:hidden">{formatCompactAmount(transaction.amount)}</span>
                      <span className="hidden sm:inline">
                        {transaction.amount > 0 ? '+' : ''}{formatCurrency(Math.abs(transaction.amount))}
                      </span>
                    </p>
                    <Badge variant={getStatusColor(transaction.status) as any} className="shrink-0 px-2.5 py-1 text-[10px] sm:px-3 sm:text-xs">
                      {transaction.status}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
        </Container>
      </main>
    </div>
  )
}
