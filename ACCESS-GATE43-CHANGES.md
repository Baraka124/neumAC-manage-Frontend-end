# neumDesk V46.14 — Access Gate 4.3 UI Changes

## Goal

Make the login gate feel like the secure front door to neumDesk while preserving the Access Gate 4.2 session-integrity behavior.

## Changed

- Rebalanced desktop split so the access panel has substantially more visual weight.
- Increased the access content column to 460px and moved the task higher on the page.
- Sign-in hierarchy is now **Welcome to neumDesk → Department workspace → authorised access explanation**.
- Email label becomes **Work email**; primary CTA becomes **Sign in to neumDesk**.
- Trusted-session state is reframed as **Welcome back → Session verified** while preserving the explicit Continue gate.
- Verification/opening copy now describes identity, permissions and workspace unlocking.
- Editorial headline is reduced in scale and the public perspective selector/read controls are hidden on the access gate.
- Access footer now states that the area is restricted to authorised departmental users and that access activity may be audited.
- Mobile keeps the access task first and moves the editorial identity below it.

## Not changed

- `app.js`
- `style.css`
- Access Gate 4.2 session storage / trusted-browser behavior
- Grounded 4.1A–E
- Staff Phase 4
- Clinical Units, Leave, On-call, Rotations, Personal Activity
- permissions / Supabase schema / sync architecture

## Deploy

Only `index.html` and `entry46.css` are required for this checkpoint.
