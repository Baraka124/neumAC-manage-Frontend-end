# Grounded Architecture Contract — neumDesk

## Purpose

Grounded remains the same neumDesk intelligence surface. This architecture strengthens what sits underneath it so that context, tools, actions, permissions, observability and evaluation follow one repeatable contract across modules.

The central rule is:

> Grounded is an intelligence layer over trustworthy operational modules. It must not compensate for broken or ambiguous modules.

## V46.14 convergence + presentation rules
1. **Scope words override entity memory.** `Anyone`, `who`, `everyone` and equivalents widen the person scope. The relevant date/window may be inherited; the previous person may not.
2. **Pinned context is not answer scope.** A pinned person only resolves ambiguous references; explicit names and broad-scope questions override it.
3. **Structured visuals needed to understand an answer are visible by default.** Deep audit/method details remain optional.
4. **No unresolved interpolation.** Missing semantic slots must produce grouped/general results or clarification, never strings containing `undefined`.
5. **Portfolio Intelligence is one structured truth.** Grounded consumes the same selected-period snapshot used by Overview, Timeline, Portfolio and Document.
6. **Answer first.** Simple factual answers render as prose; they are not wrapped in large decorative cards.
7. **Cards are for structure.** Rosters, people, proposals, comparisons, timelines and other inspectable objects may use structured surfaces; plain facts should not.
8. **Answer scope is immutable per answer.** Pinned/current conversational memory can help resolve ambiguity, but broad or explicit queries set their own scope and cannot silently inherit a previous person.
9. **Context transitions are explicit events.** Loading Portfolio Intelligence into Grounded is shown as a compact context event, not presented as a normal assistant answer.
10. **Evidence is visible; audit depth is optional.** The source/evidence strip remains readable without forcing “Show details”; deeper method/provenance expansion stays secondary.
11. **Resolved values, never user-text placeholders.** Date-dependent follow-ups render the resolved date/window, never the original question as a pseudo-date label.
12. **Navigation never obscures content.** “Latest answer” is compact, conditional and anchored away from the answer body.
13. **Viewport / focus continuity.** A user command that creates a new Grounded turn reveals the loading state and then the start of that exact answer. Rich answers are never appended off-screen while the reader remains stranded on an older turn.
14. **Reveal start, not absolute bottom.** For long profiles, boards and proposals, Grounded aligns the new question/answer start in the conversation scroller instead of jumping to the footer or composer.
15. **Temporal state is explicit.** Leave status today, leave on a requested date/window, scheduled/upcoming leave, and leave history are separate query modes. A future leave record must never be phrased as if the person is absent today.
16. **Current person reference can resolve short status fragments.** After opening a person, `on leave` and `scheduled leave` apply to that person unless the user explicitly widens scope (`who`, `anyone`, `everyone`). Explicitly named people always override current reference.
17. **Explicit named operational entities outrank generic intent vocabulary.** `Is Pedro Marcos on leave today?` resolves the staff entity before a department-level `absent today` intent can claim the same words. Ambiguous names stop for clarification rather than widening scope.
18. **Temporal language and entity scope are orthogonal.** `today`, `Friday`, `scheduled`, or `next week` determine the time window; a named person determines person scope; `who` / `anyone` / `everyone` explicitly widen person scope. One dimension must never silently erase the other.

## Architecture

```text
USER
  ↓
neumDesk interface
  ↓ current object / lens / time window
CONTEXT BUILDER
  ├─ user role + permissions
  ├─ source health
  ├─ current object
  ├─ task time scope
  └─ compact module state
  ↓
GROUNDED ORCHESTRATOR
  ├─ retrieval / knowledge
  ├─ deterministic domain tools
  └─ bounded planning
  ↓
VALIDATION + GUARDRAILS
  ├─ READ      → may execute automatically
  ├─ PROPOSE   → may prepare a change
  └─ WRITE     → human confirmation required
  ↓
ANSWER / PROPOSAL
  ↓
HUMAN APPROVAL (for writes)
  ↓
EXECUTE → VERIFY → AUDIT

Every run emits operational traces:
context → routed intent → tools → sources → latency → outcome.
No hidden chain-of-thought is stored or displayed.
```

