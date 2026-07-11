import CountrySelect from './CountrySelect'
import type { Ulke } from '../data/countries'

export function telefonGecerli(d: string, u: Ulke) {
  if (u.iso2 === 'tr') return d.length === 10 && d[0] === '5'
  return d.length >= 6 && d.length <= 15
}

function maske(d: string, u: Ulke) {
  if (u.iso2 === 'tr') return [d.slice(0, 3), d.slice(3, 6), d.slice(6, 8), d.slice(8, 10)].filter(Boolean).join(' ')
  return d.replace(/(\d{3})(?=\d)/g, '$1 ').trim()
}

interface Props {
  national: string
  country: Ulke
  onNational: (v: string) => void
  onCountry: (u: Ulke) => void
}

export default function PhoneInput({ national, country, onNational, onCountry }: Props) {
  const max = country.iso2 === 'tr' ? 10 : 15
  const gecersiz = national.length > 0 && !telefonGecerli(national, country)
  return (
    <div className="phone-row">
      <CountrySelect value={country} onChange={onCountry} />
      <input
        className="input"
        inputMode="numeric"
        value={maske(national, country)}
        placeholder={country.iso2 === 'tr' ? '5XX XXX XX XX' : 'Telefon numarası'}
        onChange={(e) => onNational(e.target.value.replace(/\D/g, '').slice(0, max))}
        style={gecersiz ? { borderColor: 'rgba(231,76,60,.5)' } : undefined}
      />
    </div>
  )
}
