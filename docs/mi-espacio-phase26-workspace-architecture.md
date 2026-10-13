# Mi Espacio · Phase 26 — Professional Workspace Architecture

**Status:** Proposed decision contract; no runtime migration is authorized by this document.
**Scope:** Pedro (department head, research-intensive), clinician with guardias/supervision. Source evidence: 2026-10-14 Pedro recording and prior two-account recording, inspected privately. Do not commit identifying recordings or personal data.
**Companion:** `docs/mi-espacio-architecture.md`, issue #115. Preserves established backend permissions and authoritatively scoped identity.

## 1. North star
When a person opens Mi Espacio, they should immediately understand (a) who is signed in, (b) what verified commitment or action matters now, (c) what they contribute, and (d) where an action leads and how to return. The shell should feel continuous, fast, calm, and institutionally credible. It is *not* a second department operations system.

## 2. The core architecture

```text
AUTHENTICATED NEUMDESK SHELL (existing global navigation, search, Grounded)
  └── MI ESPACIO · stable personal context
       ├── OVERVIEW (default, responsive, read-mostly)
       │    ├── Compact verified identity / role
       │    ├── Next confirmed commitment + authorized attention
       │    ├── Contribution landscape (clinical + research)
       │    └── Brief recent output; utility entry points, subordinate
       ├── WORKSPACE (one active task, stable location)
       │    ├── Profile: read → edit → save or discard
       │    ├── Calendar: month → selected date → verified event detail
       │    ├── Directory: search → person preview, allowed fields only
       │    ├── Personal guardias: chronological list → detail
       │    ├── Personal report / discrepancy
       │    └── Publications / research detail where authorized
       └── CONTEXTUAL DETAIL (optional within workspace; never nested on top
            of an unrelated modal, retains an origin and return target)
```

Only the active task consumes the workspace region. The Overview stays semantically stable, not duplicated underneath a stack of expanding tools. A concise breadcrumb/context bar supports “Mi Espacio → Calendario → [date]” and “Volver a Mi Espacio”. Prefer a routed *internal state machine* within existing SPA; do not create a separate app or global router migration.

## 3. View hierarchy and role-aware relevance
**No personal-name checks or hardcoded Pedro branch.** All priority comes from *verified activities, linked roles and current permission state*. A leadership-intensive view may foreground research contributions and reviews; a clinician with duties/supervision foregrounds the next guardia/rotation. A department-head account with no linked research cannot show invented leadership achievements.

**Pedro example, conditional on verified data:**
1. Compact identity: staff name, clinical title + verified head-of-department designation.
2. Actual next urgent personal event or authorized pending review. Never imply all departmental tasks are personal tasks.
3. Research leadership with meaningful record names and roles; clinical commitments remain visible.
4. Publications, metrics, institutional dossier and other tools as subordinate information.

**Clinician example:** identity → confirmed next duty and supervised rotation → any verified research → secondary utilities. Both examples use one shared component grammar, not role-specific application forks.

## 4. Three levels of surface
| Level | Container | Intended behavior |
|---|---|---|
| Overview | main view | continuous scannable personal context; avoid multiple large hero cards |
| Workspace | main content region inside same shell | replaces overview's main task area, persistent contextual heading, back navigation, independent scroll and focus |
| Detail | inline drill-down or one carefully controlled side panel | stable selection, clear close/return, never stack with unrelated editor |

Do not implement a generic “drawer for everything”. A profile editor deserves a full, structured workspace; the calendar needs real daily detail; short record previews may use a panel. The active view, not the type of CSS container, determines the experience.

## 5. Deterministic navigation/state model
Proposed discriminated state shape (in front-end only, subject to integration):
```js
{
  view: 'overview' | 'workspace',
  workspace: null | 'profile' | 'calendar' | 'directory' | 'duties' | 'digest' | 'communications',
  detail: null | {type: 'date' | 'research' | 'publication' | 'staff', id: string},
  origin: {focusId: string | null, scrollY: number},
  dirty: false
}
```
Use explicit OPEN_WORKSPACE, OPEN_DETAIL, BACK, CLOSE, CANCEL, SAVE_SUCCESS, RESET_ON_IDENTITY_CHANGE transitions. Prefer one active workspace over independent `profile.open`, `calendar.open`, `colleagues.open`, `digest.open` controls. During migration these legacy fields can be adapters, **never two competing sources of navigation truth**.

