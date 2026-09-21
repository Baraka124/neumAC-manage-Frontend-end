# neumDesk V46.9 — Clinical Units · Domain Semantics + Header Alignment

V46.9 corrects the Clinical Units domain model and aligns the module header with the established Overview dashboard language. It is intentionally not a backend release and does not change the V46.8 Grounded core architecture.

## Domain model

The Clinical Units UI now follows these rules:

- **Clinical Unit ↔ attending physicians** is a structural/contextual relationship. One or more attending physicians can be linked to a unit through `unit_staff` because they normally work in that clinical activity.
- **Clinical Unit ↔ resident** is time-bounded and represented by a resident rotation with explicit start/end dates.
- **Resident supervision** belongs to the rotation / residency programme / department level. A Clinical Unit does not need its own default resident supervisor in order to accept a resident.
- **Resident capacity** is a configured property of the Clinical Unit and is independent of the number of attending physicians linked to it.
- Recorded attending leave is useful context, but it is not automatically a hard resident-capacity constraint.

This removes the earlier semantic conflation between unit membership, staff availability and formal resident supervision.

## Header alignment

Clinical Units now uses the same contextual hero grammar as Overview:

- the global shell already names the module (`Clinical Units`), so the hero does not repeat the module name as a second giant heading;
- the hero title changes with the selected lens and current planning context;
- actions use the Overview `dbh-*` system;
- operational attention uses the same alert rail;
- the generic breadcrumb band is hidden for Clinical Units;
- the hero is deliberately crisp: strong dark surfaces, no decorative haze and no translucent blur.

The three lenses remain distinct:

1. **Resident rotations / Rotation capacity** — month-by-month resident placement and exact date windows.
2. **Unit staff / Attending physicians** — structural attending links, with recorded leave as secondary context.
3. **Unit structure / Unit directory** — people, current/incoming residents, capacity and unit details.

## Operational attention vs data setup

V46.9 separates issues by meaning.

**Operational attention** is reserved for conditions such as resident-capacity violations, recorded rotation overlaps, or an already-linked unit whose recorded attendings are all away today.

**Data setup** contains incomplete structural information such as a Clinical Unit with no attending physicians linked or a failed staff-link load. Missing attending links do not make a unit unavailable for resident placement.

## Attending links and supervision

The attending-management modal now manages only `unit_staff` links. Saving attending links does not update any unit-level supervisor field.

The Clinical Unit edit form no longer presents or saves a unit supervisor. Legacy backend fields may remain present for compatibility, but V46.9 does not treat them as the source of truth for Clinical Unit semantics.

The resident-rotation form still requires a formal supervising attending because the current rotation schema requires it. The selector now prioritizes explicitly recorded **department resident supervisors** when available, followed by other eligible attendings. Selecting a Clinical Unit never auto-assigns a supervisor.

The Department panel also now displays Clinical Unit membership from `unit_staff` rather than inferring a unit from legacy `supervisor_id` fields.

## Unit detail

The canonical Clinical Unit record now separates:

- resident capacity today;
- attending physicians linked to the unit;
- current residents;
- incoming rotations;
- exact next resident opening;
- department-level resident supervision context;
- 12-month resident capacity;
- data-setup notes.

This supports the natural reading of a unit such as Severe Asthma: the attendings who normally work there, the residents currently rotating there, upcoming residents, and resident-programme supervision as a separate department-level concept.

## Grounded semantics

The V46.8 Grounded architecture is unchanged. V46.9 updates only the Clinical Units adapter semantics.

- `clinical_units.attending_context` returns structural attending links plus department-level resident-supervision context.
- attending links and department supervisors are descriptive context, not capacity gates.
- `clinical_units.available_units` determines eligibility from resident capacity over the requested interval.
- `resident_rotations.propose_assignment` blocks on resident overlap and unit capacity, while carrying attending/supervision context into the proposal.
- legacy questions such as “which units have no supervisor?” are answered by explaining that Clinical Units do not require a unit-level resident supervisor.

## Release boundary

No backend source file is included or modified in V46.9. `grounded-core.js` remains the V46.8 architecture foundation. V46.9 changes frontend domain semantics, presentation and the Clinical Units Grounded adapter only.

Live authenticated browser testing remains required after deployment, especially for real `unit_staff` links, rotation supervisors and existing legacy unit records.
