import { useEffect, useState } from 'react'
import { ArrowUp } from 'lucide-react'

export default function ScrollToTop() {
  const [gorunur, setGorunur] = useState(false)

  useEffect(() => {
    const h = () => setGorunur(window.scrollY > 300)
    window.addEventListener('scroll', h, { passive: true })
    return () => window.removeEventListener('scroll', h)
  }, [])

  if (!gorunur) return null

  return (
    <button className="scroll-top-btn" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} aria-label="Yukarı çık">
      <ArrowUp size={18} />
    </button>
  )
}
