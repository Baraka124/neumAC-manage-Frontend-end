# Phase 31B0 · Verify actual Mi Espacio deployment before changing appearance

The hospital desktop screenshots shown on 14 October 2026 visibly differ from the Phase 30 Mi Espacio component that is already merged to main. **Do not infer that the CSS redesign failed** until we confirm what the hospital browser loaded.

## One-command public parity check

From a fresh checkout of the reviewed branch:

```bash
node scripts/mi-espacio-deployment-parity.mjs https://desk.neumact.org/
```

This script fetches only the public site HTML and the two referenced static files:
`mi-espacio/mi-espacio.css`, `mi-espacio/mi-espacio.js`. It checks both `?v=` version keys and SHA-256 content parity against checked-out files. It does not authenticate, read staff details, or call API endpoints. It exits nonzero for mismatches or inaccessible public assets.

If the site redirects to a sign-in page or sits behind a hospital-only network, the script cannot confirm parity. **Do not paste cookies, passwords, browser tokens, exported personal data or clinical details into the script.** Run it only where the anonymous public site is reachable.

## Hospital browser manual check

1. Open the authorized hospital browser session, on Mi Espacio, and record the current viewport width and browser zoom.
2. Open DevTools → Network. Activate **Disable cache** with DevTools open, then refresh. Inspect document and the two static Mi Espacio CSS/JS requests.
3. Confirm the current production version keys. On the checked Phase 30 base they are:
   - `mi-espacio/mi-espacio.css?v=20261014-phase30-editorial`
   - `mi-espacio/mi-espacio.js?v=20261014-phase30-editorial`
4. Compare with the reviewed deployment revision. A mismatch means the hospital view may be a previous deployment or browser cache, **not** evidence of a new layout regression.
5. If version keys match but the content differs, investigate CDN/proxy/service worker caching. Do not edit backend permissions or clinical records to fix caching.
6. When parity is confirmed, capture a new screenshot without exposing personal data and inspect the computed styles of `.me-v9-panel`, `.me-v9-publications`, `.me-v20-quick-bar`: under Phase 30, the former two are restrained/transparent and the toolbar has `display: grid`.

## Next: Phase 31B1 and 31C gates

After a current-source screenshot is available, perform a typography/layout audit at 1366px and actual hospital desktop width (approx. 2048px), preserve readable scholarly measure and do not spread unrelated modules across the full screen. Compare four authorized roles (head, clinician, resident, biomedical engineer), then implement only reproducible defects. Frontend smoke/CI are necessary but not sufficient for authenticated visual sign-off.

The private screenshots are not committed. This is a diagnostic and test-only PR. It deliberately does not modify the working UI, data adapters, permission checks or server contracts. See `docs/mi-espacio-phase31a-hospital-desktop-audit.md` in Phase 31A PR #139 for the full private-evidence audit.
