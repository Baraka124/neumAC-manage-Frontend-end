# Administrator protection update — 5.3-production.2

Existing system-administrator passwords cannot be changed or reset through application routes, including self-change, forgot-password, reset links, forced resets by another administrator, or temporary-credential setup. Initial activation of a new administrator invitation remains possible only when no password exists. Promotion to system administrator is rejected while personal password setup is pending.

The current-administrator-password field only verifies identity before issuing another person's credentials; it does not change the administrator's password. The new user password is visible immediately after issuance, scrolled into view, with explicit hide/show and copy controls. After dismissal or leaving the workspace, it cannot be retrieved; generate a replacement if needed.

No additional database migration beyond the previous 5.3 production migration is required. Deploy BOTH .2 packages as a matched pair. Existing administrator passwords are not modified by this update. Any exceptional administrator password recovery must be handled outside this application's password flows by the authorized database operator.

Tests added: existing administrator passwords and auth versions remain unchanged across password-change, reset-request, reset-token, temporary-setup and invitation replacement attempts; a separate test rejects forced reset by another administrator. Browser checks verify visible receipt and hide/show controls.

---

# Release 5.3-production.2 — 30 September 2026

Baseline confirmed against the current GitHub deployment sources: frontend 813fb4c3a830f692199b56ffea653882cb2b525a; backend 1e9fa8ce57210d08e83233976fc8cb97c2057526. These match the recovery accepted by the user. Unshipped work from the older, regressed 5.3F baseline was not used.

## Delivered
1. Release protection: paired release IDs, asset cache versions, a visible release indicator, a read-only release endpoint, and rejection of authenticated writes/login from mismatched or unversioned clients. A repeatable archive-verification command and checksums accompany both packages.
2. Production credentials: system administrators can create non-administrator accounts or replace their temporary passwords without development mode or an email provider. Requires the administrator's current password and a reason. Server-generated passwords are shown once, stored only as bcrypt hashes, expire in 24 hours, invalidate previous sessions and allow only a 10-minute personal-password setup session. Setup consumption uses conditional database updates and increments session version. The initial and personal password must differ. New personal passwords in reset, invitation and change flows require at least 15 characters, with the existing 72-byte bcrypt limit retained.
3. Account design/access: the existing scoped permission editor, role controls, explanations and history are preserved, with clearer production onboarding, readiness labels, credential receipt and mobile styling. Development password configuration advice is removed from the production workspace. Development impersonation remains development-only.
4. Dates: creating an already-terminated rotation now requires an actual end date, matching the existing update rule. Missing historical dates are surfaced for review; existing records are not automatically changed.
5. Grounded: existing authority checks, previews, conflict enforcement and human confirmation are preserved. Regression checks prove unconfirmed and authority-denied writes do not execute. This release does not add a new Grounded action engine.
6–7. Conflict review/daily work: a dashboard review panel surfaces missing rotation end dates, active rotations past their planned end and today's on-call/leave overlaps (including residents), using only permission-gated records already available to the user. These are advisory checks, not exhaustive conflict analysis.
8. UI consistency: account setup, review cards and readiness checklists share typography, spacing, focus treatment and mobile behavior. This is not a redesign of every existing module.
9. Profiles: a professional-profile completeness checklist adds biography, photo, email and ORCID visibility. It does not invent publication counts or change public-profile permissions.
10. Publishing: a record-details checklist makes title, public visibility, publication state and DOI readiness inspectable beside the existing public preview and publishing controls. No public content is automatically published.

## Validation
- All packaged JavaScript syntax and local dependency/asset references verified.
- 14 production credential test scenarios, covering production availability, administrator role and password confirmation, issuance, hashing, forced setup, expiration, token-purpose separation, replay rejection, suspended accounts, account creation and rate limiting.
- Actual backend integration: startup/health, release endpoint, mismatched/unversioned sign-in rejection, matching login returning a setup-only token, protected API rejecting that token, release-header CORS.
- Browser: application mount and invitation/recovery screens; production account workspace and one-time receipt; mobile layout; personal-password setup; no setup token in browser storage. Mock APIs and test identities were used.
- Operational review tests: inclusive leave overlap, resident on-call assignment, cancelled-record exclusion, actual-end-date omissions and overdue rotations. Grounded confirmation/authority regression tests.

