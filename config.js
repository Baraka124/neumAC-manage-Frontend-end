// config.js - All static configuration
export const CONFIG = {
  API_BASE_URL: window.location.hostname.includes('localhost')
    ? 'http://localhost:3000' 
    : 'https://neumac-manage-back-end-production.up.railway.app',
  TOKEN_KEY: 'neumocare_token',
  USER_KEY: 'neumocare_user',
  CACHE_TTL: 300000
}

export const ROLES = {
  ADMIN: 'system_admin',
  HEAD: 'department_head',
  MANAGER: 'resident_manager',
  ATTENDING: 'attending_physician',
  RESIDENT: 'medical_resident'
}

export const PERMISSION_MATRIX = {
  system_admin: {
    medical_staff: ['create', 'read', 'update', 'delete'], 
    oncall_schedule: ['create', 'read', 'update', 'delete'],
    resident_rotations: ['create', 'read', 'update', 'delete'], 
    training_units: ['create', 'read', 'update', 'delete'],
    staff_absence: ['create', 'read', 'update', 'delete'],
    communications: ['create', 'read', 'update', 'delete'], 
    research_lines: ['create', 'read', 'update', 'delete'],
    clinical_trials: ['create', 'read', 'update', 'delete'], 
    innovation_projects: ['create', 'read', 'update', 'delete'],
    analytics: ['read', 'export'], 
    system: ['manage_departments', 'manage_updates'],
    system_settings: ['create', 'read', 'update', 'delete'],
    news_posts: ['create', 'read', 'update', 'delete']
  },
  department_head: {
    medical_staff: ['read', 'update'], 
    oncall_schedule: ['create', 'read', 'update'],
    resident_rotations: ['create', 'read', 'update'], 
    training_units: ['read', 'update'],
    staff_absence: ['create', 'read', 'update'],
    communications: ['create', 'read'], 
    research_lines: ['create', 'read', 'update', 'delete'],
    clinical_trials: ['read', 'create', 'update', 'delete'], 
    innovation_projects: ['read', 'create', 'update', 'delete'],
    analytics: ['read'], 
    system: ['manage_updates'],
    system_settings: ['read'],
    news_posts: ['create', 'read', 'update', 'delete']
  },
  attending_physician: {
    medical_staff: ['read'], 
    oncall_schedule: ['read'], 
    resident_rotations: ['read'],
    training_units: ['read'], 
    staff_absence: ['read'],
    communications: ['read'], 
    research_lines: ['read'], 
    clinical_trials: ['read'],
    innovation_projects: ['read'], 
    analytics: ['read'],
    system_settings: [],
    news_posts: ['read']
  },
  resident_manager: {
    medical_staff: ['read', 'create', 'update'],
    oncall_schedule: ['create', 'read', 'update', 'delete'],
    resident_rotations: ['create', 'read', 'update', 'delete'],
    training_units: ['read', 'update'],
    staff_absence: ['create', 'read', 'update'],
    communications: ['create', 'read'],
    research_lines: ['create', 'read', 'update', 'delete'],
    clinical_trials: ['create', 'read', 'update', 'delete'],
    innovation_projects: ['create', 'read', 'update', 'delete'],
    analytics: ['read'],
    system_settings: [],
    news_posts: ['create', 'read', 'update', 'delete']
  },
  medical_resident: {
    medical_staff: ['read'], 
    oncall_schedule: ['read'], 
    resident_rotations: ['read'],
    training_units: ['read'], 
    staff_absence: ['read'],
    communications: ['read'], 
    research_lines: ['read'], 
    clinical_trials: ['read'],
    innovation_projects: ['read'], 
    analytics: [],
    system_settings: [],
    news_posts: ['read']
  }
}

export const ABSENCE_REASON_LABELS = {
  vacation: 'Vacation', 
  sick_leave: 'Sick Leave', 
  conference: 'Conference',
  training: 'Training', 
  personal: 'Personal', 
  other: 'Other'
}

export const ROTATION_STATUS_LABELS = {
  scheduled: 'Scheduled', 
  active: 'Active', 
  completed: 'Completed', 
  cancelled: 'Cancelled'
}

