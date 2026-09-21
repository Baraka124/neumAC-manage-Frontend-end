# DepartmentOS — Master Architecture

*The complete, integrated architecture: every idea that holds together, from the system running today to the full vision — structured so it can actually be built.*

**Status:** Architecture v1.2 · Implementation checkpoint: V46.10 · Supersedes Vision v0.1
**First domain:** Pneumology, CHUAC (live production — 65 staff, real workflows)
**Author's note:** This is the reference both of us build against. It is honest about what exists, what is buildable now, and what waits on infrastructure we don't yet have.

---

## Current implementation ledger — V46.10

This section is the **living checkpoint**. When implementation and an older status statement elsewhere in this document disagree, this ledger is authoritative. Every complete neumDesk release must update this section before packaging.

### Canonical baseline

- **Baseline entering this release:** V46.9 · Grounded Action Integrity.
- **Current release:** V46.10 · **Leave Action Integrity**.
- The system remains retrieval-first and deterministic; no runtime LLM is required for the capabilities described here.

### What is real now

| Layer | V46.10 implementation status |
|---|---|
| Canonical Knowledge Model | **Partial, adopted** — Person, Activity and Event Knowledge Objects are live in selected builders. |
| Canonical Knowledge Layer | **Partial / transitional** — not every capability consumes it yet; backend canonical exclusivity remains future work. |
| Semantic Layer | **Strong deterministic implementation** — fuzzy/role-aware entity resolution, ambiguity handling, date/month parsing and contextual subject resolution exist. |
| Intent Engine | **Mature but monolithic** — broad coverage exists; capability-module decomposition remains architectural debt. |
| Grounded Harness | **Built** — context envelopes, semantic tool registry, READ/PROPOSE/WRITE classes, permission checks, bounded plans, session task memory and traces. |
| Tool adapters | **Advancing** — Clinical Units, On-call and now Leave are integrated. |
| READ | **Mature** for structured departmental operations/research sources. |
| PROPOSE | **Strong** — operational proposals are structured and reviewable. |
| ACT | **Partial, real** — On-call and Leave creation now commit through guarded WRITE tools with commit-time revalidation. Rotation creation is next. |
| Human in the loop | **Built pattern** — consequential writes require explicit confirmation. |
| Observability | **Built foundation** — proposal → confirmation → tool → outcome can share one operational trace. |
| Permissions | **Operational** — module permissions are enforced; role-first/exception-second remains the target for broad staff onboarding. |
| Structured outputs | **Partial but proven** — proposal cards, boards, profiles, Personal Activity artifacts and reporting surfaces establish the pattern. |
| Operational memory | **Partial** — authoritative state remains in source systems; Grounded memory is task-only. |
| Multi-agent orchestration | **Intentionally deferred** — one orchestrator + semantic tools remains preferred. |

### V46.10 — Leave Action Integrity

Leave creation now follows:

```text
resolve exact subject / covering clinician
  → clarify ambiguity
  → resolve dates + leave type
  → reject duplicate/overlapping leave
  → surface on-call / rotation / cover collisions
  → build proposal
  → human confirmation
  → revalidate immediately before write
  → commit through leave.commit_absence WRITE tool
  → refresh leave data
  → trace + audit outcome
```

Semantic tools added:

- `leave.person_records`
- `leave.check_window`
- `leave.propose_absence`
- `leave.commit_absence`

### Known architectural debt at V46.10

1. Resident-rotation creation still has legacy proposal/write logic and is the next migration.
2. Leave return/cancel/edit flows already have human confirmation but are not yet all routed through semantic WRITE tools.
3. Many read intents still live in the monolithic `app.js` router rather than named capability modules.
4. The Canonical Knowledge Layer is still incremental and frontend-adapted rather than the exclusive backend interface.
5. Role-first permissions remain desirable if broad staff login is introduced.

### What comes next

**V46.11 — Resident Rotation Action Integrity.**

Then continue module/UI maturity work (Clinical Units, Personal Activity/Portfolio Intelligence) while migrating remaining action flows incrementally.

---

## 0. The one idea everything else derives from

> **The operating system defines the knowledge model. The knowledge model defines the data model. Storage is the last decision, not the first.**

Most healthcare software is built bottom-up: database → API → UI → (bolt on an AI chatbot). DepartmentOS inverts this. We design *what the department knows and does* first, express it as a **Canonical Knowledge Model**, and let storage, APIs, and interfaces derive from it.