## Remaining scope and limits
Live database compatibility, delivery by your email provider, authenticated operational writes and the public website must be checked on your deployment. This is a production-account release with focused improvements across the other areas, not a claim that all ten broad workstreams are complete. Deeper Grounded proposal UX, comprehensive module-wide design standardisation, research/profile analytics and an expanded public publishing workflow remain further work.

Header layout fix (2026-10-01): restored the date-and-actions header to the top of the dashboard. Operational Review now follows the summary statistics. Compatible with backend 5.3-production.2; no backend deployment or SQL change is required for this frontend fix.

Login and recovery update (2026-10-01): revised desktop/mobile sign-in and loading screen; accurate permission verification progress; default request timeouts; classified connection/server/access errors; retry for failed staff reads with existing records preserved. Includes the dashboard header fix. Compatible with backend 5.3-production.2; no new SQL or backend deployment. Live cause of the previously reported connection failure remains unconfirmed.

Phase 1 — Institutional sidebar (2026-10-01): grouped Department, Research & knowledge, and Administration navigation; search beneath departmental identity; restrained navy and teal selection; readable labels and consistent icons; account menu with profile, support and sign-out; accessible collapsed links and mobile drawer with Escape and keyboard focus containment. Existing destination permissions retained. Built on the latest login-fix release, including the dashboard header fix. Compatible with backend 5.3-production.2. No SQL or backend deployment required. Phases 2–4 remain pending.

Phase 2 — Shared shell foundation (2026-10-01): shared typography, navy/teal colours and control tokens for sidebar and application header; consistent header height, title and subtitle; readable search fields; accessible search result buttons with keyboard focus and Escape; aligned account and notification controls; compact mobile header with workspace search and contained notification panel. Built on completed Phase 1. Compatible with backend 5.3-production.2; no SQL or backend deployment. Login composition (Phase 3) and dashboard refinement (Phase 4) remain pending.

Phase 3 — Institutional login and entry (2026-10-01): neumact institutional masthead; light editorial introduction and integrated sign-in form; compact sign-in preferences with trust off by default; optional public perspectives retained; separate centered verification screen with expandable real progress; responsive recovery and resume states. Matched/checking release badges are hidden on entry; mismatch and unavailable messages remain visible. Authentication, administrator password protection and temporary-password setup are unchanged. Includes Phases 1–2 and previous repairs. Compatible with backend 5.3-production.2; no SQL or backend deployment. Phase 4 dashboard refinement remains pending.


Phase 4 — Dashboard refinement (2026-10-03)

Built on Phase 3 commit 45e3a91. Includes the completed institutional sidebar, shared header and login/entry redesign, plus prior production repairs.

- Navy dashboard header, readable summary cards, responsive two-column mobile summary, visible keyboard focus and native button navigation.
- Staff total and breakdown now use the same visible roster. Summary records need no private employment-status field. Unknown types appear as other/unclassified; counts do not claim everyone is active.
- Summary values distinguish loaded zero, waiting, updating, unavailable and restricted sources. Counts refer to the records returned to the current account, not complete departmental totals.
- On-call summary counts today's duty records, not verified staffing coverage. The briefing describes absent visible primary records without asserting departmental coverage failure.
- Rotation-date checks and duty/leave overlap checks show whether their required sources loaded. Missing termination dates include the separate terminated-rotation query. Findings navigate to the correct on-call module.
- The next-week rotation panel uses actual start/end dates and excludes overdue entries. Summary counts no longer depend on the asynchronously updated system-stats aggregate.

Deploy ALL files in this frontend archive, including dashboard-phase4.css. Keep backend 5.3-production.2; no backend redeployment or new SQL is required for Phase 4. Backend and frontend release IDs intentionally remain matched. Existing administrator-password restrictions and temporary-password workflows are unchanged.

