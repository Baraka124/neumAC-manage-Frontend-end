# Phase 29 — Mi Espacio typography and editorial pass

Based on main after Phase 28E (PR #136). This pass responds to the administrator screenshots: monospaced professional metadata, competing headings, repeated possessives, oversized tools and raw role labels in the dossier.

## Changes

- Scoped DM Sans reading typography, a distinct identity/section/item hierarchy, valid font declarations and quieter activity metadata.
- Corrects two production cascade collisions: `#app [class*="-id"]` also matches identity containers; global important h3 rules flatten the component hierarchy. Overrides remain inside Mi Espacio; identifier typography elsewhere is unchanged.
- Short section labels: Perfil profesional, Agenda, Investigación, Publicaciones, Guardias and Rotaciones. Removes redundant section eyebrows and the responsibility banner.
- Compact labelled toolbar, with 44px targets and existing focus/disclosure behavior. Removes decorative emoji from the toolbar and secondary export controls.
- Dossier: larger, calmer heading hierarchy, readable metadata, page-break hints and existing Spanish research-role labels. Source department names remain unchanged. Browser print headers/footers are still controlled by the print dialog.
- Both component stylesheet and script cache keys updated.

No endpoints, authorization, adapters, persisted data or clinical workflow calculations changed.

## Evidence and limits

- 95 Mi Espacio Node contract tests pass; Vue template compiles; JavaScript syntax and frontend integrity pass.
- 45 targeted browser tests cover personal-role displays, guardia navigation, workspace return/focus, denied access, responsive geometry and the production cascade.
- The new regression fixture loads every local stylesheet referenced by index.html, in production order. Six cases exercise clinician and biomedical-engineer profiles at 390, 768 and 1366px. They verify readable fonts, heading hierarchy, touch targets, overflow and workspace navigation. The engineer desktop case also checks dossier role translation and print typography.
- Rendered synthetic desktop/mobile pages and print-mode dossier inspected. Browser fonts may fall back to installed system sans when the external font service is unavailable.
- Screenshots supplied by the user establish the baseline, not acceptance of this revision. Authenticated administrator/clinician/resident acceptance and actual browser PDF pagination remain pending. No user screenshots or personal records are committed.
