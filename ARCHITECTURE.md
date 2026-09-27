# neumAC R&I — Public Site Architecture

This is the canonical technical reference after the 2026 consolidation. The objective of the consolidation was to preserve the public site's behaviour and content while removing patch-layer ownership, duplicated presentation, and repeated browser runtime logic.

## Canonical source ownership

```text
/
├── index.html
├── clinical/           # Research portfolio
├── innovation/
├── news/
├── team/
├── line/               # Dynamic research-line detail
├── report/
├── feed/
├── accesibilidad/
├── aviso-legal/
├── privacidad/
│
├── styles/
│   ├── tokens.css      # design tokens only; the single :root owner
│   ├── foundation.css  # reset, document defaults, base typography/accessibility
│   ├── shared.css      # exact cross-page patterns with zero-specificity page scoping
│   ├── components.css  # canonical global components and interaction states
│   └── pages/          # only page-owned layout/variants
│
├── scripts/
│   ├── bootstrap.js    # synchronous pre-render language/config state
│   ├── site.js         # single shared chrome/accessibility runtime
│   ├── api.js          # public API/data renderer
│   ├── animations.js   # opt-in cross-page motion primitives
│   ├── integrity_check.py
│   └── pages/          # page-specific runtime only
│       ├── team.js
│       ├── news.js
│       ├── report.js
│       └── feed.js
│
└── SITE_GUIDE.md       # editorial/design reference
```

## CSS contract

The stylesheet order on the six principal pages is:

```text
tokens.css → foundation.css → shared.css → pages/<page>.css → components.css
```

Responsibilities are strict:

- `tokens.css` owns custom-property design constants. No other stylesheet creates a `:root` token layer.
- `foundation.css` owns document/base behaviour, not page components.
- `shared.css` owns repeated cross-page rules. Subset-specific rules are scoped with `:where(body[data-page=...])` so promotion adds no selector specificity.
- `pages/*.css` owns only page-specific layout or deliberate variants.
- `components.css` owns the canonical global component/state layer.
- HTML and API templates do not own presentation through `style="..."` attributes.
- CSS must not infer semantics by matching inline style text (`[style*=...]`).

## JavaScript contract

- `scripts/bootstrap.js` is the single owner of public runtime configuration (`apiBase`, `siteBase`) and restores persisted language before first paint.
- `scripts/site.js` is the single shared browser runtime for language state, navigation/drawer behaviour, scroll state, header enhancement, keyboard/focus behaviour, cookie state, anchors and reveal safety.
- `scripts/api.js` owns public API/data rendering.
- `scripts/animations.js` is loaded only on pages that opt into its motion primitives.
- `scripts/pages/*` owns behaviour that belongs to exactly one page.
- Executable inline JavaScript is prohibited. Inline JSON-LD remains allowed for structured data.
- `scripts/bootstrap.js` is the only synchronous local script; all other local browser scripts use `defer` and preserve document-order execution.

## Consolidation history

### Phase 1 — canonical CSS foundation

- Retired `core.css` and `polish.css` as architectural owners.
- Established canonical tokens, foundation, components and page stylesheets.
- Removed embedded `<style>` blocks and the obsolete two-tier-header offset assumption.

### Phase 2 — presentation ownership

- Removed 459 HTML `style=` attributes and 119 `style=` attributes from JavaScript-generated markup.
- Retired `[style...]` selector patches.
- Added integrity guards against the return of inline presentation.

### Phase 3 — shared components and runtime

- Promoted 122 cross-page CSS rules and removed 508 repeated occurrences.
- Introduced a canonical shared site runtime for language, drawer, scroll, cookies, anchors and reveal behaviour.
- Reduced principal-page CSS by 22.8% versus the Phase 2 baseline.

### Phase 4 — super-consolidation

- Promoted an additional 237 repeated/base CSS rules representing 571 page-rule occurrences, plus canonical shared `shimmer` and `trigPulse` keyframes.
- Reduced exact cross-page rule duplication among the six principal page stylesheets to five deliberate late-variant cases.
- Retired `header-enhance.js`; its behaviour now shares one `site.js` runtime, one DOM-ready boot and one scroll scheduler.
- Consolidated nav-pill pointer/keyboard behaviour and language synchronization into their existing canonical owners.
- Extracted every remaining executable inline script from HTML. Executable inline-script count is now **0**.
- Moved all browser JavaScript under `scripts/` and all page-specific runtime under `scripts/pages/`.
- Centralized API/site endpoints in `scripts/bootstrap.js` so endpoint configuration has one source of truth.
- Fixed the 404 page's root logo references.
- Replaced the accumulated phase documents with this durable architecture reference.

Measured against the Phase 3 baseline:

