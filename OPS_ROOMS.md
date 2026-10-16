# Pneumo Ops Room — Sala de Operaciones de Neumología · plan of record

Status (16 Oct 2026): **OR-1 and OR-2 built.** Live: units, ¿Quién está? (roster + residents from Rotations),
¿Con qué contamos? (resources, status, calibration, loans, history), ¿Qué hemos hecho? (activity per day from each unit's
catalogue), ¿Qué está pendiente? (dated snapshots, oldest pending date), ¿Qué ha fallado? (incidents with owner and
resolution). Next: **OR-2b interconsultas**, **OR-3 indicators (¿Cumplimos?)**. This file is the reference for every Ops Room step.

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

## 6. Decisions to take before building

1. **One unit identity.** `training_units` is the live registry (19 units, capacity, supervisors). `clinical_units`
   has 1 row; `clinical_unit_assignments` and `unit_staff` are empty. Proposal: keep `training_units` as *the*
   unit (add "run by Pulmonology" + capabilities), retire the unused parallel tables.
2. **Roster table**: reuse `clinical_unit_assignments` (re-pointed to the single unit) or a new table — decide in OR-1.
3. **Current "Ops Room" view** (communications hub: Pulse · Feed · Briefing): rename/move it so the name
   Ops Rooms means clinical operations.
4. **Hospital data source** (ADX or other): does an approved automatic feed exist for census/admissions?
   Until confirmed, those numbers are not shown.
5. **First unit**: PFR or Unidad del Sueño (equipment + pending work, no hospital data needed).

## 7. Build sequence

| Step | Delivers |
|---|---|
| OR-1 | Unit identity cleanup + operational profile + **unit roster** |
| OR-2 | First unit end to end: resources + events, activity catalogue + counts, pending work, incidents |
| OR-2b | **Interconsultas**: request record, pending board, assignment, response-time indicators |
| OR-3 | Indicators (targets, owners, values, optional ISO 7101 clause) |
| OR-4 | Remaining Pulmonology units, each with only its capabilities |
| OR-5 | Connections: Mi espacio, resident visibility, Grounded, leadership overview |
| OR-6 | Hospital feed for high-frequency activity — only with an approved source |

Each step: migrations with RLS, permission checks on every route, tests, rendered check, merged only when green.