Validation: actual Vue app with mocked APIs at desktop, tablet and mobile widths; 21-person summary projection without employment_status; unavailable/restricted/zero states; review dependencies and termination records; keyboard navigation and dashboard order; Phase 3 entry/recovery and Phase 2 header/sidebar regression checks; account credential setup UI; request error classification and staff retry checks. All packaged JavaScript syntax, local assets, release pairing and SHA-256 checksums verified. Not deployed or tested against live accounts; previous live connection failure's root cause remains unconfirmed.


Milestone 5 — Role-aware navigation and background work (2026-10-03)

Baseline: Phase 4 commit 2452708. Includes Phases 1–4 without replacing their designs.

- Shared capability-based navigation checks cover the actual system_settings destination, communications, research analytics and unknown destinations. Settings alias remains supported.
- Workspace commands and header search filter destinations and record results by current access. Create commands require both module read access and the appropriate create capability. Activation checks permissions again so queued commands cannot bypass changed access.
- Dashboard module links and expand controls follow the same read permissions. Mobile More correctly marks the communications page as active.
- Background on-call/leave polling and relevant startup reads skip denied sources. Automatic rotation status checks return immediately for signed-out or read-only sessions.
- Backend policy, credential issuance, administrator password protection and database schema are unchanged. These UI checks complement existing server-side enforcement; they do not grant permissions.

Validation: backend-generated capability snapshots for clinician, resident and system administrator; rendered every available command destination in the real Vue app with mocked APIs; checked permitted creation commands, rejected navigation, stale queued commands, cached search results after denial, restricted polling and mobile widths. Rotation auto-update guard checks passed. Phase 2 header/sidebar, Phase 3 entry/recovery and Phase 4 dashboard regression suites passed. No live-account sign-in, deployment or production-data mutations performed.

Deploy every file in the full frontend archive. Keep backend 5.3-production.2; no backend redeployment or new SQL is required. The optional patch archive contains only changed files and requires the exact completed Phase 4 baseline.


Milestone 6 — Clinical Units (2026-10-04)

Baseline: completed Milestone 5 commit a4ce9aa. This release includes all earlier phases and role-access fixes.

Clinical Units now opens with the unit directory. The institutional header, three view selectors, compact filters, unit cards and unit detail dialog use a consistent navy/teal palette and readable typography. The existing rotation capacity and attending-team views remain available. Clear filters, labelled controls, selected-view states, keyboard focus, Escape dismissal and focus return improve navigation. Existing assignment, editing and permission workflows remain in place.

Unit collection loads now use strict error handling and explicit retries rather than converting failures into an empty directory. Attending-link failures remain distinct from loaded empty teams, and Retry bypasses cached results. Capacity and leave-context panels require their respective sources; unavailable sources no longer imply free slots or available staff. Capacity is described as based on the visible rotation records. This does not certify complete departmental coverage or staffing adequacy. Unit grouping rules and capacity calculations are preserved.

Validation: real Vue app with mocked APIs; directory search/filter reset, unit details, Escape/focus return, planning month navigation, attending-link retry, missing-source states and 1440/768/390 layouts. Backend-derived clinician/resident/admin navigation tests and previous login/dashboard regression suites passed. No live sign-in, deployment or production data changes performed.

Deploy all files in the full frontend archive, or apply the changed-files patch only over the completed Milestone 5 release. Include units-milestone6.css. Keep backend 5.3-production.2: no new backend deployment or SQL migration is required.


Milestone 7 — Connected operational reviews (2026-10-04)

Baseline: completed Milestone 6, b28efc7. All previous releases are included.

Leave, rotation and on-call review panels now distinguish local previews from server review results. Local source badges report actual loaded, pending, unavailable or restricted states. Local empty results no longer show a server-style all-clear message. Blocking, warning and advisory/context meanings are explained consistently.

Related evidence expands within the draft. Suggested resolutions can open permitted related modules; a return banner preserves the draft and displays the related record reference where available. Navigation opens the module, not an automatically selected record. Draft preservation lasts within the current session and is not persistent draft storage.

