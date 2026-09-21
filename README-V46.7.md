# neumDesk V46.7 — Clinical Units · Visual + Adaptive Intelligence

V46.7 is a visual and operational hardening release built directly on V46.6. It does not expand the backend surface. Its purpose is to make the Clinical Units workspace behave intelligently with real-world data states and to make the visual system crisp, legible and consistent with the neumDesk dashboard language.

## Why this release exists

Live screenshots of V46.6 showed that the core Clinical Units architecture was strong, but several presentation problems remained:

- the Unit Detail drawer looked like an older component even though new V46.6 drawer CSS existed;
- the drawer's operational snapshot could visually concatenate labels and values;
- the 12-month drawer strip produced horizontal overflow;
- zero residents rendered multiple large vacant-slot placeholders;
- the weekly team matrix repeated `no team` across almost every cell when team membership had not yet been configured;
- the attention rail repeated the same warning once per unit;
- the global shell still called the module `Training Units` while the product language elsewhere used `Clinical Units`;
- the timeline hero repeated the same month-specific statistics already shown in the planner;
- some Clinical Units date labels mixed Spanish locale with an otherwise English interface;
- parts of the V46.5 hero used translucent/radial effects that could make the interface feel cloudy.

## Critical drawer fix: Vue Teleport selector scope

The Unit Detail drawer is rendered with `<teleport to="body">`. Most V46.6 drawer refinements were scoped as `#app .udd...`. A teleported node is no longer a descendant of `#app`, so those rules did not match the rendered drawer.

V46.7 fixes this at the CSS architecture level. Drawer rules that must style the teleported surface are intentionally unprefixed (`.udd...`, `.udd466...`, `.udd467...`). This is why the drawer now receives the intended operational snapshot grid, header controls, 12-month layout and responsive behavior.

## Visual direction: crisp, not cloudy

Clinical Units now follows a stricter visual rule:

- solid dark contextual header instead of decorative radial haze;
- clean white operational surfaces;
- stronger text contrast;
- restrained state colors only where state meaning exists;
- crisp borders instead of layered translucency;
- no backdrop blur behind the Unit Detail drawer;
- no low-contrast gray-on-gray stacking.

## Clinical Units shell

- User-facing module title is now consistently **Clinical Units**.
- The Clinical Units lens/filter context is sticky while scrolling long matrices/directories.
- Timeline hero metrics are now portfolio-level rather than duplicating the selected-month planner summary:
  - active units;
  - incoming residents;
  - teams to configure;
  - active conflicts.
- The selected-month figures remain in the planner summary where they belong.

## Attention rail

Warnings are aggregated by issue type rather than repeated unit by unit. For example:

- `15 clinical units have no clinical team assigned`
- `3 clinical units need a default supervisor`
- `2 clinical units exceed resident capacity in November`

Attention items are actionable and move the user to the relevant Clinical Units lens.

## Adaptive Team & Availability

A weekly 7-day matrix is only valuable when team membership exists. V46.7 derives a `clinicalUnitTeamSetupState` from the real unit-team data.

When most visible units have no recorded team, the module presents a setup-oriented state first:

- configured unit count;
- units needing team setup;
- team-load failures if any;
- direct **Assign team** actions;
- optional **Show weekly matrix anyway** override.

Once the data is sufficiently configured, the normal day-by-day availability matrix remains available exactly as intended.

## Unit Detail drawer

The drawer is now the canonical compact operational record for a clinical unit:

- crisp blue header and readable Grounded action;
- four-cell operational snapshot with explicit layout;
- capacity/team/supervisor/next-opening values remain separated;
- next-opening action is integrated into the snapshot instead of duplicated as a second large callout;
- 12-month resident capacity fits without horizontal browser-style scrolling;
- responsive 12-month grid wraps at narrower widths;
- clinical-team states remain distinct from resident capacity;
- no-team and team-load-error states remain truthful.

### Resident empty state

V46.6 rendered one large placeholder for every vacant resident slot. V46.7 replaces this with an adaptive state:

- if residents are active, show the actual residents plus one compact remaining-capacity summary;
- if there are no current residents, show `No current residents` and the number of available places once;
- retain a direct assignment action;
- do not fabricate empty resident records.

## Locale

Clinical Units month/week labels now use English (`en-GB`) consistently with the module's English interface. This does not alter stored dates or backend data.

## Files changed in V46.7

- `app.js`
- `index.html`
- `style.css`
- `README-V46.7.md`
- `test-v467.cjs`
- `MANIFEST-SHA256.txt`

Historical release notes/tests are retained in the complete baseline package.

## Backend

No backend `index.js` change is required for V46.7.

## Deployment note

Both `app.js` and `style.css` use the `46.7-clinical-units-adaptive` cache marker. Replace the complete frontend baseline and perform a hard refresh after deployment.
