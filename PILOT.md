# neumDesk pilot — Ops Room + Comunicación (CHUAC Neumología)

This is the plan for running the Ops Room and Comunicación with real people for four weeks, and the checks that come
first. Check the system with **Ops Room → Configuración → Estado del sistema**: it should be green, or every amber line
should be explained, before day 1.
Backend design: `OPS_ROOM_BACKEND.md` (backend repo) · Handoff: `OPS_ROOMS.md` §8 · Email: `NOTIFICATIONS.md`.

## 1. Before day 1 (owner: Baraka)

| # | Check | Where | Done |
|---|---|---|---|
| 1 | Database updates applied, in order: NT-1 (verify), JB-1, IM-1, PR-1 | Supabase → SQL Editor · panel "Database updates" shows 9/9 | ☐ |
| 2 | `RESEND_API_KEY` set; `EMAIL_MODE=test` for week 1 (everything goes to barakaaloyce@gmail.com) | Railway → Variables · panel "email" | ☐ |
| 3 | `PUBLIC_API_URL` set (unsubscribe links) | Railway | ☐ |
| 4 | `JWT_SECRET` 32+ random characters | Railway · panel "security" | ☐ |
| 5 | First backup made ("Back up now") and **restore drill** done (§4) | Panel "backup" | ☐ |
| 6 | Accounts: every pilot participant has an account with their email (today 10 of 28 staff) | Access → Usuarios · panel "accounts → Who" | ☐ |
| 7 | Each pilot unit walked with its coordinator: team, measures (with breakdowns), resources, targets (OR-4) | Ops Room → Unidades | ☐ |
| 8 | Interconsulta targets and services confirmed with Pedro | Configuración | ☐ |
| 9 | Keys from `.env` rotated and moved to Railway; then `.env` untracked | Railway + git | ☐ (deferred by decision) |

## 2. Scope and people

- **Weeks 1–4.** Week 1 with email in test mode; switch to `EMAIL_MODE=live` at the start of week 2 if nothing is wrong.
- **Who:** Pedro (head of department), the coordinators of 2–3 units (suggested: PFR, Unidad de Sueño,
  Hospitalización), all clinicians for messages and the Parte (residents included).
- **What is in:** Hoy, Unidades (who / resources / activity / pending / incidents / objectives), Interconsultas and
  calls (quick log), Próximas semanas, Informes, Comunicación (Feed, Parte del día, Agenda, Pendientes, Mensajes),
  email (private message, urgent post, Parte, 07:00 summary), Mi espacio "Hoy para ti".
- **What is out:** hospital imports (IM-1 is ready, but it waits until hospital IT agrees on codes), public events
  on neumact.org.
- **Never:** patient names or identifiers. Counts and operational facts only. Remind people on day 1.

## 3. The daily and weekly routine

| When | Who | What |
|---|---|---|
| 07:00 | everyone with email | Summary email: their follow-ups due and today's sessions |
| ~08:15 | Pedro (or delegate) | **Parte del día**: tick what goes in, add notes, *Send* (feed post + email + WhatsApp link) |
| during the day | anyone who takes a call or an interconsulta | **Quick log** (+ button): service, priority, outcome, minutes. Under 10 seconds |
| end of day | unit coordinator | Unidades → Activity: today's counts (and Monday's pending snapshot) |
| as it happens | coordinator | Incidents, equipment out of service, loans |
| Monday | Pedro + coordinators | Hoy + Próximas semanas (guardias, absences, capacity) · last week's Informe in plain words |
| Friday, 15 min | Baraka + Pedro | Pilot review (§5) |

## 4. Backup and restore drill (do it once before day 1, then once in week 3)

Backups run every night at 02:00 (Madrid). Each one is a single file (`neumdesk-ops-comms-….json.gz`) in the private
Supabase bucket `backups`, kept for 30 days. They hold Ops Room and Comunicación records and unit rosters, but no
accounts or passwords.

1. Configuración → Estado del sistema → **Back up now** → **download** the file.
2. In Supabase create a **branch** (or a scratch project), restored from the latest schema.
3. On a computer with the backend repo: `npm ci`, then
   `SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… node scripts/restore-backup.js <file>`. This is a dry run that shows
   the rows in the file next to the rows now in the database.
4. Add `--apply`. It upserts every row by id and never deletes. Check the row counts, then open the app against the
   branch, or spot-check rows in the table editor.
5. Write the date and the time it took here: _______. Target: under 30 minutes from the decision to restore to a
   working system.

To restore **production** after a bad change, run steps 3–4 against production, with `--tables` for only what is
affected (e.g. `--tables ops_measurements`). Rows created after the backup stay.

## 5. Feedback and how we judge the pilot

**Friday review (15 min):** open the status panel (errors, jobs, emails), then go through the list below and write
down three things to fix. Problems people mention during the week: message Baraka (WhatsApp/email) with the screen,
what they did, and what they expected. A screenshot is enough. Browser errors arrive in the error log automatically.

Measured from the system itself (no extra forms):

| Signal | Good by week 4 |
|---|---|
| Days with the Parte sent | ≥ 4 of 5 working days |
| Pilot units recording activity | ≥ 4 of 5 working days each |
| Calls and interconsultas logged | they match what coordinators say happened ("most of them") |
| Interconsultas with an answer time | ≥ 80 % |
| People who opened neumDesk in the week | ≥ 70 % of participants |
| Errors per day (status panel) | falling; none blocking |
| Emails failed | 0 after week 1 |

**Decision at week 4** (Pedro): extend to all units / fix and repeat 2 weeks / stop. Write it in `OPS_ROOMS.md` §8.

## 6. If something goes wrong

| Symptom | First step |
|---|---|
| The app does not load / "Release mismatch" | Hard refresh. If the backend deploy is behind, wait for Railway, or redeploy main |
| Status panel: database not reachable | Supabase status page; check the Railway variables |
| Emails not arriving | Panel "email": provider set? Test mode? Then Admin → send test email |
| 07:00 summary or reports "late" | The server was asleep. It runs on the next awake minute, or press "run now" |
| Wrong data entered | Fix it in place (history is kept by the audit log); for an import, *Undo* in Importar datos |
| Data lost or overwritten at scale | Stop entering data, take a backup of the current state, restore (§4) |