Consequence: the chat interface is **one client**. A dashboard is another. Mobile, voice, a future model — all clients of the same knowledge model. That is the line between an *application* (competes on features) and a *platform* (shapes how future systems are built).

This document is organized around that inversion, top to bottom:

```
                        User intent
                             │
          ┌──────────────────┼──────────────────┐
          ▼                  ▼                  ▼
      Chat client      Dashboard client    Voice / mobile / API
          └──────────────────┼──────────────────┘
                             ▼
                     SEMANTIC LAYER          ← language → knowledge entities
                             ▼
                     INTENT ENGINE           ← what does the user want to accomplish
                             ▼
                     TASK PLANNER            ← which agents, in what order
                             ▼
        ┌──────────────┬─────┴──────┬──────────────┐
        ▼              ▼            ▼              ▼
   Workforce       Operations    Research       Policy
     Agent           Agent        Agent          Agent      (+ Reporting, Comms, Analytics)
        └──────────────┴─────┬──────┴──────────────┘
                             ▼
              CANONICAL KNOWLEDGE LAYER        ← Knowledge Objects, not tables
                             ▼
        ┌──────────────┬─────┴──────┬──────────────┐
        ▼              ▼            ▼              ▼
     Postgres      Vector store   Files/docs   External (EHR, calendar, email)
   (live today)   (Phase 2+)     (Phase 2+)     (later)
```

Everything below is a layer in this diagram, described as: **what it is**, **what exists today**, **what's buildable now without a runtime model**, and **what waits on the model/infrastructure**.

---

## 1. The Canonical Department Knowledge Model (CDKM)

**The first artifact. Everything derives from it.**

Instead of tables (`staff`, `leave`, `rota`, `trials`), the department is modeled as a small set of **Knowledge Objects**. Every object — a person, an on-call shift, a trial, a policy — shares one base shape:

### 1.1 The Knowledge Object (base type)

```
KnowledgeObject
  id            — stable unique identifier
  type          — Person | Activity | Resource | Policy | Event | Document | Task | Relationship
  attributes    — type-specific fields (the clinical detail)
  relationships — typed links to other objects  (supervises, assigned_to, governs, …)
  evidence      — which source records back this object  (provenance)
  owner         — who is responsible for it
  permissions   — who may read / propose / act
  status        — active | draft | archived | proposed
  history       — append-only change record
  metadata      — timestamps, confidence, source system
```

Agents never learn 30 schemas. They learn **this one shape** plus the eight canonical types below.

### 1.2 The eight canonical types (this department, named to generalize)

| Knowledge Object | In pneumology today | Maps onto live table(s) |
|---|---|---|
| **Person** | attending, resident, PI, dept head | `medical_staff`, `user_permissions` |
| **Activity** | on-call shift, rotation, clinic, procedure, meeting | `on_call_schedule`, `resident_rotations` |
| **Resource** | training unit, equipment, room, bed | `training_units` |
| **Policy** | SOP, credential rule, staffing rule, governance | *(not yet stored — new)* |
| **Event** | leave approved, conflict detected, cert expired | `staff_absence`, `audit_log` |
| **Document** | trial protocol, research line, publication, announcement | `clinical_trials`, `research_lines`, `department_announcements`, `news_posts` |
| **Task** | "prepare Friday rota", "notify clinicians" | *(not yet stored — new)* |
| **Relationship** | supervises, PI-of, member-of, covers-for | *(implicit in FKs today — made explicit)* |

**Why this matters:** the seams for radiology / ICU / finance are *already cut*. Phase 2 doesn't rewrite the system — it extends this model. But we build it as pneumology first, so the abstraction is **extracted from reality, not guessed on a blank page.**

### 1.3 The discipline that makes it real (cheap now, priceless later)

- Build pneumology-specific, but **name in canonical terms.** A staff member is a `Person` that has clinical attributes — not a bare `staff` row.
- Keep `attributes` (domain-specific) separate from the base shape (universal).
- Every object carries `evidence` from day one — provenance is not a Phase-3 feature, it's the base type.

---

## 2. The Canonical Knowledge Layer

**What it is:** the single interface every agent and client talks to. No agent ever touches Postgres directly. It asks the knowledge layer for *Knowledge Objects*, filtered by intent and permission.

**Why the separation is non-negotiable:** it's what buys maintainability, testing, security, explainability, and — the big one — **replaceable storage.** Postgres today; add a vector store for documents in Phase 2; swap in OMOP or a graph DB later. Agents never notice, because they speak Knowledge Objects, not SQL.

