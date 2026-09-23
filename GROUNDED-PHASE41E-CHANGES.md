# neumDesk V46.14 — Grounded Phase 4.1E

## On-call temporal precision + roster tightening

This checkpoint is deliberately narrow. It corrects the live on-call semantics exposed during authenticated testing and tightens only Grounded roster presentation.

### Intelligence corrections
- Named on-call questions now preserve an explicit date/window.
- `is <person> on call today` answers today first; if false it may then state the next recorded shift.
- `when is he/she on call` continues to return the next upcoming shift for the current Person context.
- Named schedule/list requests return that person's upcoming on-call schedule rather than only the next shift.
- Broad phrases such as `all next on call` / `list all scheduled on call` no longer inherit a previously pinned Person.
- Explicit `all` / `list` requests no longer truncate the upcoming schedule to four records.
- Broad roster answers no longer pin the first clinician as Person context; they retain an on-call schedule context instead.

### Presentation tightening
- On-call roster results now use the compact collection-scope line already introduced for structured collections.
- Verified roster provenance uses the same compressed source treatment as other structured collections.
- A small roster-density block is appended to CSS and scoped strictly beneath `.nd-intelligence-shell .askbar-turn--collection`.
- Staff Phase 4, global neumDesk navigation, module surfaces and the Grounded shell are not redesigned.

### Preservation
No schema, permission, Staff lifecycle, leave-write, rotation-write or on-call write contract is changed.
