import { useEffect, useRef, useState, type ReactNode } from 'react'

/* ================================================================== *
 * The Lab — shared design-system primitives.
 * Both explainers import from here. Accent colour is set per-page by
 * wrapping the app in an `.accent-*` class (see index.css), so these
 * components stay colour-agnostic via var(--color-primary).
 * ================================================================== */

export function useDarkMode() {
  const [dark, setDark] = useState(() => {
    try {
      const saved = localStorage.getItem('ee-theme')
      if (saved) return saved === 'dark'
      return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
    } catch {
      return false
    }
  })
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    try {
      localStorage.setItem('ee-theme', dark ? 'dark' : 'light')
    } catch {
      /* ignore */
    }
  }, [dark])
  return { dark, setDark }
}

export function Reveal({ children, className = '' }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [shown, setShown] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setShown(true)
          io.disconnect()
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return (
    <div ref={ref} className={`ee-reveal ${shown ? 'ee-in' : ''} ${className}`}>
      {children}
    </div>
  )
}

function SunMoon({ dark }: { dark: boolean }) {
  return dark ? (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  ) : (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  )
}

export function ScrollProgress() {
  const [p, setP] = useState(0)
  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement
      const max = h.scrollHeight - h.clientHeight || 1
      setP(Math.min(1, Math.max(0, h.scrollTop / max)))
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return (
    <div className="fixed inset-x-0 top-0 z-[60] h-0.5">
      <div className="h-full bg-primary transition-[width] duration-150 ease-out" style={{ width: `${p * 100}%` }} />
    </div>
  )
}

export function TopBar({ series, home = './', dark, setDark }: { series?: string; home?: string; dark: boolean; setDark: (v: boolean) => void }) {
  return (
    <header className="sticky top-0 z-50 border-b border-line bg-bg/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
        <a href={home} className="flex items-center gap-2">
          <span className="text-primary">✦</span>
          <span className="font-mono text-xs uppercase tracking-[0.12em] text-ink">Explorable Explainers</span>
          {series && <span className="font-mono text-xs text-faint">/ {series}</span>}
        </a>
        <button
          onClick={() => setDark(!dark)}
          className="border border-line p-2 text-muted transition hover:border-primary hover:text-ink"
          aria-label="Toggle dark mode"
        >
          <SunMoon dark={dark} />
        </button>
      </div>
    </header>
  )
}

export function SectionLabel({ n, title }: { n: string; title: string }) {
  return (
    <div className="mb-5 flex items-center gap-2.5 font-mono text-xs uppercase tracking-[0.15em]">
      <span className="text-primary">{n}</span>
      <span className="text-faint">/</span>
      <span className="text-muted">{title}</span>
    </div>
  )
}

export function Tag({ tone, children }: { tone: 'good' | 'bad' | 'amber' | 'primary'; children: ReactNode }) {
  const tones: Record<string, string> = {
    good: 'border-good/50 text-good',
    bad: 'border-bad/50 text-bad',
    amber: 'border-amber/50 text-amber',
    primary: 'border-primary/50 text-primary',
  }
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 font-mono text-[0.7rem] uppercase tracking-wide ${tones[tone]}`}>{children}</span>
  )
}

export function Cite({ n }: { n: number }) {
  return <sup className="ml-0.5 font-mono text-[0.62em] font-semibold text-primary">[{n}]</sup>
}

export function renderCited(answer: string): ReactNode[] {
  return answer.split(/(\[\[\d+\]\])/g).map((p, i) => {
    const m = p.match(/^\[\[(\d+)\]\]$/)
    return m ? <Cite key={i} n={+m[1]} /> : <span key={i}>{p}</span>
  })
}

export function Slider({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step?: number
  unit: string
  onChange: (v: number) => void
}) {
  return (
    <label className="block">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-mono text-xs uppercase tracking-wide text-muted">{label}</span>
        <span className="font-mono text-xs tabular-nums text-ink">
          {value}
          {unit ? ` ${unit}` : ''}
        </span>
      </div>
      <input type="range" className="ee-range" min={min} max={max} step={step ?? 1} value={value} onChange={(e) => onChange(+e.target.value)} />
    </label>
  )
}

export function H2({ children }: { children: ReactNode }) {
  return <h2 className="mb-5 font-display text-3xl font-semibold tracking-[-0.02em] text-ink sm:text-[2.5rem] sm:leading-[1.08]">{children}</h2>
}

export function Lede({ children }: { children: ReactNode }) {
  return <p className="text-lg leading-relaxed text-muted">{children}</p>
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-md border border-line bg-surface p-5 transition-colors duration-200 hover:border-ink/25 sm:p-7 ${className}`}>{children}</div>
}

export function Callout({ tone, children }: { tone: 'good' | 'bad' | 'primary'; children: ReactNode }) {
  const c = tone === 'good' ? 'border-good bg-good-soft/60' : tone === 'bad' ? 'border-bad bg-bad-soft/60' : 'border-primary bg-primary-soft/50'
  return <p className={`mt-4 rounded-r-sm border-l-2 px-4 py-3 text-sm leading-relaxed text-ink/85 ${c}`}>{children}</p>
}

export function Section({ id, n, title, children }: { id?: string; n: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="mx-auto max-w-3xl border-t border-line px-6 py-16 sm:py-20">
      <Reveal>
        <SectionLabel n={n} title={title} />
        {children}
      </Reveal>
    </section>
  )
}

export function SideNav({ sections }: { sections: { id: string; label: string }[] }) {
  const [active, setActive] = useState(sections[0]?.id ?? '')
  useEffect(() => {
    const obs = new IntersectionObserver((entries) => entries.forEach((e) => { if (e.isIntersecting) setActive(e.target.id) }), { rootMargin: '-45% 0px -45% 0px' })
    sections.forEach((s) => {
      const el = document.getElementById(s.id)
      if (el) obs.observe(el)
    })
    return () => obs.disconnect()
  }, [sections])
  return (
    <nav className="fixed right-6 top-1/2 z-40 hidden -translate-y-1/2 lg:block">
      <ul className="flex flex-col gap-3">
        {sections.map((s) => (
          <li key={s.id}>
            <a href={`#${s.id}`} className="group flex items-center justify-end gap-2" aria-label={s.label}>
              <span className={`font-mono text-[0.7rem] uppercase tracking-wide transition-opacity ${active === s.id ? 'text-ink opacity-100' : 'text-faint opacity-0 group-hover:opacity-100'}`}>{s.label}</span>
              <span className={`h-2 w-2 transition ${active === s.id ? 'scale-125 bg-primary' : 'border border-line group-hover:border-ink'}`} />
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}

export function SeriesFooter({ more }: { more?: { href: string; label: string } }) {
  return (
    <footer className="mx-auto mt-8 max-w-3xl border-t border-line px-6 py-16 text-center font-mono text-xs text-faint">
      {more && (
        <p className="mb-4">
          <a href={more.href} className="text-primary hover:underline">
            Next in the series → {more.label}
          </a>
        </p>
      )}
      <p className="uppercase tracking-wide">Part of a series · how AI actually works</p>
      <p className="mt-2">Built by <span className="text-muted">Laela Zorana</span> · @codezorana · runs in your browser, no API keys</p>
    </footer>
  )
}