**What exists today (V46.9):** the Node/Express API over Supabase plus an adopted in-app Knowledge Layer for `Person`, `Activity`, and `Event`. Selected live builders already use the canonical objects behind `USE_KNOWLEDGE_LAYER`; other capabilities still read the operational arrays directly. The migration is therefore real but incomplete.

**Buildable now (no model):**
- A **knowledge adapter** in the backend: read functions that return canonical Knowledge Objects assembled from the existing tables (`getPerson(id)` joins `medical_staff` + permissions + relationships into one `Person` object with evidence).
- **Permission-aware retrieval** baked in: the layer never returns an object the caller can't see. (Your RLS already does half of this.)
- **Provenance**: every returned object names its source records.

**Waits on infrastructure:** vector store for semantic document retrieval (protocols, SOPs, minutes). Not needed for structured data (staff, rota, trials) — that's pure Postgres and works now.

---

## 3. The Semantic Layer

**What it is:** the translator from human language to knowledge entities. Before the planner does anything, "Pedro / tomorrow / bronchoscopy clinic" must resolve to `Person(Pedro Marcos, 0.99)`, `Date(2026-08-03)`, `Activity(Procedure Clinic, subtype=Bronchoscopy)`.

**What exists today — and this is the honest bridge:** the current agent's resolver *is* a primitive semantic layer. Fuzzy name matching ("antello"→Antelo), the scored routing table, the concept/synonym brain, clarification when ambiguous — that's entity resolution. It's rule-based and deterministic, but it's the right *shape*.

**Buildable now (no model):**
- Promote the existing resolver into an explicit **Semantic Layer module**: entity resolution (people, dates, activities, resources) as a first-class step that returns typed entities with confidence.
- The **Teach/Brain** we just built feeds this directly — the department teaches the semantic layer its own vocabulary ("de guardia" → on-call). That already exists and persists.

**Waits on the model:** truly open-ended language understanding — paraphrases nobody taught, novel compound requests. The deterministic layer handles the department's real vocabulary well (and grows via Teach); the model handles the long tail. **This is the first place a runtime model bolts on.**

---

## 4. Intent Engine

**What it is:** determines *what the user wants to accomplish*, not which module they need. "Prepare tomorrow's rota" is an intent, not a page.

**What exists today:** the scored intent router (27 intents, 100% on eval, confidence-scored, brain-backed). This is a real, working intent engine — for **retrieval intents.**

**Buildable now:** expand the intent taxonomy from "questions" to "goals" — add intents that describe *work to be done* (prepare, draft, generate, reconcile), still routed deterministically where the goal is well-defined.

**Waits on the model:** decomposing a genuinely novel goal into sub-goals. Deterministic routing covers the known goals; the model covers "I've never seen this phrasing but I can infer the goal."

---

## 5. Task Planner + Agent Orchestration

**What it is:** for a goal that needs several capabilities, decide *which agents run, in what order, and how their evidence merges.*

> "Who should replace Dr. Garcia tomorrow?"
> Planner → Workforce Agent (who's qualified + available) + Operations Agent (what's the coverage gap) + Policy Agent (is the replacement compliant) → merge → one explained recommendation with confidence.

**The specialist agents** (each: one responsibility, reasons over Knowledge Objects, never touches SQL):

| Agent | Owns | Status today |
|---|---|---|
| **Workforce** | staff, competencies, leave, workload, availability, rotations | *builders exist (on-call, leave, rank, unsupervised) — not yet an "agent"* |
| **Operations** | daily ops, scheduling, clinics, procedures, bottlenecks | *partial (units-at-capacity, coverage gaps)* |
| **Research** | cohorts, studies, recruitment, eligibility, publications | *builders exist (trials, PI, research lines)* |
| **Policy** | SOPs, credential checks, compliance, governance | **not built — needs Policy objects (§1.2)** |
| **Reporting** | KPIs, dashboards, briefings | *briefing exists; KPIs partial* |
| **Communication** | emails, summaries, notifications, announcements | *draft-email exists* |
| **Analytics** | trends, workload analysis, forecasting | *not built* |

**What exists today (V46.9):** Grounded remains one orchestrator. The deterministic builders are proto-capabilities of Workforce/Operations/Research, while `grounded-core.js` now supplies a semantic tool registry and bounded-plan contract. Clinical Units and On-call have registered domain tools; the rest of the legacy engine is being migrated incrementally.

