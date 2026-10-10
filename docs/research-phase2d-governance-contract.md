# neumDESK · Research — Phase 2D clinical-study governance contract

Status: **review proposal, not implemented clinical logic**.

## Confirmed from existing collection
- Clinical Studies and Clinical Innovation Projects use separate collection views.
- The studies collection already exposes study status, an independent governance area and recruitment metadata.
- The studies collection opens the original study record instead of deriving a separate entity.
- Collection source loading has an explicit `ready` state; empty results can be distinguished from filtered results.
- Search and filters support study status, research line and phase.

## Do not conflate
1. **Record presence** — a study is listed in the portfolio.
2. **Study lifecycle status** — the existing status value as stored.
3. **Governance evidence** — protocol, relevant ethics review, permissions and date/version evidence *where applicable*.
4. **Operational readiness** — a decision that must depend on the authorised clinical workflow and verified evidence, not on a populated title/status alone.
5. **Recruitment status** — distinct from governance approval and distinct from operational readiness.

An unloaded, missing or inaccessible source is **unknown**, not zero studies and never approved.

## Required evidence before implementing readiness UI
For each candidate field, confirm its real source, data type, null semantics, record owner, edit authority, audit history, applicability and available relationships. In particular examine protocol identifiers and versions; ethics committee, decision and date where applicable; sponsor/investigator roles; recruitment dates and status; and whether there are independently evidenced activation gates.

Do not assume every clinical-study category shares one CEIm/CEIC approval path. Research governance owners must approve any mapping of field values into human-readable readiness labels.

## Proposed display model (subject to schema/clinical review)
A record may show factual metadata directly; only **verified** evidence may be labelled confirmed.
- `Not recorded`: the field is empty in a successfully loaded, authorised source.
- `Pending verification`: evidence exists but is not confirmed by its authorised process.
- `Verified`: an explicit, auditable verification is available.
- `Not applicable`: established by a documented rule or authorised user, never guessed.
- `Unknown`: source unavailable, permission-limited or freshness cannot be established.

Never compute a single "ready for recruitment" or "approved" badge from these labels without a signed-off decision rule. Never substitute this proposal for the application's existing statuses.

## Acceptance gates
- Study row, detail view and source values match; no invented readiness, approval or investigators.
- Permissions prevent unauthorised reads/writes, including through the API.
- Missing/failed/permission-denied/loading states tested separately.
- Authenticated Phase 4C CRUD, role, persistence and navigation gates remain outstanding.
- Responsive and keyboard navigation coverage: 390, 640, 800, 1180, 1366, 1440, 2048px.
- Only implement field mapping after reviewing actual schema and clinical governance workflow.

## Next scoped code change
Audit the actual studies schema and study detail component; produce a source-field inventory and test matrix first. Keep visual styling separate from clinical semantics.
