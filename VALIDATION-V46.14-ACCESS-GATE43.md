# V46.14 — Access Gate 4.3 Validation

- Historical regression suites: **31**
- Historical + new checks: **487**
- New Access Gate 4.3 checks: **8/8**
- Access Gate 4.2 session-integrity checks: **16/16**
- DOM-template safety checks: **7/7**
- `entry46.css` top-level parse errors (tinycss2): **0**

## Preservation

The Access Gate 4.3 runtime delta is limited to `index.html` and `entry46.css`. The application JavaScript and global UI stylesheet remain unchanged from Access Gate 4.2.

## Remaining live gate

Authenticated deployed visual acceptance is still required at representative desktop/laptop/mobile widths and for sign-in, verifying/opening, trusted-session resume, unavailable and access-help states.