**Buildable now (no model):** refactor the builders into **named capability modules** grouped by agent, behind the knowledge layer. A *rule-based planner* for known multi-agent goals (the replacement-recommendation flow is deterministic: qualified ∩ available ∩ compliant). This gets you real orchestration for the goals that matter most, today.

**Waits on the model:** open-ended planning — novel goals decomposed on the fly, agents whose reasoning is synthesis rather than computation. **This is the deepest model-dependent layer.** The honest line: *deterministic planning for known workflows now; model-driven planning for the long tail later.*

---

## 6. Read → Write → Act (the maturity ladder)

The single most important sequencing idea. The system earns trust one level at a time.

| Level | Does | Examples | Status |
|---|---|---|---|
| **1 · READ** | retrieves verified info | who's on call, COPD workload, find Marcos | **✅ built, 100% eval** |
| **2 · WRITE / PROPOSE** | prepares reviewable work | draft rota, leave/on-call/rotation proposals, reports | **✅ strong** — structured proposals are established |
| **3 · ACT** | performs *approved* actions | schedule on-call, record leave, assign/cancel rotations | **◑ partial** — confirmation UI exists; On-call is migrated to guarded WRITE tools in V46.9, other write paths follow |

**Everything at Level 2 is proposed, never committed. Every Level 3 action requires explicit permission and is logged.** This ladder is how the platform stays trusted while growing teeth.

---

## 7. Safety, Provenance, Trust (first-class, not bolted on)

The vision's real thesis: *the goal is not the smartest AI — it's the most trusted operational intelligence.* Every architectural choice serves that.

