// api.js - API Service
import { CONFIG } from './config.js'
import { Utils } from './utils.js'

export class ApiService {
  constructor() { this.cache = new Map() }

  get token() { return localStorage.getItem(CONFIG.TOKEN_KEY) }

  headers() {
    const h = { 'Content-Type': 'application/json', 'Accept': 'application/json' }
    const t = this.token
    if (t?.trim()) h['Authorization'] = `Bearer ${t}`
    return h
  }

  getCached(key) {
    const entry = this.cache.get(key)
    if (!entry) return null
    if (Date.now() - entry.timestamp > CONFIG.CACHE_TTL) { this.cache.delete(key); return null }
    return entry.data
  }

  setCached(key, data) { this.cache.set(key, { data, timestamp: Date.now() }) }

  invalidate(path) {
    for (const key of this.cache.keys()) {
      if (key.includes(path)) this.cache.delete(key)
    }
  }

  clearCache() { this.cache.clear() }

  async request(endpoint, options = {}) {
    const method = options.method || 'GET'
    const isGet = method === 'GET'
    const cacheKey = `${method}:${endpoint}`

    if (isGet && !options.skipCache) {
      const cached = this.getCached(cacheKey)
      if (cached) return cached
    }

    const config = { method, headers: this.headers(), mode: 'cors', cache: 'no-cache', credentials: 'include' }
    if (options.body) config.body = JSON.stringify(options.body)

    try {
      const res = await fetch(`${CONFIG.API_BASE_URL}${endpoint}`, config)
      if (res.status === 204) return null
      if (!res.ok) {
        if (res.status === 401) {
          localStorage.removeItem(CONFIG.TOKEN_KEY)
          localStorage.removeItem(CONFIG.USER_KEY)
          window.dispatchEvent(new CustomEvent('neumax:session-expired'))
          throw new Error('Session expired. Please login again.')
        }
        const err = await res.text().catch(() => `HTTP ${res.status}`)
        throw new Error(err)
      }
      const ct = res.headers.get('content-type')
      const result = ct?.includes('application/json') ? await res.json() : await res.text()
      if (isGet && !options.skipCache) this.setCached(cacheKey, result)
      return result
    } catch (e) {
      if (e.message.includes('fetch') || e.message.includes('NetworkError'))
        throw new Error('Cannot connect to server. Check your network connection.')
      throw e
    }
  }

  async getList(path) {
    try { return Utils.ensureArray(await this.request(path)) } catch { return [] }
  }

  async login(email, password) {
    const data = await this.request('/api/auth/login', { method: 'POST', body: { email, password } })
    if (data.token) {
      localStorage.setItem(CONFIG.TOKEN_KEY, data.token)
      localStorage.setItem(CONFIG.USER_KEY, JSON.stringify(data.user))
      this.clearCache()
    }
    return data
  }

  async logout() {
    try { await this.request('/api/auth/logout', { method: 'POST' }) } finally {
      localStorage.removeItem(CONFIG.TOKEN_KEY)
      localStorage.removeItem(CONFIG.USER_KEY)
      this.clearCache()
    }
  }

  // ============ Medical Staff ============
  async getMedicalStaff() {
    const data = await this.getList('/api/medical-staff')
    return data.filter(staff => staff.employment_status !== 'inactive')
  }

  async createMedicalStaff(d) { this.invalidate('/api/medical-staff'); return this.request('/api/medical-staff', { method: 'POST', body: d }) }
  async updateMedicalStaff(id, d) { this.invalidate('/api/medical-staff'); return this.request(`/api/medical-staff/${id}`, { method: 'PUT', body: d }) }
  async deleteMedicalStaff(id) { this.invalidate('/api/medical-staff'); return this.request(`/api/medical-staff/${id}`, { method: 'DELETE' }) }

  // ============ Staff Types ============
  async getStaffTypes(includeInactive = false) {
    const url = '/api/staff-types' + (includeInactive ? '?include_inactive=true' : '')
    return this.getList(url)
  }
  async createStaffType(data) { this.invalidate('/api/staff-types'); return this.request('/api/staff-types', { method: 'POST', body: data }) }
  async updateStaffType(id, data) { this.invalidate('/api/staff-types'); return this.request(`/api/staff-types/${id}`, { method: 'PUT', body: data }) }
  async deleteStaffType(id) { this.invalidate('/api/staff-types'); return this.request(`/api/staff-types/${id}`, { method: 'DELETE' }) }

  // ============ Academic Degrees ============
  async getAcademicDegrees() { return this.getList('/api/academic-degrees') }

  // ============ Certificates ============
  async getStaffCertificates(staffId) { return this.getList(`/api/medical-staff/${staffId}/certificates`) }
  async createStaffCertificate(staffId, d) { return this.request(`/api/medical-staff/${staffId}/certificates`, { method: 'POST', body: d }) }
  async deleteStaffCertificate(staffId, certId) { return this.request(`/api/medical-staff/${staffId}/certificates/${certId}`, { method: 'DELETE' }) }

