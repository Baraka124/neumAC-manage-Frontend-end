# neumDESK · Phase 36 — Controlled Project Sharing in Mi Espacio

> **STATUS: DEFERRED · CONCEPT / DESIGN PROPOSAL ONLY**
>
> **Implementation decision: NOT APPROVED.** This document records an idea for possible future development. No frontend functionality, backend endpoints, database schema, migration, permissions, storage buckets, notification rules, or external integrations are authorized by it.
>
> **Do not implement, deploy, migrate, or enable this workflow until the product owner explicitly reopens the initiative, the clinical/research governance owners have reviewed it, and the prerequisites in §10 are satisfied.**
>
> Documented: 14 October 2026. Decision: **park for later discussion**.
>
> Repository scope: architectural Markdown documentation only. **No code changes.**

## 1. Idea and potential institutional value

An authorized professional (e.g. a person responsible for innovation) could prepare a structured innovation/research proposal within their personal workspace, retain drafts, select specific departmental colleagues to view a project, optionally attach a relevant reference URL, and later revoke those colleagues' access. Recipients would see the granted item under **Compartidos conmigo** with the project title, owner's institutional identity, recorded project stage, extent of access, associated materials/links, and any later status change they are permitted to see.

The proposal could reduce fragmented email attachments, make access decisions traceable, and establish a deliberate route from personal innovation work toward an approved departmental research project. The value comes from **governed, linked collaboration**, not from making Mi Espacio another document-sharing app.

This is a **hypothesis**, not a commitment to build. Validate real departmental need and existing tools before prioritization.

## 2. Non-negotiable architectural boundaries

1. **One authoritative project record.** Research projects, clinical studies and clinical trials must retain their own governed institutional source of truth. Mi Espacio is a view and optional entry workflow, not a parallel project catalogue or isolated project database.
2. **Sharing ≠ membership ≠ editorial authority.** Granting someone read access does **not** appoint them PI, Co-PI, coinvestigator, collaborator or study-team member, and does not confer permission to edit records.
3. **Identity and grants are server-enforced.** Select only verified staff/account identities. Never trust a client-selected staff ID, email, display name, link token or Vue visibility state as authorization.
4. **No patient-level material.** The initial concept excludes patient-identifiable documents, medical records and clinical images. Additional data classifications would require separate legal/security approval.
5. **Source lifecycle remains authoritative.** Project stage, study status, trial classification and research roles come from verified records; an attachment, project title or shared message must never invent a lifecycle status or research membership.
6. **No second application or permission system.** Reuse neumDESK authentication, institutional role/capability policies and existing research governance. Any new grant type must be modeled and tested as a specific delegated capability, not an override of the core permission system.
7. **Explicit revocation, bounded meaning.** Revoking a neumDESK grant must stop further authorized reads through neumDESK. It cannot erase data someone previously downloaded or revoke an unrelated external service's access unless that service supplies an approved integration.
8. **Auditability by design.** Creation, granting, viewing/download authorization where appropriate, amendments, expiry and revocation must be attributable and reviewable within applicable retention rules.

These boundaries extend the principles in `docs/mi-espacio-architecture.md` and `docs/mi-espacio-phase26-workspace-architecture.md`. They do not supersede those documents.

## 3. Future user journeys (conceptual)

### A. Author / permitted project creator

1. Open Mi Espacio → **Mis proyectos**.
2. Select **Nueva propuesta**, only if the server confirms create authority.
3. Complete an approved project template (working title, objectives, responsible person, research/innovation classification, proposed stage, governance/ethics context when applicable, supporting references and permitted attachments).
4. Save a **private draft** to the same governed proposal/project lifecycle; never silently publish it to the department.
5. Use **Compartir** to choose an exact, authenticated recipient from an authorized directory picker.
6. Review precisely what will become visible, and confirm the grant. The initial proposed grant is **solo lectura**, resource-scoped and revocable.
7. In **Gestionar accesos**, inspect current recipients, grant dates, grant owner, expiry if applicable and revoke actions.

### B. Recipient / authorized reader

1. Open Mi Espacio → **Compartidos conmigo**.
2. See only resources with an active grant under the current account, without exposing the existence or counts of restricted projects.
3. Open a compact, read-only project reader with permitted metadata, the owner's professional identity and explicitly shared supporting links/files.
4. Observe a clear distinction between **Compartido para consulta** and **Participación institucional verificada**.
5. When access is revoked or expired, lose further access to the shared project and its protected internal attachments; avoid cached data remaining visible after logout, account switch or revocation.
6. Any future invitation to join the research team must pass a **separate** governed membership/approval workflow.

### C. Ownership and lifecycle progression

