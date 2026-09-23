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

### Phase 3 — Adaptive resident profile — IMPLEMENTED IN THIS CHECKPOINT
- Internal / Rotating / External resident variants using the same canonical Person shell;
- current rotation, origin, year, supervisor/manager context, host unit and history;
- no new backend constraints unless explicitly agreed.

### Phase 4 — Lifecycle/actions + visual hardening
- registration/edit review against this preservation map;
- icon/status grammar extraction from the surviving Staff patterns;
- responsive and accessibility review;
- live-browser validation before propagating the table/person patterns to other modules.

## 9. Phase 3 implementation — adaptive resident profile

> **Vue template hotfix:** live browser validation found a Phase 3 `compiler-30` template adjacency error. Two new fallback branches were rewritten from `v-else` to explicit inverse `v-if` conditions. No lifecycle or resident-domain semantics changed.


**Implemented in this checkpoint.** The canonical Person shell now adapts its resident presentation without creating a parallel resident data model.

### Internal resident
- rendered as `Resident · Internal`;
- effective R-year is shown using the preserved precedence `override → system calc → residency start → legacy value`;
- programme start / calculated end remain visible when recorded;
- current/next host rotation, exact rotation window and recorded rotation supervisor are shown from `resident_rotations`;
- department `is_resident_manager` roles are shown separately as resident-management context.

### Rotating resident
- rendered as `Resident · Rotating`;
- home department is shown as the origin relationship;
- current/next Pneumology host unit and exact rotation window are shown separately;
- rotation supervisor and resident-management roles remain distinct recorded relationships.

### External resident
- rendered as `Resident · External`;
- home institution and, where recorded, home department are shown as origin context;
- external contact information remains available;
- host unit, window and recorded supervisor come from the rotation record.

### Legacy year normalisation
A legacy bare calendar year such as `2024` is interpreted for **display** as the programme start year and converted to the effective R-year for the current date. The stored legacy value is not overwritten. The manual `residency_year_override` remains authoritative and editable.

### Preservation rule
Phase 3 is a rendering/adaptation layer. It does not add a new backend supervision constraint, does not create a second resident record, and does not change the registration/edit/deactivation lifecycle.
## 10. Phase 3.1 implementation — profile integrity

Phase 3.1 preserves the Phase 3 resident taxonomy and fixes integrity gaps found during direct package inspection.

- **Unknown category remains unknown.** Missing `resident_category` displays `Resident · Category not recorded`; it is never treated as `department_internal`.
- **Current ≠ next rotation.** The selected current (`active`/`extended`) or next (`scheduled`) rotation is labelled explicitly in host-unit, window and supervisor presentation.
- **Host attending team is context.** Existing `unit_staff` links are displayed for the selected host unit but do not replace the recorded `resident_rotations.supervising_attending_id` or resident-management roles.
- **Leave is de-duplicated temporally.** A leave starting today is current leave and is excluded from the upcoming list.
- **External contact is complete.** Name, email and phone remain available when stored.
- **Person-load isolation.** Profile-local async state is reset and guarded so one clinician's delayed response cannot leak into another clinician's profile.
- **Research permission mapping.** Person-profile research reads depend on the actual research modules, not an `analytics` permission that is not part of the current backend permission list.
- **Accessibility baseline.** The canonical Person surface is a dialog with labelled tabs, focus containment and Escape close behavior.

No Phase 3.1 rule writes or normalises stored resident fields. The year precedence and display-only legacy normalization remain unchanged.
## 11. Phase 3.1 browser-DOM template safety

The second live Phase 3.1 deployment exposed a release-wide Vue compiler failure (`compiler-30`) even though JavaScript syntax and source-level conditional checks passed. The root cause was browser parsing of the in-DOM Vue template: literal `<` comparisons inside HTML attributes and interpolation expressions can alter the DOM before Vue receives it.

Corrections:
- all literal `<` comparisons in Vue-bound attributes are represented as `&lt;` in `index.html`;
- all literal `<` comparisons inside interpolation expressions are represented as `&lt;`;
- this is source encoding only: the browser decodes the operator back to `<` before Vue evaluates the expression;
- Chromium parsing verifies 191 `v-else` / `v-else-if` branches with zero broken adjacency relationships;
- a permanent DOM-template safety regression test now blocks raw `<` operators from these template contexts.

No Staff domain, resident lifecycle, backend or stored-data semantics changed.

## Staff Phase 4 — reusable UI foundation

The Staff directory and canonical Person profile now carry a parallel reusable `nd-*` component vocabulary while preserving every existing `staff46-*`, `pp2-*` and `pp3-*` compatibility hook. The extraction standardizes controls, focus treatment, operational table/status grammar, Person sections, record lists and support-text typography without changing lifecycle or runtime data behavior. `app.js`, Grounded and Personal Activity runtime files remain unchanged. See `UI-SYSTEM-V46.14.md`.

The Phase 4 implementation is complete in the release artifact. Authenticated four-profile and responsive checks remain the production acceptance gate; no lifecycle runtime behavior is changed by that gate.
**Phase 4 automated validation:** the preserved historical suite and the expanded Phase 4 foundation checks pass. No lifecycle runtime file changed; live four-profile validation remains required before production acceptance.

