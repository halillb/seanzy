/** Bildirim sesleri — Web Audio sentezi (dosya yok, offline çalışır). */

// ─── Tip sistemi ────────────────────────────────────────────────────────────

interface OscNota  { tip: 'osc';   f: number; t: number; d: number; wave?: OscillatorType; v?: number; a?: number }
interface FmNota   { tip: 'fm';    carrier: number; modRatio: number; modIdx: number; t: number; d: number; v?: number; a?: number }
interface KickNota { tip: 'kick';  f0: number; f1: number; t: number; d: number; v?: number }
interface NoiseNota{ tip: 'noise'; t: number; d: number; v?: number; hpf?: number; lpf?: number; a?: number }
interface AmNota   { tip: 'am';    f: number; lfoF: number; t: number; d: number; v?: number }

type Nota = OscNota | FmNota | KickNota | NoiseNota | AmNota

interface Ses { id: string; ad: string; notalar: Nota[] }

// ─── Ses kataloğu ───────────────────────────────────────────────────────────

export const SESLER: Ses[] = [

  // ══ Modern & Elektronik ════════════════════════════════════════════════════

  // 808 Kick — sine pitch bend (90Hz→40Hz), derin elektronik vuruş
  { id: '808-kick', ad: '808 Kick (~0.4s)', notalar: [
    { tip: 'kick', f0: 120, f1: 35,  t: 0,    d: 0.38, v: 0.5  },
    { tip: 'kick', f0: 200, f1: 80,  t: 0,    d: 0.15, v: 0.2  },
  ]},

  // Hi-Hat — beyaz gürültü + hi-pass filtre
  { id: 'hihat', ad: 'Hi-Hat (~0.2s)', notalar: [
    { tip: 'noise', t: 0,    d: 0.06, v: 0.28, hpf: 8000, lpf: 14000 },
    { tip: 'noise', t: 0.1,  d: 0.12, v: 0.18, hpf: 8000, lpf: 14000, a: 0.01 },
  ]},

  // Synth Pluck — sawtooth + hızlı pitch düşüşü (FM ile)
  { id: 'synth-pluck', ad: 'Synth Pluck (~0.5s)', notalar: [
    { tip: 'fm', carrier: 440, modRatio: 2.0, modIdx: 4,  t: 0,    d: 0.45, v: 0.18 },
    { tip: 'fm', carrier: 660, modRatio: 2.0, modIdx: 3,  t: 0.18, d: 0.32, v: 0.13 },
  ]},

  // Rhodes (FM) — elektrik piyano tını, warm
  { id: 'rhodes', ad: 'Rhodes (~0.8s)', notalar: [
    { tip: 'fm', carrier: 293, modRatio: 1.0, modIdx: 2.5, t: 0,    d: 0.75, v: 0.2,  a: 0.015 },
    { tip: 'fm', carrier: 369, modRatio: 1.0, modIdx: 2.2, t: 0,    d: 0.65, v: 0.16, a: 0.015 },
    { tip: 'fm', carrier: 440, modRatio: 1.0, modIdx: 2.0, t: 0,    d: 0.6,  v: 0.13, a: 0.015 },
    { tip: 'fm', carrier: 440, modRatio: 1.0, modIdx: 2.5, t: 0.35, d: 0.6,  v: 0.18, a: 0.018 },
    { tip: 'fm', carrier: 587, modRatio: 1.0, modIdx: 2.0, t: 0.35, d: 0.5,  v: 0.14, a: 0.018 },
  ]},

  // Vibrafon (AM) — tremolo etkili, titreşimli çan
  { id: 'vibrafon', ad: 'Vibrafon (~1.0s)', notalar: [
    { tip: 'am', f: 880,  lfoF: 5, t: 0,    d: 0.9,  v: 0.2 },
    { tip: 'am', f: 1109, lfoF: 5, t: 0.38, d: 0.7,  v: 0.18 },
  ]},

  // Synth Bell (FM) — elektronik çan, uzun çınlama
  { id: 'synth-bell', ad: 'Synth Bell (~1.2s)', notalar: [
    { tip: 'fm', carrier: 600,  modRatio: 3.5, modIdx: 6, t: 0,    d: 1.1, v: 0.2 },
    { tip: 'fm', carrier: 900,  modRatio: 3.5, modIdx: 4, t: 0,    d: 0.7, v: 0.08 },
    { tip: 'fm', carrier: 1200, modRatio: 3.5, modIdx: 2, t: 0,    d: 0.4, v: 0.04 },
  ]},

  // Lo-Fi Notification — detuned square + gürültü
  { id: 'lofi', ad: 'Lo-Fi (~0.3s)', notalar: [
    { tip: 'osc', f: 440,  t: 0,    d: 0.12, wave: 'square',   v: 0.1  },
    { tip: 'osc', f: 443,  t: 0,    d: 0.12, wave: 'square',   v: 0.1  },
    { tip: 'noise', t: 0,  d: 0.05, v: 0.06, hpf: 2000, lpf: 6000 },
    { tip: 'osc', f: 554,  t: 0.15, d: 0.18, wave: 'square',   v: 0.09 },
    { tip: 'osc', f: 557,  t: 0.15, d: 0.18, wave: 'square',   v: 0.09 },
  ]},

  // Laser — hızlı pitch sweep aşağı (synth efekt)
  { id: 'laser', ad: 'Laser (~0.3s)', notalar: [
    { tip: 'kick', f0: 1200, f1: 200, t: 0,    d: 0.28, v: 0.18 },
    { tip: 'kick', f0: 1600, f1: 300, t: 0.04, d: 0.22, v: 0.12 },
  ]},

  // ══ Enstrüman Tarzı ════════════════════════════════════════════════════════

  // Piyano: temel ton + hızlı sönen harmonikler
  { id: 'piyano', ad: 'Piyano (~0.7s)', notalar: [
    { tip: 'osc', f: 523,  t: 0,    d: 0.65, wave: 'sine', v: 0.18 },
    { tip: 'osc', f: 1046, t: 0,    d: 0.28, wave: 'sine', v: 0.06 },
    { tip: 'osc', f: 1569, t: 0,    d: 0.14, wave: 'sine', v: 0.03 },
    { tip: 'osc', f: 659,  t: 0.28, d: 0.55, wave: 'sine', v: 0.15 },
    { tip: 'osc', f: 1318, t: 0.28, d: 0.22, wave: 'sine', v: 0.05 },
  ]},

  // Gitar: detuned sawtooth çifti (chorus)
  { id: 'gitar', ad: 'Gitar (~0.5s)', notalar: [
    { tip: 'osc', f: 330,  t: 0,    d: 0.48, wave: 'sawtooth', v: 0.09 },
    { tip: 'osc', f: 332,  t: 0,    d: 0.48, wave: 'sawtooth', v: 0.09 },
    { tip: 'osc', f: 495,  t: 0.05, d: 0.38, wave: 'sawtooth', v: 0.07 },
    { tip: 'osc', f: 497,  t: 0.05, d: 0.38, wave: 'sawtooth', v: 0.07 },
  ]},

  // Metalofon: inharmonik kısmi tonlar
  { id: 'metalofon', ad: 'Metalofon (~0.9s)', notalar: [
    { tip: 'osc', f: 800,  t: 0,    d: 0.85, wave: 'triangle', v: 0.16 },
    { tip: 'osc', f: 2208, t: 0,    d: 0.5,  wave: 'triangle', v: 0.06 },
    { tip: 'osc', f: 4320, t: 0,    d: 0.28, wave: 'triangle', v: 0.03 },
    { tip: 'osc', f: 1600, t: 0.35, d: 0.55, wave: 'triangle', v: 0.1  },
  ]},

  // Ksilofon: kısa parlak vuruşlar
  { id: 'ksilofon', ad: 'Ksilofon (~0.4s)', notalar: [
    { tip: 'osc', f: 1047, t: 0,    d: 0.06, wave: 'triangle', v: 0.2  },
    { tip: 'osc', f: 2093, t: 0,    d: 0.04, wave: 'triangle', v: 0.06 },
    { tip: 'osc', f: 1319, t: 0.1,  d: 0.06, wave: 'triangle', v: 0.18 },
    { tip: 'osc', f: 2638, t: 0.1,  d: 0.04, wave: 'triangle', v: 0.05 },
    { tip: 'osc', f: 1047, t: 0.22, d: 0.15, wave: 'sine',     v: 0.11 },
  ]},

  // Kalimba: çok hızlı decay, parlak triangle
  { id: 'kalimba', ad: 'Kalimba (~0.6s)', notalar: [
    { tip: 'osc', f: 1319, t: 0,    d: 0.55, wave: 'triangle', v: 0.22 },
    { tip: 'osc', f: 2638, t: 0,    d: 0.18, wave: 'triangle', v: 0.06 },
    { tip: 'osc', f: 1047, t: 0.2,  d: 0.45, wave: 'triangle', v: 0.2  },
    { tip: 'osc', f: 2093, t: 0.2,  d: 0.14, wave: 'triangle', v: 0.05 },
  ]},

  // Org: square chord — dolgun, nefes tarzı
  { id: 'org', ad: 'Org Akoru (~0.6s)', notalar: [
    { tip: 'osc', f: 262, t: 0,   d: 0.55, wave: 'square', v: 0.08, a: 0.06 },
    { tip: 'osc', f: 330, t: 0,   d: 0.5,  wave: 'square', v: 0.07, a: 0.06 },
    { tip: 'osc', f: 392, t: 0,   d: 0.45, wave: 'square', v: 0.06, a: 0.06 },
    { tip: 'osc', f: 523, t: 0.1, d: 0.48, wave: 'square', v: 0.05, a: 0.06 },
  ]},

  // Flüt: yavaş attack, sine
  { id: 'flut', ad: 'Flüt (~0.8s)', notalar: [
    { tip: 'osc', f: 784, t: 0,    d: 0.7,  wave: 'sine', v: 0.15, a: 0.08 },
    { tip: 'osc', f: 988, t: 0.35, d: 0.55, wave: 'sine', v: 0.13, a: 0.07 },
  ]},

  // ══ Kısa (0-0.5s) ══════════════════════════════════════════════════════════

  { id: 'cingirak', ad: 'Çıngırak (~0.3s)', notalar: [
    { tip: 'osc', f: 880,  t: 0,   d: 0.12 },
    { tip: 'osc', f: 1320, t: 0.1, d: 0.2  },
  ]},
  { id: 'zil', ad: 'Zil (~0.4s)', notalar: [
    { tip: 'osc', f: 1568, t: 0,   d: 0.16, wave: 'triangle' },
    { tip: 'osc', f: 1568, t: 0.2, d: 0.22, wave: 'triangle' },
  ]},
  { id: 'damla', ad: 'Damla (~0.3s)', notalar: [
    { tip: 'osc', f: 1200, t: 0,    d: 0.1,  wave: 'sine' },
    { tip: 'osc', f: 600,  t: 0.08, d: 0.22, wave: 'sine' },
  ]},
  { id: 'pop', ad: 'Pop (~0.15s)', notalar: [
    { tip: 'osc', f: 440, t: 0,    d: 0.06, wave: 'square', v: 0.12 },
    { tip: 'osc', f: 880, t: 0.05, d: 0.1,  wave: 'square', v: 0.12 },
  ]},
  { id: 'kristal', ad: 'Kristal (~0.4s)', notalar: [
    { tip: 'osc', f: 1318, t: 0,    d: 0.1,  wave: 'triangle' },
    { tip: 'osc', f: 1760, t: 0.09, d: 0.1,  wave: 'triangle' },
    { tip: 'osc', f: 2093, t: 0.18, d: 0.22, wave: 'triangle' },
  ]},

  // ══ Orta (1-2s) ════════════════════════════════════════════════════════════

  { id: 'melodi', ad: 'Melodi (~1.3s)', notalar: [
    { tip: 'osc', f: 523,  t: 0,    d: 0.28, wave: 'sine', v: 0.2  },
    { tip: 'osc', f: 659,  t: 0.25, d: 0.28, wave: 'sine', v: 0.2  },
    { tip: 'osc', f: 784,  t: 0.5,  d: 0.28, wave: 'sine', v: 0.2  },
    { tip: 'osc', f: 1047, t: 0.75, d: 0.5,  wave: 'sine', v: 0.18 },
  ]},
  { id: 'ding-dong', ad: 'Ding-Dong (~1.5s)', notalar: [
    { tip: 'osc', f: 880, t: 0,   d: 0.35, wave: 'triangle', v: 0.22 },
    { tip: 'osc', f: 659, t: 0.3, d: 0.45, wave: 'triangle', v: 0.2  },
    { tip: 'osc', f: 880, t: 0.8, d: 0.3,  wave: 'triangle', v: 0.18 },
    { tip: 'osc', f: 659, t: 1.1, d: 0.4,  wave: 'triangle', v: 0.16 },
  ]},
  { id: 'kapi-zili', ad: 'Kapı Zili (~1.8s)', notalar: [
    { tip: 'osc', f: 1047, t: 0,   d: 0.4,  wave: 'sine', v: 0.2  },
    { tip: 'osc', f: 784,  t: 0.38, d: 0.5, wave: 'sine', v: 0.18 },
    { tip: 'osc', f: 1047, t: 0.95, d: 0.38,wave: 'sine', v: 0.18 },
    { tip: 'osc', f: 784,  t: 1.3,  d: 0.55,wave: 'sine', v: 0.16 },
  ]},

  // ══ Uzun (2-3s) ════════════════════════════════════════════════════════════

  { id: 'fanfar', ad: 'Fanfar (~2.2s)', notalar: [
    { tip: 'osc', f: 523,  t: 0,    d: 0.18, v: 0.2  },
    { tip: 'osc', f: 659,  t: 0.16, d: 0.18, v: 0.2  },
    { tip: 'osc', f: 784,  t: 0.32, d: 0.18, v: 0.2  },
    { tip: 'osc', f: 1047, t: 0.5,  d: 0.45, v: 0.22 },
    { tip: 'osc', f: 784,  t: 1.05, d: 0.25, v: 0.18 },
    { tip: 'osc', f: 1047, t: 1.3,  d: 0.7,  v: 0.2  },
  ]},
  { id: 'randevu-sesi', ad: 'Randevu Sesi (~2.5s)', notalar: [
    { tip: 'osc', f: 659, t: 0,    d: 0.25, wave: 'sine', v: 0.2  },
    { tip: 'osc', f: 784, t: 0.22, d: 0.25, wave: 'sine', v: 0.2  },
    { tip: 'osc', f: 880, t: 0.44, d: 0.25, wave: 'sine', v: 0.2  },
    { tip: 'osc', f: 988, t: 0.66, d: 0.5,  wave: 'sine', v: 0.22 },
    { tip: 'osc', f: 880, t: 1.25, d: 0.25, wave: 'sine', v: 0.16 },
    { tip: 'osc', f: 784, t: 1.5,  d: 0.25, wave: 'sine', v: 0.16 },
    { tip: 'osc', f: 659, t: 1.75, d: 0.6,  wave: 'sine', v: 0.18 },
  ]},
]

