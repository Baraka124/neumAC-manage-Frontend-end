# neumDesk V45 — Personal activity & deliberate review

Baseline: V44 institutional entry, generated in this conversation. This is an incremental frontend release. It does not change the backend or deploy to the live website.

## Install

Keep all five runtime files together and replace them as a set:

- index.html
- app.js
- style.css
- activity45.js (new)
- activity45-ui.css (new)

The HTML loads activity45.js before app.js. Cache version strings are 45. Retain your existing hosting/API setup. The additional example, tests and documentation are not runtime dependencies.

## Personal activity document

Open **Medical Staff → Personal brief**, a staff profile's **Calendar & activity brief**, or **Grounded → Personal brief**. Select a person and a period of up to 366 days. Choose sections, then **Prepare fresh preview**.

The document includes a monthly calendar, dated agenda, research involvement, innovation involvement, programme coordination, and source coverage. It uses an editorial green/ivory layout with system-font fallbacks, responsive rules, and A4 print styles.

**Download document** saves a self-contained, offline HTML file. **Print / Save as PDF** invokes the browser print dialog; PDF creation requires selecting Save as PDF there. It does not upload or send the report to anyone. EXAMPLE-personal-activity.html is a fictional example produced by the same renderer.

Staff are selected explicitly by ID, including inactive staff returned by the directory. No account-to-staff identity is inferred. Matching covers primary/backup duty, resident/supervisor rotations, PI/co-investigator/sub-investigator/data manager/team roles, project leadership/team roles, and programme coordination. The document uses explicit IDs, never name similarity.

Source requests are permission-scoped and independent. Opening the selector retrieves only staff. Generating a preview retrieves the selected sources, with person/date filtering for duties. Paginated sources are fully collected with duplicate/incomplete-page checks; an unpaginated response of 1,000 or more records is rejected as potentially capped. A failed source is disclosed, never treated as evidence of no activity. Counts are unavailable rather than zero for missing sources. A stale refresh cannot replace a newer one or cross an account change. Closing discards the document snapshot.

Portfolio dates are not appointments. Milestones from linked studies/projects are explicitly shared milestones whose personal ownership is not established. Incomplete dates remain visible in portfolios with uncertainty. Missing rotation end dates and early-terminated rotations without established termination dates are excluded from the calendar and disclosed. Calendar spans show recorded assignments, not daily attendance. Programme coordination is a current recorded assignment, not reconstructed historical membership.

The output deliberately excludes email, phone, leave reasons and free-text staff notes. Selected titles, roles, dates, status and record IDs remain in the exported document. Text is escaped, the document has a restrictive content security policy, and the preview iframe does not allow scripts.

## Grounded review foundation

- Immediate settled text, including drafts, without simulated typing.
- No automatic scrolling when answers arrive. **Go to latest answer** is explicit.
- Expand/Compact width control; visual details open through **Review detail**.
- Existing proposal/confirmation controls remain directly accessible.
- Source scope replaces confidence-led trust wording. Configured methods are labelled as methods, not individually verified checks.
- Refresh timestamps are captured for newly completed answers.
- Candidate cover wording describes ordering by recorded shift count and states unchecked constraints.
- Risk scan conclusions are bounded to implemented checks. The department summary no longer assigns an overall health grade, and today's primary assignment requires a physician ID.

## Deliberately deferred

Personal login workspaces, durable saved personal views, recurring calendar subscriptions, shared decision histories and a new backend are later work. This release does not implement all of the broader Grounded proposal: its existing conversation-wide all-source refresh gate remains; granular source handling is implemented for personal documents. Comprehensive candidate comparison, a common field-level evidence contract across every answer, per-intent source health, and complete service/date coverage checks remain future work. Older operational write flows and previously documented backend limitations are unchanged.

## Validation

Run from this folder:

```
node --check app.js
node --check activity45.js
node test-v431.cjs
node test-v44.cjs
node test-v45.cjs
```

49 executable checks pass: 12 inherited hardening, 11 entry/session and 26 V45 checks. Changed Vue template expressions were syntax checked; template tags remain balanced. This is not a Vue compiler, browser rendering or authenticated end-to-end test.

See VALIDATION-V45.md for evidence and the remaining live validation gate. No claim of live clinical usability validation is made.