## 1. Harness engineering

`grounded-core.js` is the reusable harness. It owns the contracts for:

- context envelopes;
- domain tool registration/invocation;
- read/propose/write policy;
- bounded plan execution;
- session task memory;
- execution traces;
- lightweight trace evaluation.

The current deterministic Grounded resolver remains intact and is progressively migrated onto this harness.

## 2. Loop engineering

Grounded does not run an unconstrained autonomous loop. `runBoundedPlan()` provides a maximum-step execution primitive with explicit stop conditions. Future planners may use it, but every loop must have a finite step budget and observable step results.

## 3. Context engineering

Grounded receives a compact `grounded.context.v1` envelope rather than an application-state dump.

Core fields:

- current view;
- current lens;
- visible subject/object;
- task time scope;
- user role;
- module permissions;
- source-health state;
- compact module-specific context.

Clinical Units establishes the first adapter. As of V46.12 its domain semantics are explicit: unit-linked attendings are context, while formal resident supervision is attached to a rotation / department responsibility:

- resident rotation month / exact date interval;
- selected clinical unit;
- unit capacity today;
- attending-physician link count;
- next opening.

Authoritative operational facts continue to live in neumDesk/Supabase, not in AI memory.

## 4. Tool design

Tools are small semantic contracts, not raw unrestricted API access.

Clinical Units tools (V46.12 semantics):

- `clinical_units.capacity_window`
- `clinical_units.available_units`
- `clinical_units.team_readiness`
- `resident_rotations.conflicts`
- `resident_rotations.propose_assignment`

Each tool declares:

- name;
- description;
- access class;
- permission module;
- input schema;
- deterministic implementation.


### Clinical Units semantic contract (V46.12)

Hard placement constraints:
- active Clinical Unit;
- exact resident-capacity window;
- resident overlap;
- valid formal rotation supervisor.

Context, not hard placement constraints:
- attendings linked through `unit_staff`;
- recorded attending leave;
- specialty / location metadata.

Grounded must not infer that every Clinical Unit requires its own resident supervisor.

## 5. Memory architecture

Grounded separates memory from source-of-truth data.

### Session task memory

Allowed:

- current context envelope;
- current object;
- current planning window;
- short-lived task state.

Stored in session storage and cleared with the browser session.

### Persistent operational facts

Not stored as Grounded memory. Staff, rotations, leave, studies, units and future patient-linked facts must be retrieved from authoritative systems.

### Future preference memory

Harmless UI/workflow preferences may eventually persist separately, with explicit governance. It is not introduced in V46.8.

## 6. Orchestration

V46.8 keeps one Grounded orchestrator. Multi-agent architecture is intentionally deferred.

Use multiple agents only if a demonstrated reliability or specialization requirement cannot be met with:

- one orchestrator;
- clear domain tools;
- bounded plans;
- deterministic validation.

## 7. Guardrails and permissions

Tool access classes:

- **READ** — requires module read permission and may execute automatically.
- **PROPOSE** — may calculate and prepare an action but cannot mutate data.
- **WRITE** — requires module write permission and explicit human confirmation.

A write tool invoked without `confirmed: true` is blocked by the harness.

The existing Grounded proposal cards already implement the human-confirmation interaction. The architecture formalizes that behavior so future modules use the same policy.

## 8. Evals

Grounded must be tested on both outcomes and trajectories.

Core eval categories:

- correct intent/context;
- correct source/tool selection;
- empty-state vs failed-source distinction;
- permission enforcement;
- write confirmation enforcement;
- deterministic capacity/conflict results;
- graceful tool failure;
- bounded execution;
- no regression after module updates.

`test-v468.cjs` is the first architecture-level regression set. Future releases should add real module scenario fixtures.

## 9. Human in the loop

Consequential changes follow:

```text
understand → retrieve → calculate → validate → proposal → human confirmation → write → verify → audit
```

Grounded may explain and propose broadly within permission. It should not silently commit operational changes.

