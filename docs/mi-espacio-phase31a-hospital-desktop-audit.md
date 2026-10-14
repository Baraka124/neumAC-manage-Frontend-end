# neumDESK · Phase 31A — Hospital desktop evidence audit

**Status:** findings and acceptance specification only. **Scope:** personal workspace first; compare with Overview and Clinical Staff to evaluate a consistent institutional product. **Date:** 2026-10-14.

## Source of evidence and privacy

- Three real hospital desktop screenshots, shared privately in the development conversation: **Mi Espacio** (biomedical engineer / administrator), **Overview**, and **Clinical Staff** at about 2048 × 1020 pixels.
- The screenshots are **not committed** to the repository because the originals include identifiable professional and account data. This document deliberately omits names, emails, employee identifiers and personal records.
- The browser's exact zoom, display scaling, network responses, loaded asset hashes and authenticated DOM are unknown. These are visual observations, not proof that behavior is correct for all users.
- Repository baseline: GitHub `main` after Phase 30 PR #138 merged with successful frontend CI; `mi-espacio/mi-espacio.js`, `mi-espacio/mi-espacio.css`, and `index.html`.
- **Important:** isolated role tests use fixtures to validate presentation but do not establish what an authenticated hospital browser renders.

## Critical release observation: source-versus-screen mismatch

The supplied hospital screenshot shows Mi Espacio headings such as `Mi investigación`, `Mis publicaciones` and the profile action `Mi perfil completo`. The current `main` component renders `Investigación`, `Publicaciones` and `Perfil profesional`. The screenshot also shows prominent boxed research/publication surfaces and older-looking toolbar/icon treatments, whereas the merged Phase 30 stylesheet introduces borderless editorial sections and a grid of labelled quick tools.

**Conclusion:** high-confidence **observed divergence** from current source. Cause unverified: the page could be an earlier deployment, a retained asset/browser cache, or another version of the application. Do not attribute it to an individual CSS selector without verifying the loaded file URLs and computed styles. The footer reporting that frontend and backend are matched does not by itself prove that Mi Espacio assets match the latest GitHub commit.

### A0 · Deployment parity verification before design acceptance

1. Confirm the deployed source revision, deploy time and served `index.html` for the hospital browser.
2. In that browser's developer tools, inspect Network with **Disable cache**, then reload and record the loaded `mi-espacio.css?v=` and `mi-espacio.js?v=` values, response status, response content and any service worker/controller. Distinguish an old deployment from a local browser cache.
3. On the actual Mi Espacio, verify headings `Investigación`, `Publicaciones` and `Perfil profesional` (for the current code) and check computed styles for `.me-v9-panel`, `.me-v9-publications`, `.me-v20-quick-bar`: Phase 30 specifies transparent, low-border overview/publications and a grid quick bar.
4. Compare one refreshed 100%-zoom desktop screenshot at the same window width, then at 1366 px and a real mobile width. Never force cache purges or deploy/revert without evidence.
5. Preserve account-scoped and role-scoped data: no fake records, personal information exposure, broad data fetches, or backend changes during this gate.

## Severity-ranked findings

| ID | Priority | Evidence from supplied screenshot(s) | Diagnosis and bounded follow-up |
|---|---|---|---|
| F01 | **P0** | Mi Espacio wording and card treatment visibly differ from current `main` implementation | Verify deployment/asset revision and computed CSS before further appearance changes. See A0. |
| F02 | **P0 / data trust** | Clinical Staff header describes 24 attending + 4 resident; Overview divides the same total 28 into 22 attending + 4 resident + 2 other/unclassified | The staff **category breakdowns differ**, not their total. Establish each view's inclusion and type-mapping definitions with the authorized data owner; don't silently relabel two records or change backend in a UI pass. |
| F03 | **P0 / semantic trust** | Overview panel titled “On-call · Next 3 Days” shows an on-call item dated five calendar days after the shown date | Determine whether the widget means next three dates, next three entries, or next three on-call days; fix wording or the filter only after validating intended semantics. |
| F04 | **P1** | Mi Espacio sits in a much narrower isolated desktop content column; Overview spans most of the work area, Clinical Staff has an intermediate frame | Establish a shared shell grid/alignment principle with deliberately constrained reading measure; do **not** merely stretch every research record to full viewport. |
| F05 | **P1** | At large hospital desktop resolution, section metadata, statuses, supporting copy and controls appear very small relative to abundant empty space | Measure actual computed font sizes and effective zoom/scale. Adopt readable desktop tokens and a minimum 14–15 px body where appropriate, 13–14 px quiet metadata; confirm contrast rather than inferring CSS pixels from screenshots. |
| F06 | **P1** | Clinical Staff and Overview use mixed English and Spanish while Mi Espacio is largely Spanish | Select Spanish default for user-facing copy across the shared shell; retain meaningful proper names and unaltered clinical concepts. Localization is an explicit cross-module phase, not a casual find/replace. |
| F07 | **P1** | Clinical Staff staff-name/metadata text appears distinctly monospaced compared with surrounding headings/body | Audit computed font-family and global selectors in the live DOM. Use mono typography only for deliberate record identifiers, not human names, department names or clinical descriptions. |
| F08 | **P1** | Mi Espacio visually accumulates bright independent cards for identity, research, publications, communications, photo notice and exports | If A0 confirms this is still the served version, enforce the editorial hierarchy already specified in Phase 30. Avoid stacking identical white bordered rectangles as the default structure. |
| F09 | **P1** | Identity, actions and the first relevant work are separated by multiple strong surfaces; the first fold under-uses the desktop layout | Give the verified work priority: identity concise, then relevant guardia/rotation or research record; utilities secondary. Respect server-derived availability and role relevance. |
| F10 | **P1** | The “Acciones rápidas” control consumes a disproportionate horizontal strip, followed by unrelated equally weighted icon buttons | Replace neither functionality nor actions; compose as small labelled secondary tools, align action weight to task importance, retain 44 px keyboard/touch targets. Recheck whether Phase 30 already solves it once properly deployed. |
| F11 | **P1** | Screenshot shows icon-only or emoji-style bells/calendar and mixed treatment alongside text tools | Validate actual glyph source, `aria-label`, tooltip and keyboard behavior; prefer a restrained consistent icon library and visible text where action would otherwise be unclear. |
| F12 | **P1** | Research items have long official study/project titles and small subdued role/status metadata | Preserve exact titles and order; provide comfortably measured wrapping, legible secondary context and selective disclosure. Do not truncate critical record names or infer a research role. |
| F13 | **P1** | Publication empty state occupies a large separate panel while a publication-claim action remains prominent | Empty is valid data. Reduce empty-state visual weight, provide a clear optional authorized claim action, and never fabricate publication records. |
| F14 | **P1** | Personal photo prompt appears as an additional wide banner after work sections | Keep dismissible and accessible, but present as optional profile maintenance rather than a near-primary work task; do not assume every account needs a photograph. |
| F15 | **P1** | Mi Espacio displays repeated possessives in the hospital view, while newer source removed several | Adopt concise institutional Spanish labels consistent with Phase 29; verify deployed wording first rather than layering more copy overrides. |
| F16 | **P2** | “Perfil vinculado,” research count and leadership count appear as several chips competing with professional name and title | Maintain explicit verification but reduce decorative pill proliferation and ensure name/role remain primary. |
| F17 | **P2** | Two search interfaces (“Search…” globally and “Search workspace” in the sidebar) lack visible distinction of scope | Explain or differentiate global search versus navigation search; no backend search integration changes in visual pass. |
| F18 | **P2** | Clinical Staff table repeats low-contrast “No near-term recorded event” across most rows | Retain the meaning (no visible event is not availability). Test a quieter cell presentation without implying an affirmative negative clinical status. |
| F19 | **P2** | Header search, page title, available desktop area and module content margins are inconsistent between three screenshots | Audit spacing tokens and content alignment at wide screen; keep one stable top-bar/masthead geometry and module-specific reading widths. |
| F20 | **P2** | Overview features multiple strong KPIs and tasks; Mi Espacio could drift into repeating the same organization-level analytics | Enforce division of labor: Overview = departmental briefing; Clinical Staff = authoritative roster/search; Mi Espacio = verified personally relevant work and professional identity. No additional duplicate summary widgets. |

