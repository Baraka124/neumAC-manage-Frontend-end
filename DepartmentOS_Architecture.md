# DepartmentOS — Master Architecture

*The complete, integrated architecture: every idea that holds together, from the system running today to the full vision — structured so it can actually be built.*

**Status:** Architecture v2.9 · Implementation checkpoint: V46.14 Grounded Phase 4.1B Intelligence UI Convergence · Supersedes Vision v0.1
**First domain:** Pneumology, CHUAC (live production — current Staff directory: 23 real departmental people, real workflows)
**Author's note:** This is the reference both of us build against. It is honest about what exists, what is buildable now, and what waits on infrastructure we don't yet have.

---

## Current implementation ledger — V46.14

## V46.14 Access Gate 4.3 — Authoritative access hierarchy

The login gate now gives the authentication task more visual and semantic weight without changing the Access Gate 4.2 session-integrity model. The right-hand access workspace is widened and moved higher in the reading order; sign-in, trusted-session resume and verification/opening states use explicit access language; the editorial neumAC panel is deliberately secondary and no longer exposes public-story navigation controls while departmental access is pending.

**Preservation boundary:** `app.js`, `style.css`, authentication persistence semantics, permissions, Grounded, Staff and all operational modules are unchanged. 4.3 is an `index.html` + `entry46.css` UI checkpoint only.

## V46.14 Grounded Phase 4.1B — Intelligence UI convergence

Grounded now adopts the reusable neumDesk Phase 4 visual/accessibility language without weakening the knowledge contract introduced in 4.1A. The visible surface is a crisp **department intelligence workspace**, not a floating cloud/glass product. Legacy `askbar-*`, `grounded-*`, `gr43-*` and `gr45-*` classes remain as compatibility hooks while new `nd-*` contracts become the reusable presentation layer.

Implemented convergence changes:
- the visible cloud/mist treatment is removed; the modal workspace uses a crisp bordered surface with no backdrop blur;
- the primary header is reduced to Expand/Compact, New, Tools and Close, while Personal Activity, Activity, Trace and Teach move into a secondary permission-aware Tools menu;
- Grounded exposes dialog semantics, a labelled title, keyboard focus trapping, Escape close and return-focus behavior;
- source readiness and active Person/object context use the shared `nd-source-health` / `nd-context-strip` language;
- answer turns expose `nd-answer`, `nd-answer-scope`, `nd-evidence-strip`, `nd-evidence-records` and `nd-proposal` contracts while preserving the existing structured visual types;
- the 4.1A typed knowledge envelope is now visible: verified/partial source scope, checked source labels, confidence reason and unavailable-source warnings render directly from structured answer metadata;
- the Phase 4 40px primary-control rhythm and 11px meaningful support-text floor are applied across the Grounded workspace, with responsive/mobile rules and reduced-motion handling;
- the composer, evidence controls and operational proposals share the same focus language established by Staff Phase 4.

**Preservation boundary:** 4.1B does not change the Supabase schema, permission model, sync contract, Staff lifecycle, action-integrity confirmation rules, commit-time revalidation, Personal Activity snapshot semantics or the 4.1A source dependency model. Live authenticated visual acceptance and deployed partial-source simulation remain release validation gates.

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

**Preservation boundary:** no Supabase schema, Staff lifecycle, Leave/On-call/Rotation write semantics, permission model, sync architecture or Staff Phase 4 presentation contract changes in 4.1A. Grounded UI convergence is implemented immediately above as Phase 4.1B.


## Staff Phase 4 — reusable UI foundation

The Staff directory and canonical Person profile now carry a parallel reusable `nd-*` component vocabulary while preserving every existing `staff46-*`, `pp2-*` and `pp3-*` compatibility hook. The extraction standardizes controls, focus treatment, operational table/status grammar, Person sections, record lists and support-text typography without changing lifecycle or runtime data behavior. `app.js`, Grounded and Personal Activity runtime files remain unchanged. See `UI-SYSTEM-V46.14.md`.

The Phase 4 implementation is now complete in the release artifact. Production acceptance remains gated by authenticated validation of Attending + Internal/Rotating/External Resident profiles and Table/People/Compact views; that live check is a deployment validation step, not unfinished architecture.


## V46.14 Staff Phase 3.1 — Browser DOM template safety hotfix

Authenticated deployment still failed with Vue production compiler error `compiler-30` after the earlier local template fix. A full browser-DOM audit found the root cause was broader than Staff: neumDesk mounts an **in-DOM Vue template**, so the browser parses `index.html` before Vue compiles it. Literal `<` comparison operators inside Vue directive attributes or interpolation expressions can therefore corrupt the DOM tree before Vue sees it.

Release-wide correction:
- escaped every literal `<` operator inside Vue-bound HTML attribute values as `&lt;`; the browser decodes it back to `<` for Vue while preserving HTML structure;
- escaped every literal `<` inside `{{ ... }}` expressions for the same reason;
- removed an accidental duplicate pair of external-contact email/phone rows in the Phase 3.1 Person profile;
- added `test-v4614-template-dom.cjs` so raw `<` comparison operators cannot silently re-enter in-DOM template attributes/interpolations;
- validated the parsed application template with Chromium: **191 `v-else` / `v-else-if` branches, 0 broken adjacencies** after browser parsing;
- full historical regression remains green.

**Root-cause invariant:** source-level HTML validity is not enough for an in-DOM Vue application. Release validation must protect the **browser-parsed template** that Vue actually receives.

**Validation:** 369 checks pass across V43.1 → V46.14, including the new DOM-template safety suite. No backend, resident lifecycle, permission or sync behavior changed.


## V46.14 Staff Phase 3.1 — Profile integrity

Phase 3.1 is a correctness/stability pass over the adaptive Person profile. It does **not** introduce a new resident model or Phase 4 visual system.

