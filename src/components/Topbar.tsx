import { Search, Plus } from 'lucide-react'
import ThemeToggle from './ThemeToggle'
import NotificationBell from './NotificationBell'

interface TopbarProps {
  title: string
  subtitle?: string
  search?: string | false
  searchValue?: string
  onSearch?: (v: string) => void
  cta?: string
  onCta?: () => void
  actions?: React.ReactNode
}

export default function Topbar({ title, subtitle, search, searchValue, onSearch, cta, onCta, actions }: TopbarProps) {
  const aksiyonVar = search !== false || !!cta || !!actions
  return (
    <header className="top">
      <div className="top-titles">
        <div className="top-h">{title}</div>
        {subtitle && <div className="top-sub">{subtitle}</div>}
      </div>
      <div className="top-actions">
        {search !== false && (
          <div className="top-search">
            <Search size={16} />
            <input
              placeholder={search || 'Ara…'}
              value={searchValue}
              onChange={(e) => onSearch?.(e.target.value)}
            />
          </div>
        )}
        {cta && (
          <button className="btn btn-gold" onClick={onCta}>
            <Plus size={16} /> {cta}
          </button>
        )}
        {actions}
        {aksiyonVar && <span className="top-ayrac" />}
        <ThemeToggle />
        <NotificationBell />
      </div>
    </header>
  )
}
