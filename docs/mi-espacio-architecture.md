# neumDESK — Mi espacio
## Product and technical architecture · v0.3 (design contract + implementation log)

**Status:** Architecture proposal with partial implementation through Phase 23  
**Date:** 2026-10-13 (updated)  
**Application:** neumDESK (internal departmental platform)  
**Owner of record:** To be agreed by the department  
**Scope:** One authenticated, personalized **view inside the existing Vue application**  
**Companion workstreams:** Identity & permissions, Guardias/rotations, Research & Research Library, spreadsheet synchronization, Grounded  
**Sequencing:** Deliver Mi espacio and verified identity-to-activity mapping first; conduct a *separate*, limited Guardias integration feasibility assessment in parallel. The synchronization policy and optional bidirectional gate are specified in §17.  
**Source baseline:** Code inspection of `Baraka124/neumAC-manage-Frontend-end` and `Baraka124/neumAC-manage-back-end`, current `main` during the architecture review. A repository inspection is not an authenticated production/browser certification.

---

## 1. Product decision

**Mi espacio** is the navigation label. **Mi actividad profesional** is the principal heading. **Mi perfil** is a subordinate profile-management area.

Mi espacio is **not a separate application**, standalone HTML site, new login experience, parallel database, replacement for the existing Overview, or second implementation of existing departmental modules.

It is a first-class, persistently navigable view of the **same** neumDESK single-page application. An authenticated person selects **Mi espacio** in the existing navigation; the central content region renders a personalized workspace. The institutional sidebar, top bar, Grounded entry point, capabilities, records, and existing modules remain available.

### Intended value
- Bring together the authenticated person's profile, upcoming duties, rotations, authorized absence information, clinical assignments, research affiliations, studies, innovation projects, publications and actionable requests.
- Enable permitted self-service changes and directed correction requests.
- Navigate to the *original* departmental records for further work, preserving a meaningful return route.
- Make the relationship between people and institutional records explicit, accurate, governable and useful.
- Provide a natural starting point for future Grounded questions about **my** verified activity, and later synchronization-driven updates.

**North star:** A staff member can log in, recognize their own verified professional context, see what requires attention, and act within their authority—without hunting across unrelated modules.

### Out of scope
- A second app or frontend technology migration.
- Treating full two-way spreadsheet synchronization as a requirement or prerequisite for Mi espacio.
- Duplicating Guardias, Research, Publications or Staff records in Mi espacio tables.
- Free-form self-assignment to studies, project roles, authorship or guardias.
- Publishing private profile changes to neumact.org without the existing governance/approval process.
- Personnel surveillance, productivity ranking or invented performance scores.
- Patient-level clinical data in the personal workspace.
- Claiming that blank days mean a person is available, or that a shared project milestone is their personal task.

---

## 2. Verified current-system foundations

| Area | Observed implementation | Reuse / implication |
| --- | --- | --- |
| Frontend runtime | Vue 3 SPA loaded by browser scripts, with one root app mounted on `#app`; no build-required SFC pipeline | Register a dedicated feature component; retain current shell and loading architecture |
| View selection | `currentView`, `switchView(view, filters)`, `VIEW_TITLES`, and `NeumAccess.canOpenView()` | Integrate `mi_espacio` as one more authorized view |
| Navigation | Sidebar, mobile navigation, top header, scroll/focus helpers, cross-module workflows | Add an obvious entry point without replacing existing modules |
| Sign-in identity | `/api/auth/login`, `/api/auth/me`, `app_users.medical_staff_id`, `linked_staff` | Derive identity from authenticated server session; never resolve by guessed name or email |
| Access model | Backend capabilities + own/department/all scopes; projection safeguards | Server must apply view and record permissions; UI affordances are supplementary |
| Staff profile | Existing profile drawer with overview/work/schedule/research/profile; self-profile editor in frontend `access.js` | Reuse validated field editing, correct inconsistent account-profile workflow |
| Activity intelligence | `activity45.js` and the Personal Activity overlay/report with source coverage | Reuse tested data-normalization/evidence concepts; do **not** use its selected-person/report modal as Mi espacio |
| Operations | Guardias, rotations and absence endpoints and staff identity references | Aggregate an individually scoped agenda |
| Research | Clinical studies/projects/lines, PI/lead/coordinator and various collaborator links | Define verified participation separately from ownership/permissions |
| Publications | `news_posts` with author IDs and free-text author lists | Author attribution requires structured verified membership, not surname matching |
| Testing | Playwright/integrity tests and existing research navigation acceptance debt | Add role-aware mounted Vue and API authorization tests |

**Specific code anchors (subject to line movement):**
- Frontend `app.js`: `useAuth()`, `useUI()`, `openEntryWorkspace()`, `switchView()`, `activity45Open()`, `activity45OpenRecord()`, root `app.component()` registrations.
- Frontend `index.html`: sidebar navigation, `.content-area` and existing `v-if="currentView === ..."` view containers, mobile bottom navigation.
- Frontend `access.js`: `canOpenView()`, `createSelfProfile()`, capability-aware controls.
- Backend `index.js`: `authenticateToken`, `/api/auth/me`, `/api/oncall`, `/api/medical-staff/:id`, `/api/clinical-trials`, `/api/absence-records`.
- Backend `portfolio.js`: scoped research reads/ownership decisions and field projections.

**Pre-existing caveat:** The current frontend account profile `saveUserProfile()` updates browser-side user/session state but does not, in that inspected path, persist changes to the backend before displaying success. A separate self-profile form does invoke `PUT /api/medical-staff/:id`. The new view must unify or clearly distinguish those behaviors and must never claim a successful persistence operation without server confirmation.

---

## 3. Core invariants

