import { useState } from 'react'
import { Sun, Moon } from 'lucide-react'
import { toggleTheme } from '../lib/theme'

export default function ThemeToggle() {
  const [isLight, setIsLight] = useState(
    () => document.documentElement.getAttribute('data-theme') === 'light',
  )
  return (
    <button
      className="icon-btn theme-btn"
      title="Gece / Gündüz"
      aria-label="Tema değiştir"
      onClick={() => { setIsLight(toggleTheme() === 'light'); window.dispatchEvent(new Event('estetix-theme-change')) }}
    >
      {isLight ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  )
}
