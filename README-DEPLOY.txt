neumDesk V46.14 — Phase 5.1 FRONTEND DEPLOYMENT BUNDLE

This ZIP contains the complete current frontend runtime/assets referenced by index.html.
Upload these files together to the frontend root, preserving the filenames.

Core current files:
- index.html
- app.js
- temporal50.js
- activity50.js
- decision51.js
- decision51.css

Preserved runtime/UI dependencies also included:
- style.css
- activity45.js
- activity45-ui.css
- grounded-core.js
- entry46.js
- entry46.css
- entry-highlights.js
- neumact-logo.png
- entry-art-*.svg

Important:
- Deploy the database/backend changes before this frontend if Phase 5.0/5.1 migrations are not already installed.
- Hard-refresh once after deployment to clear previous cached app assets.
