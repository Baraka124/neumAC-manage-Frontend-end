# neumDesk V46.3 — Staff loading diagnostic hardening

Latest complete frontend baseline: **V46.3**. Built directly on V46.2 and retaining the V44 institutional entry, V45 Grounded/personal activity work, V46 editorial entry, V46.1 partial-source loading hardening and V46.2 Clinical Units scope repair.

## What changed from V46.2

Only two runtime files changed in the V46.3 frontend hotfix:

- `app.js`
- `index.html`

The V46.3 change was diagnostic/hardening work around startup and Medical Staff loading. It did not redesign a module and it did not change the backend.

`app.js` now treats Medical Staff as a critical source, publishes valid staff as soon as it arrives, loads historical staff/hospitals/clinical units independently with `Promise.allSettled`, and surfaces a real load error instead of silently treating an API failure as an empty staff directory. Main startup batches are also isolated with `Promise.allSettled` so one failed source cannot cancel unrelated loaders.

`index.html` identifies the build as V46.3 and requests `app.js?v=46.3-staff-loader` for cache separation.

## Production finding after V46.3

V46.3 exposed the real live failure: `/api/medical-staff` was returning an authorization error. The production account was authenticated but did not yet have explicit module permission rows. Access was restored through production `user_permissions` records; **no `app.js` or backend `index.js` replacement was required to restore staff loading**.

The permission repair is database state and is therefore not part of this frontend ZIP. Credentials, user IDs and production permission SQL are intentionally not included here.

## Current backend reference

The current backend supplied alongside this baseline is a separate production source (`index (14).js`) identifying itself as **Version 6.0 — Backend Plan V44 Implemented**. It remains outside this frontend deployment ZIP.

Relevant backend capabilities already available for the next Clinical Units work include training units, unit-specific staff membership, staff-to-unit lookup, resident rotations, rotation availability/capacity checks, medical staff, departments and absence records.

## Runtime installation set

Keep the runtime set together:

```
index.html
app.js
style.css
activity45.js
activity45-ui.css
entry46.css
entry46.js
entry-highlights.js
entry-art-research.svg
entry-art-innovation.svg
entry-art-community.svg
```

The `activity45` and `entry46` filenames identify the feature generation that introduced those assets; they are still part of the current V46.3 runtime and are not older replacements.

## Documentation and regression material

This complete baseline intentionally retains historical release notes/tests so the evolution remains traceable:

- `README-V43.md`
- `README-V43.1.md`
- `README-V44.md`
- `README-V45.md`
- `README-V46.md`
- `README-V46.1.md`
- `README-V46.2.md`
- `README-V46.3.md`
- `VALIDATION-V45.md`
- `test-v431.cjs`
- `test-v44.cjs`
- `test-v45.cjs`
- `test-v46.cjs`
- `test-v461.cjs`
- `test-v462.cjs`
- `test-v463.cjs`
- `EXAMPLE-personal-activity.html`
- `MANIFEST-SHA256.txt`

## Validation

All inherited executable suites still pass on this V46.3 baseline:

- V43.1: 12
- V44: 11
- V45: 26
- V46: 12
- V46.1: 7
- V46.2: 7

That is **75 inherited checks**, plus the V46.3 packaging/regression checks in `test-v463.cjs`.

Live browser, responsive rendering and authenticated end-to-end behaviour are still validated in deployment rather than by these Node regression files.

## Current product state / next batch

The production access incident is closed. The next product batch is **V46.4 — Clinical Units Operational Workspace · Phase 1**.

V46.4 should start from this complete V46.3 baseline and focus on:

1. Clinical Units module header and unit context/navigation.
2. Team & Availability using real unit membership, staff state and absences.
3. Initial operational capacity state and truthful loading/empty/error presentation.

Resident Planning, rotation conflict intelligence and the deeper Clinical Units action layer should continue in the following Clinical Units batches rather than being mixed into the first pass.