Preview responses are rejected if their proposal no longer matches the form or the modal closed. Rotation previews also use request sequencing. Save paths reject malformed server review responses instead of falling back to local decisions. Existing backend checks, authority requirements and exception-reason workflows remain unchanged. Review sections keep their full height inside scrolling forms so evidence controls remain reachable.

Validation: actual Vue modal flows with mocked review endpoints for all three domains; unavailable/server states, evidence expansion, related-module navigation and draft return, preserved dates, delayed rotation responses and mobile widths. Clinical Units and role-access regression suites, request-error classification and operational review tests passed. No live accounts or production records used; not deployed.

Upload all files in the full frontend archive, including workflow7.js and workflow7.css. The changed-files patch requires the completed Milestone 6 release. Backend remains 5.3-production.2; no new backend deployment or SQL is required.


Milestone 8 — Grounded access and review (2026-10-04)

Baseline: completed Milestone 7, commit 8d502bf. All previous interface and workflow work is retained.

Grounded reads now use the fresh /api/grounded/access plan for projected sources rather than a second general capability check. A browser regression test reproduced an administrator denial with an incomplete general capability snapshot despite a successful Grounded access plan; this case now passes. Explicit source restrictions still block retrieval. No role-based bypass was added. The standalone brain configuration now uses clinical_trials consistently with the embedded runtime.

Access responses must match the expected contract and signed-in identity. An actual restriction is distinguished from server, network or incompatible-response failures; available server reasons are shown. Retry preserves the query. Refresh clears prior authority while rechecking. Source details show retrieval state, record count, scope and field visibility in a bounded, scrollable mobile panel. Counts refer to returned source rows, not department-wide totals.

Operational previews explicitly say they are not saved, explain confirmation and server checking, and disable confirmation when Grounded commit authority is absent or being refreshed. Existing tool confirmation, server validation and exception approval requirements remain in place.

Validation: actual Vue browser tests with mocked APIs cover administrator access with incomplete general capabilities, restricted-source retrieval, explicit 403, server failure, malformed access response, retry, proposal confirmation availability and 390px layout. Milestone 5 role/navigation and Milestone 7 workflow browser suites passed; request-error and operational review/authority tests passed. No live account or production record was used. The precise cause of the reported live denial has not been verified; the new access detail exposes the returned reason if it persists.

Deploy all files in the full frontend archive. The changed-files archive requires completed Milestone 7. Backend stays 5.3-production.2, provided separately and unchanged; no new SQL or backend redeployment is required if that version is already installed. Frontend/backend release IDs deliberately remain paired at 5.3-production.2.


Milestone 9 — Research reliability (2026-10-05)

Baseline: completed Milestone 8, commit 93c5f48. Existing research design, page structure, filters and navigation are preserved.

Research source loads distinguish pending, loading, ready, restricted and unavailable states. Failed refreshes retain previously retrieved records with a visible warning and retry. Restricted results clear their cached source. Empty states require a successful source load; portfolio summary totals are withheld while their sources are not verified. Research list responses are shape-checked and pagination is followed when supplied. Out-of-order responses cannot replace newer loads.

Successful edits update the open study, innovation project or programme immediately from the save response; successful collection refreshes reconcile the selected record. Origin, delivery model and institutional role controls are disabled and explicitly read-only because the current backend does not persist those values. No new schema or persistence functionality is claimed.

Validation: mocked-API Vue browser checks for saving all three record types, selected-record synchronization, unavailable/malformed/restricted/empty source states, retained records, retry, disabled relationship fields and 390px layout. Grounded milestone 8 regression passed. Release checks verify syntax, hashes, files and frontend/backend pairing. No live accounts or production writes used; not deployed.

Install all files from the full frontend archive. The changed-files patch requires Milestone 8. Backend 5.3-production.2 is unchanged; no SQL or backend redeployment is required if already installed.


Milestone 10 — Audited public publishing fixes (2026-10-05)

