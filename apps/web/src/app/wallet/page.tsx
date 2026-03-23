import WalletCard from '@/components/wallet/WalletCard'
import Card from '@/components/ui/Card'
import { ArrowUpRight, ArrowDownLeft, Clock } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import Container from '@/components/ui/Container'
import Badge from '@/components/ui/Badge'

export default function WalletPage() {
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

  return (
    <div className="min-h-screen">
      <main className="pb-12">
        <Container>
        <h1 className="text-4xl font-bold text-white mb-8 title-tech">Wallet</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <WalletCard balance={125000} />
          </div>

          <Card>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-white/60 mb-1">Total Deposits</p>
                <p className="text-2xl font-bold text-secondary">
                  {formatCurrency(500000)}
                </p>
              </div>
              <div>
                <p className="text-sm text-white/60 mb-1">Total Withdrawals</p>
                <p className="text-2xl font-bold text-accent">
                  {formatCurrency(250000)}
                </p>
              </div>
              <div>
                <p className="text-sm text-white/60 mb-1">Total Winnings</p>
                <p className="text-2xl font-bold text-secondary">
                  {formatCurrency(375000)}
                </p>
              </div>
            </div>
          </Card>
        </div>

        <Card>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Transaction History</h2>
            <Clock className="w-5 h-5 text-white/55" />
          </div>

          <div className="space-y-3">
            {mockTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 transition duration-200"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-lg bg-black/25 border border-white/10 flex items-center justify-center">
                    {getTransactionIcon(transaction.type)}
                  </div>
                  <div>
                    <p className="text-white font-semibold">{transaction.description}</p>
                    <p className="text-sm text-white/60">{formatDate(transaction.createdAt)}</p>
                  </div>
                </div>

                <div className="text-right">
                  <p className={`text-lg font-bold ${
                    transaction.amount > 0 ? 'text-secondary' : 'text-accent'
                  }`}>
                    {transaction.amount > 0 ? '+' : ''}{formatCurrency(Math.abs(transaction.amount))}
                  </p>
                  <Badge variant={getStatusColor(transaction.status) as any}>
                    {transaction.status}
                  </Badge>
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
