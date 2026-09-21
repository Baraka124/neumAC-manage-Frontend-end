# neumDesk V46.4 — Clinical Units Operational Workspace · Phase 1

V46.4 continues the V44 UI System from the complete V46.3 frontend baseline. The production staff-access incident that preceded this work was resolved through explicit `user_permissions` rows in the backend/database; no frontend or backend source replacement was required to restore access.

## Product decision

Clinical Units now uses **two deliberately different time scales**:

- **Resident rotations:** month-scale planning. Resident assignments normally span rotation blocks measured in months, so capacity planning must answer *which unit has space, in which month, from when to when, and against what capacity*.
- **Clinical-team readiness:** week/day-scale operational availability. Unit membership is stable, while recorded leave and assignment dates can change who is available on a given day.

The two concepts are no longer mixed in one generic dashboard surface.

## Main UI changes

### 1. Clinical Units header and navigation

The module now opens as an operational workspace with a clear institutional header and three explicit lenses:

1. **Rotation capacity** — resident planning, month-by-month.
2. **Team & availability** — clinical-team readiness, day-by-day.
3. **Unit directory** — unit structure, current state, people, details and actions.

### 2. Month-first resident capacity matrix

The Rotation Capacity lens shows units as rows and future months as columns. Each month reports peak concurrent residents against the unit's resident capacity and distinguishes:

- completely free;
- space throughout the month;
- mixed months that open/close during the month;
- full months;
- over-capacity conflicts.

The capacity engine is based on **exact overlapping date intervals**, not the number of rotations that merely touch a month. Sequential residents can therefore reuse one slot in the same month without being falsely counted as simultaneous occupancy.

The planner supports 3, 6 and 12 month horizons and month-by-month navigation.

### 3. Exact availability windows

For mixed months, neumDesk derives exact free intervals such as:

`1–14 Nov · 1 free · 22–30 Nov · 2 free`

This is the basis for both the UI and Grounded answers.

### 4. Over-capacity assignments remain visible

The earlier slot-layout helper could omit a rotation if every configured resident slot was already occupied. V46.4 creates an overflow lane instead. A conflict must remain visible; the interface should never "fix" over-capacity by hiding the assignment that caused it.

### 5. Team & Availability corrected

The previous weekly view was semantically wrong: it counted resident rotations by day while presenting itself as staffing availability, and its template referenced an undefined `weeklyGridOffset`.

V46.4 replaces that with a real clinical-team grid based on:

- `unit_staff` membership;
- assignment start/end dates when recorded;
- staff absence records;
- present/total clinical-team counts by day.

Resident rotations are intentionally excluded from this weekly team grid.

### 6. Truthful unit-team loading states

`loadUnitStaff()` no longer converts a failed team request into an empty team. V46.4 maintains a separate `unitStaffErrors` state so the UI can distinguish:

- an empty clinical team;
- a team still loading;
- a team request that failed.

The UI exposes a retry action for failed team loads.

### 7. Grounded — resident-manager availability questions

Grounded's `unit_forecast` intent is expanded for questions such as:

- Which clinical units are free next month?
- Which units are free and which month?
- When is UCRI free?
- From when to when does a unit have capacity?
- Which month is a unit available?

For month-level questions, Grounded uses the same exact capacity-window engine as the Clinical Units planner so the conversational answer and the visible planner cannot disagree by design.

## Runtime files changed

- `index.html` — new Clinical Units workspace, month planner, team-availability view and unit directory; V46.4 cache marker.
- `app.js` — exact capacity-window engine, month planning state, team availability grid, truthful team loading errors, Grounded month-first unit forecast, over-capacity visibility.
- `style.css` — complete V46.4 Clinical Units visual system.

No backend file is included in this frontend release.

## Current backend reference

The current backend supplied alongside this work is `index (14).js`, identified in source as `VERSION 6.0 - BACKEND PLAN V44 IMPLEMENTED`. It already exposes the unit, resident rotation, capacity, unit-staff, absence and permission capabilities needed by this phase. It remains a separate Railway deployment and is not bundled into the frontend ZIP.

## Release lineage

V44 → V45 → V46 → V46.1 → V46.2 → V46.3 → **V46.4 Clinical Units Phase 1**

V46.4 is a complete baseline ZIP rather than a partial hotfix package. Historical README and regression files are carried forward so the package remains self-describing.

## Next phase

V46.5 should deepen Resident Planning rather than redesign the module shell again:

- resident-centric rotation planning;
- drag/select or assisted assignment flows where appropriate;
- conflict explanation and resolution;
- supervisor readiness;
- rotation-history context;
- richer "why this slot is/isn't available" detail;
- Grounded-assisted placement using requested date windows rather than current-only capacity.
