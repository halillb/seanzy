import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

interface Props {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  autoComplete?: string
  className?: string
  style?: React.CSSProperties
}

export default function PasswordInput({ value, onChange, placeholder, autoComplete, className, style }: Props) {
  const [goster, setGoster] = useState(false)
  return (
    <div className="pw-wrap" style={style}>
      <input
        className={className ?? 'input'}
        type={goster ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
      />
      <button type="button" className="pw-eye" tabIndex={-1} aria-label={goster ? 'Şifreyi gizle' : 'Şifreyi göster'}
        onClick={() => setGoster((v) => !v)}>
        {goster ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  )
}
