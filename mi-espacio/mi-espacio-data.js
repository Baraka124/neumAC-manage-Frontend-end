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
      id: id(a && a.id), type: safe(a && a.type), start: safe(a && a.start), end: safe(a && a.end), status: safe(a && a.status)
    }));
    const lines = arr(research.lines).map(l => ({
      id: id(l && l.id), number: num(l && l.line_number), name: safe(l && l.name), role: safe(l && l.role)
    }));
    const studies = arr(research.studies).map(s => ({
      id: id(s && s.id), title: safe(s && s.title), code: safe(s && s.protocol_id), status: safe(s && s.status), role: safe(s && s.role)
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

  // ── Subject options for a claim: the few lines and the publications a person
  // can point at, so a report carries a real subject_id and the server can
  // auto-link on accept. Both tolerate either {data:[…]} or a bare array. ──
  const rows = raw => raw && Array.isArray(raw.data) ? raw.data : (Array.isArray(raw) ? raw : []);

  async function loadLineOptions(request, signal) {
    if (typeof request !== 'function') throw new Error('An authenticated request service is required.');
    const raw = await request('/api/research-lines', { skipCache: true, timeoutMs: 15000, signal });
    return rows(raw).map(l => ({
      id: id(l && l.id),
      label: ((l && (typeof l.line_number === 'number')) ? 'L' + l.line_number + ' · ' : '') + safe(l && (l.short_name || l.research_line_name || l.name))
    })).filter(o => o.id && o.label);
  }

  async function loadPublicationOptions(request, signal) {
    if (typeof request !== 'function') throw new Error('An authenticated request service is required.');
    const raw = await request('/api/news?type=publication', { skipCache: true, timeoutMs: 15000, signal });
    return rows(raw).map(p => ({ id: id(p && p.id), label: safe(p && p.title) })).filter(o => o.id && o.label);
  }

  return Object.freeze({
    normalizeContext, loadContext, normalizeActivity, loadActivity, formatDutyShift,
    buildReport, submitDiscrepancy, normalizeReport, loadMyReports,
    normalizeReviewItem, loadReviewQueue, buildResolve, resolveReport,
    loadLineOptions, loadPublicationOptions
  });
});
