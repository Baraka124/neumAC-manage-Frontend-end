# neumDesk V46.14 — Grounded Phase 4.1C Collection Rendering Hardening

## Purpose
Fix list-style Grounded answers that were being presented as long comma-separated prose while preserving the Phase 4.1B intelligence workspace and the Phase 4 Staff UI exactly.

## Runtime changes
- Clinical Units overview now returns the existing structured `reslist` visual instead of inline comma-separated unit names.
- Alternate `clinical_units_overview` phrasing converges on the same structured answer.
- Explicit `list all ...` requests can opt into the existing list renderer in expanded state.
- Common directory-style collection answers now use the same existing structured renderer: Staff roster, PI-eligible staff, PhD staff, Departments, Hospitals and Coverage Areas.
- Collection summary prose is now short and factual; item detail lives in rows.

## UI preservation boundary
- No new Grounded CSS component was introduced.
- `style.css` is byte-for-byte identical to Phase 4.1B.
- The Staff Phase 4 workspace/template is unchanged.
- `index.html` changes only the `app.js`/`style.css` cache marker plus a non-rendering regression-history comment; Grounded markup is unchanged.
- Existing `askbar-reslist` / Show-more rendering is reused rather than inventing another list UI.

## Behavior preserved
- Grounded Phase 4.1A source/knowledge contract.
- Grounded Phase 4.1B intelligence workspace, provenance and accessibility.
- On-call / Leave / Rotation guarded write flows.
- Staff Phase 4 UI foundation.
- Supabase schema, permissions and sync contracts.