Implemented integrity corrections:
- the Staff profile returns to the known-good Vue 3.4.21 production CDN runtime instead of referencing a missing local `vue.global.js`;
- profile transient state is cleared before a different Person opens, and asynchronous profile loads are token-guarded so late results from Person A cannot populate Person B;
- a resident without `resident_category` is rendered as **Resident · Category not recorded** and is never inferred to be an Internal Resident;
- current and next rotations use distinct labels for host unit, date window and recorded supervisor;
- leave beginning today is current leave only, not duplicated in the future-leave list;
- external resident contact phone is preserved alongside name/email;
- host attending-team context is loaded from existing `unit_staff` links and is explicitly contextual, not a formal supervision constraint;
- attending future timelines include scheduled resident-supervision starts;
- Staff Research visibility/loading uses actual research-module read permissions (`clinical_trials`, `research_lines`, `innovation_projects`) rather than the unrelated `analytics` pseudo-module;
- the Person drawer now has dialog semantics, semantic tabs, focus trapping and the existing Escape-close lifecycle.

**Preservation boundary:** no backend schema, resident registration, rotation write, deactivation, permission architecture or sync architecture is changed in Phase 3.1.

**Phase 3.1 validation:** 362 historical/regression checks pass across V43.1 → V46.14, including 14 dedicated Phase 3.1 integrity checks plus preserved Staff Phase 1/2/3 suites.

**Next Staff checkpoint:** live authenticated validation of one Attending, one Internal Resident, one Rotating Resident and one External Resident on this integrity baseline. Only after that should Phase 4 extract reusable icon/status/table/Person UI rules.

## V46.14 Staff Phase 3 — Adaptive resident profile

The canonical Person shell now adapts to the resident relationship actually recorded in `medical_staff.resident_category` while preserving one Person model. Internal, rotating and external residents no longer share a generic resident information hierarchy.

Implemented in Phase 3:
- **Resident · Internal** surfaces programme progression, effective R-year, current/next host rotation, exact window and recorded rotation supervisor;
- **Resident · Rotating** makes the home-department → Pneumology host relationship explicit;
- **Resident · External** makes home institution/home department → Pneumology host context explicit and retains external-contact information;
- department resident-management roles (`is_resident_manager`) are shown separately from the supervising attending recorded on an individual rotation;
- active and `extended` rotations are treated as current operational rotations;
- bare legacy calendar years such as `2024` are normalised to an effective R-year for display, without rewriting the stored value;
- Grounded resident-year grouping uses the same effective-year resolver as Staff, preventing UI/chat disagreement.

**Preservation boundary:** Phase 3 changes presentation and derived display semantics only. Registration/edit, resident category validation, rotation writes, supervisor requirements, deactivation and type-transition behavior remain unchanged.

**Phase 3 validation:** 348 historical/regression checks pass across V43.1 → V46.14, including 19 dedicated adaptive-resident/template-safety checks plus preserved Phase 1/2 Staff suites.

**Authenticated-browser hotfix:** the first Phase 3 deployment exposed Vue compiler error `compiler-30` from fragile `v-else` adjacency in two new Person-profile fallback branches. Those branches now use explicit inverse `v-if` predicates. This is a presentation-template correction only; the Person model, adaptive resident semantics, lifecycle and backend remain unchanged.

**Next Staff checkpoint:** Staff Phase 3.1 live validation first; Phase 4 begins only after the four-profile comparison is clean.

## V46.14 Staff Phase 2 — Canonical Person profile

Staff now has a canonical **Person** renderer rather than a database-module drawer. The redesign preserves the Staff lifecycle map and existing API behavior while reorganizing the profile around identity, current operational state, clinical/training relationships, schedule, research and professional record.

Implemented in Phase 2:
- the oversized photo / zero-metric left column is replaced by a compact identity rail;
- profile navigation is consolidated to **Overview · Work & training · Schedule · Research · Profile**;
- empty profiles still show current attendance, on-call, unit/rotation and next-event context rather than a large blank pane;
- Clinical Unit membership is preloaded as part of the Person record;
- attending supervision and resident rotations remain explicit relationships rather than inferred profile fields;
- schedule actions move into Schedule, while Personal Activity and Grounded become Person-level actions;
- certificates, roles/capabilities, institution, credentials, contact and public/scholarly links remain represented;
- resident-year display continues to use `override → calculated → legacy` precedence and no legacy values are rewritten in this phase.

**Preservation boundary:** registration/edit, staff-type transition, deactivation/reassignment and backend lifecycle logic are unchanged. At the Phase 2 checkpoint, adaptive Internal / Rotating / External presentation remained pending; Phase 3 now implements it without introducing new resident constraints.

**Phase 2 validation:** 329 historical/regression checks pass across V43.1 → V46.14, including 17 dedicated Staff Phase 2 checks in addition to the 14 Phase 1 Staff checks.

### Deferred architecture contracts now carried in the baseline
- `PERMISSIONS_ARCHITECTURE.md` is the future authentication/authorization contract. Phase 2 does **not** retrofit role/row-level security into the Person UI yet; future auth work must keep `app_users` as login identity and `medical_staff` as professional profile, then layer role defaults + explicit overrides intentionally.
- `SYNC_ARCHITECTURE.md` is the future Excel-sync contract. Operational Excel sources remain authoritative where specified; sync must be diffed, conflict-aware and auditable before data is accepted into neumDesk.
- `SUPABASE_SCHEMA.sql` is retained as the current database reference for Staff/rotation/unit/identity fields used by subsequent phases.

### V46.14 Staff Phase 1 — preservation-first directory redesign
The Staff redesign begins from the existing lifecycle rather than from a blank UI. `STAFF-DOMAIN-LIFECYCLE-V46.14.md` is the preservation map for resident categories, residency-year precedence, unit/rotation relationships, role flags, lifecycle transitions and guarded deactivation.