- Draft → review → authorized project record should be one controlled institutional lifecycle, if the current project module supports such stages. Do not assume these exact stages exist today.
- Submission, approval, PI assignment, Co-PI assignment and trial activation are not effects of sharing.
- Where a recipient later becomes a verified contributor, Phase 35 personal scientific participation may show that **approved relationship** independently of the sharing grant.
- Reassignments, owner departure, archived projects and deleted accounts require governance-defined handling, not implicit perpetual access.

## 4. Information architecture proposal

Mi Espacio remains a personalized workspace inside the current SPA. Proposed contextual views, **not approved UI routes**:

| View | Purpose | Owns records? |
| --- | --- | --- |
| **Mis proyectos** | Projects formally owned/created or otherwise institutionally assigned to the logged-in account | No; projects remain with Research/Innovation |
| **Compartidos conmigo** | Other people's project records currently granted for review | No; grant-based projection only |
| **Gestionar accesos** | Show recipients and permitted revoke/expiry actions on an owned or delegated project | No; controls governed grants |
| **Proyecto / lector** | Read permitted metadata, stage, attachments and safe external references | No; opens authoritative records and controlled files |
| **Actividad científica y clínica** (existing profile) | Verified PI/Co-PI/contributor roles and recorded lifecycle | No; membership-derived, never grant-derived |

**Avoid** adding these views automatically for everyone. Only render contextual entry points when authorized, relevant or when a documented empty/limited state genuinely helps. Avoid replicating the full Research module inside Mi Espacio.

## 5. Proposed conceptual data contract (NOT A SCHEMA DECISION)

Keep separate, traceable concepts:

- **Project/proposal:** canonical resource identifier; title; approved kind; owner/organization; authoritative lifecycle/stage; original module; visibility classification; source revision.
- **Verified research membership:** canonical resource identifier + staff/account identifier + formal role + source/verification. This is independent of share access.
- **Share grant:** grant identifier; resource identifier/type; grantor identity; recipient verified account/staff identity; explicit read-only scope; created/expiry/revoked timestamps; optional reason; audit correlation identifier.
- **Attachment/reference:** resource identifier; file or external URL; human-readable label; ownership/classification; per-recipient visibility if required; external-domain warning; source provenance.
- **Audit event:** actor; action; target resource/grant; decision; occurred-at timestamp; source version; minimal required metadata.

**No table names, SQL migrations, REST contracts, bucket policies or Supabase RLS changes are approved here.** Before choosing persistence, inventory the existing project model, members, sharing features, object storage, audit log, account linking and actual policy enforcement in the owning backend.

Potential roles for a later product decision: **propietario**, **gestor autorizado**, **lector compartido**. A **reviewer/commenter** role is deliberately **out of the initial proposed release**.

## 6. Permission, confidentiality and revocation policy (design requirements)

- **Default private:** a newly saved draft has no recipient share access by default.
- **Least privilege:** grant only the smallest set of permitted fields/attachments for an exact recipient and exact resource. No department-wide or public-by-link access in the first iteration.
- **Server checks for every request:** project details, document streams, exports, thumbnails/previews and metadata must independently enforce authorization. Hiding a menu item in Vue is never enough.
- **No permission laundering:** a recipient cannot re-share, nominate project members, edit a clinical study or grant themselves capabilities without separately approved privileges.
- **Revoke means deny future access:** the backend must reject further reads and downloads, invalidate relevant private caches/sessions as feasible and reflect revocation in the UI. Expired links cannot be replayed.
- **Race conditions:** permissions checked at action time, not only at list rendering; owner transfers, inactive staff accounts and stale browser views must not retain access.
- **Retention:** the department must decide how long audit events, proposal drafts and withdrawn shares remain stored, consistent with institutional policy.
- **Explicit classification:** internal research summaries only in the initial proposal; sensitive clinical or patient-identifiable materials are outside initial scope.

### External URLs and attachments

An external URL is a **reference**, not a neumDESK permission grant.

- Optional and separately labeled **Enlace externo** with descriptive title/domain.
- Validate allowed protocols (HTTPS), protect against unsafe schemes, treat rendered labels/URLs as untrusted input, and apply safe outbound-link behavior.
- Warn that the destination may have independent login, sharing and retention policies.
- Revoking an internal share removes that link **from neumDESK's authorized UI**, but cannot disable previously copied URLs or the other service's own permissions.
- Hosted internal documents would require existing protected storage, file scanning/content validation where relevant, signed or authenticated delivery, and server-side permission checking. Never adopt a public bucket as a shortcut.
- Direct editable integration with SharePoint/Drive or similar is a **future separate proposal**, not required by this concept.

