# Ops Rooms — Operaciones clínicas · plan of record

Status: **design agreed 16 Oct 2026, nothing built yet.** This file is the reference for every Ops Rooms step.

## 1. Purpose

Ops Rooms is where Pulmonology's clinical units are **run**: who works there, what they use, what they do,
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
| OR-3 | Indicators (targets, owners, values, optional ISO 7101 clause) |
| OR-4 | Remaining Pulmonology units, each with only its capabilities |
| OR-5 | Connections: Mi espacio, resident visibility, Grounded, leadership overview |
| OR-6 | Hospital feed for high-frequency activity — only with an approved source |

Each step: migrations with RLS, permission checks on every route, tests, rendered check, merged only when green.
