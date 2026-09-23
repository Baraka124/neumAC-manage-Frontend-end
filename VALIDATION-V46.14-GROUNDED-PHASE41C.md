# V46.14 Grounded Phase 4.1C — Validation

## Result
- 27 regression suites passed.
- 430 PASS assertions/check rows across the full historical chain.
- Dedicated Phase 4.1C collection-rendering suite: 10/10 passed.
- V46.14 DOM-template safety remains green.
- Staff Phase 4 UI Foundation remains green: 24/24.

## UI preservation proof
- Phase 4.1B style.css SHA-256: `6737cee3be2d7d41427b071ba363f9d477d8ca3119ff2a1454dc07c14b7dc942`
- Phase 4.1C style.css SHA-256: `6737cee3be2d7d41427b071ba363f9d477d8ca3119ff2a1454dc07c14b7dc942`
- CSS identical: **True**
- Grounded template markup was not redesigned in this patch. `index.html` changes only cache delivery markers and a non-rendering regression-history comment.

## Collection contract
The following list-style intents now use the existing structured `reslist` renderer rather than long inline name strings:
- `units_overview` / `clinical_units_overview`
- `staff_roster`
- `staff_can_pi`
- `staff_with_phd`
- `departments_overview`
- `hospitals_overview`
- `coverage_areas_overview`

Normal overview requests show a compact first set with the existing **Show more** control. Explicit `list all` requests start expanded.

## Remaining live acceptance
Verify in the authenticated deployment:
1. `clinical units`
2. `list all units`
3. `list all staff`
4. `who can be PI?`
5. `which staff have a PhD?`

The expected behavior is concise summary prose plus structured rows, with no change to the surrounding Staff/Phase 4 visual system.