## 7. MVP proposal if later approved — deliberately narrow

Potential first release:

1. Read-only, person-specific sharing of **existing** approved project records, using only the metadata already classified for internal sharing.
2. One authenticated recipient at a time (multiple recipients through distinct grants); explicit grant confirmation and immediate revoke.
3. **Compartidos conmigo** with simple listing, actual recorded stage, real record owner and last-updated/source status.
4. Optional external reference URL for a project, as authorized by the resource owner, with a clear external-service boundary.
5. Audit events for grant, revoke, denied access and access-policy changes.
6. Clear empty, loading, expired, revoked, missing-record and 403 states. No cross-account leaks.

**Deliberately not in MVP:** public links, blanket team sharing, comments, simultaneous editing, document coauthoring, notifications/digests, automatic project creation from arbitrary files, direct clinical trial governance, free-form PI/co-PI assignment or external-service permission revocation.

The separate **creation of a structured private project draft from Mi Espacio** is appealing, but should be evaluated **after** the existing project/proposal lifecycle and create permission have been audited. It may require a separate gated increment even if sharing is later approved.

## 8. Risks and trade-offs

| Risk | Preventive design decision |
| --- | --- |
| Parallel project copies | One canonical Research/Innovation record and source reference |
| Grant mistaken for research participation | Different, plainly labeled projections and verified role contracts |
| Accidental sharing of restricted clinical content | Field-level classification, least privilege, resource and file authorization |
| Revocation that only hides UI | Server-enforced access checks for list/detail/files, cache invalidation and audit |
| Stale grants after account departure | Link grants to verified active account and evaluate account status on every read |
| Expansive workflow in Mi Espacio | Limit to personal drafts/access management and link to the owning Research module |
| External file link misrepresented as protected | Treat external permissions as independent and visibly disclose limitation |
| Over-complex MVP | Start with existing records, read-only grants and revocation; defer collaboration |

## 9. Evidence of value to collect before commitment

The responsible department/product owner should validate:

- How many innovation/research proposals currently circulate via email, shared drives or informal messages?
- Which concrete handoffs fail today because relevant colleagues cannot find a controlled, current project summary?
- Does Research/Innovation already offer a sufficiently safe draft-and-share workflow, making a Mi Espacio addition unnecessary?
- Which staff categories may create proposals, grant access, review them and revoke grants?
- How many real users would benefit from a **read-only shared-project inbox**, relative to implementation/security/maintenance cost?
- What current institutional information-security, research governance, retention and clinical-study rules constrain sharing?

Avoid staff productivity scoring and invented benefits. Pilot with non-sensitive institutional test records only, if a pilot is later explicitly authorized.

## 10. Explicit prerequisites before resuming

**The work remains deferred unless ALL are addressed:**

- [ ] Product owner explicitly authorizes reopening Phase 36 and defines the scope.
- [ ] Backend/source audit confirms current project/clinical-study schema, allowed statuses, formal participants, owner controls and create permissions.
- [ ] Institutional security/research governance agree which kinds of proposals, internal metadata and documents may be shared and with whom.
- [ ] Authorization design is signed off for read, list, revoke, account switch, expiration, 403, file/attachment access and cross-role leakage.
- [ ] Decide whether the first pilot covers **existing projects only** or also **new private proposal drafts**. These are different scopes.
- [ ] External-reference policy and revocation limitations are accepted explicitly.
- [ ] Acceptance matrix covers owner, recipient, unlinked account, clinician, resident, admin, revoked/expired grant, and unprivileged direct URL/API attempts.
- [ ] Identify an institutional record owner, support process and audit/retention policy.
- [ ] Draft backend API, schema, migration and UI contracts **only after** the above decisions.
- [ ] Create a new implementation PR **only after** explicit approval; require CI, negative authorization tests and authenticated manual acceptance before release.

## 11. Decision record

| Item | Decision |
| --- | --- |
| Potential value | Worth retaining for later product consideration |
| Recommended entry point | Mi Espacio as a personal projection over authoritative projects |
| Preferred eventual MVP | Existing project record → explicit read-only grants → recipient list → revocation |
| New project/proposal creation | **Not decided**; dependent on current canonical research lifecycle |
| Comments, editing, anonymous sharing, external permission automation | **Deferred / out of first release** |
| Immediate engineering work | **NONE** |
| Present authorization | **DOCUMENTATION ONLY — DEFERRED** |
| Reopening trigger | Explicit request after current platform priorities and governance review |

**Conclusion:** preserve the concept as a future controlled-collaboration capability. Do **not** introduce project-upload UI, share buttons, databases, permissions, links, notifications or service integrations at this stage.
