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

Clinical Units is the first reference module. Rotations, Leave, On-call, Staff and Research can follow as their operational surfaces mature.

## V46.9 Clinical Units domain contract

Clinical Units is the first adapter where the architecture explicitly distinguishes a **hard operational constraint** from **contextual clinical structure**.

- Resident capacity and resident-rotation overlap can block a placement.
- Attending physicians linked through `unit_staff` describe who normally works in the unit; they do not define resident capacity.
- Formal resident supervision belongs to the rotation / department context and is not inferred from Clinical Unit membership.
- Missing attending links are surfaced as data completeness, not as proof that the unit cannot accept a resident.

This pattern should be preserved when future modules join Grounded: module adapters must identify which facts are constraints, which are context, and which are merely incomplete data rather than allowing the model to infer those semantics itself.
