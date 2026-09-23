# neumDesk V46.14 — Grounded Knowledge Precision + Phase 4 UI Audit

## Scope

This audit reviews the current V46.14 Grounded implementation against:
- the Grounded architecture contract;
- the live deterministic runtime in `app.js` / `grounded-core.js`;
- the Staff Phase 4 reusable UI foundation;
- the current Grounded presentation layer in `index.html` / `style.css`;
- the existing Grounded regression suites.

No runtime behavior is changed by this audit.

---

## Executive finding

Grounded is already a substantial deterministic operational intelligence layer, not a simple chat box.

Its strongest areas are:
- authoritative source refresh and explicit source-health tracking;
- ambiguity-safe operational identity handling;
- temporal semantics for leave;
- guarded READ → PROPOSE → human-confirmed WRITE workflows;
- commit-time revalidation for consequential changes;
- explicit tracing without chain-of-thought;
- broad deterministic intent coverage.

Its main weakness is architectural asymmetry:
- action integrity is tool-normalized and very strong;
- general read/analytics knowledge is still partly implemented as bespoke direct access to Vue data refs;
- provenance and confidence are not yet represented by one universal typed answer contract;
- partial source failure can block queries that do not actually depend on the failed source;
- the editable Teach layer can override normal routing too aggressively.

Grounded's Phase 4 UI migration has not happened yet. The current Grounded surface retains hundreds of legacy `askbar-*`, `grounded-*`, `gr43-*` and `gr45-*` presentation rules and still violates several Phase 4 visual/accessibility invariants.

---

# 1. Knowledge architecture

## 1.1 What Grounded currently is

Grounded is deterministic retrieval + routing + calculation + guarded actions.

The current application explicitly does not use an LLM to invent or phrase operational facts. Known intents are routed into deterministic retrieval branches or semantic tools that read live departmental sources.

This gives Grounded a useful safety property:
**for supported questions, correctness can be tested against code and authoritative records.**

It also creates a limitation:
**language outside the known routing/brain vocabulary does not gain general semantic reasoning automatically.**

So Grounded should be described as:

> broad deterministic departmental operational knowledge with bounded language interpretation — not unrestricted medical/general AI knowledge.

---

## 1.2 Breadth

Current routing audit:
- 102 route rows
- 101 unique routed intents
- all routed intents have an implemented handling path

Coverage spans:
- Staff identity, role, specialty, contact, residency, credentials, PI/PhD/supervision questions
- On-call rosters, upcoming duty, load, gaps, replacements and guarded assignment
- Leave current state, future schedule, date-specific state, type, fairness, return, overlap and guarded recording
- Resident rotations, supervisors, occupancy, history, gaps and guarded assignment
- Clinical units, capacity, readiness and placement context
- Research lines, studies, innovation projects, publications and research activity
- Cross-domain briefing, issues, department status and risk synthesis
- Personal Activity / Portfolio Intelligence handoff

This is a strong breadth for the actual department software.

---

# 2. Precision by layer

| Layer | Current assessment | Why |
|---|---|---|
| Operational source truth | Strong | Grounded refreshes 9 named source families independently and records source health + snapshot time. |
| Action validity | Very strong | On-call, Leave and Rotation use semantic READ/PROPOSE/WRITE tools, explicit confirmation and commit-time revalidation. |
| Known-query coverage | Strong | 101 unique routed intents, all with implemented handling paths. |
| Person resolution | Strong | Named operational queries resolve the person before broad intent routing; exact-score ambiguity causes clarification. |
| Temporal leave semantics | Strong | Current, scheduled/upcoming, date/window and broad-person scope are explicitly separated. |
| Cross-domain synthesis | Medium–strong | Useful joins exist, but many are bespoke code rather than normalized knowledge tools. |
| Open-ended language robustness | Medium | Regex + curated brain vocabulary; no general semantic parser/LLM layer. |
| Provenance granularity | Medium | Source families are usually exposed, but record-level evidence is uneven. |
| Confidence model | Medium | Confidence partly derives from answer text heuristics rather than explicit epistemic metadata. |
| Partial-source resilience | Weak–medium | One unrelated source failure can currently pause otherwise answerable questions. |
| Editable Teach safety | Medium | Taught vocabulary wins routing at priority 999 and needs collision/intent-scope controls. |
| Medical/scientific knowledge | Limited by design | Grounded knows internal structured departmental records. It is not yet a literature or external clinical knowledge engine. |