Implemented in Phase 1:
- Staff keeps the existing backend/create/edit/deactivation logic unchanged;
- the primary-module breadcrumb is removed and the global neumDesk header remains the module title owner;
- a contextual workforce-directory hero uses **Active staff**, not the stronger and previously misleading **Available** label;
- Table / People / Compact controls are visible and separated from Export / Personal Activity / Add Staff actions;
- the previously unreachable People view is repaired (it was nested inside the Compact-only branch);
- the first operational Staff table is identity → role → current/next context → record status → actions;
- residents render as `Resident · Internal`, `Resident · Rotating`, or `Resident · External`, with effective year and recorded origin when available;
- the search surface now includes role, specialty, department and resident-origin text in addition to name/ID/email;
- guarded removal/reassignment, Edit and Personal Activity remain reachable from each row.

**Phase 1 boundary at the time:** the large clickable Person profile was deliberately left untouched. Staff Phase 2 has now completed that canonical Person redesign against the lifecycle map.

**Phase 1 validation:** 312 historical/regression checks passed across V43.1 → V46.14, including 14 Staff Phase 1 preservation and UI-contract checks. Phase 2 is preserved as the common Person-shell milestone; Phase 3 is now implemented on top of it.


This is the **living checkpoint** and is authoritative over older status statements below.

### Canonical baseline
- Baseline entering this release: **V46.13 · Personal Activity / Portfolio Intelligence**.
- Current release: **V46.14 · Portfolio Intelligence + Grounded/Leave convergence + Staff Phase 3.1 Profile Integrity**.

### Preserved implementation milestones
- **V46.9 · Grounded Action Integrity** — On-call migrated to guarded semantic tools, pending action state, human confirmation and commit-time revalidation.
- **V46.10 · Leave Action Integrity** — leave creation migrated to the same guarded action path with ambiguity-safe identity and overlap validation.
- **V46.11 · Resident Rotation Action Integrity** — primary resident rotation assignment migrated to guarded tools, exact capacity/overlap validation and formal supervisor context.
- **V46.12 · Clinical Units Consolidation** — Clinical Unit semantics and visual shell consolidated on the action-integrity baseline.
- **V46.13 · Personal Activity / Portfolio Intelligence** — deterministic reporting snapshot promoted from document export into an interactive structured-output client.

### What is real now
| Layer | Status |
|---|---|
| Canonical Knowledge Model | Partial, adopted |
| Canonical Knowledge Layer | Partial / transitional |
| Semantic Layer | Strong deterministic implementation |
| Intent Engine | Mature but monolithic |
| Grounded Harness | Built |
| Tool adapters | Clinical Units + On-call + Leave + Resident Rotations |
| READ | Mature |
| PROPOSE | Strong |
| ACT | Partial, real — guarded writes exist for on-call, leave creation and primary rotation assignment |
| Human in loop | Built pattern |
| Observability | Built foundation |
| Permissions | Operational |
| Structured outputs | Mature Personal Activity client with unknown-vs-zero state, record provenance, interactive/formal parity and shared reporting capability; broader universal adoption pending |
| Operational memory | Partial; task-only Grounded memory |
| Multi-agent | Intentionally deferred |

### V46.12 — Clinical Units domain model
Clinical Units now uses one explicit semantic model:
```text
Clinical Unit ──member_of──> attending physicians (0..n)
Resident ──rotates_in──> Clinical Unit (time-bounded)
Resident rotation ──supervised_by──> formal department/rotation supervisor
Clinical Unit ──resident_capacity──> configured independently
```

Consequences:
- unit attendings are contextual clinical relationships, not mandatory formal supervisors;
- a missing unit-level supervisor is not an operational conflict;
- attending absence does not directly redefine resident capacity;
- Grounded placement logic uses exact capacity + resident overlap as hard constraints, with attending links as context;
- the user-facing shell now follows the Overview dashboard visual grammar.


### V46.14 convergence hardening — Grounded × Portfolio Intelligence
- Grounded broad-person language (anyone / who / everyone) widens person scope while retaining the relevant date instead of inheriting the previous person.
- Pinned context and current answer scope are distinct concepts; pinned staff context is explicitly labelled and can be cleared.
- Portfolio narrative, metrics, Timeline, Portfolio, Document and Grounded now derive rotation counts from the same selected-period relationship collections.
- Professional portfolio relationship counts mean research + innovation + programme relationships only; time-bounded training/supervision relationships are reported separately.
- Grounded collection/profile visuals open by default when they are necessary to understand the answer; audit details remain optional.
- Generic unit-specialty questions never interpolate missing values such as `undefined`; unfiltered requests return grouped specialty results.
- Staff profile cards use evidence-specific operational status (for example `No recorded absence today`) rather than the ambiguous label `Available`.

### V46.14 presentation convergence — Grounded calm response grammar
- Grounded keeps product identity and current/pinned context separate: the top navigation no longer tries to render a long context sentence inside the header.
- Simple factual answers render as calm prose with a compact evidence strip; cards are reserved for structure such as rosters, profiles, proposals and timelines.
- Every answer has its own explicit **Answer scope**. Broad department questions set department-wide scope rather than inheriting a pinned/current person.
- Broad leave follow-ups resolve the inherited date first and render that resolved date; the raw question text can never become a date label.
- Portfolio Intelligence handoff is a compact context-transition event, not a large explanatory answer card.
- Person records default to a compact glance and expose deeper staff details only on demand.
- “Latest answer” navigation is a small conditional control and must not cover the reading plane.
- Evidence remains visible without forcing the user to open audit depth; retrieval method / deep detail stays secondary.
- Browser cache keys for `app.js` and `style.css` are advanced inside the same V46.14 release so live deployments actually receive the convergence CSS/runtime.

