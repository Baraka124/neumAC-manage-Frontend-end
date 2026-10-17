# Pneumo Ops Room — Sala de Operaciones de Neumología · plan of record

Status (17 Oct 2026): **OR-1, OR-2, OR-2b, OR-3, OR-C steps 1–2 and OR-R built** — all six questions, Interconsultas
(+ calls from other departments), Objetivos, **Informes** (weekly/monthly, unit + department) and Configuración are live.
Clinical counts can be broken down by condition, age band or sex (counts only).
**Interface pass 1–2 built (17 Oct):** status first everywhere and a department daily screen, **Hoy** (see §9).
Next: OR-C steps 3–4, OR-4, OR-5, OR-6 (and any interface pass 3 items in §9).
**§8 is the handoff** — read it first if you are continuing this work in a new session or with another assistant.

## 1. Purpose

> **Saber cada día cómo funciona cada unidad de Neumología —quién está, con qué cuenta, qué se ha hecho y
> qué queda pendiente— y actuar antes de que un problema llegue al paciente.**

The six questions it answers, every day, for every unit:

| | Question | Answered by |
|---|---|---|
| 1 | **¿Quién está?** Who works in the unit today and who is responsible | Unit roster (+ residents linked from Rotations) |
| 2 | **¿Con qué contamos?** Beds, rooms, equipment: available, out of service, due for calibration, lent out | Resources + resource events |
| 3 | **¿Qué hemos hecho?** Activity performed in the period | Activity counts |
| 4 | **¿Qué está pendiente?** Waiting lists, studies to read, oldest pending date | Pending work |
| 5 | **¿Qué ha fallado?** Incidents, cancellations, who is resolving them | Incidents |
| 6 | **¿Cumplimos?** Each unit's objectives: target, trend, owner | Indicators |
| + | **Interconsultas:** ¿cuántas pendientes, de quién, quién las lleva, en cuánto respondemos? | Interconsult requests (§3b) |

Who it serves: the **unit coordinator** runs the unit from here · the **head of department** sees all units
at a glance and spots problems early · **clinicians** see where they are needed and what is theirs to resolve ·
**residents** see what their unit has and what is happening that week.

What it is not: not a health record (no patient data), not a copy of other modules, not a news feed.

Ops Room is where Pulmonology's clinical units are **run**: who works there, what they use, what they do,
what is waiting, what went wrong, and whether they meet their objectives.

It **owns new operational records**. It is not a dashboard that re-displays staff, rotations, guardias or
research — those stay in their modules and are only *linked* (never copied).

Principles:
- **One record, one owner.** Ops Rooms never stores a second copy of something another module owns.
- **Each unit is different.** A unit switches on only the capabilities it needs; no identical dashboards.
- **Counts, not patients.** Activity is recorded as aggregated counts per unit and period. No patient-level
  data unless the hospital explicitly authorises it (Ops Rooms must not become a second health record).
- **Realistic upkeep.** Low-frequency data (equipment, rooms, roster, incidents) is entered by hand.
  High-frequency data (census, admissions) comes from an approved hospital source or is not shown.
- **Provenance always.** Every number says where it came from (manual, import, hospital feed), who entered it, when.

## 2. Units in scope

Only units **run by Pulmonology**. Units that exist only as rotation destinations stay in Rotations.

| In Ops Rooms | Rotation destinations only (not in Ops Rooms) | To clean up |
|---|---|---|
| Hospitalización Neumología · Hospitalización (Abordaje Integral) · UCRI · Broncoscopias · Técnicas Broncopleurales · PFR · Unidad del Sueño · Consultas Externas · Asma grave | UCI · Cardiología · Cirugía Torácica · Trasplante Pulmonar · Medicina Interna · Radiología Tórax · Anestesia · Rotación Externa | "new test department", "XXXXXX-TRIAL" (test data) |

## 3. What each unit needs (agreed starting point — to be refined unit by unit)

| Unit | Resources | Activity (counts) | Pending work |
|---|---|---|---|
| Hospitalización (both) | Beds, rooms | Admissions, discharges, census | Pending discharges |
| UCRI | Monitored beds, NIV devices | Admissions, NIV days | — |
| Broncoscopias | Rooms, bronchoscopes, EBUS | Bronchoscopies, EBUS, cancellations | Waiting list |
| Técnicas Broncopleurales | Room, ultrasound, kits | Thoracentesis, pleural biopsies, drains | Waiting list |
| PFR | Spirometers, plethysmograph, DLCO — **calibration** | Spirometry, DLCO, plethysmography, 6MWT | Wait time |
| Unidad del Sueño | Polygraph / PSG devices — **loans: who has it, due back** | Studies performed | **Studies awaiting interpretation** |
| Consultas Externas | Consulting rooms | First / follow-up visits | Wait time |
| Asma grave | — | Patients in programme, visits | — |

