# neumDesk V46.14 — Browser DOM Template Integrity Contract

## Why this exists

neumDesk currently uses an **in-DOM Vue template**. The browser parses `index.html` before Vue compiles the template. A literal `<` comparison operator inside a Vue directive attribute or `{{ ... }}` interpolation can therefore be interpreted as HTML syntax before Vue sees the expression.

That browser-level mutation can move or split nodes and later surface as Vue production compiler error `compiler-30` (an apparently invalid `v-else` / `v-else-if` relationship).

The Staff Phase 3.1 production failures exposed that this was a **release-wide template-safety problem**, not a Staff-only problem.

## Mandatory release invariants

1. No raw `<` comparison operator is permitted inside Vue-bound HTML attribute expressions in `index.html`; encode it as `&lt;`.
2. No raw `<` comparison operator is permitted inside moustache interpolation expressions; encode it as `&lt;`.
3. Encoding is source-level only. The browser decodes `&lt;` back to `<` before Vue evaluates the JavaScript expression, so application semantics do not change.
4. `v-else` / `v-else-if` chains must remain structurally valid after browser HTML parsing, not only in source text.
5. Literal local `src` / `href` dependencies must exist in the release package. Dynamic Vue-bound URLs are excluded from that audit.
6. JavaScript syntax tests are insufficient for an in-DOM template. DOM-template safety is a separate release gate.

## Permanent regression coverage

`test-v4614-template-dom.cjs` blocks raw `<` operators in Vue template attributes/interpolations and checks the certificate branch that originally exposed the production failure.

## Current checkpoint

- 369 historical/regression checks pass across V43.1 → V46.14.
- 7 dedicated DOM-template safety checks pass.
- Raw `<` comparisons in Vue-bound attributes: 0.
- Raw `<` comparisons in moustache expressions: 0.
- Missing literal local dependencies: 0.
- Browser-parsed DOM template compile smoke: **PASS** using the locally available Vue 3.5.13 compiler as an additional structural cross-check. Production still targets Vue 3.4.21.
- No backend, Staff lifecycle, resident taxonomy, permission model, sync behavior, or stored data semantics changed by this fix.
