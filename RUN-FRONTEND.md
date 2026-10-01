# Frontend — 5.3-production.2

Apply the backend migration and deploy the matched backend first, then upload ALL files in this frontend archive to your frontend project root. No build step is required. index.html is at the archive root. Keep the backend and frontend paired.

Refresh https://desk.neumact.org after deployment. The release indicator should read "Frontend & backend matched". If it does not, refresh or deploy the matching pair before making changes.

The production API remains https://neumac-manage-back-end-production.up.railway.app. For a changed API hostname, update CONFIG.API_BASE_URL in app.js and regenerate the release checksums before deploying.

Local use: run `python -m http.server 8080` (Windows: `py -m http.server 8080`), then open http://localhost:8080 with the backend running on port 3000. Use localhost, not 127.0.0.1 or file://, for the existing local API selection.

People & access now supports production temporary credentials. No development mode is required. The administrator must confirm their own password. Issued credentials are shown once and expire after 24 hours. The recipient must choose a personal password before accessing departmental data.

Keep this guide and RELEASE-NOTES.md with the release. Validate the pair using `python verify_release.py --frontend . --backend ../backend` with your actual folder paths. Live sign-in, operational data and email delivery still require deployment checks.

Update .2: existing system-administrator passwords cannot be changed or reset within the application. Entering your current administrator password only confirms your identity. Generated user credentials now appear visibly and scroll into view. If the .1 migration was already applied, no further SQL is needed.

Header layout fix (2026-10-01): restored the date-and-actions header to the top of the dashboard. Operational Review now follows the summary statistics. Compatible with backend 5.3-production.2; no backend deployment or SQL change is required for this frontend fix.

Login and recovery update (2026-10-01): revised desktop/mobile sign-in and loading screen; accurate permission verification progress; default request timeouts; classified connection/server/access errors; retry for failed staff reads with existing records preserved. Includes the dashboard header fix. Compatible with backend 5.3-production.2; no new SQL or backend deployment. Live cause of the previously reported connection failure remains unconfirmed.

Phase 1 — Institutional sidebar (2026-10-01): grouped Department, Research & knowledge, and Administration navigation; search beneath departmental identity; restrained navy and teal selection; readable labels and consistent icons; account menu with profile, support and sign-out; accessible collapsed links and mobile drawer with Escape and keyboard focus containment. Existing destination permissions retained. Built on the latest login-fix release, including the dashboard header fix. Compatible with backend 5.3-production.2. No SQL or backend deployment required. Phases 2–4 remain pending.

Phase 2 — Shared shell foundation (2026-10-01): shared typography, navy/teal colours and control tokens for sidebar and application header; consistent header height, title and subtitle; readable search fields; accessible search result buttons with keyboard focus and Escape; aligned account and notification controls; compact mobile header with workspace search and contained notification panel. Built on completed Phase 1. Compatible with backend 5.3-production.2; no SQL or backend deployment. Login composition (Phase 3) and dashboard refinement (Phase 4) remain pending.

Phase 3 — Institutional login and entry (2026-10-01): neumact institutional masthead; light editorial introduction and integrated sign-in form; compact sign-in preferences with trust off by default; optional public perspectives retained; separate centered verification screen with expandable real progress; responsive recovery and resume states. Matched/checking release badges are hidden on entry; mismatch and unavailable messages remain visible. Authentication, administrator password protection and temporary-password setup are unchanged. Includes Phases 1–2 and previous repairs. Compatible with backend 5.3-production.2; no SQL or backend deployment. Phase 4 dashboard refinement remains pending.