1. **One app:** Mi espacio is rendered inside the existing authenticated neumDESK shell, never a separate origin/site or sign-in.
2. **One source of truth per record:** Operational and research records stay with their owning modules/database entities.
3. **Identity from session:** Resolve `app_users.id` and `medical_staff_id` on the server; never trust a user-supplied staff ID for `/api/me/*`.
4. **Participation is not ownership:** Being associated with a study does not grant study editing rights. Association and authorization are separately evaluated.
5. **Source-aware truth:** Distinguish zero known records from unavailable, restricted, incomplete or unsynchronized sources.
6. **No silent overwrites:** Writes are permission-checked, validated, concurrency-aware where appropriate, and audited.
7. **No false completion:** A profile edit counts as saved only after backend persistence succeeds, followed by updated verified UI state.
8. **No misleading schedule semantics:** A rotation period does not prove daily attendance; a blank date does not prove availability.
9. **Safe transitions:** Navigation preserves record/context/return location; unsaved work is guarded.
10. **Account isolation:** Changing user, logging out, losing permissions or revoking the session clears cached private context; stale responses cannot appear under another person's identity.

---

## 4. Functional information architecture

### Top-level view: Mi espacio / Mi actividad profesional

**Primary areas** (progressively enabled when source and authority are ready):

| Area | Content | Actions | Authoritative source |
| --- | --- | --- | --- |
| Overview | Identity summary; relevant next events; verified current involvement; pending requests; source state | Open an item; navigate | Composed, permission-scoped summary |
| Mi perfil | Professional identity, permitted contact details, biography, photo; institutional metadata | Edit allowed fields; request correction for governed fields | `app_users`, `medical_staff` |
| Mi agenda | Upcoming guardias, rotations, permitted absences, time-bounded institutional commitments | Open corresponding source; request correction | Existing operational modules |
| Mi investigación | Verified studies, innovation projects, research lines; role and status | Open source record; permitted update in source; report missing affiliation | Existing research records and memberships |
| Mis publicaciones | Verifiably associated papers/outputs, DOI and publication metadata | Open Research Library; request authorship correction | Research Library plus verified author relation |
| Mis solicitudes | Profile/data corrections and other user-initiated governed requests | Submit, inspect status, withdraw when permitted | Proposed correction-request workflow |
| Preferencias | Personal view order and permitted notifications | Save preferences | New minimally scoped user preferences |

**Not every area must appear for every account.** Hide unavailable workstreams only when their absence is understood and intentionally designed; otherwise show a clear "not linked / unavailable / restricted" explanation. A user may have multiple roles (e.g., clinician + project investigator + supervisor) without switching account.

### Example first-screen content
- Who am I? Verified name, position/affiliation, and staff-link status.
- What is next? Nearest **confirmed** relevant guardia or rotation; explicit date and source.
- What am I involved in? Verified project/study membership with documented role.
- What can I do? Meaningful personal edits and pending correction requests.
- Where did this come from? A nonintrusive source freshness/status indicator.

Avoid default grids of arbitrary KPIs or a purely decorative dashboard.

---

## 5. Identity resolution and account lifecycle

### Authentication flow
1. The user authenticates with existing neumDESK sign-in.
2. The existing backend validates session/token and account status.
3. `/api/auth/me` returns an authenticated account with the linked staff ID when available.
4. Mi espacio calls a proposed server endpoint `GET /api/me/context`; the backend **re-resolves** the current user from its validated session and staff association.
5. The backend returns safe identity and capability information, without exposing other people's profiles.
6. Independent data sections load using server-derived staff identity and module-specific authorization.
7. Any account switch/logout/permission change invalidates or resets personal state and pending requests.

**Never** use `currentUser.full_name`, `email`, text-author matches or a query parameter as authority to choose another person's data.

### Identity states
- **active + linked + valid:** Render personal workspace.
- **active + unlinked:** Show account-level Mi perfil and a clear "professional profile not linked" state; offer authorized support/verification, not automatic name matching.
- **linked but inactive/deleted/mismatched department:** Do not silently show another or inactive person's records; request administrative resolution.
- **limited capabilities:** Render only allowed sections/fields; explain withheld or unavailable sections without leaking counts.
- **suspended/revoked/expired:** Follow existing authentication gate, clear any personal state.
- **administrator test session:** Use the test-session identity and permission boundaries as enforced by the backend; prominently distinguish a test context and do not allow unintended writes.

**Ownership decision:** `medical_staff_id` is the professional-identity linkage; a login account and staff record are different entities. Administrative linking remains governed.

---

## 6. Verified professional relationships

Create a **person-activity projection** that maps one staff ID to records via explicit persisted IDs. It must return the **association role**, source record ID, status, dates and provenance, separately from edit permissions.

| Domain | Existing relationship evidence | Coverage limitation / action |
| --- | --- | --- |
| Guardias | `primary_physician_id`, `backup_physician_id`, `resident_physician_id` | Filter by actual assignment; respect revisions and source sync status |
| Rotations | `resident_id`, `supervising_attending_id` | Distinguish resident assignment from supervising responsibility |
| Absences | `staff_member_id` | Only return fields permitted for "own"; do not expose sensitive reasons in summary by default |
| Clinical units | Unit assignments/supervisor roles, where verified | Reuse existing unit/staff relation rather than deriving from department alone |
| Research lines | `coordinator_id` plus `research_line_members` where present | Include explicit members; do not assume every staff member in a line owns its projects |
| Clinical studies | PI ID, co/sub-investigator IDs, data-manager or verified study-membership records | Consolidate association sources and validate IDs; not only PI |
| Innovation | Lead and co-investigator/membership records | Include verified supporting researchers while separating ownership |
| Publications | `author_id`, `authors_text`, DOI and publication metadata | `author_id` alone is insufficient for multiple authors; **do not** infer verified authorship from surname |
| Grounded | Authenticated subject + authorized information | Constrain context to session and existing permissions; never elevate via conversational text |

**Proposed normalized association contract:** `{ staff_id, resource_type, resource_id, relation_type, source, verified, valid_from, valid_to }`. This is a *logical interface*, not permission to create a new universal membership table immediately. First inventory existing schema, membership endpoints and migration history; add new persisted relationships only when a specific gap is proven.

