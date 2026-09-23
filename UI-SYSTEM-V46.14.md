# neumDesk V46.14 — Phase 4 UI Foundation

## Purpose

This pass extracts the visual grammar proven in the Staff directory and canonical Person profile into reusable `nd-*` component contracts. It is intentionally **presentation-only**: the Staff lifecycle, Supabase schema, registration/edit flows, rotation semantics, permissions contract, sync contract, Grounded action integrity and reporting model are unchanged.

Phase 4 is implemented in the release artifact. Authenticated browser validation remains the production acceptance gate for the four representative Person profiles: Attending, Internal Resident, Rotating Resident and External Resident.

## Canonical component families

### Workspace and context
- `nd-workspace` — module-owned content plane.
- `nd-context-strip` — inherited/filter context without introducing a second breadcrumb.
- `nd-hero`, `nd-hero__copy`, `nd-hero__actions` — contextual module hero.
- `nd-eyebrow` — consistent metadata/section label typography.

### Controls
- `nd-btn`, `nd-btn--accent`, `nd-btn--inverse` — primary action grammar.
- `nd-toolbar`, `nd-toolbar__actions` — action/view toolbar.
- `nd-segmented` — compact mutually exclusive view switch.
- `nd-filterbar`, `nd-search` — filtering/search surface.
- `nd-menu`, `nd-menu--row` — menu/popover shell.

### Operational data
- `nd-table-shell`, `nd-table` — operational table surface.
- `nd-identity` — person identity block.
- `nd-context-list`, `nd-context-item` — current/next operational context.
- `nd-status` — record-state semantics, not inferred real-time availability.
- `nd-card-grid`, `nd-person-card` — browse-oriented identity cards.
- `nd-compact-list`, `nd-compact-row` — dense directory presentation.

### Canonical Person
- `nd-person-drawer`, `nd-person-rail`, `nd-person-main`, `nd-person-head`, `nd-person-body`.
- `nd-tabs`, `nd-view`.
- `nd-section`, `nd-section-head`.
- `nd-state-grid`, `nd-state-card`.
- `nd-timeline`, `nd-timeline-item`.
- `nd-kv-grid`, `nd-record-list`, `nd-record-row`, `nd-record-meta`.
- `nd-chip-row`, `nd-contact-grid`, `nd-empty-state`, `nd-tag`.

## Visual invariants

1. **Meaning before decoration.** Status colors are semantic and cannot be used to imply availability when only record state is known.
2. **Crisp surfaces.** No backdrop blur or glass haze is introduced.
3. **Readable support text.** Operational metadata/labels on the migrated Staff/Person surfaces have an 11px floor; most supporting record text is 11.5px.
4. **One focus language.** Keyboard-focus treatment is shared across buttons, tabs, menus, records and cards.
5. **One control rhythm.** Standard controls use a 40px baseline height and consistent radii.
6. **One Person model.** Internal, Rotating and External resident variants remain semantic adaptations of the same Person shell.
7. **Compatibility first.** `staff46-*`, `pp2-*` and `pp3-*` classes remain in markup during extraction so no existing behavior or test selector is silently removed.
8. **No runtime rewrite.** `app.js`, `grounded-core.js` and `activity45.js` remain byte-for-byte unchanged in this Phase 4 implementation.

## Promotion hardening

The implementation pass after the candidate adds:
- a corrected CSS comment boundary so the `nd-*` foundation is guaranteed to parse as CSS rather than sitting behind an invalid prelude;
- `aria-pressed` state on Table / People / Compact selectors;
- Space-key activation and `role="button"` for interactive rows/cards;
- roving tab focus, `aria-labelledby` and focusable tab panels for the canonical Person profile;
- an `aria-live` result count for filtered staff views;
- overflow, long-name, responsive-density and mobile record-row hardening;
- no change to Staff domain calculations, data loading, writes, permissions, Grounded or Personal Activity runtime behavior.

## Migration rule for other modules

Do not copy the Staff CSS under another module prefix. When a module reaches semantic stability, map its existing markup to the appropriate `nd-*` contract, then remove only genuinely redundant module-local presentation rules after live comparison. Domain-specific semantics remain domain-specific.

## Phase 4 production acceptance gate

Before production acceptance:

- open one Attending profile;
- open one Internal Resident profile;
- open one Rotating Resident profile;
- open one External Resident profile;
- verify Overview / Work & training / Schedule / Research / Profile tabs;
- verify keyboard focus and Escape close;
- verify Staff Table / People / Compact views;
- verify responsive layout at desktop, tablet and mobile widths;
- rerun the complete V43.1 → V46.14 regression suite and DOM-template safety test.

Only after those checks should the same component vocabulary be migrated into Leave, Clinical Units, Research and other modules.
## Automated checkpoint

The complete historical suite has been rerun after promotion hardening, including browser-DOM template safety and the expanded Phase 4 contract. The final pass also fixes the malformed Phase 4 CSS comment boundary found in the candidate, adds keyboard/ARIA hardening for directory views and Person tabs, and keeps all runtime files byte-for-byte unchanged. Live authenticated four-profile comparison remains the production acceptance gate.
## Grounded intelligence extension — Phase 4.1B

Grounded is the first non-Staff surface to adopt the Phase 4 primitives while adding intelligence-specific patterns. The goal is not to force chat/analytics into Person components; it is to share control, focus, typography, context and evidence grammar.

### Reused primitives
- `nd-toolbar`, `nd-btn` — header/action rhythm.
- `nd-context-strip` — active/pinned object context.
- `nd-empty-state` — truthful no-result and unavailable-result states.
- shared 40px control baseline, focus ring and 11px meaningful metadata floor.

### Intelligence-specific contracts
- `nd-intelligence-overlay`, `nd-intelligence-shell`, `nd-intelligence-head`, `nd-intelligence-composer`.
- `nd-source-health` — retrieval/source readiness.
- `nd-answer`, `nd-answer-card`, `nd-answer-question`, `nd-answer-scope`.
- `nd-evidence-strip`, `nd-evidence-records`, `nd-evidence-reason`, `nd-evidence-warning`.
- `nd-proposal` — consequential action proposal/check/confirmation presentation.

### Grounded UI invariants
1. The answer is primary; evidence is visible but visually subordinate.
2. Unknown/partial source state cannot be styled as a verified result.
3. Source scope is rendered from the typed knowledge envelope when available.
4. Trace/Teach are secondary utilities, not primary conversation chrome.
5. No visible cloud/mist/glass metaphor or backdrop blur is used in the converged workspace.
6. Modal behavior includes labelled dialog semantics, focus containment, Escape close and focus return.
7. Legacy Grounded classes remain temporary compatibility hooks until later extraction removes them safely.

