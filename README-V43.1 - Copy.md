# neumDesk V43.1 — Grounded hardening

Baseline: the user-supplied neumdesk-v43-grounded-intelligence(2).zip.
This is a separate release copy. No backend or login redesign is included.

## Changes

- Grounded leave edits now use /api/absence-records/:id through the existing API update method. Confirmation reads the current record, detects changed fields, preserves the complete date/coverage/notes payload, rejects invalid date ranges, and prevents duplicate or cancelled submissions. A successful write is followed by a fresh read. The preflight change check is not an atomic database concurrency guarantee.
- New conversation re-infers the visible record, clearing turns and draft query while retaining object-specific context and suggestions. Moving from a global thread to an object also starts a clean contextual thread.
- Opening Grounded performs explicit uncached reads and waits for a complete snapshot before allowing new questions. The header says snapshot, not continuously live. Failures, malformed responses and timeouts pause answers with a retry control; previous answers remain historical. Older refresh results cannot replace a newer snapshot or another user's session. Ordinary delayed answers are discarded after close/reopen.
- Paginated staff, leave, rotations, studies, projects and Library records are fetched across pages (bounded to 100 pages per source and a 15-second refresh deadline). A partial response is not accepted as a verified complete snapshot.
- HTML cache keys are bumped to 43.1; a compact accessible readiness notice is added. The existing Research and article interfaces are preserved.

## Deliberate safety trade-off

Grounded supports cross-module questions, so this patch requires all nine consulted sources to refresh successfully. A user lacking access to any required source will see the retry/access notice, not partial answers. Per-intent, permission-aware partial-source support is future work. Existing module views remain available. Other module loaders can still update shared refs; this is a verified refresh gate, not a database-transaction snapshot or a continuous real-time subscription.

## Validation performed

- Frontend JavaScript syntax check passed.
- 12 executable isolated tests passed: readiness, failure, retry, pagination, malformed responses, overlapping refreshes, reset context, complete leave payload, duplicate confirmation, changed-record conflict, invalid dates and cancellation.
- Test command: node test-v431.cjs. Tests extract the shipped function bodies and use in-memory API doubles; they do not contact production.
- Original source files remain unchanged. The backend is not included because no backend changes were made.

## Live acceptance gate before V44

The local browser was blocked during the preceding audit; this release has not passed authenticated browser or mobile visual testing. Deploy the three frontend files together, then verify:

1. Study, Project, Programme, Library and staff contextual entry; same-record reopen; different-record reset; global entry.
2. New retains the visible object's context; all contextual suggestions and typed equivalents resolve.
3. Refresh notice, successful verification, offline/failure pause, retry, rapid close/reopen.
4. Leave edit confirm, cancellation, permission refusal, changed-record rejection, retained coverage/notes and refreshed UI.
5. Exact record navigation and desktop/mobile layout, including short screens and the onscreen keyboard.
6. Normal startup, refresh and expired-session behavior.

## Outside this patch

The inherited bulk-absence helpers still contain incorrect endpoints (and bulk undo needs review), user/profile linking lacks a matching backend route, and CSV/iCal helpers use the wrong token key. They are not silently declared fixed. The backend's Grounded thread-turn ownership checks also deserve security review before those currently unused endpoints are connected. V44 has not started.
