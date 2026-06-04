/* ------------------------------------------------------------------ *
 * A tiny ARC-style task to show what a verifier does: a generator can
 * propose many candidate rules, but only a verifier — checking each
 * against the worked examples — can tell which one is actually right.
 * All deterministic, in-browser. No model, no keys.
 * ------------------------------------------------------------------ */

export type Grid = number[][]

export function eq(a: Grid, b: Grid): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}

export function mirrorH(g: Grid): Grid {
  return g.map((r) => [...r].reverse())
}
export function mirrorV(g: Grid): Grid {
  return [...g].reverse()
}
export function rotate180(g: Grid): Grid {
  return g.map((r) => [...r].reverse()).reverse()
}
export function swap(g: Grid, a: number, b: number): Grid {
  return g.map((r) => r.map((c) => (c === a ? b : c === b ? a : c)))
}

export type Rule = { id: string; label: string; apply: (g: Grid) => Grid }

/* Candidate rules a generator might propose (order matters: the first is
 * a plausible-but-wrong guess, so "no verifier" picks it). */
export const RULES: Rule[] = [
  { id: 'rot180', label: 'Rotate 180°', apply: rotate180 },
  { id: 'mirrorV', label: 'Mirror top–bottom', apply: mirrorV },
  { id: 'mirrorH', label: 'Mirror left–right', apply: mirrorH },
  { id: 'swap12', label: 'Swap colours 1 ↔ 2', apply: (g) => swap(g, 1, 2) },
  { id: 'identity', label: 'Copy unchanged', apply: (g) => g },
]

export type Example = { input: Grid; output: Grid }

/* The hidden rule is "mirror left–right". */
const TRAIN_INPUTS: Grid[] = [
  [
    [1, 0, 0],
    [2, 2, 0],
    [0, 0, 3],
  ],
  [
    [0, 1, 1],
    [3, 0, 0],
    [0, 0, 2],
  ],
]
export const TRAIN: Example[] = TRAIN_INPUTS.map((input) => ({ input, output: mirrorH(input) }))

export const TEST_INPUT: Grid = [
  [2, 0, 1],
  [0, 3, 0],
  [1, 0, 0],
]
export const TEST_OUTPUT: Grid = mirrorH(TEST_INPUT) // ground truth for the test

/* 0 = empty; 1..4 = colours */
export const PALETTE = ['transparent', '#22c55e', '#3b82f6', '#f59e0b', '#ec4899']

/** pass/fail of a rule against each training example */
export function verify(rule: Rule): boolean[] {
  return TRAIN.map((ex) => eq(rule.apply(ex.input), ex.output))
}

/** index of the first rule that passes every training example, or -1 */
export function firstVerified(): number {
  return RULES.findIndex((r) => verify(r).every(Boolean))
}
