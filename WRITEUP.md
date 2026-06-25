# Living Mutual Action Plan — Write-Up

**Category:** C — Meetings (on the border with the Digital Sales Room)
**Feature:** A Mutual Action Plan (MAP) that keeps changing over the deal. Each new meeting is a fresh Signal checked against the existing plan. The AI proposes changes, the seller approves each one, and every change is recorded so any task can show which Signal caused it.

This sits between two areas. It starts from a meeting (the transcript that creates and later updates the plan), but it lives in the Digital Sales Room (DSR) as the shared Action Plan both sides work from. So it's a Meetings feature whose home is the DSR.

The buyer-behaviour numbers below are vendor-cited (Gartner via GetAccept/Aligned, 6sense). I use them to show the problem is real, not to claim an exact ROI.

---

## Mission 1 — AI in the product

### The problem

The MAP is the part of a DSR vendors talk about most, and the part most often done badly:

- It's built *for* the buyer, not *with* them — usually a template the buyer never agreed to.
- It goes stale and turns into a doc nobody opens.
- The deal mostly runs with no rep in the room (around 95% of the buying journey). The MAP is one of the few things still working in that gap, but only if it's current.
- Deals are lost to indecision more than to competitors (GetAccept cites ~61%). A stale plan is indecision that sticks around.
- The buying committee is large (around 6–11 people), and deals stall when the plan only reflects the champion.

So the MAP is usually a static document, not a current picture of the deal. Today's AI builds one from a transcript and then people let it go stale.

### What the feature is

The Living MAP is a stateful object in the DSR's Action Plan tab:

- A **MAP** has **Milestones** (broad phases, with progress like 3/6).
- A **Milestone** has **Tasks** (an owner, a due date, a status).
- A **Task** has a history of **MapEvents**.

Three kinds of **Signal** keep it current. The first is the main one; the other two show the same engine works beyond transcripts:

1. A new meeting transcript — checked against the existing MAP, not used to rebuild it.
2. Buyer engagement (who viewed what, who went quiet).
3. Elapsed time (a due date passing is a Signal).

When a Signal arrives, the AI looks at it against the current MAP and returns a **Proposal**: a few concrete changes (move a date, flag a task at-risk, add a task, add a milestone). The seller approves or rejects each one. An approved change updates the task and writes a MapEvent in the same step.

The AI is the feature. Without it there's no loop, just a spreadsheet someone has to remember to update. Two things follow that the static-document products don't have:

- **Risk states on tasks.** A task can be **at-risk** or **blocked**, not just done/not-done. Slippage and going quiet show up inside the plan instead of in a separate dashboard.
- **Traceability.** Every change names the Signal that caused it, so a task can answer "why did this move?" — "the budget meeting on the 14th pushed this date."

---

## Mission 2 — Product thinking & trade-offs

### 1. General LLM reasoning, not a rules engine

Turning a Signal into a Proposal is a reasoning step, not a lookup over a fixed list of Signal types. A hand-written catalog of `signal → change` rules would be predictable but could only handle cases I wrote down.

The free-text "inject custom signal" input is the proof the model is doing real work: the seller can type a fact the system has never seen, and the engine still returns valid changes against the current plan. The curated examples are suggested inputs for that injector, while the injector itself is what shows the model generalises instead of looking things up.

### 2. Propose-then-approve, per operation, with rejections recorded

The AI never changes the MAP on its own. It proposes; the seller approves.

- **Per operation, not all-or-nothing.** One Signal can produce several changes. A seller may trust one (flag at-risk) and reject another (reassign owner). All-or-nothing would make them throw out good changes with bad, so each change has its own state: pending / approved / rejected.
- **Rejections are recorded too**, shown struck-through, not dropped. A log of only approvals would look like rubber-stamping; showing rejections shows the seller is in control.

A wrong Proposal on a new Signal does no harm, because nothing changes until a person says so.

### 3. State-primary, not event-sourced

Current state is read straight from the Milestones and Tasks. The MapEvent stream is an append-only log that points at them by id; it isn't replayed to rebuild state. Every change writes both the state update and its MapEvent together, so they can't drift apart. Reads stay simple, and every task still has a full history.

### 4. Schema-constrained live calls

Signals go through a real Anthropic call in a Next.js route handler that returns changes in a fixed schema (tool-use), so the output is always valid and points at real task ids. The API key stays on the server.

### 5. Scope — the Action Plan tab, not a whole DSR

A full DSR is content, e-sign, CPQ, chat, stakeholder mapping, and more. Trying to cover that in the time would be broad and shallow. Instead I built one tab and made the whole loop work end to end: Signal in, Proposal out, per-operation approval, task updated, MapEvent written, history visible.

---

## An edge case worth noting

The seeded MAP has a task already marked **done**. I injected a Signal about a buyer uploading a document clearly related to that task, expecting the AI to change it. Instead it left the finished task alone and added a new task to capture the input — the right call, since editing finished work would be wrong. But it showed a gap in my model, not the AI: a task has nowhere to attach evidence (it's only owner/date/status), and the AI has no action for "attach this here," so its only legal move was to add a task. The fix would be an `Artifact` field plus an `ATTACH_ARTIFACT` action that can target a done task without reopening it. I didn't build it, but it's the clearest next step the build surfaced, and a good example of the workflow: run the engine, read what it does, and let it show where the model is thin.

---

## Reflection on AI usage

**My setup.** I used [opencode](https://opencode.ai) with GitHub Copilot as the model provider. The main agent is an orchestrator running a strong model, with a "caveman" mode hooked up to keep its output terse. The orchestrator makes the high-level calls — architecture, trade-offs, what to build — and delegates the actual work to subagents: a coder running gpt-5.3-codex (cost-efficient) for implementation, and a reviewer running a strong model to critique the coder's output. The split matters: a cheaper model writes the code, a stronger one designs and reviews it.

**How the project ran.**

- I started by asking the agent to research what a Digital Sales Room is and where the pain points are. It produced a document; I read it carefully to understand the domain before deciding anything.
- From that I picked the pain point that interested me — MAPs go stale — which is where the Living MAP idea came from.
- I told the agent roughly what I wanted, then ran a "grill-me-with-docs" skill so it interviewed me until the open decisions were actually made, instead of guessing.
- I also showed it screenshots of existing MAP software so it understood the shape of the thing.
- The output of that was a blueprint. The agent split the work into stages and paused after each one so I could review and test before moving on.
- After the stages were done, I moved on to small UI tweaks, and had the agent walk me through deployment.

**Where it helped.** Scaffolding and boilerplate, repetitive refactors across many files (changing the data model, adding a field everywhere), and the second opinion from the reviewer catching things the coder missed.

**Where it fell short.** It defaulted to broad solutions when I wanted the narrow one, so I kept pulling scope back. It made confident but wrong calls on small UI details that the type-checker didn't catch — I had to look at the running app. And it didn't doubt its own designs; the useful reviews happened because the reviewer was a separate step, not because the coder questioned itself.

**What was mine.** The feature idea, the trade-offs above, and reading the edge case as a missing field and action rather than an AI flaw. The short version: the tools were good at producing code and weaker at deciding what to build, so I kept that decision with me.
