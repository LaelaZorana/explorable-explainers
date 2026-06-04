/* ------------------------------------------------------------------ *
 * A small, fully deterministic model of a RAG pipeline.
 * No network, no API keys. Every step is computed in the browser so
 * the explainer is honest about what it's showing and runs anywhere.
 * ------------------------------------------------------------------ */

export type Doc = { id: number; title: string; text: string }

export const CORPUS: Doc[] = [
  {
    id: 1,
    title: 'Geography',
    text: 'The Marenne Islands are an archipelago of 14 islands in the southern Cerulean Sea. The largest island, Tavros, holds most of the population.',
  },
  {
    id: 2,
    title: 'Capital & People',
    text: 'Port Aleen, on the island of Tavros, is the capital of the Marenne Islands. The total population is about 84,000 residents.',
  },
  {
    id: 3,
    title: 'Economy',
    text: "Marenne's economy rests on kelp farming, eco-tourism, and tidal energy, which supplies over 70% of the islands' electricity.",
  },
  {
    id: 4,
    title: 'Climate',
    text: 'The islands have a mild maritime climate, with frequent fog in the cool season and gentle trade winds through the summer.',
  },
  {
    id: 5,
    title: 'History',
    text: 'The Marenne Islands were settled by Cael navigators around 1200 CE and unified under a single island council in 1864.',
  },
]

const STOP = new Set(
  'the a an of and or to in on at is are was were be been being it its this that these those with by from as over under about into across through for has have had they their them which when where who whom whose will would can could'.split(
    ' ',
  ),
)

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9%\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w && !STOP.has(w))
}

/* Vocabulary built from the corpus only. */
export const VOCAB: string[] = (() => {
  const set = new Set<string>()
  for (const d of CORPUS) for (const w of tokenize(d.text)) set.add(w)
  return [...set].sort()
})()

const VOCAB_INDEX: Record<string, number> = Object.fromEntries(VOCAB.map((w, i) => [w, i]))

export function tfVector(text: string): number[] {
  const v = new Array(VOCAB.length).fill(0)
  for (const w of tokenize(text)) {
    const i = VOCAB_INDEX[w]
    if (i !== undefined) v[i] += 1
  }
  return v
}

export function cosine(a: number[], b: number[]): number {
  let dot = 0,
    na = 0,
    nb = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    na += a[i] * a[i]
    nb += b[i] * b[i]
  }
  if (na === 0 || nb === 0) return 0
  return dot / (Math.sqrt(na) * Math.sqrt(nb))
}

/* ----------------------------- chunking ---------------------------- */

export type Chunk = { id: number; docId: number; docTitle: string; text: string; words: number }

export function chunkDocs(docs: Doc[], size: number, overlap: number): Chunk[] {
  const out: Chunk[] = []
  let cid = 0
  const ov = Math.min(Math.max(0, overlap), size - 1)
  const step = Math.max(1, size - ov)
  for (const doc of docs) {
    const words = doc.text.split(/\s+/).filter(Boolean)
    for (let i = 0; i < words.length; i += step) {
      const slice = words.slice(i, i + size)
      if (!slice.length) break
      out.push({ id: cid++, docId: doc.id, docTitle: doc.title, text: slice.join(' '), words: slice.length })
      if (i + size >= words.length) break
    }
  }
  return out
}

/* Fixed sentence-level chunks, the stable retrieval units used by the
 * embedding, retrieval and generation sections. */
export const SENT_CHUNKS: Chunk[] = (() => {
  const out: Chunk[] = []
  let id = 0
  for (const doc of CORPUS) {
    const sentences = doc.text.match(/[^.]+\./g) ?? [doc.text]
    for (const s of sentences) {
      const text = s.trim()
      out.push({ id: id++, docId: doc.id, docTitle: doc.title, text, words: text.split(/\s+/).length })
    }
  }
  return out
})()

/* ----------------------------- queries ----------------------------- */

export type QueryItem = { id: number; text: string; answer: string; sources: number[]; outOfScope?: boolean }

export const QUERIES: QueryItem[] = [
  {
    id: 0,
    text: 'What is the capital and population of the islands?',
    answer: 'The capital is Port Aleen[[2]], and about 84,000 people live across the Marenne Islands[[2]].',
    sources: [2],
  },
  {
    id: 1,
    text: "How is the islands' electricity generated?",
    answer: "Tidal energy supplies over 70% of the islands' electricity[[3]].",
    sources: [3],
  },
  {
    id: 2,
    text: 'When were the islands settled?',
    answer: 'They were settled by Cael navigators around 1200 CE and unified under one council in 1864[[5]].',
    sources: [5],
  },
  {
    id: 3,
    text: 'What is the climate like?',
    answer: 'The climate is mild and maritime: fog in the cool season, gentle trade winds in summer[[4]].',
    sources: [4],
  },
  { id: 4, text: 'What currency do the islands use?', answer: '', sources: [], outOfScope: true },
]

export type Ranked = { chunk: Chunk; score: number }

export function retrieve(queryText: string, chunks: Chunk[]): Ranked[] {
  const qv = tfVector(queryText)
  return chunks
    .map((c) => ({ chunk: c, score: cosine(qv, tfVector(c.text)) }))
    .sort((a, b) => b.score - a.score)
}

/* --------------- deterministic 2D projection (for plots) ----------- */

function mulberry32(seed: number) {
  return function () {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/* A fixed random projection maps high-dim term vectors to 2D so we can
 * *look* at the embedding space, an approximation of the real geometry. */
const PROJ: number[][] = (() => {
  const rnd = mulberry32(11)
  return VOCAB.map(() => [rnd() * 2 - 1, rnd() * 2 - 1])
})()

export function project2D(vec: number[]): { x: number; y: number } {
  let x = 0,
    y = 0
  for (let i = 0; i < vec.length; i++) {
    x += vec[i] * PROJ[i][0]
    y += vec[i] * PROJ[i][1]
  }
  return { x, y }
}

/* Stable colour per source document, used across every visual. */
export function docColor(id: number): { border: string; dot: string; soft: string } {
  const hue = (id * 67 + 205) % 360
  return {
    border: `hsl(${hue} 62% 56%)`,
    dot: `hsl(${hue} 62% 52%)`,
    soft: `hsl(${hue} 62% 52% / 0.12)`,
  }
}
