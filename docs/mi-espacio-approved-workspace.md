# Approved Mi Espacio composition — 15 October 2026

Implements the user's approved Pedro prototype in the existing personal view, using authenticated records for every person. The prototype itself is a reference, not an additional data source.

- Compact identity; research-line memberships and their actual roles beside the avatar, with existing list expansion preserved. Institutional line names remain unchanged.
- Date-led next guardia, operational agenda and larger research column; one column on narrow screens.
- Direct Editar perfil shortcut to the existing authorised editor. Save, discard protection and identity invalidation remain in place.
- Always-visible study/project category labels, accessible inline record details and existing expand-long-list controls.
- Yellow with recorded text for explicitly ongoing states; green for explicitly completed states. Planned, suspended, cancelled, archived, closed and unknown values remain neutral. Closed is not assumed to mean completed.
- Shared navigation, calendar, dossier, publication claims, notifications and permissions remain available. No API, backend or persisted record changes.

Validation: frontend integrity, Vue template compilation and all Mi Espacio node contract tests. Browser smoke requested through GitHub CI; local Chromium terminated with SIGSEGV before loading the tests, so local visual verification could not complete. Existing browser assertions were updated for the deliberate affiliation relocation and semantic date markup.
