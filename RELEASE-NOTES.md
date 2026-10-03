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