### Data quality rules
- Deduplicate records linked through multiple roles while retaining every verified role.
- Preserve published spelling/name variants, ORCID where available, and publication authorship evidence without guessing.
- Avoid inferring a personal to-do from a shared milestone lacking an explicit assignee.
- Distinguish **not found**, **not authorized**, **not yet connected**, and **source failed** internally; user-facing wording must respect privacy.
- Do not advertise "all my projects" when source coverage is incomplete; say which sources were verified.

---

## 7. Self-service versus governed changes

| Category | Examples | Proposed handling |
| --- | --- | --- |
| Direct self-service | Public/professional biography, approved contact fields, personal layout preferences | Server-backed validation and write under own-profile policy |
| Governed profile changes | Formal title, staff type, department association, institutional name, professional role | Submit a correction request or use approved administrative workflow |
| Operational assignments | Guardias, rotations, leave approvals | Use existing module's authorized action or a governed request; never grant automatic edit because it concerns the user |
| Research affiliation | Add/remove participation, PI/lead, supervisor or collaborator roles | Coordinator/editor approval, traceable membership changes |
| Publication authorship | Claim missing paper or correct contributor association | Verification using bibliographic evidence; update authoritative record |
| Public website data | Public bio/photo/research profile | Explicit publication/governance path; internal edit is not automatic public release |

**Existing backend path:** `PUT /api/medical-staff/:id` already has an own-scope validated subset for professional email, mobile phone and biography. Integrate deliberately with this path; verify whether e-mail edits affect login identity, reauthentication, and notifications. Do not merely clone or wrap the existing browser-only "save" behavior.

**Minimum save contract:** field-level validation; source/version check where necessary; UI loading state; server confirmation; refetch/verified returned data; understandable error/partial-success treatment; audit log. Never update login email or institutional credentials optimistically.

---

## 8. Personal agenda contract

The agenda combines records; it does **not** invent additional schedule ownership.

- **On-call:** assignment role, date, confirmed status, relevant times and source.
- **Rotation:** period, resident/supervisor role, training unit, status, source.
- **Absence:** permissible own-view period/status, with sensitive details excluded from overview.
- **Research dates:** include only verified personal assignments; shared project milestones must be labelled "shared" and not treated as a person's appointment.
- **Source synchronization:** record last validation time and pending/conflicted state. A spreadsheet edit should not be shown as a confirmed assignment before it has passed the existing authorization and operational checks. Stage A sync is **one-way inbound only**, conditional on approved access; the operational database remains the governed record that users see (see §17).
- **Calendar semantics:** timezone and all-day/date-only handling are explicit; mobile agenda/list can substitute for a dense grid.

Future spreadsheet integration updates underlying Guardias records, which then feed **both** the institutional Guardias view and Mi agenda. Mi espacio never writes straight to a spreadsheet.

---

## 9. Frontend integration design

### Required choice
Follow the **current browser-loaded Vue component approach**. Do not introduce a standalone `mi-espacio.html`, a parallel SPA, a new login or an immediate migration to Vue SFCs/Vite/router solely for this view.

### Proposed feature directory
```text
mi-espacio/
  mi-espacio.js            # Vue component creation/registration factory
  mi-espacio.css           # Scoped, responsive presentation
  mi-espacio-data.js       # API adapter, normalization, source states
  components/              # Add only when subviews justify extraction
  tests/                   # Pure logic tests plus mounted interaction tests
docs/
  mi-espacio-architecture.md
```

Integration touchpoints:
- `index.html`: load feature files after shared dependencies; mount component in the existing `.content-area` with `v-if="currentView === 'mi_espacio'"`. Keep authentication shell intact.
- `app.js`: register the component before `app.mount('#app')`, add a `VIEW_TITLES.mi_espacio` entry, enable `switchView('mi_espacio')`, bind current authenticated context.
- `access.js`: register a deliberate `mi_espacio` navigation rule based on authenticated account access; individual sections/actions still require canonical backend permissions.
- Sidebar: visible `Mi espacio` entry near Overview, including selected state/collapsed label; ensure mobile navigation makes it reachable without hiding institutional modules.
- Grounded: retain same global entry point, optionally pass a compact, permission-scoped `my_workspace` context when explicitly used.

### Lifecycle
- Lazy-load personal data when entering the view (not on the public/login page).
- Clear or invalidate on logout, account switch, session revocation or capability change.
- Use `AbortController`/request sequence and user-ID checks to ignore stale responses.
- Render each data section independently; an unavailable publication source cannot blank the entire view.
- Avoid reloading the entire app on a successful profile edit.
- Use existing design tokens, typography, focus/scroll and responsive conventions. Scope new CSS under `.mi-espacio`; avoid generic selectors and global `!important` patches.

### Navigation and history contract
- `Mi espacio → source record → return to Mi espacio` preserves origin, selected section, and appropriate scroll/focus context.
- Record navigation must use **verified IDs** and existing authorized record-open functions; no "switch to module and hope the record is already loaded" behavior.
- If a target record is inaccessible, deleted, filtered out, or not yet fetched, show a clear recoverable state instead of silently navigating somewhere unrelated.
- Navigating between Research and Research Library must not require closing an unrelated error layer before opening the intended destination.
- Dirty forms confirm leave/discard; browser/back/navigation semantics are coherent; no nested modal below a blocking overlay.

**URL decision still open:** current `currentView` routing does not automatically imply stable browser deep links. First integrate as the native view; later consider optional explicit URL/history support after reviewing the whole application's navigation strategy. Do not promise `/mi-espacio` as a working route until implemented.

---

## 10. Backend personal API — proposed, not implemented

These endpoints are a draft interface; do not represent them as existing routes.

| Endpoint | Purpose |
| --- | --- |
| `GET /api/me/context` | Signed-in account, linked staff summary, capabilities and linkage state |
| `GET /api/me/overview` | Composed permission-scoped summary and source coverage |
| `GET /api/me/agenda?start=&end=` | Scoped guardias, rotations, authorized absence/event data |
| `GET /api/me/research` | Verified research association records and roles |
| `GET /api/me/publications` | Verified authorship/publication records |
| `GET /api/me/profile` | Editable versus locked fields, safe professional profile data |
| `PATCH /api/me/profile` | Validated personal edits; audit and verified response |
| `GET /api/me/requests` / `POST /api/me/requests` | Optional governed correction-request lifecycle |

