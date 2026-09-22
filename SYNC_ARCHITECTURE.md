# neumDesk — External File Sync Architecture

## 1. What we're syncing

The Servicio de Neumología at CHUAC maintains two operational Excel files that are the department's source of truth:

### File 1: Guardias de Neumología (On-Call Schedule)
- **Format:** `.xlsx`, multi-sheet, maintained by the department
- **Key sheet:** `2026+` — the active year
- **Structure:** Date | Day | Staff Name (surname) | Shift Type | Resident (MIR) | L flag
- **Shift types:** Presencial, Mixta, Localizada → mapped to `primary_call`, `on_call_mixed`, `on_call_home`
- **Volume:** ~273 rows/year (roughly one shift per weekday)
- **Update frequency:** maintained continuously, authoritative for on-call assignments

### File 2: Rotaciones y Disponibilidad (Rotations & Unit Availability)
- **Format:** `.xlsx`, matrix layout (units × months)
- **Structure:** Each row = a clinical unit, each column = a month, cell = resident name(s) assigned
- **Contains:** Unit capacities, resident assignments, supervisor assignments
- **Volume:** ~12 units × 12 months × 1-3 residents = ~100-200 assignments/year
- **Update frequency:** updated at the start of each rotation cycle (quarterly or as needed)

---

## 2. Current sync status

### On-Call (Guardias): ✅ Working — Phase 1 complete

| Step | Status | Detail |
|---|---|---|
| Upload Excel | ✅ | File picker in Settings, reads `.xlsx` |
| Parse sheet | ✅ | Auto-detects `2026+` sheet, extracts Date/Name/Type columns |
| Name matching | ✅ | Surname → `medical_staff` lookup (case-insensitive, accent-normalized) |
| Name mapping UI | ✅ | Unmatched names shown with dropdown to manually map or skip |
| Persistent mappings | ✅ | Saved in localStorage, auto-applied on next upload |
| Diff preview | ✅ | Shows: to add / to update / unchanged / unmatched counts + sample rows |
| Commit (upsert) | ✅ | Backend batch endpoint: insert new, update existing (by date+physician) |
| Shift type mapping | ✅ | Presencial→primary_call, Mixta→on_call_mixed, Localizada→on_call_home |
| Re-sync safe | ✅ | Same file can be synced repeatedly without duplicates |

**Results from first production sync:** 95 of 273 shifts synced successfully. Missing shifts due to:
- BRUN (21 shifts) — staff record was deleted, now re-added
- DOPAZOS (16 shifts) — surname doesn't match "Domínguez Pazos" (needs manual mapping)
- ANTELO (16 shifts) — should auto-match but didn't (investigation needed)
- Remaining gaps from the mapping UI "choose" state being left unselected

### Rotations: ○ Not started — Phase 2

The rotations Excel has a fundamentally different structure (matrix, not list) that requires a different parser.

---

## 3. Known issues and fixes needed

### Issue 1: Name matching gaps

**Problem:** The surname resolver tokenizes the staff `full_name` into individual words and looks up single tokens. This works for simple surnames (TIRADOS → Alicia Tirados) but fails for:

- **Compound surnames joined differently:** DOPAZOS in Excel vs "Domínguez Pazos" (two words) in the DB. The resolver looks for "dopazos" as a single token, but the staff name has "domínguez" and "pazos" as separate tokens.
- **Surnames that match multiple people:** Two Marías, two Fernández — ambiguity not surfaced during sync (only during chat).

**Fix options:**
1. **Fuzzy matching:** Use Levenshtein distance or trigram similarity. "DOPAZOS" is edit-distance ~3 from "PAZOS". This catches most compound-surname mismatches.
2. **Persistent mapping table (DB):** Instead of localStorage, store name mappings in Supabase so they work cross-device and are visible to administrators.
3. **Manual mapping always available:** The current UI lets you map unmatched names. This is the safety net.

**Recommended:** Add fuzzy matching as a second pass after exact token match, AND move mappings to a DB table.

### Issue 2: Partial sync without clear reporting

**Problem:** The sync reported "✓ Synced 102 shifts" but only 95 actually landed in the database. The frontend counts `saved += chunk.length` before checking the API response body. The backend returned `{ inserted: 0, skipped: 102 }` on the first attempt (CHECK constraint blocked `on_call_mixed`) but the frontend showed success.

**Fix:** The frontend commit function must read `result.inserted + result.updated` from the API response, not assume `chunk.length` all succeeded. Also display `result.skipped` and `result.conflicts` to the user.

### Issue 3: No conflict resolution for existing manual data

**Problem:** When the Excel and manually-entered data disagree (e.g., Excel says ANTELO on Sept 19, manual entry says Pedro), the sync inserts the Excel row alongside the manual one — creating two shifts for the same date. There's no UI to see or resolve these conflicts.

