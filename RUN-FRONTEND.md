# Frontend — 5.3-production.1

Apply the backend migration and deploy the matched backend first, then upload ALL files in this frontend archive to your frontend project root. No build step is required. index.html is at the archive root. Keep the backend and frontend paired.

Refresh https://desk.neumact.org after deployment. The release indicator should read "Frontend & backend matched". If it does not, refresh or deploy the matching pair before making changes.

The production API remains https://neumac-manage-back-end-production.up.railway.app. For a changed API hostname, update CONFIG.API_BASE_URL in app.js and regenerate the release checksums before deploying.

Local use: run `python -m http.server 8080` (Windows: `py -m http.server 8080`), then open http://localhost:8080 with the backend running on port 3000. Use localhost, not 127.0.0.1 or file://, for the existing local API selection.

People & access now supports production temporary credentials. No development mode is required. The administrator must confirm their own password. Issued credentials are shown once and expire after 24 hours. The recipient must choose a personal password before accessing departmental data.

Keep this guide and RELEASE-NOTES.md with the release. Validate the pair using `python verify_release.py --frontend . --backend ../backend` with your actual folder paths. Live sign-in, operational data and email delivery still require deployment checks.