  // ============ Departments ============
  async getDepartments() { return this.getList('/api/departments') }
  async getAllDepartments() { return this.getList('/api/departments?include_inactive=true') }
  async getDepartmentImpact(id) { return this.request(`/api/departments/${id}/impact`) }
  async createDepartment(d) { this.invalidate('/api/departments'); return this.request('/api/departments', { method: 'POST', body: d }) }
  async updateDepartment(id, d) { this.invalidate('/api/departments'); return this.request(`/api/departments/${id}`, { method: 'PUT', body: d }) }
  async deleteDepartment(id, reassignments) { this.invalidate('/api/departments'); return this.request(`/api/departments/${id}`, { method: 'DELETE', body: reassignments ? { reassignments } : {} }) }

  // ============ Hospitals ============
  async getHospitals() {
    try { const r = await this.request('/api/hospitals'); return (r?.success && Array.isArray(r.data)) ? r.data : Utils.ensureArray(r) } catch { return [] }
  }
  async createHospital(d) { this.invalidate('/api/hospitals'); return this.request('/api/hospitals', { method: 'POST', body: d }) }

  // ============ Training Units ============
  async getTrainingUnits() { return this.getList('/api/training-units') }
  async createTrainingUnit(d) { this.invalidate('/api/training-units'); return this.request('/api/training-units', { method: 'POST', body: d }) }
  async updateTrainingUnit(id, d) { this.invalidate('/api/training-units'); return this.request(`/api/training-units/${id}`, { method: 'PUT', body: d }) }
  async deleteTrainingUnit(id) { this.invalidate('/api/training-units'); return this.request(`/api/training-units/${id}`, { method: 'DELETE' }) }

  // ============ Rotations ============
  async getRotations() {
    try { const r = await this.request('/api/rotations'); return Utils.ensureArray(r?.data ?? r) } catch { return [] }
  }
  async createRotation(d) { this.invalidate('/api/rotations'); return this.request('/api/rotations', { method: 'POST', body: d }) }
  async updateRotation(id, d) { this.invalidate('/api/rotations'); return this.request(`/api/rotations/${id}`, { method: 'PUT', body: d }) }
  async deleteRotation(id) { this.invalidate('/api/rotations'); return this.request(`/api/rotations/${id}`, { method: 'DELETE' }) }
  async checkRotationAvailability(params) {
    const q = new URLSearchParams(params).toString()
    return this.request(`/api/rotations/availability?${q}`)
  }

  // ============ On-Call ============
  async getOnCallSchedule() { return this.getList('/api/oncall') }
  async getOnCallToday() { return this.getList('/api/oncall/today') }
  async createOnCall(d) { this.invalidate('/api/oncall'); return this.request('/api/oncall', { method: 'POST', body: d }) }
  async updateOnCall(id, d) { this.invalidate('/api/oncall'); return this.request(`/api/oncall/${id}`, { method: 'PUT', body: d }) }
  async deleteOnCall(id) { this.invalidate('/api/oncall'); return this.request(`/api/oncall/${id}`, { method: 'DELETE' }) }

  // ============ Absences ============
  async getAbsences() {
    try {
      const r = await this.request('/api/absence-records')
      return (r?.success && Array.isArray(r.data)) ? r.data : Utils.ensureArray(r)
    } catch { return [] }
  }
  async createAbsence(d) { this.invalidate('/api/absence-records'); return this.request('/api/absence-records', { method: 'POST', body: d }) }
  async updateAbsence(id, d) { this.invalidate('/api/absence-records'); return this.request(`/api/absence-records/${id}`, { method: 'PUT', body: d }) }
  async deleteAbsence(id) { this.invalidate('/api/absence-records'); return this.request(`/api/absence-records/${id}`, { method: 'DELETE' }) }
  async purgeAbsence(id) { this.invalidate('/api/absence-records'); return this.request(`/api/absence-records/${id}/purge`, { method: 'DELETE' }) }
  async returnToDuty(id, d) { this.invalidate('/api/absence-records'); return this.request(`/api/absence-records/${id}/return`, { method: 'PUT', body: d }) }

  // ============ Research ============
  async getResearchLines() {
    try { const r = await this.request('/api/research-lines'); return r?.data || Utils.ensureArray(r) } catch { return [] }
  }
  async createResearchLine(d) { this.invalidate('/api/research-lines'); return this.request('/api/research-lines', { method: 'POST', body: d }) }
  async updateResearchLine(id, d) { this.invalidate('/api/research-lines'); return this.request(`/api/research-lines/${id}`, { method: 'PUT', body: d }) }
  async deleteResearchLine(id) { this.invalidate('/api/research-lines'); return this.request(`/api/research-lines/${id}`, { method: 'DELETE' }) }
  async assignCoordinator(lineId, coordinatorId) {
    this.invalidate('/api/research-lines')
    return this.request(`/api/research-lines/${lineId}/coordinator`, { method: 'PUT', body: { coordinator_id: coordinatorId } })
  }

