# neumDesk V46.14 — Grounded Phase 4.1D changes

## Purpose

Phase 4.1D is a narrow Grounded collection-density pass based on live authenticated feedback from the Clinical Units answer. It does not redesign the Grounded shell or any Staff/module UI.

## Changed

- Generic structured `reslist` answers now use a compact inline scope line instead of the large **Answer scope / Hide detail** card.
- Clinical Units remains a five-record preview for ordinary `clinical units` queries.
- Explicit full-list requests such as `list all clinical units` start expanded and no longer show a redundant collapse control.
- A manually expanded preview uses **Collapse list**, replacing the awkward **Show fewer** label.
- Collection identity rows place the record code/badge in a stable right-hand column instead of concatenating it visually with the title.
- Collection row padding and metadata spacing are slightly reduced while preserving the Phase 4 11px meaningful-support-text floor.
- Complete collection answers compress provenance to **Sources verified · <sources> · Prepared <time>**; partial/unavailable-source warnings remain visible.
- Collection CSS is appended under `.nd-intelligence-shell .askbar-turn--collection` only.

## Explicit preservation boundary

Unchanged:
- Staff Phase 4 UI and selectors;
- global neumDesk navigation/header/workspaces;
- Grounded shell/header/composer layout;
- Grounded routing, source dependency contract and confidence calculation;
- Leave, On-call and Rotation READ/PROPOSE/WRITE semantics;
- `grounded-core.js`;
- `activity45.js`;
- `SUPABASE_SCHEMA.sql`;
- permissions and sync contracts.

The 4.1D `style.css` is byte-for-byte identical to the 4.1C stylesheet up to the new appended, Grounded-collection-scoped block.
