# Phase 30A–30C — Mi Espacio institutional visual acceptance

## Scope and baseline
Based on Phase 29's unmerged branch. This is a **UI-only**, role-aware refinement. No backend calls, clinical calculations, authorization, adapter shape, persisted data, or personal records are changed. Design follows the real component and existing role-aware display logic rather than adding synthetic production content.

## 30A · Reading hierarchy
- Restrained title scale, typographic measure, heading spacing and accessible reading line height.
- Distinguish research titles, study metadata, rotation status and clinical commitments without overriding institutional names.
- Compact verified counts as text rather than decorative badges.

## 30B · Composition
- Remove unnecessary nested card borders and backgrounds around the agenda/research overview, publications and secondary communications.
- Preserve role- and workload-derived column proportions and the existing content ordering. At <=850px the overview is a single column.
- Responsive quick tools: five-column editorial strip on desktop, three-column tablet and two-column mobile with the disclosure first; all buttons retain their original handlers, with 44px minimum height, visible focus and no motion when reduced motion is requested.
- Present optional dashboard metrics as a quiet secondary strip instead of multiple cards.

## 30C · Acceptance gates
- New isolated Playwright role-based fixtures cover head, clinician, resident and biomedical engineer at widths 390, 768 and 1366.
- Load all local production stylesheets in index.html order to detect cascade collisions.
- Verify identity and overview mounting, reading font/line height, quick bar geometry, no horizontal document overflow, viewport-appropriate panel borders, profile disclosure semantics and no JS errors.
- Keep existing Phase 27A–29 tests and authenticated access-denial checks as required gates.

## Known limitations and release conditions
- Fixture data is **test-only** and intentionally synthetic; no fabricated records are rendered to users.
- CI completion and test artifacts need checking on the PR; tests passing cannot substitute for authenticated real-role visual review.
- Confirm real supervisor/rotation presentation and clinically authoritative duty information without inferred values.
- Browser PDF pagination remains a separate authenticated/manual acceptance task.
- Phase 29 is not merged. The Phase 30 PR is intentionally stacked onto the Phase 29 branch; do not merge to main before prerequisite review and successful CI.
- Production cache invalidation for mi-espacio.css requires changing the stylesheet version query in index.html before release (the connector cannot currently retrieve index.html as a full UTF-8 file through the contents API). Avoid release until this is addressed.
