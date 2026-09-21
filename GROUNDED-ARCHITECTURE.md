# Grounded Architecture Contract — neumDesk

## Purpose

Grounded remains the same neumDesk intelligence surface. This architecture strengthens what sits underneath it so that context, tools, actions, permissions, observability and evaluation follow one repeatable contract across modules.

The central rule is:

> Grounded is an intelligence layer over trustworthy operational modules. It must not compensate for broken or ambiguous modules.

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

Clinical Units establishes the first adapter:

- resident rotation month / exact date interval;
- selected clinical unit;
- unit capacity today;
- recorded team count;
- next opening.

Authoritative operational facts continue to live in neumDesk/Supabase, not in AI memory.

## 4. Tool design

Tools are small semantic contracts, not raw unrestricted API access.

V46.8 Clinical Units tools:

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

Clinical Units is the first reference module. **On-call is the second integrated module (V46.9), and Leave is the third (V46.10).** Both write-heavy workflows now follow the same action-integrity contract. Resident Rotations is next; Staff and Research follow incrementally as their workflows mature.


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

**Next migration:** Resident Rotations.


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
