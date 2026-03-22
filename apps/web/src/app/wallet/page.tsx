import Navbar from '@/components/layout/Navbar'
import WalletCard from '@/components/wallet/WalletCard'
import Card from '@/components/ui/Card'
import { ArrowUpRight, ArrowDownLeft, Clock } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'

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
      return <ArrowDownLeft className="w-5 h-5 text-green-400" />
    }
    return <ArrowUpRight className="w-5 h-5 text-red-400" />
  }

  const getStatusColor = (status: string) => {
    if (status === 'COMPLETED') return 'bg-green-500/20 text-green-400'
    if (status === 'PENDING') return 'bg-yellow-500/20 text-yellow-400'
    return 'bg-red-500/20 text-red-400'
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 pt-24 pb-12">
        <h1 className="text-4xl font-bold text-white mb-8">Wallet</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <WalletCard balance={125000} />
          </div>

          <Card>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-400 mb-1">Total Deposits</p>
                <p className="text-2xl font-bold text-green-400">
                  {formatCurrency(500000)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Total Withdrawals</p>
                <p className="text-2xl font-bold text-red-400">
                  {formatCurrency(250000)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Total Winnings</p>
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
            <Clock className="w-5 h-5 text-gray-400" />
          </div>

          <div className="space-y-3">
            {mockTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-4 rounded-lg bg-dark-200 hover:bg-dark-100 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-lg bg-dark-300 flex items-center justify-center">
                    {getTransactionIcon(transaction.type)}
                  </div>
                  <div>
                    <p className="text-white font-semibold">{transaction.description}</p>
                    <p className="text-sm text-gray-400">{formatDate(transaction.createdAt)}</p>
                  </div>
                </div>

                <div className="text-right">
                  <p className={`text-lg font-bold ${
                    transaction.amount > 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {transaction.amount > 0 ? '+' : ''}{formatCurrency(Math.abs(transaction.amount))}
                  </p>
                  <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${getStatusColor(transaction.status)}`}>
                    {transaction.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </main>
    </div>
  )
}
