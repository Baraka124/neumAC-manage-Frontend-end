# Mi Espacio · Phase 42 — editorial and role-acceptance consolidation

Date: 15 October 2026. Scope: Mi Espacio presentation, local tests, related documentation, and Mi Espacio asset cache references only.

## 42A — Repository/deployment parity
- Verified repository main at baseline `c47a89fbc38869c37cbe96c87a68e2925dd9bf31`, containing merged PR #157. The repository identifies `desk.neumact.org` in CNAME.
- No matching Vercel project was discoverable through the connected account.
- The authenticated production page could not be fetched; **live deployed revision, credentials, cache parity and per-account visuals remain unverified**. No real-account approval is asserted.
- Require authorized user to inspect loaded `mi-espacio.js/css` cache keys and role views after deployment. Do not expose a private account in a public screenshot or test fixture.

## 42B–42C — Implemented/tested
- Preserve one authorized workspace and role-dependent layout, including Pedro leadership, clinicians, residents, biomedical engineering and empty state.
- Consolidate research-line affiliation heading once, with a concise role beside each named line rather than repeating “LÍNEA DE INVESTIGACIÓN”.
- Clarify resident empty state: records not displayed are not proof that no assignment exists. The existing discrepancy workflow remains the action; no rota is created.
- Test fixture views at 390/768/1366/1920, with 11 studies and 13 projects, inline disclosure, no horizontal overflow, and no errors. These are **synthetic fixtures used only in tests**.
- Existing Phase 40 large-list tests, Phase 41 profile/leadership tests and all prior role-based smoke tests remain mandatory.

## 42D — Editorial acceptance
- Keep factual, understandable Spanish; eliminate repeated capability badges/roles as implemented in PR #157.
- Preserve titles, scientific states, recorded dates, roles, content order, account isolation and proper authorization.
- Typography and mobile responsiveness still require **visual** real-account confirmation; CI alone cannot certify appearance.

## Required sign-off evidence (pending)
- Pedro: real-record leadership and research affiliation, no duplicate capabilities or status claims.
- Baraka: personal research-first layout, no invented agenda.
- Ana: existing rotation data or honest missing-assignment state, verified resident account, permission-gated actions.
- Alicia: upcoming guardias without duplicates, correct dates and role.
- Collection behavior: 0/3/10/30 items, long titles, expand/collapse persistence, scroll/focus, 390/768/1366/1920/2048 and zoom/reduced-motion.
- Security: session switch/reset, unauthorized API responses, no stale data, no cross-account leakage.
- Export, printing, profile save/discard and source-query unavailable states.
- Live revision/cache-key and rollback target; manual sign-off by authorized reviewer.

## Separate Phase 43 proposal — NOT IMPLEMENTED
The prior Phase 37 source audit notes that completed studies/projects may be excluded by API filtering, source query errors may masquerade as empty lists, and study Co-IP/type classifications require governance. Backend source-of-truth changes are **not** part of Phase 42 and require their own review and approval.
