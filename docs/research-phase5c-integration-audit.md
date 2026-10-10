# neumDESK — Phase 5C: Research ↔ Research Library integration and operational typography

Date: 2026-10-10
Scope: Research overview, Research Library index, Library reader and their navigation handoffs only.
Baseline: main after the merged Phase 5A (#43) and 5B (#44–#45) changes. PR #46 is a separate open 5B patch and must be integrated/rebased before any dependent reader release.

## Method and evidence status
This is a **source-backed integration audit and acceptance contract**, not a completed authenticated E2E pass. Reviewed `docs/research-phase5a-institutional-audit.md`, `docs/research-phase4c-handoff.md`, `research-visibility.css`, and the PR #46 patches. Full computed CSS for `style.css`/live authenticated Vue was not accessible in the current review. Do not assign "pass" to browser behavior without executing a full-page test.

## Prioritized findings and work items

### P0 — Connected-record return and pager state
- PR #46 changes `newsDrawerNext` to require `idx >= 0`, preventing an unrelated Next when the selected related record is absent from the filtered list.
- Its extracted-computation test is valuable but not proof of actual drawer navigation. Preserve search/filter state, source record identity, reader scroll position and a usable Back/Return target when following Institutional connections.
- Integration test: filtered Library → reader A → Institutional connection B not in filtered results → no unrelated Next/Previous; return → reader A or explicit originating Library context, no lost query. Recheck when switching filter, closing reader and opening editor.
- Do not change production pager again until #46 lands and the runtime failure is reproduced on that baseline.

### P1 — Operational typography and hierarchy
- Phase 5A recorded very small authored Research labels: `.rv31-pulse-kicker` 10.5 px, pulse descriptions 11 px, `.rv31-section-head p` 12.2 px.
- `research-visibility.css` already overrides many metadata colors and Library navigation text; `.news-v25-tabs button span`, `.news-v28-lensbar button span`, `.news-v28-lens-label`, `.news-v25-shown`, `.news-v25-index` are set to 14 px. Do not add a blanket rule that fights these.
- Measure computed font-size, line-height, contrast, clipping, number of lines and button height for these selectors in **real rendered context**. Separate navigational labels, supporting captions, and genuinely secondary micro-labels. Prefer >= 12 px for supporting operational descriptions and >= 14 px for interactive navigation except clearly justified compact metrics; verify density against actual text lengths.
- Verify 390, 640, 800×450, 1366, 1440 and 2048 px before altering selectors. No broad !important typography patch without before/after evidence.

### P1 — Navigation and nested UI continuity
- Traverse Research line → study/innovation → related publications → Library reader, then reverse. Every transition must expose current location, return destination, selected record identity and accessible close action.
- Opening a related record must not silently clear the Library search/filters, place a modal beneath an existing overlay, or leave keyboard focus on hidden content.
- At 390/640 px verify visible navigation affordances without horizontal document overflow; horizontally scrollable filters remain reachable and distinct from reader scrolling.
- When returning to editor, preserve Phase 4C dirty-edit cancel/discard safeguards; never discard on navigation as a side effect of an interface fix.

### P2 — Loading, empty and error states
- Enumerate zero results, missing related record, no connection, inaccessible connection, loading, stale data, API failure and permissions denied.
- Keep empty states actionable and precise; never display a dangling "next" control or a link to a missing record.
- Ensure empty-reader content does not create misleading dark voids; long content must remain contained and scannable.

## Acceptance matrix (not yet executed)
| Flow | Desktop 1366/1440/2048 | Tablet 800×450 | Mobile 640/390 | Authenticated role |
|---|---|---|---|---|
| Research → Research Library with context | Pending | Pending | Pending | Pending |
| Search/filter → record → back | Pending | Pending | Pending | Pending |
| Related record outside filtered set | Pending; #46 isolated test | Pending | Pending | Pending |
| Reader → editor → dirty cancel/confirm → return | Pending | Pending | Pending | Pending |
| Keyboard focus, Escape, nested overlays | Pending | Pending | Pending | Pending |
| Typography/contrast computed values | Pending | Pending | Pending | Pending |
| Empty, long-form and inaccessible records | Pending | Pending | Pending | Pending |

## Recommended implementation slices
1. Land and verify 5B PR #46; capture CI status and run actual pager scenarios. If it remains open, this Phase 5C document can be reviewed independently but downstream code changes must be rebased.
2. Build one authenticated Playwright flow following Research → Library → reader → connected record → return, including state preservation and accessible focus.
3. Capture computed typography/contrast and screenshots. Apply only proven scoped CSS corrections, with side-by-side baselines.
4. Add empty/error and narrow-view regression, then report CI checks and remaining gated behaviors.

## Retained Phase 4C release gates — OPEN
- Authenticated Vue reader/editor/save/discard transitions and persistence/errors.
- Research line, clinical-study and innovation modal Escape/focus/backdrop/scroll lifecycle.
- Clinician, editor, admin and read-only privilege tests at both UI and API layers.
- Reader computed colors, long records, scroll containment and nested navigation on devices.
- Pending save/API failure and refresh/recovery behavior.

## Change guardrails
No backend or authorization policy changes for visual fixes. Preserve existing navy/teal neumDESK identity, restrained institutional surfaces, research terminology and information richness. Do not extend scope into other modules or claim runtime validation from static fixtures.