| Metric | Phase 3 | Phase 4 | Change |
| --- | ---: | ---: | ---: |
| Principal page CSS bytes | 215,589 | 149,595 | **-30.6%** |
| Total CSS bytes | 354,294 | 341,580 | **-3.6%** |
| Total HTML bytes | 346,790 | 302,394 | **-12.8%** |
| Executable inline script blocks | 19 | 0 | **-100%** |
| Exact duplicated rule groups across principal page CSS | 242 | 5 | **-97.9%** |
| Exact duplicated rule occurrences across principal page CSS | 581 | 10 | **-98.3%** |

## Validation

Before committing changes, run:

```bash
python scripts/integrity_check.py
```

The checker enforces HTML parsing/div balance, local asset resolution, no embedded styles, no inline style attributes, no executable inline JavaScript, no retired CSS/JS ownership, canonical stylesheet ordering, shared-runtime ownership, endpoint single ownership, CSS brace integrity, token ownership and the current contrast floor.

For JavaScript syntax after runtime changes:

```bash
node --check scripts/site.js
node --check scripts/api.js
node --check scripts/animations.js
node --check scripts/pages/team.js
node --check scripts/pages/news.js
node --check scripts/pages/report.js
node --check scripts/pages/feed.js
```

## Deliberately not part of consolidation

The consolidation does not change backend contracts, Supabase/Railway behaviour, research/study/project data semantics, editorial content or the intended visual identity. The next major work can therefore be a visual/experience redesign on top of a stable ownership model rather than another patch layer.

## Phase 5.1B — restrained premium navigation system

The public header is one shared system across every HTML page and is visually owned by `styles/components.css`, with behaviour in `scripts/site.js` and live research-line population in `scripts/api.js`. It uses the real `/logo.svg`, a slimmer institutional shell, a quiet word-only EN/ES control, search, contact, and a compact editorial research surface. The Research word remains a real link to `/clinical/`; its adjacent chevron opens the research-line navigator. Decorative thumbnails, dashboard-like statistics, helper copy such as “Open a line”, duplicate “view all” links, and the public connection-status dot are intentionally excluded.
## Phase 5.2 — final landing page

The homepage is now a page-owned editorial composition rather than a collection of legacy homepage modules. `index.html` owns the semantic section order, `styles/pages/home.css` owns all homepage-only presentation, and live content continues to arrive through `scripts/api.js`. The shared header remains untouched by homepage CSS and therefore stays identical across the public site.

The landing page intentionally contains only six major surfaces: photographic research hero with evidence ledger, live six-line research programme, current publications/articles, innovation spotlight, institutional context, and collaboration/contact. Duplicate stat strips, decorative canvas art, generic cards, redundant accreditation clusters and homepage-only header variants are excluded.



## Phase 5.2 landing-page contract

The landing page is intentionally denser than Phase 5.1: the hero is capped to a laptop-friendly viewport, the six research lines form a compact public research atlas, and recent public content is rendered as a backend-safe editorial pulse. A static agenda surface is reserved for a future governed public-events endpoint. Header ownership remains shared and untouched.


## Design system governance

`DESIGN_PRINCIPLES.md` is the canonical cross-page editorial and visual reference. Page implementations should reuse its principles while keeping shared chrome in the common CSS/JS owners.

## Phase 5.4 research-page contract

`/clinical/` is the canonical portfolio overview. It may expose the full six-line taxonomy, but only as an orientation index. Detailed scientific content belongs to `/line/?id=...`.

The public study portfolio uses progressive disclosure: filters are secondary, the first study set is visible immediately, and additional records expand on intent. Research-page visual ownership remains in `styles/pages/clinical.css`; the header and footer continue to use the shared public system.


## Phase 5.5 research editorial contract

The Research page renders live research lines as editorial chapters through `scripts/api.js` and `styles/pages/clinical.css`. Descriptions, coordinator metadata and active-study counts come from the public research-line endpoint. Internal line codes remain available to filters but are not the primary visual identity. The page must not expose internal-platform terminology in public copy.

## Phase 5.6 research tightening contract

The Research page now treats scientific copy as the primary visual material. Decorative pseudo-scientific motifs, design-commentary pullquotes and campaign-style collaboration slogans are excluded. Research-area descriptions remain visible in the overview because they are necessary for selection, while deeper capabilities and evidence remain on the individual line pages.

Contact disclosure is controlled by an explicit button in `scripts/site.js` rather than an ambiguous expansion affordance. Study rows use public research-area names instead of internal-looking line codes. The page remains backed by the same public API contracts; this phase changes presentation and interaction only.

## Public copy normalisation

Backend content can outlive public identity changes. The public rendering layer therefore normalises known legacy institutional naming before output, while preserving the backend source record. This is a presentation safeguard, not a data mutation.

