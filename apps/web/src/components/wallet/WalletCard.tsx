import { Wallet, ArrowUpRight, ArrowDownLeft } from 'lucide-react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { formatCurrency } from '@/lib/utils'

interface WalletCardProps {
  balance: number
  currency?: string
}

const WalletCard = ({ balance, currency = 'XOF' }: WalletCardProps) => {
  return (
    <Card className="gradient-primary relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32" />
      <div className="relative z-10">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center">
            <Wallet className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-sm text-white/70">Total Balance</p>
            <h2 className="text-3xl font-bold text-white">
              {formatCurrency(balance, currency)}
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Button variant="accent" size="sm" className="bg-white/20 hover:bg-white/30">
            <ArrowDownLeft className="w-4 h-4 mr-2" />
            Deposit
          </Button>
          <Button variant="accent" size="sm" className="bg-white/20 hover:bg-white/30">
            <ArrowUpRight className="w-4 h-4 mr-2" />
            Withdraw
          </Button>
        </div>
      </div>
    </Card>
  )
}

export default WalletCard
