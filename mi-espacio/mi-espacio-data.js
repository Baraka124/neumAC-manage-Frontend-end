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

  return Object.freeze({ normalizeContext, loadContext });
});
