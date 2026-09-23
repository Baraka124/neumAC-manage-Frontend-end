# neumDesk V46.14 — Staff Phase 4

## Implemented

- Reusable `nd-*` UI foundation for Staff and canonical Person surfaces.
- Corrected malformed Phase 4 CSS comment boundary from the candidate.
- Added consistent control, typography, status, focus, table, card, record-list and responsive contracts.
- Added `aria-pressed` to Table / People / Compact.
- Added Enter + Space keyboard activation to Staff rows/cards.
- Added live filtered-result announcements.
- Added roving tab focus and labelled Person tab panels.
- Added long-content and mobile-density hardening.

## Preserved

No schema, Staff lifecycle, registration/edit, permissions, sync, Grounded action logic, Personal Activity logic, rotation, leave or on-call runtime behavior changed. `app.js`, `grounded-core.js` and `activity45.js` remain byte-for-byte unchanged.

## Validation

- 24 regression suites / 393 checks pass.
- 24 dedicated Phase 4 checks pass.
- V46.14 DOM-template safety: 7 checks pass.
- Final `style.css`: zero top-level CSS parser errors.

Authenticated production acceptance still requires representative Attending / Internal Resident / Rotating Resident / External Resident review and Table / People / Compact review at desktop, tablet and mobile widths.
