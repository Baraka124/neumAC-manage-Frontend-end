# V46.2 — Clinical Units scope repair

Built on V46.1, including its Grounded loading/input repair. This fixes the reported `ReferenceError: medicalStaff is not defined` in Clinical Units.

Cause: useTrainingUnits referenced medicalStaff for resident name fallback and clinician assignment, but neither accepted it as an argument nor received it from app setup. The same existing reactive staff ref is now explicitly passed to the module. Missing resident records continue to render the existing dash placeholder instead of throwing.

For a complete V46 or V46.1 installation, replace only **app.js** and **index.html** from this folder. Keep all other runtime assets. The HTML requests app.js?v=46.2 and the login footer shows V46.2. After deployment, hard-refresh the browser. A stack trace still showing app.js?v=46 indicates the old page remains loaded.

75 executable checks pass: 68 inherited plus seven Clinical Units regressions. The new tests execute the complete unit module with reactive-container stubs, covering empty lookup, directory fallback, joined resident fallback, updated lookup, occupied timeline slot, clinician assignment and application wiring. Syntax checks pass. This is not a live-browser or authenticated-backend validation.

The live backend source failure reported alongside the earlier Grounded error is still unidentified. Source loading details in Grounded now exposes which source failed and its error. Neither release changes backend routes or database contents.
