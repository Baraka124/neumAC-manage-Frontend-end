# V45 validation record

Date: 20 September 2026. Baseline: the V44 folder produced in this conversation.

## Passed

- Frontend app and new activity module pass Node syntax checks.
- 12 V43.1 hardening checks: fresh reads, failure/retry, pagination, malformed responses, refresh generation, context reset, complete leave payload, duplicate/stale/invalid/cancelled writes.
- 11 V44 entry checks: session verification, retry, expiration, inactive users, account switch, email validation, duplicate login, invalid response, remember-email behavior.
- 26 V45 checks: explicit identity, primary/backup roles, overlapping rotation dates, supervision, research/team-role membership, shared milestones, incomplete dates, period exclusion, terminated/cancelled assignments, missing-source disclosure, section exclusion, leap day and range limits, escaped output and excluded secrets, month boundaries, settled non-scrolling answers, directory-only loading, permission and scoped requests, independent source failures, pagination, duplicate/missing/malformed pages, unpaginated record cap, closed-dialog isolation, account isolation, stale-refresh isolation.
- 36 newly introduced/changed template attribute expressions pass JavaScript syntax checks.
- HTML template-tag nesting balances match V44. The existing repeated entry-title identifier is in mutually exclusive login states and is unchanged.
- Example HTML is generated from fictional fixtures through the production document renderer, not separately hand-authored.

## Findings addressed

1. Simulated text/forced repeated scrolling: removed from answer completion and guided follow-up paths.
2. Confidence-led presentation: source scope and method descriptions are now explicit.
3. Overbroad all-clear and department-health conclusions: replaced with bounded descriptions.
4. Unqualified best-cover claim: replaced with candidate/criterion/unchecked-constraint wording.
5. Personal activity projection: introduced with identity, period, permission, source-state and sharing controls.

## Required live checks before production approval

No authenticated browser session or print renderer was available for this validation. Consequently, layout, PDF pagination, browser print behavior and complete Vue/runtime integration remain unverified.

1. Open V45 against the configured backend. Use an administrator and a restricted account.
2. Generate a brief for a resident with a rotation and a clinician with study/project involvement. Compare record IDs, roles and dates with source records.
3. Simulate one inaccessible/unavailable source. Confirm partial coverage is visible and unavailable counts are not zero.
4. Change staff/period/sections; confirm the earlier preview disappears. Close during retrieval and switch accounts; confirm no old content returns.
5. Download HTML and open offline. Print to PDF at A4; inspect every page, particularly long titles, dense calendar dates and multi-month periods.
6. At desktop and narrow widths, inspect selection controls, preview scrolling, keyboard focus, closing and print/download actions.
7. Ask Grounded for a profile/research view; expand detail. Ask a follow-up while scrolled upward; the reading position should stay stable. Use the explicit latest-answer control.
8. Confirm existing proposal/confirmation flows remain visible and operate against the intended records.

## Remaining limitations

- This frontend consumes existing server responses. It cannot prove completeness where a server silently truncates an unpaginated response below the detectable cap, or guarantee an atomic multi-source snapshot.
- UI source permission checks use the existing permission model; no server authorization rules are changed.
- Role assignments and programme coordination are current-record snapshots. Historical membership and actual attendance are not reconstructed.
- Shared milestones do not establish personal responsibility or attendance.
- Existing Grounded source loading and other legacy operations retain the limitations documented in V43.1/V44.
- No real staff report or patient data is bundled with this release.
