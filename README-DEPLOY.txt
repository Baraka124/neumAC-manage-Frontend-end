neumDesk V46.14 — Phase 5.1.1 Startup Integrity

This frontend bundle supersedes the Phase 5.1 frontend bundle.

Fix:
- eliminates Vue setup() temporal-dead-zone crash:
  "Cannot access 'absences' before initialization"
- Leave, On-call and Rotations now share refs created before composable initialization
- index.html cache-busts app.js as v=46.14-phase51.1-startup-integrity
- no backend or database migration change is required for this hotfix

Deployment:
Upload the contents of frontend/ over the current frontend deployment.
At minimum app.js and index.html must be replaced together.
After deployment hard-refresh once if the CDN/browser still shows an older cached page.
