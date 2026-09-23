# neumDesk V46.14 — Access Gate 4.2

## Why this checkpoint exists

Authenticated browser review showed that neumDesk could appear to bypass the login gate on return visits. The frontend was validating `/api/auth/me`, but every successful login stored the JWT in `localStorage` regardless of the **Remember my email** setting. As long as that token remained valid, a later visit could validate and open the workspace automatically.

The label and the persistence policy therefore did not match.

## Access Gate 4.2 contract

### Default session

- JWT is stored in `sessionStorage`, not `localStorage`.
- A normal login therefore belongs to the current browser-tab session.
- Refreshing that tab may restore the session after `/api/auth/me` validation.
- A new browser session without explicit trust does not silently recover the token.
- `Remember my email` remembers only the email address.

### Optional trusted browser

A separate, unchecked control allows the user to trust the browser for **up to 12 hours**.

- The token may then be retained in `localStorage` with bounded trust metadata.
- On a new browser session, neumDesk validates the account with `/api/auth/me` but does **not** expose departmental records automatically.
- The user sees a verified-session gate and must explicitly choose **Continue to neumDesk**.
- An expired or malformed trust record is cleared and requires sign-in.

### Legacy-session migration

A pre-4.2 localStorage token without the new bounded trust metadata is not silently accepted. It is cleared and the user is asked to sign in again once.

### Identity handling

Cached user identity is session-only and is never used to grant access. `/api/auth/me` remains the authority before workspace access.

### Session invalidation

A backend `401` and explicit logout clear:

- tab session token;
- tab user cache;
- trusted-browser token;
- legacy cached user;
- trust metadata.

## Gate presentation

The right-hand access panel now distinguishes:

1. **Account** — identity validation;
2. **Permissions** — permission scope returned by the backend;
3. **Workspace** — authorised records loading.

A trusted-browser return displays a separate **Session verified** state rather than immediately revealing the application.

## Security boundary

This is a frontend/session-persistence hardening checkpoint. It does **not** replace backend security.

The current project artifact documents JWT middleware and `/api/auth/me`, but the backend source was not available in the accessible project/GitHub connection during this checkpoint. Therefore this release does **not** claim to have independently verified:

- JWT server-side expiry duration;
- signing-key rotation;
- refresh-token behaviour;
- revocation strategy;
- secure/HttpOnly cookie options;
- rate-limit implementation.

Those remain backend-security validation items.
