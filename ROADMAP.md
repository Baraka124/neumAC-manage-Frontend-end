# neumDesk — roadmap from here (17 Oct 2026)

Plan of record for Ops Room details stays in `OPS_ROOMS.md` (§8 is the handoff). Backend rules: `OPS_ROOM_BACKEND.md`.
Pilot routine: `PILOT.md`. This file says **what comes next and in what order**, and why.

---

## 1. Where we are

**Built (16–17 Oct):** OR-1, OR-2, OR-2b, OR-3, OR-C 1–2, OR-R, Informes, Hoy, Próximas semanas, Grounded answers,
Mi espacio "Hoy para ti", jobs + outbox (JB-1), hospital import (IM-1), Estado del sistema + error log + backups (PR-1).
Rotations and guardias import complete. All migrations applied (JB-1, IM-1, PR-1 verified in the database).

**Used (live database, 17 Oct):**

| Module | Live data | Reading |
|---|---|---|
| Rotations | 40 live (25 from the Excel import) | in use |
| Guardias | 21 (7 from import) | in use |
| Absences | 27 | in use |
| Accounts | 10 of 28 staff; 8 signed in this week | partial |
| **Ops Room** | roster 0 · resources 0 · measurements 0 · incidents 0 · interconsultas 0 · indicators 0 · 21 reports (of empty data) | **built, not yet used** |

The Ops Room is ahead of the department. Its value now depends on records, not on more features.

## 2. The boundary (fixed)

| neumDesk (operations) | Clinical platform (neumACt / AIRWAYSCOPE) |
|---|---|
| who works where, resources, activity **counts**, pending work, incidents, interconsulta timing, objectives, rotations, guardias, communication | anything about a **patient**: identifiers, protocols, scores, calculations, disease control, treatments, exacerbations |
| aggregated, no patient data — enforced by schema and import guard | pseudonymised, under protocol and ethics approval |

The only bridge is **aggregated results into neumDesk through the IM-1 feed** (`POST /api/feed/ops/measurements`).
Nothing flows the other way. Disease KPIs in neumDesk are counts per programme; per-patient KPIs are computed in the
clinical platform and arrive as totals.

---

## 3. Phases

### Phase 0 — Ready for day 1 (this week · owner Baraka)
`PILOT.md` §1, in this order:
1. Railway variables: `RESEND_API_KEY` + `EMAIL_MODE=test`, `PUBLIC_API_URL`, `JWT_SECRET`.
2. "Back up now" + the restore drill (§4) — the backup has never run against the real database.
3. Accounts for every pilot participant (invite links).
4. Interconsulta services and targets confirmed with Pedro.
5. Merge public-site #167 (indexed publications label).

### Phase 1 — Pilot: 4 weeks, 3 units + Interconsultas · **feature freeze**
- Units: **Broncoscopias, PFR, Unidad del Sueño** — they have devices, waiting lists and countable activity, so every
  question in the Ops Room gets real answers. The other 6 stay enabled but are not promoted.
- Interconsultas department-wide, because it is the most visible win (response time against target).
- Week 1: walk each pilot unit with its coordinator (OR-4 for these three): team, measures, resources, targets.
- Only bug fixes and friction fixes ship during the pilot. Every new idea goes to a list.
- Judge it with the system's own numbers (`PILOT.md` §5): days recorded per unit, interconsultas logged, people
  signing in, reports that are not empty.

**Exit gate:** a coordinator records at least 4 days a week without being chased, and Pedro opens Hoy without being asked.
If not, fix the friction before building anything new.

### Phase 2 — Harden the foundations (alongside the pilot, no new screens)
From `OPS_ROOM_BACKEND.md` §8, in order of risk:
1. **Secrets:** rotate the committed `.env` keys, move them to Railway, untrack `.env`.
2. **Role matrix:** one permission model for jefe / coordinador / adjunto / residente instead of three systems.
3. **Database proof:** ✅ migration check in CI built 17 Oct (`tests/schema-contract.test.cjs`: every table/function the
   code uses has a migration or predates `migrations/`; every migration is in Estado del sistema). Still open: one
   integration test against a real Postgres for the import and interconsulta flows.
4. **One audit trail:** ✅ built 17 Oct (AUD-1). `audit_log`, written by the database trigger, is the only trail: 57
   tables watched (was 27). Legacy `audit_logs`/`system_audit_log` are read-only. CI requires the trigger on every new table.
   Readable in Ops Room → Configuración → Estado del sistema → Change history.