// ─── Ses dosyaları (gerçek mp3 kayıtları) ─────────────────────────────────

export interface SesDosya { id: string; ad: string; url: string }

// BASE_URL uygulamanın alt yolda barındırıldığı durumlarda (örn. /estetix/) doğru kök için gerekli
const SES_KOK = import.meta.env.BASE_URL.replace(/\/$/, '')

export const SES_DOSYALARI: SesDosya[] = [
  { id: 'dosya-017', ad: 'New Notification 017', url: `${SES_KOK}/sounds/notification-017.mp3` },
  { id: 'dosya-022', ad: 'New Notification 022', url: `${SES_KOK}/sounds/notification-022.mp3` },
  { id: 'dosya-024', ad: 'New Notification 024', url: `${SES_KOK}/sounds/notification-024.mp3` },
  { id: 'dosya-027', ad: 'New Notification 027', url: `${SES_KOK}/sounds/notification-027.mp3` },
  { id: 'dosya-033', ad: 'New Notification 033', url: `${SES_KOK}/sounds/notification-033.mp3` },
  { id: 'dosya-036', ad: 'New Notification 036', url: `${SES_KOK}/sounds/notification-036.mp3` },
  { id: 'dosya-042', ad: 'New Notification 042', url: `${SES_KOK}/sounds/notification-042.mp3` },
  { id: 'dosya-051', ad: 'New Notification 051', url: `${SES_KOK}/sounds/notification-051.mp3` },
  { id: 'dosya-053', ad: 'New Notification 053', url: `${SES_KOK}/sounds/notification-053.mp3` },
  { id: 'dosya-066', ad: 'New Notification 066', url: `${SES_KOK}/sounds/notification-066.mp3` },
  { id: 'dosya-ringtone-021', ad: 'Ringtone 021', url: `${SES_KOK}/sounds/ringtone-021.mp3` },
  { id: 'dosya-ringtone-067', ad: 'Ringtone 067', url: `${SES_KOK}/sounds/ringtone-067.mp3` },
]

