# neumDesk V46.10 — Leave Action Integrity

V46.10 is built directly on V46.9 Grounded Action Integrity. It migrates the **record leave** write path onto the V46.8+ Grounded harness without redesigning Grounded or changing backend APIs.

## Why this release exists

Leave already had proposal cards and pending date/name clarification, but four legacy weaknesses remained:

1. staff identity extraction could still use first-fuzzy-match behavior;
2. covering staff identity could also be guessed;
3. proposal state was not produced through semantic tools/traces;
4. confirmation wrote directly to the API without re-validating the authoritative leave state.

V46.10 treats these as action-integrity defects.

## Leave semantic tools

- `leave.person_records` — READ
- `leave.check_window` — READ
- `leave.propose_absence` — PROPOSE
- `leave.commit_absence` — WRITE

## Action-integrity trajectory

```text
resolve exact staff identity
→ clarify ambiguity (subject / covering clinician)
→ resolve leave window + type
→ validate duplicate/overlapping leave
→ surface on-call / rotation / cover collisions
→ prepare non-destructive proposal
→ human confirmation
→ revalidate immediately before write
→ commit through WRITE tool
→ refresh leave source
→ trace + audit
```

Hard blocks are limited to identity/window integrity and overlapping leave. On-call or rotation responsibility collisions are visible warnings rather than automatic blocks, because legitimate leave can be the event that requires those duties to be reassigned.

## Multi-turn task memory

`pendingLeave` is now an explicit session-only action state with ambiguity-safe continuation. It may remember a selected person while asking for dates/reason, but it never becomes authoritative leave data.

## Architecture ledger

Both `DepartmentOS_Architecture.md` and `GROUNDED-ARCHITECTURE.md` are updated in this release. The living ledger now records Clinical Units + On-call + Leave as migrated Grounded adapters, with Resident Rotations next.

## Files changed / added

- `app.js`
- `grounded-core.js`
- `index.html`
- `style.css`
- `DepartmentOS_Architecture.md`
- `GROUNDED-ARCHITECTURE.md`
- `README-V46.10.md`
- `test-v4610.cjs`
- forward-compatibility update to `test-v469.cjs`
- regenerated `MANIFEST-SHA256.txt`

## Backend

No backend `index.js` change is required.

## Deployment

Cache marker: `46.10-leave-action-integrity`.

## Next

**V46.11 — Resident Rotation Action Integrity.**
