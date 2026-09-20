# neumDesk V44 — Institutional entry

Built from the V43.1 release produced in this conversation. This is a separate release copy. Deploy index.html, style.css and app.js together; their asset query keys are 44.

## Experience

A restrained green/ivory institutional entrance establishes neumAC, Pneumology and Área Sanitaria de A Coruña y Cee as the context. neumDesk is the workspace; Grounded appears as its assistant. Desktop uses an identity panel and a focused sign-in surface. At 820px and below, the identity condenses above a full-width form. Layouts use natural scrolling, accessible labels, visible keyboard focus, 16px inputs and reduced-motion support.

The entrance supports sign-in, session checking, workspace preparation, unavailable-session retry, alternate-account entry and account-support instructions. The decorative timed startup splash is disabled. Saved users are not rendered as authenticated before /api/auth/me succeeds. The form has one submit route, duplicate-submit protection, email validation, accessible password visibility, Caps Lock notice and a functional remember-email preference. This preference does not alter the backend's existing token lifetime or token storage.

## Authentication changes

- Sign-in and session validation have 15-second request deadlines.
- Incorrect credentials no longer trigger the generic session-expired handler.
- Account refusal, rate limiting, maintenance and network errors have actionable wording.
- Session validation bypasses the GET cache and uses the server-returned identity and permissions.
- Network failures retain the session token for retry while hiding the workspace.
- Late validation cannot open a previous account after choosing another account.
- Logout/session expiry clear Grounded conversation context. Login clears the password from the form after success.

## Password recovery limitation

The previous UI only displayed a 'link sent' toast. The supplied backend's forgot-password endpoint uses sendNotification(), whose recipient is NOTIFY_EMAIL, not the requesting user's email. It can also silently skip delivery when unconfigured. V44 replaces the false success interaction with honest instructions to contact the departmental administrator. It does not call that endpoint or claim self-service recovery is working. End-to-end email recovery and reset-link handling require a separate backend change and delivery verification. No backend files are changed in this release.

## Validation

- JavaScript syntax check passed.
- All 12 inherited V43.1 isolated regression tests passed.
- All 11 new entry-state tests passed: no token, pending/successful validation, network failure, retry, expiration, inactive account, account-switch race, email validation, duplicate submission/password clearing, incomplete response and remember-email preference.
- Tests execute the shipped function bodies with in-memory API doubles; no production credentials or production writes were used.
- New entry directive expressions were syntax-checked; the package has SHA-256 checksums.
- The environment's browser could not open the local server in the preceding audit. No desktop/mobile screenshot or authenticated end-to-end pass is claimed for this release. CSS breakpoints were inspected, not browser-rendered.

Run: node test-v431.cjs && node test-v44.cjs

## Live acceptance checklist

1. Open with no saved session; test keyboard navigation, error messages, password show/hide and remember-email reload.
2. Sign in once; verify one request, the preparation state and the loaded dashboard.
3. Reload with a valid session; no dashboard or Grounded content should appear before validation.
4. Test expired, disabled and unavailable sessions; retry and alternate-account actions.
5. Verify logout and a subsequent sign-in; confirm no previous Grounded conversation reappears.
6. Inspect at desktop, 820px, 390px and narrow widths, with zoom and onscreen keyboard.
7. Complete the inherited V43.1 Grounded live checks before declaring the full build production-validated.

## Carried limitations

V43.1's all-source Grounded refresh gate, inherited bulk absence helpers, user/profile linking and export-token issues remain as documented in README-V43.1.md. Workspace loaders still have their existing failure/empty-state behavior; V44 does not claim to overhaul all module loading. This package has not been deployed.