function playDosya(id: string): void {
  const s = SES_DOSYALARI.find((d) => d.id === id)
  if (!s) return
  const a = new Audio(s.url)
  a.volume = 0.7
  void a.play().catch(() => { /* autoplay engellenmiş olabilir */ })
}

// ─── AudioContext ──────────────────────────────────────────────────────────

let ctx: AudioContext | null = null
function getCtx(): AudioContext | null {
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!ctx) ctx = new AC()
    if (ctx.state === 'suspended') void ctx.resume()
    return ctx
  } catch { return null }
}

export function audioIsit(): void {
  const isit = () => {
    try {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (!ctx) ctx = new AC()
      if (ctx.state === 'suspended') void ctx.resume()
    } catch { /* ignore */ }
    document.removeEventListener('click', isit)
    document.removeEventListener('keydown', isit)
  }
  document.addEventListener('click', isit)
  document.addEventListener('keydown', isit)
}

// ─── Sentez motorları ─────────────────────────────────────────────────────

function playOsc(ac: AudioContext, n: OscNota, now: number) {
  const o = ac.createOscillator()
  const g = ac.createGain()
  o.type = n.wave || 'sine'
  o.frequency.value = n.f
  const bas = now + n.t
  const atk = n.a ?? 0.012
  g.gain.setValueAtTime(0.0001, bas)
  g.gain.exponentialRampToValueAtTime(n.v ?? 0.18, bas + atk)
  g.gain.exponentialRampToValueAtTime(0.0001, bas + n.d)
  o.connect(g); g.connect(ac.destination)
  o.start(bas); o.stop(bas + n.d + 0.05)
}