## 10. Observability and tracing

V46.8 adds session-scoped Grounded execution traces.

Trace metadata includes:

- user request (bounded/sanitized);
- routed intent;
- current context envelope;
- domain tool calls;
- permission blocks;
- source labels;
- confidence;
- latency;
- action class;
- final status.

It explicitly does **not** store hidden reasoning or chain-of-thought.

Users with audit-log read access can open the Grounded **Trace** view to inspect this telemetry.

## Module integration contract

A module is ready for Grounded integration when:

1. its UI/workflow semantics are stable;
2. empty, loading and error states are truthful;
3. its domain calculations are deterministic;
4. permissions are defined;
5. write operations have explicit confirmation behavior.

Then define:

```text
Module
├─ context adapter
├─ read tools
├─ decision/proposal tools
├─ write tools (if needed)
├─ human-approval rule
├─ trace/eval scenarios
└─ source-of-truth mapping
```

Clinical Units is the first reference module. **On-call (V46.9), Leave (V46.10), and Resident Rotations (V46.11)** now follow the same action-integrity contract. Staff and Research follow incrementally as their workflows mature.


## V46.9 · On-call action integrity

V46.9 proves that the V46.8 architecture can absorb an existing write workflow without replacing Grounded. On-call now uses these semantic tools:

- `oncall.person_shifts` (READ)
- `oncall.check_eligibility` (READ)
- `oncall.check_slot` (READ)
- `oncall.replacement_candidates` (READ)
- `oncall.propose_assignment` (PROPOSE)
- `oncall.commit_assignment` (WRITE)

The write trajectory is:

```text
write-safe person resolution
→ ambiguity clarification
→ on-call eligibility
→ date resolution
→ leave / duplicate / slot validation
→ proposal
→ human confirmation
→ commit-time revalidation
→ WRITE tool
→ source refresh
→ trace + audit
```

Short-lived `pendingOncall` task state supports natural clarification such as “Put Antelo on call” → “Tuesday”. It is session task context only; it never becomes authoritative schedule state.

This release also fixes a routing defect where the `record_oncall` intent rejected action phrases containing the word **week**, allowing “Put Marina on call Tuesday this week” to fall through to the read-only schedule lookup.

### Action-integrity rule for future modules

A module is not considered fully migrated merely because it has a confirmation button. A write-capable workflow must:

1. resolve identities safely;
2. reject or clarify ambiguity;
3. validate domain eligibility;
4. prepare a non-destructive proposal;
5. require explicit confirmation;
6. revalidate immediately before commit;
7. write through a permission-gated WRITE tool;
8. refresh authoritative state;
9. close one coherent trace/audit trajectory.

**Next focus:** remaining lifecycle writes + module/UI intelligence surfaces.


## V46.10 · Leave action integrity

V46.10 migrates the leave-recording path onto the same guarded architecture used by On-call.

Semantic tools:

- `leave.person_records` (READ)
- `leave.check_window` (READ)
- `leave.propose_absence` (PROPOSE)
- `leave.commit_absence` (WRITE)

The trajectory is:

```text
write-safe subject / covering identity
→ ambiguity clarification
→ leave date + type resolution
→ duplicate/overlap validation
→ operational collision preview
→ proposal
→ human confirmation
→ commit-time revalidation
→ WRITE tool
→ source refresh
→ trace + audit
```

On-call and rotation collisions are warnings, not automatic blocks: leave may legitimately create a coverage problem that the department must then resolve. Duplicate/overlapping leave remains a hard block to protect record integrity.

`pendingLeave` is short-lived task state only. It supports natural clarification while preserving the selected subject, dates or covering clinician without storing hospital facts in Grounded memory.

**Next migration:** Resident Rotation Action Integrity.


## V46.11 · Resident Rotation action integrity

The primary resident-assignment flow now uses semantic tools and one coherent trace:

- `resident_rotations.check_supervisor` (READ)
- `resident_rotations.check_assignment` (READ)
- `resident_rotations.propose_assignment` (PROPOSE)
- `resident_rotations.commit_assignment` (WRITE)

