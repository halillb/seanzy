import { useState, useRef, useEffect, Children, isValidElement, useCallback } from 'react'
import { ChevronDown, Check } from 'lucide-react'

interface Opt { value: string; label: string; disabled?: boolean; group?: string }

function parseOptions(children: React.ReactNode): Opt[] {
  const opts: Opt[] = []
  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return
    if (child.type === 'optgroup') {
      const gp = child.props as { label?: string; children?: React.ReactNode }
      Children.forEach(gp.children, (gc) => {
        if (!isValidElement(gc) || gc.type !== 'option') return
        const p = gc.props as { value?: unknown; children?: React.ReactNode; disabled?: boolean }
        opts.push({ value: String(p.value ?? ''), label: String(p.children ?? ''), disabled: p.disabled, group: gp.label })
      })
      return
    }
    if (child.type !== 'option') return
    const p = child.props as { value?: unknown; children?: React.ReactNode; disabled?: boolean }
    opts.push({ value: String(p.value ?? ''), label: String(p.children ?? ''), disabled: p.disabled })
  })
  return opts
}

interface Props {
  value: string | number
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
  disabled?: boolean
  className?: string
  autoFocus?: boolean
  style?: React.CSSProperties
  children: React.ReactNode
}

export default function Select({ value, onChange, disabled, className, style, children }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const opts = parseOptions(children)
  const strVal = String(value ?? '')
  const selected = opts.find((o) => o.value === strVal)

  useEffect(() => {
    if (!open) return
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])

  // Seçili item'a scroll
  useEffect(() => {
    if (!open || !listRef.current) return
    const el = listRef.current.querySelector('[data-selected="true"]') as HTMLElement | null
    if (el) el.scrollIntoView({ block: 'nearest' })
  }, [open])

  // Klavye navigasyonu
  const onKey = useCallback((e: React.KeyboardEvent) => {
    if (disabled) return
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen((v) => !v); return }
    if (e.key === 'Escape') { setOpen(false); return }
    if (!open) return
    const idx = opts.findIndex((o) => o.value === strVal)
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      const next = opts.slice(idx + 1).find((o) => !o.disabled)
      if (next) fire(next.value)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      const prev = [...opts].slice(0, idx).reverse().find((o) => !o.disabled)
      if (prev) fire(prev.value)
    }
  }, [open, opts, value, disabled])

  function fire(val: string) {
    onChange({ target: { value: val } } as React.ChangeEvent<HTMLSelectElement>)
  }

  function pick(val: string) {
    fire(val)
    setOpen(false)
  }

  const cls = [className || 'input'].join(' ')

  return (
    <div ref={ref} style={{ position: 'relative', ...style }}>
      <button
        type="button"
        className={cls}
        disabled={disabled}
        onClick={() => !disabled && setOpen((v) => !v)}
        onKeyDown={onKey}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 8, textAlign: 'left', cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.55 : 1,
        }}
      >
        <span style={{
          flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          color: selected && selected.value !== '' ? 'var(--text)' : 'var(--muted)',
        }}>
          {selected?.label ?? opts[0]?.label ?? ''}
        </span>
        <ChevronDown
          size={14}
          style={{ flexShrink: 0, color: 'var(--muted)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}
        />
      </button>

      {open && (
        <div
          ref={listRef}
          style={{
            position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 300,
            background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 10,
            boxShadow: '0 8px 32px rgba(0,0,0,.45)', overflow: 'hidden',
            maxHeight: 260, overflowY: 'auto',
          }}
        >
          {opts.map((o, i) => {
            const active = o.value === strVal
            const showGroup = o.group && (i === 0 || opts[i - 1].group !== o.group)
            return (
              <div key={o.value}>
                {showGroup && (
                  <div style={{ padding: '6px 13px 4px', fontSize: 11, color: 'var(--muted)', fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', borderTop: i > 0 ? '1px solid var(--border)' : 'none', marginTop: i > 0 ? 4 : 0 }}>
                    {o.group}
                  </div>
                )}
                <div
                  data-selected={active}
                  onClick={() => !o.disabled && pick(o.value)}
                  style={{
                    padding: '9px 13px', fontSize: 13.5, display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between', gap: 8,
                    cursor: o.disabled ? 'default' : 'pointer',
                    color: o.disabled ? 'var(--muted)' : active ? 'var(--gold-text)' : 'var(--text)',
                    background: active ? 'rgba(201,169,110,.12)' : 'transparent',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={(e) => {
                    if (!o.disabled && !active)
                      (e.currentTarget as HTMLDivElement).style.background = 'var(--surface3)'
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.background = active ? 'rgba(201,169,110,.12)' : 'transparent'
                  }}
                >
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.label}</span>
                  {active && <Check size={13} style={{ flexShrink: 0 }} />}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
