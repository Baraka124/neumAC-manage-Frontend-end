# neumDesk V46.6 — Clinical Units · Detail, Grounded & Real-Data Hardening

V46.6 continues directly from the complete V46.5 Clinical Units baseline. It does not modify or bundle the separately deployed Railway backend.

## Why this release exists

V46.5 established the month-first resident-capacity planner, weekly clinical-team readiness, exact capacity inspection and resident-first placement advisor. V46.6 makes those capabilities behave as one operational system rather than separate surfaces.

The design rule remains explicit:
- **Residents:** month-scale rotation windows with exact start/end dates and concurrent capacity.
- **Clinical team:** day/week operational readiness and recorded absence.

## 1. Unit detail becomes the canonical operational record

Opening a Clinical Unit now brings together:
- resident capacity today,
- clinical-team readiness today,
- designated supervisor,
- exact next opening,
- attention states,
- a 12-month capacity strip,
- current residents,
- scheduled incoming rotations, and
- the assigned clinical team.

Capacity, team and alert values are derived from the same live frontend records used elsewhere in Clinical Units.

## 2. Grounded inherits Clinical Unit context

When the Unit detail is open, Grounded now recognises that unit as the visible subject. The context card includes current resident occupancy and next opening. Returning from Grounded to the subject reopens that Clinical Unit rather than dropping the user at the generic module.

This makes unit questions naturally contextual, for example:
- "When is this unit next free?"
- "Why is it full in November?"
- "Who is assigned here?"
- "Does this unit have a supervisor?"

## 3. Month-aware Grounded date interpretation

Grounded's range parser now understands the planning language a resident manager actually uses:
- next month,
- next N months,
- named months such as November,
- named month + year, and
- month windows such as November to January.

Named months roll forward to the next occurrence when no year is stated and that month has already passed in the current year.

## 4. Resident placement is overlap-safe

The placement advisor now checks the selected resident's own active/scheduled rotations for the requested interval. If the resident is already assigned during that period, neumDesk shows a resident-assignment conflict rather than recommending another unit as if the resident were free.

Recommendations also distinguish:
- resident capacity fit,
- supervisor readiness,
- whether a clinical team is recorded, and
- an "operationally ready" state.

## 5. Grounded placement uses the same exact capacity engine

"Where can [resident] rotate in November?" no longer ranks units from current occupancy alone. Grounded now:
- parses the requested month/date window,
- checks the resident for overlapping assignments,
- evaluates exact concurrent unit capacity over the whole interval,
- includes supervisor and clinical-team readiness, and
- proposes the normal rotation workflow rather than silently writing a rotation.

## 6. Unit team failures remain truthful

A failed unit-team request remains an explicit error with Retry. It is not rendered as "no team assigned". Genuine empty membership remains a separate state.

## Files intentionally changed
- `app.js`
- `index.html`
- `style.css`
- `README-V46.6.md`
- `test-v466.cjs`
- inherited marker assertions updated to recognise the V46.6 forward build
- `MANIFEST-SHA256.txt`

All prior runtime/history files are retained from the V46.5 complete baseline.

## Backend
No backend source file is included or modified in this frontend release. The current production backend remains separately deployed.

## Validation boundary
Static regression tests validate source wiring, syntax and the new planning semantics. Authenticated browser testing against real hospital data remains required for final visual-density tuning and for discovering data-quality edge cases that static fixtures cannot reproduce.