- Entering a task stores actual triggering control and scroll position, with a safe return fallback if the trigger vanishes.
- Returning restores a meaningful focus target and origin scroll, unless the source data or route has changed.
- Unsaved edits prevent navigation until save/discard confirmation; on token expiry, clear personal state.
- Every async result is checked against account, active workspace, request generation, and abort signal. Month switches must discard stale calendar responses. An account change resets open workspaces, people searches, profile and temporary private data.
- Escape closes the innermost eligible detail only; it must not discard unsaved edits or hijack global shortcuts.
- Browser history integration only if the current global shell supports it; do not invent URLs.

## 6. Contracts for initial professional workspaces
### Profile
Read-only institutional metadata separated from editable professional content. Overview shows summary only. Opening profile switches to a legible workspace: identity/affiliations → research identifiers → public bio → professional contact → academic metrics → certificates. Keep professional email admin-only. Update only validated fields; refetch after success; preserve dirty state and draft on ordinary navigation unless explicitly discarded.

### Calendar
Month / selected-day split on desktop; a readable day agenda on narrow screens. Date selection reveals confirmed events, source and status. Dot colors are secondary indicators and not the sole information channel. Resolve 'today' in the intended local timezone, not through UTC ISO slicing. Do not infer free availability from blank dates.

### Directory
Permission-filtered staff search with appropriately cropped identity summary. A selection opens a constrained, public/authorized profile preview, not another staff editor. Search retained while moving into/out of preview; do not present private profile fields or broad staff data.

### Duties and research
Existing confirmed personal record relationships only. Provide preview and hand-off to owning module with explicit return. Preserve selected section, filter and scroll. Verify cross-module navigation and denied-record behavior.

## 7. Engineering boundaries / incremental migration
Current `mi-espacio.js` is ~111 kB and CSS ~78 kB, accumulating inline subviews. Do not rewrite wholesale.
- Slice 26A: contract + tests for navigation state/transitions, stable workspace shell; no visual restyling.
- Slice 26B: migrate calendar and directory one at a time, with date detail and search/return semantics.
- Slice 26C: move profile to a structured workspace with dirty/permission/write acceptance.
- Slice 26D: migrate personal guardias and other appropriate detail paths; preserve record-origin continuity.
- Slice 26E: consolidate CSS tokens and prune dead overrides only after computed-style evidence and screenshot comparisons.
- Slice 26F: real-account authenticated acceptance for department head and clinician, keyboard/short viewport/mobile tests, sensitive-data isolation, CI and rollback readiness.

Never merge failing PRs or stack on unresolved CI. Previously proposed visual PRs #118 and #119 may be used as references; decide integration based on live main/CI and the new state model, not chronological phase labels.

## 8. Performance, accessibility and evidence
- Lazy-load only the selected workspace; avoid redundant background calls and double mounting.
- Protect private data against cross-user caching, stale responses and permission revocation.
- Contextual heading, keyboard accessible back/close, meaningful programmatic focus; no CSS-only hiding of an accessible focus target.
- Responsive baseline: 390, 768, 1366 px plus short laptop viewport; no horizontal overflow or whole-page layout shake.
- Respect reduced motion; avoid scroll animations by default while testing.
- Test every transition: overview → workspace → detail → back → overview, quick switching, save/discard, API failure, 403, session change, slow responses.
- Require before/after screenshots and video review with representative but safe data. Contract tests alone do not prove visual quality.
- No patient-linked information, speculative KPI, invented departmental decisions, or public disclosure of account-specific screenshots.

## 9. Release acceptance decision
The architecture is **approved for implementation only upon explicit scoped review**. Current completion is analysis/specification, not a functioning new workspace router. Exit gate: both real profiles can perform primary work without vertical disorientation; all verified data remain accurate and secure; focus and scroll return are deterministic; critical UI defects addressed; CI and authenticated gates pass.
