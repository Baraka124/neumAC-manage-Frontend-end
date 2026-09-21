# neumDesk V46.9 — Grounded · Action Integrity

V46.9 is built directly on V46.8 Grounded Architecture Foundation. It does not redesign Grounded. It proves that the V46.8 harness can safely absorb an existing operational write flow.

## Why this release exists

A real on-call example exposed four legacy weaknesses:

1. `record_oncall` rejected phrases containing **week**, so an action such as “Put Marina on call Tuesday this week” could route to the read-only schedule lookup.
2. On-call writes could use the ordinary fuzzy staff resolver instead of the write-safe ambiguity path.
3. On-call had no pending task state, so “Put Baraka on call” followed by “Tuesday” did not reliably preserve the person.
4. The proposal checked leave/duplicate state but did not make configured on-call eligibility a hard precondition.

V46.9 treats those as architecture defects, not isolated text bugs.

## On-call semantic tools

The module is now the second Grounded tool adapter and the first legacy write-heavy workflow migrated end-to-end:

- `oncall.person_shifts` — READ
- `oncall.check_eligibility` — READ
- `oncall.check_slot` — READ
- `oncall.replacement_candidates` — READ
- `oncall.propose_assignment` — PROPOSE
- `oncall.commit_assignment` — WRITE

## Action integrity

The scheduling path is now:

```text
resolve exact person
→ clarify ambiguity
→ verify active/on-call-eligible staff
→ resolve date
→ check leave, duplicate duty and slot state
→ prepare proposal
→ human confirms
→ revalidate immediately before write
→ commit through WRITE tool
→ refresh on-call data
→ trace + audit
```

A stale proposal cannot simply write: the WRITE tool recomputes the safety proposal immediately before calling `/api/oncall`.

## Multi-turn task memory

`pendingOncall` is short-lived task context. It supports:

```text
Put Antelo on call
→ What date should I schedule Antelo for on-call?
Tuesday
→ proposal for Antelo on Tuesday
```

A clearly new command abandons the pending task. This state is never treated as authoritative schedule data.

## Entity safety

On-call uses ambiguity-aware staff resolution. A short token that could refer to more than one person is clarified rather than silently choosing the first fuzzy match.

## Observability

The same execution trace can now span proposal → human confirmation → WRITE tool → commit outcome. Confirmed writes no longer need a disconnected second trace when an existing proposal trace is available.

## DepartmentOS architecture

`DepartmentOS_Architecture.md` is now a required living release artifact. V46.9 updates it with:

- the current implementation ledger;
- actual READ / PROPOSE / ACT maturity;
- Grounded harness adoption status;
- known architectural debt;
- the next migration sequence.

Future complete release packages must update this file before packaging.

## Next

**Leave Action Integrity**, then **Resident Rotation Action Integrity**. Clinical Units UI and Personal Activity/Portfolio Intelligence may continue in parallel, but new write flows should not bypass the action-integrity contract.

## Files changed / added

- `grounded-core.js`
- `app.js`
- `index.html`
- `style.css`
- `GROUNDED-ARCHITECTURE.md`
- `DepartmentOS_Architecture.md` — living architecture ledger, added to release baseline
- `README-V46.9.md`
- `test-v469.cjs`
- forward-compatibility update to `test-v468.cjs`
- regenerated `MANIFEST-SHA256.txt`

## Backend

No backend `index.js` change is required for V46.9.

## Deployment

The cache marker is `46.9-grounded-action-integrity`. Deploy the complete baseline and hard-refresh the browser.
