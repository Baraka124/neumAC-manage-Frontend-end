# Pneumo Ops Room — Sala de Operaciones de Neumología · plan of record

Status (16 Oct 2026): **OR-1, OR-2, OR-2b and OR-3 built** — all six questions and Interconsultas are live.
Next: **OR-4** (refine each unit with the department), **OR-5** (connections), **OR-6** (hospital feed, if approved).
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
| Indicators | definition (from activity/pending/resources), target, owner, unit, ISO 7101 clause (optional), values per period | Quality objectives live here |
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
   constant `IC_TARGET_HOURS` in backend `ops-room.js`. Change there once the department confirms.
7. ⏳ **Indicator targets** — OPEN by design: never invented; each unit / the head of department sets them.

## 7. Build sequence

| Step | Delivers |
|---|---|
| ✅ OR-1 | Unit identity + operational profile + **unit roster** (backend #51, frontend #180) |
| ✅ OR-2 | All units: resources + events, activity catalogue + counts, pending work, incidents (backend #52, frontend #181) |
| ✅ OR-2b | **Interconsultas**: request record, board, take/assign/answer/follow-up/close, response-time stats |
| ✅ OR-3 | Indicators (targets, owners, ISO 7101 clause, week/month/quarter, last 6 periods computed from records) |
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
| Backend routes | `index.js`, blocks headed `PNEUMO OPS ROOM (OR-1)`, `(OR-2)`, `(OR-2b)`, `(OR-3)` | all under `/api/ops/...` |
| Backend tests | `tests/ops-room.test.cjs`, `ops-room-or2.test.cjs`, `ops-room-or3.test.cjs`; CI `.github/workflows/ops-room.yml` | |
| Migrations (SQL, idempotent) | `migrations/2026-10-16_ops_room_or1_…sql`, `…or2_…sql`, `…or2b_or3_…sql` | |
| Frontend logic | `app.js`, block starting `// ─── Pneumo Ops Room (OR-1)` (state `opsRoom`, functions `ops*`) | |
| Frontend view | `index.html`, `<div v-if="currentView === 'opsroom'" class="opsr">` | sections: units / interconsults / objectives; unit tabs = six questions |
| Styles | `access.css`, blocks `/* ── Pneumo Ops Room (OR-1) ── */`, `/* Ops Room OR-2 */`, `/* Ops Room OR-2b / OR-3 */` | |
| Frontend tests | `tests/ops-room-or1.test.cjs`, `ops-room-or2.test.cjs`, `ops-room-or3.test.cjs`; CI step in `frontend-integrity.yml` | |
| Access | `access.js` → `VIEW_MODULES.opsroom = 'training_units'` | |

### Database objects
- `training_units.ops_enabled`, `training_units.ops_capabilities` (`roster, resources, beds, calibration, loans, activity, pending, incidents, indicators`).
- `unit_staff` (roster): roles `coordinator | primary | secondary`; one ACTIVE row per person+unit (`unit_staff_one_active`); audit.
- `ops_resources` + `ops_resource_events` · `ops_measure_types` (flow | stock; 29 seeded) + `ops_measurements` · `ops_incidents`
  · `ops_interconsults` · `ops_indicators` + `ops_indicator_values` (manual only). All: RLS on (API uses the service role), audit trigger `fn_audit_trigger`.

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
Every `…?permanent=true` delete is head of department / admin only; normal removes are soft (restorable; audit keeps all).

### Conventions that must hold (each has a test)
- **No patient data anywhere** (no names, NHC, record numbers). Free-text fields say so and are length-capped.
- **One record, one owner**: residents in a unit come from Rotations (linked, never copied).
- **Never invent numbers**: indicator targets are empty until a person sets them; suggestions never prefill a target;
  calibration % has no past reconstruction; unbuilt things say so.
- **Writes check the unit in the URL** and that the row belongs to it (`opsOwned`).
- **In-DOM templates: never put `<` inside `{{ }}`** in `index.html` (the browser parses it as a tag) — put the logic in a function.
- Missing OR tables read as empty (`opsSoft`), so a new step never breaks the previous one before its migration runs.
- Bump cache keys in `index.html` (`app.js?v=…`, `access.css?v=…`) on every frontend change; `scripts/integrity_check.py` must pass.

### How changes have been shipped
1. Branch from `main` in each repo; write code + tests; run all `tests/*.test.cjs` (backend: also `node tests/boot-smoke.cjs`;
   frontend: also `python3 scripts/integrity_check.py` and a render check of the view in headless Chromium).
2. Record the SQL in `migrations/`. **Database changes from the assistant's session were blocked**, so Baraka ran each
   SQL file in Supabase → SQL Editor (all files are idempotent: safe to run twice).
3. Open PRs, wait for CI green, merge **backend first**, then frontend; watch the Railway and GitHub Pages deploys.
   (Once, Pages skipped a merge — an empty commit on `main` re-triggered it.)
4. Do not touch `.env` tracking without first moving the variables into Railway (two attempts broke the deploy and were reverted).

### Open items
- Confirm with the department: how interconsultas arrive (HIS / phone / paper), whether there is a rota, the real
  response targets, whether follow-ups are tracked.
- Ask on the Urology visit (Monday): how the ADX data reaches them (export, API, manual), which ISO 7101 indicators they track.
- OR-4: walk each unit with its coordinator — add/rename measures, set indicator targets, register resources.
- OR-5: Mi espacio "your unit this week / your interconsultas", resident visibility of incidents, Grounded answers from Ops Room records.
- Security (outside Ops Room): rotate the keys in the committed backend `.env`, move them to Railway Variables, then untrack `.env`.