### Example response characteristics
```json
{
  "identity": {
    "account_id": "authenticated-account-id",
    "staff_id": "server-resolved-staff-id",
    "link_state": "linked"
  },
  "sections": {
    "agenda": {"state": "ready", "checked_at": "ISO-8601"},
    "research": {"state": "partial", "checked_at": "ISO-8601"},
    "publications": {"state": "unavailable", "checked_at": null}
  },
  "capabilities": {
    "profile": {"can_edit_own_contact": true},
    "agenda": {"can_read": true}
  }
}
```

This shape is illustrative; actual payloads must derive from backend authority, never client-generated permission flags.

**Backend security contract:**
- Resolve `req.user.id` and `req.user.medical_staff_id` through existing authenticated middleware.
- Reject changes targeting another staff ID through personal endpoints.
- Apply module/record-level authority and field projection before aggregation.
- Prevent leakage through counts, source labels, linked names, errors and search.
- Validate inputs and ranges, cap responses, protect writes against replay/duplicates and audit sensitive changes.
- Preserve `no-store`/session-appropriate caching for personal responses.
- Use server-side data projection rather than downloading the entire staff/research directory to the client and filtering there.
- Never grant a new general "view everything about me" bypass of denied source-module permissions.

---

## 11. Relationship to existing Personal Activity

The existing `Activity45` feature is valuable but has a different contract:
- May deliberately report on a **selected** staff member with scope/permission checks.
- Produces a dated snapshot/document, source coverage and Grounded-ready summary.
- Opens in an overlay rather than occupying the regular main workspace.
- May perform broad source retrieval, including a selected-person report flow.

Mi espacio should:
- Always represent the authenticated person's linked staff identity.
- Be a navigable regular view with live/loaded content and authorized editing.
- Prefer server-side personal projections instead of client-side full-directory aggregation.
- Offer an optional **Generate personal activity report** action backed by the existing reporting capability *only if authorized and source complete enough*, rather than duplicating its renderer.

The two features must not be casually merged; share domain normalization and provenance utilities only where semantics match.

---

## 12. Design and accessibility guardrails

- Institutional tone: precise, calm, evidence-led; no promotional hero copy or arbitrary personalization metrics.
- A readable hierarchy: identity, upcoming commitments, relevant involvement, actionable items, supporting source detail.
- Preserve the existing neumDESK visual identity; use restrained floating surfaces, disciplined density, minimal decorative boxes.
- Distinguish user-controlled content from system-governed fields visibly but without clutter.
- Section states: loading, ready/empty, partial, restricted, unlinked, error, stale, pending approval, saved.
- Responsive checkpoints: **390, 640, 1366, 1440, 2048 px**; verify narrow and short viewports.
- Accessible region headings, focus restoration, keyboard navigation and meaningful update/error announcements.
- Source timestamps and authoritative record links should be discoverable; absent data must not be interpreted as zero without evidence.
- The view should not conceal the sidebar/global navigation on mobile, trap users in drawers or require an error-close action to reach other modules.
- Localized language can evolve later; ship consistent Spanish navigation and clear departmental terminology, without a one-off language system.

---

## 13. Implementation sequence

### Phase 0 — Contract and foundation audit (first)
- Inventory precise DB schema, existing project/study memberships, Research Library authorship representation and staff unit assignments.
- Treat publication authorship misattribution as a **separate, independently valuable correctness fix**, with a bounded data/website/reporting remediation plan; do not wait for Mi espacio UI or spreadsheet access.
- In parallel, request feasibility and authorization details for institutional Google Sheets or Microsoft 365/Graph access. Do not build a live sync engine before service/account ownership and IT/security feasibility are established.
- Verify authorization and projections using test identities/roles.
- Identify profile persistence inconsistencies and scope of safe editable fields.
- Define API ownership, data provenance, source completeness and record navigation contracts.
- Approve this spec and record open decisions before schema modifications.

**Exit gate:** Every first-release section has a verified source, association rule, permission model and empty/error state.

### Phase 1 — Mi espacio view shell
- Register `mi_espacio` inside current Vue SPA and navigation/access policy.
- Show server-verified identity and minimal professional profile summary.
- Integrate scoped loading/empty/error/unlinked states, with no broad data hydration.
- Keep Overview as default landing until departmental user testing.

**Exit gate:** Correct personal identity per login; no cross-account retained state; no navigation/CI regressions.

### Phase 2 — Integrated activity
- Individually scoped agenda and operational records.
- Verified research membership (including contributors, not only leads).
- Publication associations only once authorship confidence/IDs are reliable.
- Record deep-navigation and return-context safeguards.

**Exit gate:** Complete and accurate verified relationships; proper permission filtering; graceful source failure.

### Phase 3 — Self-service and correction workflows
- Reuse and harden professional profile editing with server persistence.
- Distinguish user-editable fields and governed requests.
- Introduce review/status trail for missing/corrected records.

**Exit gate:** Real persistence after refresh/login; authority and audit confirmed; no client-only false save.

### Phase 4 — Grounded and departmental pilot
- Permission-scoped Grounded "my context" questions and linked record actions.
- Show provenance/freshness for schedule data **if and only if** an approved ingestion workflow has delivered verified records; Mi espacio does not depend on live spreadsheet access.
- Pilot with clinician, resident, researcher and coordinator identities; improve usability from feedback.

**Exit gate:** No unauthorized facts or writes; accurate personal-source status and user adoption feedback. **Sync Stage A remains a separate workstream; Stage B is optional and has no default implementation commitment.**

---

## 14. Acceptance tests and quality gates

### Identity and authorization
- Clinician A logs in and can only retrieve A's own personal data within existing permissions.
- Clinician A cannot supply clinician B's ID to personal endpoint and obtain B's private data.
- Switching to B (including administrator test session) clears A's cached personal data and in-flight responses.
- Account with no staff link displays usable identity-help state but no guessed professional activity.
- Limited-read/read-only roles never receive edit actions or restricted fields, including via direct API calls.
- Revoked/suspended identities cannot continue using cached personal views.

