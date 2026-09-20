# neumDesk V46 — At neumAC

Latest version: **V46**. Built from the complete V45 release. V44 authentication behavior and V45 Grounded/personal activity features are retained. Earlier numbered documentation and tests are historical regression material.

## Design

Two sibling panels with independent content:

- Left: public editorial highlights, local abstract artwork, a headline, short perspective and manual selectors.
- Right: a solid ivory sign-in panel containing only workspace identity, authentication and access support. No artwork, announcements or promotional copy sits behind the form.

On mobile, sign-in appears first in both document order and visual order. Highlights follow in a separate section. There is no automatic rotation, animated background or timed advance. Highlight selection cannot change credentials or authentication state. Missing artwork falls back to the panel's dark solid background.

## Install

Replace the full runtime set together, retaining your current backend configuration:

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

No backend modification or deployment has been performed. The activity45 filenames remain versioned by the feature they introduced; their presence is not a downgrade.

## Editorial content

Edit `entry-highlights.js`. Current entries are evergreen editorial perspectives, not claims of current events, new publications or live project announcements.

Each item supports:

- `id`, `enabled: true`, `audience: 'public'`
- `category`, `title`, `summary`, `detail`, `navTitle`
- `image` (local relative asset path), `imageAlt`, `imageCredit`
- Optional `startsAt` and `expiresAt`, as ISO timestamps with explicit timezone
- Optional `linkUrl` (HTTPS only) and `linkLabel`; links open a new tab
- `accent`: sage, sand or blue (reserved theme hook; supplied artwork establishes each palette)

Up to three eligible entries appear in file order. Dates are evaluated on page creation, highlight selection and authentication-state changes. A page left untouched must be refreshed to reflect a newly reached publication/expiry boundary. Empty or invalid configuration produces an evergreen fallback.

This is a public frontend configuration file: even disabled entries are downloadable with the site. Only public-ready copy belongs in it. It does not retrieve internal departmental announcements or private records. A backend publishing/editor interface is not included.

## Validation

61 executable checks pass: 12 V43.1 hardening, 11 V44 entry, 26 V45 activity/review and 12 V46 editorial checks. JavaScript files pass syntax checks. Authentication functions are unchanged from V45.

Browser visual validation could not be completed: the available cloud browser rejected local-file navigation under its URL policy. No alternative route was used to bypass that restriction. Desktop/mobile rendering, keyboard behavior, font loading and full authenticated integration still require live verification. Existing V45 print/browser validation limitations remain.

Run tests with `node test-v431.cjs`, `node test-v44.cjs`, `node test-v45.cjs` and `node test-v46.cjs`.
