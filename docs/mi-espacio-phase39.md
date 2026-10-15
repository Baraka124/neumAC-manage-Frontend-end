# Mi Espacio · Phase 39 — role-aware editorial convergence
Date: 15 October 2026
Scope: `mi-espacio/mi-espacio.js`, `mi-espacio/mi-espacio.css`, Mi Espacio tests and the index's two Mi Espacio cache references only. **No backend, generic shell, permission, navigation or other feature-module changes.**

## Evidence and intent
Recordings: Pedro (CURRENT VIEW), Baraka (BARAKA-ADMIN), Ana (ana-residente), Alicia (ALICIA). Recordings show 5.3-production.3, not demonstrably the merged Phase 38 composition; therefore they are **not proof of a regression in PR #154**. GitHub main at audit start: `a1940d17af949f18f7b668bf6d54dba78265ee45`. Phase 37's real-account release sign-off remains incomplete.

## Changes
- Preserve Baraka's research-first presentation when there is no authenticated personal agenda; constrain very long single-column scientific copy.
- For accounts verified as medical residents and with zero linked agenda records, show a useful empty training state with an explicit source limitation; offer permitted Rotations navigation and a prefilled **missing rotation** discrepancy form, never creating or inferring a record.
- Suppress the redundant on-call notification in the seven-day teaser; its verified date remains prominent in Agenda. Other alerts still appear as permitted.
- Hide verified *empty* publication panels from the overview; if the source is unavailable, keep the unavailable-state message. Existing authorship claims remain available in quick actions.
- Keep personal metrics under a keyboard-operable disclosure and move optional profile-photo prompts into explicit tools to prioritize work over secondary progress and counts.
- Maintain existing session-linked /api/auth/me and /api/me/context access, profile editor, dirty-state protection, account change reset, research state, calendar, guardia details, notifications, authorship claims and review queue.

## Acceptance and limitations
Playwright tests cover Ana's sparse resident view at 390 and 1366, a clinician with a real-assigned future guardia, and a research-only biomedical engineer with expandable project evidence. Node contract tests guard the source and no synthetic UI-switcher rule. Tests use **illustrative fixtures only**, never hospital data. Run GitHub CI and authorized role-specific deployed sign-off prior to production acceptance.

Do not infer that no displayed assignment means no rota exists; do not claim completed scientific history is exhaustive; unhandled backend table errors and missing study/Co-IP classification remain governed separately.
