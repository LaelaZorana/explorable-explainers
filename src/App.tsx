import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { CORPUS, chunkDocs, docColor, SENT_CHUNKS, QUERIES, retrieve, project2D, tfVector } from './rag'

type Mode = 'llm' | 'rag'

/* ------------------------------------------------------------------ */
/* Theme + motion                                                      */
/* ------------------------------------------------------------------ */

function useDarkMode() {
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

function Reveal({ children, className = '' }: { children: ReactNode; className?: string }) {
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

/* ------------------------------------------------------------------ */
/* Chrome                                                              */
/* ------------------------------------------------------------------ */

function ScrollProgress() {
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

function TopBar({ dark, setDark }: { dark: boolean; setDark: (v: boolean) => void }) {
  return (
    <header className="sticky top-0 z-50 border-b border-line bg-bg/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
        <div className="flex items-center gap-2">
          <span className="text-primary">✦</span>
          <span className="font-mono text-xs uppercase tracking-[0.12em] text-ink">Explorable Explainers</span>
          <span className="font-mono text-xs text-faint">/ rag</span>
        </div>
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

/* ------------------------------------------------------------------ */
/* Primitives                                                          */
/* ------------------------------------------------------------------ */

function SectionLabel({ n, title }: { n: string; title: string }) {
  return (
    <div className="mb-5 flex items-center gap-2.5 font-mono text-xs uppercase tracking-[0.15em]">
      <span className="text-primary">{n}</span>
      <span className="text-faint">/</span>
      <span className="text-muted">{title}</span>
    </div>
  )
}

function Tag({ tone, children }: { tone: 'good' | 'bad' | 'amber' | 'primary'; children: ReactNode }) {
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

function Cite({ n }: { n: number }) {
  return <sup className="ml-0.5 font-mono text-[0.62em] font-semibold text-primary">[{n}]</sup>
}

function renderCited(answer: string): ReactNode[] {
  return answer.split(/(\[\[\d+\]\])/g).map((p, i) => {
    const m = p.match(/^\[\[(\d+)\]\]$/)
    return m ? <Cite key={i} n={+m[1]} /> : <span key={i}>{p}</span>
  })
}

function Slider({
  label,
  value,
  min,
  max,
  unit,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  unit: string
  onChange: (v: number) => void
}) {
  return (
    <label className="block">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-mono text-xs uppercase tracking-wide text-muted">{label}</span>
        <span className="font-mono text-xs tabular-nums text-ink">
          {value} {unit}
        </span>
      </div>
      <input type="range" className="ee-range" min={min} max={max} value={value} onChange={(e) => onChange(+e.target.value)} />
    </label>
  )
}

function H2({ children }: { children: ReactNode }) {
  return <h2 className="mb-5 font-display text-3xl font-semibold tracking-[-0.02em] text-ink sm:text-[2.5rem] sm:leading-[1.08]">{children}</h2>
}

function Lede({ children }: { children: ReactNode }) {
  return <p className="text-lg leading-relaxed text-muted">{children}</p>
}

function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-md border border-line bg-surface p-5 transition-colors duration-200 hover:border-ink/25 sm:p-7 ${className}`}>{children}</div>
}

function Callout({ tone, children }: { tone: 'good' | 'bad'; children: ReactNode }) {
  const c = tone === 'good' ? 'border-good bg-good-soft/60' : 'border-bad bg-bad-soft/60'
  return <p className={`mt-4 rounded-r-sm border-l-2 px-4 py-3 text-sm leading-relaxed text-ink/85 ${c}`}>{children}</p>
}

function Section({ id, n, title, children }: { id?: string; n: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="mx-auto max-w-3xl border-t border-line px-6 py-16 sm:py-20">
      <Reveal>
        <SectionLabel n={n} title={title} />
        {children}
      </Reveal>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* Embedding scatter                                                   */
/* ------------------------------------------------------------------ */

function Scatter({ highlightIds = [], queryText }: { highlightIds?: number[]; queryText?: string }) {
  const W = 540
  const H = 320
  const pad = 30
  const hl = new Set(highlightIds)

  const pts = SENT_CHUNKS.map((c) => ({ c, ...project2D(tfVector(c.text)) }))
  const xs = pts.map((p) => p.x)
  const ys = pts.map((p) => p.y)
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)
  const sx = (x: number) => pad + ((x - minX) / (maxX - minX || 1)) * (W - 2 * pad)
  const sy = (y: number) => H - (pad + ((y - minY) / (maxY - minY || 1)) * (H - 2 * pad))

  const plotted = pts.map((p) => ({ ...p, px: sx(p.x), py: sy(p.y) }))
  const hi = plotted.filter((p) => hl.has(p.c.id))
  const q =
    queryText && hi.length
      ? { px: hi.reduce((s, p) => s + p.px, 0) / hi.length, py: hi.reduce((s, p) => s + p.py, 0) / hi.length - 4 }
      : null

  const grid = [0.25, 0.5, 0.75]
  const ptTransition = 'cx .45s ease, cy .45s ease, r .2s ease, opacity .3s ease'

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full select-none" role="img" aria-label="Embedding space scatter plot">
      <rect x="0.5" y="0.5" width={W - 1} height={H - 1} fill="none" stroke="var(--color-line)" />
      {grid.map((f) => (
        <g key={f} stroke="var(--color-line)" strokeWidth="1" opacity="0.6">
          <line x1={pad + f * (W - 2 * pad)} y1={pad} x2={pad + f * (W - 2 * pad)} y2={H - pad} />
          <line x1={pad} y1={pad + f * (H - 2 * pad)} x2={W - pad} y2={pad + f * (H - 2 * pad)} />
        </g>
      ))}
      {q &&
        hi.map((p) => (
          <line key={`l${p.c.id}`} x1={q.px} y1={q.py} x2={p.px} y2={p.py} stroke="var(--color-primary)" strokeWidth="1.25" strokeDasharray="3 3" opacity="0.6" />
        ))}
      {plotted.map((p) => {
        const active = !hl.size || hl.has(p.c.id)
        return (
          <circle
            key={p.c.id}
            cx={p.px}
            cy={p.py}
            r={hl.has(p.c.id) ? 7 : 5}
            fill={docColor(p.c.docId).dot}
            stroke={hl.has(p.c.id) ? 'var(--color-ink)' : 'transparent'}
            strokeWidth={hl.has(p.c.id) ? 1.5 : 0}
            opacity={active ? 1 : 0.28}
            style={{ transition: ptTransition, cursor: 'pointer' }}
          >
            <title>
              Doc {p.c.docId} · {p.c.docTitle}: {p.c.text}
            </title>
          </circle>
        )
      })}
      {q && (
        <g style={{ transition: 'transform .45s ease' }}>
          <rect x={q.px - 6} y={q.py - 6} width="12" height="12" fill="var(--color-primary)" stroke="var(--color-bg)" strokeWidth="2" style={{ transition: ptTransition }} />
          <text x={q.px} y={q.py - 13} textAnchor="middle" fontSize="10" fontWeight="600" fill="var(--color-ink)" fontFamily="var(--font-mono)">
            QUERY
          </text>
        </g>
      )}
    </svg>
  )
}

function Legend() {
  return (
    <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 font-mono text-xs text-muted">
      {CORPUS.map((d) => (
        <span key={d.id} className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5" style={{ background: docColor(d.id).dot }} />
          {d.title}
        </span>
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Hero + pipeline                                                     */
/* ------------------------------------------------------------------ */

function RAGFlow() {
  const nodes = [
    { x: 8, label: 'Question' },
    { x: 190, label: 'Retrieve' },
    { x: 372, label: 'Generate' },
    { x: 554, label: 'Answer' },
  ]
  const W = 136
  const cy = 65
  const segs = ['M144 65 L190 65', 'M326 65 L372 65', 'M508 65 L554 65']
  return (
    <svg viewBox="0 0 700 130" className="h-auto w-full select-none" role="img" aria-label="The RAG pipeline: question, retrieve, generate, answer">
      <defs>
        {segs.map((d, i) => (
          <path key={i} id={`ee-seg${i}`} d={d} fill="none" />
        ))}
      </defs>
      {segs.map((d, i) => (
        <path key={`c${i}`} d={d} stroke="var(--color-line)" strokeWidth="1.5" fill="none" />
      ))}
      {nodes.map((n, i) => {
        const answer = i === nodes.length - 1
        return (
          <g key={n.label}>
            <rect
              x={n.x}
              y={cy - 22}
              width={W}
              height={44}
              rx={6}
              fill="var(--color-surface)"
              stroke={answer ? 'var(--color-primary)' : 'var(--color-ink)'}
              strokeWidth={answer ? 2 : 1.25}
              className={answer ? 'ee-pulse-node' : undefined}
            />
            <text x={n.x + W / 2} y={cy} textAnchor="middle" dominantBaseline="central" fontSize="13" fontWeight="500" fill="var(--color-ink)" fontFamily="var(--font-sans)">
              {n.label}
            </text>
          </g>
        )
      })}
      {segs.map((_, i) =>
        [0, 0.75].map((o, j) => (
          <circle key={`d${i}-${j}`} r="3.25" fill="var(--color-primary)">
            <animateMotion dur="1.5s" repeatCount="indefinite" begin={`${i * 0.5 + o}s`}>
              <mpath href={`#ee-seg${i}`} />
            </animateMotion>
          </circle>
        )),
      )}
    </svg>
  )
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="ee-grid-bg pointer-events-none absolute inset-0 -z-10" />
      <div className="mx-auto max-w-3xl px-6 pb-16 pt-24 text-center sm:pt-28">
        <p className="mb-6 font-mono text-xs uppercase tracking-[0.2em] text-primary">Explorable Explainer · Retrieval-Augmented Generation</p>
        <h1 className="font-display text-6xl font-semibold tracking-[-0.03em] text-ink sm:text-7xl">
          How <span className="text-primary">RAG</span> Actually Works
        </h1>
        <p className="mx-auto mt-7 max-w-xl text-lg leading-relaxed text-muted sm:text-xl">
          Language models are fluent, confident — and sometimes completely wrong. Scroll to see, piece by piece, how <span className="text-ink">retrieval</span> turns a guessing machine into one that answers from real sources.
        </p>
        <div className="mt-7 flex items-center justify-center gap-2 font-mono text-xs text-faint">
          <span className="text-muted">Laela Zorana</span>
          <span aria-hidden>·</span>
          <span>@codezorana</span>
        </div>
        <div className="mx-auto mt-14 max-w-xl">
          <RAGFlow />
          <p className="mt-4 text-center font-mono text-[0.7rem] uppercase tracking-[0.2em] text-faint">fig. 01 — the pipeline</p>
        </div>
        <div className="mt-12 flex justify-center text-faint">
          <span className="animate-bounce">↓</span>
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* Sections                                                            */
/* ------------------------------------------------------------------ */

const tab = (active: boolean) =>
  `px-4 py-1.5 font-mono text-xs uppercase tracking-wide transition ${active ? 'bg-ink text-bg' : 'text-muted hover:text-ink'}`

function ProblemWidget() {
  const [mode, setMode] = useState<Mode>('llm')
  return (
    <Card className="mt-8">
      <div className="mb-5 flex items-start gap-3">
        <span className="mt-0.5 shrink-0 border border-primary/50 px-1.5 py-0.5 font-mono text-xs font-semibold text-primary">Q</span>
        <p className="text-base font-medium text-ink">What is the capital of the Marenne Islands, and roughly how many people live there?</p>
      </div>

      <div className="mb-6 inline-flex rounded-sm border border-line">
        <button onClick={() => setMode('llm')} className={tab(mode === 'llm')}>
          Plain LLM
        </button>
        <button onClick={() => setMode('rag')} className={tab(mode === 'rag')}>
          With RAG
        </button>
      </div>

      {mode === 'llm' ? (
        <div>
          <div className="mb-3">
            <Tag tone="bad">Unverified · 0 sources</Tag>
          </div>
          <p className="text-lg leading-relaxed text-ink">
            The capital of the Marenne Islands is <span className="font-semibold">Marenne City</span>, a coastal hub of roughly <span className="font-semibold">250,000</span> people.
          </p>
          <Callout tone="bad">
            <span className="font-semibold text-bad">The catch:</span> fluent, confident — and entirely invented. The model has no knowledge of the (fictional) Marenne Islands, so it fills the gap with plausible fiction. You can't tell which words to trust.
          </Callout>
        </div>
      ) : (
        <div>
          <div className="mb-3">
            <Tag tone="good">Grounded · 3 sources</Tag>
          </div>
          <p className="text-lg leading-relaxed text-ink">
            The capital is <span className="font-semibold">Port Aleen</span>
            <Cite n={2} />, on Tavros, the largest island
            <Cite n={1} />. About <span className="font-semibold">84,000</span> people live across the archipelago
            <Cite n={2} />.
          </p>
          <Callout tone="good">
            <span className="font-semibold text-good">The difference:</span> same model, but it now answers only from retrieved documents — and every claim carries a citation you can check.
          </Callout>
        </div>
      )}
    </Card>
  )
}

function ProblemSection() {
  return (
    <section id="problem" className="mx-auto max-w-3xl px-6 py-16 sm:py-20">
      <Reveal>
        <SectionLabel n="01" title="The problem" />
        <H2>A model that never says “I don't know”</H2>
        <Lede>
          Ask a language model about something it was never taught, and it rarely hesitates — it produces a fluent, authoritative answer, even if it has to invent one. Here is the same question answered two ways. Flip between them.
        </Lede>
        <ProblemWidget />
      </Reveal>
    </section>
  )
}

function CorpusSection() {
  return (
    <Section id="corpus" n="02" title="The knowledge base">
      <H2>Give the model something true to read</H2>
      <Lede>
        RAG starts with a <span className="text-ink">corpus</span>: a set of trusted documents. Our world here is a tiny field guide to the (made-up) Marenne Islands — five short entries the model may quote from, and nothing else.
      </Lede>
      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        {CORPUS.map((d) => (
          <div key={d.id} className="rounded-md border border-line bg-surface p-4 transition-colors duration-200 hover:border-ink/30">
            <div className="mb-1.5 flex items-center gap-2 font-mono text-xs uppercase tracking-wide text-muted">
              <span className="h-2 w-2" style={{ background: docColor(d.id).dot }} />
              Doc {d.id} · {d.title}
            </div>
            <p className="text-sm leading-relaxed text-ink/85">{d.text}</p>
          </div>
        ))}
      </div>
    </Section>
  )
}

function ChunkingSection() {
  const [size, setSize] = useState(12)
  const [overlap, setOverlap] = useState(3)
  const chunks = useMemo(() => chunkDocs(CORPUS, size, overlap), [size, overlap])
  const note =
    size <= 6
      ? 'Tiny chunks are precise to search, but each loses its surrounding context — answering may need two or three stitched together.'
      : size >= 22
        ? 'Large chunks keep context intact, but each carries extra, unrelated text — that noise can crowd out the part that actually answers the question.'
        : 'A balanced chunk: big enough to hold a complete idea, small enough to stay on-topic when it is retrieved.'
  return (
    <Section id="chunking" n="03" title="Chunking">
      <H2>Cut the documents into searchable pieces</H2>
      <Lede>
        Before anything can be retrieved, each document is sliced into <span className="text-ink">chunks</span>. How big to cut them is a real design decision — drag the sliders and watch the pieces change.
      </Lede>
      <Card className="mt-8">
        <div className="grid gap-6 sm:grid-cols-2">
          <Slider label="Chunk size" value={size} min={4} max={28} unit="words" onChange={setSize} />
          <Slider label="Overlap" value={overlap} min={0} max={8} unit="words" onChange={setOverlap} />
        </div>
        <div className="mb-4 mt-6 font-mono text-xs uppercase tracking-wide text-muted">
          <span className="tabular-nums text-primary">{chunks.length}</span> chunks / {CORPUS.length} documents
        </div>
        <div className="flex flex-col gap-2">
          {chunks.map((c) => (
            <div key={c.id} className="border border-line bg-bg px-3 py-2 text-sm text-ink/90" style={{ borderLeft: `3px solid ${docColor(c.docId).border}` }}>
              {c.text}
            </div>
          ))}
        </div>
        <p className="mt-6 rounded-r-sm border-l-2 border-primary bg-primary-soft/50 px-4 py-3 text-sm leading-relaxed text-ink/85">{note}</p>
      </Card>
    </Section>
  )
}

function EmbeddingsSection() {
  return (
    <Section id="embeddings" n="04" title="Embeddings">
      <H2>Turn text into points in space</H2>
      <Lede>
        Each chunk becomes a vector — a list of numbers — positioned so passages about the same thing land near each other. Here are our chunks projected onto a 2D map (a flattened shadow of a much higher-dimensional space). Hover a point to read its passage.
      </Lede>
      <Card className="mt-8">
        <Scatter />
        <Legend />
      </Card>
    </Section>
  )
}

function queryChip(active: boolean) {
  return `rounded-sm border px-3 py-1.5 text-sm transition ${active ? 'border-primary bg-primary-soft text-primary-ink' : 'border-line text-muted hover:border-ink hover:text-ink'}`
}

function RetrievalLab() {
  const [queryId, setQueryId] = useState(0)
  const [topK, setTopK] = useState(3)
  const query = QUERIES[queryId]
  const ranked = useMemo(() => retrieve(query.text, SENT_CHUNKS), [queryId, query.text])
  const maxScore = Math.max(0.0001, ...ranked.map((r) => r.score))
  const top = ranked.slice(0, topK)
  const topIds = top.map((r) => r.chunk.id)
  const retrievedDocs = new Set(top.map((r) => r.chunk.docId))
  const hasSignal = top.some((r) => r.score > 0.01)
  const grounded = !query.outOfScope && hasSignal && query.sources.every((s) => retrievedDocs.has(s))

  return (
    <>
      <Section id="retrieval" n="05" title="Retrieval">
        <H2>Find the few passages that matter</H2>
        <Lede>
          Pick a question. Every passage is scored by similarity to it, and the highest scorers are pulled out as context. Slide <span className="text-ink">top-k</span> to grab more or fewer.
        </Lede>
        <Card className="mt-8">
          <div className="mb-5 flex flex-wrap gap-2">
            {QUERIES.map((q) => (
              <button key={q.id} className={queryChip(q.id === queryId)} onClick={() => setQueryId(q.id)}>
                {q.text}
                {q.outOfScope && <span className="ml-1.5 font-mono text-faint">(tricky)</span>}
              </button>
            ))}
          </div>

          <div className="mb-6 max-w-xs">
            <Slider label="top-k" value={topK} min={1} max={6} unit="chunks" onChange={setTopK} />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <Scatter highlightIds={topIds} queryText={query.text} />
              <p className="mt-2 font-mono text-[0.7rem] text-faint">// query lands among its retrieved passages. 2D is approximate; ranking uses the full vectors.</p>
            </div>
            <div className="flex flex-col gap-2">
              {ranked.map((r) => {
                const picked = topIds.includes(r.chunk.id)
                return (
                  <div key={r.chunk.id} className={`rounded-sm border px-3 py-2 transition duration-200 ${picked ? 'border-primary bg-primary-soft/50' : 'border-line bg-bg opacity-70'}`}>
                    <div className="flex items-center justify-between gap-2 font-mono text-xs">
                      <span className="flex items-center gap-1.5 text-muted">
                        <span className="h-2 w-2" style={{ background: docColor(r.chunk.docId).dot }} />
                        doc {r.chunk.docId}
                      </span>
                      <span className="tabular-nums text-faint">{r.score.toFixed(2)}</span>
                    </div>
                    <div className="mt-1.5 h-1 w-full bg-line">
                      <div className="h-full bg-primary transition-[width] duration-500 ease-out" style={{ width: `${(r.score / maxScore) * 100}%` }} />
                    </div>
                    <p className="mt-1.5 line-clamp-2 text-sm text-ink/85">{r.chunk.text}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </Card>
      </Section>

      <Section id="generation" n="06" title="Generation">
        <H2>Answer only from what was retrieved</H2>
        <Lede>
          The retrieved passages are pasted into the prompt as context. The model must answer from them — and cite them. If the answer isn't there, a trustworthy system says so.
        </Lede>
        <Card className="mt-8">
          <div className="border border-line bg-bg p-4 font-mono text-[13px] leading-relaxed text-ink/85">
            <div className="mb-1 text-faint">// context</div>
            {top.map((r) => (
              <div key={r.chunk.id} className="mb-1">
                <span className="text-primary">[{r.chunk.docId}]</span> {r.chunk.text}
              </div>
            ))}
            <div className="mt-3 text-faint">// question</div>
            <div>{query.text}</div>
          </div>

          <div className="mt-5">
            {grounded ? (
              <>
                <div className="mb-3">
                  <Tag tone="good">Grounded · cites {query.sources.map((s) => `[${s}]`).join(' ')}</Tag>
                </div>
                <p className="text-lg leading-relaxed text-ink">{renderCited(query.answer)}</p>
              </>
            ) : (
              <>
                <div className="mb-3">
                  <Tag tone="amber">Abstained · no supporting source</Tag>
                </div>
                <p className="text-lg leading-relaxed text-ink">
                  {query.outOfScope
                    ? "I can't find that in the knowledge base. None of the retrieved passages mention it — so the honest answer is that this isn't covered, rather than a guess."
                    : "The passage needed to answer this wasn't retrieved. Increase top-k so the model actually has the source in front of it."}
                </p>
                <Callout tone="good">
                  <span className="font-semibold text-good">This is the point:</span> grounding means the system can decline. A model that only answers from sources can admit when there are none.
                </Callout>
              </>
            )}
          </div>
        </Card>
      </Section>
    </>
  )
}

function RecapSection() {
  const steps = ['Corpus', 'Chunk', 'Embed', 'Retrieve', 'Augment', 'Generate']
  return (
    <Section id="recap" n="07" title="The whole loop">
      <H2>From a guess to a grounded answer</H2>
      <Lede>
        That's RAG end to end: cut trusted documents into chunks, embed them, retrieve the few that match the question, paste them into the prompt, and generate an answer that cites — or honestly declines.
      </Lede>
      <div className="mt-8 flex flex-wrap items-center gap-2">
        {steps.map((s, i) => (
          <span key={s} className="flex items-center gap-2">
            <span className="rounded-sm border border-line bg-surface px-3 py-1.5 font-mono text-xs uppercase tracking-wide text-ink transition hover:border-primary hover:text-primary">{s}</span>
            {i < steps.length - 1 && <span className="font-mono text-faint">→</span>}
          </span>
        ))}
      </div>
    </Section>
  )
}

function Footer() {
  return (
    <footer className="mx-auto mt-8 max-w-3xl border-t border-line px-6 py-16 text-center font-mono text-xs text-faint">
      <p className="uppercase tracking-wide">Part of a series · how AI actually works</p>
      <p className="mt-2">Built by <span className="text-muted">Laela Zorana</span> · @codezorana · runs in your browser, no API keys</p>
    </footer>
  )
}

/* ------------------------------------------------------------------ */
/* Side nav                                                            */
/* ------------------------------------------------------------------ */

const SECTIONS = [
  { id: 'problem', label: 'The problem' },
  { id: 'corpus', label: 'Knowledge base' },
  { id: 'chunking', label: 'Chunking' },
  { id: 'embeddings', label: 'Embeddings' },
  { id: 'retrieval', label: 'Retrieval' },
  { id: 'generation', label: 'Generation' },
  { id: 'recap', label: 'The loop' },
]

function SideNav() {
  const [active, setActive] = useState('problem')
  useEffect(() => {
    const obs = new IntersectionObserver((entries) => entries.forEach((e) => { if (e.isIntersecting) setActive(e.target.id) }), { rootMargin: '-45% 0px -45% 0px' })
    SECTIONS.forEach((s) => {
      const el = document.getElementById(s.id)
      if (el) obs.observe(el)
    })
    return () => obs.disconnect()
  }, [])
  return (
    <nav className="fixed right-6 top-1/2 z-40 hidden -translate-y-1/2 lg:block">
      <ul className="flex flex-col gap-3">
        {SECTIONS.map((s) => (
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

/* ------------------------------------------------------------------ */

export default function App() {
  const { dark, setDark } = useDarkMode()
  return (
    <>
      <ScrollProgress />
      <SideNav />
      <TopBar dark={dark} setDark={setDark} />
      <main>
        <Hero />
        <ProblemSection />
        <CorpusSection />
        <ChunkingSection />
        <EmbeddingsSection />
        <RetrievalLab />
        <RecapSection />
      </main>
      <Footer />
    </>
  )
}