---

# 3. Strongest part: action integrity

The semantic tool registry currently exposes 19 Grounded tools.

READ:
- `clinical_units.available_units`
- `clinical_units.capacity_window`
- `clinical_units.team_readiness`
- `leave.check_window`
- `leave.person_records`
- `oncall.check_eligibility`
- `oncall.check_slot`
- `oncall.person_shifts`
- `oncall.replacement_candidates`
- `reporting.personal_activity_snapshot`
- `resident_rotations.check_assignment`
- `resident_rotations.check_supervisor`
- `resident_rotations.conflicts`

PROPOSE:
- `leave.propose_absence`
- `oncall.propose_assignment`
- `resident_rotations.propose_assignment`

WRITE:
- `leave.commit_absence`
- `oncall.commit_assignment`
- `resident_rotations.commit_assignment`

This is the right architecture.

The operational trajectory is effectively:

understand → retrieve → validate → propose → user confirmation → revalidate → write → verify/audit

That makes Grounded considerably safer for departmental operations than a free-form chatbot that directly writes records.

---

# 4. Main knowledge precision defects to correct

## K1 — Partial source failure is over-broad

`askBarRefreshRecords()` correctly fetches each source independently with `Promise.allSettled`.

However, if even one source fails:
- `askBar.refreshError` is populated;
- normal resolution diverts to `askBarPartialReply()`;
- most non-publication reads require a hard-coded group of eight sources to all be ready.

That means a simple Staff or Leave question can be paused because an unrelated Innovation Projects source failed.

This contradicts the UI promise:

> answers that need unavailable records remain paused

The actual behavior is closer to:

> many answers pause whenever almost any major source is unavailable.

### Required correction

Create a per-intent source dependency registry.

Example:

```text
staff_attr           → staff
staff_leave          → staff + leave
staff_oncall         → staff + on-call
absence_current      → staff + leave
coverage_risk        → staff + leave + on-call + rotations
trial_profile        → clinical studies + research programmes
issues               → staff + on-call + leave + rotations + units
```

An unavailable source should block only intents that require that source.

---

## K2 — General READ knowledge is not yet normalized

Action workflows use the semantic tool registry.

A large number of read/analytics answers still directly inspect:
- `medicalStaff`
- `onCallSchedule`
- `absences`
- `rotations`
- `trainingUnits`
- research refs

inside `_askBarBuildAnswerRaw()`.

The results can be correct, but governance is inconsistent.

### Why it matters

A semantic tool can centrally define:
- required permission;
- exact source;
- temporal scope;
- empty-state semantics;
- provenance;
- validation;
- trace behavior.

A bespoke branch can accidentally implement these slightly differently.

### Required correction

Do not rewrite everything at once.

Progressively migrate high-value read families into domain tools:

```text
staff.*
leave.*
oncall.*
rotations.*
units.*
research.*
reporting.*
```

The UI should consume typed results rather than knowing where the data came from.

---

## K3 — Confidence is partly inferred from prose

The final answer wrapper currently checks answer text for phrases such as:
- “couldn't tell”
- “don't have enough”
- “which ... did you mean?”

and adjusts confidence.

That is useful as a safety net, but confidence should not fundamentally depend on wording.

### Required correction

Generate confidence from structured factors:

```text
resolver certainty
+ required-source health
+ query scope completeness
+ temporal scope certainty
+ evidence coverage
+ validation status
```

The prose should render confidence; prose should not determine confidence.

---

## K4 — Evidence is uneven

Grounded has a good trust/evidence UI, but several answer branches return source-family metadata without record evidence, and a few factual branches do not return source scope consistently.

Examples found in the current implementation include:
- clear/no-conflict `issues`
- some `coverage_gaps` paths
- an empty `rotations_active` path

### Required correction

Every factual answer should emit the same minimum contract:

```text
answer kind
answer scope
temporal scope
sources required
sources checked
records considered
record evidence / aggregate provenance
confidence
confidence reason
retrieved at
```

A zero-result answer can still be high confidence when an authoritative source was successfully checked.

---

## K5 — Teach can overrule too much

Department-curated vocabulary is valuable, especially for Spanish/Galician/local language.

