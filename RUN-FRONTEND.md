# Frontend — 5.3-production.2

Apply the backend migration and deploy the matched backend first, then upload ALL files in this frontend archive to your frontend project root. No build step is required. index.html is at the archive root. Keep the backend and frontend paired.

Refresh https://desk.neumact.org after deployment. The release indicator should read "Frontend & backend matched". If it does not, refresh or deploy the matching pair before making changes.

The production API remains https://neumac-manage-back-end-production.up.railway.app. For a changed API hostname, update CONFIG.API_BASE_URL in app.js and regenerate the release checksums before deploying.

Local use: run `python -m http.server 8080` (Windows: `py -m http.server 8080`), then open http://localhost:8080 with the backend running on port 3000. Use localhost, not 127.0.0.1 or file://, for the existing local API selection.

People & access now supports production temporary credentials. No development mode is required. The administrator must confirm their own password. Issued credentials are shown once and expire after 24 hours. The recipient must choose a personal password before accessing departmental data.

Keep this guide and RELEASE-NOTES.md with the release. Validate the pair using `python verify_release.py --frontend . --backend ../backend` with your actual folder paths. Live sign-in, operational data and email delivery still require deployment checks.

Update .2: existing system-administrator passwords cannot be changed or reset within the application. Entering your current administrator password only confirms your identity. Generated user credentials now appear visibly and scroll into view. If the .1 migration was already applied, no further SQL is needed.

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