### V46.14 interaction continuity — Interaction reveal & focus contract
- A click or command that reveals a new surface must move the relevant scroll container to that surface after layout settles; users must not hunt below an old scroll position.
- Grounded follows the loading state and then the start of the newly completed answer turn. It does not blindly jump to the absolute bottom of a long response.
- Research detail navigation resets the Research-owned scroller and moves focus to the newly opened study/project/programme surface.
- Research Library readers reset their own reading scroller and receive focus when opened, including records launched from Research programme outputs.
- Cross-module navigation resets stale module scroll position at the destination boundary.
- Explicit drawers/sheets such as Staff profile and Rotation detail receive focus when opened.
- Return-position behavior is preserved only where it is intentional (for example closing a Research Library reader back to the previous Library position).


### V46.14 leave temporal semantics — current state vs future schedule
- Grounded models leave questions with explicit temporal scope: **current/today**, **specific date or window**, **scheduled/upcoming**, and **history/aggregate** are not interchangeable.
- A short leave query after opening a person (for example `on leave` or `scheduled leave`) resolves against that current person reference unless the user explicitly widens scope with `who`, `anyone`, `everyone`, or equivalent language.
- `on leave` answers current status first. If the person is not absent today but has future leave, Grounded says so explicitly and surfaces the next scheduled period rather than claiming the person is currently absent.
- `scheduled leave` / `planned leave` is a future-schedule query and never falls through to the `absent now` builder.
- Named-person future questions (for example `Marina scheduled leave`) resolve the person before department-wide schedule routing.
- Department-wide upcoming leave honors an explicitly requested date/window (for example `next week`) instead of always substituting a generic 30-day horizon.
- Leave answers expose answer scope such as `current leave status`, `scheduled leave`, or the resolved date/window so temporal meaning is inspectable.

### V46.14 Leave workspace + entity-scope convergence — direct UI and Grounded agree on scope
- **Explicit named entity scope outranks generic vocabulary.** A question such as `Is Pedro Marcos on leave today?` resolves Pedro first and cannot fall through to the department-wide `absent now` builder. Ambiguous names still require clarification.
- The direct **Leave & Coverage** module now presents one temporal operational model: **Today**, **Upcoming**, **Coverage review**, and monthly context are distinct states rather than repeated page summaries.
- Primary-module breadcrumb duplication is removed from Leave; the contextual hero follows the same neumDesk page-shell grammar already established by Overview and Clinical Units.
- Missing explicit cover on a leave record is described as a **coverage review**, not automatically as department-wide understaffing. Current and future uncovered records are counted separately before being summarized.
- The old 30-day `coverage forecast / Full coverage` label is replaced by **30-day staff availability**. It measures active staff availability by day and therefore cannot be confused with whether an individual leave record has a named covering clinician.
- The `Show past` control now has positive semantics: checked means returned/cancelled historical records are shown; unchecked means the working view remains active/planned.
- Leave receives the first targeted **operational-table hardening** pass: calmer grid lines, tabular dates, compact row actions and stronger row scanning while preserving the same source records and lifecycle actions. This is a first module implementation, not yet the universal neumDesk table system.

### Known debt
1. Multi-unit rotation writes remain sequential because there is no atomic backend batch endpoint.
2. Rotation edit/extend/cancel and leave return/edit/cancel remain legacy lifecycle writes.
3. Many Grounded reads still live in the monolithic router instead of capability modules.
4. The Canonical Knowledge Layer is not yet the exclusive operational interface.
5. Role-first permissions remain a future onboarding improvement.
6. Personal Activity now exposes `reporting.personal_activity_snapshot` as a deterministic semantic READ capability shared by the workspace and Grounded. Free-form routing to that capability remains staged rather than universal.
7. Personal Activity is visually full-screen but still implemented as an application overlay rather than a URL-addressable route; deep-link/browser-history integration remains product-architecture debt.

### What comes next
**Next checkpoint:** deploy and live-test **Staff Phase 1** as the first preservation-first workforce surface: header consolidation, Table/People/Compact switching, resident category/year/origin rendering, current/next operational context, row actions and responsive table behavior. Only after that gate move to **Staff Phase 2 — Canonical Person profile**, using `STAFF-DOMAIN-LIFECYCLE-V46.14.md` as the no-loss contract. Leave/On-call/Rotations inherit only Staff patterns that survive live use; print/PDF review for Portfolio Intelligence remains required.

---


## Implementation checkpoint — V46.14 (2026-09-21)

### Personal Activity becomes a hardened Portfolio Intelligence workspace
V46.14 implements the full A→H product programme around the deterministic Personal Activity snapshot and then hardens it after code audit. It is presented as a full-screen departmental workspace, while the underlying container remains a transitional application overlay rather than a URL-addressable route.

**A → H implemented and hardened in this checkpoint**
1. **Product architecture** — full-screen workspace; person, period and included activity are first-class context. The current overlay container is explicitly transitional; deep-link/browser-history routing is not claimed complete.
2. **Overview intelligence** — deterministic narrative, dated-activity metrics, portfolio-relationship metrics and source-quality status. Metrics now carry known / unknown / partial state so failed retrieval can never render as numeric zero.
3. **Timeline** — month-grouped chronology for on-call, rotations and shared milestones, with person-specific records visibly separated from shared study/project events and direct record navigation where supported.
4. **Portfolio** — resident assignments, formal supervision, research, innovation and programme coordination remain semantically distinct.
5. **Evidence** — retrieval state, relevant-record counts, checked time, provenance and information caveats are first-class UI. “Source coverage” has been replaced by retrieval evidence; successful retrieval is never presented as institutional completeness.
6. **Document** — offline HTML / Print-to-PDF remains a renderer of the same permission-scoped model; resident assignments, formal supervision and source evidence are represented explicitly rather than collapsed into a generic rotation section.
7. **Contextual integration** — Staff and Grounded can open the same workspace. The deterministic snapshot is now also exposed as the semantic READ capability `reporting.personal_activity_snapshot`; handoff includes resident assignments, caveats, source timestamps and explicit truncation metadata.
8. **Visual hardening** — crisp full-screen shell, searchable staff filtering, retained last-good snapshot during refresh, stale-scope state, semantic tabs, mobile Grounded access, larger minimum typography, no haze/backdrop blur and truthful empty/loading/error treatment.

