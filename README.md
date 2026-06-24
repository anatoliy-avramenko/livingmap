# livingmap

An AI-assisted **Living Mutual Action Plan** inside a Digital Sales Room (DSR).

Most sales action plans are generated once from a meeting transcript and then left to rot. `livingmap` is the opposite: a **stateful plan that keeps mutating** as new facts about the deal arrive. Each incoming Signal (a new meeting transcript, buyer engagement telemetry, a passing due date, an uploaded document) is re-checked against the *current* plan; the AI **proposes** concrete changes; the seller approves or rejects each one; and every change is recorded as an append-only event that names the Signal that caused it.

The AI is the core of the feature, not a bolt-on: remove it and you are left with a spreadsheet someone has to remember to update.

## The loop

```
Signal  →  AI reasons over the current MAP  →  Proposal (set of operations)
        →  seller approves / rejects each operation
        →  approved op mutates a Task  +  writes a MapEvent (in one step)
        →  plan visibly tracks reality; every Task can explain why it changed
```

## Domain model

- A **MAP** contains **Milestones** (coarse, stable phases showing aggregate progress).
- A **Milestone** contains **Tasks** — the atomic to-do with an owner, a due date, and a status (incl. risk states `at-risk` / `blocked`).
- A **Task** carries an expandable history of **MapEvents**.
- A **Signal** causes the AI to emit a **Proposal**; an approved Proposal writes a **MapEvent** and mutates a Task.

Current state is read **directly** from Milestones and Tasks. The MapEvent stream is an append-only audit sidecar (state-primary, not event-sourced). Full domain language lives in [`CONTEXT.md`](./CONTEXT.md).

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4**
- **Anthropic** (Claude) via a server-side Next route handler, using tool-use so proposals are schema-constrained
- **Vitest** for unit tests

## Getting started

### 1. Install

```bash
npm install
```

### 2. Configure the API key

The proposal engine calls Claude from a server route. Copy the example env file and add your key:

```bash
cp .env.example .env.local
```

```
ANTHROPIC_API_KEY=sk-ant-...
```

The key is read **server-side only** and is never shipped to the browser. `.env.local` is gitignored.

### 3. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The **Demo controls** panel (not part of the real buyer/seller experience) simulates Signals: pick a curated example, or inject a free-text Signal the engine has never seen — the latter always calls the live AI, which is the proof the model genuinely reasons rather than replaying canned answers.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run start` | Run the production build |
| `npm test` | Run the Vitest unit suite |

## Tests

```bash
npm test
```

Unit tests cover the reducer (each operation type applies correctly and writes exactly one MapEvent; rejections are recorded without mutating state; progress derivation), the AI tool-response sanitizer, and supporting helpers.

## Notes on the demo

- The ~8 curated Signals cache a known-good AI response so a guided walkthrough survives an API/network outage; the free-text injector always runs live and degrades honestly if the API is unavailable.
- This is the **Action Plan tab** of a DSR built deep, not a broad-and-shallow mock of a whole product.
