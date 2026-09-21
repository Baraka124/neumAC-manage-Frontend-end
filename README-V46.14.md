# neumDesk V46.14 — Personal Activity / Portfolio Intelligence Workspace

V46.14 completes the A→H Personal Activity programme on top of the V46.13 deterministic reporting baseline.

## Scope completed

A. **Product architecture** — Personal Activity is now a full-screen Portfolio Intelligence workspace rather than an export-first modal. Person, period and included activity are first-class context.

B. **Overview intelligence** — deterministic narrative, dated-activity metrics, professional-relationship metrics, evidence coverage and information-quality signals.

C. **Timeline** — month-grouped chronology of person-specific on-call / rotation records plus explicitly labelled shared research and innovation milestones.

D. **Portfolio** — resident assignments, formal resident supervision, research studies, innovation projects and programme coordination are kept semantically distinct.

E. **Evidence** — source state, checked time, relevant-record counts, provenance, source navigation and information caveats are first-class.

F. **Document** — offline HTML and Print → Save as PDF remain available, generated from exactly the same deterministic snapshot as the interactive workspace.

G. **Contextual integration** — Staff and Grounded entry points converge on the same snapshot builder. Opening from a specific staff profile auto-builds the current-month view. Portfolio Intelligence can hand staff + period + structured snapshot context back to Grounded.

H. **Visual hardening** — full-screen neumDesk shell, compact period presets and scope chips, crisp white content planes, responsive behavior, no backdrop blur/haze, truthful empty/loading/error states.

## Reporting invariants

- Dated activity is not the same as a persistent professional relationship.
- Shared project/study milestones do not imply personal ownership.
- Restricted/unavailable sources are not zero activity.
- Formal resident supervision is represented from rotation records, not inferred from Clinical Unit attending membership.
- Interactive and formal outputs share one permission-scoped deterministic model.
- Grounded context is session-only and never becomes a parallel source of truth.

## Runtime files changed

- `index.html`
- `app.js`
- `activity45.js`
- `activity45-ui.css`
- `DepartmentOS_Architecture.md`
- `GROUNDED-ARCHITECTURE.md`
- forward-compatible historical regression allow-lists
- `test-v4614.cjs`

No backend `index.js` change is included.
