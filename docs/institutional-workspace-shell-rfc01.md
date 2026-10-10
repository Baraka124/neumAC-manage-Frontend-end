# neumDESK — Institutional workspace shell architecture (RFC 01)

**Status:** proposed design contract, no runtime changes. Research and Research Library are reference implementations; cross-module rollout requires separate approval.

## Why the present composition fails

Review of the 11 October screenshots finds competing rows: global Research & Innovation identity, Research-section tabs, a separate Research back/context strip, large navy Clinical Studies masthead, summary metrics and then collection controls. Tabs touch surrounding content, the active underline collides visually with boundaries, and the heading styles of Research and Research Library do not follow one stable contract.

Repo evidence:
- `module-headers.css` globally imposes navy surface, 16px radius, 28–30px padding and 20px bottom gap; other module styles override this with higher specificity and `!important`.
- `research-header-refinement.css` overrides the Research/Library masthead radius to 5px, showing an unresolved global-versus-local contract.
- `research-persistent-navigation.css` inserts its own navigation surface and margin before each nested research page; the Research overview has a separate nav.
- Source `index.html` contains another back/context bar inside the Research collection, duplicating workspace wayfinding.

## Proposed ownership hierarchy

1. **Application shell (global, persistent):** product/workspace identity, global search, account, notifications, cross-module navigation. One owner for positioning and sticky z-index.
2. **Workspace identity (context):** concise area name plus optional operational descriptor. Not a second hero.
3. **Section navigation (same-level destinations):** Research lines, Clinical studies, Clinical innovation, Intelligence. One canonical component, same location in overview, collection and detail. Clear active state; not another card or floating toolbar.
4. **Page header (current destination):** breadcrumb (only when genuinely nested), one page title, short informative supporting line where necessary, and primary/secondary actions.
5. **Content tools:** metrics, search, filters, and record list or reader. These belong to content and scroll with it unless a use case explicitly justifies sticky behaviour.

Do not duplicate the page title in the global shell and main content. Back is for prior navigation; breadcrumb is for hierarchy. Do not use the breadcrumb or a section tab as a workaround for missing cross-module navigation.

## Header variants

**Collection**: compact title, count/qualifier, controls. No oversized navy hero; allow one restrained identity field only when genuinely needed.

**Detail/reader**: parent breadcrumb, record title and verified state metadata, contextual actions. Preserve back/return focus and originating filters.

**Overview**: workspace summary and primary shortcuts, capable of richer editorial composition but following the same title/actions/spacing tokens.

**Analytical view**: title, time/data scope and controls before chart content.

**Library**: same architectural slots as Research; editorial identity may differ inside the content layer, not through a separate navigation grammar.

## Navigation/sticky safety contract

- One navigation owner; no per-module `position:sticky` added without container/stack review.
- If navigation is sticky, reserve its full measured height and safe scroll offset; never permit underline, bottom border or shadow to overlap content.
- Active indicator belongs **inside** the tab's allocated height, never positioned outside its line box.
- Navigation must not cover rows when scrolling or when browser zoom reaches 200%.
- At narrow widths, use a single controlled horizontal track with discoverable overflow, no squeezed labels and keyboard reachable offscreen tabs.
- Support reduced motion, focus-visible, aria-current and restored focus after record close.
- Nested overlays/menus stack above sticky navigation and never behind global shell.

## Visual measurement targets — validate, don't hardcode as universal

- Start with 8px-based vertical rhythm; navigation-to-header breathing space approximately 16–24px, tuned at breakpoints.
- Interactive tab target at least 44px high.
- Main content line length controlled, body text around 14–16px and page titles by responsive type scale.
- Top-level page title is the strongest typographic anchor; section tabs visibly subordinate.
- Use navy intentionally (identity/feature surfaces), not as an automatic full-width block for every page.
- Subtle surface elevation only for meaningful separation, avoiding card proliferation.

## Acceptance tests before any rollout

At 390, 640, 800, 1180, 1366, 1440 and 2048 px:
- Navigate directly from Clinical Studies to Clinical Innovation, including from a record reader.
- No header/navigation collision, orphan underline, document overflow or clipped tabs.
- Scroll through long collections while header, active state, focus ring and record title remain legible.
- Keyboard Tab/Shift+Tab, browser Back, 200% zoom, assistive labels, reduced motion and overlays.
- Verify screenshots and computed geometry using the actual mounted app, not CSS-only fragments.
- Confirm Research Library consistency without forcing its editorial presentation to mimic study records.
- Keep outstanding Phase 4C authenticated/role/persistence gates tracked.

## Proposed rollout

**A. Architecture baseline:** collect computed geometry + screenshots; freeze role ownership and token contract. No restyling across the platform.

**B. Research pilot:** implement unified shell/section-nav/page-header composition in Research only, retire duplicate back/context/header surfaces where warranted, verify mounted + responsive tests.

**C. Library pilot:** align shell and page-header architecture while keeping Library's richer editorial needs.

**D. Governed propagation:** only after pilots, inventory all modules and migrate incrementally without global overrides. Every module must pass functional and visual regression tests.

## References

- Atlassian page header: https://atlassian.design/components/page-header
- Atlassian navigation layout: https://atlassian.design/components/navigation-system/layout
- Nielsen Norman Group tabs: https://www.nngroup.com/articles/tabs-used-right/
- Nielsen Norman Group breadcrumbs: https://www.nngroup.com/articles/breadcrumbs/
- SAP Fiori / Material tabs: https://www.sap.com/design-system/fiori-design-android/v26-4/components/m3-standard-components/tabs
