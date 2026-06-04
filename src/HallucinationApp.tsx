import { useState } from 'react'
import { PROMPTS, softmax, argmax } from './hallucinate'
import { useDarkMode, Reveal, ScrollProgress, TopBar, SectionLabel, Tag, H2, Lede, Card, Callout, Section, Slider, SideNav, SeriesFooter } from './ui'

/* ------------------------------------------------------------------ */
/* Next-token predictor (the core interactive)                         */
/* ------------------------------------------------------------------ */

const chip = (active: boolean) =>
  `rounded-sm border px-3 py-1.5 text-sm transition ${active ? 'border-primary bg-primary-soft text-primary-ink' : 'border-line text-muted hover:border-ink hover:text-ink'}`
const btnPrimary = 'rounded-sm bg-primary px-4 py-2 font-mono text-xs uppercase tracking-wide text-white transition hover:opacity-90'
const btnGhost = 'rounded-sm border border-line px-4 py-2 font-mono text-xs uppercase tracking-wide text-muted transition hover:border-ink hover:text-ink'

function TokenPredictor() {
  const [promptId, setPromptId] = useState(0)
  const [temp, setTemp] = useState(0.7)
  const [step, setStep] = useState(0)

  const prompt = PROMPTS[promptId]
  const N = prompt.steps.length
  const done = step >= N

  const picked = prompt.steps.slice(0, step).map((cands) => cands[argmax(cands.map((c) => c.logit))].tok)
  const cur = done ? null : prompt.steps[step]
  const probs = cur ? softmax(cur.map((c) => c.logit), temp) : []
  const order = cur ? cur.map((_, i) => i).sort((a, b) => probs[b] - probs[a]) : []
  const topIdx = cur ? argmax(cur.map((c) => c.logit)) : -1

  return (
    <Card className="mt-8">
      <div className="mb-5 flex flex-wrap gap-2">
        {PROMPTS.map((p) => (
          <button
            key={p.id}
            onClick={() => {
              setPromptId(p.id)
              setStep(0)
            }}
            className={chip(p.id === promptId)}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* growing sentence */}
      <div className="mb-6 rounded-sm border border-line bg-bg p-4 font-mono text-[15px] leading-relaxed">
        <span className="text-ink">{prompt.prefix} </span>
        {picked.map((t, i) => (
          <span key={i} className="text-primary">
            {t}{' '}
          </span>
        ))}
        {!done && <span className="text-primary">▌</span>}
      </div>

      <div className="mb-6 max-w-xs">
        <Slider label="temperature" value={temp} min={0.1} max={1.5} step={0.1} unit="" onChange={setTemp} />
      </div>

      {cur ? (
        <>
          <div className="mb-2 flex items-center justify-between font-mono text-xs uppercase tracking-wide text-muted">
            <span>next-token distribution</span>
            <span>
              top: <span className="text-ink">{cur[topIdx].tok}</span> {(probs[topIdx] * 100).toFixed(0)}%
            </span>
          </div>
          <div className="flex flex-col gap-1.5">
            {order.map((i) => {
              const isTop = i === topIdx
              return (
                <div key={i} className="flex items-center gap-2">
                  <span className={`w-24 shrink-0 truncate text-right font-mono text-sm ${isTop ? 'text-primary' : 'text-muted'}`}>{cur[i].tok}</span>
                  <div className="h-3 flex-1 bg-line/60">
                    <div className={isTop ? 'h-full bg-primary' : 'h-full bg-muted/50'} style={{ width: `${probs[i] * 100}%`, transition: 'width .25s ease' }} />
                  </div>
                  <span className="w-9 shrink-0 text-right font-mono text-xs tabular-nums text-faint">{(probs[i] * 100).toFixed(0)}%</span>
                </div>
              )
            })}
          </div>
          <div className="mt-6 flex gap-2">
            <button onClick={() => setStep(step + 1)} className={btnPrimary}>
              Generate next token →
            </button>
            {step > 0 && (
              <button onClick={() => setStep(0)} className={btnGhost}>
                Reset
              </button>
            )}
          </div>
        </>
      ) : (
        <>
          <div className="mb-1">
            <Tag tone={prompt.known ? 'good' : 'bad'}>{prompt.known ? 'Confident · correct' : 'Confident · fabricated'}</Tag>
          </div>
          <Callout tone={prompt.known ? 'good' : 'bad'}>{prompt.note}</Callout>
          <button onClick={() => setStep(0)} className={`${btnGhost} mt-4`}>
            ↺ Run again
          </button>
        </>
      )}
    </Card>
  )
}

/* ------------------------------------------------------------------ */
/* Sections                                                            */
/* ------------------------------------------------------------------ */

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="ee-grid-bg pointer-events-none absolute inset-0 -z-10" />
      <div className="mx-auto max-w-3xl px-6 pb-16 pt-24 text-center sm:pt-28">
        <p className="mb-6 font-mono text-xs uppercase tracking-[0.2em] text-primary">Explorable Explainer · Large Language Models</p>
        <h1 className="font-display text-6xl font-semibold tracking-[-0.03em] text-ink sm:text-7xl">
          Why LLMs <span className="text-primary">Hallucinate</span>
        </h1>
        <p className="mx-auto mt-7 max-w-xl text-lg leading-relaxed text-muted sm:text-xl">
          A language model doesn't look facts up. It predicts the next word. Watch, token by token, how that one mechanism produces both brilliant answers and confident nonsense.
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

const FIXES = [
  { k: 'Retrieval (RAG)', v: 'paste real sources into the prompt so the likely next tokens are the true ones.' },
  { k: 'Grounding & citations', v: 'force every claim to point at a source you can check.' },
  { k: 'Teach it to abstain', v: 'reward "I don’t know" over a confident guess.' },
  { k: 'Verification', v: 'a second pass that checks the draft against the sources.' },
]

const SECTIONS = [
  { id: 'problem', label: 'The problem' },
  { id: 'mechanism', label: 'Next-token' },
  { id: 'confidence', label: 'Confidence' },
  { id: 'fixes', label: 'What helps' },
  { id: 'recap', label: 'In one line' },
]

export default function HallucinationApp() {
  const { dark, setDark } = useDarkMode()
  return (
    <div className="accent-cobalt">
      <ScrollProgress />
      <SideNav sections={SECTIONS} />
      <TopBar series="Hallucination" home="../" dark={dark} setDark={setDark} />
      <main>
        <Hero />

        <section id="problem" className="mx-auto max-w-3xl px-6 py-16 sm:py-20">
          <Reveal>
            <SectionLabel n="01" title="The problem" />
            <H2>Fluent, confident, and sometimes made up</H2>
            <Lede>
              An LLM generates text one token at a time, always choosing something plausible. It has no separate "do I actually know this?" check, so when it doesn't know, it doesn't stop. It guesses, in the exact same confident voice it uses for facts.
            </Lede>
          </Reveal>
        </section>

        <Section id="mechanism" n="02" title="Next-token prediction">
          <H2>It's a probability machine</H2>
          <Lede>
            At each step the model ranks possible next tokens by probability and commits to the top one. Step through it, and switch between a fact it knows and one it doesn't. Watch the distribution go flat exactly when it starts making things up.
          </Lede>
          <TokenPredictor />
        </Section>

        <Section id="confidence" n="03" title="Confidence ≠ truth">
          <H2>The model can't feel its own ignorance</H2>
          <Lede>
            Look at the "top %" readout while you step. For the made-up place it's lower, the model is genuinely <span className="text-ink">less sure</span>, but it still commits, and nothing downstream sees that doubt. The fabricated answer arrives in the same authoritative tone as the real one. High probability is not the same as being right.
          </Lede>
        </Section>

        <Section id="fixes" n="04" title="What actually helps">
          <H2>Give it something to stand on</H2>
          <Lede>You can't make a next-token predictor "know" what it doesn't. But you can change what it predicts from:</Lede>
          <div className="mt-6 flex flex-col gap-2">
            {FIXES.map((it) => (
              <div key={it.k} className="rounded-sm border border-line bg-surface px-4 py-3">
                <span className="font-mono text-xs uppercase tracking-wide text-primary">{it.k}</span>
                <span className="text-sm text-ink/85"> · {it.v}</span>
              </div>
            ))}
          </div>
          <Callout tone="primary">
            The companion explainer walks through the first fix end to end →{' '}
            <a className="font-semibold text-primary underline" href="./">
              How RAG Actually Works
            </a>
            .
          </Callout>
        </Section>

        <Section id="recap" n="05" title="In one line">
          <H2>Hallucination is the default, not a bug</H2>
          <Lede>
            A model that always predicts the most plausible next token will always produce <span className="text-ink">something</span>, even with nothing to go on. Making it trustworthy means giving it sources, citations, and permission to say "I don't know."
          </Lede>
        </Section>
      </main>
      <SeriesFooter more={{ href: '../verifier/', label: 'How a Verifier Works' }} />
    </div>
  )
}
