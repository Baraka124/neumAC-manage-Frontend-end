# neumDesk V46.8 — Grounded · Architecture Foundation

V46.8 pauses new Clinical Units breadth for one release and formalizes the architecture underneath Grounded. Grounded remains the same neumDesk product surface; this release strengthens its engineering contracts.

## Why this release exists

The preceding Clinical Units work demonstrated that Grounded is already becoming context-aware and decision-supportive. The next risk was architectural drift: each future module could have introduced its own context rules, data access, permissions, action patterns and debugging behavior.

V46.8 establishes one reusable Grounded contract before more modules are integrated.

## New `grounded-core.js`

The new runtime module provides:

- compact context envelopes (`grounded.context.v1`);
- permission-aware domain-tool registry;
- `read / propose / write` access classes;
- hard human-confirmation guard for writes;
- bounded-plan execution primitive;
- session-only task memory;
- operational traces;
- lightweight trace evaluation;
- sanitization that excludes credentials/tokens from telemetry.

It loads before `app.js`.

## Context engineering

Grounded now builds a compact context envelope containing only task-relevant state:

- current neumDesk view/lens;
- visible object;
- relevant month/week window;
- role and module permissions;
- source-health state;
- compact module context.

Clinical Units contributes unit capacity, team count and next-opening context without dumping entire tables into Grounded.

## Clinical Units as first tool adapter

V46.8 registers the first semantic tool set:

- `clinical_units.capacity_window`
- `clinical_units.available_units`
- `clinical_units.team_readiness`
- `resident_rotations.conflicts`
- `resident_rotations.propose_assignment`

The resident-placement decision-support path now uses the tool harness for conflict checks and available-unit evaluation.

## Human-in-the-loop and guardrails

The existing Grounded proposal cards remain the write UX. The new core formalizes the policy:

- reads may execute automatically;
- proposals are non-destructive;
- writes require write permission **and** `confirmed: true`.

Confirmed Grounded changes are represented in the execution-trace stream as human-approved writes.

## Observability

Users with `audit_logs:read` now see a **Trace** control in Grounded.

The Trace view exposes:

- query/intent;
- context;
- tool-call count;
- sources;
- confidence;
- action class;
- latency;
- tool/permission events.

It explicitly does not expose or persist chain-of-thought.

Trace data is session-scoped, bounded and sanitized.

## Memory policy

V46.8 only introduces **session task memory**. Authoritative hospital facts remain in source systems and are retrieved when needed. Persistent user-preference memory and any broader memory layer are intentionally deferred.

## Orchestration

A bounded-plan primitive is included, but V46.8 does **not** introduce autonomous multi-agent behavior. One Grounded orchestrator with high-quality domain tools remains the preferred architecture.

## Architecture document

See `GROUNDED-ARCHITECTURE.md` for the complete contract and the mapping of harness, loops, context, tools, memory, orchestration, guardrails, evals, human approval and observability.

## Files changed / added

- `grounded-core.js` — new
- `app.js`
- `index.html`
- `style.css`
- `GROUNDED-ARCHITECTURE.md` — new
- `README-V46.8.md` — new
- `test-v468.cjs` — new
- historical build-marker tests updated for forward compatibility
- `MANIFEST-SHA256.txt`

## Backend

No backend `index.js` change is required for V46.8.

## Deployment

The V46.8 cache marker is `46.8-grounded-architecture`. Deploy the complete frontend baseline and hard-refresh the browser.
