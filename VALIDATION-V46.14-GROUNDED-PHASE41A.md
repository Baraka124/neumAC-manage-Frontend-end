# V46.14 Grounded Phase 4.1A — Validation

## Scope
Knowledge/source precision only. Staff Phase 4 UI remains intact; Grounded visual convergence is deferred to 4.1B.

## New invariants
- unrelated source failures cannot globally pause independent read intents;
- required source failures do block the affected answer;
- answer metadata uses `grounded.answer.v1`;
- Teach cannot outrank a conflicting strong route;
- near-tie identity matches clarify;
- ranking periods are explicit;
- existing guarded write workflows remain unchanged.

## Automated validation
Run `node test-v4614-grounded41a.cjs` plus the full V43.1→V46.14 regression chain.

## Remaining acceptance gate
Authenticated-browser validation should intentionally simulate one failed source and verify that independent Grounded questions continue to answer while dependent questions disclose the exact unavailable source. Phase 4.1B must then validate the new knowledge envelope in the visible evidence/scope UI.