**Hardening corrections after implementation audit**
- unknown source state is distinct from a known zero; UI and document use an em dash / explicit unknown copy rather than `0`;
- rotations retrieval deliberately includes `terminated_early` records, but a planned span is never presented as completed activity without an explicit actual termination date;
- research/project dates describe the study/project record, not the person’s participation interval unless a personal interval is explicitly stored;
- successful endpoint retrieval is described as retrieval evidence, never “100% complete work”;
- exact record references are preserved and can navigate to underlying records/modules where the current application exposes a read surface;
- the last completed snapshot stays visible while a changed scope is refreshed; failed refresh does not erase prior evidence.

**Semantic invariants**
- dated activity is not conflated with persistent professional relationships;
- a shared study/project milestone does not establish personal ownership;
- unavailable/restricted sources are never converted to zero activity;
- the Personal Activity model remains deterministic and permission-scoped;
- Grounded receives this model as context but does not become a second truth store.

**Still next**
- live authenticated browser validation and print review of the hardened state model;
- operational UI consistency across On-call, Leave, Rotations and Staff;
- staged Knowledge Layer / Grounded READ adoption with output-equivalence evals.

---

## Implementation checkpoint — V46.13 (2026-09-21)

### Personal Activity becomes Portfolio Intelligence
The existing permission-scoped personal-activity snapshot is now a first-class **Reporting / structured-output capability**, not merely an export dialog. A single verified model powers Overview, Timeline, Portfolio, Sources and the offline formal Document.

**Implemented now**
- explicit-person, explicit-period snapshot;
- permission-aware independent source retrieval;
- structured summary over duties, rotations, research, innovation and programme roles;
- interactive timeline and portfolio views;
- provenance/source-health view;
- formal offline HTML / Print-to-PDF generated from the same model;
- truthfulness invariant: unavailable/restricted source != zero activity.

**Architectural significance**
This is a concrete implementation of §9 Structured Outputs: UI and document are two renderers over the same permission-scoped record model. It also establishes the Reporting capability without requiring a separate agent or LLM.

**Still next**
1. Continue migrating legacy Grounded read builders behind semantic capabilities / Knowledge Objects.
2. Consider Knowledge Layer adoption for Personal Activity behind an eval-guarded feature flag; output must remain identical before switching.
3. Extend Portfolio Intelligence only when source semantics are explicit (e.g. publications, teaching, grants), never by inference.

---
## 0. The one idea everything else derives from

> **The operating system defines the knowledge model. The knowledge model defines the data model. Storage is the last decision, not the first.**

Most healthcare software is built bottom-up: database → API → UI → (bolt on an AI chatbot). DepartmentOS inverts this. We design *what the department knows and does* first, express it as a **Canonical Knowledge Model**, and let storage, APIs, and interfaces derive from it.

Consequence: the chat interface is **one client**. A dashboard is another. Mobile, voice, a future model — all clients of the same knowledge model. That is the line between an *application* (competes on features) and a *platform* (shapes how future systems are built).

This document is organized around that inversion, top to bottom:

```
                        User intent
                             │
          ┌──────────────────┼──────────────────┐
          ▼                  ▼                  ▼
      Chat client      Dashboard client    Voice / mobile / API
          └──────────────────┼──────────────────┘
                             ▼
                     SEMANTIC LAYER          ← language → knowledge entities
                             ▼
                     INTENT ENGINE           ← what does the user want to accomplish
                             ▼
                     TASK PLANNER            ← which agents, in what order
                             ▼
        ┌──────────────┬─────┴──────┬──────────────┐
        ▼              ▼            ▼              ▼
   Workforce       Operations    Research       Policy
     Agent           Agent        Agent          Agent      (+ Reporting, Comms, Analytics)
        └──────────────┴─────┬──────┴──────────────┘
                             ▼
              CANONICAL KNOWLEDGE LAYER        ← Knowledge Objects, not tables
                             ▼
        ┌──────────────┬─────┴──────┬──────────────┐
        ▼              ▼            ▼              ▼
     Postgres      Vector store   Files/docs   External (EHR, calendar, email)
   (live today)   (Phase 2+)     (Phase 2+)     (later)
```

Everything below is a layer in this diagram, described as: **what it is**, **what exists today**, **what's buildable now without a runtime model**, and **what waits on the model/infrastructure**.

---

## 1. The Canonical Department Knowledge Model (CDKM)

**The first artifact. Everything derives from it.**

Instead of tables (`staff`, `leave`, `rota`, `trials`), the department is modeled as a small set of **Knowledge Objects**. Every object — a person, an on-call shift, a trial, a policy — shares one base shape:

### 1.1 The Knowledge Object (base type)

```
KnowledgeObject
  id            — stable unique identifier
  type          — Person | Activity | Resource | Policy | Event | Document | Task | Relationship
  attributes    — type-specific fields (the clinical detail)
  relationships — typed links to other objects  (supervises, assigned_to, governs, …)
  evidence      — which source records back this object  (provenance)
  owner         — who is responsible for it
  permissions   — who may read / propose / act
  status        — active | draft | archived | proposed
  history       — append-only change record
  metadata      — timestamps, confidence, source system
```

Agents never learn 30 schemas. They learn **this one shape** plus the eight canonical types below.

### 1.2 The eight canonical types (this department, named to generalize)