Currently taught vocabulary is evaluated before normal route scoring and receives effective priority `999`.

A badly taught generic phrase could therefore steal a query from a more precise intent.

### Required correction

Teach entries should be:
- concept-scoped or intent-scoped;
- collision-checked against existing patterns;
- previewed against eval examples before activation;
- unable to override a more-specific entity/action route unless explicitly authorized.

Local vocabulary should enrich Grounded, not silently redefine its reasoning hierarchy.

---

## K6 — Fuzzy identity clarification only catches exact score ties

The resolver asks for clarification when the top candidates have exactly the same match score.

A near-tie can still select the first person.

Write paths are safer because they use dedicated ambiguity-aware flows, but read precision can still improve.

### Required correction

Use an ambiguity margin, not only exact equality.

Example rule:

```text
if topScore - secondScore < threshold
→ clarification
```

Also show disambiguating metadata:
- role
- resident category
- unit/home department

rather than only two names.

---

## K7 — Some analytics have implicit time meaning

Several rank/metric helpers operate over all loaded records unless the specific route applies a time filter.

Examples include raw counts of:
- on-call shifts
- leave records
- trials as PI

A query such as “who has the most leave?” therefore needs an explicit reporting period or a clearly labelled default.

### Required correction

No ranking without a visible period.

Grounded should either:
1. infer an explicit documented default such as current calendar year; or
2. ask “Which period?” when the result could materially change.

The answer must display the period in Answer scope.

---

# 5. Regression strength

The existing architecture is well protected by tests.

Re-run during this audit:

- V46.8 Grounded architecture: 12 checks passed
- V46.9 On-call action integrity: 18 passed
- V46.10 Leave action integrity: 16 passed
- V46.11 Rotation action integrity: 13 passed
- V46.14 convergence / Personal Activity / Grounded semantics: 79 passed
- V46.14 browser DOM safety: 7 passed
- Staff Phase 4 UI foundation: 24 passed

The next Grounded release therefore should extend these tests rather than replace the existing contracts.

---

# 6. Grounded UI vs Phase 4

## Current state

Grounded's information hierarchy has improved substantially:
- answer first;
- structured visuals only when useful;
- explicit Answer scope;
- source/evidence strip;
- method detail secondary;
- proposal cards for consequential actions;
- loading state that says what records are being checked;
- profile/list/board/absence visual types.

Semantically this is good.

Visually and structurally it is still pre-Phase-4.

Audit of the Grounded template found approximately:
- 432 unique legacy Grounded class names in the Grounded surface;
- essentially no meaningful reuse of the new Phase 4 `nd-*` component grammar;
- 11 separate answer visual types plus large numbers of one-off classes.

The current surface is therefore a parallel UI system.

---

# 7. Direct Phase 4 mismatches

## U1 — Grounded still uses the cloud/mist/glass metaphor

The current UI still contains:
- `grounded-cloud`
- `grounded-mist`
- backdrop blur rules

Phase 4 explicitly establishes:
- crisp surfaces;
- meaning before decoration;
- no glass haze/blur as a design language.

The cloud metaphor also visually makes Grounded feel like a separate AI product floating above neumDesk, while the architecture now says it is a contextual intelligence layer over neumDesk.

### Direction

Grounded should become a crisp **Intelligence Workspace / sidecar**, not a cloud.

---

## U2 — Typography violates the Phase 4 readability floor

Static audit found:
- 59 Grounded-related `font-size` declarations below 11px
- across 52 selectors
- including values as low as 8px / 8.5px / 9px

Examples occur in:
- trust metadata;
- profile secondary labels;
- Teach statistics;
- trace metadata;
- review scope;
- utility/action metadata.

Phase 4 sets an 11px floor for meaningful supporting text.

### Direction

Normalize Grounded to the same typography tokens as Staff Phase 4.

Deep trace/debug telemetry can remain compact, but user-facing evidence and status text should never require squinting.

---

## U3 — Control rhythm is inconsistent

Phase 4 establishes a 40px control baseline.

Current Grounded contains many interactive controls around:
- 28px
- 30px
- 32px
- 34px
- 36px
- 38px

The input itself is appropriately larger, but the top toolbar and secondary actions are inconsistent with the new system.

### Direction

Use:
- `nd-btn`
- `nd-toolbar`
- `nd-segmented`
- common focus language
- 40px primary interaction rhythm

