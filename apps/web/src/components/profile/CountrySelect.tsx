'use client'

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

export default function CountrySelect({ value, onChange, disabled, className = '' }: Props) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={`w-full px-4 py-3 dark:bg-white/5 bg-[#00165F]/5 border dark:border-white/10 border-[#00165F]/10 rounded-xl dark:text-white text-[#00165F] focus:border-[#0097FC] focus:ring-2 focus:ring-[#0097FC]/20 focus:outline-none transition-all ${className}`}
    >
      <option value="">— Sélectionner un pays —</option>
      <optgroup label="🌍 Afrique">
        {AFRICAN_COUNTRIES.map((c) => (
          <option key={c.code} value={c.name}>{c.name}</option>
        ))}
      </optgroup>
      <optgroup label="🌐 Monde">
        {WORLD_COUNTRIES.map((c) => (
          <option key={c.code} value={c.name}>{c.name}</option>
        ))}
      </optgroup>
    </select>
  )
}