## 3b. Interconsultas — a department-wide service

Requests from other services to Pulmonology. Not owned by one unit: a **service across the department**,
with its own section in the Ops Room.

Answers: how many are pending now and the oldest · which services ask most · who is handling each ·
time to answer vs target (e.g. urgent: same day) · workload per clinician.

**One record per request** (the exception to "counts only" — response time cannot be measured from daily
counts), holding only operational data:

| Field | Notes |
|---|---|
| requesting service | from a catalogue of hospital services |
| priority | urgent / preferente / ordinary (to confirm) |
| received at · assigned at · answered at · closed at | timestamps drive the response-time indicator |
| assigned to / answered by | staff from neumDesk |
| status | received → assigned → answered → follow-up / closed |
| reason category (optional) | from a short catalogue, no free clinical text |

**No patient identifiers** (no name, no NHC). If a reference to the hospital's own request number is ever
needed, that is a separate, explicitly authorised decision.

Connections: who covers interconsultas comes from the roster / guardias · Mi espacio shows "your pending
interconsultas" · indicators such as **% answered within target** and **median response time** by priority.

To confirm with the department before building: how requests arrive today (HIS electronic request, phone,
paper) · whether there is a rota for answering them · target response times by priority · whether follow-up
visits are tracked.

Capabilities a unit can switch on: **Roster · Resources · Activity · Pending work · Incidents · Indicators**
(+ type-specific: beds, device loans, calibration).

## 4. Records Ops Rooms owns (draft data model)

| Record | Holds | Notes |
|---|---|---|
| Unit operational profile | unit, run by Pulmonology (yes/no), enabled capabilities | Extends the existing unit — **one unit identity** (see §6) |
| **Unit roster** | staff ↔ unit, role (coordinator, responsible, participating…), from, to | Biggest gap today: attendings are not assigned to units at all. Residents keep coming from Rotations (linked, not copied) |
| Resources | unit, kind (bed, room, device), name, identifier, status | |
| Resource events | status changes, maintenance, calibration done/due, loans (to whom, due back) | History, not just current state |
| Activity catalogue | per unit: the types of activity it performs | What a unit *does* |
| Activity counts | unit, activity type, period, count, source, entered by | What *happened* — aggregated only |
| Pending work | unit, type, pending count, oldest pending date, snapshot date | Waiting lists, studies to read |
| Incidents | unit, resource (optional), type (out of service, room closed, cancellation…), reason, opened/closed, owner | |
| Indicators | definition (from activity/pending/resources), target, owner, unit, values per period | Quality objectives live here |
| **Interconsult requests** | requesting service, priority, received/assigned/answered/closed times, assignee, status, reason category | Department-wide; no patient identifiers (§3b) |

## 5. Connections — why this beats a stand-alone tool

- Equipment out of service → visible to the residents rotating in that unit that week.
- Resident capacity of a unit can follow its real staffing/equipment, not a fixed number.
- Mi espacio shows each person *their* unit's week (roster, incidents, pending work they own).
- Grounded answers operational questions ("how many sleep studies are waiting?") from verified records.
- Department leadership sees all units side by side only where the comparison is meaningful.

## 6. Decisions (taken 16 Oct 2026 unless marked open)

1. ✅ **One unit identity** = `training_units` (+ `ops_enabled`, `ops_capabilities`). `clinical_units` /
   `clinical_unit_assignments` stay unused (1 row / 0 rows) — retire later, nothing reads them for Ops Room.
2. ✅ **Roster** = `unit_staff` (it was already linked to `training_units` and used by Units, but empty).
3. ✅ The old communications hub is labelled **Communications**; **Ops Room** (`opsroom` view) is clinical operations.
4. ⏳ **Hospital data source** (ADX or other) — OPEN. Until an approved feed exists, census/admissions are entered by
   hand or not shown.
