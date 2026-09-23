# neumDesk V46.14 — Access Gate 4.2 Changes

## Problem observed in authenticated use

Returning to neumDesk could look as if the login gate had been bypassed: the page briefly displayed **Checking your session / Preparing your workspace** and then entered the application.

The frontend was correctly calling `/api/auth/me`, but the JWT was always stored in `localStorage` after every successful login. The existing **Remember my email** control only governed email prefill; it did not govern session persistence.

## Implemented

- default authentication token storage moved to tab-scoped `sessionStorage`;
- **Remember my email** remains email-only;
- added a separate, unchecked **Trust this browser for up to 12 hours** choice;
- trusted-browser persistence receives explicit issue/expiry metadata;
- trusted-browser sessions found in a new browser session are revalidated but stop at a **Session verified** gate until the user explicitly chooses **Continue to neumDesk**;
- pre-4.2 unbounded localStorage tokens are cleared and require a one-time sign-in after deployment;
- cached user identity is no longer persisted in localStorage;
- logout and backend 401 clear tab session, trusted token, trust metadata and legacy identity cache;
- the loading state now explains the access chain: **Account → Permissions → Workspace**;
- login-only styling lives in `entry46.css`; global `style.css`, Staff Phase 4 and Grounded presentation are unchanged.

## Expected behaviour after deployment

### Normal sign-in (browser trust OFF)
- current tab refresh: session can resume after `/api/auth/me`;
- new browser tab/session: sign-in required;
- browser/session closes: authentication token is not retained by neumDesk.

### Trusted browser (browser trust ON)
- current tab refresh: session can resume after `/api/auth/me`;
- new browser session within the trust window: account is revalidated, then **Session verified** appears;
- departmental records stay hidden until **Continue to neumDesk** is clicked;
- after 12 hours: sign-in is required again on a new browser session.

## Preservation boundary

No changes to:
- Grounded knowledge/routing/action integrity;
- Staff Phase 4 UI;
- global neumDesk UI tokens;
- Supabase schema;
- permission-role semantics;
- Personal Activity;
- Clinical Units / Leave / On-call / Rotations domain behaviour.

`style.css`, `grounded-core.js`, `activity45.js`, `SUPABASE_SCHEMA.sql` and `entry46.js` are byte-for-byte unchanged from Grounded Phase 4.1E.
