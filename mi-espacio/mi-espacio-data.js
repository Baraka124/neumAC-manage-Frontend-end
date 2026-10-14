/* neumDESK · Mi espacio · Phase 1 identity adapter. No broad staff lookups. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.NeumMiEspacioData = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const safe = value => typeof value === 'string' ? value.trim() : '';
  const id = value => (typeof value === 'string' || typeof value === 'number') && String(value).trim() ? String(value) : '';

  function normalizeContext(raw, expectedUserId) {
    if (!id(expectedUserId) || !raw || typeof raw !== 'object' ||
        raw.account_status !== 'active' || id(raw.id) !== id(expectedUserId)) {
      throw new Error('The session could not be verified for this account. Please sign in again.');
    }
    const staffId = id(raw.medical_staff_id);
    const linked = raw.linked_staff && typeof raw.linked_staff === 'object'
      ? raw.linked_staff : null;
    const validLinked = staffId && id(linked?.id) === staffId;
    return {
      account: Object.freeze({
        id: id(raw.id),
        name: safe(raw.full_name) || 'Cuenta institucional',
        email: safe(raw.email),
        role: safe(raw.job_title) || safe(raw.user_role)
      }),
      staff: validLinked ? Object.freeze({
        id: staffId,
        name: safe(linked.full_name),
        staffType: safe(linked.staff_type),
        specialization: safe(linked.specialization),
        professionalEmail: safe(linked.professional_email)
      }) : null,
      linkState: !staffId ? 'unlinked' : validLinked ? 'linked' : 'unavailable',
      testSession: !!raw.test_session
    };
  }

  async function loadContext(request, expectedUserId, signal) {
    if (typeof request !== 'function') throw new Error('An authenticated request service is required.');
    const raw = await request('/api/auth/me', { skipCache: true, timeoutMs: 15000, signal });
    return normalizeContext(raw, expectedUserId);
  }

  // ── Phase 2: verified personal activity from the server-side resolver ──
  // Identity/verification stays with normalizeContext above; this only shapes
  // the activity the resolver already scoped to this person. Purely defensive:
  // unknown fields are dropped, nothing is inferred, empty is a valid answer.
  const arr = value => Array.isArray(value) ? value : [];
  const num = value => (typeof value === 'number' && isFinite(value)) ? value : null;

  function normalizeActivity(raw) {
    const data = raw && typeof raw === 'object' ? raw : {};
    const agenda = data.agenda && typeof data.agenda === 'object' ? data.agenda : {};
    const research = data.research && typeof data.research === 'object' ? data.research : {};
    const pub = data.publications && typeof data.publications === 'object' ? data.publications : {};

    const guardias = arr(agenda.guardias).map(g => ({
      id: id(g && g.id), date: safe(g && g.date), shift: safe(g && g.shift), role: safe(g && g.role)
    })).filter(g => g.date);
    const rotations = arr(agenda.rotations).map(r => ({
      id: id(r && r.id), unit: safe(r && r.unit), resident: safe(r && r.resident),
      start: safe(r && r.start), end: safe(r && r.end), status: safe(r && r.status), role: safe(r && r.role)
    }));
    const absences = arr(agenda.absences).map(a => ({
      id: id(a && a.id), type: safe(a && a.type), reason: safe(a && a.reason), start: safe(a && a.start), end: safe(a && a.end), status: safe(a && a.status), days: num(a && a.days)
    }));
    const lines = arr(research.lines).map(l => ({
      id: id(l && l.id), number: num(l && l.line_number), name: safe(l && l.name), role: safe(l && l.role)
    }));
    const studies = arr(research.studies).map(s => ({
      id: id(s && s.id), title: safe(s && s.title), code: safe(s && s.protocol_id), status: safe(s && s.status), role: safe(s && s.role),
      studyType: safe(s && (s.study_type || s.studyType))
    }));
    const projects = arr(research.projects).map(p => ({
      id: id(p && p.id), title: safe(p && p.title), stage: safe(p && p.stage), category: safe(p && p.category), role: safe(p && p.role)
    }));

    const publications = arr(pub.items).map(p => ({
      id: id(p && p.id), title: safe(p && p.title), byline: safe(p && p.byline),
      order: num(p && p.author_order), corresponding: !!(p && p.corresponding)
    })).filter(p => p.title);

    return Object.freeze({
      agenda: Object.freeze({ guardias: Object.freeze(guardias), rotations: Object.freeze(rotations), absences: Object.freeze(absences) }),
      research: Object.freeze({ lines: Object.freeze(lines), studies: Object.freeze(studies), projects: Object.freeze(projects) }),
      publications: Object.freeze({ available: !!pub.available, note: safe(pub.note), items: Object.freeze(publications) }),
      counts: Object.freeze({
        guardias: guardias.length, rotations: rotations.length, absences: absences.length,
        lines: lines.length, studies: studies.length, projects: projects.length, publications: publications.length
      })
    });
  }

  // Phase 35 — read-only participation from an already authorized /api/me/context
  // response. No extra staff-wide lookups, inferred roles, or synthetic statuses.
  // Co-IP is NOT the same role as co-investigator.
  const participationKey = value => safe(value).toLowerCase().normalize('NFD')
    .replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'');
  const PARTICIPATION_ROLES = Object.freeze({
    pi:'Investigador/a principal (IP)', principal_investigator:'Investigador/a principal (IP)',
    ip:'Investigador/a principal (IP)', investigador_principal:'Investigador/a principal (IP)',
    co_pi:'Coinvestigador/a principal (Co-IP)', copi:'Coinvestigador/a principal (Co-IP)',
    co_principal_investigator:'Coinvestigador/a principal (Co-IP)',
    co_investigator:'Coinvestigador/a', coinvestigator:'Coinvestigador/a',
    co_investigador:'Coinvestigador/a', sub_investigator:'Subinvestigador/a',
    subinvestigator:'Subinvestigador/a', collaborator:'Colaborador/a',
    colaborador:'Colaborador/a', contributor:'Colaborador/a', contribuidor:'Colaborador/a',
    member:'Miembro', miembro:'Miembro', participant:'Participante',
    lead:'Responsable', responsible:'Responsable', coordinator:'Coordinación'
  });
  const PARTICIPATION_STATES = Object.freeze({
    active:'Activo', ongoing:'En curso', in_progress:'En desarrollo',
    development:'En desarrollo', recruiting:'En reclutamiento',
    recruitment:'En reclutamiento', enrollment_open:'Reclutamiento abierto',
    planned:'Planificado', planning:'En planificación', draft:'Borrador',
    submitted:'Presentado', pending:'Pendiente',
    approved:'Aprobado', pilot:'Piloto', execution:'En ejecución',
    completed:'Finalizado', finished:'Finalizado', finalized:'Finalizado',
    closed:'Cerrado', archived:'Archivado',
    cancelled:'Cancelado', canceled:'Cancelado', suspended:'Suspendido'
  });
  const INACTIVE_STATES = new Set(['completed','finished','finalized','closed','archived','cancelled','canceled']);
  const PLANNED_STATES = new Set(['planned','planning','draft','submitted','pending','approved']);
  const TRIAL_TYPES = new Set(['clinical_trial','ensayo_clinico']);
  const participationRole = raw => PARTICIPATION_ROLES[participationKey(raw)] ||
    (safe(raw) ? safe(raw) : 'Rol no registrado');
  const participationStatus = raw => PARTICIPATION_STATES[participationKey(raw)] ||
    (safe(raw) ? safe(raw) : 'Estado no registrado');
  function buildScientificParticipation(activity) {
    const studies = arr(activity?.research?.studies);
    const projects = arr(activity?.research?.projects);
    const rows = [];
    for (const item of studies) {
      const title = safe(item?.title);
      if (!title) continue;
      const type = participationKey(item?.studyType);
      const rawStatus = safe(item?.status);
      rows.push(Object.freeze({
        key: 'study:'+id(item?.id)+':'+rows.length, title,
        kind: TRIAL_TYPES.has(type) ? 'Ensayo clínico' : 'Estudio',
        role: participationRole(item?.role), status: participationStatus(rawStatus),
        statusRecorded: Boolean(rawStatus),
        protocol: safe(item?.code), closed: INACTIVE_STATES.has(participationKey(rawStatus)),
        planned: PLANNED_STATES.has(participationKey(rawStatus))
      }));
    }
    for (const item of projects) {
      const title = safe(item?.title);
      if (!title) continue;
      const rawStage = safe(item?.stage);
      rows.push(Object.freeze({
        key: 'project:'+id(item?.id)+':'+rows.length, title,
        kind:'Proyecto', role: participationRole(item?.role),
        status: participationStatus(rawStage), statusRecorded: Boolean(rawStage),
        protocol:'', closed: INACTIVE_STATES.has(participationKey(rawStage)),
        planned: PLANNED_STATES.has(participationKey(rawStage))
      }));
    }
    // Stable presentation: recorded current work, planned work, unspecified,
    // then closed/history. No chronology or outcome inferred from a title.
    const current = rows.filter(x=>!x.closed);
    const history = rows.filter(x=>x.closed);
    const rank = x => !x.statusRecorded ? 2 : x.planned ? 1 : 0;
    current.sort((a,b)=>rank(a)-rank(b));
    return Object.freeze({
      current:Object.freeze(current),history:Object.freeze(history),
      total:rows.length
    });
  }

  const DUTY_SHIFT_LABELS = Object.freeze({
    on_call_present:'Guardia presencial', primary_call:'Guardia presencial', presencial:'Guardia presencial',
    on_call_mixed:'Guardia mixta', mixta:'Guardia mixta',
    on_call_home:'Guardia localizada', localizada:'Guardia localizada'
  });
  function formatDutyShift(raw) {
    const value = safe(raw);
    return DUTY_SHIFT_LABELS[value.toLowerCase()] || value.replace(/_/g,' ') || 'Modalidad no indicada';
  }

  async function loadActivity(request, signal) {
    if (typeof request !== 'function') throw new Error('An authenticated request service is required.');
    const raw = await request('/api/me/context', { skipCache: true, timeoutMs: 15000, signal });
    return normalizeActivity(raw);
  }

  // ── Claim/verify: a person flags that something on their space is missing or
  // wrong. A request, never a direct edit; the server attributes the reporter. ──
  const SUBJECTS = ['guardia','rotation','absence','line','study','project','publication','profile','other'];
  const KINDS = ['missing','incorrect','authorship','schedule','other'];

  function buildReport(input) {
    const i = input && typeof input === 'object' ? input : {};
    const out = {
      subject_type: SUBJECTS.indexOf(i.subject_type) !== -1 ? i.subject_type : 'other',
      kind: KINDS.indexOf(i.kind) !== -1 ? i.kind : 'other'
    };
    const subjectId = safe(i.subject_id), subjectLabel = safe(i.subject_label), message = safe(i.message);
    if (subjectId) out.subject_id = subjectId;
    if (subjectLabel) out.subject_label = subjectLabel;
    if (message) out.message = message;
    return out;
  }

  async function submitDiscrepancy(request, input, signal) {
    if (typeof request !== 'function') throw new Error('An authenticated request service is required.');
    return request('/api/me/discrepancies', { method: 'POST', body: buildReport(input), timeoutMs: 15000, signal });
  }

  function normalizeReport(raw) {
    const r = raw && typeof raw === 'object' ? raw : {};
    return {
      id: id(r.id), subjectType: safe(r.subject_type), subjectLabel: safe(r.subject_label),
      kind: safe(r.kind), message: safe(r.message), status: safe(r.status) || 'open',
      resolutionNote: safe(r.resolution_note), createdAt: safe(r.created_at)
    };
  }

  async function loadMyReports(request, signal) {
    if (typeof request !== 'function') throw new Error('An authenticated request service is required.');
    const raw = await request('/api/me/discrepancies', { skipCache: true, timeoutMs: 15000, signal });
    return (Array.isArray(raw) ? raw : []).map(normalizeReport);
  }

  // ── Reviewer queue: the other half of the loop. A coordinator/head sees the
  // reports addressed to them and accepts or rejects each one. Authority is the
  // server's (admin_level ≥ 1): this adapter only shapes the queue and the
  // resolution patch, and never decides who may review. ──
  const QUEUE_STATUS = ['open','in_review','accepted','rejected'];

  function normalizeReviewItem(raw) {
    const r = raw && typeof raw === 'object' ? raw : {};
    const reporter = r.reporter && typeof r.reporter === 'object' ? r.reporter : {};
    return {
      id: id(r.id), reporterName: safe(reporter.full_name),
      subjectType: safe(r.subject_type), subjectId: safe(r.subject_id), subjectLabel: safe(r.subject_label),
      kind: safe(r.kind), message: safe(r.message), status: safe(r.status) || 'open',
      resolutionNote: safe(r.resolution_note), createdAt: safe(r.created_at), resolvedAt: safe(r.resolved_at)
    };
  }

  async function loadReviewQueue(request, status, signal) {
    if (typeof request !== 'function') throw new Error('An authenticated request service is required.');
    const s = QUEUE_STATUS.indexOf(status) !== -1 ? status : '';
    const path = s ? '/api/discrepancies?status=' + encodeURIComponent(s) : '/api/discrepancies';
    const raw = await request(path, { skipCache: true, timeoutMs: 15000, signal });
    return (Array.isArray(raw) ? raw : []).map(normalizeReviewItem);
  }

  function buildResolve(input) {
    const i = input && typeof input === 'object' ? input : {};
    const out = {};
    if (QUEUE_STATUS.indexOf(i.status) !== -1) out.status = i.status;
    const note = safe(i.resolution_note);
    if (note) out.resolution_note = note;
    return out;
  }

  async function resolveReport(request, reportId, input, signal) {
    if (typeof request !== 'function') throw new Error('An authenticated request service is required.');
    if (!id(reportId)) throw new Error('A report id is required to resolve a discrepancy.');
    const patch = buildResolve(input);
    if (!Object.keys(patch).length) throw new Error('Nothing to update on this report.');
    return request('/api/discrepancies/' + encodeURIComponent(reportId), { method: 'PUT', body: patch, timeoutMs: 15000, signal });
  }

  // The resolver can accept a report while its best-effort structured link fails.
  // Keep resolution and linkage distinct; never claim the authorship/membership
  // was created unless the backend explicitly confirms it.
  function reviewOutcome(response, requestedStatus) {
    const result = response && typeof response === 'object' ? response : {};
    if (result.status !== requestedStatus) {
      throw new Error('La resolución no ha sido confirmada. Actualiza la cola antes de intentarlo de nuevo.');
    }
    if (requestedStatus === 'rejected') return { message: 'Comunicación rechazada.', needsAttention: false };
    if (requestedStatus === 'accepted') {
      if (result.linked === 'failed') {
        return { message: 'Comunicación aceptada, pero la vinculación automática ha fallado. Es necesaria una revisión manual.', needsAttention: true };
      }
      if (result.linked === 'line_member') return { message: 'Comunicación aceptada y pertenencia a la línea vinculada.', needsAttention: false };
      if (result.linked === 'publication_author') return { message: 'Comunicación aceptada y autoría vinculada.', needsAttention: false };
      return { message: 'Comunicación aceptada. Comprueba si requiere una corrección manual.', needsAttention: false };
    }
    return { message: 'Estado de la comunicación actualizado.', needsAttention: false };
  }

  // ── Subject options for a claim: the few lines and the publications a person
  // can point at, so a report carries a real subject_id and the server can
  // auto-link on accept. Both tolerate either {data:[…]} or a bare array. ──
  const rows = raw => raw && Array.isArray(raw.data) ? raw.data : (Array.isArray(raw) ? raw : []);

  async function loadLineOptions(request, signal) {
    if (typeof request !== 'function') throw new Error('An authenticated request service is required.');
    const raw = await request('/api/research-lines', { skipCache: true, timeoutMs: 15000, signal });
    return rows(raw).map(l => ({
      id: id(l && l.id),
      label: ((l && (typeof l.line_number === 'number')) ? 'L' + l.line_number + ' · ' : '') + safe(l && (l.research_line_name || l.name))
    })).filter(o => o.id && o.label);
  }

  async function loadPublicationOptions(request, signal) {
    if (typeof request !== 'function') throw new Error('An authenticated request service is required.');
    const raw = await request('/api/news?type=publication', { skipCache: true, timeoutMs: 15000, signal });
    return rows(raw).map(p => ({ id: id(p && p.id), label: safe(p && p.title) })).filter(o => o.id && o.label);
  }

  // ── Phase 15: self-service profile — read the full staff record, update
  // editable fields, and upload a profile photo. All scoped to /api/me/*,
  // never touches another person's record. ──
  function normalizeProfile(raw) {
    const d = raw && typeof raw === 'object' ? raw : {};
    return {
      id: id(d.id),
      fullName: safe(d.full_name),
      title: safe(d.title),
      gender: safe(d.gender),
      staffType: safe(d.staff_type),
      specialization: safe(d.specialization),
      professionalEmail: safe(d.professional_email),
      mobilePhone: safe(d.mobile_phone),
      workPhone: safe(d.work_phone),
      officePhone: safe(d.office_phone),
      publicBio: safe(d.public_bio),
      publicPhotoUrl: safe(d.public_photo_url),
      isPublic: !!d.is_public,
      orcidId: safe(d.orcid_id),
      scholarUrl: safe(d.scholar_url),
      researchgateUrl: safe(d.researchgate_url),
      pubmedQuery: safe(d.pubmed_query),
      affiliationType: safe(d.affiliation_type),
      primaryDeptName: safe(d.primary_dept_name),
      academicDegree: safe(d.academic_degree),
      hasPhd: !!d.has_phd,
      phdField: safe(d.phd_field),
      employmentStatus: safe(d.employment_status),
      trainingYear: safe(d.training_year),
      trainingLevel: safe(d.training_level),
      residencyStartDate: safe(d.residency_start_date),
      residentCategory: safe(d.resident_category),
      residentType: safe(d.resident_type),
      hasMedicalLicense: !!d.has_medical_license,
      medicalLicense: safe(d.medical_license),
      canBePi: !!d.can_be_pi,
      canBeCoi: !!d.can_be_coi,
      canSuperviseResidents: !!d.can_supervise_residents,
      yearsExperience: num(d.years_experience),
      primaryClinic: safe(d.primary_clinic),
      indexedPublicationsCount: num(d.indexed_publications_count),
      hIndex: num(d.h_index),
      department: d.department && typeof d.department === 'object'
        ? { id: id(d.department.id), name: safe(d.department.name) } : null,
      profileCompleteness: num(d.profile_completeness) ?? 0,
      missingFields: Array.isArray(d.missing_fields) ? d.missing_fields.map(f => ({ key: safe(f && f.key), label: safe(f && f.label) })).filter(f => f.key) : [],
      notificationPrefs: d.notification_prefs && typeof d.notification_prefs === 'object'
        ? { notificationsEnabled: d.notification_prefs.notifications_enabled !== false, absenceNotifications: d.notification_prefs.absence_notifications !== false, announcementNotifications: d.notification_prefs.announcement_notifications !== false }
        : { notificationsEnabled: true, absenceNotifications: true, announcementNotifications: true }
    };
  }

  async function loadProfile(request, signal) {
    if (typeof request !== 'function') throw new Error('An authenticated request service is required.');
    const raw = await request('/api/me/profile', { skipCache: true, timeoutMs: 15000, signal });
    return normalizeProfile(raw);
  }

  async function updateProfile(request, fields, staffId, signal) {
    if (typeof request !== 'function') throw new Error('An authenticated request service is required.');
    if (!id(staffId)) throw new Error('No staff profile linked.');
    return request('/api/medical-staff/' + encodeURIComponent(staffId), {
      method: 'PUT', body: fields, timeoutMs: 15000, signal
    });
  }

  async function uploadPhoto(request, file, signal) {
    if (typeof request !== 'function') throw new Error('An authenticated request service is required.');
    const form = new FormData();
    form.append('file', file);
    return request('/api/me/photo', { method: 'POST', body: form, raw: true, timeoutMs: 30000, signal });
  }

  async function updateNotificationPrefs(request, prefs, signal) {
    if (typeof request !== 'function') throw new Error('An authenticated request service is required.');
    return request('/api/users/profile', { method: 'PUT', body: prefs, timeoutMs: 15000, signal });
  }

  async function loadMyCertificates(request, signal) {
    if (typeof request !== 'function') throw new Error('An authenticated request service is required.');
    const raw = await request('/api/me/certificates', { skipCache: true, timeoutMs: 15000, signal });
    return (Array.isArray(raw) ? raw : []).map(c => ({
      id: id(c.id), name: safe(c.certificate_name),
      issuedDate: safe(c.issued_date), expiryDate: safe(c.expiry_date),
      renewalMonths: num(c.renewal_months), notes: safe(c.notes),
      daysUntilExpiry: num(c.days_until_expiry), urgency: safe(c.urgency) || 'ok'
    }));
  }

  // ── Phase 20: colleague directory ──
  function normalizeColleague(raw) {
    const c = raw && typeof raw === 'object' ? raw : {};
    return {
      id: id(c.id), name: safe(c.name), title: safe(c.title), staffType: safe(c.staffType),
      specialization: safe(c.specialization), photo: safe(c.photo), bio: safe(c.bio),
      department: safe(c.department), orcid: safe(c.orcid), scholar: safe(c.scholar), researchgate: safe(c.researchgate)
    };
  }

  async function loadColleagues(request, signal) {
    if (typeof request !== 'function') throw new Error('An authenticated request service is required.');
    const raw = await request('/api/me/colleagues', { skipCache: true, timeoutMs: 15000, signal });
    return (Array.isArray(raw) ? raw : []).map(normalizeColleague);
  }

  // ── Phase 20: personal dashboard stats ──
  function normalizeDashboard(raw) {
    const d = raw && typeof raw === 'object' ? raw : {};
    return {
      activeStudies: num(d.activeStudies) ?? 0,
      activeProjects: num(d.activeProjects) ?? 0,
      publications: num(d.publications) ?? 0,
      totalCertificates: num(d.totalCertificates) ?? 0,
      expiredCertificates: num(d.expiredCertificates) ?? 0,
      expiringCertificates: num(d.expiringCertificates) ?? 0,
      absenceDaysThisYear: num(d.absenceDaysThisYear) ?? 0,
      piStudies: num(d.piStudies) ?? 0,
      piProjects: num(d.piProjects) ?? 0,
      hIndex: num(d.hIndex),
      indexedPublications: num(d.indexedPublications)
    };
  }

  async function loadDashboard(request, signal) {
    if (typeof request !== 'function') throw new Error('An authenticated request service is required.');
    const raw = await request('/api/me/dashboard', { skipCache: true, timeoutMs: 15000, signal });
    return normalizeDashboard(raw);
  }

  // ── Phase 16: personal activity timeline from audit logs ──
  const ACTION_LABELS = Object.freeze({
    'login':'Inicio de sesión', 'update':'Actualización', 'create':'Creación',
    'delete':'Eliminación', 'upload':'Subida', 'view':'Consulta',
    'approve':'Aprobación', 'reject':'Rechazo', 'export':'Exportación'
  });
  const RESOURCE_LABELS = Object.freeze({
    'medical_staff':'Perfil profesional', 'staff_certificates':'Certificado',
    'staff-photos':'Foto de perfil', 'discrepancy_reports':'Comunicación',
    'absence_records':'Ausencia', 'on_call':'Guardia', 'rotations':'Rotación',
    'research_lines':'Línea de investigación', 'studies':'Estudio',
    'projects':'Proyecto', 'publications':'Publicación', 'app_users':'Cuenta'
  });

  function normalizeActivityEntry(raw) {
    const e = raw && typeof raw === 'object' ? raw : {};
    const action = safe(e.action);
    const resource = safe(e.resource);
    let details = null;
    try { details = typeof e.details === 'string' ? JSON.parse(e.details) : e.details; } catch(_){}
    return {
      id: id(e.id),
      action,
      actionLabel: ACTION_LABELS[action] || action.replace(/_/g, ' '),
      resource,
      resourceLabel: RESOURCE_LABELS[resource] || resource.replace(/_/g, ' '),
      resourceId: safe(e.resource_id),
      details,
      createdAt: safe(e.created_at)
    };
  }

  async function loadMyActivity(request, signal) {
    if (typeof request !== 'function') throw new Error('An authenticated request service is required.');
    const raw = await request('/api/me/activity', { skipCache: true, timeoutMs: 15000, signal });
    return (Array.isArray(raw) ? raw : []).map(normalizeActivityEntry);
  }

  // ── Phase 21: Notifications, Calendar, Digest ──

  function normalizeNotification(raw) {
    const n = raw && typeof raw === 'object' ? raw : {};
    return {
      id: safe(n.id), type: safe(n.type), severity: safe(n.severity),
      title: safe(n.title), message: safe(n.message), detail: safe(n.detail),
      date: safe(n.date), refId: safe(n.refId)
    };
  }
  async function loadNotifications(request, signal) {
    if (typeof request !== 'function') throw new Error('An authenticated request service is required.');
    const raw = await request('/api/me/notifications', { skipCache: true, timeoutMs: 15000, signal });
    return (Array.isArray(raw) ? raw : []).map(normalizeNotification);
  }

  function normalizeCalendarEvent(raw) {
    const e = raw && typeof raw === 'object' ? raw : {};
    return {
      id: safe(e.id), type: safe(e.type), date: safe(e.date),
      title: safe(e.title), color: safe(e.color), status: safe(e.status)
    };
  }
  async function loadCalendar(request, signal, month) {
    if (typeof request !== 'function') throw new Error('An authenticated request service is required.');
    const q = month ? '?month=' + encodeURIComponent(month) : '';
    const raw = await request('/api/me/calendar' + q, { skipCache: true, timeoutMs: 15000, signal });
    const obj = raw && typeof raw === 'object' ? raw : {};
    return {
      month: safe(obj.month),
      events: (Array.isArray(obj.events) ? obj.events : []).map(normalizeCalendarEvent)
    };
  }

  function normalizeDigest(raw) {
    const d = raw && typeof raw === 'object' ? raw : {};
    return {
      period: safe(d.period), since: safe(d.since),
      totalActions: Number(d.totalActions) || 0,
      byResource: Array.isArray(d.byResource) ? d.byResource.map(r => ({
        resource: safe(r && r.resource), actions: Number(r && r.actions) || 0,
        lastAction: safe(r && r.lastAction), lastDate: safe(r && r.lastDate)
      })) : [],
      recentCerts: Array.isArray(d.recentCerts) ? d.recentCerts.map(c => ({
        name: safe(c && c.name), date: safe(c && c.date)
      })) : [],
      recentPublications: Array.isArray(d.recentPublications) ? d.recentPublications.map(p => ({
        title: safe(p && p.title), date: safe(p && p.date)
      })) : []
    };
  }
  async function loadDigest(request, signal, period) {
    if (typeof request !== 'function') throw new Error('An authenticated request service is required.');
    const q = period ? '?period=' + encodeURIComponent(period) : '';
    const raw = await request('/api/me/digest' + q, { skipCache: true, timeoutMs: 15000, signal });
    return normalizeDigest(raw);
  }


  // Phase 26C: explicit self-service allowlist, independent of institutional fields.
  const PROFILE_EDIT_KEYS=Object.freeze([
    'mobile_phone','public_bio','orcid_id','scholar_url','researchgate_url',
    'pubmed_query','is_public','indexed_publications_count','h_index'
  ]);
  function profileDraft(p) {
    return {
      mobile_phone:p?.mobilePhone ?? '', public_bio:p?.publicBio ?? '',
      orcid_id:p?.orcidId ?? '', scholar_url:p?.scholarUrl ?? '',
      researchgate_url:p?.researchgateUrl ?? '', pubmed_query:p?.pubmedQuery ?? '',
      is_public:!!p?.isPublic,
      indexed_publications_count:p?.indexedPublicationsCount ?? null,
      h_index:p?.hIndex ?? null
    };
  }
  function normalizeProfileDraft(form) {
    const f=form&&typeof form==='object'?form:{};
    const result={};
    for(const key of PROFILE_EDIT_KEYS){
      const v=f[key];
      if(key==='is_public')result[key]=v===true;
      else if(key==='indexed_publications_count'||key==='h_index'){
        result[key]=v===''||v==null?null:(typeof v==='number'?v:Number(v));
      }else result[key]=typeof v==='string'?v.trim():'';
    }
    return result;
  }
  function profileChanged(form,baseline) {
    if(!form||!baseline)return false;
    const a=normalizeProfileDraft(form),b=normalizeProfileDraft(baseline);
    return PROFILE_EDIT_KEYS.some(k=>!Object.is(a[k],b[k]));
  }
  function validateProfileDraft(form) {
    const fields=normalizeProfileDraft(form),errors={};
    const limits={mobile_phone:40,public_bio:2000,orcid_id:40,scholar_url:500,researchgate_url:500,pubmed_query:500};
    for(const [key,max] of Object.entries(limits)){
      if((form?.[key]??'').toString().length>max)errors[key]='Supera el límite de '+max+' caracteres.';
    }
    if(fields.orcid_id && !/^\d{4}-\d{4}-\d{4}-[\dX]{4}$/i.test(fields.orcid_id))
      errors.orcid_id='Introduce un identificador ORCID con formato 0000-0000-0000-0000.';
    for(const key of ['scholar_url','researchgate_url']){
      if(!fields[key])continue;
      try {
        const u=new URL(fields[key]);
        if(!['http:','https:'].includes(u.protocol)||u.username||u.password)throw Error('invalid');
      }catch(_){errors[key]='Utiliza una URL http o https válida, sin credenciales.';}
    }
    for(const [key,max] of [['indexed_publications_count',9999],['h_index',999]]){
      const n=fields[key];
      if(n!==null&&(!Number.isSafeInteger(n)||n<0||n>max))errors[key]='Introduce un número entero entre 0 y '+max+'.';
    }
    return {valid:Object.keys(errors).length===0,errors,fields};
  }

  return Object.freeze({
    normalizeContext, loadContext, normalizeActivity, loadActivity, buildScientificParticipation, participationStatus, formatDutyShift,
    buildReport, submitDiscrepancy, normalizeReport, loadMyReports,
    normalizeReviewItem, loadReviewQueue, buildResolve, resolveReport, reviewOutcome,
    loadLineOptions, loadPublicationOptions,
    normalizeProfile, loadProfile, updateProfile, updateNotificationPrefs, uploadPhoto, loadMyCertificates,
    PROFILE_EDIT_KEYS, profileDraft, normalizeProfileDraft, profileChanged, validateProfileDraft,
    normalizeColleague, loadColleagues, normalizeDashboard, loadDashboard,
    normalizeActivityEntry, loadMyActivity,
    normalizeNotification, loadNotifications, normalizeCalendarEvent, loadCalendar, normalizeDigest, loadDigest
  });
});
