# neumDesk V46.14 — Personal Activity / Portfolio Intelligence Workspace (Hardened)

V46.14 remains the active version. This revision completes the A→H Personal Activity programme **and** the subsequent implementation audit/hardening pass. The release stays on V46.14 deliberately: the feature is not promoted to another version until live authenticated browser and print validation confirms the workspace behaves as designed.

## A → H implementation

A. **Product architecture** — Personal Activity is presented as a full-screen Portfolio Intelligence workspace rather than an export-first dialog. Person, period and included activity are first-class context. The current container is still a full-viewport overlay inside the single-page app; URL-addressable routing/history is recorded architectural debt rather than falsely claimed complete.

B. **Overview intelligence** — deterministic narrative, dated-activity metrics, professional-relationship metrics, retrieval state and information-quality signals.

C. **Timeline** — month-grouped chronology separates **person records** (for example on-call and rotations) from **shared portfolio records** (for example study/project milestones). Shared milestones never establish personal ownership.

D. **Portfolio** — resident assignments, formal resident supervision, research studies, innovation projects and programme coordination are kept semantically distinct. Study/project record dates are not presented as personal participation dates unless the source explicitly records them.

E. **Evidence / provenance** — source state, checked time, relevant-record counts, caveats, module navigation and record-level navigation are first-class. Retrieval success is not described as institutional data completeness.

F. **Document** — offline HTML and Print → Save as PDF remain available from the same permission-scoped deterministic snapshot as the interactive workspace. The formal brief now includes resident assignments, formal supervision and source retrieval details so it does not collapse relationships that the interactive UI keeps separate.

G. **Contextual integration** — Staff and Grounded entry points use the same reporting snapshot capability. `reporting.personal_activity_snapshot` is registered as a Grounded READ tool and calls the same `Activity45.snapshot(...)` builder used by the workspace. Grounded handoff includes the selected person, exact period, resident assignments, supervision, portfolio relationships, issues, source timestamps and explicit truncation metadata.

H. **Visual / interaction hardening** — crisp neumDesk shell, period presets, scope chips, searchable person control, semantic keyboard-accessible tabs, retained last-good snapshot during refresh, explicit dirty/loading states, responsive/mobile Grounded access, no backdrop blur/haze, and an 11px minimum floor for meaningful supporting text in this workspace.

## Audit hardening completed

The first A→H pass was re-audited against the actual implementation rather than accepted because regression tests passed. The following corrections are release requirements in this package:

- **Unknown ≠ zero.** A restricted or unavailable source produces an unknown metric (`—`) rather than a numeric zero. `0` is used only when a source was successfully retrieved and established no matching records.
- **Retrieval evidence, not “100% source coverage.”** The UI reports how many included sources were successfully retrieved; it does not imply that every departmental activity has been entered or that institutional records are complete.
- **Soft-terminated rotations are deliberately retrieved.** Terminated-early records are merged into the Personal Activity snapshot. If the source does not store an actual termination date, neumDesk does not fabricate one or present the planned span as completed activity.
- **Formal document parity.** Resident assignments and formal resident supervision have dedicated representation in the formal brief, matching the interactive Portfolio semantics.
- **Record-level provenance.** Timeline and Portfolio records can navigate to the specific supporting record when the corresponding neumDesk module has that record loaded; otherwise they fall back to the correct source workspace.
- **Grounded reporting tool.** Portfolio Intelligence is no longer only a UI-to-chat context object. Grounded has a semantic READ capability over the same deterministic snapshot builder.
- **No silent Grounded truncation.** Bounded arrays include total/included/truncated metadata so Grounded knows when context is partial.
- **Last-good snapshot is preserved.** Changing scope or refreshing no longer blanks the current workspace; the previous completed snapshot remains visible and is clearly marked stale until the refreshed snapshot succeeds.
- **Search + accessibility hardening.** Person selection is searchable, tabs expose tab semantics and keyboard navigation, mobile retains an Ask Grounded action, and supporting text is no longer rendered at microscopic sizes.

## Reporting invariants

- Dated activity is not the same as a persistent professional relationship.
- Shared project/study milestones do not imply personal ownership.
- Restricted/unavailable sources are never converted to zero activity.
- Formal resident supervision is represented from rotation records, not inferred from Clinical Unit attending membership.
- Interactive and formal outputs share one permission-scoped deterministic model.
- Grounded context is session-only and never becomes a parallel source of truth.
- Source retrieval success is evidence of retrieval, not proof of global record completeness.
- No actual termination date is inferred when a rotation source does not provide one.

## Runtime files changed

- `index.html`
- `app.js`
- `activity45.js`
- `activity45-ui.css`
- `DepartmentOS_Architecture.md`
- `GROUNDED-ARCHITECTURE.md`
- `README-V46.14.md`
- forward-compatible historical regression assertions where the same invariant is preserved
- `test-v4614.cjs`

No backend `index.js` change is included.

## Validation status

- Automated historical regression: **256 checks passed across V43.1 → V46.14**.
- Dedicated V46.14 suite covers the original A→H contracts plus the R1→R7 hardening invariants.
- JavaScript syntax validation covers the main application and Personal Activity runtime files.
- **Still required before leaving V46.14:** deploy/authenticated browser review with real data, responsive interaction review, and print/PDF review. Findings from that validation remain V46.14 refinements.
