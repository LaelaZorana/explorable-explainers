import { useState } from 'react'
import { RULES, TRAIN, TEST_INPUT, TEST_OUTPUT, PALETTE, verify, eq, firstVerified, type Grid, type Example } from './verifier'
import { useDarkMode, Reveal, ScrollProgress, TopBar, SectionLabel, Tag, H2, Lede, Card, Callout, Section, SideNav, SeriesFooter } from './ui'

function GridView({ g, size = 26 }: { g: Grid; size?: number }) {
  const rows = g.length
  const cols = g[0].length
  return (
    <svg width={cols * size} height={rows * size} viewBox={`0 0 ${cols * size} ${rows * size}`} className="shrink-0" role="img" aria-label="grid">
      {g.map((row, r) =>
        row.map((v, c) => (
          <rect key={`${r}-${c}`} x={c * size} y={r * size} width={size} height={size} fill={v === 0 ? 'var(--color-bg)' : PALETTE[v]} stroke="var(--color-line)" strokeWidth="1" />
        )),
      )}
    </svg>
  )
}

function Pair({ ex, label }: { ex: Example; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <div>
        <div className="mb-1 font-mono text-[0.62rem] uppercase tracking-wide text-faint">{label}</div>
        <GridView g={ex.input} />
      </div>
      <span className="font-mono text-primary">→</span>
      <GridView g={ex.output} />
    </div>
  )
}

const tab = (active: boolean) =>
  `px-4 py-1.5 font-mono text-xs uppercase tracking-wide transition ${active ? 'bg-ink text-bg' : 'text-muted hover:text-ink'}`

function VerifierLab() {
  const [verifierOn, setVerifierOn] = useState(true)
  const [selected, setSelected] = useState<string | null>(null)

  const autoIdx = verifierOn ? firstVerified() : 0
  const selIdx = selected ? RULES.findIndex((r) => r.id === selected) : autoIdx
  const rule = RULES[selIdx]
  const predicted = rule.apply(TEST_INPUT)
  const correct = eq(predicted, TEST_OUTPUT)

  return (
    <Card className="mt-8">
      <div className="mb-2 font-mono text-xs uppercase tracking-wide text-muted">// two worked examples — the rule must reproduce both</div>
      <div className="mb-6 flex flex-wrap gap-x-8 gap-y-4">
        {TRAIN.map((ex, i) => (
          <Pair key={i} ex={ex} label={`example ${i + 1}`} />
        ))}
      </div>

      <div className="mb-5 inline-flex rounded-sm border border-line">
        <button
          onClick={() => {
            setVerifierOn(false)
            setSelected(null)
          }}
          className={tab(!verifierOn && !selected)}
        >
          Verifier off
        </button>
        <button
          onClick={() => {
            setVerifierOn(true)
            setSelected(null)
          }}
          className={tab(verifierOn && !selected)}
        >
          Verifier on
        </button>
      </div>

      <div className="mb-2 font-mono text-xs uppercase tracking-wide text-muted">// candidate rules (click to inspect one)</div>
      <div className="flex flex-col gap-2">
        {RULES.map((r, i) => {
          const v = verify(r)
          const passes = v.every(Boolean)
          const isSel = i === selIdx
          return (
            <button
              key={r.id}
              onClick={() => setSelected(r.id)}
              className={`flex items-center justify-between gap-3 rounded-sm border px-3 py-2 text-left transition ${isSel ? 'border-primary bg-primary-soft/50' : 'border-line hover:border-ink'}`}
            >
              <span className="text-sm text-ink">{r.label}</span>
              <span className="flex items-center gap-2.5 font-mono text-[0.7rem]">
                {v.map((ok, j) => (
                  <span key={j} className={ok ? 'text-good' : 'text-bad'}>
                    ex{j + 1} {ok ? '✓' : '✗'}
                  </span>
                ))}
                {passes && <span className="rounded-sm border border-good/50 px-1.5 py-0.5 uppercase text-good">verified</span>}
              </span>
            </button>
          )
        })}
      </div>

      <div className="mt-6 border-t border-line pt-5">
        <div className="mb-3 font-mono text-xs uppercase tracking-wide text-muted">
          {selected ? '// you picked' : verifierOn ? '// verifier selected' : '// no verifier — takes the first guess'}: <span className="text-ink">{rule.label}</span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <div className="mb-1 font-mono text-[0.62rem] uppercase tracking-wide text-faint">test input</div>
            <GridView g={TEST_INPUT} />
          </div>
          <span className="font-mono text-primary">→</span>
          <div>
            <div className="mb-1 font-mono text-[0.62rem] uppercase tracking-wide text-faint">prediction</div>
            <GridView g={predicted} />
          </div>
          <div className="ml-1">{correct ? <Tag tone="good">Correct</Tag> : <Tag tone="bad">Wrong</Tag>}</div>
        </div>
        <Callout tone={correct ? 'good' : 'bad'}>
          {correct
            ? 'The verifier kept only the rule that reproduced every example, then applied it to the test — and got it right. That check is the entire trick.'
            : 'With the verifier off, the system commits to a plausible-looking rule that never actually matched the examples — so it fails the test. Flip the verifier on.'}
        </Callout>
      </div>
    </Card>
  )
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="ee-grid-bg pointer-events-none absolute inset-0 -z-10" />
      <div className="mx-auto max-w-3xl px-6 pb-16 pt-24 text-center sm:pt-28">
        <p className="mb-6 font-mono text-xs uppercase tracking-[0.2em] text-primary">Explorable Explainer · Reasoning & Test-Time Compute</p>
        <h1 className="font-display text-6xl font-semibold tracking-[-0.03em] text-ink sm:text-7xl">
          How a <span className="text-primary">Verifier</span> Works
        </h1>
        <p className="mx-auto mt-7 max-w-xl text-lg leading-relaxed text-muted sm:text-xl">
          A model's first guess is often wrong. But if it can propose many candidate answers and <span className="text-ink">check</span> each one, it can keep the rare right one. That check is how reasoning systems get reliable.
        </p>
        <div className="mt-7 flex items-center justify-center gap-2 font-mono text-xs text-faint">
          <span className="text-muted">Laela Zorana</span>
          <span aria-hidden>·</span>
          <span>@codezorana</span>
        </div>
        <div className="mt-14 flex justify-center text-faint">
          <span className="animate-bounce">↓</span>
        </div>
      </div>
    </section>
  )
}

