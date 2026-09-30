# Frontend recovery — 28 September 2026

This package is frontend-only. index.html is at the archive root; no npm build is required.

## Existing deployment
Replace the frontend site's runtime files with all files from this archive. Deploy the paired backend first. CNAME retains desk.neumact.org. Open https://desk.neumact.org and hard-refresh once (Ctrl+Shift+R).

Asset query versions were refreshed to recovery-20260928 to avoid mixing cached code. All frontend runtime code otherwise matches commit 4ae3ba8b2658343b64c53b7cc9246ae8573a541d. Phase labels in source comments are not the version authority.

The production API remains https://neumac-manage-back-end-production.up.railway.app. If your API address has changed, update CONFIG.API_BASE_URL in app.js before deployment.

## Local run
Start the backend on port 3000. From this frontend directory run `python -m http.server 8080` (or `py -m http.server 8080` on Windows), then open http://localhost:8080. Use localhost, not a file:// URL or 127.0.0.1: the existing API selection recognizes localhost. The backend must allow http://localhost:8080 in ALLOWED_ORIGINS.

Checks: all packaged JavaScript passed syntax checking; local CSS asset paths resolve; browser app mounting, access-help recovery form, invitation form/token removal, required assets and mobile invitation width were checked with mocked API responses. Live sign-in, database-backed modules and email delivery still require testing on your deployment.

Do not upload backend files into this frontend directory. Unshipped Phase 5.3F changes are excluded.
