'use client'

import { Wallet, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'

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
        return 'text-white'
    }
  }

  return (
    <Card variant="glass">
      <div className="flex items-center justify-between mb-6">
        <h2 className="title-tech text-white text-xl font-extrabold flex items-center gap-2">
          <Wallet className="w-5 h-5 text-secondary" />
          Wallet
        </h2>
        <Badge variant="success">Active</Badge>
      </div>

      {/* Solde principal */}
      <div className="bg-gradient-to-br from-secondary/20 to-danger/20 rounded-xl p-6 mb-6 border border-secondary/30 shadow-glow-blue">
        <p className="text-white/60 text-sm mb-2">Solde disponible</p>
        <p className="text-white text-4xl font-extrabold tabular-nums">
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
            Déposer
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex-1"
            onClick={onWithdraw}
          >
            <TrendingDown className="w-4 h-4 mr-2" />
            Retirer
          </Button>
        </div>
      </div>

      {/* Historique des transactions */}
      {transactions.length > 0 && (
        <div>
          <h3 className="text-white font-semibold mb-4">Dernières transactions</h3>
          <div className="space-y-3">
            {transactions.slice(0, 5).map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between p-3 bg-black/20 rounded-lg border border-white/5 hover:border-white/10 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-black/30 flex items-center justify-center">
                    {getTransactionIcon(tx.type)}
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">{tx.description}</p>
                    <p className="text-white/40 text-xs">{tx.date}</p>
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
          <Wallet className="w-12 h-12 text-white/20 mx-auto mb-3" />
          <p className="text-white/40">Aucune transaction pour le moment</p>
        </div>
      )}
    </Card>
  )
}
