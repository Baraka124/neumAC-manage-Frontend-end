# neumDesk V46.14 — Grounded × Portfolio Intelligence (Hardened + Presentation Converged)

V46.14 remains the active version. This revision completes the A→H Personal Activity programme **and** the subsequent implementation audit/hardening pass. The release stays on V46.14 deliberately: the feature is not promoted to another version until live authenticated browser and print validation confirms the workspace behaves as designed.

## Access Gate 4.3 — login UI hierarchy

The Access Gate now presents neumDesk as an authorised departmental workspace rather than an editorial landing page with a small form. The access column is wider and positioned higher; the sign-in state uses a stronger task hierarchy; loading shows Account → Permissions → Workspace progress; trusted-session resume remains a deliberate gate; public perspective navigation is suppressed while access is pending; and mobile keeps the authentication task first. Session persistence/security behavior remains exactly as defined by Access Gate 4.2.

## Grounded Phase 4.1B — intelligence UI convergence

The current V46.14 artifact now includes Grounded Phase 4.1A/4.1B. Phase 4.1A tightens source dependencies, provenance/confidence and routing precision; Phase 4.1B makes those semantics visible through the shared Phase 4 UI system. Grounded is presented as a crisp department-intelligence workspace with structured source scope, evidence, proposal and context patterns rather than a separate cloud/glass interface. Dialog focus containment/return, a simplified primary header, 40px interaction rhythm and an 11px meaningful support-text floor are included.

The operational contract is unchanged: consequential writes still require explicit human confirmation and commit-time revalidation. Authenticated browser acceptance and deployed partial-source failure simulation remain required before production promotion.

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
- `style.css`
- `DepartmentOS_Architecture.md`
- `GROUNDED-ARCHITECTURE.md`
- `README-V46.14.md`
- forward-compatible historical regression assertions where the same invariant is preserved
- `test-v4614.cjs`

No backend `index.js` change is included.

## Validation status

- Automated historical regression: **298 checks passed across V43.1 → V46.14**.
- **62 dedicated V46.14 checks** cover A→H, semantic/reporting hardening, Grounded presentation convergence and interaction reveal/focus continuity.
- Dedicated V46.14 suite covers the original A→H contracts plus the R1→R7 hardening invariants.
- JavaScript syntax validation covers the main application and Personal Activity runtime files.
- **Still required before leaving V46.14:** deploy/authenticated browser review with real data, responsive interaction review, and print/PDF review. Findings from that validation remain V46.14 refinements.


## Joint convergence hardening (same V46.14)
This refinement was driven by authenticated browser review of Grounded and Personal Activity together. It fixes broad-scope follow-ups, pinned-context semantics, specialty null handling, selected-period rotation consistency, professional relationship counting, profile status wording, visual-answer visibility, local retrieval timestamps and latest-answer behavior. The dedicated V46.14 suite now covers these convergence scenarios explicitly.

## Grounded presentation convergence (same V46.14)

Authenticated-browser review showed that semantic correctness alone was not enough: several answers were still visually over-wrapped, context labels were crowding the header, and broad answer scope could appear to inherit a previous person. This pass keeps the calm neumDesk visual language while tightening the response grammar.

Implemented in this same V46.14 release:

- compact Grounded header with product navigation separated from pinned/current context;
- simple factual answers render as prose rather than large answer cards;
- structured surfaces are reserved for records, rosters, proposals, timelines and other content that benefits from inspection;
- `Review scope` is renamed **Answer scope** and broad builders explicitly provide department/date scope;
- broad leave follow-ups render the resolved date rather than interpolating the user’s question text;
- Portfolio → Grounded handoff becomes a compact context-transition event;
- person profiles default to a compact glance with deeper details on demand;
- `↓ Latest` replaces the intrusive large latest-answer button and appears only when needed;
- source/evidence remains visible without requiring audit detail to be opened;
- `app.js` and `style.css` cache keys are advanced to `46.14-grounded-presentation-convergence` so the deployed browser receives the refined runtime and CSS.

### Presentation invariants

- Pinned person, conversational reference and answer scope are separate concepts.
- Broad questions never inherit a previous person simply because that person remains pinned/in context.
- A raw user phrase is never displayed as a resolved date/window.
- Simple answers remain visually simple.
- Evidence is always available; audit depth is optional.
- Context-transition events are not masqueraded as ordinary assistant answers.

This remains **V46.14**. Live authenticated-browser validation continues to be the release gate before moving to another module/version.


