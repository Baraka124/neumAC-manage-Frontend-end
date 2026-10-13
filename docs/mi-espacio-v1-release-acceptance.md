# Mi Espacio v1 — Release acceptance

Status: **candidate, not signed off**. This document describes the final acceptance gates. Automated fixtures do **not** prove server authentication, authorization or account isolation.

## Product boundary
Mi Espacio is a personal perspective on authoritative departmental data, not a second source of truth. Agenda and research records are verified through the active account and linked staff identity. Communications and review decisions use the existing server-controlled endpoints. No background tasks, inferred professional obligations or duplicate scheduling module.

## Automated evidence
- Frontend integrity contract and full Playwright smoke workflow must pass on the actual integration commit.
- Mounted Vue six-profile fixtures (resident, clinician, supervisor, biomedical engineer, mixed clinical/research, head) at **390, 768 and 1366 px**: no horizontal overflow, JS errors, or missing verified roles.
- Upcoming duty cards use chronological, future-only dates; historical duties remain accessible.
- Research and publication disclosure controls preserve content and attribution; reviewer attention only appears for authorized, successfully loaded, nonempty open queues.
- Focus, keyboard, reduced-motion, narrow-screen wrapping, loading and empty states receive manual inspection. Automated assertions are not a visual sign-off.

## Required real authenticated acceptance — DO NOT mark passed without evidence
Run the following using authorized test accounts, with no production data changes:
1. Resident: own rotation is shown; no other staff member's schedule or research records.
2. Clinician: correct future guardias and no fabricated duties. Empty states are respectful.
3. Biomedical engineer: verified research and publications without irrelevant clinical agenda.
4. Supervisor: own supervisory context appears, no excessive administrative affordances.
5. Department head/reviewer: pending-review queue is authorized server-side; review detail access and failure states are safe.
6. Switch between two real accounts within the same browser and fresh tabs; old profile, reports, picker, research, and reviewer details must not survive the transition.
7. Confirm 403/revoked access, API outage, slow responses, session expiry, refresh and back navigation; never show stale personal data after identity changes.
8. Inspect at 390, 768, 1366 px in real application shell: header, content rhythm, scroll and focus, empty/dense profiles, captions and publication wrapping.

Capture a dated evidence log: tester, role, test environment, viewport, behavior observed, issues, reproduction, status. Do not include names, credentials, medical data, or screenshots containing private identifiable content in public GitHub issues.

## Release decision
Only mark Mi Espacio v1 **accepted** when latest main CI is green, all authenticated gates above are documented as passed, and critical blockers are closed. Otherwise status remains **release candidate / awaiting authenticated acceptance**.

## Scope freeze
No new panels, navigation systems, generated summaries, duplicate task management or speculative sources. Fix reproducible severity-ranked defects only.
