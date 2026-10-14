# neumDESK · Phase 37A–37C — Mi Espacio release evidence

**Status: IMPLEMENTATION CANDIDATE — NOT REAL-ACCOUNT SIGNED OFF**  
**Date:** 14 October 2026  
**Scope:** personal-workspace accuracy, small presentation adjustment, release tests and audit; no backend changes.

## 37A · Source-of-truth audit

Inspected frontend `mi-espacio/mi-espacio-data.js` / `mi-espacio.js`, and backend `Baraka124/neumAC-manage-back-end/index.js` on main.

| Source | Confirmed contract | Limitation |
|---|---|---|
| `/api/auth/me` | Session identity and exact `medical_staff_id`; frontend refuses unverified identity | Real staff/account linking requires authorized acceptance |
| `/api/me/context` | Own on-call role/date; resident/supervisor rotation; absence; research lines; clinical_trials PI/co/sub investigator; innovation_projects lead/co-investigator; structured publication authors | Backend currently filters completed/withdrawn trials and completed innovation projects. Thus the new Phase 35 'completed participation' section is **not an exhaustive project/study history**. |
| Clinical study membership | `PI`, `co-investigator`, `sub-investigator` from explicit staff ID/array fields | No distinct verified Co-IP field from this endpoint. Do not infer Co-IP from co-investigator. |
| Study status & trial type | `status`, `protocol_id` | Backend does **not** send `study_type`; refrain from claiming every study is a clinical trial. A study may be drawn from the `clinical_trials` table but record type still needs governance validation. |
| Innovation project | `development_stage || current_stage`, `category`, lead/co-investigator | Stage comes from recorded source; classifications, historical coverage and role mapping need governance review. |
| Publication authorship | `publication_authors.staff_id` linked to permitted staff | Do not derive missing authorship from text names. |
| Underlying queries | Multiple `supabase.from` reads in parallel | Some per-table query errors are not handled before mapping `data || []`; temporary backend failures may look like no personal record. **Separate backend fix** is needed. |
| Upcoming absences | PR #148 is an independently developed frontend change depending on backend deployment | Do not modify or merge its branch as part of 37. Confirm backend/frontend version parity first. |

## 37B · Narrow visual consolidation

- Reuse one source-meaningful human status label for study records and project stages in the contextual research reader.
- Include study protocol reference when available and explicitly identify **recorded** status/stage, including unknown.
- Clarify that the scoped personal reader is **linked authorized records, not necessarily complete historical research**.
- No CSS layering, redesign, role-specific invented views or new endpoints.
- Preserve profile form persistence, guardias, navigation/return focus, notifications and clinical workflow.

## 37C · Acceptance and release gates

Existing browser suites (Phase 26–35) remain required along with the new Phase 37 contract checks. After CI passes, manual **authenticated** sign-off must be recorded by an authorized reviewer.

| Gate | Required evidence | Status |
|---|---|---|
| Head of department | Actual own studies/projects and leadership, correct role/status, unrelated projects absent | PENDING |
| Clinician | Confirm assigned guardias, supervised rotations, absences, verified research and non-inferred availability | PENDING |
| Resident | Rotation/clinical unit/period/supervision from real record, 403 and blank-state semantics | PENDING |
| Biomedical engineer / researcher | Verify study/project PI vs co-investigator and stage against owned source | PENDING |
| Administrator | Only allowed professional information and intended review controls, no cross-account leakage | PENDING |
| Direct denied API | 403 on unauthorized reads; no stale record after revoked access | PENDING |
| Account switch | Old private context cleared; no late async responses or retained selections | PENDING |
| Profile editing | Dirty confirmation, authorized save/refetch, no silent completion or lost changes | PENDING |
| Workspace interactions | Overview ↔ directory/calendar/duties/research/profile; keyboard focus and scroll return | PENDING |
| Responsive | 390/768/1366/1920/2048 at known zoom, short laptop viewport, reduced motion, 44px targets | PENDING |
| Printing/export | Dossier/PDF pagination and user-scope validation in real browser | PENDING |
| Deployment | Deployed revision, index cache versions, authenticated role/asset parity and rollback target | PENDING |

## Backend follow-up — deliberately separate

**Do not misrepresent completed history or transient query failures.** Proposed backend work, requiring its own review and explicit approval:

1. Decide whether personal scientific participation is current-only or full history; if full history, build appropriately bounded historical pagination and visibility rules rather than silently deleting filters.
2. Distinguish source query **unavailable/error/forbidden** from successfully returned empty lists.
3. Agree on study/trial classification and Co-IP versus co-investigator roles from actual schema and approved clinical governance.
4. Preserve lifecycle and recruitment status as separate concepts; neither is evidence of ethics approval or readiness to recruit.

**Phase 36 sharing remains deferred and outside this scope.**

**Release status:** CI can validate fixture behavior; this document does not establish real-account or clinical sign-off. Do not declare Mi Espacio fully production accepted solely on a green CI check.
