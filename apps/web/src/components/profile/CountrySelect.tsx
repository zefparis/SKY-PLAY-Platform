'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'

interface CountryOption {
  code: string
  name: string
}

const AFRICAN_COUNTRIES: CountryOption[] = [
  { code: 'CM', name: 'Cameroun' },
  { code: 'SN', name: 'Sénégal' },
  { code: 'CI', name: "Côte d'Ivoire" },
  { code: 'ML', name: 'Mali' },
  { code: 'BF', name: 'Burkina Faso' },
  { code: 'GN', name: 'Guinée' },
  { code: 'BJ', name: 'Bénin' },
  { code: 'TG', name: 'Togo' },
  { code: 'NE', name: 'Niger' },
  { code: 'TD', name: 'Tchad' },
  { code: 'GA', name: 'Gabon' },
  { code: 'CG', name: 'Congo' },
  { code: 'CD', name: 'RD Congo' },
  { code: 'CF', name: 'Centrafrique' },
  { code: 'GQ', name: 'Guinée Équatoriale' },
  { code: 'NG', name: 'Nigeria' },
  { code: 'GH', name: 'Ghana' },
  { code: 'ZA', name: 'Afrique du Sud' },
  { code: 'KE', name: 'Kenya' },
  { code: 'ET', name: 'Éthiopie' },
  { code: 'TZ', name: 'Tanzanie' },
  { code: 'UG', name: 'Ouganda' },
  { code: 'RW', name: 'Rwanda' },
  { code: 'MZ', name: 'Mozambique' },
  { code: 'AO', name: 'Angola' },
  { code: 'ZW', name: 'Zimbabwe' },
  { code: 'ZM', name: 'Zambie' },
  { code: 'MG', name: 'Madagascar' },
  { code: 'EG', name: 'Égypte' },
  { code: 'MA', name: 'Maroc' },
  { code: 'TN', name: 'Tunisie' },
  { code: 'DZ', name: 'Algérie' },
  { code: 'LY', name: 'Libye' },
  { code: 'SD', name: 'Soudan' },
]

const WORLD_COUNTRIES: CountryOption[] = [
  { code: 'FR', name: 'France' },
  { code: 'BE', name: 'Belgique' },
  { code: 'CH', name: 'Suisse' },
  { code: 'CA', name: 'Canada' },
  { code: 'US', name: 'États-Unis' },
  { code: 'GB', name: 'Royaume-Uni' },
  { code: 'DE', name: 'Allemagne' },
  { code: 'ES', name: 'Espagne' },
  { code: 'IT', name: 'Italie' },
  { code: 'PT', name: 'Portugal' },
  { code: 'NL', name: 'Pays-Bas' },
  { code: 'BR', name: 'Brésil' },
  { code: 'MX', name: 'Mexique' },
  { code: 'AR', name: 'Argentine' },
  { code: 'CO', name: 'Colombie' },
  { code: 'CN', name: 'Chine' },
  { code: 'JP', name: 'Japon' },
  { code: 'KR', name: 'Corée du Sud' },
  { code: 'IN', name: 'Inde' },
  { code: 'AU', name: 'Australie' },
  { code: 'RU', name: 'Russie' },
  { code: 'TR', name: 'Turquie' },
  { code: 'SA', name: 'Arabie Saoudite' },
  { code: 'AE', name: 'Émirats Arabes Unis' },
]

interface Props {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  className?: string
}

const ALL = [...AFRICAN_COUNTRIES, ...WORLD_COUNTRIES]

export default function CountrySelect({ value, onChange, disabled, className = '' }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const selectedLabel = value ? (ALL.find((c) => c.name === value)?.name ?? value) : '— Sélectionner un pays —'

  const handleSelect = (name: string) => { onChange(name); setIsOpen(false) }

  const OptionBtn = ({ c }: { c: CountryOption }) => (
    <button
      type="button"
      onClick={() => handleSelect(c.name)}
      className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between transition-colors
        dark:hover:bg-white/10 hover:bg-[#00165F]/5
        ${value === c.name ? 'dark:text-[#0097FC] text-[#0097FC] font-semibold' : 'dark:text-white text-[#00165F]'}`}
    >
      {c.name}
      {value === c.name && <Check className="w-3.5 h-3.5 shrink-0" />}
    </button>
  )

  const GroupLabel = ({ emoji, label }: { emoji: string; label: string }) => (
    <div className="px-4 pt-2 pb-1 text-[10px] font-black uppercase tracking-wider dark:text-[#0097FC]/70 text-[#0097FC]/70 border-t dark:border-white/5 border-[#00165F]/5">
      {emoji} {label}
    </div>
  )

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full flex items-center justify-between px-4 py-3
          dark:bg-white/5 bg-[#00165F]/5
          border dark:border-white/10 border-[#00165F]/10
          rounded-xl dark:text-white text-[#00165F]
          focus:border-[#0097FC] focus:ring-2 focus:ring-[#0097FC]/20 focus:outline-none
          transition-all
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-[#0097FC]/50'}`}
      >
        <span className={value ? '' : 'dark:text-white/30 text-[#00165F]/30 text-sm'}>
          {selectedLabel}
        </span>
        <ChevronDown className={`w-4 h-4 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1
          dark:bg-[#00165F] bg-white
          border dark:border-white/10 border-[#00165F]/10
          rounded-xl shadow-2xl overflow-hidden">
          <div className="max-h-60 overflow-y-auto">
            <button
              type="button"
              onClick={() => handleSelect('')}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors
                dark:hover:bg-white/10 hover:bg-[#00165F]/5
                ${!value ? 'dark:text-[#0097FC] text-[#0097FC] font-semibold' : 'dark:text-white/40 text-[#00165F]/40'}`}
            >
              — Sélectionner un pays —
            </button>
            <GroupLabel emoji="🌍" label="Afrique" />
            {AFRICAN_COUNTRIES.map((c) => <OptionBtn key={c.code} c={c} />)}
            <GroupLabel emoji="🌐" label="Monde" />
            {WORLD_COUNTRIES.map((c) => <OptionBtn key={c.code} c={c} />)}
          </div>
        </div>
      )}
    </div>
  )
}