5. **Split `index.js`** one domain at a time when it is touched (Ops Room first), never as a big rewrite.
6. One AI thread per file at a time — the cache-key collisions came from two threads editing `app.js`/`index.html`.

### Phase 3 — Extend, with evidence from the pilot
Only what the pilot shows is needed, roughly in this order:
1. **OR-4** remaining units, each with its coordinator.
2. **OR-C 3:** ✅ built 17 Oct. Unit templates (Laboratorio / Planta / Procedimientos / Consulta) in the existing units
   form: switch a unit on, choose its areas, start from a template with a preview. Templates only add.
3. **OR-C 4:** ✅ built 17 Oct. Alert rules in Ops Room → Configuración: pending above N, oldest pending > N days,
   calibration due within N days, urgent interconsulta unassigned > N h, incident open > N days, no activity for N days.
   Checked hourly 07–21 h; one email per rule per day to the owner (else coordinators, else head of department); every
   firing kept in `ops_alert_events`; never fires on missing or stale numbers; "Check now" previews without emailing.
4. **Diseases (DP-1):** ✅ built 17 Oct. A configurable catalogue (groups, parent/child, lead, on/off; seeded with
   20 pulmonology diseases in 8 groups) where each disease is a **hub computed from its links**: units, measures
   (activity / waiting / in hospital now), condition codes, interconsulta reasons, device types, team, research lines,
   trials, committee meetings. Units → **By disease**: one scannable table (In hospital now, by condition 30 d, activity,
   waiting + oldest, interconsultas, equipment issues, open trials) and a page per disease with where each number comes
   from and coverage when the lead is away. Follow-up windows (back ≤ 3 m, readmitted ≤ 30 d / ≤ 1 y) are columns now and
   fill when neumACt sends those totals into a measure linked with that role. Next: the **care map** (disease → units).
5. **OR-5:** resident visibility of incidents, Grounded from Ops records, leadership overview.

### Phase 3b — Ops Room quality (built 17 Oct, OQ-1)
1. **Live contract test**: the real server's database requests are checked against the live schema on every PR.
2. **Measure definitions**: definition, owner, source, and which activity clears each waiting list.
3. **Completeness** per unit (weekdays recorded, out-of-date snapshots) on cards, unit page and the weekly review.
4. **Alert acknowledgement**: seen / acting / resolved with a note; closed automatically when back within the threshold.
5. **Templates join up**: definitions, ward census by condition (feeds diseases), cleared-by links, default alert rules.
6. **Setup checklist** per unit and *X of N units ready*.
7. **Trends**: vs previous period and same period last year (activity and diseases); empty windows are never 0.
8. **Demand vs capacity**: weeks to clear and growing/shrinking per waiting list.
9. **Weekly review**: the department weekly report adds diseases and data quality and is attached to the next service
   meeting in Comms (nightly, or the button in Informes).
10. **Sharing**: *hide counts under 5* (report, disease table, CSVs) and CSV downloads.

### Phase 4 — Hospital data
1. Agree keys and export with hospital IT (ADX — Urology visit on Monday) → mappings in Configuración → IM-1 upload.
2. **OR-6:** the token feed for high-frequency activity, only with an approved source.
3. Rotations from Google Sheets (`docs/rotations-import-automation.md`): download → publish-to-web CSV → Sheets API.

### Phase 5 — The clinical bridge
The clinical platform sends programme results (e.g. exacerbations per programme, % on biologics) as aggregates
through the feed. neumDesk displays them; it never holds the patient rows.

---

## 4. Not building (and why)

- Formula builder, configurable workflows, configurable permissions — one wrong setting silently corrupts numbers.
- Patient-level anything — it belongs to the clinical platform (§2).
- Geographic map before programme counts exist — small numbers would have to be hidden anyway.
- More Ops Room sections before Phase 1 exits.

## 5. How we know it is working

| Signal | Target by end of pilot |
|---|---|
| Pilot units recording activity | ≥ 4 days / week each |
| Interconsultas logged | every formal request received |
| Weekly sign-ins | every pilot participant |
| Reports with data | all 3 pilot units, 4 weeks |
| Errors (Estado del sistema) | no repeated 5xx unresolved > 48 h |
| Restore drill | done twice (before day 1, week 3) |