## Strengths worth preserving

- A clear, stable dark sidebar with meaningful grouping and recognisable brand; the general navigation location is predictable.
- Overview already gives useful department-level operational signals rather than a blank or merely decorative landing page.
- Clinical Staff combines roster search, role filtering, activity signal and record status into a useful operational table.
- Personal research records in the hospital screenshot are **real linked work**, with explicit scientific roles and progress; that is the right core for an engineer/researcher view.
- Empty publication states and unavailable personal duty information should remain truthful; do not fill empty space with synthetic data.

## Accepted roles and the limits of this audit

Only the **biomedical engineer / administrator** Mi Espacio view appears in these three screenshots. We **cannot** declare department head, clinician or resident **real-profile visual acceptance** on this evidence. Existing simulated role tests are useful regression gates but are not substitutes for authorized clinical accounts. Invite additional screenshots or supervised authenticated review for each role when ready; no screenshots need to be committed or publicly uploaded.

## Phase 31B proposal — after A0

**B1 — Correct what is shipped.** Resolve the asset/revision mismatch; verify Phase 30 CSS and copy in the hospital browser. No further CSS layering until this gate is clear.

**B2 — Desktop visual cleanup.** Address F04–F16 within Mi Espacio using a shared shell baseline, a quiet editorial rhythm, rational tool grouping and accessible typography. Work on `mi-espacio/mi-espacio.css` and Vue markup only if reproducible after A0. Preserve original project titles, role mappings, adapters and handlers.

**B3 — Cross-module design ticket.** Record F06, F07, F17–F19 as follow-up modules; do not enlarge the scoped Mi Espacio PR to redesign Clinical Staff or Overview. F02 and F03 are separate **semantic/data verification gates**, not CSS tickets.

## Phase 31C acceptance rubric

- **Release correctness:** deployed revision and asset query versions match reviewed `main`; screenshot reflects loaded implementation; no stale CSS/JS under normal reload.
- **Four personal roles:** head, attending clinician, resident and biomedical engineer display appropriate **authorized verified records** and no invented responsibilities; admin duties only where authorized.
- **Desktop geometry:** measure 1366, 1600, 1920/2048 wide windows at known zoom; columns purposeful, no accidental stranded narrow canvas or runaway full-width scholarly text.
- **Typography:** human names in reading font, meaningful heading progression, legible metadata, acceptable contrast, stable long project title wrapping.
- **Actions:** inline disclosures preserve scroll/focus and arrow affordance, 44 px interaction targets, reduced-motion behavior, keyboard flow, no redundant primary buttons.
- **Data safety:** unknown/no duty or publication remains unknown/empty; unauthorized 403 remains denial; official research lines, record roles and counts remain exact to their trusted sources.
- **CI:** frontend contracts and existing Playwright tests pass. Real authorized browser walkthrough and PDF print pagination remain manual gates.
- **Scope:** if the hospital view proves already up to date and the screenshot predates deployment, re-audit the freshly refreshed layout before prescribing changes.

## Decision

**Phase 31A: complete as an evidence-led audit. No product code changes in this phase.** Phase 31B should begin only after verifying A0. This is how we avoid a “fix” to a version the hospital has not actually loaded.
