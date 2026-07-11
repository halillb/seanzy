export type Tema = 'dark' | 'light'

export function initTheme(): void {
  let t: Tema = 'dark'
  try {
    const saved = localStorage.getItem('estetix-theme') as Tema | null
    if (saved === 'light' || saved === 'dark') {
      t = saved
    } else {
      t = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
    }
  } catch {
    /* ignore */
  }
  document.documentElement.setAttribute('data-theme', t)
}

export function listenSystemTheme(): () => void {
  const mq = window.matchMedia('(prefers-color-scheme: light)')
  const handler = (e: MediaQueryListEvent) => {
    if (!localStorage.getItem('estetix-theme')) {
      document.documentElement.setAttribute('data-theme', e.matches ? 'light' : 'dark')
    }
  }
  mq.addEventListener('change', handler)
  return () => mq.removeEventListener('change', handler)
}

export function toggleTheme(): Tema {
  const cur = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark'
  const next: Tema = cur === 'light' ? 'dark' : 'light'
  document.documentElement.setAttribute('data-theme', next)
  try {
    localStorage.setItem('estetix-theme', next)
  } catch {
    /* ignore */
  }
  return next
}
