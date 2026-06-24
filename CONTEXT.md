# Living Mutual Action Plan (Living MAP)

An AI-assisted Mutual Action Plan inside a Digital Sales Room that evolves over the deal cycle: incoming signals (new meeting transcripts, buyer engagement, elapsed time) cause the AI to *propose* changes to the plan, which the seller approves. Every change is recorded, so any milestone can show exactly which signal produced which change.

## Language

**Digital Sales Room (DSR)**:
A single shared, branded web space (one link, no login) where a seller and the buyer's committee collaborate across the entire deal cycle.
_Avoid_: portal, microsite, dealroom (use DSR).

**Mutual Action Plan (MAP)**:
The live, evolving set of milestones a seller and buyer commit to in order to move the deal to close. Authoritative current state is the milestone list itself; its history is an attached log, not the source of truth.
_Avoid_: roadmap, timeline, checklist, close plan.

**Milestone**:
A named phase of the deal that groups related Tasks and shows aggregate progress (e.g. 3/6). Coarse and relatively stable across the deal; signals rarely change a Milestone directly.
_Avoid_: phase, step, category (use Milestone).

**Task**:
The atomic to-do inside a Milestone, with an owner, a due date, and a status. This is the live layer the AI mutates in response to signals, and it carries the expandable history. Statuses include risk states (at-risk, blocked) that go beyond the binary done/not-done of existing products.
_Avoid_: item, action item, step.

**Participant**:
A person in the deal roster (seller-side or buyer-side) established when the MAP is first created from the discovery meeting transcript.
_Avoid_: user account, seat, contact record.

**MapEvent**:
An append-only record explaining one change to a Task (or a structural change to a Milestone): what changed, which signal or user action triggered it, that the AI proposed it, and who approved it. Events reference Tasks/Milestones by id; folding events is NOT how current state is derived.
_Avoid_: log entry, audit row (use MapEvent).

**Signal**:
Any new fact about the deal that may justify a change to the MAP. `source` is an open, AI-inferred classification of signal kind (common examples: Transcript, Engagement, Elapsed time), not a fixed exhaustive enum.
_Avoid_: trigger (reserve "trigger" for the causal link recorded inside a MapEvent), input.

**Proposal**:
An AI-suggested change to the MAP, awaiting seller approval. The AI never mutates the MAP directly; it proposes and the seller approves.
_Avoid_: suggestion, recommendation (use Proposal for the approvable unit).

## Relationships

- A **MAP** contains one or more **Milestones**.
- A **Milestone** contains one or more **Tasks** and shows their aggregate progress.
- A **Task** has many **MapEvents** (its expandable history).
- A **Task** `owner` references a **Participant** by name; the **Participant** roster is seeded at MAP creation from the meeting transcript that also yields the initial Tasks.
- A **Signal** causes the AI to emit a **Proposal**; an approved **Proposal** writes a **MapEvent** and mutates a **Task** (or, more rarely, a **Milestone**'s structure).
- Current MAP state is read directly from its **Milestones** and **Tasks**; **MapEvents** explain how each Task reached its state but are not replayed to compute it.

## Architectural note

State-primary, not event-sourced. The milestone list is authoritative and read directly. The MapEvent stream is an append-only audit sidecar that references milestones by id. Every mutation writes both the milestone change and its MapEvent in the same operation; if either is skipped they could drift, so they are always written together.

## Flagged ambiguities

- "transcript" was treated as a single creation-time input — resolved: transcripts are a *stream*; each new meeting is a fresh **Signal** checked against the existing MAP.
- "change" was used for both notifications and plan edits — resolved: a MAP change must mutate a **Milestone** (add/remove, move date, change status, reassign owner). A pure notification is NOT a MAP change.
- `source` was modeled as a fixed three-value enum — resolved: for custom-injected signals, AI infers `source` from signal text using open vocabulary; curated examples keep authored source values.