function playFm(ac: AudioContext, n: FmNota, now: number) {
  const bas = now + n.t
  const atk = n.a ?? 0.012
  const v = n.v ?? 0.18
  const modFreq = n.carrier * n.modRatio
  const modDepth = modFreq * n.modIdx

  const mod = ac.createOscillator()
  const modGain = ac.createGain()
  mod.frequency.value = modFreq
  modGain.gain.setValueAtTime(modDepth, bas)
  modGain.gain.exponentialRampToValueAtTime(0.001, bas + n.d)
  mod.connect(modGain); modGain.connect((mod as unknown as AudioNode & { frequency: AudioParam }).frequency)

  // Actually connect to carrier frequency param
  const carrier = ac.createOscillator()
  const carGain = ac.createGain()
  carrier.type = 'sine'
  carrier.frequency.value = n.carrier
  modGain.connect(carrier.frequency)
  carGain.gain.setValueAtTime(0.0001, bas)
  carGain.gain.exponentialRampToValueAtTime(v, bas + atk)
  carGain.gain.exponentialRampToValueAtTime(0.0001, bas + n.d)
  carrier.connect(carGain); carGain.connect(ac.destination)

  mod.start(bas); mod.stop(bas + n.d + 0.05)
  carrier.start(bas); carrier.stop(bas + n.d + 0.05)
}