Matched release: 5.3-production.3. Frontend baseline: Milestone 9, b56e318. Backend baseline: 88604a5. Install both matching packages. No new database migration is required for this update; existing 5.3 schema requirements still apply. Back up the installed files, replace the backend server files and restart, then upload the frontend files and refresh. During the version mismatch the existing release guard blocks writes. Rollback requires restoring both matched previous packages.

The public team endpoint now requires active, public, non-deleted staff. Its publication context requires published, public, unexpired, non-deleted records. Linked project counts include only projects flagged for website display. These corrections can reduce public results; private flags are not automatically changed.

News feature updates use a partial schema without injecting creation defaults. Feature-only updates preserve titles, status and publication dates. New records persist the selected feature flag, subject to the existing five-record check; count failures abort the write. The existing count-then-write limit is not a database-atomic concurrent quota.

Public visibility is distinguished from public-feed eligibility. Grounded and publishing messages no longer assert website delivery based solely on the public flag. The publication review shows proposed eligibility, expiry, content fields and image URLs. Metadata exposed by the public API is described separately. This is a preview of feed content, not a rendering or delivery receipt from neumact.org. Existing website refresh/caching behaviour has not been inspected or changed.

Validation: actual backend handler tests with a mock database cover public staff/publication exclusion, feature creation and partial update, limit rejection and database errors. Vue browser tests cover review eligibility, expired records, content preview, mobile controls and feature-only writes. Research and Grounded regression suites passed. Actual backend startup/integration checks preserve administrator password protections and release matching. Release verification covers hashes, JavaScript syntax, modules, assets and archive integrity. No live production reads or writes, deployment or repository push occurred.


Sign-in composition update — 2026-10-05

Built from frontend Milestone 10 d13f4f8; compatible with backend 5.3-production.3 (57b4355). The full frontend retains Milestones 1–10. This update changes only the entry markup/styles and adds a local decorative respiratory SVG. Compact masthead, deep teal identity panel, framed access card, responsive spacing and compact laptop layout. Auth handlers, permissions, administrator password protections, API calls and authenticated navigation are unchanged.

Install all files from this frontend archive and refresh the browser. The entry stylesheet has a new cache key. Backend 5.3-production.3 is unchanged and needs no reinstall if already running. No new migration. Rollback: restore the Milestone 10 frontend.

Validation: mocked browser checks at widths 1440, 1366, 390 and 320; footer fits 1366×768; password reveal, validation, trust preference, public highlights, recovery, saved-session and unavailable states, centered loading and invitation rendering. Authenticated header/dashboard layout checks passed. No missing local assets or browser exceptions. Release checksum, JavaScript syntax and matched package verification passed. Real production login and deployment were not performed.


Private entrance correction — 2026-10-05
The public sign-in page now shows institutional identity and access controls only. Removed the module catalogue, workspace overview and expandable editorial highlights from entry markup. Retains the respiratory visual. Supersedes the earlier entry-composition archive. Backend and authentication behaviour unchanged. Browser checks cover absence of the removed sections and the existing sign-in states at desktop/mobile widths.


Tower entrance — 2026-10-05
Built from ba83af1 (latest private-entry correction), retaining Milestones 1–10. Implements the approved Tower of Hercules concept with a local AI-generated decorative coastal asset, a neumAC wordmark using the supplied blue-to-teal palette, and the single-line health-area affiliation. Public entry contains no module catalogue or editorial highlights. The sign-in form sits directly on a light surface; shared-device guidance is inside Browser preferences. Existing handlers, auth policy, administrator password protections and authenticated UI are unchanged. Mobile prioritises the form and institutional identity.
Install all frontend files and refresh. The entry CSS uses a new cache key. Backend remains 5.3-production.3; no backend reinstall or new migration is required if that version is already installed. Rollback by restoring the private-entry frontend.
Validation: mocked browser tests passed at widths 1440, 1366, 390, 320; 1366×768 footer fit; validation, password visibility, browser preferences, saved-session/unavailable/loading states, recovery and invitation rendering, authenticated dashboard/header checks. No missing assets or browser exceptions. Release/package verification passed. No live login, deployment or push performed.