5. ✅ No single "first unit": the model is capability-driven, so all 9 units got OR-2 at once.
6. ⏳ **Interconsulta response targets** — OPEN. Provisional 24 h (urgent) / 72 h (preferente) / 168 h (ordinary),
   stored since OR-C in `ops_targets` (valid from 2026-01-01). **Change them in Ops Room → Configuración** (with a
   valid-from date) once the department confirms; no code change needed. `IC_TARGET_HOURS` is only the pre-migration fallback.
7. ⏳ **Indicator targets** — OPEN by design: never invented; each unit / the head of department sets them.

## 7. Build sequence

| Step | Delivers |
|---|---|
| ✅ OR-1 | Unit identity + operational profile + **unit roster** (backend #51, frontend #180) |
| ✅ OR-2 | All units: resources + events, activity catalogue + counts, pending work, incidents (backend #52, frontend #181) |
| ✅ OR-2b | **Interconsultas**: request record, board, take/assign/answer/follow-up/close, response-time stats |
| ✅ OR-3 | Indicators (targets, owners, week/month/quarter, last 6 periods computed from records) |
| ◐ OR-C | **Configuration** — steps 1 ✅ and 2 ✅ built 17 Oct (see §8); steps 3–4 pending: (1) catalogues as data — interconsulta services/reasons/priorities/**targets**, incident categories, roster roles, device types with default calibration interval; (2) **target history** (valid-from dates; past periods judged with the target in force then); (3) unit **Ops profile inside the existing clinical units module** (see rule below); (4) alert rules (thresholds → owner notifications) |
| ✅ UI 1–2 | Status first: unit pulse (level + reasons), six-question control panel, drawers, **Hoy** department screen (backend `unitPulse`) |
| ✅ OR-R | **Clinical counts + calls + reports** (17 Oct): a measure may carry ONE breakdown (`clinical_condition` / `age_band` / `sex`, catalogues; never crossed, counts only); phone / in-person calls from other departments logged in Interconsultas (channel, outcome, minutes; saved as resolved; excluded from response times; `calls_total` indicator); **Informes**: fixed weekly/monthly snapshots per unit and a department roll-up, generated lazily for the last complete week/month, regenerable, printable |
| OR-4 | Remaining Pulmonology units, each with only its capabilities |
| OR-5 | Connections: Mi espacio, resident visibility, Grounded, leadership overview |
| OR-6 | Hospital feed for high-frequency activity — only with an approved source |

Each step: migrations with RLS, permission checks on every route, tests, rendered check, merged only when green.

## 8. Handoff — how to continue (for a new session or another assistant)

### Repos, deploy, people
- Frontend: `Baraka124/neumAC-manage-Frontend-end` → GitHub Pages → https://desk.neumact.org (Vue 3, **in-DOM templates** in `index.html`, logic in `app.js`).
- Backend: `Baraka124/neumAC-manage-back-end` → Railway (Express, `index.js`), Node ≥ 22.
- Database: Supabase project `vssmguzuvekkecbmwcjw`.
- Owner: Baraka (builds it); head of department: Pedro Marcos.

### Where the Ops Room code is
| Layer | File / place | What |
|---|---|---|
| Backend rules (pure, tested) | `ops-room.js` | roster rules, resources/events, measures, incidents, interconsultas (`IC_*`), indicator engine (`IND_KINDS`, `periodBounds`, `computeIndicator`) |
| Backend routes | `index.js`, blocks headed `PNEUMO OPS ROOM (OR-1)`, `(OR-2)`, `(OR-2b)`, `(OR-3)`, `(OR-C)`, `(OR-R)` | all under `/api/ops/...` |
| Report engine (pure) | `ops-room.js`: `reportPeriod`, `buildUnitReport`, `buildDepartmentReport`, `callRecord`, `callStats`, `BREAKDOWNS` | |
| Backend tests | `tests/ops-room.test.cjs`, `-or2`, `-or3`, `-orc`, `-orr`; CI `.github/workflows/ops-room.yml` | |
| Migrations (SQL, idempotent) | `migrations/2026-10-16_ops_room_or1_…sql`, `…or2_…sql`, `…or2b_or3_…sql` | |
| Frontend logic | `app.js`, block starting `// ─── Pneumo Ops Room (OR-1)` (state `opsRoom`, functions `ops*`) | |
| Frontend view | `index.html`, `<div v-if="currentView === 'opsroom'" class="opsr">` | sections: units / interconsults / objectives / reports (Informes) / config; unit tabs = six questions; unit header has “Informes de la unidad” |
| Styles | `access.css`, blocks `/* ── Pneumo Ops Room (OR-1) ── */`, `/* Ops Room OR-2 */`, `/* Ops Room OR-2b / OR-3 */` | |
| Frontend tests | `tests/ops-room-or1.test.cjs`, `-or2`, `-or3`, `-orc`, `-orr`; CI step in `frontend-integrity.yml` | |
| Access | `access.js` → `VIEW_MODULES.opsroom = 'training_units'` | |

### Database objects
- `training_units.ops_enabled`, `training_units.ops_capabilities` (`roster, resources, beds, calibration, loans, activity, pending, incidents, indicators`).
- `unit_staff` (roster): roles `coordinator | primary | secondary`; one ACTIVE row per person+unit (`unit_staff_one_active`); audit.
- `ops_resources` (+ `device_type`) + `ops_resource_events` · `ops_measure_types` (flow | stock; 29 seeded) + `ops_measurements` · `ops_incidents`
  · `ops_interconsults` (`requesting_service` stores the catalogue CODE) · `ops_indicators` + `ops_indicator_values` (manual only)
  · **OR-C:** `ops_catalog_items` (catalog, code, label, sort, active, locked, meta) for `ic_service, ic_reason, ic_priority,
  incident_category, roster_role, device_type`; `ops_targets` (scope `indicator`|`ic_priority`, ref, value, direction, valid_from, note).
  `unit_staff.role` and `ops_incidents.category` are no longer fixed lists in the schema: the API validates them against the catalogue.
  **OR-R:** catalogues `clinical_condition` (11), `age_band` (4, locked), `sex` (3, locked); `ops_measure_types.breakdown`
  (one list or null); `ops_measurements.breakdown` jsonb `{code: count}` (value = their sum); `ops_interconsults.channel`
  (`formal`|`phone`|`in_person`), `outcome` (`advice`|`seen`|`converted`), `duration_min`; `ops_reports` (scope unit|department,
  unit_id, period week|month, period_start/end, content jsonb, generated_at, generated_by null = automatic; one per
  scope+unit+period+start).
  All: RLS on (API uses the service role), audit trigger `fn_audit_trigger`.

### API (all need a signed-in user)
| Route | Guard |
|---|---|
| `GET /api/ops/units`, `GET /api/ops/units/:id` | Units read |
| `PUT /api/ops/units/:id/profile` | head of department / admin |
| `POST/PUT/DELETE /api/ops/units/:unitId/staff[/:entryId]` | Units write (residents refused — they come from Rotations) |
| `GET/POST/PUT/DELETE /api/ops/units/:unitId/resources[/:resourceId]`, `POST …/resources/:resourceId/events` | read / Units write |
| `GET/PUT /api/ops/units/:unitId/measures`, `DELETE …/measures/:measureId`, `POST/PUT …/measure-types[/:typeId]` | read / Units write |
| `GET/POST/PUT/DELETE /api/ops/units/:unitId/incidents[/:incidentId]` | read / Units write |
| `GET/POST /api/ops/interconsults`, `POST /api/ops/interconsults/:icId/action` (assign·answer·follow_up·close·reopen) | read; log = any staff member; act = assignee or Units write |
| `PUT/DELETE /api/ops/interconsults/:icId` | Units write; `?permanent=true` admin |
| `GET /api/ops/units/:unitId/indicators`, `POST/PUT/DELETE …/indicators[/:indId]`, `POST …/indicators/:indId/values` | read / Units write |
| `GET /api/ops/indicators` (department overview), `POST/PUT/DELETE /api/ops/indicators[/:indId]`, `POST …/:indId/values` | read / head of department or admin |
| `GET /api/ops/catalog` | Units read |
| `POST /api/ops/catalog/:catalog`, `PUT /api/ops/catalog/:catalog/:code`, `POST /api/ops/targets/ic/:priority` | head of department / admin |
| `POST/DELETE /api/ops/units/:unitId/indicators/:indId/targets[/:targetId]` · `POST/DELETE /api/ops/indicators/:indId/targets[/:targetId]` | Units write · head of department / admin |
| `GET /api/ops/units/:unitId/reports` (lists; creates the last complete week + month if missing), `GET …/reports/:reportId`, `POST …/reports/generate` {period, period_start?} | Units read · read · Units write |
| `GET /api/ops/reports`, `GET /api/ops/reports/:reportId`, `POST /api/ops/reports/generate` (department roll-up) | Units read · read · head of department / admin |
Measures accept `breakdown` on `POST …/measure-types` and `{type_id, breakdown:{code:n}}` items on `PUT …/measures`;
`POST /api/ops/interconsults` with `channel: phone|in_person` + `outcome` (+ `duration_min`) logs a resolved call.
Every `…?permanent=true` delete is head of department / admin only; normal removes are soft (restorable; audit keeps all).

### Conventions that must hold (each has a test)
- **No patient data anywhere** (no names, NHC, record numbers). Free-text fields say so and are length-capped.
- **One record, one owner**: residents in a unit come from Rotations (linked, never copied).
- **Never invent numbers**: indicator targets are empty until a person sets them; suggestions never prefill a target;
  calibration % has no past reconstruction; unbuilt things say so.
- **Writes check the unit in the URL** and that the row belongs to it (`opsOwned`).
- **In-DOM templates: never put `<` inside `{{ }}`** in `index.html` (the browser parses it as a tag) — put the logic in a function.
- Missing OR tables read as empty (`opsSoft`), so a new step never breaks the previous one before its migration runs.
  Catalogues fall back to the built-in lists (`catalogFallback`) until `ops_catalog_items` exists (`opsCatalog`, 30 s cache).
- **Targets in force**: an indicator period is judged with the target valid on its last day; an interconsulta with the
  target valid the day it was received (`targetAt`). Changing a target adds a history row — never edit the past.
- **Codes are fixed, labels editable**; switching an item off keeps it valid for records that already use it; `locked`
  items (used by logic: coordinator, priorities, "other") cannot be switched off; priorities cannot be added.
- **Counts, never people**: a breakdown is one list per measure (condition × age × sex is never crossed, so no tiny
  combinations can point to a patient). Reports contain counts and staff roles only.
- **Calls never distort interconsulta response times**: stats and indicators use `channel = formal` only; calls have their own counts.
- **Reports are snapshots**: they keep what the records said when generated; "Regenerate" replaces one period on purpose.
- Routes keep working before a migration (`opsCompat` retries without new columns; reports answer `migrated:false`).
- Bump cache keys in `index.html` (`app.js?v=…`, `access.css?v=…`) on every frontend change; `scripts/integrity_check.py` must pass.

### How changes have been shipped
1. Branch from `main` in each repo; write code + tests; run all `tests/*.test.cjs` (backend: also `node tests/boot-smoke.cjs`;
   frontend: also `python3 scripts/integrity_check.py` and a render check of the view in headless Chromium).
2. Record the SQL in `migrations/`. **Database changes from the assistant's session were blocked**, so Baraka ran each
   SQL file in Supabase → SQL Editor (all files are idempotent: safe to run twice).
3. Open PRs, wait for CI green, merge **backend first**, then frontend; watch the Railway and GitHub Pages deploys.
   (Once, Pages skipped a merge — an empty commit on `main` re-triggered it.)
4. Do not touch `.env` tracking without first moving the variables into Railway (two attempts broke the deploy and were reverted).

### Rule: no second way to do the same thing
- **Units are created and edited only in the clinical units module** (Units view, `/api/training-units`). Ops Room never
  creates units. A unit's Ops settings (`ops_enabled`, `ops_capabilities`, profile preset) are edited in that same unit
  form (OR-C step 3). `PUT /api/ops/units/:id/profile` is the API behind it; there must be no separate Ops Room screen for it.
- Same for people (Staff module), rotations (Rotations), guardias (On-call): Ops Room links to them, never re-creates them.
- Configuration principle: configure the *what* and *how much* (lists, capabilities, targets, thresholds, labels), never
  the *how* that protects the data (privacy, one-rotation-at-a-time, audit, permissions, indicator formulas). Config changes
  are audited and never rewrite the past (rename keeps the code, switch-off keeps history, targets carry valid-from dates).

### Migrations (run in order in Supabase → SQL Editor; all idempotent)
1. `2026-10-16_ops_room_or1_unit_profile_and_roster.sql` ✅ applied
2. `2026-10-16_ops_room_or2_resources_measures_incidents.sql` ✅ applied
3. `2026-10-16_ops_room_or2b_or3_interconsults_indicators.sql` ✅ applied
4. `2026-10-17_ops_room_orc_catalogues_targets.sql` ✅ applied (58 items)
5. `2026-10-17_ops_room_orr_breakdowns_calls_reports.sql` ✅ applied 17 Oct (18 breakdown items, 5 new columns, `ops_reports` with RLS + unique index + audit trigger)

### Open items
- Confirm with the department: how interconsultas arrive (HIS / phone / paper), whether there is a rota, the real
  response targets, whether follow-ups are tracked.
- Ask on the Urology visit (Monday): how the ADX data reaches them (export, API, manual).
- "IIP" (mentioned for returning exacerbated patients) — meaning to confirm; no readmissions measure was pre-created. Units add their own (e.g. "Reingresos a 30 días" by condition).
- The 11 conditions are a starting list for the department to rename / extend in Configuración.
- OR-4: walk each unit with its coordinator — add/rename measures, set indicator targets, register resources.
- OR-5: Mi espacio "your unit this week / your interconsultas", resident visibility of incidents, Grounded answers from Ops Room records.
- Security (outside Ops Room): rotate the keys in the committed backend `.env`, move them to Railway Variables, then untrack `.env`.

## 9. Interface (agreed 17 Oct 2026; passes 1–2 built the same day)

The Ops Room works end to end; its screens were built feature by feature (functional, consistent with neumDesk, tested
on desktop and mobile) but not designed as a whole. The next step is a proper interface pass:
- one visual language for the six questions (status at a glance before detail), unit cards that read like a control panel;
- the department view (all units, interconsultas, objectives) as the head of department's daily screen;
- fewer forms in view at once (progressive disclosure), consistent empty states, Spanish/English labels decided once;
- keep every rule in §8 (no patient data, no `<` inside `{{ }}`, cache keys, tests per screen, render check).

Decisions: unit control panel first, then the department screen from the same pieces; labels keep the current mix
(Spanish questions and sections, English controls).

**Built — pass 1 (units):** the backend adds `pulse` to every unit in `GET /api/ops/units[/:id]` —
`unitPulse()` in `ops-room.js` turns records the unit already has into `level` (`alert` | `watch` | `ok`) + short
`reasons` + activity freshness, latest pending values and objectives met / not met. Rules: alert = equipment out of
service, calibration or loan overdue, objective not met, incident open > 7 days; watch = fresh or unowned incident,
calibration due ≤ 14 days, activity not recorded for > 7 days (only units that use activity), empty team. A pulse
failure never blocks the list (logged, `pulse: null`). Frontend: cards sorted by urgency with level pill + reasons;
the six questions are a control panel (each tile shows its live value and a coloured top edge); "add" forms (team,
resource, incident) sit in drawers; status refreshes after every write (`opsRefreshPulse`).

**Built — pass 2 (Hoy):** the Ops Room now opens on **Hoy**, the department's daily screen: units by level, "Needs
action" and "To look at today" (every unit reason + interconsultas over target / unassigned, each clickable to the
unit), interconsultas at a glance, objectives off track (from `GET /api/ops/indicators`), and every unit as one row.

**Built — UX-1 (17 Oct):** (1) **shareable views** — `?view=<route>` opens ONE view in a focus frame (no sidebar,
top bar or other modules; sign-in still required; whitelisted routes `ND_VIEW_RE` in app.js: hoy · interconsultas ·
objetivos · informes[:unit] · report:<dept|unit>:<id> · unit:<id>[:tab] · parte[:date] · agenda[:id] · meeting:<id> ·
post:<id> · pendientes; legacy `?c=` links map to the same). "Share this view" in Ops Room and Comunicación shares
exactly what is on screen (WhatsApp / copy). (2) **Quick log** sheet (chips: channel, most-used services, priority or
outcome, minutes; remembers choices per device) from Hoy and Interconsultas. (3) **Steppers** (−/+) on every count.
(4) Shared components in access.css (`--nd-*` tokens, `.nd-chip`, `.nd-sheet`, `.nd-quick-btn`, `.nd-step`,
`.nd-focusbar`) — reuse these for new screens.

Possible pass 3 (not started): Interconsultas board as a queue (oldest first, one-tap take/answer); Objetivos as a
grid by unit; consistent empty states for brand-new units.

### Decision (17 Oct 2026)
- **No ISO.** The optional "ISO clause" field was removed from indicators, reports and screens (Baraka: ISO is study-specific, not for this system). The old database column stays, unused.