const SECTIONS = [
  { id: 'problem', label: 'The problem' },
  { id: 'lab', label: 'Generate & verify' },
  { id: 'why', label: 'Why it works' },
  { id: 'recap', label: 'In one line' },
]

export default function VerifierApp() {
  const { dark, setDark } = useDarkMode()
  return (
    <div className="accent-acid">
      <ScrollProgress />
      <SideNav sections={SECTIONS} />
      <TopBar series="Verifier" home="../" dark={dark} setDark={setDark} />
      <main>
        <Hero />

        <section id="problem" className="mx-auto max-w-3xl px-6 py-16 sm:py-20">
          <Reveal>
            <SectionLabel n="01" title="The problem" />
            <H2>One guess is a gamble</H2>
            <Lede>
              Ask a model to infer a rule and it will confidently produce one — often the wrong one. The fix isn't a smarter single guess. It's to <span className="text-ink">generate several candidates</span> and add a second component that can tell which are actually correct: a <span className="text-ink">verifier</span>.
            </Lede>
          </Reveal>
        </section>

        <Section id="lab" n="02" title="Generate & verify">
          <H2>Propose many, keep what checks out</H2>
          <Lede>
            Here's a small ARC-style puzzle: infer the rule from two examples, then apply it to a new grid. The generator offers several plausible rules — but only the verifier, testing each against the examples, knows which one holds. Flip it off and on.
          </Lede>
          <VerifierLab />
        </Section>

        <Section id="why" n="03" title="Why it works">
          <H2>Checking is easier than guessing</H2>
          <Lede>
            For many problems it's far easier to <span className="text-ink">verify</span> a candidate than to produce a correct one from scratch. So you spend compute generating lots of candidates and let a cheap, reliable check filter them. Generate more candidates and the odds that a correct one appears — and survives the verifier — climb fast. This generate-and-verify loop is exactly how today's strongest reasoning systems, and ARC-AGI solvers, turn raw guesses into dependable answers.
          </Lede>
        </Section>

        <Section id="recap" n="04" title="In one line">
          <H2>A model that can check itself can be trusted</H2>
          <Lede>
            Generation is creative but unreliable; verification is narrow but dependable. Put them together — propose, check, select — and you get answers you can actually stand behind.
          </Lede>
        </Section>
      </main>
      <SeriesFooter more={{ href: '../', label: 'All three explainers' }} />
    </div>
  )
}
