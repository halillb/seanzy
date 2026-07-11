import { ArrowUp, ArrowDown, ChevronsUpDown } from 'lucide-react'
import type { SiraDurum } from '../hooks/useSiralama'

interface Props {
  k: string
  label: string
  sira: SiraDurum
  onClick: (key: string) => void
  align?: 'left' | 'right' | 'center'
}

/** Tıklanabilir, sıralama ikonlu tablo başlığı. */
export default function SiraBaslik({ k, label, sira, onClick, align = 'left' }: Props) {
  const aktif = sira?.key === k
  return (
    <th onClick={() => onClick(k)} style={{ cursor: 'pointer', whiteSpace: 'nowrap', userSelect: 'none' }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, justifyContent: align === 'right' ? 'flex-end' : align === 'center' ? 'center' : 'flex-start' }}>
        {label}
        {aktif
          ? (sira!.dir === 1 ? <ArrowUp size={12} style={{ color: 'var(--gold)' }} /> : <ArrowDown size={12} style={{ color: 'var(--gold)' }} />)
          : <ChevronsUpDown size={12} style={{ color: 'var(--faint)' }} />}
      </span>
    </th>
  )
}