| Knowledge Object | In pneumology today | Maps onto live table(s) |
|---|---|---|
| **Person** | attending, resident, PI, dept head | `medical_staff`, `user_permissions` |
| **Activity** | on-call shift, rotation, clinic, procedure, meeting | `on_call_schedule`, `resident_rotations` |
| **Resource** | training unit, equipment, room, bed | `training_units` |
| **Policy** | SOP, credential rule, staffing rule, governance | *(not yet stored — new)* |
| **Event** | leave approved, conflict detected, cert expired | `staff_absence`, `audit_log` |
| **Document** | trial protocol, research line, publication, announcement | `clinical_trials`, `research_lines`, `department_announcements`, `news_posts` |
| **Task** | "prepare Friday rota", "notify clinicians" | *(not yet stored — new)* |
| **Relationship** | supervises, PI-of, member-of, covers-for | *(implicit in FKs today — made explicit)* |

**Why this matters:** the seams for radiology / ICU / finance are *already cut*. Phase 2 doesn't rewrite the system — it extends this model. But we build it as pneumology first, so the abstraction is **extracted from reality, not guessed on a blank page.**

### 1.3 The discipline that makes it real (cheap now, priceless later)

- Build pneumology-specific, but **name in canonical terms.** A staff member is a `Person` that has clinical attributes — not a bare `staff` row.
- Keep `attributes` (domain-specific) separate from the base shape (universal).
- Every object carries `evidence` from day one — provenance is not a Phase-3 feature, it's the base type.

---

## 2. The Canonical Knowledge Layer

**What it is:** the single interface every agent and client talks to. No agent ever touches Postgres directly. It asks the knowledge layer for *Knowledge Objects*, filtered by intent and permission.

**Why the separation is non-negotiable:** it's what buys maintainability, testing, security, explainability, and — the big one — **replaceable storage.** Postgres today; add a vector store for documents in Phase 2; swap in OMOP or a graph DB later. Agents never notice, because they speak Knowledge Objects, not SQL.

**What exists today (V46.9):** the Node/Express API over Supabase plus an adopted in-app Knowledge Layer for `Person`, `Activity`, and `Event`. Selected live builders already use the canonical objects behind `USE_KNOWLEDGE_LAYER`; other capabilities still read the operational arrays directly. The migration is therefore real but incomplete.

**Buildable now (no model):**
- A **knowledge adapter** in the backend: read functions that return canonical Knowledge Objects assembled from the existing tables (`getPerson(id)` joins `medical_staff` + permissions + relationships into one `Person` object with evidence).
- **Permission-aware retrieval** baked in: the layer never returns an object the caller can't see. (Your RLS already does half of this.)
- **Provenance**: every returned object names its source records.

**Waits on infrastructure:** vector store for semantic document retrieval (protocols, SOPs, minutes). Not needed for structured data (staff, rota, trials) — that's pure Postgres and works now.

---

## 3. The Semantic Layer

**What it is:** the translator from human language to knowledge entities. Before the planner does anything, "Pedro / tomorrow / bronchoscopy clinic" must resolve to `Person(Pedro Marcos, 0.99)`, `Date(2026-08-03)`, `Activity(Procedure Clinic, subtype=Bronchoscopy)`.

**What exists today — and this is the honest bridge:** the current agent's resolver *is* a primitive semantic layer. Fuzzy name matching ("antello"→Antelo), the scored routing table, the concept/synonym brain, clarification when ambiguous — that's entity resolution. It's rule-based and deterministic, but it's the right *shape*.

**Buildable now (no model):**
- Promote the existing resolver into an explicit **Semantic Layer module**: entity resolution (people, dates, activities, resources) as a first-class step that returns typed entities with confidence.
- The **Teach/Brain** we just built feeds this directly — the department teaches the semantic layer its own vocabulary ("de guardia" → on-call). That already exists and persists.

**Waits on the model:** truly open-ended language understanding — paraphrases nobody taught, novel compound requests. The deterministic layer handles the department's real vocabulary well (and grows via Teach); the model handles the long tail. **This is the first place a runtime model bolts on.**

---

## 4. Intent Engine

**What it is:** determines *what the user wants to accomplish*, not which module they need. "Prepare tomorrow's rota" is an intent, not a page.

**What exists today:** the scored intent router (27 intents, 100% on eval, confidence-scored, brain-backed). This is a real, working intent engine — for **retrieval intents.**

**Buildable now:** expand the intent taxonomy from "questions" to "goals" — add intents that describe *work to be done* (prepare, draft, generate, reconcile), still routed deterministically where the goal is well-defined.

**Waits on the model:** decomposing a genuinely novel goal into sub-goals. Deterministic routing covers the known goals; the model covers "I've never seen this phrasing but I can infer the goal."

---

## 5. Task Planner + Agent Orchestration

**What it is:** for a goal that needs several capabilities, decide *which agents run, in what order, and how their evidence merges.*

> "Who should replace Dr. Garcia tomorrow?"
> Planner → Workforce Agent (who's qualified + available) + Operations Agent (what's the coverage gap) + Policy Agent (is the replacement compliant) → merge → one explained recommendation with confidence.

**The specialist agents** (each: one responsibility, reasons over Knowledge Objects, never touches SQL):

| Agent | Owns | Status today |
|---|---|---|
| **Workforce** | staff, competencies, leave, workload, availability, rotations | *builders exist (on-call, leave, rank, unsupervised) — not yet an "agent"* |
| **Operations** | daily ops, scheduling, clinics, procedures, bottlenecks | *partial (units-at-capacity, coverage gaps)* |
| **Research** | cohorts, studies, recruitment, eligibility, publications | *builders exist (trials, PI, research lines)* |
| **Policy** | SOPs, credential checks, compliance, governance | **not built — needs Policy objects (§1.2)** |
| **Reporting** | KPIs, dashboards, briefings | *briefing exists; KPIs partial* |
| **Communication** | emails, summaries, notifications, announcements | *draft-email exists* |
| **Analytics** | trends, workload analysis, forecasting | *not built* |