Trajectory:

```text
resident identity → unit → exact dates → formal supervisor
→ overlap/capacity validation
→ leave-context warnings
→ proposal
→ human confirmation
→ commit-time revalidation
→ WRITE tool
→ refresh → trace/audit
```

The formal supervisor is a rotation/department responsibility and is not constrained to the unit's linked attending physicians.

`pendingRotation` is task-only session state and can safely resume missing resident, unit, dates or supervisor.

Multi-unit creation remains sequential at the API layer; atomic batch rotation writes require backend transactional support and remain explicit architectural debt.


## V46.13 — Reporting / Portfolio Intelligence client
Personal Activity is deliberately **not converted into an autonomous Grounded agent**. Its snapshot builder is deterministic and permission-scoped. The interactive Portfolio Intelligence UI and formal document are two clients of the same structured model.

Grounded may later consume this reporting capability as a READ tool (for example, “summarize Marina’s recorded activity this month”), but it must receive the same source-health/provenance contract and must not reinterpret unavailable sources as no activity. The canonical Personal Activity model therefore becomes a candidate reusable structured output, not a parallel truth store.

## V46.14 hardening — Reporting READ capability

Portfolio Intelligence now exposes `reporting.personal_activity_snapshot` as a real READ tool in the shared Grounded tool registry. The workspace and Grounded tool call the same deterministic `Activity45.snapshot(...)` capability, so there is one reporting truth path rather than a UI-only builder plus a separate chat interpretation.

The tool remains permission-scoped per underlying source. Its result carries source states and never converts restricted/unavailable sources to numeric zero. Grounded handoff includes resident assignments, formal supervision, issues, source checked times and explicit `{total, included, truncated}` metadata for bounded arrays.

This still does **not** mean every free-form Personal Activity question is automatically routed through this tool. Universal intent routing remains staged and eval-guarded.

---

## V46.14 — Portfolio Intelligence contextual integration
Personal Activity remains a deterministic reporting capability, not an autonomous agent. V46.14 adds a structured context handoff from the Portfolio Intelligence workspace into Grounded.

The handoff contains:
- selected staff identity;
- exact reporting period;
- structured summary metrics and deterministic narrative;
- dated events;
- research / innovation / programme relationships;
- formal resident-supervision relationships;
- source health and relevant-record counts.

Grounded may use this context to continue a conversation, but the snapshot remains authoritative for the reporting period. Missing sources remain missing; Grounded must not reinterpret them as zero activity. The handoff is session context only and is discarded with the conversation context.

V46.14 deliberately now has a deterministic Personal Activity READ capability but stops short of claiming universal free-form routing to it. Period-aware questions should migrate incrementally behind a semantic reporting tool with equivalence evals against the deterministic snapshot.

**Product integration rule:** Personal Activity can be entered from Staff, Grounded or direct workspace actions, but every path must converge on the same snapshot builder and evidence contract.



## V46.14 temporal leave semantics

The authenticated-browser sequence exposed a semantic collapse between present absence and future scheduled leave. Grounded now treats leave time as a typed scope:

```text
CURRENT / TODAY        → is this person absent now? / who is absent today?
SPECIFIC DATE/WINDOW   → leave overlapping Friday / next week
SCHEDULED / UPCOMING   → future leave periods, not current absence
HISTORY / AGGREGATE    → totals, fairness, monthly/history analysis
```

Person scope and time scope are resolved separately. A current reference may resolve a short fragment such as `scheduled leave`, but broad-person language widens person scope while keeping the requested time window.


## V46.14 Staff Phase 2 — Person context entry

The canonical Staff Person profile can now open Grounded with an explicit `staff` subject/context. This is a contextual entry point only; it does not create a second Person data model. Grounded must continue to resolve live staff/operational facts from the authoritative neumDesk sources. Personal Activity remains the reporting renderer; the Person profile remains the direct operational renderer.

Security note: `PERMISSIONS_ARCHITECTURE.md` is carried as the future authentication/authorization contract. Staff Phase 2 does not change Grounded permissions or widen access.
