# Explorable Explainers: How RAG Actually Works

An interactive, Distill-style essay that shows, piece by piece, how **Retrieval-Augmented Generation** turns a confident, hallucinating language model into one that answers from real sources and cites them.

**▶ Live demo:** https://laelazorana.github.io/explorable-explainers/

Built by **Laela Zorana** · @codezorana · the first in a series of explorable explainers on how AI actually works.

---

## Why it exists

Ask a language model about something it never learned and it rarely says *"I don't know"*, it just invents a fluent, plausible answer instead. This explainer makes the fix tangible, because you **watch** the full RAG pipeline run and you can play with every step.

## What you can do

- **Flip** between a plain LLM (confidently wrong) and RAG (grounded + cited).
- **Drag sliders** to re-chunk the documents in real time and see the size/overlap trade-off.
- **See the embeddings** plotted as points in 2D space.
- **Pick a question and tune top-k**, so every passage gets scored by cosine similarity and the best matches light up in both the plot and a ranked list.
- **Watch generation** assemble the prompt and produce a cited answer, or honestly **abstain** when the answer isn't in the knowledge base.

Everything is computed **in your browser**: real term-frequency vectors and cosine similarity, no servers, **no API keys**. The pipeline is an honest, deterministic *simulation* built for teaching, not a wrapper around a hosted model.

## Tech

- **React + TypeScript + Vite**
- **Tailwind CSS v4**: custom design system, light/dark mode, fully responsive
- Deploys as a **static site** anywhere (this one runs on GitHub Pages)

## Run locally

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # static build → dist/
```

## License

MIT