**What exists today (V46.9):** Grounded remains one orchestrator. The deterministic builders are proto-capabilities of Workforce/Operations/Research, while `grounded-core.js` now supplies a semantic tool registry and bounded-plan contract. Clinical Units and On-call have registered domain tools; the rest of the legacy engine is being migrated incrementally.

**Buildable now (no model):** refactor the builders into **named capability modules** grouped by agent, behind the knowledge layer. A *rule-based planner* for known multi-agent goals (the replacement-recommendation flow is deterministic: qualified ∩ available ∩ compliant). This gets you real orchestration for the goals that matter most, today.

**Waits on the model:** open-ended planning — novel goals decomposed on the fly, agents whose reasoning is synthesis rather than computation. **This is the deepest model-dependent layer.** The honest line: *deterministic planning for known workflows now; model-driven planning for the long tail later.*

---

## 6. Read → Write → Act (the maturity ladder)

The single most important sequencing idea. The system earns trust one level at a time.

| Level | Does | Examples | Status |
|---|---|---|---|
| **1 · READ** | retrieves verified info | who's on call, COPD workload, find Marcos | **✅ built, 100% eval** |
| **2 · WRITE / PROPOSE** | prepares reviewable work | draft rota, leave/on-call/rotation proposals, reports | **✅ strong** — structured proposals are established |
| **3 · ACT** | performs *approved* actions | schedule on-call, record leave, assign/cancel rotations | **◑ partial** — confirmation UI exists; On-call is migrated to guarded WRITE tools in V46.9, other write paths follow |

**Everything at Level 2 is proposed, never committed. Every Level 3 action requires explicit permission and is logged.** This ladder is how the platform stays trusted while growing teeth.

---

## 7. Safety, Provenance, Trust (first-class, not bolted on)

The vision's real thesis: *the goal is not the smartest AI — it's the most trusted operational intelligence.* Every architectural choice serves that.

