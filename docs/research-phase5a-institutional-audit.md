# neumDESK · Phase 5A institutional design audit
Date: 2026-10-10
Scope: Research, Research Library, Library reader. Reference: user's 76-second desktop walkthrough, latest main, style.css, research-visibility.css and Phase 4C handoff.

## Assessment method
Expert heuristic scoring, 0–10, not a usability study. Recorded video establishes desktop compositions; CSS establishes authored typography and layout. Mobile, computed contrast and keyboard behavior require running-browser validation.

| Dimension | Research | Research Library | Reader |
|---|---:|---:|---:|
| Information hierarchy | 8.0 | 7.5 | 6.5 |
| Institutional header | 8.5 | 8.5 | 7.0 |
| Typography and readability | 7.0 | 7.0 | 6.0 |
| Information density | 7.5 | 7.0 | 5.5 |
| Spacing and composition | 8.0 | 7.5 | 5.5 |
| Surface consistency | 8.0 | 8.0 | 6.5 |
| Responsive evidence | 7.0 | 7.0 | 6.0 |
| Accessibility evidence | 6.5 | 6.5 | 5.5 |

## Evidence and prioritized hypotheses
**P1 Reader, dark space and connection heading.** The video (approximately 48 seconds) displays extensive dark negative space and a faint Institutional connections heading. Reader CSS defines `.nrd-v28-connections>header span` with `color:var(--rl-ink,#153a52)`; actual computed colour/background and cascade must be inspected in the live viewport. Do not patch based on fallback alone. Inspect section geometry, source content, and scroller before changing layout.

**P1 Secondary research text.** `style.css` defines `.rv31-pulse-kicker` at 10.5px, pulse descriptions at 11px, and section descriptions at 12.2px. On video these are relatively small. Test a limited readable scale in context, never blanket-increase all metadata.

**P2 Header/action hierarchy.** Research and Library have consistent navy mastheads. Audit masthead title, intro, primary action, counts and subordinate navigation to prevent competing hierarchy. Preserve current visual identity.

**P2 Lists.** Study and Library rows combine record identity, status and supporting metadata; test first-glance recognition of record, governance state and next action. Preserve information rather than compress further.

**P2 Responsive and keyboard.** Prior Playwright tests exercise selected fixtures but do not establish complete authenticated mobile functionality. Check 390, 640, 1366, 1440, 2048px and short-height 800×450, including reader scroll, overlay navigation and focus.

## Recommended scoped implementation sequence
1. **5B reader diagnostics**: reproduce exact dark-section contrast/geometry in running Vue, capture computed styles and screenshot. Fix only verified visual defects; add Playwright regression at desktop and phone.
2. **5C typography**: calibrate 10.5–12.2px operational metadata against reading/task importance, with controlled responsive tests.
3. **5D masthead and record hierarchy**: define shared header rules and task-based density without force-fitting different modules into identical cards.
4. **5E institutional acceptance**: compare before/after reader, Research, Library screenshots, benchmark keyboard and viewport accessibility, and record approved reusable standards.

## Retained Phase 4C release gates — OPEN
- Real authenticated Vue reader → editor → dirty cancel/confirm → reader transitions, including persistence and error handling.
- Research line, clinical study and innovation dialogs: modal Escape, focus trap/restore, backdrop, save/discard, scrolling.
- Roles: clinician, editor, administrator and read-only: UI visibility **and** backend authorization.
- Reader computed colours, content scroll, long records, nested navigation across viewports.
These are not cleared by passing static/source-backed Playwright tests.

## Guardrails
No broad redesign. No change to backend or permissions as part of visual audit. No propagation to other modules until tested and approved. Record reproducible evidence before changing CSS. Prefer paired before/after screenshots and enforce regression checks.
