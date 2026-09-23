# V46.14 Grounded Phase 4.1E — Validation

## Result
- 29 regression suites executed
- 456 checks passed
- Grounded Phase 4.1E dedicated suite: 14/14 passed
- V46.14 DOM-template safety: 7/7 passed
- Staff Phase 4 UI Foundation: 24/24 passed
- Grounded 4.1A/4.1B/4.1C/4.1D preserved
- On-call, Leave and Resident Rotation action-integrity suites preserved

## Live issues addressed
1. A named `... on call today` question previously substituted the next shift instead of answering today's state.
2. A broad query such as `all next on call` could inherit the previously pinned Person.
3. Explicit `list all scheduled on call` requests were still bounded by preview limits.
4. Roster answers still used the larger legacy Answer Scope block rather than the compact collection scope treatment.

## Remaining acceptance
Authenticated live-browser verification is still required for:
- `when is he on call`
- `is Pedro Marcos on call today`
- `all next on call`
- `list all scheduled on call`
- one named `show <person>'s on-call schedule` query

The live backend remains the source of truth for actual names/dates returned.
