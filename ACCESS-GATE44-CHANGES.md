# neumDesk V46.14 — Access Gate 4.4

## Purpose

Access Gate 4.4 is the finishing pass on the departmental sign-in experience. It preserves Access Gate 4.2 session integrity and Access Gate 4.3 layout/balance while improving the five remaining UI/interaction areas requested for the login surface.

## neumact brand usage

The left editorial identity now uses the supplied **neumact** logo asset and lowercase product naming (`neumact`). The access gate does not rebrand neumDesk itself; neumDesk remains the authenticated departmental workspace.

Representative UI tokens sampled from the supplied logo are recorded in `entry46.css`:

- Blue: `#3A61B2`
- Cyan: `#2F80B7`
- Teal: `#2DA5A6`
- Green-teal: `#2DA28B`

These colors are used as restrained accents: the neumact logo, the authentication focus rail, input focus, the trusted-browser security option and small editorial details. They do not replace neumDesk's internal green workspace identity.

## The five improvements

### 1. Authentication becomes the focal point

The sign-in content gains a narrow neumact-gradient focus rail rather than a floating card or heavy shadow. Form controls receive a consistent neumact-teal focus treatment. The editorial panel remains visually rich without competing with the access task.

### 2. Trusted-browser choice is a real security decision

`Remember my email` remains a simple low-risk preference. `Trust this browser for up to 12 hours` is now a distinct security option with a shield mark, bounded-session explanation and a selected state. The underlying Access 4.2 bounded persistence contract is unchanged.

### 3. Error and exceptional states are specific

Authentication feedback is classified into calm, named states:

- credentials not recognised;
- access/account restriction;
- rate limiting;
- maintenance;
- connection/server verification failure;
- expired session;
- generic sign-in failure.

Required-field validation stays local to the affected fields and does not create an unnecessary global error banner.

### 4. Input details are polished

- email keeps `autocomplete=username`, `inputmode=email`, autofocus and browser/password-manager compatibility;
- password keeps `autocomplete=current-password`;
- password visibility uses an accessible eye control;
- Caps Lock feedback remains explicit;
- invalid required fields receive focus;
- failed authentication keeps the email value;
- the submit button displays `Verifying access…` with a compact progress indicator.

### 5. Entry into neumDesk is less abrupt

After identity, permissions and workspace data are ready, the access gate performs a 180 ms handoff before the authenticated workspace becomes visible. `prefers-reduced-motion` removes the transition delay/animation.

## Preservation boundary

Unchanged from Access 4.3:

- global `style.css`;
- `grounded-core.js`;
- Grounded Phase 4.1A–E semantics and UI;
- Staff Phase 4 UI;
- permissions architecture;
- Supabase schema;
- Leave, On-call, rotations, Clinical Units and Personal Activity logic.

Access 4.4 changes only:

- `index.html` access markup / cache checkpoint;
- `entry46.css` access-gate styles;
- access-specific behavior in `app.js` for error presentation, field focus and the short successful-entry transition;
- `neumact-logo.png`.
