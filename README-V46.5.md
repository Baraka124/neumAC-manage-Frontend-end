# neumDesk V46.5 — Clinical Units · Operational Intelligence

V46.5 continues the V44 UI-system workstream from the frozen V46.4 Clinical Units baseline. It does not modify the Railway backend. The production staff-access incident remains treated as an authorization/data-permission recovery, not as a frontend workaround.

## What this release changes

### 1. Clinical Units now uses the neumDesk command-header language
The module header is aligned with the mature dashboard/operations visual system rather than the earlier pale editorial banner. It now carries:
- a dark contextual command surface,
- lens-aware time/context text,
- four live operational metrics,
- focused actions (Plan rotation, 12-month view, Add unit), and
- an attention rail for capacity, team-readiness, and supervisor gaps.

The header changes meaning with the selected lens instead of showing generic statistics.

### 2. Resident planning stays month-first
Resident rotations remain date ranges that are normally planned in month-scale windows. The capacity matrix still uses exact concurrent occupancy rather than simply counting every rotation that touches a calendar month.

Clinical-team readiness remains a separate weekly/day-scale concept.

### 3. Resident-first placement advisor
A resident manager can now start with the planning question rather than the unit:
- select a resident,
- enter a requested start and end date,
- evaluate all active clinical units,
- optionally show only units with capacity throughout the whole requested interval,
- see supervisor/team readiness signals, and
- open the normal rotation workflow pre-filled with resident, unit, and requested dates.

The advisor is advisory: it does not silently create a rotation.

### 4. Exact capacity inspection
A month cell now opens a capacity inspector rather than only opening the unit record. The inspector exposes:
- peak occupancy,
- guaranteed free places,
- over-capacity state,
- exact capacity segments (date from/to), and
- the residents whose rotations affect that period.

This makes “why is this month full?” answerable from the UI.

### 5. Exact next opening
Directory cards and the unit drawer now use the first exact free interval (for example 15 Nov–30 Nov) rather than only naming the first month that contains some capacity.

### 6. Team-day inspection
Weekly clinical-team cells are interactive. The user can inspect a specific unit/day and distinguish:
- recorded available clinicians,
- recorded absences, and
- no-team states.

### 7. V46.4 render crash repaired
`getUnitAttendingCount()` existed inside `useTrainingUnits()` and was returned by that composable, but V46.4 did not destructure it into the root Vue setup. The Unit Directory template therefore received `undefined` and could throw:

`TypeError: getUnitAttendingCount is not a function`

V46.5 explicitly destructures and exposes the function to the root template.

## Files intentionally changed
- `app.js`
- `index.html`
- `style.css`
- `README-V46.5.md`
- `test-v465.cjs`
- inherited V46.3/V46.4 regression marker assertions were made forward-compatible with the V46.5 cache marker
- `MANIFEST-SHA256.txt`

All other runtime/history files are retained from the V46.4 complete baseline.

## Backend
No backend source file is included or modified in this frontend release. Current production backend remains separately deployed.

## Validation boundary
Static regression tests validate the wiring, planning semantics, build markers, and presence of the new operational surfaces. Authenticated browser validation against live hospital data is still required after deployment, especially for visual density and real unit/team rosters.
