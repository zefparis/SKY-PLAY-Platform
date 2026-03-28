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
    <Card className="gradient-primary relative overflow-hidden text-white border-0 shadow-glow-blue dark:shadow-none">
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32" />
      <div className="relative z-10">
        <div className="flex items-center space-x-3 mb-4 sm:mb-6">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
            <Wallet className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-xs sm:text-sm text-white/70">Total Balance</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-white truncate">
              {formatCurrency(balance, currency)}
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:gap-4">
          <Button variant="accent" size="sm" className="bg-white/20 hover:bg-white/30">
            <ArrowDownLeft className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Deposit</span>
          </Button>
          <Button variant="accent" size="sm" className="bg-white/20 hover:bg-white/30">
            <ArrowUpRight className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Withdraw</span>
          </Button>
        </div>
      </div>
    </Card>
  )
}

export default WalletCard