## Interaction reveal & focus convergence (same V46.14)

Authenticated use showed a cross-UI interaction defect: content could load correctly while the viewport remained at the previous scroll position. This pass adds one explicit interaction contract without redesigning the calm neumDesk visual system.

- Grounded reveals the loading state, then aligns the **start of the newly completed turn** in the conversation scroller.
- Grounded does not blindly scroll to the absolute bottom of a long answer.
- Research programme/study/project navigation resets the Research-owned scroller and focuses the newly opened surface.
- Research Library readers reset to the top and receive focus when opened, including publications/articles launched from Research.
- Cross-module navigation clears stale destination scroll positions.
- Staff profile and Rotation detail surfaces receive focus when explicitly opened.
- Intentional return-position behavior remains intact when closing a reader back to the Library.

This is still **V46.14**. The live-browser gate now includes viewport/focus continuity in addition to semantic correctness, response wrapping, responsive behavior and print/PDF review.


## Leave temporal semantics convergence (same V46.14)

Authenticated-browser review showed that `on leave`, `scheduled leave`, and future-date leave were collapsing into the same `absent now` answer. This refinement adds explicit temporal leave semantics without changing the calm Grounded presentation model.

- `on leave` = current/today status; future leave is mentioned as future, never as current absence.
- `scheduled leave` / `planned leave` = future scheduled periods.
- named-person scheduled leave resolves the named person before department-wide routing.
- short leave fragments use the current person reference when appropriate.
- `who` / `anyone` / `everyone` explicitly widen person scope.
- requested future ranges such as `next week` are honored exactly rather than replaced by a generic next-30-days query.
- `absent_now` explicitly rejects scheduled/planned/future language.

This remains **V46.14** and continues the authenticated-browser release gate.


## Leave workspace + entity-scope convergence — V46.14 refinement

This refinement closes the remaining mismatch between Grounded leave scope and the direct Leave module.

- Explicitly named staff in operational questions are resolved before generic/taught department intents. `Is Pedro Marcos on leave today?` is therefore person-specific, while `Who is on leave today?` remains department-wide.
- Leave & Coverage now uses a contextual workforce-availability hero with separate Today, Upcoming and Coverage-review states.
- The redundant primary breadcrumb / duplicate page introduction is removed for Leave.
- Current and future uncovered leave records are tracked separately and summarized as coverage reviews.
- `30-day coverage forecast / Full coverage` is renamed to `30-day staff availability / No days below 80%` because the strip measures staffing availability, not whether each leave record has an explicit covering clinician.
- `Show past` now means exactly what it says.
- The Leave table receives a first operational-table hardening pass while preserving the existing source records and lifecycle actions.

Live authenticated validation remains required before this interaction model is extracted into the shared neumDesk table/icon system.


Final convergence validation before Staff Phase 1: **298 checks passed across V43.1 → V46.14**, including **79 V46.14 checks**. Live authenticated browser validation remains required.


## Staff Phase 1 — preservation-first directory convergence (same V46.14)

This checkpoint starts the Staff redesign without changing backend lifecycle logic.

- added `STAFF-DOMAIN-LIFECYCLE-V46.14.md` as the preservation contract;
- removed the redundant primary Staff breadcrumb;
- replaced the low-contrast mixed toolbar with separate view and action controls;
- renamed the misleading directory metric from `Available` to `Active staff`;
- repaired the People view, which was structurally unreachable inside the Compact-only branch;
- introduced the first neumDesk operational Staff table: Staff member / Role / Current or next / Record status / actions;
- residents now render their full category semantics and effective year/origin without rewriting legacy data;
- expanded directory search across role, specialty, department and resident origin;
- preserved Add/Edit, Personal Activity and the existing guarded deactivation/reassignment workflow;
- registration/edit form and full Person profile remain functionally intact for the later Staff phases.

No backend `index.js` change is included.


**Staff Phase 1 validation:** **312 checks passed across V43.1 → V46.14**, including **14 dedicated Staff Phase 1 checks**. Phase 2 now supersedes the old profile while preserving the lifecycle contract.


## Staff Phase 2 — Canonical Person Profile (same V46.14)

This checkpoint redesigns the clickable clinician/person profile against the Staff preservation map rather than simplifying the lifecycle.