### Data integrity
- Primary and backup Guardias participants are correctly distinguished; dates/timezones stay intact.
- Rotation supervisor and resident each see the correct relationship without implying identical duties.
- Research co-investigator is included even if not project lead; duplicate links do not multiply projects.
- Publication authorship does not match on surname alone.
- Failed/partial sources do not silently claim "zero" records.
- An unapproved spreadsheet conflict is not rendered as confirmed duty.

### Editing
- Editing a permitted biography is persisted server-side and survives logout/login.
- Governed fields cannot be self-modified via direct API.
- Error/partial persistence does not show a success confirmation.
- Changing login-associated professional email follows a deliberate identity and reauthentication policy.
- Unsaved edits are protected during module switches and modal transitions.

### UX and continuity
- Clicking a project opens the requested authorized record; return restores Mi espacio.
- Going Mi espacio → Research → Research Library → back never requires dismissing an orphaned error overlay.
- Keyboard, focus, screen reader status, small screens, long content and short viewports work.
- Existing sidebar/header/Grounded remain available and coherent.
- CI smoke stays green; mounted authenticated user journeys and backend permission tests are distinct gates.

**Important:** Existing Phase 4C Research/Library authenticated release gates remain independently open until tested; do not report them as passed because Mi espacio builds successfully.

---

## 15. Risks, dependencies, and decisions to resolve

| Item | Risk | Mitigation / decision |
| --- | --- | --- |
| Weak research membership representation | Real collaborators absent from Mi investigación | Complete schema inventory; normalized, verified association projection |
| Text-based publication authorship | False positives | Verified author links, optional ORCID and review workflow |
| Large SPA source files | Regression from inserting another complex view in app.js/index.html | Scoped feature files; minimal shell integration; focused tests |
| Existing profile "save" pathway | Claims success without persistence | Fix/retire browser-only save behavior before reuse |
| Authorization inconsistencies | Personal view inadvertently broadens source access | Backend security review and negative-role tests |
| Stale sync data | Incorrect guardia displayed as confirmed | Provenance, validation status and reconciliation |
| Institutional connector approval | Google/Microsoft API access may not be sanctioned or reliably maintainable | First validate IT approval, service identity, scopes, ownership and fallback; keep .xlsx import/export working |
| Two-way spreadsheet editing | Conflicting edits and ambiguous ownership overwrite real assignments | Stage A inbound-only; Stage B not scheduled and permitted only if field-level three-way conflict resolution is proven |
| Deep-link/history gaps | Lost source context and trap-like nested navigation | Explicit handoff/return contract; automated navigation tests |
| Data privacy | Unintended personnel/clinical disclosure | Field projections, minimal summaries, privacy/security approval |
| Broad phase scope | Implementation becomes a premature redesign | Build one section at a time with exit criteria |

### Open product decisions (do not silently assume)
1. Which personal fields may update immediately, which require review, and which remain institutional-only?
2. Which research-membership data sources are canonical, including contributors not represented by PI/lead fields?
3. What is the authoritative link for publications and how are disputed author claims reviewed?
4. Which agenda elements represent **confirmed appointments** versus broad rotations or shared milestones?
5. What is the appropriate pilot group, and who is responsible for approving corrections?
6. Should Mi espacio eventually become the default landing view, or remain a navigation choice?
7. Is stable URL/browser-back routing in scope for a later global navigation effort?
8. Which Guardias sheet/range is approved, who owns it institutionally, and which system is authoritative for each field?
9. Is **one-way inbound** sufficient as a permanent operating model? **Default answer: potentially yes.**
10. Who has authority to approve imported rows, resolve conflicts and decide when an incoming change is applied?

---

## 16. First engineering slice after approving this document

**Do not build the whole UI.** Start with a narrowly scoped, reviewable vertical slice:

1. Confirm current `main` and inspect actual schema/account mappings with test identities.
2. Define the `GET /api/me/context` contract using the current authentication and authority model.
3. Implement one registered `mi_espacio` Vue view inside the current shell, loading **only verified identity/context**.
4. Add the navigation entry and linked/unlinked/error states.
5. Prove account isolation, permission enforcement, focus/return behavior and responsive layout in automated tests.
6. Only then expand into agenda, research and editing.
7. Separately resolve the public/reporting publication-attribution correctness issue and validate institutional connector feasibility; neither blocks the identity-only Mi espacio shell.

**Completion statement for this document:** Architectural specification drafted. No Mi espacio functionality, database migration, personal endpoint, authorization policy or UI integration is claimed implemented or tested by the creation of this file.


---

## 17. Connected data and spreadsheet synchronization — architecture and governance

### 17.1 Decision record: one-way first; two-way is optional

**STEP A — ONE-WAY INBOUND SYNC (the only initial synchronization direction).**

The pilot is **Google Sheets / Excel Guardias source → extraction → validation & identity resolution → preview & approval → governed neumDESK Guardias records → institutional Guardias and Mi agenda views**.

- The spreadsheet is an **upstream operational authoring source** for fields explicitly designated as sheet-owned; it does not bypass neumDESK governance.
- **Supabase/Postgres is the governed internal system of record** for accepted assignments, permissions, audit and information shown by neumDESK. Distinguish *where someone edits* from *where an approved operational record is held*.
- Stage A **never writes assignments, decisions or corrections back to the original Google Sheet / Excel workbook**.
- A one-way connection **does not imply automatic approval or automatic overwriting** of Supabase. New and changed rows are proposed, checked and reconciled under the applicable departmental authority.
- This stage can remain the **permanent production solution**. Two-way synchronization is **not** a target we are obliged to reach.

**STEP B — OPTIONAL TWO-WAY SYNCHRONIZATION, ONLY IF A DEMONSTRABLE NEED REMAINS.**

Only evaluate after Stage A is operating reliably, approved field ownership is clear, and a complete conflict detection/resolution model can be demonstrated safely. A different future choice is to keep inbound-only forever, even if the rest of neumDESK is highly integrated.

