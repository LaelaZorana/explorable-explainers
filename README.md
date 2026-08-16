# Explorable Explainers: How AI Actually Works

Three interactive, Distill-style essays that take one AI idea apart at a time. Everything runs in your browser, so there are no sign-ups, no servers, and no API keys.

**Live site:** https://laelazorana.github.io/explorable-explainers/

Built by **Laela Zorana** · @codezorana

---

## What's here

The site is a small series. The landing page at the root links to all three explainers, and each explainer cross-links to the next one.

### 01 · How RAG Actually Works

https://laelazorana.github.io/explorable-explainers/rag/

Retrieval turns a guessing model into one that answers from real sources and cites them. You can:

- Flip between a plain LLM (confidently wrong) and RAG (grounded and cited).
- Drag the chunk size and overlap sliders to re-chunk the documents in real time and watch the trade-off.
- See every chunk plotted as a point in a 2D embedding space.
- Pick a question and tune top-k, so every passage gets scored by cosine similarity and the best matches light up in both the plot and the ranked list.
- Watch generation assemble the prompt and produce a cited answer, or abstain when the answer isn't in the knowledge base.

### 02 · Why LLMs Hallucinate

https://laelazorana.github.io/explorable-explainers/hallucination/

A next-token predictor always emits something plausible, even when it has no idea. You can:

- Step through generation one token at a time and see the full candidate distribution at each step.
- Switch between a fact the model knows and one it doesn't, then watch the distribution go flat exactly where it starts inventing.
- Move the temperature slider and see how it reshapes those probabilities.
- Read the "top %" readout, because the model is measurably less sure on the fabricated answer but it commits anyway.

### 03 · How a Verifier Works

https://laelazorana.github.io/explorable-explainers/verifier/

Generate many candidate answers, then keep only the one that actually checks out. You can:

- Look at two worked examples of a small ARC-style grid puzzle.
- Turn the verifier off and watch the first plausible rule get picked, which is the wrong one.
- Turn it back on and see each candidate rule checked against both examples, so only the rule that reproduces both survives.
- Compare the chosen rule's prediction on a held-out test grid against the ground truth.

## How it works under the hood

Every number on these pages is really computed in your browser. The RAG explainer builds real term-frequency vectors and scores them with cosine similarity. The hallucination explainer runs a real softmax over hand-authored logits. The verifier explainer applies real grid transforms and compares the outputs exactly. None of it calls a hosted model, because these are honest, deterministic simulations built for teaching rather than wrappers around an API.

## Tech

- React, TypeScript, and Vite, with one HTML entry point per explainer.
- Tailwind CSS v4, custom design system, light and dark mode, fully responsive.
- A static build that deploys anywhere. This one runs on GitHub Pages from the `gh-pages` branch.

## Run locally

```bash
npm install
npm run dev        # http://localhost:5173
npm run typecheck  # tsc --noEmit
npm run build      # static build into dist/
npm run preview    # serve the built site
```

## Deploying

Pushes to `main` run typecheck and a production build in CI, and a green build on `main` publishes `dist/` to the `gh-pages` branch, which is what GitHub Pages serves. See `.github/workflows/ci.yml`.

## License

MIT. See [LICENSE](LICENSE).
