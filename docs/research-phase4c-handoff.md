# neumDESK — Research & Research Library Phase 4C handoff
Date: 2026-10-10
Scope: Research and Research Library only
Baseline: `main` following PR #41 (merge `31f35428`).

## Completed and merged
- PR #36: search/dropdown clipping, Library shortcut ownership, and structured-filter clear behavior.
- PR #37: Research introduction hierarchy and Library control readability.
- PR #38: command palette containment on short screens; overlay fixture coverage.
- PR #39: responsive shell-overlay regression coverage.
- PR #40: command palette opener focus restoration, with reader/editor handoff guard.
- PR #41: Library Return to reader / Done now respects unsaved-change confirmation.

## Verification evidence
- Phase 4 tests are part of the frontend integrity workflow.
- PR #40: run 38046070891, smoke and check passed.
- PR #41: run 38046525694, smoke and check passed.
- Source inspection on merged main confirms `closeNewsEditorToReader` guards dirty edits and routes confirmed returns through `_returnNewsEditorToReaderNow`.
- Existing Playwright tests primarily use repository templates and extracted handlers. These checks do not constitute authenticated end-to-end certification.

## Remaining release gates — not claimed passed
1. Authenticated Vue reader → editor → cancel / discard → reader flows, including saving and switching records.
2. Modal focus trap, Escape, backdrop and focus restoration across Research line, clinical study and innovation forms.
3. Privilege checks for clinician, editor, administrator and read-only roles; verify both UI affordances and API authorization.
4. Reader typography, dark-surface contrast, Institutional connections layout, long content, and mobile scroll behavior in actual browser render.
5. API errors, pending save states, and refresh/recovery behaviors.

These open gates must be completed before calling all Phase 4C user journeys fully certified. The current phase can be handed off as a bounded implementation milestone with explicit validation debt.

## Phase 5 — first-tier institutional design review
Goals: research-grade information hierarchy, reliable workspaces, clinical terminology, high readability, refined yet restrained navy/teal institutional language, accessible keyboard and phone behavior, and coherent cross-module rules.

Design guardrails:
- Preserve established visual identity and successful Phase 1–4C improvements.
- Inspect Research and Research Library independently before defining reusable standards.
- Define shared heading structure, spacing/typography scale, surface elevation and drawer/modal behavior; **do not** force all workflows into identical cards.
- No broad redesign or propagation to other modules during the Phase 5 audit.
- Separate verified defects from aesthetic opportunities; benchmark each change at 390, 640, 1366, 1440 and 2048px.
- Reject changes that impair readability, focus/scrolling, permissions, or work continuity.

## Suggested next ticket
Phase 5A: audit Research overview, Research Library index and Library reader against a documented component-by-component institutional-quality rubric; prioritize the reader contrast and uneven empty-space behavior observed in the user's walkthrough; validate each finding with actual computed styles and full-app browser screenshots before modifying production CSS.