A user updating their permitted information in **Mi espacio** is *not* by itself justification to write to a third-party spreadsheet. Personal profile changes stay in their appropriate authoritative identity/staff system.

### 17.2 Delivery sequence and institutional constraints

**Priority order:** (1) Mi espacio identity + personal activity mapping and authorship correctness; (2) synchronization feasibility/Guardias read-only pilot in parallel; (3) optional extended connectivity after evidence. Do **not** make Mi espacio dependent on external Google or Microsoft access.

**Institutional feasibility gate, before API development:**
- Confirm with responsible SERGAS/departmental IT/security whether Google Workspace Sheets API and/or Microsoft 365 Graph are permitted for the actual institutional data and environment.
- Identify the owning organizational account, permission grant mechanism, credential rotation owner, access revocation process, workbook owner, allowed domains/endpoints and hosting/network restrictions.
- Seek **least-privilege, read-only source permissions** for Stage A. Service/delegated access must be reviewed, not borrowed indefinitely from a personal account.
- Confirm relevant data protection requirements, appropriate sharing, retention and audit of copied data; **no patient data** should be imported for this pilot.
- If approvals are not available, preserve the validated **manual .xlsx import/export** path. Do not describe API-based live sync as connected, sanctioned or scheduled.

The existing frontend `oncall-sync.js` already contains a pure Guardias spreadsheet parser/diff with staff resolution, blocked rows and conflicts; it does not itself write automatically. Existing guarded backend on-call batch/dry-run functionality should be inspected and reused rather than designing a second importer. Their actual deployed behavior and atomicy still require validation; documentation alone does not certify them.

**Proof-of-concept:** start with a single authorized Guardias tab/range and a tightly bounded date window. Never connect all departmental spreadsheets by default.

### 17.3 Stage A connection registry — required before live ingestion

When approved API connectivity is feasible, introduce a **governed connection registry** as the first sync component, not an unconstrained generic sync engine. These are proposed logical fields, not an existing schema:

| Field | Purpose |
| --- | --- |
| `connection_id`, `dataset`, `provider` | Stable connector and domain (e.g., Guardias, Google Sheets or M365/Excel) |
| `institutional_owner`, `approved_by` | Responsible department/IT steward and approved operator |
| `source_document_id`, `worksheet_id`, `range` | Explicit allowlisted document/tab/range; do not infer from arbitrary URLs |
| `direction` | **INBOUND_ONLY** in Step A; no write credentials |
| `source_field_owners` | Explicitly sheet-owned columns; governed/internal-only fields excluded |
| `column_mapping_version`, `source_schema_hash` | Document/validate changing columns and mapping rules |
| `business_key_strategy` | Stable assignment identity; do not rely on mutable row positions alone |
| `poll_cadence`, `watermark`, `last_attempt_at`, `last_success_at` | Scheduled/checkpoint state and operational freshness |
| `last_approved_snapshot`, `last_source_digest` | Trusted reconciliation baseline and change detection |
| `approval_policy`, `sync_enabled`, `paused_reason` | Human or explicitly authorized action gate and safe suspension |
| `credential_reference` | Reference to secure secret storage, **never the credential itself** |

A **source row number is provenance, not a durable business key**: insertions, sorting and deletions can move rows. Map assignments to a stable business identity using approved scope, date, coverage/role, and where necessary a governed source mapping; reject ambiguous duplicates rather than silently merging them.

Store credentials securely outside the GitHub repo, spreadsheets, logs, browser and Mi espacio profile. Connector ownership must be institutional.

### 17.4 Step A read/compare/review/apply pipeline

1. **Retrieve** an approved snapshot through a read-only API integration, or use a manual .xlsx upload when the API is unavailable.
2. **Validate shape and provenance:** approved workbook/tab/range, required columns, dates, shift types and schema version; capture source revision/digest and retrieval timestamp.
3. **Resolve staff:** match to existing, active `medical_staff.id` through a reviewed mapping; ambiguous names, duplicate people and unknown residents are blocked. Never automatically assign staff based on fuzzy/surname-only matching.
4. **Compute a preview:** additions, unchanged assignments, proposed updates, removed/missing source rows, invalid rows and conflicts; show effective dates and record identifiers.
5. **Reconcile against the last *approved* state:** use version guards and a preserved per-record/field baseline (see 17.5). A sheet change is not automatically an authorized internal edit.
6. **Approve and apply:** an authorized Guardias owner reviews changed records. Recheck permissions, source identity and expected internal version at commit time; apply through the existing governed backend/batch path with audit and idempotency.
7. **Publish internally:** only accepted records become the authoritative Guardias data consumed by the institutional module, Mi agenda and authorized Grounded questions.
8. **Observe and recover:** record accepted/rejected counts and job status, alert on source/schema errors and support controlled retry without duplication.

**Synchronization mode:** start as deliberate manual "Check for changes" or supervised import; only move to scheduled polling after audit and operational reliability are demonstrated. **Polling/reconciliation is the reliable baseline** for any eventual live connector; push notifications/webhooks, if available, are an optional optimization and never a prerequisite. Do not assume a specific hosting mechanism (e.g., Edge Function cron) before checking deployed infrastructure and IT constraints.

**Deletes:** A row disappearing, blanking or moving is never sufficient to delete a confirmed internal guardia automatically. Treat it as a **missing-source candidate** requiring explicit human resolution.

### 17.5 Conflict detection: what a real conflict means

Even inbound-only sync can encounter conflicting authority because a Guardias record may have been edited inside neumDESK or another authorized process **since the last accepted sheet snapshot**. A simple two-way comparison of "sheet value versus database value" cannot distinguish an incoming update from a genuine concurrent-edit conflict.

Retain for each managed record and sheet-owned field:
- **BASE:** last approved/synchronized field value and/or canonical digest.
- **SOURCE:** currently retrieved sheet field value.
- **TARGET:** current governed neumDESK record field value.
- Source revision/checkpoint and target version/`updated_at`; provenance of actor/action.
- Field ownership and whether either value is protected/internal-only.

