# neumDesk V46.11 — Resident Rotation Action Integrity

Built directly on V46.10. This release migrates the primary resident-rotation assignment flow onto the Grounded action-integrity architecture.

## What changes
- write-safe resident and supervisor resolution with ambiguity clarification;
- deterministic clinical-unit resolution;
- real `pendingRotation` task memory for resident → unit → dates → supervisor clarification;
- exact resident-overlap + unit-capacity validation;
- formal supervisor validation independent of unit staff membership;
- leave/supervisor-leave collisions surfaced as warnings, not invented unit constraints;
- proposal → human confirmation → commit-time revalidation → WRITE tool → refresh → trace/audit.

## Semantic tools
- `resident_rotations.conflicts` — READ
- `resident_rotations.check_supervisor` — READ
- `resident_rotations.check_assignment` — READ
- `resident_rotations.propose_assignment` — PROPOSE
- `resident_rotations.commit_assignment` — WRITE

## Domain rule
A formal resident supervisor is attached to the rotation/department responsibility. They do **not** have to be one of the attending physicians linked to the clinical unit.

## Remaining debt
Multi-unit rotation creation still uses sequential writes because the backend has no atomic batch transaction endpoint. It should be treated as a separate future hardening item.

## Architecture ledger
`DepartmentOS_Architecture.md` and `GROUNDED-ARCHITECTURE.md` are updated in this release.

## Backend
No backend `index.js` change is required.

## Deployment
Cache marker: `46.11-rotation-action-integrity`.
