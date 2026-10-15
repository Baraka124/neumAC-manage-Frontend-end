# Phase 44A — Institutional disclosure language and interaction fidelity

Scope: authenticated Mi Espacio Vue template, local CSS and regression tests. No backend, datasets, permissions, global navigation or shell files changed beyond the two Mi Espacio asset cache references in index.html.

- Replace research-record plain plus signs with a consistent down chevron, preserving native details/summary semantics.
- Share a high-contrast restrained circular chevron (32px visual icon within at least 44px target), 2.2px stroke, and 180-degree rotation across profile, research, operational and secondary disclosures.
- Harmonize separate utility indicators in "Solicitudes y correcciones" and "Indicadores profesionales". Preserve their existing state and content.
- Extend the existing Vue nextTick scroll-position anchoring to native record, profile subpanel and metrics disclosures, without moving focus or requesting fresh records.
- Remove unnecessary staggered reveal animations that caused list shake; honor reduced-motion preference.
- Add Playwright checks for 390 and 1366px, keyboard Enter, focus ring, computed icon size, independent list state, reduced motion, and overflow.
- Do not change guardia card/date composition, research title type sizes, publication metadata, professional header or profile editor architecture in Phase 44A; these remain phases 44B–44E.
- CI and authorized role-based, deployed visual acceptance required before merge. Screenshots may show older deployed assets and do not independently certify deployment parity.
