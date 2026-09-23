# V46.14 Staff Phase 4 UI Foundation — Validation

## Automated result

**24 regression suites passed · 387 checks/assertions passed.**

Coverage spans the preserved V43.1 → V46.14 history plus the new Staff Phase 4 UI-foundation suite:

- V43.1 readiness/action safety
- V44 authenticated entry
- V45 Personal Activity baseline
- V46 editorial entry
- V46.1–V46.7 source and Clinical Units hardening
- V46.8–V46.11 Grounded action integrity
- V46.12 Clinical Units consolidation
- V46.13 Portfolio Intelligence
- V46.14 A→H / convergence / interaction / leave semantics
- Staff Phase 1 directory
- Staff Phase 2 canonical Person
- Staff Phase 3 adaptive resident profile
- Staff Phase 3.1 profile integrity
- browser-DOM template safety
- Staff Phase 4 reusable UI foundation

## Runtime preservation

The Phase 4 candidate is presentation-only. These hashes match the template-safe complete baseline exactly:

- `app.js` — `35f9bddab97ffc58bcaa0707184664be75e2ca82d34994d32b171a4c8631e10b`
- `grounded-core.js` — `738ed64d64f02358079b94635591b63bf3f5a227301c5e46f473acc98697220b`
- `activity45.js` — `c943857ad57655cfea16a505957587eb5cd00ec119c3696d98961ce2c80aaedb`

## Browser-template safety

The dedicated in-DOM Vue guard still passes: no raw `<` comparisons re-entered Vue-bound HTML attributes/interpolations, and the certificate fallback branch remains present after canonical class augmentation.

## Still required before promotion

Automated regression does **not** replace live authenticated validation. Phase 4 remains a candidate until one Attending, one Internal Resident, one Rotating Resident and one External Resident are compared in the deployed application, together with Staff Table / People / Compact views and desktop/tablet/mobile layout.