- compact identity rail replaces the oversized photo / zero-metric column;
- Person navigation is consolidated to **Overview · Work & training · Schedule · Research · Profile**;
- Overview always explains current attendance, on-call, work/training and next recorded events instead of showing a giant blank state;
- attending Clinical Unit membership is loaded with the Person profile;
- resident rotations and attending supervision remain explicit relationships;
- Schedule owns on-call/leave actions and calendar export;
- Profile owns institution, credentials, roles/capabilities, contact, certificates and public/scholarly links;
- Personal Activity and Grounded are Person-level actions;
- resident year remains `override → calculated → legacy`; no legacy database values are silently rewritten;
- Add/Edit, type transition, guarded deactivation and reassignment are intentionally unchanged;
- `PERMISSIONS_ARCHITECTURE.md`, `SYNC_ARCHITECTURE.md`, and `SUPABASE_SCHEMA.sql` are now carried as deferred architecture/reference inputs for later phases.

At the Phase 2 checkpoint, adaptive Internal / Rotating / External rendering remained pending. Phase 3 now implements that adaptation without adding new resident constraints.


**Staff Phase 2 validation:** **329 historical/regression checks passed across V43.1 → V46.14**, including **17 dedicated Staff Phase 2 checks** plus the preserved Phase 1 suite. JavaScript syntax and HTML parse validation pass. This was the Phase 2 validation gate; Phase 3 is now implemented and requires live authenticated comparison across resident categories before Phase 4.


## Staff Phase 3 — Adaptive Resident Profile (same V46.14)

The Phase 2 canonical Person shell now adapts to the existing resident lifecycle rather than rendering every resident generically.

- Internal / Rotating / External residents keep one Person shell but receive category-specific training/origin/host information hierarchy.
- Rotation supervisor, resident-management role and host-unit context remain separate relationships.
- Current rotation recognition includes `active` and `extended`; scheduled rotations remain upcoming.
- Legacy calendar training years (for example `2024`) are converted to an effective R-year for display only; database values are not silently migrated.
- Grounded uses the same effective resident-year resolver.
- Registration/edit/deactivation/type-transition workflows are intentionally unchanged.
- `PERMISSIONS_ARCHITECTURE.md`, `SYNC_ARCHITECTURE.md` and `SUPABASE_SCHEMA.sql` remain future/reference contracts, not partially implemented features.

Live authenticated validation should compare at least one Attending, Internal Resident, Rotating Resident and External Resident before Phase 4.

**Staff Phase 3 validation:** **348 historical/regression checks passed across V43.1 → V46.14**, including 19 dedicated Phase 3 checks plus the preserved Staff Phase 1/2 suites. JavaScript syntax and HTML parse validation pass.

**Phase 3 template hotfix:** authenticated browser validation exposed Vue production compiler error `compiler-30` in two newly introduced resident-profile fallback branches. The fallbacks now use explicit inverse `v-if` conditions rather than relying on `v-else` adjacency. No domain logic, resident lifecycle, backend API or stored data changed.

## Staff Phase 3.1 — Profile Integrity (same V46.14)

A direct inspection of the corrected Phase 3 package found integrity gaps that regression/string checks did not cover. Phase 3.1 fixes those gaps without starting Phase 4.

- restored the known-good Vue 3.4.21 CDN runtime reference;
- reset and token-guard all Person-profile async state to prevent cross-person stale data;
- preserve unknown resident category as unknown;
- distinguish current vs next rotation throughout the adaptive resident profile;
- de-duplicate current vs upcoming leave;
- preserve external-contact phone;
- load host attending-team context from existing unit membership;
- add future resident-supervision events to attending timelines;
- map Staff Research to actual research permissions;
- add dialog/tab/focus accessibility baseline.

No backend `index.js`, schema, resident lifecycle, permissions architecture or sync architecture is changed. Phase 4 remains blocked on live validation of the four representative Person profiles.

**Staff Phase 3.1 validation:** **369 checks passed across V43.1 → V46.14**, including 14 dedicated integrity checks and 7 DOM-template safety checks. JavaScript syntax, HTML parse, browser-DOM adjacency validation, local dependency audit, manifest verification and ZIP integrity are part of the freeze.

**Phase 3.1 browser-DOM hotfix:** a second authenticated deployment still exposed Vue `compiler-30`. The root cause was release-wide: because neumDesk uses an in-DOM Vue template, literal `<` comparisons inside directive attributes or `{{ ... }}` expressions can be interpreted by the browser as markup before Vue compiles the template. All such comparisons are now HTML-safe (`&lt;` in source, decoded back to `<` in the DOM). Chromium validation confirms 191 conditional else branches and 0 broken adjacencies. `test-v4614-template-dom.cjs` prevents this class from returning.

