# Mi Espacio · Phase 26F — Release acceptance and evidence register

**Baseline:** Phase 26E merged into main. Scope: Mi Espacio professional workspaces only. No backend schema or permission changes.

## Automated checks (synthetic, never real identities)
- Existing CI: personal context identity checks, stale responses, linked/unlinked separation, profile edit and discard rules; Phase 26A–E contracts.
- Browser smoke: clinician, department head, resident, biomedical engineer at representative widths; preview and profile workspace navigation; denial and response failure states.
- Phase 26F targeted test: authenticated requests only; 403 does not become an empty authorized result, inaccessible research handoffs stay hidden, no staff-wide backend fallback.
- Every build must pass `Frontend integrity / check` and `Frontend integrity / smoke` at its exact PR head. CI results are evidence only for tested fixtures.

## Manual authenticated acceptance — NOT VERIFIED BY CI
| Gate | Required evidence / pass criteria | Current status |
| --- | --- | --- |
| Head of department | Authorized session; leadership context, linked research and publication titles, Calendar/Directory/shortcuts, profile save/discard; no fabricated responsibilities | PENDING |
| Clinician | Real guarded session; verified guardias and supervision, calendar event/date return, member previews, no cross-user edit | PENDING |
| Resident | Correct rotation and supervision distinction; unlinked and restricted access states, responsive navigation | PENDING |
| Biomedical engineer | Only assigned research appears, role label and profile accuracy; no clinician-only tasks inferred | PENDING |
| Real server 403 | Revoke or deny resource in staging; no stale personal data shown; controlled message; no fallback to staff-wide read | PENDING |
| Account/session change | Real logout/login into another authorized test account; clear filters, details, draft and cached data, prevent stale responses | PENDING |
| Responsive + accessibility | 390, 768, 1366 and short laptop viewport; screenshot and keyboard focus return; Escape closes detail but never loses unsaved edits; reduced motion | PENDING |
| Release and rollback | Staff owner approves captured redacted evidence; production Vercel deployment has known SHA and rollback target; no regression in global app | PENDING |

## Execution rules
Use only consented non-patient accounts. Never commit videos, screenshots, credentials, personal data, server tokens, or identifying fixture details. A green synthetic browser run **does not** convert any PENDING gate to PASS. Record evidence securely off-repo and mark each gate only after an authorized reviewer actually completes it.

## Sign-off
Phase 26F can merge as a test-and-evidence framework when both CI workflows pass, but **real-account acceptance remains blocked** until the above gates have been executed. No claim of a clinically validated or fully released workspace should be made without these checks.