export const USER_ROLE_LABELS = {
  system_admin: 'System Administrator', 
  department_head: 'Department Head',
  attending_physician: 'Attending Physician', 
  medical_resident: 'Medical Resident'
}

export const VIEW_TITLES = {
  dashboard: 'Dashboard Overview', 
  medical_staff: 'Medical Staff Management',
  oncall_schedule: 'On-call Schedule', 
  resident_rotations: 'Resident Rotations',
  training_units: 'Clinical Units', 
  staff_absence: 'Staff Absence Management',
  department_management: 'Department Management',
  research_hub: 'Research Hub',
  news: 'News & Posts'
}

export const PROJECT_STAGES = [
  { key: 'Idea',             label: 'Idea',            icon: 'fa-lightbulb',    color: '#94a3b8', bg: 'rgba(148,163,184,.12)', step: 1 },
  { key: 'Prototipo',        label: 'Prototipo',       icon: 'fa-cube',         color: '#60a5fa', bg: 'rgba(96,165,250,.12)',  step: 2 },
  { key: 'Piloto',           label: 'Piloto',          icon: 'fa-play-circle',  color: '#34d399', bg: 'rgba(52,211,153,.12)',  step: 3 },
  { key: 'Validación',       label: 'Validación',      icon: 'fa-check-double', color: '#fbbf24', bg: 'rgba(251,191,36,.12)',  step: 4 },
  { key: 'Escalamiento',     label: 'Escalamiento',    icon: 'fa-chart-line',   color: '#f97316', bg: 'rgba(249,115,22,.12)',  step: 5 },
  { key: 'Comercialización', label: 'Comercialización',icon: 'fa-rocket',       color: '#10b981', bg: 'rgba(16,185,129,.12)',  step: 6 }
]

export const LINE_ACCENTS = [
  { bg: 'linear-gradient(135deg,#3b82f6,#6366f1)', light: '#eff6ff', color: '#1e40af' },
  { bg: 'linear-gradient(135deg,#10b981,#0891b2)', light: '#d1fae5', color: '#065f46' },
  { bg: 'linear-gradient(135deg,#22d3ee,#0ea5e9)', light: '#e0f7fa', color: '#0e7490' },
  { bg: 'linear-gradient(135deg,#f59e0b,#f97316)', light: '#fef3c7', color: '#92400e' },
  { bg: 'linear-gradient(135deg,#a78bfa,#8b5cf6)', light: '#ede9fe', color: '#5b21b6' },
  { bg: 'linear-gradient(135deg,#fb7185,#ec4899)', light: '#fce7f3', color: '#9d174d' }
]

export const STAFF_TYPE_LABELS_FALLBACK = {
  medical_resident: 'Resident', attending_physician: 'Attending',
  fellow: 'Fellow', nurse_practitioner: 'NP', administrator: 'Admin',
}

export const STAFF_TYPE_CLASSES_FALLBACK = {
  medical_resident: 'badge-primary', attending_physician: 'badge-success',
  fellow: 'badge-info', nurse_practitioner: 'badge-warning', administrator: 'badge-secondary',
}

export const ACADEMIC_DEGREES_FALLBACK = [
  { id: 'LMed',     name: 'Licenciado en Medicina',                abbreviation: 'LMed'     },
  { id: 'GMed',     name: 'Grado en Medicina',                     abbreviation: 'GMed'     },
  { id: 'MIR',      name: 'Médico Interno Residente',              abbreviation: 'MIR'      },
  { id: 'PhD',      name: 'Doctor en Medicina (PhD)',              abbreviation: 'PhD'      },
  { id: 'MU',       name: 'Máster Universitario',                  abbreviation: 'MU'       },
  { id: 'EspNeum',  name: 'Especialista en Neumología',            abbreviation: 'Esp-Neum' },
  { id: 'DUE',      name: 'Diplomado Universitario en Enfermería', abbreviation: 'DUE'      },
  { id: 'GEnf',     name: 'Grado en Enfermería',                   abbreviation: 'GEnf'     },
]
