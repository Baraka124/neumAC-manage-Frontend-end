# neumDesk V46.14 — Grounded Phase 4.1A + 4.1B Changes

## 4.1A — knowledge contract precision
- Per-intent source dependencies replace the over-broad degraded-read gate.
- `grounded.answer.v1` carries required/checked/unavailable sources, evidence count, temporal scope and retrieval timestamp.
- Confidence carries a structured reason instead of relying only on answer prose.
- Near-tie Staff matches clarify rather than silently selecting a person.
- Teach vocabulary cannot override a conflicting strong built-in route.
- Ranking/comparison outputs expose their current all-recorded temporal scope.

## 4.1B — Phase 4 presentation convergence
- Grounded is presented as a crisp Department Intelligence workspace; visible cloud/mist/glass treatment is removed.
- Primary header simplified to Expand/Compact, New, Tools and Close.
- Personal Activity, Activity, Trace and Teach live under a secondary Tools menu.
- Labelled modal dialog, initial focus, Tab/Shift+Tab containment, Escape close and focus return.
- Reusable contracts: `nd-source-health`, `nd-context-strip`, `nd-answer`, `nd-answer-scope`, `nd-evidence-strip`, `nd-evidence-records`, `nd-proposal`, `nd-intelligence-composer`.
- Source scope, confidence reason and unavailable-source warnings render from the 4.1A typed answer model.
- 40px primary control rhythm and 11px meaningful supporting-text floor.
- Desktop/tablet/mobile and reduced-motion hardening.

## Preservation
- `grounded-core.js`: `738ed64d64f02358079b94635591b63bf3f5a227301c5e46f473acc98697220b`
- `activity45.js`: `c943857ad57655cfea16a505957587eb5cd00ec119c3696d98961ce2c80aaedb`
- `SUPABASE_SCHEMA.sql`: `66541c3c9017c7d6480831999ca33325e0953bdeccc193d4873a8e8a7a195768`
- No schema, permission, sync, Staff lifecycle or operational write-integrity contract was changed.

## Validation
- 26 suites / 420 checks passed.
- 7/7 browser-DOM template safety checks passed.
- CSS parser: 0 top-level errors.
- Live authenticated browser acceptance and real partial-source failure simulation remain deployment gates.
