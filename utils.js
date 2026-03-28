// utils.js - All utility functions
import { ACADEMIC_DEGREES_FALLBACK } from './config.js' 

export const Utils = {
  // Date utilities
  localDateStr(d) {
    const dt = d instanceof Date ? d : new Date(d)
    if (isNaN(dt.getTime())) return ''
    const y = dt.getFullYear()
    const m = String(dt.getMonth() + 1).padStart(2, '0')
    const day = String(dt.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  },

  normalizeDate(d) {
    if (!d) return ''
    if (d instanceof Date) return isNaN(d.getTime()) ? '' : this.localDateStr(d)
    const s = String(d).trim()
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
    if (s.includes('T')) return s.split('T')[0]
    if (s.includes('/')) {
      const [dd, mm, yyyy] = s.split('/')
      if (yyyy?.length === 4) return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`
    }
    try { const dt = new Date(s); if (!isNaN(dt.getTime())) return dt.toISOString().split('T')[0] } catch { }
    return s
  },

  formatDate(d) {
    if (!d) return 'N/A'
    try {
      const date = new Date(this.normalizeDate(d) + 'T00:00:00')
      if (isNaN(date.getTime())) return d
      return date.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })
    } catch { return d }
  },

  formatDateShort(d) {
    if (!d) return ''
    try {
      const date = typeof d === 'string' ? new Date(this.normalizeDate(d) + 'T00:00:00') : d
      return date.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short' })
    } catch { return '' }
  },

  formatRelativeDate(d) {
    if (!d) return ''
    try {
      const date = new Date(this.normalizeDate(d) + 'T00:00:00')
      const today = new Date(); today.setHours(0, 0, 0, 0)
      const diff = Math.ceil((date - today) / 86400000)
      if (diff === 0) return 'Today'
      if (diff === 1) return 'Tomorrow'
      if (diff === -1) return 'Yesterday'
      if (diff > 1 && diff <= 7) return `In ${diff} days`
      if (diff > 7 && diff <= 30) return `In ${Math.ceil(diff / 7)}w`
      if (diff < -1 && diff >= -7) return `${Math.abs(diff)}d ago`
      return this.formatDate(d)
    } catch { return this.formatDate(d) }
  },

  formatTime(d) {
    if (!d) return ''
    try { return new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
    catch { return d }
  },

  formatRelativeTime(d) {
    if (!d) return 'Just now'
    try {
      const diff = Math.floor((new Date() - new Date(d)) / 60000)
      if (diff < 1) return 'Just now'
      if (diff < 60) return `${diff}m ago`
      if (diff < 1440) return `${Math.floor(diff / 60)}h ago`
      return `${Math.floor(diff / 1440)}d ago`
    } catch { return 'Just now' }
  },

  formatNewsDate(d) {
    if (!d) return ''
    try {
      const diff = Math.floor((new Date() - new Date(d)) / 60000)
      if (diff < 1) return 'Just now'
      if (diff < 60) return `${diff}m ago`
      if (diff < 1440) return `${Math.floor(diff / 60)}h ago`
      if (diff < 10080) return `${Math.floor(diff / 1440)}d ago`
      return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    } catch { return '' }
  },

  dateDiff(start, end) {
    try {
      const s = new Date(this.normalizeDate(start) + 'T00:00:00')
      const e = new Date(this.normalizeDate(end) + 'T23:59:59')
      if (isNaN(s.getTime()) || isNaN(e.getTime())) return 0
      return Math.ceil(Math.abs(e - s) / 86400000)
    } catch { return 0 }
  },

  daysUntil(d) {
    if (!d) return 0
    const date = new Date(this.normalizeDate(d) + 'T00:00:00')
    const today = new Date(); today.setHours(0, 0, 0, 0)
    return Math.max(0, Math.ceil((date - today) / 86400000))
  },

  formatClinicalDuration(startDate, endDate) {
    if (!startDate || !endDate) return 'N/A'
    try {
      const s = new Date(this.normalizeDate(startDate) + 'T00:00:00')
      const e = new Date(this.normalizeDate(endDate) + 'T00:00:00')
      const days = Math.round((e - s) / 86400000)
      if (days < 0) return 'N/A'
      if (days < 7) return `${days}d`
      const weeks = Math.floor(days / 7)
      const rem = days % 7
      if (weeks < 5) return rem > 0 ? `${weeks}w ${rem}d` : `${weeks}w`
      const months = Math.round(days / 30.44)
      return `${months}mo`
    } catch { return 'N/A' }
  },

  // Resident utilities
  effectiveResidentYear(staff) {
    if (staff.residency_year_override) return staff.residency_year_override
    if (staff.residency_year_calc) return staff.residency_year_calc
    const t = staff.training_year
    if (!t) return null
    const map = { 'PGY-1':'R1','PGY-2':'R2','PGY-3':'R3','PGY-4':'R4','PGY-5':'R4+' }
    return map[t] || t
  },

  formatTrainingYear(year) {
    if (!year && year !== 0) return null
    const yearStr = String(year).trim()
    if (/^\d+$/.test(yearStr)) return `PGY-${yearStr}`
    if (yearStr.toUpperCase().startsWith('PGY')) {
      const parts = yearStr.split(/[- ]/)
      if (parts.length > 1) return `PGY-${parts[1]}`
      return yearStr.toUpperCase()
    }
    return yearStr
  },

  getResidentCategoryInfo(category, staff = {}) {
    const categories = {
      'department_internal': {
        icon: 'fa-user-md', text: 'Internal Resident', shortText: 'Internal',
        color: '#4d9aff', bgColor: 'rgba(77, 154, 255, 0.1)'
      },
      'rotating_other_dept': {
        icon: 'fa-sync-alt',
        text: staff.home_department ? `Rotating from ${staff.home_department}` : 'Rotating Resident',
        shortText: 'Rotating', color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.1)'
      },
      'external_resident': {
        icon: 'fa-globe',
        text: 'External',
        shortText: 'External', color: '#8b5cf6', bgColor: 'rgba(139, 92, 246, 0.1)'
      }
    }
    return categories[category] || { icon: 'fa-user', text: 'Not categorized', shortText: 'Unknown', color: '#94a3b8', bgColor: 'rgba(148, 163, 184, 0.1)' }
  },

  // Phone and license formatting
  formatPhone(phone) {
    if (!phone) return null
    const cleaned = String(phone).replace(/\D/g, '')
    if (cleaned.length === 9) return `+34 ${cleaned.slice(0,3)} ${cleaned.slice(3,6)} ${cleaned.slice(6)}`
    if (cleaned.length === 12) return `+${cleaned.slice(0,2)} ${cleaned.slice(2,5)} ${cleaned.slice(5,8)} ${cleaned.slice(8)}`
    return phone
  },

  formatLicense(license) {
    if (!license) return null
    return license.toUpperCase()
  },

  formatSpecialization(spec) {
    if (!spec) return null
    const abbreviations = ['ICU', 'ER', 'OR', 'PICU', 'NICU', 'PFT', 'CPAP', 'BiPAP', 'COPD', 'OSA']
    return spec.split(' ').map(word => {
      const upperWord = word.toUpperCase()
      if (abbreviations.includes(upperWord)) return upperWord
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    }).join(' ')
  },

  // Role utilities
  getRoleInfo(role) {
    const roles = {
      'chief_of_department': { icon: 'fa-crown', color: 'gold', bgColor: 'rgba(255, 215, 0, 0.1)', label: 'Chief of Department' },
      'research_coordinator': { icon: 'fa-flask', color: '#8b5cf6', bgColor: 'rgba(139, 92, 246, 0.1)', label: 'Research Coordinator' },
      'resident_manager': { icon: 'fa-user-graduate', color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.1)', label: 'Resident Manager' },
      'oncall_manager': { icon: 'fa-phone-alt', color: '#3b82f6', bgColor: 'rgba(59, 130, 246, 0.1)', label: 'On-Call Manager' }
    }
    return roles[role] || null
  },

  getStaffRoles(staff) {
    const roles = []
    if (staff?.is_chief_of_department) roles.push({ key: 'chief_of_department', ...this.getRoleInfo('chief_of_department') })
    if (staff?.is_research_coordinator) roles.push({ key: 'research_coordinator', ...this.getRoleInfo('research_coordinator') })
    if (staff?.is_resident_manager) roles.push({ key: 'resident_manager', ...this.getRoleInfo('resident_manager') })
    if (staff?.is_oncall_manager) roles.push({ key: 'oncall_manager', ...this.getRoleInfo('oncall_manager') })
    return roles
  },

  // General utilities
  ensureArray(data) {
    if (Array.isArray(data)) return data
    if (data?.data && Array.isArray(data.data)) return data.data
    if (data && typeof data === 'object') return Object.values(data)
    return []
  },

  truncateText(text, max = 100) {
    if (!text) return ''
    return text.length <= max ? text : text.substring(0, max) + '...'
  },

  generateId(prefix) {
    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 9)}`
  },

  formatPercentage(value, total) {
    if (!total) return '0%'
    return `${Math.round((value / total) * 100)}%`
  },

  getInitials(name) {
    if (!name || typeof name !== 'string') return '??'
    return name.split(' ').map(w => w[0]).join('').toUpperCase().substring(0, 2)
  },

  getPhaseColor(phase) {
    return { 'Phase I': '#4d9aff', 'Phase II': '#00e5a0', 'Phase III': '#ffbe3d', 'Phase IV': '#ff5566' }[phase] || '#7a90b0'
  },

  getStageConfig(stage) {
    const { PROJECT_STAGES } = require('./config.js')
    return PROJECT_STAGES.find(s => s.key === stage) || { key: stage, label: stage, icon: 'fa-circle', color: '#7a90b0', bg: 'rgba(122,144,176,.1)', step: 0 }
  },

  getStageColor(stage) {
    return this.getStageConfig(stage).color
  },

  getPartnerTypeColor(type) {
    const map = {
      'Empresa': '#4d9aff', 'Hospital': '#00e5a0', 'Tecnología': '#ffbe3d', 'Universidad': '#a78bfa',
      'Industria': '#f97316', 'Startup': '#34d399', 'Fundación': '#fb7185', 'Institución': '#60a5fa',
      'CRO': '#f59e0b', 'Other': '#7a90b0'
    }
    return map[type] || ('#' + [...type].reduce((h, c) => (h * 31 + c.charCodeAt(0)) & 0xffffff, 0x4d9aff).toString(16).padStart(6, '0'))
  }
}