**Fix:** The sync preview (diff) should show conflicts: "Sept 19: Excel says Adela Antelo (Localizada), existing says Pedro Marcos (primary_call) — which one wins?" Options:
- **Excel wins (override):** Replace the existing shift with the Excel data
- **Keep both:** Multiple physicians can be on call the same day (legitimate for different shift types)
- **Flag for review:** Mark the conflict and let the user decide

### Issue 4: MIR (resident) column not used

The Excel has a column E for the resident assigned to each shift. Currently ignored. This should create a `backup_physician_id` or a separate resident on-call entry.

### Issue 5: No sync history

There's no record of when syncs happened, what file was used, how many shifts were added/updated. If something goes wrong, there's no way to trace what changed.

**Fix:** Create a `sync_log` table:
```sql
CREATE TABLE sync_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_type text NOT NULL,  -- 'oncall', 'rotations'
  file_name text,
  user_id uuid,
  shifts_inserted int DEFAULT 0,
  shifts_updated int DEFAULT 0,
  shifts_skipped int DEFAULT 0,
  name_mappings_used jsonb,
  created_at timestamptz DEFAULT now()
);
```

---

## 4. Rotations sync (Phase 2) — design plan

### The Excel structure

The rotations file is a **matrix**, not a list:

```
              | Sept 2026 | Oct 2026 | Nov 2026 | ...
UCI           | Santalla  | Horjales | Santalla | ...
asma grave    | Horjales  | Balboa   | Yoris    | ...
Broncoscopia  | Balboa    | Santalla | Horjales | ...
...
```

Each cell contains a resident surname. Some cells have multiple residents. Some cells are empty (unit not staffed that month).

### Parsing strategy

1. **Detect the matrix structure:** First column = unit names, first row = month headers
2. **For each cell:** Extract resident surname(s), resolve to `medical_staff.id`
3. **For each assignment:** Create a rotation record with:
   - `resident_id` = resolved staff ID
   - `training_unit_id` = resolved from unit name
   - `start_date` = first day of the month
   - `end_date` = last day of the month
   - `rotation_status` = 'scheduled' (or 'active' if current month)
   - `supervising_attending_id` = needs a separate lookup or column in the Excel

### Challenges specific to rotations

1. **Unit name matching:** "UCI" in Excel → which `training_units` record? Need a unit name resolver similar to the staff name resolver.
2. **Supervisor assignment:** The Excel may not specify who supervises. This would need to be assigned separately or defaulted.
3. **Overlap detection:** If a resident is already assigned to a unit for October (from a previous sync or manual entry), the sync needs to update rather than duplicate.
4. **Multi-resident cells:** A cell might say "Santalla / Balboa" — need to split and create two rotation records.

### Recommended implementation

```
Phase 2a: Parser only (read Excel, display preview)
Phase 2b: Name + unit matching (resolve to IDs)
Phase 2c: Diff preview (show what would change)
Phase 2d: Commit (upsert rotations)
```

Same pattern as on-call sync but with the matrix → list transformation step.

---

## 5. Proposed sync_name_mappings table (replace localStorage)

```sql
CREATE TABLE sync_name_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_type text NOT NULL,        -- 'oncall_staff', 'rotation_resident', 'rotation_unit'
  source_name text NOT NULL,      -- e.g. 'DOPAZOS', 'BRUN'
  target_id uuid NOT NULL,        -- medical_staff.id or training_units.id
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  UNIQUE(sync_type, source_name)
);
```

Benefits:
- Works cross-device (not tied to one browser's localStorage)
- Visible to administrators ("who mapped what")
- Can be pre-seeded for known mismatches
- Frontend loads these on sync start, applies them before showing unmatched names

---

## 6. Implementation priority

| Priority | Item | Effort | Impact |
|---|---|---|---|
| **P0** | Fix frontend commit to read API response (not assume success) | 15 min | Critical — users see false success |
| **P0** | Move name mappings to DB table | 30 min | Cross-device reliability |
| **P1** | Add fuzzy matching for compound surnames | 1 hr | Catches DOPAZOS, reduces manual mapping |
| **P1** | Conflict resolution UI (Excel vs existing) | 1 hr | Clean data on re-sync |
| **P1** | Sync log table | 15 min | Audit trail |
| **P2** | Parse MIR column for resident assignments | 30 min | Richer on-call data |
| **P2** | Rotations Phase 2a-2b (parser + matching) | 2-3 hrs | Second file synced |
| **P2** | Rotations Phase 2c-2d (diff + commit) | 2-3 hrs | Full rotation sync |
| **P3** | Automatic scheduled re-sync (watch a Google Drive folder) | 4+ hrs | Hands-free updates |

---

## 7. The end-state vision

The department maintains their Excel files as they always have. neumDesk reads those files periodically (or on upload), resolves names, shows what changed, and writes the data to the database — making it queryable by Grounded, visible on the dashboard, and available for conflict detection.

The Excel remains the source of truth for scheduling. neumDesk is the intelligence layer on top of it — not a replacement for it.
