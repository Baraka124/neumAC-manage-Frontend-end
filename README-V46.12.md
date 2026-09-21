# neumDesk V46.12 — Clinical Units Consolidation

## Baseline
V46.11 · Resident Rotation Action Integrity.

## Purpose
Consolidate the Clinical Units domain model and visual system on top of the guarded Grounded architecture. This release does not change backend APIs.

## Domain semantics now enforced
- Clinical Unit ↔ attending physician is a structural membership relationship (`unit_staff`).
- Resident ↔ Clinical Unit is a time-bounded rotation.
- Formal resident supervision belongs to the rotation / department, not to the Clinical Unit.
- Resident capacity is configured independently from attending headcount.
- Recorded attending leave is contextual information, not a resident-capacity rule.
- Missing attending links are data-completeness items, not operational conflicts.

## UI changes
- Clinical Units hero now follows the Overview dashboard shell: contextual title, compact actions, alert rail, no duplicate page title.
- Breadcrumb is suppressed for Clinical Units, matching other full operational modules.
- `Team & availability` becomes `Attending physicians`.
- Weekly availability remains available as secondary recorded-leave context.
- Directory cards and Unit Detail use attending-physician language.
- Unit editor no longer asks for a unit-level supervising attending.
- Attending-link modal no longer designates a unit supervisor.
- Rotation supervisor selector prioritizes the selected unit's department, while remaining non-constraining.
- UI stays crisp: solid surfaces, no blur/haze, restrained borders and dashboard-aligned navy/teal shell.

## Grounded alignment
- `clinical_units.team_readiness` now exposes attending context only.
- `clinical_units.available_units` ranks primarily from exact resident capacity; attending links are contextual, not hard constraints.
- Queries about unit-level supervisor gaps explain the correct department/rotation supervision model.

## Files changed
- `index.html`
- `app.js`
- `style.css`
- `DepartmentOS_Architecture.md`
- `GROUNDED-ARCHITECTURE.md`
- release tests / manifest

No backend source file is included or modified.