- **Retrieval-first, always.** The model is an interpreter; the department data is the authority. No answer is ungrounded. *(Built: the current agent never fabricates — it answers from records or says it can't.)*
- **Explainable by default** — every answer carries: *what / why / based on what / can I trust it.* *(Built: sources, confidence meter, reasoning trace.)*
- **Confidence is explainable**, tied to real signals — data completeness, source freshness, match strength. *(Partial: confidence exists; making it signal-derived is a Phase-2 item on the list.)*
- **The three-tier action model:** Inform (read-only, instant) · Recommend (proposes, human reviews) · Execute (requires approval). Nothing critical happens silently.
- **Audit trail + execution traces** — operational changes feed the timeline/audit pattern, while the Grounded harness records context, semantic tool calls, permission blocks, latency and outcomes. No hidden reasoning is persisted.

---

## 8. Operational Memory + Event-Driven Intelligence

The two ideas that turn a reactive tool into a proactive department.

**Operational Memory** — not chat history. *Department state that persists.* Monday: Garcia's leave approved. Tuesday: the system already knows Garcia is unavailable — no re-explaining. This is Knowledge Objects with `status` + `history` (already in the base type §1.1) queried by time.

**Event-Driven Intelligence** — the system observes instead of waiting:
```
Leave approved → Coverage agent runs → Conflict detected → Replacement proposed → Supervisor notified
```
*(Foundational piece already exists: the scan engine that surfaces conflicts/gaps proactively in the digest. Event-triggering is the extension.)*

**Buildable now:** memory (it's just querying Knowledge Objects by status/time). **Waits on infrastructure:** true event triggers (webhooks/db-triggers → agent runs) and the notification pipeline.

---

## 9. Structured Outputs (the quiet keystone)

Agents never return only text. Every response is a **structured object**:
```json
{ "type": "daily_briefing", "status": "healthy", "staff_available": 22,
  "coverage": "complete", "alerts": [], "recommendations": ["Prepare Friday rota"],
  "confidence": 0.98, "evidence": ["staff_records","leave_records"] }
```
The UI *renders* these objects. This is why the same logic serves chat, dashboard, mobile, voice, API — **without changing agent logic.** *(Partial today: comparison bars, confidence, follow-ups are already structured visuals — the pattern is proven; it needs to become universal.)*

---

## 10. Engineering principles (the non-negotiables)

Retrieval-first · Explainable · Modular · Event-driven · Observable · Auditable · Secure · Human-supervised · Vendor-independent · API-first.

**The load-bearing one:** *Large language models are replaceable. Architecture is not.* Every decision protects the architecture's independence from any specific model.

---

## 11. The integrated roadmap (every phase, honestly sequenced)

This is the whole thing — not Phase 1 in isolation, but the complete arc with each stage's real dependency named.

### Phase 1 — The best Pneumology Department OS in the world *(now → mostly no model)*
The foundation, on the live system, named in canonical terms.
1. **Author the CDKM** (§1) as a real spec, mapped to the live tables. *(This document is the draft.)*
2. **Knowledge adapter** (§2): **◑ advancing** — Person/Activity/Event objects are adopted in selected live builders; exclusive backend canonical retrieval is still pending.
3. **Semantic Layer module** (§3): **◑ advanced deterministic layer exists** — entity/date resolution, ambiguity handling and Teach/Brain vocabulary are live; modular extraction continues.
4. **Capability modules** (§5): **◑ started** — semantic tool adapters now exist for Clinical Units and On-call; broad legacy builders still need decomposition.
5. **Level 2/3 actions** (§6): **◑ beyond original target** — structured proposals and human-confirmed writes exist; migrate every write path onto guarded semantic tools.
6. **Structured outputs everywhere** (§9) + **confidence from real signals** (§7): **◑ pattern proven, not universal**.
7. **Harden trust**: **◑ active** — permission-aware tools, Grounded traces, proposals and operational timeline exist; canonical provenance and universal tool migration continue.

*All of Phase 1 is buildable deterministically. The current 100%-eval engine + the live DB + the Brain are the starting capital.*

### Phase 2 — Generalize the Knowledge Model *(the abstraction, earned)*
Extract Person/Activity/Resource/Policy/Event/Document/Task from what Phase 1 revealed. Add the **vector store** for document retrieval (protocols, SOPs, minutes). Add the **Policy agent** (needs Policy objects). Now the platform is department-independent *in structure*.

### Phase 3 — The reasoning layer bolts on *(needs a runtime model)*
Where the model attaches, exactly as mapped in §3–5: open-ended semantic understanding, novel-goal planning, agents whose output is synthesis. **Self-critique** (agent checks its answer against retrieved evidence before returning). This is the "near-Claude-level" step — and it's an *addition* to a working system, not a rewrite, *because* the architecture was model-independent.

### Phase 4 — Level 3 ACT + Event-Driven *(needs write-scopes + triggers + infra)*
Approved actions execute. Events trigger agents. The department becomes proactive. Full operational timeline.

### Phase 5 — Beyond one department *(the platform realized)*
Radiology, ICU, emergency, then non-clinical (HR, finance, logistics). Each is *extending the knowledge model*, not rebuilding. The reference architecture for intent-driven enterprise systems.

---

## 12. The honest constraints (so nothing surprises us)

1. **The reasoning layer (Phase 3) needs a runtime model.** The semantic long-tail, novel-goal planning, and synthesis-agents cannot be faked deterministically. Everything *up to* that line is buildable now; that line is where the model becomes mandatory. We build to the line, cleanly, so the model plugs in rather than forcing a rewrite.
2. **It's a live clinical system.** We're refactoring a running department 65 people depend on — not greenfield. Every change is additive or migration-pathed. The knowledge layer is introduced *alongside* the current API, not by breaking it.
3. **Storage independence is a discipline, not a library.** It only stays true if agents *never* reach past the knowledge layer. The moment one agent runs raw SQL, the property is lost. This must be enforced, not hoped for.
4. **Scope discipline is the survival condition.** The vision's own warning: broad projects die unfinished. The roadmap is layered precisely so there is always a *working, trusted system* at every stage — never a half-built abstraction with nothing running.

---

## 13. What this is, in one line

**A retrieval-first, agent-orchestrated operating layer that turns verified departmental knowledge into explainable decisions, proactive intelligence, and controlled action through natural language — built as one perfect department first, and a reference architecture by extension.**

The lasting contribution isn't the AI. It's the knowledge architecture that makes the AI replaceable and the platform durable.


---

## Architecture change log

### V46.9 — Grounded Action Integrity

- Declared V46.8 as the canonical architecture baseline for this migration.
- Migrated On-call scheduling onto semantic READ/PROPOSE/WRITE tools.
- Added write-safe ambiguity handling and session-only pending action state.
- Added explicit on-call eligibility and slot checks.
- Added commit-time revalidation to prevent stale proposals from being written.
- Reused the proposal confirmation UI as the human approval gate.
- Reused a single execution trace from proposal through confirmed action instead of creating disconnected observability records.
- Corrected the architecture maturity ladder: ACT is partial/real, not “not started.”
- Set **Leave Action Integrity** as the next migration, followed by Resident Rotations.
- Established this file as a required artifact in every future complete release package.
**Phase 4 automated validation:** the complete historical suite remains green and the Phase 4 contract now includes accessibility/promotion hardening. Production acceptance is still gated by the four-profile authenticated comparison.


### V46.14 Grounded Phase 4.1E — On-call temporal precision
Grounded now separates named current-state on-call questions, named schedule questions, next-duty questions and department-wide roster requests. Broad roster queries no longer inherit Person context; roster presentation converges on the Phase 4 compact collection scope without changing the surrounding neumDesk UI.


## V46.14 Access Gate 4.2 — Session integrity

Authenticated-browser review identified that the login gate validated the backend correctly but persisted every JWT in `localStorage`, independent of the “Remember my email” choice. Access Gate 4.2 makes normal sessions tab-scoped, introduces explicit bounded trusted-browser persistence, and requires deliberate resume before a trusted session from a new browser session reveals departmental records. Legacy unbounded localStorage sessions are invalidated once after deployment. The backend `/api/auth/me` remains authoritative. This checkpoint does not alter permissions, domain logic, Grounded, Staff or the schema.

### V46.14 Access Gate 4.4 — Identity and login polish

The public/editorial access surface uses the supplied neumact identity while neumDesk remains the authenticated departmental workspace. Access Gate 4.4 adds no permission or data-model behavior. It refines the sign-in hierarchy, separates low-risk email memory from explicit trusted-browser security, presents typed authentication failures, hardens field-level interaction details and adds a reduced-motion-aware final workspace handoff.

---

## Implementation checkpoint — V46.14 Phase 5.0 Temporal Integrity Foundation

Operational time is now a first-class knowledge contract. Grounded uses the shared deterministic `temporal50.js` interpreter rather than an early-return date parser. Leave, rotations and on-call apply different domain policies instead of sharing the same implicit `end || start` behavior.

The persistence model now separates planned time from actual/effective time for resident rotations and staff absences. Early rotation termination stores an explicit actual end; early return from leave preserves the planned end and stores actual return separately. Legacy records are never backfilled from `updated_at`/`last_updated` because system-write time is not proof of real-world effective time.

Portfolio Intelligence consumes explicit actual dates where available and continues to expose unresolved historical gaps instead of inventing completed activity. The Rotations UI now provides a reconciliation path for terminated-early records with unknown actual end dates.

This temporal foundation precedes Phase 5 Operational Decision Intelligence: constraints, warnings, override policy and recommendations must reason over temporally correct records.
