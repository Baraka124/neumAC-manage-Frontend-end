# neumDesk Staff domain & lifecycle — V46.14 preservation map

**Purpose:** this document is the guardrail for the Staff redesign. UI work may reorganize or clarify these concepts, but must not silently delete, merge or reinterpret them without an intentional domain decision and regression coverage.

## 1. Staff is a Person record, not a table row

The current `medical_staff` record can represent attendings, residents and other departmental staff types. `staff_type` is dynamic through the `staff_types` table; the UI must therefore use `isResidentType()` rather than assume that only the literal key `medical_resident` can be a resident.

Common identity/affiliation data already supported includes:
- name, staff ID, professional email and employment status;
- department and hospital;
- affiliation type and primary/home department information;
- academic degree, specialization and professional credentials;
- public profile/photo fields;
- departmental role flags and research capabilities.

## 2. Resident lifecycle semantics

Resident category is independent from the dynamic staff type and currently supports:

### Resident · Internal (`department_internal`)
A Pneumology-hosted resident in the department's long-term residency programme. They may rotate to other departments during training.

### Resident · Rotating (`rotating_other_dept`)
A resident whose home department is another department in the same institutional environment and who temporarily rotates through Pneumology. Origin is represented through `home_department_id` / `home_department`.

### Resident · External (`external_resident`)
A resident visiting Pneumology from another institution. The model supports `external_institution` plus external contact fields.

The UI must always render the full semantic phrase (`Resident · Internal`, `Resident · Rotating`, `Resident · External`) rather than a bare `Internal` / `External` label.

## 3. Residency year

The existing precedence is preserved:

`residency_year_override` → calculated `residency_year_calc` → legacy `training_year`.

The calculated year is driven by `residency_start_date`; the manual override remains editable. Legacy values such as `PGY-2`, `R2`, or older year-like values are not silently rewritten during this UI phase.

## 4. Rotation relationships

A resident normally has one active rotation at a given time, represented in `resident_rotations` and linked to a Clinical Unit / training unit.

The rotation carries its own time window and formal `supervising_attending_id` relationship. Staff UI must not infer a new hard supervision rule that the backend does not enforce.

Clinical Unit membership / hosting context and formal rotation supervision remain related but distinct concepts. Existing unit membership is exposed through the real `unit_staff` relation and `/api/staff/:id/units`.

## 5. Supervision / resident-management roles

The staff model already supports:
- `can_supervise_residents`;
- `is_resident_manager`;
- the formal supervising attending on individual rotations;
- unit membership / clinical hosting context.

Real departmental practice may allow the same people to act as programme manager/tutor, formal supervisor and/or practical host at different times. The Staff redesign must expose recorded relationships without imposing a stricter distinction unless the backend/data model is intentionally changed later.

## 6. Operational state

Do not equate these concepts:
- `employment_status = active` = active staff record;
- current absence = person is recorded away for the current date;
- on-call today = duty relationship;
- active resident rotation = current training assignment.

The directory therefore uses **Active staff** rather than **Available** unless actual availability is explicitly computed from operational records.

## 7. Existing lifecycle actions that must survive UI redesign

### Create / edit
The current form supports identity, professional information, resident category/origin, residency year/start, role flags, research capabilities, hospital/department affiliation, certificates and public-profile fields.

### Staff type transition
When a staff member changes from a resident-type staff type to a non-resident type, the backend automatically terminates active/scheduled resident rotations as `terminated_early` and returns warnings.

### Deactivation / removal
The current frontend scans future on-call shifts, active/scheduled rotations and coverage relationships before deactivation and offers reassignment where appropriate. The backend uses a soft-delete (`employment_status=inactive` + `deleted_at`) so historical records remain auditable.

The redesigned UI may rename the user-facing action to **Remove from active staff** / **Deactivate**, but must continue to call the existing guarded workflow rather than directly deleting data.

## 8. Phase plan

### Phase 1 — Directory shell + first operational table — IMPLEMENTED IN THIS CHECKPOINT
- remove redundant primary-module breadcrumb;
- contextual Staff hero with truthful metrics;
- separate view controls from actions;
- repair the broken People view;
- searchable role/department/origin semantics;
- first neumDesk operational-table specimen;
- full resident category labels + effective residency year;
- row-level action menu while preserving Edit / Personal Activity / guarded removal.

### Phase 2 — Canonical Person profile — IMPLEMENTED IN THIS CHECKPOINT
- compact identity rail replaces photo-dominant / zero-metric presentation;
- task-centred sections are `Overview`, `Work & training`, `Schedule`, `Research`, and `Profile`;
- units, schedule, rotations, supervision, research, roles, credentials, certificates and contact remain reachable;
- current absence/on-call/rotation and next recorded events are rendered from live operational records;
- Clinical Unit membership is loaded with the Person profile;
- registration/edit/deactivation/type-transition workflows are unchanged;
- security and sync architectures are carried as deferred contracts, not partially implemented here.

### Phase 3 — Adaptive resident profile
- Internal / Rotating / External resident variants using the same canonical Person shell;
- current rotation, origin, year, supervisor/manager context, host unit and history;
- no new backend constraints unless explicitly agreed.

### Phase 4 — Lifecycle/actions + visual hardening
- registration/edit review against this preservation map;
- icon/status grammar extraction from the surviving Staff patterns;
- responsive and accessibility review;
- live-browser validation before propagating the table/person patterns to other modules.
