/* ------------------------------------------------------------------ *
 * A deterministic toy of next-token prediction, to show *why* a model
 * hallucinates: it always emits the most plausible-sounding token, even
 * when it has no idea. Runs entirely in the browser, no model, no keys.
 * ------------------------------------------------------------------ */

export function softmax(logits: number[], temp: number): number[] {
  const t = Math.max(0.05, temp)
  const scaled = logits.map((l) => l / t)
  const max = Math.max(...scaled)
  const exps = scaled.map((s) => Math.exp(s - max))
  const sum = exps.reduce((a, b) => a + b, 0)
  return exps.map((e) => e / sum)
}

export function argmax(xs: number[]): number {
  let best = 0
  for (let i = 1; i < xs.length; i++) if (xs[i] > xs[best]) best = i
  return best
}

export type Cand = { tok: string; logit: number }

export type Prompt = {
  id: number
  label: string
  prefix: string
  known: boolean
  /** one candidate list per generated token */
  steps: Cand[][]
  note: string
}

export const PROMPTS: Prompt[] = [
  {
    id: 0,
    label: 'A fact it knows',
    prefix: 'The first person to walk on the Moon was',
    known: true,
    steps: [
      [
        { tok: 'Neil', logit: 9.4 },
        { tok: 'Buzz', logit: 4.0 },
        { tok: 'an', logit: 2.2 },
        { tok: 'the', logit: 2.0 },
        { tok: 'a', logit: 1.6 },
      ],
      [
        { tok: 'Armstrong', logit: 9.7 },
        { tok: 'Aldrin', logit: 3.1 },
        { tok: 'A.', logit: 1.4 },
        { tok: ',', logit: 1.0 },
        { tok: 'who', logit: 0.8 },
      ],
      [
        { tok: '.', logit: 6.2 },
        { tok: ',', logit: 3.4 },
        { tok: 'in', logit: 3.0 },
        { tok: 'back', logit: 1.8 },
        { tok: 'on', logit: 1.6 },
      ],
    ],
    note: 'A fact the model saw thousands of times in training. Each distribution spikes hard on one token: very high confidence, and correct.',
  },
  {
    id: 1,
    label: 'A fact it doesn\'t know',
    prefix: 'The capital of the Marenne Islands is',
    known: false,
    steps: [
      [
        { tok: 'Marenne', logit: 3.9 },
        { tok: 'Port', logit: 3.6 },
        { tok: 'a', logit: 3.3 },
        { tok: 'the', logit: 3.0 },
        { tok: 'located', logit: 2.7 },
      ],
      [
        { tok: 'City', logit: 3.4 },
        { tok: 'Town', logit: 3.1 },
        { tok: 'Bay', logit: 2.9 },
        { tok: 'Harbour', logit: 2.7 },
        { tok: 'Isle', logit: 2.5 },
      ],
      [
        { tok: ',', logit: 3.8 },
        { tok: '.', logit: 3.4 },
        { tok: 'with', logit: 3.0 },
        { tok: 'and', logit: 2.8 },
        { tok: 'a', logit: 2.4 },
      ],
    ],
    note: 'The Marenne Islands are fictional, so the model has never seen them. The distributions are flat (no token is clearly right), yet it still commits to the most plausible-sounding one and writes "Marenne City": a confident fabrication. (That is exactly the made-up answer from the RAG explainer.)',
  },
]
