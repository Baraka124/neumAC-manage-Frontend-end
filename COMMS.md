# Communication (Comunicación) — plan of record and handoff

Status (17 Oct 2026): **CM-1 and CM-2 built** — Feed with *entradas* (what comes in from other services, briefed to the team),
**Parte del día**, **Agenda** (clinical sessions, seminars, service meetings) and **Pendientes** (follow-ups), with
WhatsApp sharing. Permissions are deliberately simple for now (one map — see below); they will be set later.
If you are continuing this work in a new session or with another assistant, read this file and `OPS_ROOMS.md` §8
(same repos, conventions and shipping steps).

## 1. Purpose
The head of department constantly receives things from other services and people — Urgencias needs beds, Dirección
sends an instruction, another service asks for an interconsulta, a seminar is organised — and has to brief the team.
Communication makes that one step: log what came in once, say who it concerns and who must act, share it.
Communication is **general**: everyone with Communications read sees everything; the audience only says who it
concerns ("Para mí").

## 2. Decisions (17 Oct 2026)
- Extend the existing Communications module — no second place to post. Posts stay in `department_announcements`.
- Permissions: later. All guards go through `COMMS_PERMS` in the backend (`index.js`, block `COMMUNICATION (CM-1)`).
- No required read confirmation ("Visto"): communication is general; it is shared on WhatsApp instead.
- Sharing = WhatsApp text + a link back into neumDesk (`https://desk.neumact.org/?c=post:<id>|meeting:<id>|brief:<date>`,
  sign-in required). **No public pages.** The share sheet reminds people to check there is no patient data.
