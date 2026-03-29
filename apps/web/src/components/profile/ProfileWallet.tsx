'use client'

import { Wallet, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { useI18n } from '@/components/i18n/I18nProvider'

interface Transaction {
  id: string
  type: 'deposit' | 'withdraw' | 'win' | 'loss'
  amount: number
  description: string
  date: string
}

interface ProfileWalletProps {
  balance: number
  transactions?: Transaction[]
  onDeposit?: () => void
  onWithdraw?: () => void
}

export default function ProfileWallet({ 
  balance, 
  transactions = [],
  onDeposit,
  onWithdraw 
}: ProfileWalletProps) {
  const { t } = useI18n()
  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
      case 'win':
        return <ArrowUpRight className="w-4 h-4 text-green-400" />
      case 'withdraw':
      case 'loss':
        return <ArrowDownRight className="w-4 h-4 text-red-400" />
      default:
        return null
    }
  }

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'deposit':
      case 'win':
        return 'text-green-400'
      case 'withdraw':
      case 'loss':
        return 'text-red-400'
      default:
        return 'text-primary dark:text-white'
    }
  }

  return (
    <Card variant="glass">
      <div className="flex items-center justify-between mb-6">
        <h2 className="title-tech text-primary dark:text-white text-xl font-extrabold flex items-center gap-2">
          <Wallet className="w-5 h-5 text-secondary" />
          {t('profileWallet.title')}
        </h2>
        <Badge variant="success">{t('profileWallet.active')}</Badge>
      </div>

      {/* Solde principal */}
      <div className="bg-gradient-to-br from-secondary/20 to-danger/20 rounded-xl p-6 mb-6 border border-secondary/30 shadow-glow-blue">
        <p className="text-primary/70 dark:text-white/60 text-sm mb-2">{t('profileWallet.balance')}</p>
        <p className="text-primary dark:text-white text-4xl font-extrabold tabular-nums">
          {balance.toLocaleString('fr-FR')} <span className="text-2xl text-secondary">SKY</span>
        </p>
        
        <div className="flex gap-3 mt-6">
          <Button 
            variant="primary" 
            size="sm" 
            className="flex-1"
            onClick={onDeposit}
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            {t('profileWallet.deposit')}
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex-1"
            onClick={onWithdraw}
          >
            <TrendingDown className="w-4 h-4 mr-2" />
            {t('profileWallet.withdraw')}
          </Button>
        </div>
      </div>

      {/* Historique des transactions */}
      {transactions.length > 0 && (
        <div>
          <h3 className="text-primary dark:text-white font-semibold mb-4">{t('profileWallet.recentTx')}</h3>
          <div className="space-y-3">
            {transactions.slice(0, 5).map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between p-3 bg-white/40 dark:bg-black/20 rounded-lg border border-primary/10 dark:border-white/5 hover:border-primary/20 dark:hover:border-white/10 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 dark:bg-black/30 flex items-center justify-center">
                    {getTransactionIcon(tx.type)}
                  </div>
                  <div>
                    <p className="text-primary dark:text-white text-sm font-medium">{tx.description}</p>
                    <p className="text-primary/60 dark:text-white/40 text-xs">{tx.date}</p>
                  </div>
                </div>
                <p className={`font-semibold tabular-nums ${getTransactionColor(tx.type)}`}>
                  {tx.type === 'deposit' || tx.type === 'win' ? '+' : '-'}
                  {tx.amount.toLocaleString('fr-FR')} SKY
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {transactions.length === 0 && (
        <div className="text-center py-8">
          <Wallet className="w-12 h-12 text-primary/20 dark:text-white/20 mx-auto mb-3" />
          <p className="text-primary/60 dark:text-white/40">{t('profileWallet.noTx')}</p>
        </div>
      )}
    </Card>
  )
}
