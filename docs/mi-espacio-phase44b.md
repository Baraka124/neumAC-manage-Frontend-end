# Mi Espacio · Phase 44B — Guardia reading and scalable schedule

Date: 15 October 2026. Scope: Mi Espacio Vue/CSS, targeted tests/docs, and the two Mi Espacio cache keys in index.html. No clinical data source, backend, permissions, or other neumDESK module changes.

- Keep the already-approved design: one featured next duty followed by two subsequent commitments when present. No invented shifts, timestamps or staff assignments.
- Refine the green card with restrained pale-green surface, clear numerical day, weekday and a **complete professional Spanish date**. The semantic time element retains the real ISO date and readable aria label. Never claim a future duty is happening now.
- Subsequent duty rows display weekday names rather than cryptic weekday abbreviations, a recorded date including year, and shorter labels (Presencial/Mixta/Localizada) only when the source has an exact known mapping; other shift labels remain unaltered.
- If there are 4 or more verified future duties, reveal more **inline**, 5 at a time for large collections; collapse back to the first 3. Keep the separate "Consultar guardias" navigation only for the advanced duty-management workspace.
- Header count refers to upcoming guardias, not historical rows in the source response. Accounts without upcoming duties are not given false commitments.
- Reuse the institutional Phase 44A chevron/focus/scroll anchoring. Responsive rule stacks date and modality at narrower widths without horizontal overflow.
- Playwright fixtures cover 0, 1, 3, 4 and 12 on-call commitments on 390px and 1366px, with date/aria verification, click/keyboard expand, collapse, independent state, and horizontal overflow. Fixtures are illustrative only.
- Existing guardia detail and permission checks remain mandatory. Live authenticated acceptance and CI are required before merge.
