# Mi Espacio · Phase 27C release audit

**Change baseline:** Phase 27B merge commit `0bff7c8ea1fcf4908238a64fdda54f7f9778998c`. This file is an audit and release-control artifact, **not** evidence that real clinician sessions were tested.

## CI release gates
- Integrity/check and browser smoke must pass at the exact commit SHA selected for deployment.
- Browser acceptance includes department-head, clinician, resident, biomedical engineer synthetic fixtures (27A), 390/768/1366 geometry and reduced motion (27B), account switching and guardia/calendar/directory interaction.
- Actual authorization is enforced by the existing backend; frontend permission controls are additional safeguards, never a substitute.
- No patient records, user identifiers, credentials, screenshots of real profiles or token material are stored in the repository.

## Manual acceptance: all PENDING until signed off
- Authorized head of department: relevance and correctness of linked leadership, studies, publications and permissioned handoffs.
- Authorized clinician: actual on-call schedule and supervisor context, Calendar date and Directory detail return.
- Authorized resident: true residency/rotations and role-specific permissions, including denied module attempts.
- Authorized biomedical engineer: linked research without invented clinical duties.
- Real staging 403/revocation, slow API responses, failed save, logout/login cross-account data separation, keyboard/short viewport focus, mobile and reduced motion.
- Editorial readability, screen recordings at 390, 768, 1366 (redacted) reviewed by departmental owner; all critical defects resolved.

## Go / no-go checklist
1. Verify GitHub PR merge commit, passing check and smoke for exact SHA; inspect deployment build logs and URL.
2. Capture production baseline SHA and **previous known-good deployment SHA** in a private release ticket. Do not write guessed rollback references into this file.
3. Obtain explicit reviewer sign-off of the above real-account gates; note issues, owners and dates securely.
4. Validate CI smoke against the merged `main` and confirm no unrelated modules changed.
5. Only then authorize a rollout. If a severe regression is observed, use the hosting provider's verified previous deployment / approved Git revert after impact review. Preserve database and backend schema; this PR makes neither changes.

**Current decision: NO-GO for authenticated release sign-off.** Automated coverage and CI can be accepted and merged as a release-control framework, but the above authenticated evidence and actual deployment/rollback identifiers remain unverified. Revisit this decision when an authorized reviewer records the evidence.