Use a **three-way comparison** (BASE / SOURCE / TARGET):

| Since BASE | Decision for Stage A |
| --- | --- |
| Source unchanged; target unchanged | No action |
| Source changed; target unchanged | Proposed inbound change; verify and approve |
| Source unchanged; target changed | Preserve internal change; flag discrepancy when source still owns that field |
| Source and target changed to the *same* result | Reconcile after validating lineage and versions; no duplicate write |
| Source and target changed differently | **Conflict:** block affected field/record, require responsible reviewer; never last-write-wins |
| Source row missing, duplicated or identity ambiguous | Quarantine and review; never silent deletion or reassignment |
| Mapping/schema/revision invalid or stale | Pause connector batch or affected scope; no blind apply |

**Review interface (initially inside Guardias, not Mi espacio):** original BASE value, current SOURCE value, current TARGET value, source location, dates, who/what changed the record, status and an explicit option to (a) accept the source, (b) retain governed target, or (c) make an authorized correction. Show the impact and maintain an auditable explanation. A resolution must update the approved baseline consistently; reject decisions made on stale versions and require re-review.

**No silent win rule:** never equate newest timestamp with correct authority. Timestamp comparisons can be corrupted by clock differences, delayed imports, or changes in unrelated fields. Fingerprints and version checks are necessary but not sufficient without field ownership and review.

### 17.6 Step B (optional) — prerequisites for genuine bidirectional editing

**Do not enable any spreadsheet write-back** unless *all* gates are explicitly met:
1. A concrete need cannot reasonably be satisfied by inbound-only sync + manual export/reporting.
2. Institutional IT/security approves an account with **write** permissions and a named operator accountable for external edits.
3. The registry defines **field-level ownership** and unambiguous direction for every writable column; no fields with competing undisclosed owners.
4. Persisted per-field BASE/SOURCE/TARGET reconciliation, source revision/version tracking and stable business keys are reliable.
5. Resolution UI allows explicit accept-source, accept-target or corrected-value decisions with permission checks and audit history.
6. External write operations are idempotent and version-guarded; partial failures, retry, rollback/compensation, connector outages and rate limits are tested.
7. Loop prevention is demonstrated: neumDESK writes cannot re-import as independent user edits, and concurrent sheet edits cannot be overwritten during export.
8. Negative tests prove no unauthorized publication, assignments, deletion, identity reassignment, or leakage of private employee data.

**Decision outcomes after Stage A evaluation:**
- **Preferred if sufficient:** remain **one-way inbound indefinitely** and support a separate governed export when needed.
- **Selective extension:** add one-way **outbound export** for a separate, explicitly approved reporting dataset without creating a two-way editable mirror.
- **Only if necessary and safe:** permit selected field-level bidirectional sync. Full workbook-wide two-way mirroring is not the default.

**An export file is not inherently two-way synchronization.** The ability to download an .xlsx does not require writing back to the live upstream spreadsheet.

### 17.7 Integration with Mi espacio and Grounded

- Mi agenda shows **accepted** Guardias records from neumDESK, tagged with last validated source/sync status where relevant.
- Mi espacio never authorizes or performs spreadsheet edits merely because a person is assigned to a guardia.
- A user can flag "Mi guardia no coincide con el cuadrante" or "Mi participación no aparece". This creates a governed discrepancy/correction request routed to the responsible coordinator, rather than changing source or internal records unilaterally.
- Grounded may answer questions about **confirmed, authorized** schedules and surface known incompleteness; it must not treat pending imports or rejected conflicts as confirmed shifts.
- During source outages, the internal previously accepted data can remain available with a truthful freshness warning. Do not confuse **last checked** with **last approved/applied**.

### 17.8 Stage A quality gates and observable evidence

A bounded Guardias pilot is ready for supervised use only when:
- IT/data-access permission and workbook ownership are recorded—or the workflow is explicitly **manual file import**, not purported live API sync.
- Only allowlisted worksheet data is ingested; no uncontrolled external spreadsheets or patient records are processed.
- Identity mapping, date/time normalization, duplicates, missing rows and changed column names have passing tests.
- Dry-run and proposed replacement versus keep-target decisions are accurate; unauthorized users cannot approve/apply.
- Approved writes are idempotent; concurrent edits cannot silently win; failures are logged and recoverable.
- The pilot yields verified source-check, approval, applied, rejected and conflict counts/timestamps with monitoring.
- Guardias module, Mi agenda and Grounded agree on **accepted** current assignments; they do not each maintain a separate copy.
- Rollout can be paused immediately without breaking existing Guardias and manual import workflows.

### 17.9 Independent engineering workstreams and deferred UI audit

**Workstream 1 — primary now:** Mi espacio Phase 0–1 and identity-to-activity mapping. Run a narrowly scoped, independent correctness fix for publication authorship attribution where source inspection and tests establish risk; check both the public site and reporting outputs. This does not require a spreadsheet connector.

**Workstream 2 — parallel risk-reduction:** Guardias Step A feasibility: confirm institutional permissions and service ownership, validate the existing manual importer/batch dry-run path, then prove bounded **read-only inbound** retrieval if approved. Do not start a generic multi-source engine or Stage B.

**Separate tracked UI audit, not claimed completed here:** assess inconsistent/unprofessional module headers and any reproduced search results appearing behind the blue header (stacking context/z-index). Inspect real mounted computed styles, screenshot/keyboard states, and correct those defects under a separate scoped UI ticket/PR. Do not conflate that audit with the Mi espacio architecture or claim its results without execution.

### 17.10 Explicit architectural decision

**STEP A = ONE-WAY (external spreadsheet → validated, approved neumDESK records).**

**STEP B = POSSIBLY TWO-WAY LATER, ONLY AFTER TESTED FIELD-LEVEL CONFLICT RESOLUTION AND INSTITUTIONAL APPROVAL.**

**STEP B MAY NEVER BE NEEDED. THIS IS AN ACCEPTABLE LONG-TERM ARCHITECTURE, NOT A FAILURE TO COMPLETE THE PLAN.**

