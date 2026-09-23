# neumDesk V46.14 — Grounded Phase 4.1D validation

## Automated validation

- Full historical/regression chain: **28 suites · 442 checks passed**.
- New Grounded Phase 4.1D collection-density suite: **12/12 passed**.
- Browser-DOM template safety: **7/7 passed**.
- Staff Phase 4 preservation: **24/24 passed**.
- Grounded Phase 4.1A knowledge contract: **16/16 passed**.
- Grounded Phase 4.1B UI convergence: **18/18 passed**.
- Grounded Phase 4.1C collection semantics: **10/10 passed** after compatibility update for the later cache marker/extension.
- The newly appended 4.1D CSS block parses cleanly with PostCSS.

## CSS preservation note

The inherited V46.14 stylesheet contains a **pre-existing** literal escaped-newline defect in the older V46.12 Clinical Units CSS block (line ~22033), so parsing the *entire* legacy stylesheet with PostCSS fails before reaching Phase 4.1D. The same failure exists in the untouched 4.1C stylesheet. 4.1D does not modify that block because this patch is intentionally isolated from Clinical Units and other module UI.

Validation confirms the complete 4.1C `style.css` is an exact byte prefix of the 4.1D file; only the final Grounded-collection-scoped block is appended.

## Live acceptance still required

After deployment, verify in the authenticated application:

1. `clinical units` → five records initially + **Show 10 more**.
2. Expanding the preview → all records + **Collapse list**.
3. `list all clinical units` → all records immediately, with no redundant list-collapse control.
4. Codes render as right-aligned badges rather than text joined to the unit title.
5. Scope appears as one compact line, not an Answer Scope card.
6. Complete source provenance is visually compact; partial source warnings remain obvious.
7. Staff screen and all non-Grounded module UI remain visually unchanged.
