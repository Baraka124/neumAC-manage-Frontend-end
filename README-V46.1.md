# V46.1 — Grounded loading hotfix

Built on V46. For an existing complete V46 installation, replace only `app.js` and `index.html` from this package, in the same location. All V46 supporting assets are retained unchanged. Refresh the deployed page after the update.

The screenshot's disabled composer was caused by a frontend gate: any failed source rejected the entire nine-source refresh and prevented typing. Successful reads were therefore not committed.

This patch retains successful source results, exposes named failed-source messages under **Source loading details**, and permits typing during refresh or errors. Submission waits until refresh finishes. In partial state, a conservative whitelist of read-only builders runs only when all its required sources are verified and the existing module permission check passes. Publication context reads require staff, research programmes and the Research Library; other supported reads conservatively require all eight non-Library sources. Unsupported requests and new write requests remain paused. Historical data left in other views is never considered verified merely because it is present locally.

This does not repair an unknown live server, authentication, network or deployment failure. The previous generic error concealed which source failed. After deployment, expand Source loading details to identify that remaining cause. The supplied backend's routes and response shapes were inspected, but no live authenticated backend was accessible for this repair.

68 executable checks pass (61 inherited plus 7 hotfix regressions). The seven new checks cover partial commit, failure disclosure, publication reads with unrelated failures, unsupported/write blocking, required-source blocking, permission gating and enabled input. Browser rendering and live integration remain unverified.

Run `node test-v461.cjs` alongside the inherited suites. The package contains the full V46.1 folder; only the two runtime files above changed.
