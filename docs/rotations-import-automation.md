# Rotations Import — Automation Path

**Status:** manual import shipped (Oct 2026). This doc is the forward plan for automating it from a Google Sheets source.
**Context:** The department's rotation plans live in a Google Sheet (owned by the department head, shared read-only). We now ingest them into `resident_rotations`; the next step is to pull them without a manual download.

---

## 1. What exists today

A three-part pipeline, all merged/green:

| Part | Where | What it does |
|---|---|---|
| **Translation engine** | `rotation-import.js` (`window.NeumRotationImport`) | Pure, browser+Node. `translate(sheets)` turns the `MIR NML <year>` resident × month matrix into flat rotation periods (collapse consecutive months, merge across year boundary, split multi-unit cells). `plan(periods, staff, units)` resolves names/units against live data and reports what's ambiguous. `payload()` builds the commit body. |
| **Commit endpoint** | `POST /api/rotations/batch` | `dry_run:true` checks, `dry_run:false` commits. Creates unknown units on the fly, defaults supervisor to the resident coordinator (`is_resident_manager`), **idempotent** (skips identical resident+unit+window), overlap/capacity via the shared decision engine. |
| **Preview UI** | Settings → Schedule import | Upload `.xlsx` → map ambiguous residents/units → check → commit. |

**Key property for automation:** the engine takes *parsed rows*, not a file. The `.xlsx` upload is just one input adapter. Anything that can produce rows — a Google Sheets fetch — plugs into the exact same `translate → plan → payload → /api/rotations/batch` flow. Nothing downstream changes.

---

## 2. The automation goal

Pull the department head's sheet on a schedule (or on demand), run the same dry-run → commit, with a human approving changes — so the plan in the sheet and the plan in the system stay in sync without anyone exporting a file.

---

## 3. Options, easiest first

### Tier 0 — Manual (works today)
Sheet → File → Download → `.xlsx` → upload to the importer. No new code. Right answer for an occasional pull.

### Tier 1 — Publish-to-web CSV (easiest automation)
The **owner** (dept head) does File → Share → **Publish to web** → CSV, per tab.
- Gives a plain URL our backend can `GET` with **no auth**.
- A scheduled task fetches it, parses CSV → rows → existing pipeline.
- **Trade-off:** that tab becomes readable by anyone with the link. May be acceptable for a rotation grid, may not for staff data — the dept head decides.
- **Note:** publish-to-web exposes one tab per link; the workbook has many sheets (`MIR NML 2026…2030`), so several published links or a consolidated tab.

### Tier 2 — Google Sheets API (private, "right" long-term)
A connected Google account or **service account** with read access to the sheet; fetch via the Sheets API.
- Keeps the sheet fully private.
- Real setup: service-account credentials, share the sheet with that account, store the key securely (not committed), add a small fetch module.
- Best end state; most upfront work.

---

## 4. Build sketch (Tier 1/2)

1. **Fetch adapter** (`rotation-source.js` or a backend route): URL/credentials → `{ sheetName: rows[] }`, the shape `translate()` already expects.
2. **Endpoint** `POST /api/rotations/import-from-source` (or extend the batch flow): fetch → `translate` → `plan` against live staff/units → return a dry-run diff.
3. **Approval:** surface the diff in the same preview UI (reuse the review grid) or send a summary for one-click approve. **Never auto-commit silently** — the dept head's sheet is a draft that changes; a human confirms.
4. **Schedule:** a scheduled task runs the fetch+dry-run on a cadence (e.g. weekly), and only notifies when the diff is non-empty.

**Mapping memory:** persist the resident-name and unit-code mappings (like the on-call import remembers them) so automated runs don't re-ask for the same "Ana" every time.

---

## 5. Why re-running is safe

Already true in the shipped endpoint:
- **Idempotent dedup** — identical resident + unit + date window is skipped, so re-fetching the same sheet never duplicates.
- **Provenance** — each imported rotation records its source file/sheet in `notes`.
- **Derived status & conflict checks** run on every write, so a re-import can't create overlaps or stale states.

So a scheduled pull is low-risk by construction; the only genuinely new surface is the fetch + its auth.

---

## 6. Open decisions (for later)

- Privacy call on publish-to-web vs. service account (dept head).
- Cadence + who approves the diff.
- How to treat rows the sheet *removes* (a rotation deleted upstream) — the current import only adds/updates; deletions would need an explicit reconciliation step.
- The non-cohort sheets (per-person tabs, `Broncoscopias`, `Externos`) are not parsed yet — in scope only if automation should cover externals/capacity too.

---

*Companion to: engine PR #165, endpoint PR #39, UI PR #166.*
