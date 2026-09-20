# neumDesk V43 — Grounded Context Intelligence

V43 is a targeted Grounded hardening release built directly on V42. It deliberately does **not** redesign Research, Research Library, the V42 article reader, the Research editors, login, or backend payloads.

## What changed

### Grounded now understands the object already on screen
Opening Grounded from a current Research object automatically establishes context for:

- Clinical Study
- Clinical Innovation Project
- Research Programme / Research Line
- Research Library record
- open staff profile

The active object is shown in a compact context strip beneath the Grounded header. The user can return to the exact record with **View record →**. Reopening Grounded on the same object preserves the thread; moving to a different object starts a clean contextual thread. A global Grounded open drops stale entity scoping.

### Contextual Research questions
Clinical Study context now supports deterministic questions for:

- study snapshot
- protocol & ethics / CEIm procedural status
- recruitment / enrolment
- PI and study team

Clinical Innovation context supports:

- project snapshot
- protocol & ethics / CEIm procedural status for clinical execution / validation
- readiness (stage, TRL, regulatory pathway, funding, partner state)
- lead and collaborators

Research Programme context supports:

- programme snapshot
- recruiting studies
- innovation pipeline
- Research Library output

These work both from the contextual suggestion controls and from a small set of typed natural-language phrases. They read current neumDesk records only.

### New Research answer grammar
V43 adds a `research_brief` response archetype instead of forcing Study / Project / Programme answers into generic chat cards. It provides:

- semantic object heading
- current state
- compact structured facts
- attention / positive tones only where backed by fields
- quiet explanatory note for limits
- research tags where available

### Procedural truth boundary
Protocol and Ethics / CEIm are presented as **clinical execution requirements**, not as abstract governance or a quality score.

Grounded reports only fields currently recorded in neumDesk. It does not infer Ethics Committee clearance, protocol finalisation, regulatory readiness, or compliance when a field is missing. Innovation editor-only fields that are explicitly marked **NOT SAVED YET** are not treated as persisted facts.

### Grounded spatial / UI hardening
- Grounded remains above the current object but uses a lighter 3px backdrop so the record stays perceptually present.
- Desktop sidecar widened modestly for answer readability.
- Header height reduced.
- Context strip makes the current object explicit.
- Suggestions use a compact 2-column layout on desktop and one column on mobile.
- Answer copy has stronger legibility and safe wrapping.
- Provenance rows wrap instead of clipping.
- Rich visuals are constrained safely inside the sidecar.
- Entity popovers use panel-local coordinates and are clamped to the Grounded surface.
- The Grounded greeting is upright Instrument Serif; no italic UI treatment.

### Exact Research navigation
Grounded answer actions can now open the exact:

- Research Programme
- Clinical Study
- Clinical Innovation Project

instead of only routing to a broad module view.

## Preserved from V42 and earlier

V43 intentionally preserves:

- V42 immersive Article reader and Article index terms
- Research Library Public / Internal semantics
- Research Library lenses, Review and My Library
- Study / Innovation / Research Programme editors
- protocol / ethics procedural UI boundaries
- Research Intelligence
- Grounded continuity, Activity timeline, Teach Grounded and scenario mode
- propose → confirm → write transactional flows
- leave / on-call / rotation workflows
- V41 overlay layering and one-time internal workspace notice
- `neumAC` proper-name casing

## Backend / data changes

None. V43 changes Grounded read/presentation/navigation logic only. No API payload contract was expanded or renamed.

## Deferred intentionally

The institutional login redesign is **not** included here. It should be handled separately after V43 is validated live, so Grounded and authentication changes are not mixed in one regression surface.