  // ============ Clinical Trials ============
  async getAllClinicalTrials() {
    try { const r = await this.request('/api/clinical-trials'); return r?.data || Utils.ensureArray(r) } catch { return [] }
  }
  async createClinicalTrial(d) { this.invalidate('/api/clinical-trials'); return this.request('/api/clinical-trials', { method: 'POST', body: d }) }
  async updateClinicalTrial(id, d) { this.invalidate('/api/clinical-trials'); return this.request(`/api/clinical-trials/${id}`, { method: 'PUT', body: d }) }
  async deleteClinicalTrial(id) { this.invalidate('/api/clinical-trials'); return this.request(`/api/clinical-trials/${id}`, { method: 'DELETE' }) }

  // ============ Innovation Projects ============
  async getAllInnovationProjects() {
    try { const r = await this.request('/api/innovation-projects'); return r?.data || Utils.ensureArray(r) } catch { return [] }
  }
  async createInnovationProject(d) { this.invalidate('/api/innovation-projects'); return this.request('/api/innovation-projects', { method: 'POST', body: d }) }
  async updateInnovationProject(id, d) { this.invalidate('/api/innovation-projects'); return this.request(`/api/innovation-projects/${id}`, { method: 'PUT', body: d }) }
  async deleteInnovationProject(id) { this.invalidate('/api/innovation-projects'); return this.request(`/api/innovation-projects/${id}`, { method: 'DELETE' }) }

  // ============ Announcements ============
  async getAnnouncements() { return this.getList('/api/announcements') }
  async createAnnouncement(d) { this.invalidate('/api/announcements'); return this.request('/api/announcements', { method: 'POST', body: d }) }
  async updateAnnouncement(id, d) { this.invalidate('/api/announcements'); return this.request(`/api/announcements/${id}`, { method: 'PUT', body: d }) }
  async deleteAnnouncement(id) { this.invalidate('/api/announcements'); return this.request(`/api/announcements/${id}`, { method: 'DELETE' }) }

  // ============ News ============
  async getNews() { return this.getList('/api/news') }
  async createNews(d) { this.invalidate('/api/news'); return this.request('/api/news', { method: 'POST', body: d }) }
  async updateNews(id, d) { this.invalidate('/api/news'); return this.request(`/api/news/${id}`, { method: 'PUT', body: d }) }
  async deleteNews(id) { this.invalidate('/api/news'); return this.request(`/api/news/${id}`, { method: 'DELETE' }) }

  // ============ Live Status ============
  async getClinicalStatus() {
    try { return await this.request('/api/live-status/current') } catch { return { success: false, data: null } }
  }
  async createClinicalStatus(d) { this.invalidate('/api/live-status'); return this.request('/api/live-status', { method: 'POST', body: d }) }
  async getClinicalStatusHistory(limit = 10) { return this.getList(`/api/live-status/history?limit=${limit}`) }

  // ============ System ============
  async getSystemStats() { try { return await this.request('/api/system-stats') || {} } catch { return {} } }
  async getAnalyticsSummary() {
    try { const r = await this.request('/api/analytics/summary'); return r?.data || null } catch { return null }
  }
  async getResearchDashboard() {
    try { const r = await this.request('/api/analytics/research-dashboard'); return r?.data || r || null } catch { return null }
  }
  async getClinicalTrialsTimeline(years = 3) {
    try { const r = await this.request(`/api/analytics/clinical-trials-timeline?years=${years}`); return r?.data || null } catch { return null }
  }
  async getSupervisedResidents(attendingId) {
    try {
      const rotations = await this.getRotations()
      const medicalStaff = await this.getMedicalStaff()
      const trainingUnits = await this.getTrainingUnits()

      const active = rotations
        .filter(r => r.supervising_attending_id === attendingId && r.rotation_status === 'active')
        .map(r => {
          const resident = medicalStaff.find(s => s.id === r.resident_id)
          const unit = trainingUnits.find(u => u.id === r.training_unit_id)
          return {
            id: r.id, residentId: r.resident_id,
            residentName: resident?.full_name || 'Unknown',
            residentYear: resident?.training_year || null,
            unitId: r.training_unit_id, unitName: unit?.unit_name || 'Unknown',
            startDate: r.start_date, endDate: r.end_date,
            daysLeft: Utils.daysUntil(r.end_date)
          }
        })
      const past = rotations.filter(r => r.supervising_attending_id === attendingId && r.rotation_status === 'completed').length
      const totalDaysSupervised = rotations
        .filter(r => r.supervising_attending_id === attendingId && ['completed', 'active'].includes(r.rotation_status))
        .reduce((sum, r) => {
          const s = new Date(r.start_date), e = new Date(r.end_date)
          return sum + Math.max(0, Math.round((e - s) / 86400000))
        }, 0)
      return { current: active, currentCount: active.length, pastCount: past, totalDaysSupervised }
    } catch (error) {
      console.error('Failed to load supervision data:', error)
      return { current: [], currentCount: 0, pastCount: 0, avgEvaluation: 0 }
    }
  }
}

export const API = new ApiService()