## Staff Phase 4 candidate — reusable UI foundation

The Staff directory and canonical Person profile now carry a parallel reusable `nd-*` component vocabulary while preserving every existing `staff46-*`, `pp2-*` and `pp3-*` compatibility hook. The extraction standardizes controls, focus treatment, operational table/status grammar, Person sections, record lists and support-text typography without changing lifecycle or runtime data behavior. `app.js`, Grounded and Personal Activity runtime files remain unchanged. See `UI-SYSTEM-V46.14.md`.

This is still a **candidate** inside V46.14. Promotion depends on authenticated validation of Attending + Internal/Rotating/External Resident profiles and Table/People/Compact views.
**Phase 4 automated validation:** 24 suites / 387 checks pass on the candidate, including DOM-template safety. Live authenticated four-profile and responsive comparison remains pending.



## Staff Phase 4 — reusable UI foundation

The Staff directory and canonical Person profile now expose a reusable `nd-*` presentation contract while preserving the existing `staff46-*`, `pp2-*` and `pp3-*` hooks. This phase is deliberately presentation-only: Staff lifecycle, Supabase schema, registration/edit behavior, Grounded, permissions and sync semantics are unchanged.

Promotion hardening in this package fixes the malformed CSS comment boundary discovered in the candidate, adds ARIA state to the Table / People / Compact selector, adds Space-key activation to interactive directory records, uses roving focus and labelled panels in the Person tabs, and hardens overflow/mobile density. `app.js`, `grounded-core.js` and `activity45.js` remain byte-for-byte unchanged from the validated template-safe baseline.

Automated validation now passes **24 suites / 393 checks** including the DOM-template guard and **24 dedicated Staff Phase 4 checks**. Production acceptance still requires authenticated review of one Attending, one Internal Resident, one Rotating Resident and one External Resident, plus Table / People / Compact at desktop, tablet and mobile widths.


## V46.14 Grounded Phase 4.1A — Knowledge contract precision

Grounded now treats source availability as an **intent-level dependency**, not a release-wide all-or-nothing condition. A failed Innovation Projects request no longer blocks a verified Leave or On-call answer when the resolved intent does not depend on Innovation. Consequential writes remain on their existing guarded confirmation and commit-time revalidation paths.

Implemented knowledge-integrity changes:
- exact source keys map the nine refreshed record families to each Grounded intent/follow-up;
- degraded reads execute only when the sources required for that answer are verified;
- every finalized factual answer carries a `grounded.answer.v1` knowledge envelope with required/checked/unavailable sources, evidence count, temporal scope and retrieval timestamp;
- confidence now carries an explicit structured reason and source completeness can lower confidence independently of answer prose;
- near-tie staff identity matches (within one fuzzy-token scoring step) trigger clarification rather than silently selecting the first person;
- Teach vocabulary cannot override a conflicting strong built-in route, and the Teach UI blocks obvious strong-route collisions before persistence;
- ranking/comparison answers now expose their current temporal meaning as **All recorded records** rather than leaving the reporting period implicit.

**Preservation boundary:** no Supabase schema, Staff lifecycle, Leave/On-call/Rotation write semantics, permission model, sync architecture or Staff Phase 4 presentation contract changes in 4.1A. Grounded UI convergence is the next checkpoint (4.1B).

## Grounded Phase 4.1E — On-call temporal precision
Authenticated testing exposed a temporal/scope edge case in named on-call questions. Phase 4.1E preserves explicit person/date scope, prevents broad roster requests from inheriting stale Person context, honours explicit list-all schedule requests, and applies the compact collection-scope treatment to roster answers. No write contract or non-Grounded module UI is changed.


### Access Gate 4.2 — session integrity

Live browser review showed that valid locally persisted JWTs could make return visits appear to bypass login. Normal sessions are now tab-scoped; browser persistence is explicit and bounded; persisted sessions stop at a verified resume gate before records render; and legacy unbounded browser tokens require one-time reauthentication. The release remains V46.14 and no Grounded, Staff, permission or schema semantics changed.

## Access Gate 4.4

The V46.14 access gate now carries the neumact editorial identity and final login UX polish while preserving Access 4.2 session integrity. See `ACCESS-GATE44-CHANGES.md` and `VALIDATION-V46.14-ACCESS-GATE44.md`.
