# neumDesk V46.14 — Access Gate 4.4 Validation

## Dedicated Access 4.4 suite

`test-v4614-access44.cjs` — **16 / 16 passed**.

Checks cover:

1. neumact logo asset and lowercase access-gate naming;
2. recorded neumact color tokens;
3. authentication focal hierarchy;
4. trusted-browser security treatment;
5. typed authentication error states;
6. inline required-field validation and focus;
7. password visibility + Caps Lock accessibility;
8. verifying/progress submit state;
9. browser/password-manager input semantics;
10. reduced-motion-aware successful-entry handoff;
11. Access 4.2 session integrity preservation;
12. global stylesheet preservation;
13. Grounded runtime preservation;
14. access CSS parser integrity;
15. valid PNG logo asset;
16. cache checkpoint delivery.

## Full historical regression

All shipped test files in the V46.14 checkpoint were executed after Access 4.4:

- **32 suites passed**
- **503 passing assertions/checks counted across the suites**

This includes historical V43.1 → V46.14 suites, Staff Phase 4, browser-DOM template safety, Grounded Phase 4.1A–E, action-integrity suites and Access Gate 4.2/4.3.

## Static integrity

- `app.js`: Node syntax check passed.
- `entry46.css`: PostCSS parse passed.
- `test-v4614-template-dom.cjs`: passed.
- global `style.css`: byte-for-byte unchanged from Access 4.3.
- `grounded-core.js`: byte-for-byte unchanged from Access 4.3.

## Remaining live acceptance checks

The static/regression suite cannot replace live browser/server validation. After deployment verify:

1. wrong password;
2. expired session;
3. network/server unavailable;
4. normal tab-scoped login;
5. trusted-browser resume;
6. Caps Lock warning;
7. password visibility;
8. reduced-motion preference;
9. close browser → reopen behavior;
10. neumact logo clarity on the deployed editorial artwork.