- **Retrieval-first, always.** The model is an interpreter; the department data is the authority. No answer is ungrounded. *(Built: the current agent never fabricates — it answers from records or says it can't.)*
- **Explainable by default** — every answer carries: *what / why / based on what / can I trust it.* *(Built: sources, confidence meter, reasoning trace.)*
- **Confidence is explainable**, tied to real signals — data completeness, source freshness, match strength. *(Partial: confidence exists; making it signal-derived is a Phase-2 item on the list.)*
- **The three-tier action model:** Inform (read-only, instant) · Recommend (proposes, human reviews) · Execute (requires approval). Nothing critical happens silently.
- **Audit trail + execution traces** — operational changes feed the timeline/audit pattern, while the Grounded harness records context, semantic tool calls, permission blocks, latency and outcomes. No hidden reasoning is persisted.

---

## 8. Operational Memory + Event-Driven Intelligence

The two ideas that turn a reactive tool into a proactive department.

**Operational Memory** — not chat history. *Department state that persists.* Monday: Garcia's leave approved. Tuesday: the system already knows Garcia is unavailable — no re-explaining. This is Knowledge Objects with `status` + `history` (already in the base type §1.1) queried by time.

**Event-Driven Intelligence** — the system observes instead of waiting:
```
Leave approved → Coverage agent runs → Conflict detected → Replacement proposed → Supervisor notified
```
*(Foundational piece already exists: the scan engine that surfaces conflicts/gaps proactively in the digest. Event-triggering is the extension.)*

**Buildable now:** memory (it's just querying Knowledge Objects by status/time). **Waits on infrastructure:** true event triggers (webhooks/db-triggers → agent runs) and the notification pipeline.

---

## 9. Structured Outputs (the quiet keystone)

Agents never return only text. Every response is a **structured object**:
```json
{ "type": "daily_briefing", "status": "healthy", "staff_available": 22,
  "coverage": "complete", "alerts": [], "recommendations": ["Prepare Friday rota"],
  "confidence": 0.98, "evidence": ["staff_records","leave_records"] }
```
The UI *renders* these objects. This is why the same logic serves chat, dashboard, mobile, voice, API — **without changing agent logic.** *(Partial today: comparison bars, confidence, follow-ups are already structured visuals — the pattern is proven; it needs to become universal.)*

---

## 10. Engineering principles (the non-negotiables)

Retrieval-first · Explainable · Modular · Event-driven · Observable · Auditable · Secure · Human-supervised · Vendor-independent · API-first.

**The load-bearing one:** *Large language models are replaceable. Architecture is not.* Every decision protects the architecture's independence from any specific model.

---

## 11. The integrated roadmap (every phase, honestly sequenced)

This is the whole thing — not Phase 1 in isolation, but the complete arc with each stage's real dependency named.

### Phase 1 — The best Pneumology Department OS in the world *(now → mostly no model)*
The foundation, on the live system, named in canonical terms.
1. **Author the CDKM** (§1) as a real spec, mapped to the live tables. *(This document is the draft.)*
2. **Knowledge adapter** (§2): **◑ advancing** — Person/Activity/Event objects are adopted in selected live builders; exclusive backend canonical retrieval is still pending.
3. **Semantic Layer module** (§3): **◑ advanced deterministic layer exists** — entity/date resolution, ambiguity handling and Teach/Brain vocabulary are live; modular extraction continues.
4. **Capability modules** (§5): **◑ started** — semantic tool adapters now exist for Clinical Units and On-call; broad legacy builders still need decomposition.
5. **Level 2/3 actions** (§6): **◑ beyond original target** — structured proposals and human-confirmed writes exist; migrate every write path onto guarded semantic tools.
6. **Structured outputs everywhere** (§9) + **confidence from real signals** (§7): **◑ pattern proven, not universal**.
7. **Harden trust**: **◑ active** — permission-aware tools, Grounded traces, proposals and operational timeline exist; canonical provenance and universal tool migration continue.

*All of Phase 1 is buildable deterministically. The current 100%-eval engine + the live DB + the Brain are the starting capital.*

### Phase 2 — Generalize the Knowledge Model *(the abstraction, earned)*
Extract Person/Activity/Resource/Policy/Event/Document/Task from what Phase 1 revealed. Add the **vector store** for document retrieval (protocols, SOPs, minutes). Add the **Policy agent** (needs Policy objects). Now the platform is department-independent *in structure*.

### Phase 3 — The reasoning layer bolts on *(needs a runtime model)*
Where the model attaches, exactly as mapped in §3–5: open-ended semantic understanding, novel-goal planning, agents whose output is synthesis. **Self-critique** (agent checks its answer against retrieved evidence before returning). This is the "near-Claude-level" step — and it's an *addition* to a working system, not a rewrite, *because* the architecture was model-independent.

### Phase 4 — Level 3 ACT + Event-Driven *(needs write-scopes + triggers + infra)*
Approved actions execute. Events trigger agents. The department becomes proactive. Full operational timeline.

### Phase 5 — Beyond one department *(the platform realized)*
Radiology, ICU, emergency, then non-clinical (HR, finance, logistics). Each is *extending the knowledge model*, not rebuilding. The reference architecture for intent-driven enterprise systems.

---

## 12. The honest constraints (so nothing surprises us)

1. **The reasoning layer (Phase 3) needs a runtime model.** The semantic long-tail, novel-goal planning, and synthesis-agents cannot be faked deterministically. Everything *up to* that line is buildable now; that line is where the model becomes mandatory. We build to the line, cleanly, so the model plugs in rather than forcing a rewrite.
2. **It's a live clinical system.** We're refactoring a running department 65 people depend on — not greenfield. Every change is additive or migration-pathed. The knowledge layer is introduced *alongside* the current API, not by breaking it.
3. **Storage independence is a discipline, not a library.** It only stays true if agents *never* reach past the knowledge layer. The moment one agent runs raw SQL, the property is lost. This must be enforced, not hoped for.
4. **Scope discipline is the survival condition.** The vision's own warning: broad projects die unfinished. The roadmap is layered precisely so there is always a *working, trusted system* at every stage — never a half-built abstraction with nothing running.

---

## 13. What this is, in one line

**A retrieval-first, agent-orchestrated operating layer that turns verified departmental knowledge into explainable decisions, proactive intelligence, and controlled action through natural language — built as one perfect department first, and a reference architecture by extension.**

The lasting contribution isn't the AI. It's the knowledge architecture that makes the AI replaceable and the platform durable.


---

## Architecture change log

### V46.9 — Grounded Action Integrity

- Declared V46.8 as the canonical architecture baseline for this migration.
- Migrated On-call scheduling onto semantic READ/PROPOSE/WRITE tools.
- Added write-safe ambiguity handling and session-only pending action state.
- Added explicit on-call eligibility and slot checks.
- Added commit-time revalidation to prevent stale proposals from being written.
- Reused the proposal confirmation UI as the human approval gate.
- Reused a single execution trace from proposal through confirmed action instead of creating disconnected observability records.
- Corrected the architecture maturity ladder: ACT is partial/real, not “not started.”
- Set **Leave Action Integrity** as the next migration, followed by Resident Rotations.
- Established this file as a required artifact in every future complete release package.