- All three parts (briefing, Parte del día, Agenda) shipped together.
- An interconsulta that comes in is logged **once**, in the Ops Room (Interconsultas), and linked from the post.
- **No patient data anywhere**: posts, minutes and follow-ups are operational ("3 pacientes pendientes de ingreso, 1 con
  VMNI"), never names, record numbers or identifying bed numbers. Absence **reasons are never shown** in the Parte.

## 3. What is built
| Part | Where | What |
|---|---|---|
| Feed | Communications → Feed | Composer: Aviso · **Entrada** (from which service + who) · Urgente · Protocolo · Reconocimiento; category (list), priority, show-until, audience (units, profiles, guardia de hoy), optional follow-up (owner, due). Filters incl. "Para mí". Share / WhatsApp per post. Live urgent banner kept. |
| Parte del día | Communications → Parte del día | Built live from records: mensaje del día (editable), entradas (yesterday + today), guardia, ausencias (who + cover, no reason), unidades (Ops Room status; units in order collapsed to a count), interconsultas (waiting / over target / unassigned / calls today), agenda de hoy, pendientes, residentes por unidad (optional). Save draft · **Send** = freeze snapshot + post to feed (re-send replaces the post) + WhatsApp share. Printable. |
| Agenda | Communications → Agenda | Meetings: kind (list), title, start/end, place, online link (https), organiser, audience, **orden del día** (topic, presenter from staff or guest name, minutes → times computed), materials (https links), minutes (acta), status planned/held/cancelled, follow-ups. Post to feed, share, print. Meetings also appear in the department calendar. |
| Pendientes | Communications → Pendientes | Every open follow-up (from posts, meetings or added directly): owner, due, overdue / due today; done, cancel, reopen. |

## 3b. CM-2 — programmed events (17 Oct 2026)
- Agenda opens as a **month calendar** (Monday first; list view kept). On phones the calendar becomes a list of days with events.
- Each event is **internal** or **public**, with a description, a **banner** (JPEG/PNG/WEBP ≤ 5 MB) and a **flyer**
  (PDF or image ≤ 10 MB). Files are checked by type *and* content, stored in the private `attachments` bucket under
  `comms/meetings/<id>/`, and served through 1-hour signed links (an internal flyer is never exposed).
- **Public feed**: `GET /api/public/events[?from&to]` and `GET /api/public/events/:id`, no sign-in, website rate limiter,
  only safe fields (`publicEvent` in `comms.js`); internal events answer 404.
- **Open decision (Baraka):** how events and communication are displayed — a public page / neumact.org section fed by
  the public feed, an overview pop-up, banners in Hoy or Mi espacio. Nothing public is rendered yet.
- Migration: `2026-10-17_comms_cm2_event_visibility_banner.sql` (run after CM-1). Check:
  `select count(*) from information_schema.columns where table_name='comm_meetings' and column_name in ('visibility','banner_path','flyer_path','description')` → 4.

## 4. Where the code is
| Layer | File / place |
|---|---|
| Backend rules (pure, tested) | `comms.js` — `validatePost`, `validateAudience`, `audienceIncludes`, `validateAction`, `actionTransition`, `actionState`, `validateMeeting`, `meetingSchedule`, `BRIEF_SECTIONS`, `buildDailyBrief`, `briefText`, `postText`, `meetingText`, `whatsappUrl` |
| Backend routes | `index.js`, block `COMMUNICATION (CM-1)` (after the announcements routes); calendar route adds meetings |
| Backend tests | `tests/comms.test.cjs` (CI: `.github/workflows/ops-room.yml`, renamed "Ops Room + Communication") |
| Migration | `migrations/2026-10-17_comms_cm1_posts_actions_meetings_briefs.sql` |
| Frontend logic | `app.js`, block `// ─── Communication (CM-1)` (state `comms`, functions `comms*`) |
| Frontend view | `index.html`, `<div v-if="currentView === 'communications'" class="ops-view">` (pulse tiles kept; tabs below) |
| Styles | `access.css`, block `/* ── Communication CM-1 … */` (`.cm-*`) |
| Frontend tests | `tests/comms-cm1.test.cjs` (CI step in `frontend-integrity.yml`) |
| Lists | `ops_catalog_items`: `comm_category`, `meeting_kind` — editable in Ops Room → Configuración |

## 5. Database (CM-1)
- `department_announcements` + `source_service`, `source_detail`, `category`, `audience` (jsonb), `interconsult_id`,
  `meeting_id`, `brief_date`, `deleted_at`; audit trigger added. Types: announcement, entrada, broadcast, protocol, kudos
  (+ system: parte, meeting). **Fixed bug:** the composer's type used to be stored as `announcement` always.
- `comm_actions` (text, owner_id, due_on, status open/done/cancelled, post_id | meeting_id)
- `comm_meetings` (+ `comm_meeting_items`)
- `comm_daily_briefs` (one per date: notes, sections, snapshot, status draft/sent, post_id)
- All: RLS on (API uses the service role), audit trigger `fn_audit_trigger`.
- Check after running the SQL: `select count(*) from ops_catalog_items where catalog in ('comm_category','meeting_kind')` → 15,
  and `select to_regclass('public.comm_daily_briefs')` not null.

## 6. API (all need a signed-in user)
| Route | Guard (COMMS_PERMS) |
|---|---|
| `GET /api/comms/overview` | read |
| `POST /api/comms/posts` · `PUT/DELETE /api/comms/posts/:id` | post · author or edit/remove |
| `POST /api/comms/actions` · `PUT/DELETE /api/comms/actions/:id` | action · owner, author or edit |
| `GET /api/comms/meetings[/:id]` · `POST /api/comms/meetings` · `PUT/DELETE …/:id` · `POST …/:id/announce` | read · meeting · organiser, author or edit/remove · post |
| `GET /api/comms/brief?date=` · `PUT /api/comms/brief` · `POST /api/comms/brief/send` | read · brief · brief |
`COMMS_PERMS` maps every action to `communications` read/create/update/delete today. To restrict (e.g. only the head
of department sends the Parte), change that map — nothing else.

## 7. Next (not built)
- Permissions per action (who briefs, who sends the Parte) — when decided.
- Mi espacio: "Para mí" posts and my follow-ups on the personal page.
- Reports: count entradas by category (e.g. bed requests from Urgencias per month) in the Ops Room department report.
- Optional: scheduled Parte (auto-draft at 07:30), attendance ("asistiré") for sessions, recurring meetings.