No connected Google/Microsoft API, scheduler, registry table, approval UI, bidirectional protocol, or conflict resolver is claimed to exist merely because this specification is now documented.

---

## 18. Implementation log

This section documents implemented phases. Each entry records what was built, where the code lives, and relevant PRs. The architecture sections above (§1–§17) remain the design contract; this log records delivery against it.

### Phase 1–10: Foundation (summarized)

Mi espacio view shell, navigation integration, `GET /api/me/dashboard` and `GET /api/me/profile` endpoints, `mi-espacio.js` / `mi-espacio-data.js` / `mi-espacio.css` three-file modular architecture, AbortController-based request cancellation, profile editing, research/publications/certificates display, absence tracking, and context pills.

### Phase 22: Identity upgrade

Upgraded the dashboard layout to a two-column identity card (`me-v22-dashboard`) with photo, context pills for role/unit/service, and improved responsive behavior. Added structured profile sections and refined the visual hierarchy.

### Phase 23: Pedro demo polish — 2026-10-13

**Goal:** Prepare Mi espacio for the Pedro demo with impact visibility, operational awareness, and institutional export.

**Backend PR:** [#27](https://github.com/Baraka124/neumAC-manage-back-end/pull/27) — branch `phase23/dashboard-impact`  
**Frontend PR:** [#112](https://github.com/Baraka124/neumAC-manage-Frontend-end/pull/112) — branch `phase23/mi-espacio-polish`

#### 23A — Impact metrics panel

**What:** A dedicated impact row in the dashboard showing PI (principal investigator) study/project count and h-index with teal accent styling.

**Backend (`index.js` — `GET /api/me/dashboard`):**
- Added parallel queries for `piStudies` (clinical_trials where `pi_id` matches staff), `piProjects` (innovation_projects where `pi_id` matches staff), and staff-level `hIndex` / `indexedPublications` from `medical_staff`.
- Response now includes `piStudies`, `piProjects`, `hIndex`, `indexedPublications`.

**Frontend (`mi-espacio.js`):**
- Dashboard template upgraded from `me-v20-dashboard` to `me-v23-dashboard` with two tiers:
  - **Impact row** (`.me-v23-impact-row`): PI count (combined piStudies + piProjects) and h-index.
  - **Ops row** (`.me-v23-ops-row`): existing stats (studies, projects, publications, certificates, absence days).

**Frontend (`mi-espacio-data.js`):**
- `normalizeDashboard()` extended to include `piStudies`, `piProjects`, `hIndex`, `indexedPublications`.

**CSS (`.me-v23-impact-*`):** Teal-accented stat cards with large value display and responsive breakpoints.

**Design decision:** h-index remains self-reported (entered via profile editing). Automated citation tracing is out of scope.

#### 23B — 7-day upcoming events strip

**What:** A horizontally scrollable strip between the dashboard and quick bar showing the next 7 days of upcoming duties/events.

**Frontend (`mi-espacio.js`):**
- `upcomingEvents` computed property aggregates from three sources:
  - Activity guardias (on-call assignments)
  - Activity absences (approved leave)
  - Notification items (certificate expiries, other time-sensitive items)
- Events within 7 days are sorted by date, tagged with urgency (≤2 days = urgent).
- Each event card shows an icon, description text, and formatted date.

**CSS (`.me-v23-upcoming`, `.me-v23-event`):** Horizontal scroll container, urgency-based border color via `data-urgency` attribute, responsive layout.

#### 23C — Photo onboarding nudge

**What:** A dismissable prompt encouraging linked users without a profile photo to upload one.

**Frontend (`mi-espacio.js`):**
- `showPhotoNudge` computed: visible when user is linked to staff, has no photo, profile section is not already open, and nudge has not been dismissed this session.
- State: `photoNudgeDismissed` (session-only, resets on reload).
- Actions: "Subir foto" opens profile section; "Ahora no" dismisses.

**CSS (`.me-v23-photo-nudge`):** Card with avatar placeholder, body text, and action buttons; responsive column layout on narrow screens.

**Note:** Photo onboarding was deferred from the Pedro demo scope per product decision but the code is in place and functional.

#### 23D — PDF institutional dossier export

**What:** A branded A4 dossier that opens in the browser's print dialog for PDF export.

**Frontend (`mi-espacio.js`):**
- `exportDossier()` function generates a complete HTML document with:
  - CHUAC branding header and department identification
  - Profile photo (if available) and professional identity
  - Impact metrics (PI count, h-index, indexed publications)
  - Leadership roles from clinical studies and innovation projects
  - Research line affiliations
  - Publication list
  - Certificate inventory
- Opens via `window.open()` + `window.print()` — no external PDF library needed.
- State: `dossierBusy` prevents double-click.

**CSS (`.me-v23-dossier-btn`):** Styled button in the quick bar.

**Design decision:** Uses browser print-to-PDF rather than a server-side PDF generator. This keeps the stack dependency-free and works in all modern browsers.

#### Cache busting

`index.html` version keys updated from `20261013-phase22-identity-upgrade` to `20261013-phase23-polish` on all three mi-espacio file references.

#### File manifest (Phase 23 changes)

| File | Changes |
| --- | --- |
| `backend/index.js` | `GET /api/me/dashboard` — 3 new parallel queries (PI studies, PI projects, staff metrics) |
| `mi-espacio/mi-espacio.js` | Dashboard template v23, upcomingEvents computed, showPhotoNudge computed, exportDossier function, dossier button in quick bar |
| `mi-espacio/mi-espacio-data.js` | `normalizeDashboard()` extended with piStudies, piProjects, hIndex, indexedPublications |
| `mi-espacio/mi-espacio.css` | Phase 23A–D styles appended (~120 lines) |
| `index.html` | Cache bust version key updated |
| `docs/mi-espacio-architecture.md` | This implementation log (§18) |

#### Testing

- All 56 contract tests (`node --test tests/*.cjs`) pass.
- JavaScript files parse cleanly via `vm.Script`.
- Playwright browser tests require CI environment (pre-installed Chromium version incompatibility in dev container).