Very small copy/evidence controls can use a deliberate compact exception, not arbitrary inherited sizes.

---

## U4 — Accessibility is behind the new Person drawer

The Phase 4 Person profile has:
- dialog semantics;
- labelled tabs;
- roving focus;
- focus trap;
- Escape lifecycle.

Grounded:
- moves focus to the input when opened;
- supports close behavior;
- but the Grounded overlay itself currently has no equivalent explicit dialog semantics/focus trap contract.

### Direction

Grounded should receive:
- `role="dialog"` or the appropriate application/dialog model;
- `aria-modal` if it remains modal;
- labelled title;
- focus return;
- focus trap;
- Escape handling;
- keyboard-accessible view tabs.

Or, preferably, reconsider whether Grounded should remain a full modal at all.

---

## U5 — Header has too many competing controls

Current header exposes multiple utilities together:
- expand
- Personal activity
- New
- Activity
- Trace
- Teach
- Close

This gives administrative/debug features equal visual weight to the primary intelligence task.

### Direction

Primary header:
- Grounded identity
- current/pinned context
- New conversation
- Close / dock

Secondary overflow:
- Personal Activity
- Activity/history
- Trace
- Teach
- administrative/debug functions

Trace and Teach should be permission-aware utilities, not permanent primary chrome.

---

# 8. Proposed Phase 4 Grounded component grammar

Reuse existing Phase 4 components:

```text
nd-toolbar
nd-btn
nd-status
nd-tag
nd-context-strip
nd-record-list
nd-record-row
nd-empty-state
nd-person-card / identity grammar
```

Add Grounded-specific reusable components:

```text
nd-intelligence-shell
nd-answer
nd-answer-scope
nd-evidence-strip
nd-evidence-record
nd-clarification
nd-proposal
nd-proposal-check
nd-insight
nd-metric
nd-source-health
nd-context-event
```

Do not force a proposal or analytical chart into Person-specific components merely to claim reuse.

Phase 4 should provide shared primitives; Grounded should extend them with intelligence-specific patterns.

---

# 9. Recommended information hierarchy

For a simple fact:

```text
Question
Answer in plain prose
Answer scope · source state · retrieved time
optional evidence/details
follow-up actions
```

For a structured result:

```text
Question
One-sentence finding
Structured list/table/board
Answer scope · source state · retrieved time
optional evidence/details
follow-up actions
```

For an operational proposal:

```text
Requested change
Proposed action
Checks performed
Warnings / hard blocks
Records that will change
Confirm / cancel
Evidence + trace
```

For uncertainty:

```text
What Grounded could establish
What is missing / ambiguous
Specific clarification needed
```

Never hide uncertainty behind a visually polished card.

---

# 10. Recommended next implementation checkpoint

## Grounded Phase 4.1 — Knowledge Contract + Presentation Convergence

Do this before adding more intents.

### Knowledge contract
1. Per-intent source dependency registry.
2. Typed answer envelope.
3. Structured confidence reasons.
4. Universal factual provenance minimum.
5. Near-tie entity ambiguity threshold.
6. Explicit reporting periods for rankings.
7. Teach collision detection / scoping.
8. Migrate the highest-risk direct READ branches to semantic tools.
9. Add partial-source-failure evals.

### Presentation convergence
1. Replace cloud/mist shell with crisp intelligence workspace.
2. Map stable controls and records to `nd-*`.
3. Introduce Grounded-specific `nd-answer`, `nd-evidence`, `nd-proposal`, `nd-insight`.
4. Enforce 11px meaningful-text floor.
5. Enforce common control rhythm/focus language.
6. Simplify primary header.
7. Add full dialog/dock accessibility lifecycle.
8. Preserve answer-first and scope/evidence semantics already achieved in V46.14.

---

## Final assessment

Grounded does not need a wholesale rewrite.

The underlying operational architecture is already stronger than the visual layer suggests, especially for writes.

The next major improvement is **convergence**:

- make every answer obey one knowledge/provenance contract;
- make partial failure granular rather than global;
- make the Teach layer safer;
- move stable read domains toward semantic tools;
- then present all of it through the Phase 4 UI grammar.

That would turn Grounded from a large collection of intelligent deterministic features into a coherent departmental intelligence system whose reliability is visible in the interface.