function playKick(ac: AudioContext, n: KickNota, now: number) {
  const bas = now + n.t
  const v = n.v ?? 0.5
  const o = ac.createOscillator()
  const g = ac.createGain()
  o.type = 'sine'
  o.frequency.setValueAtTime(n.f0, bas)
  o.frequency.exponentialRampToValueAtTime(n.f1, bas + n.d * 0.85)
  g.gain.setValueAtTime(v, bas)
  g.gain.exponentialRampToValueAtTime(0.0001, bas + n.d)
  o.connect(g); g.connect(ac.destination)
  o.start(bas); o.stop(bas + n.d + 0.05)
}

function playNoise(ac: AudioContext, n: NoiseNota, now: number) {
  const bas = now + n.t
  const v = n.v ?? 0.2
  const atk = n.a ?? 0.003
  const bufSize = ac.sampleRate * (n.d + 0.1)
  const buf = ac.createBuffer(1, bufSize, ac.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1

  const src = ac.createBufferSource()
  src.buffer = buf
  const g = ac.createGain()
  g.gain.setValueAtTime(0.0001, bas)
  g.gain.exponentialRampToValueAtTime(v, bas + atk)
  g.gain.exponentialRampToValueAtTime(0.0001, bas + n.d)
  src.connect(g)

  let node: AudioNode = g
  if (n.hpf) {
    const hp = ac.createBiquadFilter()
    hp.type = 'highpass'; hp.frequency.value = n.hpf
    g.connect(hp); node = hp
  }
  if (n.lpf) {
    const lp = ac.createBiquadFilter()
    lp.type = 'lowpass'; lp.frequency.value = n.lpf
    node.connect(lp); node = lp
  }
  node.connect(ac.destination)
  src.start(bas); src.stop(bas + n.d + 0.05)
}

function playAm(ac: AudioContext, n: AmNota, now: number) {
  const bas = now + n.t
  const v = n.v ?? 0.2
  const carrier = ac.createOscillator()
  const carGain = ac.createGain()
  const lfo = ac.createOscillator()
  const lfoGain = ac.createGain()

  carrier.type = 'sine'
  carrier.frequency.value = n.f
  lfo.type = 'sine'
  lfo.frequency.value = n.lfoF
  lfoGain.gain.value = 0.5

  lfo.connect(lfoGain); lfoGain.connect(carGain.gain)
  carGain.gain.setValueAtTime(v * 0.5, bas)
  carGain.gain.exponentialRampToValueAtTime(0.0001, bas + n.d)
  carrier.connect(carGain); carGain.connect(ac.destination)

  lfo.start(bas); lfo.stop(bas + n.d + 0.05)
  carrier.start(bas); carrier.stop(bas + n.d + 0.05)
}

// ─── Ana API ──────────────────────────────────────────────────────────────

export function sesCal(id: string): void {
  if (id.startsWith('dosya-')) { playDosya(id); return }
  const ses = SESLER.find((s) => s.id === id) || SESLER[0]
  const ac = getCtx()
  if (!ac) return
  const now = ac.currentTime
  for (const n of ses.notalar) {
    if (n.tip === 'osc')   playOsc(ac, n, now)
    else if (n.tip === 'fm')    playFm(ac, n, now)
    else if (n.tip === 'kick')  playKick(ac, n, now)
    else if (n.tip === 'noise') playNoise(ac, n, now)
    else if (n.tip === 'am')    playAm(ac, n, now)
  }
}

const ANAHTAR = 'estetix-bildirim-ses'

// Rol bazlı varsayılan bildirim sesi: müşteri/personel → 033, müdür/superadmin → 066
function varsayilanSes(rol?: string): string {
  return rol === 'mudur' || rol === 'superadmin' ? 'dosya-066' : 'dosya-033'
}

export function seciliSes(rol?: string): string {
  try {
    const kayitli = localStorage.getItem(ANAHTAR)
    return kayitli || varsayilanSes(rol)
  } catch { return varsayilanSes(rol) }
}
export function sesSec(id: string): void {
  try { localStorage.setItem(ANAHTAR, id) } catch { /* ignore */ }
}
