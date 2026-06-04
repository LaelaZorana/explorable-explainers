import { useDarkMode, ScrollProgress, TopBar, SeriesFooter } from './ui'

const ITEMS = [
  { href: 'rag/', n: '01', title: 'How RAG Actually Works', desc: 'Retrieval turns a guessing model into one that answers from real sources — and cites them.', color: '#ff4d00' },
  { href: 'hallucination/', n: '02', title: 'Why LLMs Hallucinate', desc: 'A next-token predictor always emits something plausible — even when it has no idea.', color: '#2563eb' },
  { href: 'verifier/', n: '03', title: 'How a Verifier Works', desc: 'Generate many candidate answers, then keep only the one that actually checks out.', color: '#65a30d' },
]

export default function LandingApp() {
  const { dark, setDark } = useDarkMode()
  return (
    <>
      <ScrollProgress />
      <TopBar home="./" dark={dark} setDark={setDark} />
      <main>
        <section className="relative overflow-hidden">
          <div className="ee-grid-bg pointer-events-none absolute inset-0 -z-10" />
          <div className="mx-auto max-w-3xl px-6 pb-12 pt-24 text-center sm:pt-28">
            <p className="mb-6 font-mono text-xs uppercase tracking-[0.2em] text-primary">A series · how AI actually works</p>
            <h1 className="font-display text-6xl font-semibold tracking-[-0.03em] text-ink sm:text-7xl">Explorable Explainers</h1>
            <p className="mx-auto mt-7 max-w-xl text-lg leading-relaxed text-muted sm:text-xl">
              Short, interactive essays that take one AI idea apart, piece by piece — running entirely in your browser, no sign-ups, no API keys.
            </p>
            <div className="mt-7 flex items-center justify-center gap-2 font-mono text-xs text-faint">
              <span className="text-muted">Laela Zorana</span>
              <span aria-hidden>·</span>
              <span>@codezorana</span>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-6 pb-24">
          <div className="grid gap-4 sm:grid-cols-2">
            {ITEMS.map((it) => (
              <a
                key={it.href}
                href={it.href}
                className="group flex flex-col rounded-md border border-line bg-surface p-5 transition duration-200 hover:-translate-y-0.5 hover:border-ink/30 hover:shadow-md"
                style={{ borderTop: `3px solid ${it.color}` }}
              >
                <div className="mb-3 flex items-center gap-2 font-mono text-xs uppercase tracking-wide">
                  <span style={{ color: it.color }}>{it.n}</span>
                  <span className="h-2 w-2" style={{ background: it.color }} />
                </div>
                <h2 className="font-display text-xl font-semibold tracking-tight text-ink">{it.title}</h2>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{it.desc}</p>
                <span className="mt-4 font-mono text-xs uppercase tracking-wide text-ink transition-colors group-hover:text-primary">open →</span>
              </a>
            ))}
          </div>
          <p className="mt-8 text-center font-mono text-xs text-faint">more explainers in progress ✦</p>
        </section>
      </main>
      <SeriesFooter />
    </>
  )
}
