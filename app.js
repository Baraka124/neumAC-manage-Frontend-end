document.addEventListener('DOMContentLoaded', () => {
  try {
    if (typeof Vue === 'undefined') throw new Error('Vue.js not loaded')   

    const { createApp, ref, reactive, computed, onMounted, watch, onUnmounted } = Vue 

    // ── DIAGNOSTIC: visible error banner ─────────────────────────────────
    // Built with plain DOM calls (no Vue) so it still works even when the
    // error that triggered it is a Vue render error breaking Vue itself.
    // This turns "the page is blank" into "here's the actual error" so we
    // never have to guess again.
    let __neumaxErrorCount = 0
    function showOnScreenError(title, err, extra) {
      try {
        __neumaxErrorCount++
        if (__neumaxErrorCount > 6) return // avoid flooding the screen
        const msg = (err && (err.message || String(err))) || 'Unknown error'
        const stack = (err && err.stack) ? String(err.stack).split('\n').slice(0, 4).join('\n') : ''
        let box = document.getElementById('neumax-diag-box')
        if (!box) {
          box = document.createElement('div')
          box.id = 'neumax-diag-box'
          box.style.cssText = 'position:fixed;left:8px;right:8px;bottom:8px;max-height:45vh;overflow:auto;z-index:999999;background:#1c1917;color:#fecaca;font:11px/1.5 ui-monospace,monospace;border:1px solid #ef4444;border-radius:8px;padding:10px 12px;box-shadow:0 4px 24px rgba(0,0,0,.4);'
          document.body.appendChild(box)
        }
        const entry = document.createElement('div')
        entry.style.cssText = 'border-top:1px solid rgba(239,68,68,.3);padding:6px 0;'
        entry.textContent = '[' + new Date().toLocaleTimeString() + '] ' + title + ': ' + msg + (extra ? ' (' + extra + ')' : '') + (stack ? '\n' + stack : '')
        box.appendChild(entry)
      } catch (_) { /* never let the diagnostic itself break the page */ }
    }
    window.addEventListener('error', (e) => showOnScreenError('Script error', e.error || e.message))
    window.addEventListener('unhandledrejection', (e) => showOnScreenError('Unhandled promise rejection', e.reason))

    // ============ 1. CONFIGURATION ====----===--====-=
    const CONFIG = {
      API_BASE_URL: window.location.hostname.includes('localhost')
        ? 'http://localhost:3000' 
        : 'https://neumac-manage-back-end-production.up.railway.app',      
      TOKEN_KEY: 'neumocare_token',
      USER_KEY: 'neumocare_user',
      CACHE_TTL: 300000
    }

    // ============ 2. CONSTANTS ====-========
    // Research line accent colours — available globally, not just inside useResearch
    const LINE_ACCENTS_GLOBAL = [
      { bg: 'linear-gradient(135deg,#3b82f6,#6366f1)', light: '#eff6ff', color: '#1e40af' },
      { bg: 'linear-gradient(135deg,#10b981,#0891b2)', light: '#d1fae5', color: '#065f46' },
      { bg: 'linear-gradient(135deg,#22d3ee,#0ea5e9)', light: '#e0f7fa', color: '#0e7490' },
      { bg: 'linear-gradient(135deg,#f59e0b,#f97316)', light: '#fef3c7', color: '#92400e' },
      { bg: 'linear-gradient(135deg,#a78bfa,#8b5cf6)', light: '#ede9fe', color: '#5b21b6' },
      { bg: 'linear-gradient(135deg,#fb7185,#ec4899)', light: '#fce7f3', color: '#9d174d' },
    ]
    const getLineAccentGlobal = (lineNumber) => LINE_ACCENTS_GLOBAL[((lineNumber || 1) - 1) % 6]

    const ROLES = {
      ADMIN: 'system_admin',
      HEAD: 'department_head',
      MANAGER: 'resident_manager',
      ATTENDING: 'attending_physician',
      RESIDENT: 'medical_resident'
    }

    const PERMISSION_MATRIX = {
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

    // ── Staff types: loaded dynamically from /api/staff-types ──────────────
    // Replaces the old hardcoded STAFF_TYPE_LABELS / STAFF_TYPE_CLASSES maps.
    // staffTypesList  → raw array for v-for dropdowns
    // staffTypeMap    → { type_key: { display_name, badge_class, is_resident_type } }
    const staffTypesList = ref([])
    const staffTypeMap   = ref({})
    const academicDegrees = ref([])   // loaded from /api/academic-degrees
    const rotationServices = ref([])  // loaded from /api/rotation-services (departments with service_type='rotation_service')

    // Fallbacks for display while loading or for unknown keys
    const STAFF_TYPE_LABELS_FALLBACK = {
      medical_resident: 'Resident', attending_physician: 'Attending',
      fellow: 'Fellow', nurse_practitioner: 'NP', administrator: 'Admin',
    }
    const STAFF_TYPE_CLASSES_FALLBACK = {
      medical_resident: 'badge-primary', attending_physician: 'badge-success',
      fellow: 'badge-info', nurse_practitioner: 'badge-warning', administrator: 'badge-secondary',
    }
    // Global helpers used throughout the app
    const formatStaffTypeGlobal   = (key) => staffTypeMap.value[key]?.display_name || STAFF_TYPE_LABELS_FALLBACK[key] || key
    const getRotationServiceName  = (id) => rotationServices.value.find(s => s.id === id)?.name || null
    // Short labels for table badges — keeps columns from overflowing
    const SHORT_LABELS = {
      attending_physician: 'Attending', medical_resident: 'Resident',
      fellow: 'Fellow', nurse_practitioner: 'NP', administrator: 'Admin'
    }
    const _toTitle = (k) => (k == null ? '' : String(k)).replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

    // ══════════════════════════════════════════════════════════════
    //  AGENT BRAIN — externalized knowledge base (the agent's "neurons").
    //  Concepts (vocabulary), intents (capabilities), reasoning traces,
    //  phrasings, and clinical rules live here as DATA, not code — so the
    //  agent's intelligence can grow by editing this, no code changes.
    //
    //  getBrain() is the seam: today it returns this embedded default;
    //  later it can merge a Supabase-stored brain on top (department-
    //  curated, synced across users) without changing any caller.
    // ══════════════════════════════════════════════════════════════
    const NEUMDESK_BRAIN_DEFAULT = {
        "_meta": {
                "name": "neumDesk Agent Brain",
                "version": 1,
                "description": "The agent's externalized knowledge. Edit this to teach the agent new vocabulary, intents, reasoning recipes, and phrasings — no code changes needed. The agent loads this and reasons over it. Bilingual (ES/EN).",
                "updated": "2026-06-30"
        },
        "concepts": {
                "oncall": [
                        "on-call",
                        "on call",
                        "oncall",
                        "guardia",
                        "duty",
                        "cover",
                        "covering",
                        "rota"
                ],
                "leave": [
                        "leave",
                        "absent",
                        "absence",
                        "off",
                        "vacation",
                        "holiday",
                        "baja",
                        "ausencia",
                        "ausente"
                ],
                "trial": [
                        "trial",
                        "study",
                        "studies",
                        "research",
                        "estudio",
                        "ensayo",
                        "protocol"
                ],
                "recruiting": [
                        "recruiting",
                        "recruit",
                        "enrolling",
                        "reclutando",
                        "reclutar"
                ],
                "rotation": [
                        "rotation",
                        "resident",
                        "supervisor",
                        "supervising",
                        "eval",
                        "rotación",
                        "rota"
                ],
                "gap": [
                        "gap",
                        "understaffed",
                        "uncovered",
                        "short",
                        "hueco",
                        "sin cobertura"
                ],
                "conflict": [
                        "conflict",
                        "problem",
                        "issue",
                        "wrong",
                        "clash",
                        "overlap",
                        "concern",
                        "risk",
                        "worry",
                        "attention",
                        "double-booked"
                ],
                "briefing": [
                        "brief",
                        "briefing",
                        "summary",
                        "standup",
                        "stand-up",
                        "resumen",
                        "overview"
                ],
                "count": [
                        "how many",
                        "count",
                        "number of",
                        "cuántos",
                        "cuantos"
                ],
                "rank": [
                        "most",
                        "busiest",
                        "overloaded",
                        "least",
                        "fewest",
                        "más",
                        "ranking"
                ],
                "recommend": [
                        "best",
                        "who should",
                        "who could",
                        "recommend",
                        "suggest",
                        "ideal"
                ],
                "draft": [
                        "draft",
                        "write",
                        "compose",
                        "redactar"
                ],
                "pi": [
                        "pi",
                        "investigator",
                        "principal investigator",
                        "investigador"
                ],
                "researchline": ["research line", "línea", "linea", "research area", "lines of research"],
                "innovation": ["innovation", "project", "proyecto", "patent", "prototype", "prototipo"],
                "unit": ["training unit", "clinical unit", "unit", "unidad", "ward"],
                "phd": ["phd", "doctorate", "doctoral"]
        },
        "entities": {
                "staff": {
                        "resolver": "resolveStaff",
                        "strips": [
                                "dr",
                                "dra",
                                "doctor",
                                "doctora"
                        ]
                }
        },
        "time_phrases": {
                "today": "today",
                "hoy": "today",
                "tomorrow": "tomorrow",
                "mañana": "tomorrow",
                "this week": "this_week",
                "esta semana": "this_week",
                "next week": "next_week",
                "próxima semana": "next_week",
                "weekend": "weekend",
                "fin de semana": "weekend",
                "this month": "this_month",
                "este mes": "this_month",
                "this quarter": "this_quarter",
                "este trimestre": "this_quarter"
        },
        "intents": {
                "recommend_backup": {
                        "match": {
                                "any_concept": [
                                        "recommend"
                                ],
                                "with_concept": [
                                        "oncall",
                                        "leave"
                                ]
                        },
                        "also_match_phrases": [
                                "if .* out .* who",
                                "who .* cover .* instead",
                                "best backup"
                        ],
                        "tools": [
                                "oncall_schedule",
                                "medical_staff",
                                "leave"
                        ],
                        "recipe": "recommend_backup",
                        "permission": null,
                        "trace": [
                                [
                                        "Identifying who is out",
                                        "on-call"
                                ],
                                [
                                        "Finding eligible physicians",
                                        "staff"
                                ],
                                [
                                        "Removing anyone on leave",
                                        "leave"
                                ],
                                [
                                        "Ranking by call load",
                                        "synthesis"
                                ]
                        ]
                },
                "draft_email": {
                        "match": {
                                "all_concepts": [
                                        "draft"
                                ]
                                                        },
                        "also_match_phrases": [
                                "(draft|write|compose) .*"
                        ],
                        "tools": [
                                "oncall_schedule",
                                "medical_staff"
                        ],
                        "recipe": "draft_email",
                        "permission": null,
                        "trace": [
                                [
                                        "Reading the schedule",
                                        "on-call"
                                ],
                                [
                                        "Filling the template",
                                        "synthesis"
                                ]
                        ]
                },
                "oncall_upcoming": {
                        "match": {
                                "any_concept": [
                                        "oncall"
                                ]
                        },
                        "tools": [
                                "oncall_schedule",
                                "medical_staff"
                        ],
                        "recipe": "oncall_upcoming",
                        "permission": "oncall_schedule",
                        "trace": [
                                [
                                        "Reading the on-call schedule",
                                        "on-call"
                                ],
                                [
                                        "Resolving physician names",
                                        "staff"
                                ]
                        ]
                },
                "absent_now": {
                        "match": {
                                "any_concept": [
                                        "leave"
                                ]
                        },
                        "tools": [
                                "leave"
                        ],
                        "recipe": "absent_now",
                        "permission": "staff_absence",
                        "trace": [
                                [
                                        "Scanning leave records",
                                        "leave"
                                ],
                                [
                                        "Filtering to today",
                                        "leave"
                                ]
                        ]
                },
                "trials_recruiting": {
                        "match": {
                                "any_concept": [
                                        "trial",
                                        "recruiting"
                                ]
                        },
                        "tools": [
                                "clinical_trials"
                        ],
                        "recipe": "trials_recruiting",
                        "permission": "clinical_trials",
                        "trace": [
                                [
                                        "Reviewing trials",
                                        "research"
                                ],
                                [
                                        "Computing enrollment health",
                                        "research"
                                ]
                        ]
                },
                "rank_oncall": {
                        "match": {
                                "all_concepts": [
                                        "rank",
                                        "oncall"
                                ]
                        },
                        "tools": [
                                "oncall_schedule"
                        ],
                        "recipe": "rank_oncall",
                        "permission": "oncall_schedule",
                        "trace": [
                                [
                                        "Reading the schedule",
                                        "on-call"
                                ],
                                [
                                        "Counting shifts per physician",
                                        "on-call"
                                ],
                                [
                                        "Ranking by load",
                                        "synthesis"
                                ]
                        ]
                },
                "issues": {
                        "match": {
                                "any_concept": [
                                        "conflict"
                                ]
                        },
                        "tools": [
                                "oncall_schedule",
                                "leave",
                                "rotations",
                                "clinical_trials"
                        ],
                        "recipe": "issues",
                        "permission": null,
                        "trace": [
                                [
                                        "Reading the on-call schedule",
                                        "on-call"
                                ],
                                [
                                        "Cross-referencing leave",
                                        "leave"
                                ],
                                [
                                        "Checking rotations & coverage",
                                        "rotations"
                                ],
                                [
                                        "Looking for conflicts",
                                        "synthesis"
                                ]
                        ]
                },
                "briefing": {
                        "match": {
                                "any_concept": [
                                        "briefing"
                                ]
                        },
                        "tools": [
                                "oncall_schedule",
                                "leave",
                                "rotations"
                        ],
                        "recipe": "briefing",
                        "permission": null,
                        "trace": [
                                [
                                        "Reading today's duty",
                                        "on-call"
                                ],
                                [
                                        "Checking leave & coverage",
                                        "leave"
                                ],
                                [
                                        "Composing the briefing",
                                        "synthesis"
                                ]
                        ]
                }
        },
        "phrasings": {
                "recommend_lead": [
                        "I'd suggest {name}",
                        "My recommendation: {name}",
                        "Best option looks like {name}"
                ],
                "recommend_balanced": [
                        "they have the lightest call load, so they'd keep the rota balanced",
                        "they carry the fewest shifts right now"
                ],
                "none_found": [
                        "Nothing came up there.",
                        "I don't see anything for that.",
                        "No matches in the records."
                ],
                "oncall_next": [
                        "Next on-call: {list}.",
                        "Coming up on call: {list}.",
                        "On the rota next: {list}."
                ]
        },
        "rules": {
                "oncall_eligible_types": [
                        "attending_physician",
                        "medical_resident",
                        "fellow"
                ],
                "trial_behind_threshold_pct": 25,
                "rotation_ending_soon_days": 30,
                "min_attendings_per_unit": 1
        }
}
    const _brainOverride = Vue.ref(null)  // loaded from neumdesk_brain (Supabase-backed)
    const _brainRows = Vue.ref([])         // raw editable rows for the editor screen
    const _brainLoading = Vue.ref(false)

    // Load the department-curated brain from the backend and fold it into the
    // override the agent reads. Rows: { kind, intent, content, meta, enabled }.
    const loadBrain = async () => {
      _brainLoading.value = true
      try {
        const rows = await API.request('/api/brain', { skipCache: true }).catch(() => null)
        if (!Array.isArray(rows)) { _brainLoading.value = false; return }
        _brainRows.value = rows
        // Fold rows into the override shape getBrain() expects.
        const ov = { concepts: {}, intents: {}, phrasings: {} }
        rows.filter(r => r.enabled).forEach(r => {
          if (r.kind === 'synonym' && r.intent) {
            ov.concepts[r.intent] = (ov.concepts[r.intent] || []).concat(r.content.toLowerCase())
          } else if (r.kind === 'pattern' && r.intent) {
            ov.intents[r.intent] = ov.intents[r.intent] || { match: [] }
            ov.intents[r.intent].match.push(r.content.toLowerCase())
          } else if (r.kind === 'phrasing' && r.intent) {
            ov.phrasings[r.intent] = (ov.phrasings[r.intent] || []).concat(r.content)
          }
        })
        _brainOverride.value = ov
      } catch (e) { /* keep embedded default on failure */ }
      _brainLoading.value = false
    }

    // Add a knowledge row (pattern / synonym / phrasing) and reload.
    const brainAdd = async (kind, intent, content, meta) => {
      try {
        await API.request('/api/brain', { method: 'POST', body: { kind, intent, content, meta: meta || {} } })
        await loadBrain()
        return true
      } catch (e) { return false }
    }
    const brainToggle = async (id, enabled) => {
      try { await API.request(`/api/brain/${id}`, { method: 'PUT', body: { enabled } }); await loadBrain(); return true } catch (e) { return false }
    }
    const brainDelete = async (id) => {
      try { await API.request(`/api/brain/${id}`, { method: 'DELETE' }); await loadBrain(); return true } catch (e) { return false }
    }
    // Log a question the agent couldn't answer → becomes a "teach me" worklist item.
    const brainLogFailed = (q) => {
      if (!q || q.length < 3) return
      API.request('/api/brain', { method: 'POST', body: { kind: 'failed_query', content: q, meta: { at: new Date().toISOString() } } }).catch(() => null)
    }
    // Editor form state (used by the Teach panel).
    const teachForm = Vue.reactive({ intent: '', content: '' })
    const teachMsg = Vue.ref('')
    const teachSubmit = async () => {
      if (!teachForm.intent || !teachForm.content.trim()) return
      teachMsg.value = 'Teaching…'
      const ok = await brainAdd('synonym', teachForm.intent, teachForm.content.trim())
      if (ok) { teachMsg.value = `✓ Grounded now understands "${teachForm.content.trim()}"`; teachForm.content = ''; setTimeout(() => teachMsg.value = '', 2600) }
      else { teachMsg.value = 'Could not save — the /api/brain route may not be deployed yet.' }
    }

    const getBrain = () => {
      const base = NEUMDESK_BRAIN_DEFAULT
      const ov = _brainOverride.value
      if (!ov) return base
      // Shallow-merge override sections over the default (department edits win).
      return {
        ...base,
        concepts:  { ...base.concepts,  ...(ov.concepts  || {}) },
        intents:   { ...base.intents,   ...(ov.intents   || {}) },
        phrasings: { ...base.phrasings, ...(ov.phrasings || {}) },
        rules:     { ...base.rules,     ...(ov.rules     || {}) }
      }
    }

    const formatStaffTypeShort = (key) => SHORT_LABELS[key] || (staffTypeMap.value[key]?.display_name?.split(' ')[0]) || _toTitle(key)
    const getStaffTypeClassGlobal = (key) => staffTypeMap.value[key]?.badge_class  || STAFF_TYPE_CLASSES_FALLBACK[key] || 'badge-secondary'
    const isResidentType          = (key) => staffTypeMap.value[key]?.is_resident_type ?? (key === 'medical_resident')

    // On-call eligibility: only physicians take call (attendings + residents),
    // NOT non-clinical staff (engineers, secretaries, IT, nurses-as-support).
    // Respects an explicit backend flag if present; otherwise infers from type.
    const isOnCallEligible = (key) => {
      if (!key) return false
      const t = staffTypeMap.value[key]
      if (t && typeof t.is_oncall_eligible === 'boolean') return t.is_oncall_eligible
      if (isResidentType(key)) return true
      // Physician/clinical attending patterns eligible for call
      const k = String(key).toLowerCase()
      return /physician|attending|fellow|facultativo|adjunto|medico|médico|doctor/.test(k)
    }
    
    const ABSENCE_REASON_LABELS = {
      vacation: 'Vacation', 
      sick_leave: 'Sick Leave', 
      conference: 'Conference',
      training: 'Training', 
      personal: 'Personal', 
      other: 'Other'
    }
    
    const ROTATION_STATUS_LABELS = {
      scheduled: 'Scheduled',
      active: 'Active',
      completed: 'Completed',
      extended: 'Extended',
      terminated_early: 'Terminated'
    }
    
    const USER_ROLE_LABELS = {
      system_admin: 'System Administrator', 
      department_head: 'Department Head',
      attending_physician: 'Attending Physician', 
      medical_resident: 'Medical Resident'
    }
    
    const VIEW_TITLES = {
      dashboard:             'Overview',
      medical_staff:         'Clinical Staff',
      oncall_schedule:       'On-call Schedule',
      resident_rotations:    'Rotations',
      training_units:        'Training Units',
      staff_absence:         'Leave & Coverage',
      department_management: 'Departments',
      research_hub:          'Research',
      research_lines:        'Research',
      clinical_trials:       'Research',
      innovation_projects:   'Research',
      analytics_dashboard:   'Research',
      analytics_performance: 'Research',
      analytics_partners:    'Research',
      news:                  'Publications',
      system_settings:       'Settings'
    }
    

    // ============ 3. ENHANCED UTILS CLASS ============
    const PROJECT_STAGES_DATA = [
      { key: 'Idea',             label: 'Idea',            icon: 'fa-lightbulb',    color: '#94a3b8', bg: 'rgba(148,163,184,.12)', step: 1 },
      { key: 'Prototipo',        label: 'Prototipo',       icon: 'fa-cube',         color: '#60a5fa', bg: 'rgba(96,165,250,.12)',  step: 2 },
      { key: 'Piloto',           label: 'Piloto',          icon: 'fa-play-circle',  color: '#34d399', bg: 'rgba(52,211,153,.12)',  step: 3 },
      { key: 'Validación',       label: 'Validación',      icon: 'fa-check-double', color: '#fbbf24', bg: 'rgba(251,191,36,.12)',  step: 4 },
      { key: 'Escalamiento',     label: 'Escalamiento',    icon: 'fa-chart-line',   color: '#f97316', bg: 'rgba(249,115,22,.12)',  step: 5 },
      { key: 'Comercialización', label: 'Comercialización',icon: 'fa-rocket',       color: '#10b981', bg: 'rgba(16,185,129,.12)',  step: 6 }
    ]

    // ── Pulmonology disease options ──────────────────────────────
    const DISEASE_OPTIONS = [
      'EPOC', 'Asma grave', 'Asma leve-moderada', 'Bronquiectasias',
      'Fibrosis quística', 'Alpha-1 Antitripsina (AAT)', 'Hipertensión pulmonar',
      'Fibrosis pulmonar idiopática (IPF)', 'EPID / ILD', 'Sarcoidosis',
      'Trasplante pulmonar', 'Cáncer de pulmón no microcítico (CPNM)',
      'Cáncer de pulmón microcítico', 'Mesotelioma', 'Insuficiencia respiratoria',
      'Apnea obstructiva del sueño (AOS)', 'Ventilación mecánica / VMI',
      'Ventilación no invasiva (VNI)', 'Neumotórax', 'Derrame pleural',
      'Enfermedad pleural', 'General / Transversal'
    ]

    // ── Tag option maps ──────────────────────────────────────────
    const ETHICS_STATUS_OPTS = [
      { value: 'approved',     label: 'CEIm ✓ Aprobado',  color: '#065f46', bg: '#d1fae5' },
      { value: 'pending',      label: 'CEIm Pendiente',    color: '#92400e', bg: '#fef3c7' },
      { value: 'exempt',       label: 'Exento',            color: '#334155', bg: '#f1f5f9' },
      { value: 'not_required', label: 'No requerido',      color: '#57534e', bg: '#f1f0ed' },
    ]
    const FUNDING_STATUS_OPTS = [
      { value: 'funded',         label: 'Financiado',      color: '#065f46', bg: '#d1fae5' },
      { value: 'seeking',        label: 'Buscando financ.',color: '#92400e', bg: '#fef3c7' },
      { value: 'not_applicable', label: 'Sin financiación',color: '#57534e', bg: '#f1f0ed' },
      { value: 'completed',      label: 'Financ. cerrada', color: '#334155', bg: '#f1f5f9' },
    ]
    const SPONSOR_TYPE_OPTS = ['Government','Academic','Pharma','Foundation','Private','Other']
    const STUDY_TYPE_OPTS   = ['Observational','Interventional','Experimental','Registry','Expanded Access']
    const POPULATION_OPTS   = [
      { value: 'adult',          label: 'Adultos' },
      { value: 'paediatric',     label: 'Pediátrico' },
      { value: 'mixed',          label: 'Mixto' },
      { value: 'not_applicable', label: 'No aplicable' },
    ]
    const REGULATORY_OPTS   = [
      { value: 'none',    label: 'Ninguno' },
      { value: 'ce_mdr',  label: 'CE MDR' },
      { value: 'samd',    label: 'SaMD' },
      { value: 'aemps',   label: 'AEMPS' },
      { value: 'fda',     label: 'FDA' },
      { value: 'other',   label: 'Otro' },
    ]

    // ── Team role options — shared for internal and external ─────
    const TEAM_ROLE_OPTIONS = [
      'Principal Investigator', 'Co-Principal Investigator', 'Co-investigator',
      'Sub-investigator', 'Data Manager', 'Clinical Research Nurse',
      'Research Coordinator', 'Statistician', 'Pharmacist',
      'Monitor (CRO/Sponsor)', 'External Collaborator', 'Funding body',
      'Scientific Advisor', 'Regulatory Advisor',
    ]
    class Utils {
      // Lightweight debounce — delays fn execution until `wait` ms after last call
      static debounce(fn, wait = 250) {
        let timer
        return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), wait) }
      }
      // Date utilities
      static localDateStr(d) {
        // Returns YYYY-MM-DD in LOCAL timezone — prevents UTC offset issues
        const dt = d instanceof Date ? d : new Date(d)
        if (isNaN(dt.getTime())) return ''
        const y = dt.getFullYear()
        const m = String(dt.getMonth() + 1).padStart(2, '0')
        const day = String(dt.getDate()).padStart(2, '0')
        return `${y}-${m}-${day}`
      }
      static normalizeDate(d) {
        if (!d) return ''
        if (d instanceof Date) return isNaN(d.getTime()) ? '' : Utils.localDateStr(d)
        const s = String(d).trim()
        if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
        if (s.includes('T')) return s.split('T')[0]
        if (s.includes('/')) {
          const [dd, mm, yyyy] = s.split('/')
          if (yyyy?.length === 4) return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`
        }
        if (/^\d{2}-\d{2}-\d{4}$/.test(s)) {
          const [dd, mm, yyyy] = s.split('-')
          return `${yyyy}-${mm}-${dd}`
        }
        try { const dt = new Date(s); if (!isNaN(dt.getTime())) return dt.toISOString().split('T')[0] } catch { }
        return s
      }

      // ============ 3.1 RESIDENT FORMATTING ============
      
      // Compute effective R-year: override wins over system-calc, system-calc over legacy training_year
      static effectiveResidentYear(staff) {
        if (staff.residency_year_override) return staff.residency_year_override
        if (staff.residency_year_calc) return staff.residency_year_calc
        // fallback: map legacy PGY- values
        const t = staff.training_year
        if (!t) return null
        const map = { 'PGY-1':'R1','PGY-2':'R2','PGY-3':'R3','PGY-4':'R4','PGY-5':'R4+' }
        return map[t] || t
      }

      static formatTrainingYear(year) {
        if (!year && year !== 0) return null;
        const yearStr = String(year).trim();
        if (/^\d+$/.test(yearStr)) return `PGY-${yearStr}`;
        if (yearStr.toUpperCase().startsWith('PGY')) {
          const parts = yearStr.split(/[- ]/);
          if (parts.length > 1) return `PGY-${parts[1]}`;
          return yearStr.toUpperCase();
        }
        return yearStr;
      }

      static getResidentCategoryInfo(category, staff = {}) {
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
        };
        return categories[category] || {
          icon: 'fa-user', text: 'Not categorized', shortText: 'Unknown',
          color: '#94a3b8', bgColor: 'rgba(148, 163, 184, 0.1)'
        };
      }

      static formatResidentCategorySimple(category) {
        const map = { 'department_internal': 'Internal', 'rotating_other_dept': 'Rotating', 'external_resident': 'External' };
        return map[category] || 'Unknown';
      }

      static formatResidentCategoryDetailed(staff) {
        if (!staff?.resident_category) return null;
        return Utils.getResidentCategoryInfo(staff.resident_category, staff).text;
      }

      static getResidentCategoryIcon(category) { return Utils.getResidentCategoryInfo(category).icon; }

      static getResidentCategoryTooltip(staff) {
        if (!staff?.resident_category) return '';
        switch(staff.resident_category) {
          case 'department_internal': return 'Department internal resident';
          case 'rotating_other_dept': return staff.home_department ? `Rotating from ${staff.home_department} department` : 'Resident from another department';
          case 'external_resident': return staff.external_institution ? `External resident from ${staff.external_institution}` : 'External resident from another institution';
          default: return '';
        }
      }

      // ============ 3.2 PROFESSIONAL FORMATTING ============

      static formatSpecialization(spec) {
        if (!spec) return null;
        const abbreviations = ['ICU', 'ER', 'OR', 'PICU', 'NICU', 'PFT', 'CPAP', 'BiPAP', 'COPD', 'OSA'];
        return spec.split(' ').map(word => {
          const upperWord = word.toUpperCase();
          if (abbreviations.includes(upperWord)) return upperWord;
          return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        }).join(' ');
      }

      static formatPhone(phone) {
        if (!phone) return null;
        const cleaned = String(phone).replace(/\D/g, '');
        if (cleaned.length === 9) return `+34 ${cleaned.slice(0,3)} ${cleaned.slice(3,6)} ${cleaned.slice(6)}`;
        if (cleaned.length === 12) return `+${cleaned.slice(0,2)} ${cleaned.slice(2,5)} ${cleaned.slice(5,8)} ${cleaned.slice(8)}`;
        return phone;
      }

      static formatLicense(license) {
        if (!license) return null;
        return license.toUpperCase();
      }

      // ============ 3.3 ROLE FORMATTING ============

      static getRoleInfo(role) {
        const roles = {
          'chief_of_department': { icon: 'fa-crown', color: 'gold', bgColor: 'rgba(255, 215, 0, 0.1)', label: 'Chief of Department' },
          'research_coordinator': { icon: 'fa-flask', color: '#8b5cf6', bgColor: 'rgba(139, 92, 246, 0.1)', label: 'Research Coordinator' },
          'resident_manager': { icon: 'fa-user-graduate', color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.1)', label: 'Resident Manager' },
          'oncall_manager': { icon: 'fa-phone-alt', color: '#3b82f6', bgColor: 'rgba(59, 130, 246, 0.1)', label: 'On-Call Manager' }
        };
        return roles[role] || null;
      }

      static getStaffRoles(staff) {
        const roles = [];
        if (staff?.is_chief_of_department) roles.push({ key: 'chief_of_department', ...Utils.getRoleInfo('chief_of_department') });
        if (staff?.is_research_coordinator) roles.push({ key: 'research_coordinator', ...Utils.getRoleInfo('research_coordinator') });
        if (staff?.is_resident_manager) roles.push({ key: 'resident_manager', ...Utils.getRoleInfo('resident_manager') });
        if (staff?.is_oncall_manager) roles.push({ key: 'oncall_manager', ...Utils.getRoleInfo('oncall_manager') });
        return roles;
      }

      // ============ 3.4 LEAVE BALANCE FORMATTING ============

      static calculateLeaveBalance(staff) {
        return {
          vacation: { used: 5, total: 20, remaining: 15 },
          sick: { used: 2, total: 10, remaining: 8 },
          conference: { used: 3, total: 10, remaining: 7 },
          personal: { used: 1, total: 5, remaining: 4 }
        };
      }

      static getDaysRemainingColor(days) {
        if (days <= 0) return '#ef4444';
        if (days < 5) return '#f59e0b';
        return '#10b981';
      }

      // ============ 3.5 EXISTING UTILITIES ============
      
      static formatDate(d) {
        if (!d) return 'N/A'
        try {
          const date = new Date(Utils.normalizeDate(d) + 'T00:00:00')
          if (isNaN(date.getTime())) return d
          return date.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })
        } catch { return d }
      }

      static formatDateShort(d) {
        if (!d) return ''
        try {
          const date = typeof d === 'string' ? new Date(Utils.normalizeDate(d) + 'T00:00:00') : d
          return date.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short' })
        } catch { return '' }
      }

      static formatRelativeDate(d) {
        if (!d) return ''
        try {
          const date = new Date(Utils.normalizeDate(d) + 'T00:00:00')
          const today = new Date(); today.setHours(0, 0, 0, 0)
          const diff = Math.ceil((date - today) / 86400000)
          if (diff === 0) return 'Today'
          if (diff === 1) return 'Tomorrow'
          if (diff === -1) return 'Yesterday'
          if (diff > 1 && diff <= 7) return `In ${diff} days`
          if (diff > 7 && diff <= 30) return `In ${Math.ceil(diff / 7)}w`
          if (diff < -1 && diff >= -7) return `${Math.abs(diff)}d ago`
          return Utils.formatDate(d)
        } catch { return Utils.formatDate(d) }
      }

      static formatDatePlusDays(d, n) {
        if (!d) return 'NA'
        try {
          const date = new Date(Utils.normalizeDate(d) + 'T00:00:00')
          if (isNaN(date.getTime())) return 'NA'
          date.setDate(date.getDate() + n)
          return date.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })
        } catch { return 'NA' }
      }

      static formatTime(d) {
        if (!d) return ''
        try { return new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
        catch { return d }
      }

      static formatRelativeTime(d) {
        if (!d) return 'Just now'
        try {
          const diff = Math.floor((new Date() - new Date(d)) / 60000)
          if (diff < 1) return 'Just now'
          if (diff < 60) return `${diff}m ago`
          if (diff < 1440) return `${Math.floor(diff / 60)}h ago`
          return `${Math.floor(diff / 1440)}d ago`
        } catch { return 'Just now' }
      }

      static formatNewsDate(d) {
        if (!d) return ''
        try {
          const date = new Date(d)
          const diff = Math.floor((new Date() - date) / 60000)
          if (diff < 1)    return 'Just now'
          if (diff < 60)   return `${diff}m ago`
          if (diff < 1440) return `${Math.floor(diff / 60)}h ago`
          if (diff < 10080) return `${Math.floor(diff / 1440)}d ago`
          // For publications entered with year only (stored as Jan 1st),
          // show just the year to avoid misleading "1 Jan 2023"
          const isJan1 = date.getUTCMonth() === 0 && date.getUTCDate() === 1
          if (isJan1) return date.getUTCFullYear().toString()
          return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
        } catch { return '' }
      }

      static dateDiff(start, end) {
        try {
          const s = new Date(Utils.normalizeDate(start) + 'T00:00:00')
          const e = new Date(Utils.normalizeDate(end) + 'T23:59:59')
          if (isNaN(s.getTime()) || isNaN(e.getTime())) return 0
          return Math.ceil(Math.abs(e - s) / 86400000)
        } catch { return 0 }
      }

      static daysUntil(d) {
        if (!d) return 0
        const date = new Date(Utils.normalizeDate(d) + 'T00:00:00')
        const today = new Date(); today.setHours(0, 0, 0, 0)
        return Math.max(0, Math.ceil((date - today) / 86400000))
      }

      static ensureArray(data) {
        if (Array.isArray(data)) return data
        if (data?.data && Array.isArray(data.data)) return data.data
        if (data && typeof data === 'object') return Object.values(data)
        return []
      }

      static truncateText(text, max = 100) {
        if (!text) return ''
        return text.length <= max ? text : text.substring(0, max) + '...'
      }

      static generateId(prefix) {
        return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 9)}`
      }

      static formatPercentage(value, total) {
        if (!total) return '0%'
        return `${Math.round((value / total) * 100)}%`
      }

      static getPhaseColor(phase) {
        return { 'Phase I': '#4d9aff', 'Phase II': '#00e5a0', 'Phase III': '#ffbe3d', 'Phase IV': '#ff5566' }[phase] || '#7a90b0'
      }

      static getPartnerTypeColor(type) {
        const map = {
          'Empresa': '#4d9aff', 'Hospital': '#00e5a0', 'Tecnología': '#ffbe3d', 'Universidad': '#a78bfa',
          'Industria': '#f97316', 'Startup': '#34d399', 'Fundación': '#fb7185', 'Institución': '#60a5fa',
          'CRO': '#f59e0b', 'Other': '#7a90b0'
        }
        return map[type] || ('#' + [...type].reduce((h, c) => (h * 31 + c.charCodeAt(0)) & 0xffffff, 0x4d9aff).toString(16).padStart(6, '0'))
      }

      static getStageConfig(stage) {
        return PROJECT_STAGES_DATA.find(s => s.key === stage) || { key: stage, label: stage, icon: 'fa-circle', color: '#7a90b0', bg: 'rgba(122,144,176,.1)', step: 0 }
      }
      static getStageColor(stage) {
        return Utils.getStageConfig(stage).color
      }

      static getTomorrow() {
        const d = new Date(); d.setDate(d.getDate() + 1); return d
      }

      static formatClinicalDuration(startDate, endDate) {
        if (!startDate || !endDate) return 'N/A'
        try {
          const s = new Date(Utils.normalizeDate(startDate) + 'T00:00:00')
          const e = new Date(Utils.normalizeDate(endDate) + 'T00:00:00')
          const days = Math.round((e - s) / 86400000)
          if (days < 0) return 'N/A'
          if (days < 7) return `${days}d`
          const weeks = Math.floor(days / 7)
          const rem = days % 7
          if (weeks < 5) return rem > 0 ? `${weeks}w ${rem}d` : `${weeks}w`
          const months = Math.round(days / 30.44)
          return `${months}mo`
        } catch { return 'N/A' }
      }

      static getInitials(name) {
        if (!name || typeof name !== 'string') return '??'
        const clean = name.replace(/^(Dr\.?|Dra\.?|Prof\.?)\s*/i, '').trim()
        const parts = clean.split(/\s+/).filter(Boolean)
        if (parts.length === 0) return '??'
        if (parts.length === 1) return parts[0][0].toUpperCase()
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      }

      // Consistent colour index from name — same name always same colour
      static avatarColorIndex(name) {
        if (!name) return 0
        let h = 0
        for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0
        return h % 8
      }

      // CSS class for the avatar based on staff type + name hash
      // Returns: nm-av nm-av--{type} nm-av--c{0-7}
      static avatarClass(staffType, name, size = 'md') {
        const isResident = staffType === 'medical_resident' || staffType === 'external_resident' || staffType === 'rotating_other_dept'
        const isFellow   = staffType === 'fellow'
        const isNurse    = staffType === 'nurse_practitioner'
        const isAdmin    = staffType === 'administrator' || staffType === 'admin'
        const idx        = Utils.avatarColorIndex(name || '')
        let typeClass = isResident ? 'resident' : isFellow ? 'fellow' : isNurse ? 'nurse' : isAdmin ? 'admin' : 'attending'
        return `nm-av nm-av--${size} nm-av--${typeClass} nm-av--c${idx}`
      }

      // Format a clinician name for compact display in the dashboard.
      // Respects whatever title the user stored (Dr., Dra., Prof., etc.)
      // Shortens to: <title> <LastName>  e.g. "Dr. Pedro J. Marcos" → "Dr. Marcos"
      //                                       "Dra. María García"   → "Dra. García"
      //                                       "Pedro Marcos"        → "Pedro Marcos" (no title detected)
      static formatDrName(fullName) {
        if (!fullName || typeof fullName !== 'string') return '—'
        const parts = fullName.trim().split(/\s+/).filter(Boolean)
        if (parts.length === 0) return '—'
        if (parts.length === 1) return parts[0]

        // Check if the first word looks like a title (Dr., Dra., Prof., etc.)
        const titlePattern = /^(Dr\.?|Dra\.?|Prof\.?|Mr\.?|Ms\.?|Mrs\.?)$/i
        const hasTitle = titlePattern.test(parts[0])

        if (hasTitle) {
          // "Dr. Pedro J. Marcos" → ["Dr.", "Pedro", "J.", "Marcos"] → "Dr. Marcos"
          const title    = parts[0]
          const lastName = parts[parts.length - 1]
          return `${title} ${lastName}`
        } else {
          // No title stored — just show first + last, skip middle initials
          // "Pedro Juan Marcos" → "Pedro Marcos"
          return parts.length > 2
            ? `${parts[0]} ${parts[parts.length - 1]}`
            : fullName.trim()
        }
      }
    }

    // ============ 4. ENHANCED API SERVICE ============
    class ApiService {
      constructor() {
        this.cache = new Map()
        this._isOnline = navigator.onLine
        this._sessionExpired = false
        window.addEventListener('online',  () => { this._isOnline = true;  window.dispatchEvent(new CustomEvent('neumax:online'))  })
        window.addEventListener('offline', () => { this._isOnline = false; window.dispatchEvent(new CustomEvent('neumax:offline')) })
      }
      get isOnline() { return this._isOnline }

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
              if (!this._sessionExpired) {
                this._sessionExpired = true
                localStorage.removeItem(CONFIG.TOKEN_KEY)
                localStorage.removeItem(CONFIG.USER_KEY)
                window.dispatchEvent(new CustomEvent('neumax:session-expired'))
              }
              throw new Error('Session expired. Please log in again.')
            }
            if (res.status === 403) throw new Error('You do not have permission to perform this action.')
            if (res.status === 404) throw new Error('The requested resource was not found.')
            if (res.status === 503) {
              window.dispatchEvent(new CustomEvent('neumax:maintenance'))
              throw new Error('System is under maintenance. Please try again shortly.')
            }
            if (res.status >= 500) throw new Error('A server error occurred. Please try again in a moment.')
            const errBody = await res.text().catch(() => `HTTP ${res.status}`)
            let errMsg = errBody
            try {
              const j = JSON.parse(errBody)
              // Common shapes: { message }, { error }, { detail }
              if (j.message) errMsg = j.message
              else if (j.error) errMsg = j.error
              else if (j.detail) errMsg = j.detail
              else {
                // Field-level validation (Django/DRF style): { field: ["msg"], ... }
                // Surface the actual fields that failed so the user/dev can SEE the real error.
                const parts = []
                for (const [field, val] of Object.entries(j)) {
                  const msg = Array.isArray(val) ? val.join(', ') : (typeof val === 'string' ? val : JSON.stringify(val))
                  parts.push(`${field}: ${msg}`)
                }
                if (parts.length) errMsg = parts.join(' · ')
              }
            } catch {}
            // Always include the status so backend issues are diagnosable.
            console.error(`[neumDesk API] ${res.status} on ${endpoint}:`, errBody)
            throw new Error(errMsg || `Request failed (HTTP ${res.status})`)
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
          this._sessionExpired = false
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

      // ============ 4.1 MEDICAL STAFF ENDPOINTS ============
      
      async getMedicalStaff() { 
        // B9 FIX: Removed redundant .filter(employment_status !== 'inactive') —
        // the backend already excludes inactive staff by default (neq query).
        // Keeping it here would silently drop inactive staff even when fetched intentionally.
        const data = await this.getList('/api/medical-staff?limit=500');
        return data
          .map(staff => ({
          ...staff,
          resident_category: staff.resident_category || null,
          home_department: staff.home_department || null,
          external_institution: staff.external_institution || null,
          can_supervise_residents: staff.can_supervise_residents || false,
          training_year: staff.training_year || null,
          training_level: staff.training_level || null,
          is_chief_of_department: staff.is_chief_of_department || false,
          is_research_coordinator: staff.is_research_coordinator || false,
          is_resident_manager: staff.is_resident_manager || false,
          is_oncall_manager: staff.is_oncall_manager || false
        }));
      }
      
      async createMedicalStaff(d) { this.invalidate('/api/medical-staff'); return this.request('/api/medical-staff', { method: 'POST', body: d }) }
      async updateMedicalStaff(id, d) {
        // FIX: invalidate both the paginated list and the individual record cache keys
        this.invalidate('/api/medical-staff')
        this.invalidate(`/api/medical-staff/${id}`)
        return this.request(`/api/medical-staff/${id}`, { method: 'PUT', body: d })
      }
      async deleteMedicalStaff(id) { this.invalidate('/api/medical-staff'); this.invalidate(`/api/medical-staff/${id}`); return this.request(`/api/medical-staff/${id}`, { method: 'DELETE' }) }

      // ============ 4.2 SUPERVISION ENDPOINTS ============
      
      async getSupervisedResidents(attendingId) {
        try {
          const rotations = await this.getRotations();
          const medicalStaff = await this.getMedicalStaff();
          const trainingUnits = await this.getTrainingUnits();
          
          const active = rotations
            .filter(r => r.supervising_attending_id === attendingId && r.rotation_status === 'active')
            .map(r => {
              const resident = medicalStaff.find(s => s.id === r.resident_id);
              const unit = trainingUnits.find(u => u.id === r.training_unit_id);
              return {
                id: r.id, residentId: r.resident_id,
                residentName: resident?.full_name || 'Unknown',
                residentYear: resident?.training_year || null,
                unitId: r.training_unit_id, unitName: unit?.unit_name || 'Unknown',
                startDate: r.start_date, endDate: r.end_date,
                daysLeft: Utils.daysUntil(r.end_date)
              };
            });

          const past = rotations.filter(r => r.supervising_attending_id === attendingId && r.rotation_status === 'completed').length;
          const totalDaysSupervised = rotations
            .filter(r => r.supervising_attending_id === attendingId && ['completed','active'].includes(r.rotation_status))
            .reduce((sum, r) => {
              const s = new Date(r.start_date), e = new Date(r.end_date)
              return sum + Math.max(0, Math.round((e - s) / 86400000))
            }, 0)

          return { current: active, currentCount: active.length, pastCount: past, totalDaysSupervised };
        } catch (error) {
          console.error('Failed to load supervision data:', error);
          return { current: [], currentCount: 0, pastCount: 0, totalDaysSupervised: 0 };
        }
      }

      // ============ 4.3 LEAVE BALANCE ENDPOINTS ============
      
      async getLeaveBalance(staffId) {
        try {
          const [allStaff, allAbsences] = await Promise.all([this.getMedicalStaff(), this.getAbsences()])
          const staff = allStaff.find(s => s.id === staffId)
          const isAttending = staff?.staff_type === 'attending_physician'
          const TOTALS = {
            vacation:   isAttending ? 25 : 20,
            sick_leave: 12,
            conference: isAttending ? 15 : 10,
            personal:   5,
          }
          const currentYear = new Date().getFullYear()
          const myAbsences = allAbsences.filter(a =>
            a.staff_member_id === staffId &&
            !['cancelled'].includes(a.current_status) &&
            new Date(a.start_date).getFullYear() === currentYear
          )
          const used = { vacation: 0, sick_leave: 0, conference: 0, personal: 0 }
          myAbsences.forEach(a => {
            const reason = a.absence_reason
            if (used[reason] !== undefined) {
              const days = Math.ceil(Math.abs(new Date(a.end_date) - new Date(a.start_date)) / 86400000) + 1
              used[reason] += days
            }
          })
          return {
            vacation:   { used: used.vacation,   total: TOTALS.vacation,   remaining: Math.max(0, TOTALS.vacation   - used.vacation)   },
            sick:       { used: used.sick_leave,  total: TOTALS.sick_leave, remaining: Math.max(0, TOTALS.sick_leave - used.sick_leave) },
            conference: { used: used.conference,  total: TOTALS.conference, remaining: Math.max(0, TOTALS.conference - used.conference) },
            personal:   { used: used.personal,    total: TOTALS.personal,   remaining: Math.max(0, TOTALS.personal   - used.personal)   },
          }
        } catch {
          return { vacation:{used:0,total:20,remaining:20}, sick:{used:0,total:12,remaining:12}, conference:{used:0,total:10,remaining:10}, personal:{used:0,total:5,remaining:5} }
        }
      }

      // ============ 4.4 EXISTING ENDPOINTS ============

      // ── Staff Types (dynamic) ─────────────────────────────────────────────
      // ── Rotation Services ────────────────────────────────────────────
      async getRotationServices(includeHome = false) {
        const url = '/api/rotation-services' + (includeHome ? '?include_home=true' : '')
        try { const r = await this.request(url); return (r?.success && Array.isArray(r.data)) ? r.data : [] } catch { return [] }
      }
      async createRotationService(d) { this.invalidate('/api/rotation-services'); const r = await this.request('/api/rotation-services', { method: 'POST', body: d }); return r?.data || r }
      async updateRotationService(id, d) { this.invalidate('/api/rotation-services'); const r = await this.request(`/api/rotation-services/${id}`, { method: 'PUT', body: d }); return r?.data || r }
      async deleteRotationService(id) { this.invalidate('/api/rotation-services'); return this.request(`/api/rotation-services/${id}`, { method: 'DELETE' }) }

      async getStaffTypes(includeInactive = false) {
        // B3 FIX: GET /api/staff-types returns { success: true, data: [] } not a raw array.
        // Using getList() risks hitting ensureArray's Object.values() fallback which would
        // return [true, [...]] — corrupting the staffTypeMap used for badges app-wide.
        const url = '/api/staff-types' + (includeInactive ? '?include_inactive=true' : '')
        try {
          const r = await this.request(url)
          return (r?.success && Array.isArray(r.data)) ? r.data : Utils.ensureArray(r)
        } catch { return [] }
      }
      async createStaffType(data) { this.invalidate('/api/staff-types'); const r = await this.request('/api/staff-types', { method: 'POST', body: data }); return r?.data || r } // unwrap { success, data }
      async updateStaffType(id, data) { this.invalidate('/api/staff-types'); const r = await this.request(`/api/staff-types/${id}`, { method: 'PUT', body: data }); return r?.data || r } // unwrap { success, data }
      async deleteStaffType(id) { this.invalidate('/api/staff-types'); return this.request(`/api/staff-types/${id}`, { method: 'DELETE' }) }

      // ── Academic Degrees ─────────────────────────────────────────────────
      async getAcademicDegrees() { return this.getList('/api/academic-degrees') }
      async createAcademicDegree(d) { this.invalidate('/api/academic-degrees'); return this.request('/api/academic-degrees', { method: 'POST', body: d }) }
      async updateAcademicDegree(id, d) { this.invalidate('/api/academic-degrees'); return this.request(`/api/academic-degrees/${id}`, { method: 'PUT', body: d }) }
      async deleteAcademicDegree(id) { this.invalidate('/api/academic-degrees'); return this.request(`/api/academic-degrees/${id}`, { method: 'DELETE' }) }

      // ── Staff Certificates ───────────────────────────────────────────────
      async getStaffCertificates(staffId) { return this.getList(`/api/medical-staff/${staffId}/certificates`) }
      async createStaffCertificate(staffId, d) { return this.request(`/api/medical-staff/${staffId}/certificates`, { method: 'POST', body: d }) }
      async updateStaffCertificate(staffId, certId, d) { return this.request(`/api/medical-staff/${staffId}/certificates/${certId}`, { method: 'PUT', body: d }) }
      async deleteStaffCertificate(staffId, certId) { return this.request(`/api/medical-staff/${staffId}/certificates/${certId}`, { method: 'DELETE' }) }

      async getDepartments() { return this.getList('/api/departments') }
      async getDepartmentSummary(id) { return this.request(`/api/departments/${id}/summary`) }
      async checkRotationAvailability(params) {
        const q = new URLSearchParams(params).toString()
        return this.request(`/api/rotations/availability?${q}`)
      }
      async getAllDepartments() { return this.getList('/api/departments?include_inactive=true') }
      async getDepartmentImpact(id) { return this.request(`/api/departments/${id}/impact`) }
      async createDepartment(d) { this.invalidate('/api/departments'); return this.request('/api/departments', { method: 'POST', body: d }) }
      async updateDepartment(id, d) { this.invalidate('/api/departments'); return this.request(`/api/departments/${id}`, { method: 'PUT', body: d }) }
      async deleteDepartment(id, reassignments) { this.invalidate('/api/departments'); return this.request(`/api/departments/${id}`, { method: 'DELETE', body: reassignments ? { reassignments } : {} }) }

      async getHospitals() {
        try { const r = await this.request('/api/hospitals'); return (r?.success && Array.isArray(r.data)) ? r.data : Utils.ensureArray(r) } catch { return [] }
      }
      async createHospital(d) { this.invalidate('/api/hospitals'); return this.request('/api/hospitals', { method: 'POST', body: d }) }
      async updateHospital(id, d) { this.invalidate('/api/hospitals'); return this.request(`/api/hospitals/${id}`, { method: 'PUT', body: d }) }

      async getClinicalUnits(departmentId) {
        // clinical_units merged into training_units — hit training-units directly
        const url = departmentId ? `/api/training-units?department_id=${departmentId}` : '/api/training-units'
        try { const r = await this.request(url); return (r?.success && Array.isArray(r.data)) ? r.data : Utils.ensureArray(r) } catch { return [] }
      }
      async createClinicalUnit(d) { this.invalidate('/api/clinical-units'); return this.request('/api/clinical-units', { method: 'POST', body: d }) }
      async updateClinicalUnit(id, d) { this.invalidate('/api/clinical-units'); return this.request(`/api/clinical-units/${id}`, { method: 'PUT', body: d }) }
      async deleteClinicalUnit(id) { this.invalidate('/api/clinical-units'); return this.request(`/api/clinical-units/${id}`, { method: 'DELETE' }) }
      async getClinicalUnitStaff(unitId) {
        try { const r = await this.request(`/api/clinical-units/${unitId}/staff`); return (r?.success && Array.isArray(r.data)) ? r.data : [] } catch { return [] }
      }
      async assignStaffToUnit(unitId, d) { return this.request(`/api/clinical-units/${unitId}/staff`, { method: 'POST', body: d }) }
      async removeStaffFromUnit(unitId, assignmentId) { return this.request(`/api/clinical-units/${unitId}/staff/${assignmentId}`, { method: 'DELETE' }) }

      async getPartners() {
        try { const r = await this.request('/api/partners'); return (r?.success && Array.isArray(r.data)) ? r.data : Utils.ensureArray(r) } catch { return [] }
      }
      async createPartner(d) { this.invalidate('/api/partners'); return this.request('/api/partners', { method: 'POST', body: d }) }
      async updatePartner(id, d) { this.invalidate('/api/partners'); return this.request(`/api/partners/${id}`, { method: 'PUT', body: d }) }
      async deletePartner(id) { this.invalidate('/api/partners'); return this.request(`/api/partners/${id}`, { method: 'DELETE' }) }
      async getPartnerNeeds() {
        try { const r = await this.request('/api/partner-needs'); return (r?.success && Array.isArray(r.data)) ? r.data : [] } catch { return [] }
      }
      async createPartnerNeed(d) { return this.request('/api/partner-needs', { method: 'POST', body: d }) }
      async getProjectPartners(projectId) {
        try { const r = await this.request(`/api/innovation-projects/${projectId}/partners`); return (r?.success && Array.isArray(r.data)) ? r.data : [] } catch { return [] }
      }
      async linkPartnerToProject(projectId, d) { return this.request(`/api/innovation-projects/${projectId}/partners`, { method: 'POST', body: d }) }
      async unlinkPartnerFromProject(projectId, partnerId) { return this.request(`/api/innovation-projects/${projectId}/partners/${partnerId}`, { method: 'DELETE' }) }

      async getTrainingUnits() { return this.getList('/api/training-units') }
      async createTrainingUnit(d) { this.invalidate('/api/training-units'); return this.request('/api/training-units', { method: 'POST', body: d }) }
      async updateTrainingUnit(id, d) { this.invalidate('/api/training-units'); return this.request(`/api/training-units/${id}`, { method: 'PUT', body: d }) }
      async deleteTrainingUnit(id) { this.invalidate('/api/training-units'); return this.request(`/api/training-units/${id}`, { method: 'DELETE' }) }

      async getRotations() {
        try { const r = await this.request('/api/rotations?limit=500'); return Utils.ensureArray(r?.data ?? r) } catch { return [] }
      }
      async createRotation(d) { this.invalidate('/api/rotations'); return this.request('/api/rotations', { method: 'POST', body: d }) }
      async updateRotation(id, d) { this.invalidate('/api/rotations'); return this.request(`/api/rotations/${id}`, { method: 'PUT', body: d }) }
      async deleteRotation(id) { this.invalidate('/api/rotations'); return this.request(`/api/rotations/${id}`, { method: 'DELETE' }) }

      async getOnCallSchedule() { return this.getList('/api/oncall') }
      async getOnCallToday() { return this.getList('/api/oncall/today') }
      async createOnCall(d) { this.invalidate('/api/oncall'); return this.request('/api/oncall', { method: 'POST', body: d }) }
      async updateOnCall(id, d) { this.invalidate('/api/oncall'); return this.request(`/api/oncall/${id}`, { method: 'PUT', body: d }) }
      async deleteOnCall(id) { this.invalidate('/api/oncall'); return this.request(`/api/oncall/${id}`, { method: 'DELETE' }) }

      async getAbsences() {
        try {
          const r = await this.request('/api/absence-records?limit=500')
          return (r?.success && Array.isArray(r.data)) ? r.data : Utils.ensureArray(r)
        } catch { return [] }
      }
      async createAbsence(d) { this.invalidate('/api/absence-records'); return this.request('/api/absence-records', { method: 'POST', body: d }) }
      async updateAbsence(id, d) { this.invalidate('/api/absence-records'); return this.request(`/api/absence-records/${id}`, { method: 'PUT', body: d }) }
      async deleteAbsence(id) { this.invalidate('/api/absence-records'); return this.request(`/api/absence-records/${id}`, { method: 'DELETE' }) }
      async purgeAbsence(id) { this.invalidate('/api/absence-records'); return this.request(`/api/absence-records/${id}/purge`, { method: 'DELETE' }) }
      async returnToDuty(id, d) { this.invalidate('/api/absence-records'); return this.request(`/api/absence-records/${id}/return`, { method: 'PUT', body: d }) }

      async getAnnouncements() { return this.getList('/api/announcements') }
      async createAnnouncement(d) { this.invalidate('/api/announcements'); return this.request('/api/announcements', { method: 'POST', body: d }) }
      async updateAnnouncement(id, d) { this.invalidate('/api/announcements'); return this.request(`/api/announcements/${id}`, { method: 'PUT', body: d }) }
      async deleteAnnouncement(id) { this.invalidate('/api/announcements'); return this.request(`/api/announcements/${id}`, { method: 'DELETE' }) }

      async getClinicalStatus() {
        try { return await this.request('/api/live-status/current') } catch { return { success: false, data: null } }
      }
      async createClinicalStatus(d) { this.invalidate('/api/live-status'); return this.request('/api/live-status', { method: 'POST', body: d }) }
      async updateClinicalStatus(id, d) { this.invalidate('/api/live-status'); return this.request(`/api/live-status/${id}`, { method: 'PUT', body: d }) }
      async deleteClinicalStatus(id) { this.invalidate('/api/live-status'); return this.request(`/api/live-status/${id}`, { method: 'DELETE' }) }
      async getClinicalStatusHistory(limit = 10) { return this.getList(`/api/live-status/history?limit=${limit}`) }

      async getSystemStats() { try { return await this.request('/api/system-stats') || {} } catch { return {} } }

      async getResearchLines() {
        try { const r = await this.request('/api/research-lines'); return r?.data || Utils.ensureArray(r) } catch { return [] }
      }
      async createResearchLine(d) { this.invalidate('/api/research-lines'); const r = await this.request('/api/research-lines', { method: 'POST', body: d }); return r?.data || r } // C1 FIX: unwrap { success, data }
      async updateResearchLine(id, d) { this.invalidate('/api/research-lines'); const r = await this.request(`/api/research-lines/${id}`, { method: 'PUT', body: d }); return r?.data || r } // C1 FIX
      async deleteResearchLine(id) { this.invalidate('/api/research-lines'); return this.request(`/api/research-lines/${id}`, { method: 'DELETE' }) }
      async assignCoordinator(lineId, coordinatorId) {
        this.invalidate('/api/research-lines')
        return this.request(`/api/research-lines/${lineId}/coordinator`, { method: 'PUT', body: { coordinator_id: coordinatorId } })
      }

      async getAllClinicalTrials() {
        try { const r = await this.request('/api/clinical-trials'); return r?.data || Utils.ensureArray(r) } catch { return [] }
      }
      async createClinicalTrial(d) { this.invalidate('/api/clinical-trials'); const r = await this.request('/api/clinical-trials', { method: 'POST', body: d }); return r?.data || r } // C1 FIX
      async updateClinicalTrial(id, d) { this.invalidate('/api/clinical-trials'); const r = await this.request(`/api/clinical-trials/${id}`, { method: 'PUT', body: d }); return r?.data || r } // C1 FIX
      async deleteClinicalTrial(id) { this.invalidate('/api/clinical-trials'); return this.request(`/api/clinical-trials/${id}`, { method: 'DELETE' }) }

      async getAllInnovationProjects() {
        try { const r = await this.request('/api/innovation-projects'); return r?.data || Utils.ensureArray(r) } catch { return [] }
      }
      async createInnovationProject(d) { this.invalidate('/api/innovation-projects'); const r = await this.request('/api/innovation-projects', { method: 'POST', body: d }); return r?.data || r } // C1 FIX
      async updateInnovationProject(id, d) { this.invalidate('/api/innovation-projects'); const r = await this.request(`/api/innovation-projects/${id}`, { method: 'PUT', body: d }); return r?.data || r } // C1 FIX
      async deleteInnovationProject(id) { this.invalidate('/api/innovation-projects'); return this.request(`/api/innovation-projects/${id}`, { method: 'DELETE' }) }

      async getResearchDashboard() {
        try { const r = await this.request('/api/analytics/research-dashboard'); return r?.data || r || null } catch { return null }
      }
      async getResearchLinesPerformance() {
        try { const r = await this.request('/api/analytics/research-lines-performance'); return r?.data || [] } catch { return [] }
      }
      async getPartnerCollaborations() {
        try { const r = await this.request('/api/analytics/partner-collaborations'); return r?.data || null } catch { return null }
      }
      async getClinicalTrialsTimeline(years = 3) {
        try { const r = await this.request(`/api/analytics/clinical-trials-timeline?years=${years}`); return r?.data || null } catch { return null }
      }
      async getAnalyticsSummary() {
        try { const r = await this.request('/api/analytics/summary'); return r?.data || null } catch { return null }
      }
      async exportData(type, format = 'csv') {
        return this.request(`/api/analytics/export/${type}?format=${format}`, { skipCache: true })
      }

      // ============ 4.5 ENHANCED RESEARCH PROFILE ============
      
      async getOpsMetrics(date = null) {
        const p = date ? `?date=${date}` : ''
        return this.request(`/api/ops-metrics${p}`)
      }
      async postOpsMetrics(metrics) {
        this.invalidate('/api/ops-metrics')
        return this.request('/api/ops-metrics', { method: 'POST', body: metrics })
      }
      async deleteOpsMetric(id) {
        this.invalidate('/api/ops-metrics')
        return this.request(`/api/ops-metrics/${id}`, { method: 'DELETE' })
      }

    async batchCreateOnCall(shifts) {
        this.invalidate('/api/oncall')
        return this.request('/api/oncall/batch', { method: 'POST', body: { shifts } })
      }
      async getCoverageAreas() {
        return this.getList('/api/coverage-areas')
      }
      async createCoverageArea(data) {
        this.invalidate('/api/coverage-areas')
        return this.request('/api/coverage-areas', { method: 'POST', body: data })
      }
      async updateCoverageArea(id, data) {
        this.invalidate('/api/coverage-areas')
        return this.request(`/api/coverage-areas/${id}`, { method: 'PUT', body: data })
      }
      async deleteCoverageArea(id) {
        this.invalidate('/api/coverage-areas')
        return this.request(`/api/coverage-areas/${id}`, { method: 'DELETE' })
      }

      async getStaffResearchProfile(staffId) {
        try {
          const [performance, allTrials, allProjects, researchLines, rotations] = await Promise.all([
            this.getResearchLinesPerformance(), this.getAllClinicalTrials(),
            this.getAllInnovationProjects(), this.getResearchLines(), this.getRotations()
          ])
          
          // FIX 1: Use researchLines (UUID match) not performance (name string) for coordinator detection
          const linesCoordinated = researchLines.filter(l => l.coordinator_id === staffId)
          const trialsAsPI = allTrials.filter(t => t.principal_investigator_id === staffId)
          const linesAsPI = [...new Set(trialsAsPI.map(t => t.research_line_id))].map(lineId => researchLines.find(l => l.id === lineId)).filter(Boolean)
          const trialsAsCoI = allTrials.filter(t => t.co_investigators?.includes(staffId))
          const linesAsCoI = [...new Set(trialsAsCoI.map(t => t.research_line_id))].map(lineId => researchLines.find(l => l.id === lineId)).filter(Boolean)
          const projectsAsLead = allProjects.filter(p => p.lead_investigator_id === staffId)
          const linesAsLead = [...new Set(projectsAsLead.map(p => p.research_line_id))].map(lineId => researchLines.find(l => l.id === lineId)).filter(Boolean)
          const trialsAsSubI = allTrials.filter(t => t.sub_investigators?.includes(staffId))
          const linesAsSubI = [...new Set(trialsAsSubI.map(t => t.research_line_id))].map(lineId => researchLines.find(l => l.id === lineId)).filter(Boolean)
          
          // FIX 2: Build a roles-array map so a staff member can show multiple roles per line
          const allLineRolesMap = new Map();
          const addLineRole = (line, role) => {
            const key = line.id;
            if (!allLineRolesMap.has(key)) allLineRolesMap.set(key, { ...line, roles: [] });
            allLineRolesMap.get(key).roles.push(role);
          };
          linesCoordinated.forEach(l => addLineRole(l, 'Coordinator'));
          linesAsPI.forEach(l => addLineRole(l, 'Principal Investigator'));
          linesAsCoI.forEach(l => addLineRole(l, 'Co-Investigator'));
          linesAsLead.forEach(l => addLineRole(l, 'Project Lead'));
          linesAsSubI.forEach(l => addLineRole(l, 'Sub-Investigator'));
          
          // Find matching perf data for counts
          const perfMap = new Map(performance.map(p => [p.id, p]));
          const allResearchLines = Array.from(allLineRolesMap.values()).map(l => {
            const perf = perfMap.get(l.id);
            return {
              id: l.id, name: l.research_line_name || l.name, line_number: l.line_number,
              roles: l.roles, role: l.roles[0], // primary role for badge colour
              trialsCount: perf?.stats?.totalTrials || l.stats?.totalTrials || 0,
              projectsCount: perf?.stats?.totalProjects || l.stats?.totalProjects || 0
            };
          });
          
          const byPhase = { 'Phase I': 0, 'Phase II': 0, 'Phase III': 0, 'Phase IV': 0 };
          trialsAsPI.forEach(t => { if (t.phase in byPhase) byPhase[t.phase]++ });
          const partnerNeeds = {};
          projectsAsLead.forEach(p => p.partner_needs?.forEach(n => { partnerNeeds[n] = (partnerNeeds[n] || 0) + 1 }));
          
          // FIX 4: active count includes trials where staff is any role (PI or Co-I)
          const allActiveTrials = new Set([
            ...trialsAsPI.filter(t => ['Activo', 'Reclutando'].includes(t.status)).map(t => t.id),
            ...trialsAsCoI.filter(t => ['Activo', 'Reclutando'].includes(t.status)).map(t => t.id)
          ]);
          
          return {
            allResearchLines,
            // FIX: expose coordinator info at top level for banner display
            isCoordinator: linesCoordinated.length > 0,
            coordinatorLines: linesCoordinated.map(l => ({ id: l.id, name: l.research_line_name || l.name, line_number: l.line_number })),
            researchLines: linesCoordinated.map(l => ({ id: l.id, name: l.research_line_name || l.name, line_number: l.line_number, role: 'Coordinator', trialsCount: l.stats?.totalTrials || 0, projectsCount: l.stats?.totalProjects || 0 })),
            trials: {
              asPI: trialsAsPI.length, asCoI: trialsAsCoI.length, asSubI: trialsAsSubI.length,
              active: allActiveTrials.size,
              completed: trialsAsPI.filter(t => t.status === 'Completado').length, byPhase,
              list: [...trialsAsPI.slice(0, 3).map(t => ({ id: t.id, title: t.title, status: t.status, phase: t.phase, role: 'PI' })), ...trialsAsCoI.slice(0, 3).map(t => ({ id: t.id, title: t.title, status: t.status, phase: t.phase, role: 'Co-I' })), ...trialsAsSubI.slice(0, 3).map(t => ({ id: t.id, title: t.title, status: t.status, phase: t.phase, role: 'Sub-I' }))].slice(0, 8)
            },
            projects: {
              asLead: projectsAsLead.length,
              byStage: projectsAsLead.reduce((acc, p) => { const stage = p.current_stage || p.development_stage; acc[stage] = (acc[stage] || 0) + 1; return acc }, {}),
              list: projectsAsLead.slice(0, 5).map(p => ({ id: p.id, title: p.title, current_stage: p.current_stage || p.development_stage, role: 'Lead' }))
            },
            publications: [],
            partnerNeeds: Object.entries(partnerNeeds).map(([name, count]) => ({ name, count }))
          }
        } catch (error) {
          console.error('Failed to load research profile:', error);
          return null;
        }
      }
    }

    const API = new ApiService()

    // ============ 5. SHARED HELPERS ============
    function makePagination(views) {
      const pagination = reactive(Object.fromEntries(views.map(([k, size]) => [k, { page: 1, size }])))
      const resetPage = (v) => { if (pagination[v]) pagination[v].page = 1 }
      const paginate = (arr, v) => {
        if (!pagination[v]) return arr
        const { page, size } = pagination[v]
        return arr.slice((page - 1) * size, page * size)
      }
      const totalPages = (arr, v) => pagination[v] ? Math.max(1, Math.ceil(arr.length / pagination[v].size)) : 1
      const goToPage = (v, page, arr) => {
        if (!pagination[v]) return
        pagination[v].page = Math.max(1, Math.min(page, totalPages(arr, v)))
      }
      return { pagination, resetPage, paginate, totalPages, goToPage }
    }

    function makeSort(defaults) {
      const sortState = reactive(defaults)
      const sortBy = (v, field) => {
        const s = sortState[v]
        if (!s) return
        s.dir = (s.field === field && s.dir === 'asc') ? 'desc' : 'asc'
        s.field = field
      }
      const sortIcon = (v, field) => {
        const s = sortState[v]
        if (!s || s.field !== field) return 'fa-sort'
        return s.dir === 'asc' ? 'fa-sort-up' : 'fa-sort-down'
      }
      const applySort = (arr, v) => {
        const s = sortState[v]
        if (!s?.field) return arr
        return [...arr].sort((a, b) => {
          let va = a[s.field] ?? '', vb = b[s.field] ?? ''
          // Numeric comparison prevents "9" > "10" string-sort bugs
          if (typeof va === 'number' && typeof vb === 'number') {
            return s.dir === 'asc' ? va - vb : vb - va
          }
          if (typeof va === 'string' && /\d{4}-\d{2}-\d{2}/.test(va)) {
            va = Utils.normalizeDate(va); vb = Utils.normalizeDate(vb)
          }
          const cmp = String(va).localeCompare(String(vb), undefined, { numeric: true })
          return s.dir === 'asc' ? cmp : -cmp
        })
      }
      return { sortState, sortBy, sortIcon, applySort }
    }

    function makeValidation(forms) {
      const fieldErrors = reactive(Object.fromEntries(forms.map(f => [f, {}])))
      const setErr = (form, field, msg) => { if (fieldErrors[form] !== undefined) fieldErrors[form][field] = msg }
      // V2 FIX: Vue 3 reactive objects don't trigger on individual key deletion.
      // Replace the whole sub-object to ensure the DOM always reflects cleared state.
      const clearErr = (form, field) => {
        if (fieldErrors[form]?.[field] !== undefined) {
          const copy = { ...fieldErrors[form] }
          delete copy[field]
          fieldErrors[form] = copy
        }
      }
      const clearAll = (form) => {
        if (fieldErrors[form] !== undefined) fieldErrors[form] = {}
      }
      return { fieldErrors, setErr, clearErr, clearAll }
    }

    // ============ 6. COMPOSABLES ============

    // ============ 6.1 useAuth ============
    function useAuth() {
      const currentUser = ref(null)
      const loginForm = reactive({ email: '', password: '', remember_me: false })
      const loginLoading = ref(false)

      // hasPermission reads from the explicit permissions array returned by the backend
      // at login and /api/auth/me — no static matrix, no role inference.
      // action: 'read' checks can_read, anything else checks can_write.
      const hasPermission = (module, action = 'read') => {
        const user = currentUser.value
        if (!user) return false
        // Admins (admin_level >= 1) pass all permission checks — matches the intent
        // that an administrator can operate every module.
        if ((user.admin_level ?? 0) >= 1) return true
        const perms = user.permissions
        if (!Array.isArray(perms)) return false
        const p = perms.find(x => x.module === module)
        if (!p) return false
        return action === 'read' ? p.can_read : p.can_write
      }

      // isAdmin — true if the user has admin_level > 0 (can manage permissions)
      const isAdmin = () => (currentUser.value?.admin_level ?? 0) >= 1

      return { currentUser, loginForm, loginLoading, hasPermission, isAdmin }
    }

    // ============ 6.2 useUI ============
    function useUI() {
      const toasts = ref([])
      const sidebarCollapsed = ref(false)
      const mobileMenuOpen = ref(false)

      // ── Splash screen ──────────────────────────────────────────────
      const splashVisible = ref(true)
      setTimeout(() => { splashVisible.value = false }, 1800)

      // ── Dashboard expand drawers ────────────────────────────────────
      const dbDrawer = reactive({ show: false, panel: null }) // panel: 'oncall' | 'rotations'
      const openDbDrawer = (panel) => { dbDrawer.panel = panel; dbDrawer.show = true }
      const closeDbDrawer = () => { dbDrawer.show = false }
      const userMenuOpen = ref(false)
      const statsSidebarOpen = ref(false)
      const searchResultsOpen = ref(false)
      const globalSearchQuery = ref('')
      const currentView = ref('login')
      const systemAlerts = ref([])

      const confirmationModal = reactive({
        show: false, title: '', message: '', icon: 'fa-question-circle',
        confirmButtonText: 'Confirm', confirmButtonClass: 'btn-primary',
        cancelButtonText: 'Cancel', onConfirm: null, details: ''
      })
      const userProfileModal = reactive({
        show: false, form: { full_name: '', email: '', department_id: '' }
      })

      let _toastSeq = 0
      const showToast = (title, message, type = 'info', duration = 5000, action = null) => {
        const icons = { info: 'fas fa-info-circle', success: 'fas fa-check-circle', error: 'fas fa-exclamation-circle', warning: 'fas fa-exclamation-triangle', warn: 'fas fa-exclamation-triangle' }
        const toast = { id: ++_toastSeq, title, message, type: type === 'warn' ? 'warning' : type, icon: icons[type] || icons.info, duration, action }
        toasts.value.push(toast)
        if (duration > 0) setTimeout(() => removeToast(toast.id), duration)
      }

      const removeToast = (id) => {
        const i = toasts.value.findIndex(t => t.id === id)
        if (i > -1) toasts.value.splice(i, 1)
      }

      const showConfirmation = (opts) => Object.assign(confirmationModal, { show: true, ...opts })

      const confirmAction = async () => {
        if (confirmationModal.onConfirm) {
          try { await confirmationModal.onConfirm() } catch (e) { showToast('Error', e?.message || 'An unexpected error occurred', 'error') }
        }
        confirmationModal.show = false
      }

      const cancelConfirmation = () => {
        if (confirmationModal.onCancel) confirmationModal.onCancel()
        confirmationModal.show = false
      }

      const dismissAlert = (id) => {
        const i = systemAlerts.value.findIndex(a => a.id === id)
        if (i > -1) systemAlerts.value.splice(i, 1)
      }

      const activeAlertsCount = computed(() => systemAlerts.value.filter(a => !a.status || a.status === 'active').length)

      // ── ⌘K Command Palette (open/close only — logic in main setup) ──
      const cmdPaletteOpen = ref(false)
      const isOffline = ref(!navigator.onLine)
      const isMaintenanceMode = ref(false)
      window.addEventListener('online',  () => { isOffline.value = false })
      window.addEventListener('offline', () => { isOffline.value = true  })

      // keyboard toggle
      if (typeof window !== 'undefined') {
        // Global keyboard shortcuts
        let _gKeyPending = false, _gKeyTimer = null
        window.addEventListener('keydown', (e) => {
          // ⌘K / Ctrl+K — command palette
          if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
            e.preventDefault()
            cmdPaletteOpen.value = !cmdPaletteOpen.value
            return
          }
          if (e.key === 'Escape' && cmdPaletteOpen.value) {
            cmdPaletteOpen.value = false
            return
          }
          // Skip if typing in an input, textarea, or select
          const tag = e.target?.tagName?.toLowerCase()
          if (['input', 'textarea', 'select'].includes(tag) || e.target?.isContentEditable) return
          if (e.metaKey || e.ctrlKey || e.altKey) return

          // G + key navigation (like Gmail)
          if (_gKeyPending) {
            clearTimeout(_gKeyTimer)
            _gKeyPending = false
            const navMap = {
              'd': 'dashboard',
              's': 'medical_staff',
              'o': 'oncall_schedule',
              'r': 'resident_rotations',
              'u': 'training_units',
              'a': 'staff_absence',
              'h': 'research_hub',
              'n': 'news',
              ',': 'system_settings',
            }
            if (navMap[e.key]) {
              e.preventDefault()
              switchView(navMap[e.key])
            }
            return
          }
          // G = start of G+key combo
          if (e.key === 'g' || e.key === 'G') {
            _gKeyPending = true
            _gKeyTimer = setTimeout(() => { _gKeyPending = false }, 1000)
          }
          // ? — show keyboard shortcut help (quick toast)
          if (e.key === '?') {
            showToast('Keyboard shortcuts',
              'G+D Dashboard · G+S Staff · G+O On-call · G+R Rotations · G+U Units · G+A Absence · G+H Research · G+N News · ⌘K Search',
              'info', 8000)
          }
        })
      }

      const sidebarLiveStatus = computed(() => {
        try {
          const absentNow  = absences.value
            .map(a => ({...a, ...deriveAbsenceStatus(a)}))
            .filter(a => a.current_status === 'currently_absent').length
          const activeRots = rotations.value.filter(r => r.rotation_status === 'active').length
          const parts = []
          if (activeRots > 0) parts.push(`${activeRots} resident${activeRots!==1?'s':''} on rotation`)
          if (absentNow  > 0) parts.push(`${absentNow} absent`)
          return parts.length ? parts.join(' · ') : 'System operational'
        } catch { return 'System operational' }
      })

      return {
        toasts, removeToast, showToast,
        confirmationModal, showConfirmation, confirmAction, cancelConfirmation,
        userProfileModal, systemAlerts, activeAlertsCount, dismissAlert,
        sidebarCollapsed, mobileMenuOpen, userMenuOpen, statsSidebarOpen, searchResultsOpen,
        splashVisible, dbDrawer, openDbDrawer, closeDbDrawer,
        globalSearchQuery, currentView, sidebarLiveStatus,
        cmdPaletteOpen,
        isOffline,
        isMaintenanceMode
      }
    }

    // ============ 6.3 useStaff ============
    function useStaff({ showToast, showConfirmation, paginate, totalPages, resetPage, applySort, fieldErrors, setErr, clearAll, currentUser, researchLines, loadResearchLines }) {
      const medicalStaff    = ref([])
      const allStaffLookup  = ref([])   // ALL staff including inactive, for name resolution
      const staffView = ref('table') // 'table' | 'compact'
      const hospitalsList = ref([])   // all hospitals from DB
      const clinicalUnits = ref([])   // clinical units (Pneumology + others)
      const staffFilters = reactive({ search: '', staffType: '', department: '', status: '', residentCategory: '', hospital: '', networkType: '' })
      const debouncedStaffSearch = ref('')
      watch(() => staffFilters.search, Utils.debounce(v => { debouncedStaffSearch.value = v }, 250))
      const clearStaffFilters = () => { staffFilters.search = ''; staffFilters.staffType = ''; staffFilters.department = ''; staffFilters.status = ''; staffFilters.residentCategory = ''; staffFilters.hospital = ''; staffFilters.networkType = '' }
      const hasActiveStaffFilters = computed(() => !!(staffFilters.search || staffFilters.staffType || staffFilters.department || staffFilters.status || staffFilters.residentCategory || staffFilters.hospital || staffFilters.networkType))
      const staffProfileModal = reactive({ 
        show: false, staff: null, activeTab: 'overview',
        researchProfile: null, supervisionData: null, leaveBalance: null,
        loadingResearch: false, loadingSupervision: false, loadingLeave: false,
        units: [], unitsLoading: false
      })
      const medicalStaffModal = reactive({
        show: false, mode: 'add', activeTab: 'basic',
        _addingHospital: false, _newHospitalName: '', _newHospitalNetwork: 'external',
        _certs: [], _addingCert: false, _newCert: { name:'', issued_month:'', renewal_months: 24 },
        _addingStaffType: false, _newStaffTypeName: '', _newStaffTypeIsResident: false, _savingStaffType: false,
        form: { 
          full_name: '', staff_type: 'medical_resident', staff_id: '', employment_status: 'active', 
          professional_email: '', department_id: '', academic_degree: '', specialization: '', 
          training_year: '', clinical_certificate: '', certificate_status: '',
          mobile_phone: '', medical_license: '', can_supervise_residents: false, special_notes: '',
          can_be_pi: false, can_be_coi: false, other_certificate: '',
          resident_category: null, home_department: null, external_institution: null,
          home_department_id: null, external_contact_name: null, external_contact_email: null, external_contact_phone: null,
          academic_degree_id: null, has_medical_license: false,
          residency_start_date: null, residency_year_override: null,
          is_chief_of_department: false, is_research_coordinator: false, 
          is_resident_manager: false, is_oncall_manager: false, clinical_study_certificates: [],
          hospital_id: null, _networkHint: null,
          // Affiliation fields
          affiliation_type: 'primary',  // 'primary' | 'affiliated' | 'visiting' | 'honorary'
          primary_dept_name: null,        // For affiliated: their actual home department name
          // Public profile fields — surfaced on neumact.org's team page when is_public=true
          is_public: false, public_bio: '', public_photo_url: ''
        }
      })

      // V3 FIX: Map each field to its tab so we can auto-switch when a hidden field fails
      const STAFF_FIELD_TAB = {
        full_name: 'basic', staff_type: 'basic', professional_email: 'basic',
        department_id: 'basic', employment_status: 'basic',
        resident_category: 'basic', home_department_id: 'basic',
        external_institution: 'basic', external_contact_name: 'basic', external_contact_email: 'basic',
        specialization: 'professional', training_year: 'professional',
        medical_license: 'professional', mobile_phone: 'professional',
        can_supervise_residents: 'roles', can_be_pi: 'roles', can_be_coi: 'roles',
        is_research_coordinator: 'roles'
      }
      const jumpToFirstStaffError = () => {
        const errors = fieldErrors['staff'] || {}
        for (const field of Object.keys(errors)) {
          const tab = STAFF_FIELD_TAB[field]
          if (tab) { medicalStaffModal.activeTab = tab; break }
        }
      }

      const validateStaff = (form) => {
        clearAll('staff'); let ok = true
        if (!form.full_name?.trim()) { setErr('staff', 'full_name', 'Full name is required'); ok = false }
        if (!form.staff_type) { setErr('staff', 'staff_type', 'Staff type is required'); ok = false }
        if (form.professional_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.professional_email)) {
          setErr('staff', 'professional_email', 'Invalid email address'); ok = false
        }
        // External resident: needs institution + contact
        if (form.resident_category === 'external_resident') {
          if (!form.external_institution?.trim())  { setErr('staff', 'external_institution', 'Institution required'); ok = false }
          if (!form.external_contact_name?.trim()) { setErr('staff', 'external_contact_name', 'Contact person required'); ok = false }
          if (!form.external_contact_email?.trim()){ setErr('staff', 'external_contact_email', 'Contact email required'); ok = false }
        }
        // Rotating resident: needs origin department
        if (form.resident_category === 'rotating_other_dept') {
          if (!form.home_department_id) { setErr('staff', 'home_department_id', 'Origin department required'); ok = false }
        }
        if (!ok) jumpToFirstStaffError()
        
        // Duplicate email check
        if (ok && form.professional_email?.trim()) {
          const editId = form.id
          const dup = medicalStaff.value.find(s =>
            s.id !== editId &&
            s.professional_email?.toLowerCase() === form.professional_email.toLowerCase()
          )
          if (dup) {
            setErr('staff', 'professional_email', `Email already used by ${dup.full_name}`)
            ok = false
          }
        }
        return ok
      }

      const filteredMedicalStaffAll = computed(() => {
        let f = medicalStaff.value
        if (debouncedStaffSearch.value) {
          const q = debouncedStaffSearch.value.toLowerCase()
          f = f.filter(x => x.full_name?.toLowerCase().includes(q) || x.staff_id?.toLowerCase().includes(q) || x.professional_email?.toLowerCase().includes(q))
        }
        if (staffFilters.staffType) f = f.filter(x => x.staff_type === staffFilters.staffType)
        // Department filter: match by department_id (works for both primary and affiliated staff)
        if (staffFilters.department) f = f.filter(x => x.department_id === staffFilters.department)
        if (staffFilters.status) f = f.filter(x => x.employment_status === staffFilters.status)
        if (staffFilters.residentCategory) f = f.filter(x => x.resident_category === staffFilters.residentCategory)
        if (staffFilters.hospital) f = f.filter(x => x.hospital_id === staffFilters.hospital)
        if (staffFilters.networkType) {
          const ids = hospitalsList.value.filter(h => h.parent_complex === staffFilters.networkType).map(h => h.id)
          f = f.filter(x => ids.includes(x.hospital_id))
        }
        return applySort(f, 'medical_staff')
      })

      const filteredMedicalStaff = computed(() => paginate(filteredMedicalStaffAll.value, 'medical_staff'))
      const staffTotalPages = computed(() => totalPages(filteredMedicalStaffAll.value, 'medical_staff'))

      // Compact view: staff grouped by role with section dividers
      const compactStaffWithDividers = computed(() => {
        // Card view uses ALL filtered staff (not paginated) — cards handle density naturally
        const staff = filteredMedicalStaffAll.value
        const attendings = staff.filter(s => !isResidentType(s.staff_type))
        const residents  = staff.filter(s =>  isResidentType(s.staff_type))
        const result = []
        if (attendings.length) {
          result.push({ _divider: `Attending Physicians · ${attendings.length}` })
          result.push(...attendings)
        }
        if (residents.length) {
          result.push({ _divider: `Medical Residents · ${residents.length}` })
          result.push(...residents)
        }
        return result
      })

      watch(staffFilters, () => resetPage('medical_staff'), { deep: true })

      const loadMedicalStaff = async () => {
        try {
          const [raw, hospitals, units] = await Promise.all([
            API.getList('/api/medical-staff?limit=500&employment_status=all'),
            API.getHospitals(),
            API.getClinicalUnits()
          ])
          if (Array.isArray(raw)) {
            // Defensive: never surface soft-deleted staff (backend filter is the real fix)
            allStaffLookup.value = raw
              .filter(s => !s.deleted_at)
              .map(s => ({ id: s.id, full_name: s.full_name, staff_type: s.staff_type, employment_status: s.employment_status }))
          }
          hospitalsList.value = hospitals
          clinicalUnits.value = units
          const staff = await API.getMedicalStaff()
          medicalStaff.value = Array.isArray(staff) ? staff.filter(s => !s.deleted_at) : staff
        }
        catch { showToast('Error', 'Failed to load medical staff', 'error') }
      }

      const loadHospitals = async () => {
        try { hospitalsList.value = await API.getHospitals() }
        catch { console.error('Failed to load hospitals') }
      }

      // Create a new hospital inline from the staff form, append to list, auto-select it
      const addHospitalInline = async (name, networkType = 'external') => {
        if (!name?.trim()) return null
        try {
          const result = await API.createHospital({ name: name.trim(), network_type: networkType })
          if (result?.success && result.data) {
            hospitalsList.value = [...hospitalsList.value, result.data].sort((a, b) => a.name.localeCompare(b.name))
            showToast('Success', `Hospital "${result.data.name}" added`, 'success')
            return result.data
          }
          return null
        } catch { showToast('Error', 'Failed to add hospital', 'error'); return null }
      }

      // Inline staff type creation — called from within the Add/Edit Staff modal
      // Creates the type in DB, refreshes the list, auto-selects it in the form
      const addStaffTypeInline = async () => {
        const name = medicalStaffModal._newStaffTypeName?.trim()
        if (!name) { showToast('Required', 'Please enter a staff type name', 'warning'); return }
        // Generate a type_key from the display name: lowercase, spaces→underscores, strip special chars
        const typeKey = name.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '_').substring(0, 60)
        if (!typeKey) { showToast('Invalid', 'Name must contain letters or numbers', 'warning'); return }
        medicalStaffModal._savingStaffType = true
        try {
          await API.createStaffType({
            type_key: typeKey,
            display_name: name,
            badge_class: 'badge-secondary',
            is_resident_type: medicalStaffModal._newStaffTypeIsResident,
            can_supervise: false,
            is_active: true,
            display_order: staffTypesList.value.length * 10
          })
          // Refresh the global staff types list + map
          await loadStaffTypes()
          // Auto-select the newly created type
          medicalStaffModal.form.staff_type = typeKey
          // Reset inline form
          medicalStaffModal._addingStaffType = false
          medicalStaffModal._newStaffTypeName = ''
          medicalStaffModal._newStaffTypeIsResident = false
          showToast('Success', `Staff type "${name}" created and selected`, 'success')
        } catch (e) {
          showToast('Error', e?.message || 'Failed to create staff type', 'error')
        } finally {
          medicalStaffModal._savingStaffType = false
        }
      }

      const showAddMedicalStaffModal = (opts = {}) => {
        clearAll('staff')
        medicalStaffModal.mode = 'add'
        medicalStaffModal.activeTab = 'basic'
        medicalStaffModal._addingHospital = false
        medicalStaffModal._newHospitalName = ''
        medicalStaffModal._newHospitalNetwork = 'external'
        medicalStaffModal._addingStaffType = false
        medicalStaffModal._newStaffTypeName = ''
        medicalStaffModal._newStaffTypeIsResident = false
        medicalStaffModal._savingStaffType = false
        // Context-aware department default:
        // 1. Explicit opts.department_id (e.g. opened from dept panel)
        // 2. Current user's own department
        // 3. Blank — user must select
        const defaultDeptId = opts.department_id || null
        Object.assign(medicalStaffModal.form, {
          full_name: '', staff_type: 'medical_resident', staff_id: `MD-${Date.now().toString().slice(-6)}`,
          employment_status: 'active', professional_email: '', department_id: defaultDeptId || '', academic_degree: '',
          specialization: '', training_year: '', clinical_certificate: '', certificate_status: '',
          mobile_phone: '', medical_license: '', can_supervise_residents: false, special_notes: '',
          can_be_pi: false, can_be_coi: false, other_certificate: '',
          resident_category: null, home_department: null, external_institution: null,
          home_department_id: null, external_contact_name: null, external_contact_email: null, external_contact_phone: null,
          academic_degree_id: null, has_medical_license: false,
          residency_start_date: null, residency_year_override: null,
          is_chief_of_department: false, is_research_coordinator: false, 
          is_resident_manager: false, is_oncall_manager: false, clinical_study_certificates: [],
          hospital_id: null, _networkHint: null
        })
        medicalStaffModal.show = true
      }

      const loadMedicalStaffModalCertificates = async (staffId) => {
        try {
          medicalStaffModal._certs = await API.getStaffCertificates(staffId)
        } catch { medicalStaffModal._certs = [] }
      }

      const saveCertificate = async () => {
        const c = medicalStaffModal._newCert
        if (!c.name?.trim()) return
        try {
          await API.createStaffCertificate(medicalStaffModal.form.id, {
            certificate_name: c.name.trim(),
            issued_date: c.issued_month ? c.issued_month + '-01' : null,
            renewal_months: c.renewal_months || 24
          })
          medicalStaffModal._addingCert = false
          await loadMedicalStaffModalCertificates(medicalStaffModal.form.id)
          showToast('Saved', 'Certificate added', 'success')
        } catch (e) { showToast('Error', e?.message || 'Failed to save certificate', 'error') }
      }

      const deleteCertificate = async (cert) => {
        try {
          await API.deleteStaffCertificate(medicalStaffModal.form.id, cert.id)
          await loadMedicalStaffModalCertificates(medicalStaffModal.form.id)
          showToast('Removed', 'Certificate removed', 'success')
        } catch (e) { showToast('Error', e?.message || 'Failed to remove certificate', 'error') }
      }

      const editMedicalStaff = (staff) => {
        clearAll('staff')
        medicalStaffModal.mode = 'edit'
        medicalStaffModal.activeTab = 'basic'
        medicalStaffModal.form = {
          ...staff,
          full_name: staff.full_name || '',
          professional_email: staff.professional_email || '', // empty string for the input field — null from DB becomes ''
          mobile_phone: staff.mobile_phone || '',
          department_id: staff.department_id || '',
          academic_degree: staff.academic_degree || '',
          specialization: staff.specialization || '',
          training_year: staff.training_year || '',
          clinical_certificate: staff.clinical_certificate || '',
          certificate_status: staff.certificate_status || '',
          medical_license: staff.medical_license || '',
          special_notes: staff.special_notes || '',
          other_certificate: staff.other_certificate || '',
          resident_category: staff.resident_category || null,
          home_department: staff.home_department || null,
          external_institution: staff.external_institution || null,
          can_supervise_residents: staff.can_supervise_residents || false,
          can_be_pi: staff.can_be_pi || false,
          can_be_coi: staff.can_be_coi || false,
          is_chief_of_department: staff.is_chief_of_department || false,
          is_research_coordinator: staff.is_research_coordinator || false,
          is_resident_manager: staff.is_resident_manager || false,
          is_oncall_manager: staff.is_oncall_manager || false,
          has_phd: staff.has_phd || false, phd_field: staff.phd_field || '',
          office_phone: staff.office_phone || '', years_experience: staff.years_experience || null,
          _coordLineId: null, // resolved post-load by research composable
          _investigadorLines: [],
          home_department_id: staff.home_department_id || null,
          has_medical_license: staff.has_medical_license || false,
          residency_start_date: staff.residency_start_date || null,
          residency_year_override: staff.residency_year_override || null,
          external_contact_name: staff.external_contact_name || null,
          external_contact_email: staff.external_contact_email || null,
          external_contact_phone: staff.external_contact_phone || null,
          clinical_study_certificates: Array.isArray(staff.clinical_study_certificates) ? [...staff.clinical_study_certificates] : [],
          hospital_id: staff.hospital_id || null,
          is_public: staff.is_public || false,
          public_bio: staff.public_bio || '',
          public_photo_url: staff.public_photo_url || '',
          _networkHint: null
        }
        medicalStaffModal.show = true
        medicalStaffModal._certs = []
        loadMedicalStaffModalCertificates(staff.id)
      }

      const saveMedicalStaff = async (saving) => {
        if (!validateStaff(medicalStaffModal.form)) { showToast('Validation Error', 'Please fix the highlighted fields', 'error'); return }
        saving.value = true
        try {
          const clean = v => (v == null) ? '' : String(v).trim()
          const f = medicalStaffModal.form
          const data = {
            full_name: f.full_name.trim(), staff_type: f.staff_type || 'medical_resident',
            staff_id: f.staff_id || Utils.generateId('MD'), employment_status: f.employment_status || 'active',
            professional_email: f.professional_email?.trim() || null, // send null not '' — Joi now accepts null
            department_id: f.department_id || currentUser?.value?.department_id || null,
            academic_degree: clean(f.academic_degree), academic_degree_id: f.academic_degree_id || null,
            specialization: clean(f.specialization),
            training_year: clean(f.training_year),
            residency_start_date: f.residency_start_date || null,
            residency_year_override: f.residency_year_override || null,
            clinical_certificate: clean(f.clinical_certificate),
            certificate_status: clean(f.certificate_status), mobile_phone: clean(f.mobile_phone),
            medical_license: clean(f.medical_license),
            has_medical_license: f.has_medical_license || false,
            can_supervise_residents: f.can_supervise_residents || false,
            other_certificate: clean(f.other_certificate),
            special_notes: clean(f.special_notes), resident_category: f.resident_category || null,
            home_department: f.home_department || null,
            home_department_id: f.home_department_id || null,
            external_institution: f.external_institution || null,
            external_contact_name: f.external_contact_name || null,
            external_contact_email: f.external_contact_email || null,
            external_contact_phone: f.external_contact_phone || null,
            is_research_coordinator: f.is_research_coordinator || false,
            is_resident_manager: f.is_resident_manager || false,
            is_oncall_manager:   f.is_oncall_manager   || false,
            can_be_pi: f.can_be_pi || false,
            can_be_coi: f.can_be_coi || false,
            has_phd: f.has_phd || false,
            phd_field: f.phd_field || null,
            office_phone: f.office_phone || null,
            years_experience: f.years_experience || null,
            hospital_id: f.hospital_id || null,
            clinical_study_certificates: f.clinical_study_certificates || [],
            is_public: f.is_public || false,
            public_bio: clean(f.public_bio),
            public_photo_url: f.public_photo_url?.trim() || null
          }
          let savedStaff
          if (medicalStaffModal.mode === 'add') {
            savedStaff = await API.createMedicalStaff(data)
            medicalStaff.value.unshift(savedStaff)
            showToast('Success', 'Medical staff added', 'success')
          } else {
            savedStaff = await API.updateMedicalStaff(f.id, data)
            const idx = medicalStaff.value.findIndex(s => s.id === savedStaff.id)
            if (idx !== -1) medicalStaff.value[idx] = savedStaff
            // FIX: also patch allStaffLookup so rotations, on-call, absences
            // all see the updated name immediately without a full page reload
            const lookupIdx = allStaffLookup.value.findIndex(s => s.id === savedStaff.id)
            if (lookupIdx !== -1) {
              allStaffLookup.value[lookupIdx] = {
                ...allStaffLookup.value[lookupIdx],
                full_name:         savedStaff.full_name,
                staff_type:        savedStaff.staff_type,
                employment_status: savedStaff.employment_status
              }
            } else {
              allStaffLookup.value.push({
                id: savedStaff.id,
                full_name: savedStaff.full_name,
                staff_type: savedStaff.staff_type,
                employment_status: savedStaff.employment_status
              })
            }
            // Show warnings if staff was marked inactive or type changed with future records
            if (savedStaff._warnings?.length) {
              savedStaff._warnings.forEach(w => {
                const isTermination = w.type === 'rotations_terminated'
                showToast(
                  isTermination ? '✓ Rotations updated' : '⚠ Action required',
                  w.message,
                  isTermination ? 'success' : 'warning'
                )
              })
            } else {
              showToast('Success', 'Medical staff updated', 'success')
            }
          }
          // If marked as research coordinator with a specific line, update that line's coordinator_id
          if (f.is_research_coordinator && f._coordLineId && savedStaff?.id) {
            try {
              await API.assignCoordinator(f._coordLineId, savedStaff.id)
              await loadResearchLines()
            } catch (e) { console.warn('Could not update research line coordinator:', e) }
          } else if (!f.is_research_coordinator && savedStaff?.id) {
            // If coordinator toggled OFF, clear coordinator_id from any line that had this person
            const coordinated = researchLines.value.filter(l => l.coordinator_id === savedStaff.id)
            for (const line of coordinated) {
              try { await API.assignCoordinator(line.id, null) } catch {}
            }
            if (coordinated.length) await loadResearchLines()
          }
          medicalStaffModal.show = false; clearAll('staff')
        } catch (e) { showToast('Error', e.message || 'Failed to save', 'error') }
        finally { saving.value = false }
      }

      // Raw deactivation — called by the main setup's orchestrated deletion workflow
      const deactivateStaffMember = async (staffId, staffName) => {
        await API.deleteMedicalStaff(staffId)
        medicalStaff.value = medicalStaff.value.filter(s => s.id !== staffId)
      }

      const isRoleTaken = (role) => {
        if (!medicalStaff.value) return false;
        const currentHolder = medicalStaff.value.find(staff => {
          switch (role) {
            case 'chief_of_department': return staff.is_chief_of_department;
            case 'research_coordinator': return staff.is_research_coordinator;
            case 'resident_manager': return staff.is_resident_manager;
            case 'oncall_manager': return staff.is_oncall_manager;
            default: return false;
          }
        });
        return currentHolder && currentHolder.id !== medicalStaffModal.form.id;
      }

      const getCurrentRoleHolder = (role) => {
        if (!medicalStaff.value) return null;
        return medicalStaff.value.find(staff => {
          switch (role) {
            case 'chief_of_department': return staff.is_chief_of_department;
            case 'research_coordinator': return staff.is_research_coordinator;
            case 'resident_manager': return staff.is_resident_manager;
            case 'oncall_manager': return staff.is_oncall_manager;
            default: return false;
          }
        }) || null;
      }

      const handleRoleAssignment = (role, checked) => {
        if (!checked) return;
        const currentHolder = getCurrentRoleHolder(role);
        if (currentHolder && currentHolder.id !== medicalStaffModal.form.id) {
          showConfirmation({
            title: 'Replace Role Holder', message: `${currentHolder.full_name} currently holds this role.`,
            details: `Are you sure you want to reassign it to ${medicalStaffModal.form.full_name}?`,
            icon: 'fa-exchange-alt', confirmButtonText: 'Yes, Reassign', confirmButtonClass: 'btn-warning',
            onConfirm: () => {
              const idx = medicalStaff.value.findIndex(s => s.id === currentHolder.id);
              if (idx !== -1) medicalStaff.value[idx][`is_${role}`] = false;
            }
          });
        }
      }

      const toggleCertificate = (cert) => {
        if (!medicalStaffModal.form.clinical_study_certificates) medicalStaffModal.form.clinical_study_certificates = [];
        const idx = medicalStaffModal.form.clinical_study_certificates.indexOf(cert);
        if (idx === -1) medicalStaffModal.form.clinical_study_certificates.push(cert);
        else medicalStaffModal.form.clinical_study_certificates.splice(idx, 1);
      }

      const availableCertificates = ['GCP - Good Clinical Practice','ICH Guidelines','Clinical Research Coordinator','CITI Program','HIPAA Certification','Responsible Conduct of Research'];

      return {
        medicalStaff, allStaffLookup, hospitalsList, clinicalUnits,
        staffFilters, staffProfileModal, medicalStaffModal,
        filteredMedicalStaff, filteredMedicalStaffAll, staffTotalPages,
        loadMedicalStaff, loadHospitals, addHospitalInline,
        loadMedicalStaffModalCertificates, saveCertificate, deleteCertificate,
        showAddMedicalStaffModal, editMedicalStaff, saveMedicalStaff, deactivateStaffMember,
        formatTrainingYear: Utils.formatTrainingYear, formatSpecialization: Utils.formatSpecialization, effectiveResidentYear: Utils.effectiveResidentYear,
        formatPhone: Utils.formatPhone, formatLicense: Utils.formatLicense,
        getResidentCategoryInfo: Utils.getResidentCategoryInfo, formatResidentCategorySimple: Utils.formatResidentCategorySimple,
        formatResidentCategoryDetailed: Utils.formatResidentCategoryDetailed, getResidentCategoryIcon: Utils.getResidentCategoryIcon,
        getResidentCategoryTooltip: Utils.getResidentCategoryTooltip, getRoleInfo: Utils.getRoleInfo, getStaffRoles: Utils.getStaffRoles,
        isRoleTaken, getCurrentRoleHolder, handleRoleAssignment, toggleCertificate, availableCertificates,
        addStaffTypeInline,
        staffView, compactStaffWithDividers,
        clearStaffFilters,
        hasActiveStaffFilters
      }
    }

    // ============ 6.4 useOnCall ============
    function useOnCall({ showToast, showConfirmation, paginate, totalPages, resetPage, applySort, setErr, clearAll, medicalStaff, allStaffLookup, absences }) {
      const onCallSchedule = ref([])
            const todaysOnCall = ref([])
      const loadingSchedule = ref(false)
      const onCallFilters = reactive({ date: '', shiftType: '', physician: '', coverageArea: '', search: '' })
      const debouncedOnCallSearch = ref('')
      watch(() => onCallFilters.search, Utils.debounce(v => { debouncedOnCallSearch.value = v }, 250))
      // ── Bulk On-call Scheduler ───────────────────────────────────
      const bulkOncall = Vue.reactive({
        show:     false,
        step:     1,         // 1=who/area/role  2=dates  3=review
        // Current block being configured
        current: {
          physician_id:   '',
          coverage_area_id: '',
          shift_type:     'primary_call',
          start_time:     '15:00',
          end_time:       '08:00',
        },
        // Calendar nav
        calYear:  new Date().getFullYear(),
        calMonth: new Date().getMonth(),   // 0-indexed
        // Queue: array of { physician_id, coverage_area_id, shift_type, start_time, end_time, dates[], conflicts[] }
        queue:    [],
        saving:   false,
        // Clone target
        cloneSource: null,  // queue index to clone dates from
      })

      // Calendar days for bulk picker
      const bulkCalDays = Vue.computed(() => {
        const year  = bulkOncall.calYear
        const month = bulkOncall.calMonth
        const firstDay = new Date(year, month, 1)
        const lastDay  = new Date(year, month + 1, 0)
        const startDow = (firstDay.getDay() + 6) % 7  // Mon=0
        const days = []
        // Pad start
        for (let i = startDow - 1; i >= 0; i--) {
          const d = new Date(year, month, -i)
          days.push({ date: Utils.normalizeDate(d), day: d.getDate(), otherMonth: true, selected: false, hasConflict: false })
        }
        // Real days
        for (let d = 1; d <= lastDay.getDate(); d++) {
          const dt   = new Date(year, month, d)
          const dateStr = Utils.normalizeDate(dt)
          const physId  = bulkOncall.current.physician_id
          // Check absence conflict
          const hasAbs = physId ? (absences?.value || []).some(a => {
            if (a.staff_member_id !== physId) return false
            const s = Utils.normalizeDate(a.start_date)
            const e = Utils.normalizeDate(a.end_date)
            return dateStr >= s && dateStr <= e && !['cancelled','returned_to_duty'].includes(a.current_status)
          }) : false
          // Is this date already selected in current block?
          const curBlock = bulkOncall.current._dates || []
          const selected = curBlock.includes(dateStr)
          days.push({ date: dateStr, day: d, otherMonth: false, selected, hasConflict: selected && hasAbs, isAbsent: hasAbs, isToday: dateStr === Utils.normalizeDate(new Date()) })
        }
        // Pad end
        const remaining = 42 - days.length
        for (let d = 1; d <= remaining; d++) {
          const dt = new Date(year, month + 1, d)
          days.push({ date: Utils.normalizeDate(dt), day: d, otherMonth: true, selected: false, hasConflict: false })
        }
        return days
      })

      const bulkToggleDate = (day) => {
        if (day.otherMonth) return
        if (!bulkOncall.current._dates) Vue.set ? Vue.set(bulkOncall.current, '_dates', []) : (bulkOncall.current._dates = [])
        const idx = bulkOncall.current._dates.indexOf(day.date)
        if (idx >= 0) bulkOncall.current._dates.splice(idx, 1)
        else bulkOncall.current._dates.push(day.date)
      }

      const bulkAddToQueue = () => {
        const cur = bulkOncall.current
        if (!cur.physician_id) { showToast('Validation', 'Select a clinician', 'warning'); return }
        if (!cur._dates || cur._dates.length === 0) { showToast('Validation', 'Select at least one date', 'warning'); return }
        const physId = cur.physician_id
        const absList = absences?.value || []
        const dates = [...(cur._dates || [])].sort()
        const conflicts = dates.filter(dateStr => absList.some(a => {
          if (a.staff_member_id !== physId) return false
          const s = Utils.normalizeDate(a.start_date)
          const e = Utils.normalizeDate(a.end_date)
          return dateStr >= s && dateStr <= e && !['cancelled','returned_to_duty'].includes(a.current_status)
        }))
        bulkOncall.queue.push({
          physician_id:     cur.physician_id,
          coverage_area_id: cur.coverage_area_id || null,
          shift_type:       cur.shift_type,
          start_time:       cur.start_time,
          end_time:         cur.end_time,
          dates,
          conflicts,
        })
        // Reset current for next clinician
        Object.assign(bulkOncall.current, { physician_id: '', coverage_area_id: '', shift_type: 'primary_call', start_time: '15:00', end_time: '08:00', _dates: [] })
        bulkOncall.step = 1
      }

      const bulkClone = (sourceIdx) => {
        const source = bulkOncall.queue[sourceIdx]
        if (!source) return
        bulkOncall.current._dates = [...source.dates]
        bulkOncall.current.coverage_area_id = source.coverage_area_id
        bulkOncall.current.shift_type = source.shift_type
        bulkOncall.current.start_time = source.start_time
        bulkOncall.current.end_time   = source.end_time
        bulkOncall.step = 1
      }

      const bulkTotalShifts = Vue.computed(() => bulkOncall.queue.reduce((sum, b) => sum + b.dates.length, 0))
      const bulkTotalConflicts = Vue.computed(() => bulkOncall.queue.reduce((sum, b) => sum + b.conflicts.length, 0))

      const bulkSave = async () => {
        if (bulkOncall.queue.length === 0) { showToast('Empty', 'Add at least one block to the queue', 'warning'); return }
        bulkOncall.saving = true
        try {
          const shifts = []
          bulkOncall.queue.forEach(block => {
            block.dates.forEach(dateStr => {
              shifts.push({
                duty_date:            dateStr,
                shift_type:           block.shift_type,
                coverage_area_id:     block.coverage_area_id,
                primary_physician_id: block.physician_id,
                start_time:           block.start_time,
                end_time:             block.end_time,
                has_conflict:         block.conflicts.includes(dateStr),
              })
            })
          })
          await API.batchCreateOnCall(shifts)
          showToast('Saved', `${shifts.length} on-call shifts created`, 'success')
          bulkOncall.show = false
          bulkOncall.queue = []
          bulkOncall.step = 1
          await loadOnCallSchedule()
        } catch(e) {
          if (e.message?.includes('Duplicate')) {
            showToast('Conflict', 'Some dates already have a primary for that area. Review and retry.', 'error')
          } else {
            showToast('Error', e.message || 'Batch save failed', 'error')
          }
        } finally { bulkOncall.saving = false }
      }

      const openBulkOncall = () => {
        bulkOncall.show  = true
        bulkOncall.step  = 1
        bulkOncall.queue = []
        Object.assign(bulkOncall.current, { physician_id: '', coverage_area_id: '', shift_type: 'primary_call', start_time: '15:00', end_time: '08:00', _dates: [] })
        bulkOncall.calYear  = new Date().getFullYear()
        bulkOncall.calMonth = new Date().getMonth()
      }

      const onCallModal = reactive({
        show: false, mode: 'add',
        showBackup: false,  // progressive disclosure — expands when user clicks "+ Assign backup"
        form: { duty_date: Utils.normalizeDate(new Date()), shift_type: 'primary_call', coverage_area_id: '', start_time: '15:00', end_time: '08:00', primary_physician_id: '', backup_physician_id: '', coverage_notes: '' }
      })

      const getPhysicianName = (id) => {
        if (!id) return 'Not assigned'
        const s = allStaffLookup?.value?.find(x => x.id === id) || medicalStaff.value.find(x => x.id === id)
        return s?.full_name || 'Not assigned'
      }
      const formatStaffType = (t) => formatStaffTypeGlobal(t)

      const validateOnCall = (form) => {
        clearAll('oncall'); let ok = true
        if (!form.duty_date) { setErr('oncall', 'duty_date', 'Date is required'); ok = false }
        if (!form.primary_physician_id) { setErr('oncall', 'primary_physician_id', 'Please select a physician'); ok = false }
        if (!form.start_time) { setErr('oncall', 'start_time', 'Start time is required'); ok = false }
        if (!form.end_time) { setErr('oncall', 'end_time', 'End time is required'); ok = false }
        return ok
      }

      const checkExistingSchedule = async (date, shiftType, excludeId = null, coverageAreaId = null) => {
        // Uniqueness rules:
        // • primary_call WITH area  → one per area per day
        // • primary_call WITHOUT area → one per day (no area assigned, global slot)
        // • backup_call / float → no global uniqueness enforced client-side
        try {
          const normalizedDate = Utils.normalizeDate(date)
          if (shiftType === 'primary_call') {
            return onCallSchedule.value.some(s => {
              if (Utils.normalizeDate(s.duty_date) !== normalizedDate) return false
              if (s.shift_type !== 'primary_call') return false
              if (excludeId && s.id === excludeId) return false
              const sArea = s.coverage_area_id || s.coverage_area?.id || null
              // Same area (both set + matching) OR both have no area
              return coverageAreaId
                ? sArea === coverageAreaId
                : !sArea
            })
          }
          return false // backup/float: no client-side duplicate block
        } catch (error) { console.error('Failed to check existing schedule:', error); return false }
      }

      const deriveOnCallStatus = (s) => {
        const today = Utils.normalizeDate(new Date())
        const d = Utils.normalizeDate(s.duty_date)
        if (d < today)  return 'completed'
        if (d === today) return 'today'
        return 'upcoming'
      }

      const filteredOnCallAll = computed(() => {
        let f = onCallSchedule.value
        // Default: hide past shifts unless user explicitly filters to a past date or searches
        const today = Utils.normalizeDate(new Date())
        if (!onCallFilters.date && !debouncedOnCallSearch.value) {
          f = f.filter(s => Utils.normalizeDate(s.duty_date) >= today)
        }
        if (onCallFilters.date) f = f.filter(s => Utils.normalizeDate(s.duty_date) === onCallFilters.date)
        if (onCallFilters.shiftType) f = f.filter(s => s.shift_type === onCallFilters.shiftType)
        if (onCallFilters.physician) f = f.filter(s => s.primary_physician_id === onCallFilters.physician || s.backup_physician_id === onCallFilters.physician)
        // M6 FIX: coverage_area is not a real DB column — filter on coverage_notes instead
        if (onCallFilters.coverageArea) f = f.filter(s => s.coverage_area_id === onCallFilters.coverageArea || s.coverage_area?.id === onCallFilters.coverageArea)
        if (debouncedOnCallSearch.value) {
          const q = debouncedOnCallSearch.value.toLowerCase()
          f = f.filter(s => getPhysicianName(s.primary_physician_id).toLowerCase().includes(q) || (s.coverage_notes || '').toLowerCase().includes(q))
        }
        return applySort(f, 'oncall')
      })

      const filteredOnCallSchedules = computed(() => paginate(filteredOnCallAll.value, 'oncall'))
      const oncallTotalPages = computed(() => totalPages(filteredOnCallAll.value, 'oncall'))
      const todaysOnCallCount = computed(() => todaysOnCall.value.length)

      // Groups ALL on-call schedules by physician for the compact orb view
      const staffWithOnCallOrbs = computed(() => {
        const today = Utils.normalizeDate(new Date())
        // Respect same filters as detailed view
        let shifts = onCallSchedule.value || []
        // Default: hide past shifts unless date filter or search is active
        if (!onCallFilters.date && !debouncedOnCallSearch.value) {
          shifts = shifts.filter(s => Utils.normalizeDate(s.duty_date) >= today)
        }
        if (onCallFilters.date)       shifts = shifts.filter(s => Utils.normalizeDate(s.duty_date) === onCallFilters.date)
        if (onCallFilters.shiftType)  shifts = shifts.filter(s => s.shift_type === onCallFilters.shiftType)
        if (onCallFilters.coverageArea) shifts = shifts.filter(s => s.coverage_area_id === onCallFilters.coverageArea || s.coverage_area?.id === onCallFilters.coverageArea)
        if (onCallFilters.physician)  shifts = shifts.filter(s => s.primary_physician_id === onCallFilters.physician || s.backup_physician_id === onCallFilters.physician)
        if (debouncedOnCallSearch.value) {
          const q = debouncedOnCallSearch.value.toLowerCase()
          shifts = shifts.filter(s => getPhysicianName(s.primary_physician_id).toLowerCase().includes(q) || (s.coverage_notes || '').toLowerCase().includes(q))
        }
        const map = {}
        shifts.forEach(shift => {
          const dutyDate = Utils.normalizeDate(shift.duty_date)
          const id = shift.primary_physician_id
          if (!id) return
          const staff = allStaffLookup?.value?.find(s => s.id === id) || medicalStaff.value.find(s => s.id === id)
          if (!staff) return
          if (!map[id]) map[id] = {
            id, name: staff.full_name, staffType: staff.staff_type,
            full_name: staff.full_name, staff_type: staff.staff_type,
            professional_email: staff.professional_email || '',
            department_id: staff.department_id || null,
            employment_status: staff.employment_status,
            shifts: []
          }
          const areaObj = shift.coverage_area || (coverageAreas?.value || []).find(a => a.id === shift.coverage_area_id) || null
          map[id].shifts.push({
            ...shift, dutyDate,
            isToday: dutyDate === today,
            isPast:  dutyDate < today,
            dayLabel:  new Date(dutyDate + 'T12:00:00').toLocaleDateString('en', { weekday: 'short' }),
            dateLabel: new Date(dutyDate + 'T12:00:00').toLocaleDateString('en', { day: 'numeric', month: 'short' }),
            areaName:  areaObj?.name  || null,
            areaColor: areaObj?.color || null,
            backupName: shift.backup_physician_id ? ((allStaffLookup?.value?.find(s => s.id === shift.backup_physician_id) || medicalStaff.value.find(s => s.id === shift.backup_physician_id))?.full_name || null) : null
          })
        })
        Object.values(map).forEach(p => p.shifts.sort((a, b) => a.dutyDate.localeCompare(b.dutyDate)))
        return Object.values(map).sort((a, b) => a.name.localeCompare(b.name))
      })

      watch(onCallFilters, () => resetPage('oncall'), { deep: true })

      const existingSchedulesForDate = computed(() => {
        if (!onCallModal.form.duty_date) return [];
        return onCallSchedule.value.filter(s => Utils.normalizeDate(s.duty_date) === Utils.normalizeDate(onCallModal.form.duty_date));
      })

      // ── Moment A: on-call modal — physician has an absence on the selected date ──
      const onCallAbsenceConflict = computed(() => {
        const pid  = onCallModal.form.primary_physician_id
        const date = onCallModal.form.duty_date
        if (!pid || !date) return null
        const normalised = Utils.normalizeDate(date)
        const hit = (absences?.value || []).find(a => {
          if (a.staff_member_id !== pid) return false
          if (['cancelled', 'returned_to_duty'].includes(a.current_status)) return false
          const s = Utils.normalizeDate(a.start_date)
          const e = Utils.normalizeDate(a.end_date || a.start_date)
          return normalised >= s && normalised <= e
        })
        if (!hit) return null
        const reasonMap = { vacation: 'Vacation', sick_leave: 'Sick leave', conference: 'Conference', training: 'Training', personal: 'Personal leave', other: 'Absence' }
        const reason = reasonMap[hit.absence_reason] || 'Absence'
        const from   = new Date(hit.start_date + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
        const to     = new Date(hit.end_date   + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
        return { reason, from, to, status: hit.current_status }
      })

      // absenceOnCallConflict moved to root setup (line ~6200)
      // where both absenceModal and onCallSchedule are in scope

      // Returns inline style for on-call calendar shift chips based on coverage area colour.
      // Extracted from template because Vue's compiler rejects IIFEs with const declarations.
      const oncallChipStyle = (shift) => {
        const c = coverageAreas.value?.find(a => a.id === shift.coverage_area_id)?.color || '#00b3b3'
        const r = parseInt(c.slice(1,3) || '00', 16)
        const g = parseInt(c.slice(3,5) || 'b3', 16)
        const b2 = parseInt(c.slice(5,7) || 'b3', 16)
        return { color: c, background: `rgba(${r},${g},${b2},.1)`, borderLeft: `2px solid ${c}` }
      }

      const loadOnCallSchedule = async () => {
        loadingSchedule.value = true
        try {
          const raw = await API.getOnCallSchedule()
          onCallSchedule.value = raw.map(s => ({ ...s, duty_date: Utils.normalizeDate(s.duty_date) }))
        } catch { showToast('Error', 'Failed to load on-call schedule', 'error') }
        finally { loadingSchedule.value = false }
      }

      const loadTodaysOnCall = async () => {
        try {
          const data = await API.getOnCallToday()
          todaysOnCall.value = data.map(item => {
            const startTime = item.start_time?.substring(0, 5) || 'N/A'
            const endTime = item.end_time?.substring(0, 5) || 'N/A'
            const isPrimary = ['primary_call', 'primary'].includes(item.shift_type || '')
            const matchingStaff = medicalStaff.value.find(s => s.id === item.primary_physician_id)
            return {
              id: item.id, startTime, endTime,
              physicianName: item.primary_physician?.full_name || 'Unknown Physician',
              shiftTypeDisplay: isPrimary ? 'Primary' : 'Backup',
              shiftTypeClass: isPrimary ? 'badge-primary' : 'badge-secondary',
              shiftType: isPrimary ? 'Primary' : 'Backup',
              staffType: matchingStaff ? formatStaffType(matchingStaff.staff_type) : 'Physician',
              coverageArea: item.coverage_notes || 'General Coverage',
              backupPhysician: item.backup_physician?.full_name || null,
              contactInfo: item.primary_physician?.professional_email || 'No contact info', raw: item
            }
          })
        } catch (e) { todaysOnCall.value = []; console.error('[neumDesk] loadTodaysOnCall failed:', e) }
      }

      const showAddOnCallModal = (physician = null) => {
        clearAll('oncall')
        onCallModal.mode = 'add'
        onCallModal.showBackup = false  // collapsed by default for new shifts
        Object.assign(onCallModal.form, {
          duty_date: Utils.normalizeDate(new Date()), shift_type: 'primary_call',
          coverage_area_id: '',
          start_time: '15:00', end_time: '08:00',
          primary_physician_id: physician?.id || '',
          backup_physician_id: '', coverage_notes: ''
          // schedule_id is generated server-side — do not set here
        })
        onCallModal.show = true
      }

      const editOnCallSchedule = (schedule) => {
        clearAll('oncall')
        onCallModal.mode = 'edit'
        const raw = schedule.shift_type || 'primary_call'
        onCallModal.form = {
          ...schedule, duty_date: Utils.normalizeDate(schedule.duty_date),
          shift_type: raw === 'float_physician' ? 'float_physician' : ['primary', 'primary_call'].includes(raw) ? 'primary_call' : 'backup_call',
          coverage_area_id: schedule.coverage_area_id || schedule.coverage_area?.id || '',
          coverage_notes: schedule.coverage_notes || ''
        }
        // Auto-expand backup field if one is already assigned
        onCallModal.showBackup = !!(schedule.backup_physician_id)
        onCallModal.show = true
      }

      const saveOnCallSchedule = async (saving) => {
        if (!validateOnCall(onCallModal.form)) { showToast('Validation Error', 'Please fix the highlighted fields', 'error'); return }

        // ── Absence conflict check ──────────────────────────────────────────
        const f0 = onCallModal.form
        if (f0.primary_physician_id && f0.duty_date) {
          const dutyDate  = Utils.normalizeDate(f0.duty_date)
          const absList   = absences?.value || []
          const onAbsence = absList.filter(a => {
            if (a.staff_member_id !== f0.primary_physician_id) return false
            const s = Utils.normalizeDate(a.start_date)
            const e = Utils.normalizeDate(a.end_date)
            return dutyDate >= s && dutyDate <= e && !['cancelled','returned_to_duty'].includes(a.current_status)
          })
          if (onAbsence.length > 0) {
            const abs     = onAbsence[0]
            const staffName = medicalStaff.value.find(x => x.id === f0.primary_physician_id)?.full_name || 'This physician'
            const reason  = abs.absence_reason?.replace(/_/g,' ') || 'absence'
            const fmt     = (d) => new Date(d + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
            let proceed = false
            await new Promise((resolve) => {
              showConfirmation({
                title: '⚠️ Physician On Absence',
                message: `${staffName} is recorded as absent on this date (${reason}).`,
                details: `Absence period: ${fmt(abs.start_date)} → ${fmt(abs.end_date)}`,
                icon: 'fa-user-slash',
                confirmButtonText: 'Schedule Anyway',
                confirmButtonClass: 'btn-danger',
                onConfirm: () => { proceed = true; resolve() },
                onCancel:  () => resolve()
              })
            })
            if (!proceed) { saving.value = false; return }
          }
        }

        saving.value = true
        try {
          const f = onCallModal.form
          const data = {
            duty_date: Utils.normalizeDate(f.duty_date), shift_type: f.shift_type || 'primary_call',
            start_time: f.start_time || '15:00', end_time: f.end_time || '08:00',
            primary_physician_id: f.primary_physician_id, backup_physician_id: f.backup_physician_id || null,
            coverage_notes: f.coverage_notes || '',
            coverage_area_id: f.coverage_area_id || null
            // schedule_id omitted — backend always generates a collision-safe ID
          }
          if (onCallModal.mode === 'add') {
            const exists = await checkExistingSchedule(data.duty_date, data.shift_type, null, data.coverage_area_id);
            if (exists) { showToast('Duplicate', `A ${data.shift_type === 'primary_call' ? 'Primary Call' : data.shift_type === 'backup_call' ? 'Backup Call' : 'Float'} shift already exists for this date${data.coverage_area_id ? ' and area' : ''}.`, 'warning'); saving.value = false; return; }
          }
          if (onCallModal.mode === 'edit') {
            const exists = await checkExistingSchedule(data.duty_date, data.shift_type, f.id, data.coverage_area_id);
            if (exists) { showToast('Duplicate Schedule', `Another ${data.shift_type === 'primary_call' ? 'primary' : 'backup'} shift already exists for this date.`, 'warning'); saving.value = false; return; }
          }
          if (onCallModal.mode === 'add') {
            const result = await API.createOnCall(data);
            onCallSchedule.value.unshift({ ...result, duty_date: Utils.normalizeDate(result.duty_date) });
            showToast('Success', 'On-call scheduled', 'success');
          } else {
            const result = await API.updateOnCall(f.id, data);
            const idx = onCallSchedule.value.findIndex(s => s.id === result.id);
            if (idx !== -1) onCallSchedule.value[idx] = { ...result, duty_date: Utils.normalizeDate(result.duty_date) };
            showToast('Success', 'On-call updated', 'success');
          }
          onCallModal.show = false; clearAll('oncall'); await loadTodaysOnCall();
        } catch (e) {
          if (e.message && e.message.includes('duplicate key')) showToast('Error', 'A schedule for this shift type already exists on this date', 'error');
          else showToast('Error', e.message || 'Failed to save on-call', 'error');
        } finally { saving.value = false }
      }

      const deleteOnCallSchedule = (schedule) => showConfirmation({
        title: 'Delete On-Call', message: 'Delete this on-call schedule?',
        icon: 'fa-trash', confirmButtonText: 'Delete', confirmButtonClass: 'btn-danger',
        details: `Physician: ${getPhysicianName(schedule.primary_physician_id)}`,
        onConfirm: async () => {
          try {
            await API.deleteOnCall(schedule.id)
            onCallSchedule.value = onCallSchedule.value.filter(s => s.id !== schedule.id)
            showToast('Success', 'Schedule deleted', 'success')
            loadTodaysOnCall()
          } catch (e) {
            showToast('Error', e?.message || 'Failed to delete schedule', 'error')
            await loadOnCallSchedule()
          }
        }
      })

      const contactPhysician = (shift) => {
        if (shift.contactInfo && shift.contactInfo !== 'No contact info')
          showToast('Contact Physician', `Contact ${shift.physicianName}: ${shift.contactInfo}`, 'info')
        else showToast('No Contact Info', `No contact info for ${shift.physicianName}`, 'warning')
      }

      // ============ [NEW] Compact view computed properties for On-Call ============
      const groupedOnCallSchedules = computed(() => {
        const groups = {}
        
        onCallSchedule.value.forEach(shift => {
          const date = Utils.normalizeDate(shift.duty_date)

          // Apply filters BEFORE creating the bucket — prevents empty date headers
          if (onCallFilters.date && date !== onCallFilters.date) return
          if (onCallFilters.shiftType && shift.shift_type !== onCallFilters.shiftType) return
          if (onCallFilters.physician && shift.primary_physician_id !== onCallFilters.physician &&
              shift.backup_physician_id !== onCallFilters.physician) return
          if (debouncedOnCallSearch.value) {
            const physicianName = getPhysicianName(shift.primary_physician_id).toLowerCase()
            if (!physicianName.includes(debouncedOnCallSearch.value.toLowerCase())) return
          }

          if (!groups[date]) {
            groups[date] = {
              date,
              dayOfWeek: new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long' }),
              shifts: []
            }
          }

          groups[date].shifts.push(shift)
        })
        
        return Object.values(groups).sort((a, b) => a.date.localeCompare(b.date))
      })

      const isShiftActive = (shift) => {
        if (!shift.duty_date) return false
        const today = Utils.normalizeDate(new Date())
        const shiftDate = Utils.normalizeDate(shift.duty_date)
        if (shiftDate !== today) return false
        const now = new Date()
        const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
        const s = shift.start_time, e = shift.end_time
        const overnight = s > e  // e.g. "15:00" > "08:00" means it crosses midnight
        return overnight
          ? (currentTime >= s || currentTime <= e)
          : (currentTime >= s && currentTime <= e)
      }

      // ── Upcoming on-call: next 14 days grouped by date (for dashboard) ──
      const upcomingOnCallDays = computed(() => {
        const today    = Utils.normalizeDate(new Date())
        const cutoff   = Utils.normalizeDate(new Date(Date.now() + 14 * 86400000))
        const fmt      = (d) => new Date(d + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })
        const dayLabel = (d) => {
          const tomorrow = Utils.normalizeDate(new Date(Date.now() + 86400000))
          if (d === today)    return 'Today'
          if (d === tomorrow) return 'Tomorrow'
          return fmt(d)
        }

        // ── Helpers ───────────────────────────────────────────────────────
        // Check if a physician is on absence for a given date
        const isOnAbsence = (physicianId, dateStr) => {
          if (!physicianId) return false
          return (absences?.value || []).some(a => {
            if (a.staff_member_id !== physicianId) return false
            if (['cancelled','returned_to_duty'].includes(a.current_status)) return false
            const s = Utils.normalizeDate(a.start_date)
            const e = Utils.normalizeDate(a.end_date || a.start_date)
            return dateStr >= s && dateStr <= e
          })
        }

        // Count how many of the last N days this physician has a primary call
        const consecutiveNights = (physicianId, dateStr) => {
          if (!physicianId) return 0
          let count = 0
          for (let i = 1; i <= 6; i++) {
            const d = Utils.normalizeDate(new Date(new Date(dateStr + 'T12:00:00').getTime() - i * 86400000))
            const hadCall = (onCallSchedule.value || []).some(s =>
              Utils.normalizeDate(s.duty_date) === d &&
              s.primary_physician_id === physicianId &&
              ['primary_call','primary'].includes(s.shift_type)
            )
            if (hadCall) count++
            else break
          }
          return count
        }

        // Count calls this month for a physician
        const callsThisMonth = (physicianId) => {
          if (!physicianId) return 0
          const now = new Date()
          const monthStart = Utils.normalizeDate(new Date(now.getFullYear(), now.getMonth(), 1))
          const monthEnd   = Utils.normalizeDate(new Date(now.getFullYear(), now.getMonth() + 1, 0))
          return (onCallSchedule.value || []).filter(s =>
            s.primary_physician_id === physicianId &&
            ['primary_call','primary'].includes(s.shift_type) &&
            Utils.normalizeDate(s.duty_date) >= monthStart &&
            Utils.normalizeDate(s.duty_date) <= monthEnd
          ).length
        }

        // Enrich a schedule slot with intelligence flags
        const enrich = (s, dateStr) => {
          if (!s) return s
          const pid = s.primary_physician_id
          const consec = consecutiveNights(pid, dateStr)
          return {
            ...s,
            _onAbsence:  isOnAbsence(pid, dateStr),
            _consecutive: consec,           // nights in a row BEFORE this one
            _callsMonth:  callsThisMonth(pid)
          }
        }

        // ── Build map ─────────────────────────────────────────────────────
        const map = {}
        ;(onCallSchedule.value || []).forEach(s => {
          const d = Utils.normalizeDate(s.duty_date)
          if (d < today || d > cutoff) return
          if (!map[d]) map[d] = { date: d, label: dayLabel(d), isToday: d === today, areas: [], noArea: { primary: null, backup: null } }
          const areaId    = s.coverage_area_id || null
          const areaObj   = s.coverage_area || (coverageAreas?.value || []).find(a => a.id === areaId) || null
          const areaName  = areaObj?.name  || null
          const areaColor = areaObj?.color || '#00b3b3'
          if (areaId) {
            let slot = map[d].areas.find(a => a.id === areaId)
            if (!slot) { slot = { id: areaId, name: areaName, color: areaColor, primary: null, backup: null }; map[d].areas.push(slot) }
            if (['primary_call','primary'].includes(s.shift_type)) slot.primary = enrich(s, d)
            else if (s.shift_type === 'backup_call') slot.backup = s
          } else {
            if (['primary_call','primary'].includes(s.shift_type)) map[d].noArea.primary = enrich(s, d)
            else if (s.shift_type === 'backup_call') map[d].noArea.backup = s
          }
        })

        // ── Inject gap rows — only for areas marked as requiring daily coverage ──
        const requiredAreas = (coverageAreas?.value || []).filter(a => a.is_active && a.requires_coverage)
        Object.keys(map).forEach(dateStr => {
          const day = map[dateStr]
          requiredAreas.forEach(area => {
            const covered = day.areas.some(a => a.id === area.id)
            if (!covered) {
              day.areas.push({
                id: area.id, name: area.name, color: area.color,
                primary: null, backup: null, _gap: true
              })
            }
          })
          // Sort: covered areas first, gaps last; within each group alphabetical
          day.areas.sort((a, b) => {
            if (a._gap && !b._gap) return 1
            if (!a._gap && b._gap) return -1
            return (a.name || '').localeCompare(b.name || '')
          })
        })

        return Object.values(map).sort((a,b) => a.date.localeCompare(b.date))
      })

      // ── Coverage Areas ──────────────────────────────────────────────────
      const coverageAreas = ref([])

      // Filtered by applies_weekends when scheduling on a weekend date
      const filteredCoverageAreas = computed(() => {
        const date = onCallModal.form.duty_date
        if (!date) return coverageAreas.value.filter(a => a.is_active !== false)
        const dow = new Date(date + 'T12:00:00').getDay() // 0=Sun, 6=Sat
        const isWeekend = dow === 0 || dow === 6
        return coverageAreas.value.filter(a => {
          if (a.is_active === false) return false
          if (isWeekend && a.applies_weekends === false) return false
          return true
        })
      })

      const coverageAreaModal = reactive({
        show: false, mode: 'add',
        form: { id: null, name: '', code: '', color: '#00b3b3', applies_weekends: true, requires_coverage: false, is_active: true, display_order: 0 }
      })

      const loadCoverageAreas = async () => {
        try {
          const data = await API.getCoverageAreas()
          if (Array.isArray(data)) {
            coverageAreas.value = data
          } else if (data?.data && Array.isArray(data.data)) {
            coverageAreas.value = data.data
          }
        } catch (e) {
          if (e.message?.includes('not found') || e.message?.includes('42P01')) {
            coverageAreas.value = []
          }
        }
      }

      const showAddCoverageAreaModal = () => {
        coverageAreaModal.mode = 'add'
        Object.assign(coverageAreaModal.form, {
          id: null, name: '', code: '', color: '#00b3b3', applies_weekends: true, requires_coverage: false, is_active: true, display_order: 0
        })
        coverageAreaModal.show = true
      }

      const editCoverageArea = (area) => {
        coverageAreaModal.mode = 'edit'
        Object.assign(coverageAreaModal.form, {
          ...area,
          is_active: area.is_active !== false  // default true if undefined
        })
        coverageAreaModal.show = true
      }

      const saveCoverageArea = async () => {
        const f = coverageAreaModal.form
        if (!f.name?.trim()) { showToast('Validation', 'Area name is required', 'error'); return }
        if (!f.code?.trim()) {
          f.code = f.name.toUpperCase().replace(/[^A-Z0-9]/g, '_').replace(/_+/g, '_').slice(0, 10)
        }
        try {
          const payload = {
            name: f.name.trim(), code: f.code.trim().toUpperCase(),
            color: f.color || '#00b3b3', applies_weekends: f.applies_weekends !== false,
            requires_coverage: f.requires_coverage === true,
            is_active: f.is_active !== false,
            display_order: parseInt(f.display_order) || 0
          }
          if (coverageAreaModal.mode === 'add') {
            const result = await API.createCoverageArea(payload)
            const newArea = result?.data || result
            if (newArea?.id) coverageAreas.value.push(newArea)
            else await loadCoverageAreas()
            showToast('Success', 'Coverage area added', 'success')
          } else {
            const result = await API.updateCoverageArea(f.id, payload)
            const updated = result?.data || result
            const idx = coverageAreas.value.findIndex(a => a.id === f.id)
            if (idx !== -1 && updated?.id) coverageAreas.value[idx] = updated
            else await loadCoverageAreas()
            showToast('Success', 'Coverage area updated', 'success')
          }
          coverageAreaModal.show = false
        } catch (e) {
          showToast('Error', e.message || 'Failed to save coverage area', 'error')
        }
      }

      const deleteCoverageArea = (area) => {
        showConfirmation({
          title: 'Delete Coverage Area', message: `Delete "${area.name}"?`,
          icon: 'fa-trash', confirmButtonText: 'Delete', confirmButtonClass: 'btn-danger',
          details: 'Existing on-call shifts using this area will have their area cleared.',
          onConfirm: async () => {
            try {
              await API.deleteCoverageArea(area.id)
              coverageAreas.value = coverageAreas.value.filter(a => a.id !== area.id)
              showToast('Deleted', `${area.name} removed`, 'success')
            } catch (e) {
              showToast('Error', e.message || 'Failed to delete coverage area', 'error')
            }
          }
        })
      }

      return {
        onCallSchedule, todaysOnCall, loadingSchedule, onCallFilters, onCallModal,
        filteredOnCallSchedules, filteredOnCallAll, oncallTotalPages, todaysOnCallCount,
        loadOnCallSchedule, loadCoverageAreas, coverageAreas, filteredCoverageAreas, coverageAreaModal, showAddCoverageAreaModal, editCoverageArea, saveCoverageArea, deleteCoverageArea, loadTodaysOnCall, showAddOnCallModal,
        editOnCallSchedule, saveOnCallSchedule, bulkOncall, bulkCalDays, bulkToggleDate, bulkAddToQueue, bulkClone, bulkTotalShifts, bulkTotalConflicts, bulkSave, openBulkOncall, deleteOnCallSchedule, contactPhysician,
        onCallAbsenceConflict,
        // absenceOnCallConflict exposed at root level
        oncallChipStyle,
        // NEW compact view properties
        groupedOnCallSchedules,
        isShiftActive,
        staffWithOnCallOrbs,
        upcomingOnCallDays,
        getPhysicianName
      }
    }

    // ============ 6.5 useRotations ============
    function useRotations({ showToast, showConfirmation, paginate, totalPages, resetPage, applySort, setErr, clearAll, medicalStaff, allStaffLookup, trainingUnits, rotations, currentUser }) {
      // rotations is a shared ref hoisted in main setup — do not redeclare
      const rotationFilters = reactive({ resident: '', status: '', trainingUnit: '', supervisor: '', search: '' })
      const debouncedRotationSearch = ref('')
      watch(() => rotationFilters.search, Utils.debounce(v => { debouncedRotationSearch.value = v }, 250))
      const rotationModal = reactive({
        show: false, mode: 'add',
        form: { rotation_id: '', resident_id: '', training_unit_id: '', start_date: Utils.normalizeDate(new Date()), end_date: Utils.normalizeDate(new Date(Date.now() + 30 * 86400000)), rotation_status: 'scheduled', rotation_category: 'clinical_rotation', supervising_attending_id: '' },
        availability: null,  // result from /api/rotations/availability
        checkingAvailability: false
      })

      // ── Rotation availability watcher — checks before save ──────
      // Debounced: fires when unit + dates are all set
      let _availCheckTimer = null
      const checkRotationAvailability = () => {
        clearTimeout(_availCheckTimer)
        const { training_unit_id, resident_id, start_date, end_date } = rotationModal.form
        if (!training_unit_id || !start_date || !end_date) { rotationModal.availability = null; return }
        _availCheckTimer = setTimeout(async () => {
          rotationModal.checkingAvailability = true
          try {
            const params = { training_unit_id, start_date, end_date }
            if (resident_id) params.resident_id = resident_id
            if (rotationModal.mode === 'edit' && rotationModal.form.id) params.exclude_id = rotationModal.form.id
            rotationModal.availability = await API.checkRotationAvailability(params)
          } catch { rotationModal.availability = null }
          finally { rotationModal.checkingAvailability = false }
        }, 500)
      }

      const pendingActivations = ref([])
      const activationModal = reactive({ show: false, rotations: [], selectedRotation: null, notes: '', action: 'activate' })

      const getResidentName = (id) => {
        if (!id) return 'Not assigned'
        const s = allStaffLookup?.value?.find(x => x.id === id) || medicalStaff.value.find(x => x.id === id)
        return s?.full_name || 'Not assigned'
      }
      const getTrainingUnitName = (id) => trainingUnits.value.find(u => u.id === id)?.unit_name || 'Not assigned'

      // Capacity info for rotation modal — reactive to selected unit
      const selectedUnitCapacity = computed(() => {
        const unitId = rotationModal.form.training_unit_id
        if (!unitId) return null
        const unit = trainingUnits.value.find(u => u.id === unitId)
        if (!unit) return null
        const editId = rotationModal.mode === 'edit' ? rotationModal.form.id : null
        const current = rotations.value.filter(r =>
          r.training_unit_id === unitId &&
          ['active', 'scheduled'].includes(r.rotation_status) &&
          r.id !== editId
        ).length
        const max = unit.maximum_residents || 5
        return { current, max, full: current >= max, warn: current / max >= 0.8, pct: Math.min(100, Math.round((current / max) * 100)) }
      })

      const checkAndUpdateRotations = async (requireValidation = true) => {
        const today = new Date(); today.setHours(0, 0, 0, 0)
        const todayStr = Utils.localDateStr(today)  // local date — not UTC
        const updates = [], pending = []

        rotations.value.forEach(rotation => {
          const startDate = new Date(Utils.normalizeDate(rotation.start_date) + 'T00:00:00')
          const endDate = new Date(Utils.normalizeDate(rotation.end_date) + 'T23:59:59')
          if (rotation.rotation_status === 'scheduled' && Utils.normalizeDate(startDate) <= todayStr) {
            if (requireValidation) pending.push({ ...rotation, action: 'activate', message: `Rotation for ${getResidentName(rotation.resident_id)} at ${getTrainingUnitName(rotation.training_unit_id)} should start today.` })
            else updates.push(updateRotationStatus(rotation.id, 'active', { activated_at: new Date().toISOString(), activated_by: 'system', notes: 'Auto-activated on start date' }))
          }
          if (rotation.rotation_status === 'active' && Utils.normalizeDate(endDate) < todayStr) {
            if (requireValidation) pending.push({ ...rotation, action: 'complete', message: `Rotation for ${getResidentName(rotation.resident_id)} at ${getTrainingUnitName(rotation.training_unit_id)} ended yesterday and should be completed.` })
            else updates.push(updateRotationStatus(rotation.id, 'completed', { completed_at: new Date().toISOString(), completed_by: 'system', notes: 'Auto-completed after end date' }))
          }
        })

        if (pending.length > 0 && requireValidation) { pendingActivations.value = pending; showActivationModal() }
        if (updates.length > 0) { await Promise.all(updates); await loadRotations(); showToast('Rotations Updated', `${updates.length} rotation(s) automatically updated.`, 'info') }
        return { updates: updates.length, pending: pending.length }
      }

      const updateRotationStatus = async (rotationId, newStatus, metadata = {}) => {
        const rotation = rotations.value.find(r => r.id === rotationId)
        if (!rotation) return
        try {
          const updateData = {
            id: rotation.id, resident_id: rotation.resident_id, training_unit_id: rotation.training_unit_id,
            supervising_attending_id: rotation.supervising_attending_id || null,
            start_date: rotation.start_date, end_date: rotation.end_date,
            rotation_category: rotation.rotation_category || 'clinical_rotation',
            rotation_status: newStatus, clinical_notes: rotation.clinical_notes || '',
            supervisor_evaluation: rotation.supervisor_evaluation || '', goals: rotation.goals || '',
            notes: rotation.notes || '', rotation_id: rotation.rotation_id, ...metadata
          }
          const result = await API.updateRotation(rotationId, updateData)
          const idx = rotations.value.findIndex(r => r.id === rotationId)
          if (idx !== -1) rotations.value[idx] = { ...result, start_date: Utils.normalizeDate(result.start_date), end_date: Utils.normalizeDate(result.end_date) }
          return result
        } catch (error) { console.error('Failed to update rotation status:', error); throw error }
      }

      const showActivationModal = () => {
        if (pendingActivations.value.length === 0) return
        activationModal.rotations = [...pendingActivations.value]
        activationModal.selectedRotation = activationModal.rotations[0]
        activationModal.notes = ''; activationModal.show = true
      }

      const processNextPending = async () => {
        if (activationModal.rotations.length === 0) {
          activationModal.show = false; pendingActivations.value = []
          showToast('All Done', 'All rotation statuses have been updated.', 'success'); return
        }
        const current = activationModal.rotations[0]
        activationModal.selectedRotation = current; activationModal.action = current.action
      }

      const confirmPendingActivation = async () => {
        if (!activationModal.selectedRotation) return
        const rotation = activationModal.selectedRotation
        const newStatus = rotation.action === 'activate' ? 'active' : 'completed'
        try {
          await updateRotationStatus(rotation.id, newStatus, {
            [`${newStatus}_at`]: new Date().toISOString(),
            [`${newStatus}_by`]: currentUser?.value?.full_name || 'system',
            activation_notes: activationModal.notes || null,
            validated_by: currentUser?.value?.full_name || 'system', validated_at: new Date().toISOString()
          })
          activationModal.rotations = activationModal.rotations.slice(1)
          pendingActivations.value = pendingActivations.value.filter(r => r.id !== rotation.id)
          showToast('Rotation Updated', `${rotation.action === 'activate' ? 'Activated' : 'Completed'} rotation for ${getResidentName(rotation.resident_id)}`, 'success')
          await processNextPending()
        } catch (error) { showToast('Error', 'Failed to update rotation status', 'error') }
      }

      const skipPendingActivation = () => {
        if (!activationModal.selectedRotation) return
        const current = activationModal.rotations[0]
        activationModal.rotations = [...activationModal.rotations.slice(1), current]
        processNextPending(); showToast('Skipped', 'Rotation status update postponed.', 'warning')
      }

      const postponeAllActivations = () => {
        activationModal.show = false; showToast('Reminder Set', 'Will check again in 4 hours.', 'info')
        // M5 FIX: store as UTC timestamp number to avoid timezone/clock parsing issues
        localStorage.setItem('last_rotation_check', Date.now().toString())
      }

      const initAutoCheck = () => {
        // Silent: scheduled→active and active→completed are date facts, not decisions
        setTimeout(() => checkAndUpdateRotations(false), 2000)
        const interval = setInterval(() => {
          // M5 FIX: compare numeric timestamps — avoids timezone/clock parsing issues
          const lastCheck = localStorage.getItem('last_rotation_check')
          const now = Date.now()
          const lastCheckMs = lastCheck ? parseInt(lastCheck, 10) : 0
          if (!lastCheck || isNaN(lastCheckMs) || (now - lastCheckMs) > 4 * 60 * 60 * 1000) {
            checkAndUpdateRotations(false)
            localStorage.setItem('last_rotation_check', now.toString())
          }
        }, 60 * 60 * 1000)
        return interval
      }

      const validateRotation = (form) => {
        clearAll('rotation'); let ok = true
        if (!form.resident_id) { setErr('rotation', 'resident_id', 'Please select a resident'); ok = false }
        if (!form.training_unit_id) { setErr('rotation', 'training_unit_id', 'Please select a training unit'); ok = false }
        if (!form.start_date) { setErr('rotation', 'start_date', 'Start date is required'); ok = false }
        if (!form.end_date) { setErr('rotation', 'end_date', 'End date is required'); ok = false }
        if (!form.supervising_attending_id) { setErr('rotation', 'supervising_attending_id', 'Supervising attending is required'); ok = false }
        if (form.start_date && form.end_date) {
          const s = new Date(Utils.normalizeDate(form.start_date) + 'T00:00:00')
          const e = new Date(Utils.normalizeDate(form.end_date) + 'T00:00:00')
          if (!isNaN(s.getTime()) && !isNaN(e.getTime()) && e <= s) { setErr('rotation', 'end_date', 'End date must be after start date'); ok = false }
        }
        
        // Overlap check — resident can't have two rotations overlapping
        if (ok && form.resident_id && form.start_date && form.end_date) {
          const newStart = new Date(Utils.normalizeDate(form.start_date) + 'T00:00:00')
          const newEnd   = new Date(Utils.normalizeDate(form.end_date)   + 'T23:59:59')
          const editId   = form.id || form.rotation_id
          const overlap  = rotations.value.find(r =>
            r.resident_id === form.resident_id &&
            r.id !== editId &&
            ['active','scheduled'].includes(r.rotation_status) &&
            new Date(Utils.normalizeDate(r.start_date) + 'T00:00:00') <= newEnd &&
            new Date(Utils.normalizeDate(r.end_date)   + 'T23:59:59') >= newStart
          )
          if (overlap) {
            setErr('rotation', 'start_date', `Overlaps with existing rotation at ${getTrainingUnitName(overlap.training_unit_id) || 'another unit'}`)
            ok = false
          }
        }
        // Capacity check — unit has a max_residents limit
        if (ok && form.training_unit_id && form.start_date && form.end_date) {
          const unit = trainingUnits.value.find(u => u.id === form.training_unit_id)
          if (unit?.maximum_residents) {
            const newStart = new Date(Utils.normalizeDate(form.start_date) + 'T00:00:00')
            const newEnd   = new Date(Utils.normalizeDate(form.end_date)   + 'T23:59:59')
            const editId   = form.id || form.rotation_id
            const concurrent = rotations.value.filter(r =>
              r.training_unit_id === form.training_unit_id &&
              r.id !== editId &&
              ['active','scheduled'].includes(r.rotation_status) &&
              new Date(Utils.normalizeDate(r.start_date) + 'T00:00:00') <= newEnd &&
              new Date(Utils.normalizeDate(r.end_date)   + 'T23:59:59') >= newStart
            ).length
            if (concurrent >= unit.maximum_residents) {
              setErr('rotation', 'training_unit_id', `${unit.unit_name} is at full capacity (${unit.maximum_residents} residents)`)
              ok = false
            }
          }
        }
        return ok
      }

      const filteredRotationsAll = computed(() => {
        let f = rotations.value
        if (rotationFilters.resident) f = f.filter(r => r.resident_id === rotationFilters.resident)
        if (rotationFilters.status) f = f.filter(r => r.rotation_status === rotationFilters.status)
        if (rotationFilters.trainingUnit) f = f.filter(r => r.training_unit_id === rotationFilters.trainingUnit)
        if (rotationFilters.supervisor) f = f.filter(r => r.supervising_attending_id === rotationFilters.supervisor)
        if (debouncedRotationSearch.value) {
          const q = debouncedRotationSearch.value.toLowerCase()
          f = f.filter(r => getResidentName(r.resident_id).toLowerCase().includes(q) || getTrainingUnitName(r.training_unit_id).toLowerCase().includes(q))
        }
        return applySort(f, 'rotations')
      })
      const filteredRotations = computed(() => paginate(filteredRotationsAll.value, 'rotations'))
      const rotationTotalPages = computed(() => totalPages(filteredRotationsAll.value, 'rotations'))

      watch(rotationFilters, () => resetPage('rotations'), { deep: true })

      // Auto-derive rotation status from dates as user edits them
      // Uses local date (not UTC) to handle timezone offsets correctly
      watch(() => [rotationModal.form.start_date, rotationModal.form.end_date], ([start, end]) => {
        if (!start || !end) return
        const todayStr = Utils.localDateStr(new Date())
        const startStr = Utils.normalizeDate(start)
        const endStr   = Utils.normalizeDate(end)
        const terminal = ['terminated_early', 'completed', 'extended']
        if (terminal.includes(rotationModal.form.rotation_status)) return
        if (startStr > todayStr)       rotationModal.form.rotation_status = 'scheduled'
        else if (endStr < todayStr)    rotationModal.form.rotation_status = 'completed'
        else                           rotationModal.form.rotation_status = 'active'
        // Trigger availability check when dates change
        checkRotationAvailability()
      })

      // Auto-fill supervisor when unit is selected — reads supervisor_id from the unit
      watch(() => rotationModal.form.training_unit_id, (unitId) => {
        if (!unitId) return
        const unit = trainingUnits.value.find(u => u.id === unitId)
        if (unit && (unit.supervisor_id || unit.default_supervisor_id)) {
          // Only auto-fill if supervisor is not already manually set
          if (!rotationModal.form.supervising_attending_id) {
            rotationModal.form.supervising_attending_id = unit.supervisor_id || unit.default_supervisor_id
          }
        }
        // Trigger availability check when unit changes
        checkRotationAvailability()
      })

      const loadRotations = async () => {
        try {
          const raw = await API.getRotations()
          rotations.value = raw.map(r => ({
            ...r, start_date: Utils.normalizeDate(r.start_date || r.rotation_start_date),
            end_date: Utils.normalizeDate(r.end_date || r.rotation_end_date)
          }))
        } catch { showToast('Error', 'Failed to load rotations', 'error') }
      }

      const showAddRotationModal = (resident = null, unit = null) => {
        clearAll('rotation'); rotationModal.mode = 'add'
        Object.assign(rotationModal.form, {
          rotation_id: `ROT-${Date.now().toString().slice(-6)}`,
          resident_id: resident?.id || '',
          training_unit_id: unit?.id || '',
          start_date: Utils.normalizeDate(new Date()), end_date: Utils.normalizeDate(new Date(Date.now() + 30 * 86400000)),
          rotation_status: 'scheduled', rotation_category: 'clinical_rotation', supervising_attending_id: ''
        })
        rotationModal.show = true
      }

      const editRotation = (rotation) => {
        clearAll('rotation'); rotationModal.mode = 'edit'
        rotationModal.form = { ...rotation, start_date: Utils.normalizeDate(rotation.start_date || rotation.rotation_start_date), end_date: Utils.normalizeDate(rotation.end_date || rotation.rotation_end_date) }
        rotationModal.show = true
      }

      const saveRotation = async (saving) => {
        if (!validateRotation(rotationModal.form)) { showToast('Validation Error', 'Please fix the highlighted fields', 'error'); return }
        const f = rotationModal.form
        const startISO = Utils.normalizeDate(f.start_date)
        const endISO = Utils.normalizeDate(f.end_date)
        const startDate = new Date(startISO + 'T00:00:00')
        const endDate = new Date(endISO + 'T23:59:59')

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) { setErr('rotation', 'start_date', 'Invalid date format'); showToast('Error', 'Invalid date format', 'error'); return }
        const duration = Math.ceil((endDate - startDate) / 86400000)
        if (duration > 365) { setErr('rotation', 'end_date', `Cannot exceed 365 days (current: ${duration})`); showToast('Error', 'Rotation cannot exceed 365 days', 'error'); return }

        // Lock button immediately — prevents double-submit during async refresh below
        saving.value = true

        // Refresh from server before overlap check to avoid stale-cache false conflicts
        API.invalidate('/api/rotations')
        try {
          const fresh = await API.request('/api/rotations', { skipCache: true })
          const freshList = Utils.ensureArray(fresh)
          if (freshList.length > 0) rotations.value = freshList.map(r => ({ ...r, start_date: Utils.normalizeDate(r.start_date), end_date: Utils.normalizeDate(r.end_date) }))
        } catch { /* proceed with cached data */ }

        const excludeId = rotationModal.mode === 'edit' ? f.id : null
        // Only scheduled/active/extended block new slots — completed/cancelled do NOT
        const BLOCKING_STATUSES = ['scheduled', 'active', 'extended']
        const hasOverlap = rotations.value.some(r => {
          if (r.resident_id !== f.resident_id) return false
          if (!BLOCKING_STATUSES.includes(r.rotation_status)) return false
          if (excludeId && r.id === excludeId) return false
          const eS = new Date(Utils.normalizeDate(r.start_date) + 'T00:00:00')
          const eE = new Date(Utils.normalizeDate(r.end_date) + 'T23:59:59')
          if (isNaN(eS.getTime()) || isNaN(eE.getTime())) return false
          return startDate <= eE && endDate >= eS
        })
        if (hasOverlap) {
          const conflicting = rotations.value.find(r => {
            if (r.resident_id !== f.resident_id || !BLOCKING_STATUSES.includes(r.rotation_status)) return false
            if (excludeId && r.id === excludeId) return false
            const eS = new Date(Utils.normalizeDate(r.start_date) + 'T00:00:00')
            const eE = new Date(Utils.normalizeDate(r.end_date) + 'T23:59:59')
            return startDate <= eE && endDate >= eS
          })
          const conflictUnit = conflicting ? getTrainingUnitName(conflicting.training_unit_id) : ''
          const conflictDates = conflicting ? `${Utils.formatDateShort(conflicting.start_date)} – ${Utils.formatDateShort(conflicting.end_date)}` : ''
          setErr('rotation', 'start_date', 'Dates overlap with an active or scheduled rotation')
          showToast('Scheduling Conflict', `${getResidentName(f.resident_id)} already has a ${conflicting?.rotation_status || ''} rotation at ${conflictUnit} (${conflictDates}).`, 'error')
          saving.value = false; return
        }

        try {
          // Derive status from dates — never trust what the form says.
          // If the user picked today as start date, it should be active immediately.
          // Only terminal states (terminated_early, extended, completed) are preserved
          // when editing an existing rotation.
          const todayStr = Utils.localDateStr(new Date())  // local date — not UTC
          const terminalStatuses = ['terminated_early', 'completed', 'extended']
          let derivedStatus
          if (rotationModal.mode === 'edit' && terminalStatuses.includes(f.rotation_status)) {
            // Keep terminal status when editing
            derivedStatus = f.rotation_status
          } else if (startISO > todayStr) {
            derivedStatus = 'scheduled'
          } else if (endISO < todayStr) {
            derivedStatus = 'completed'
          } else {
            // start_date <= today <= end_date
            derivedStatus = 'active'
          }

          const data = {
            rotation_id: f.rotation_id || Utils.generateId('ROT'), resident_id: f.resident_id,
            training_unit_id: f.training_unit_id, supervising_attending_id: f.supervising_attending_id || null,
            start_date: startISO, end_date: endISO,
            rotation_category: f.rotation_category || 'clinical_rotation',
            rotation_status: derivedStatus
          }
          const normalize = r => ({ ...r, start_date: Utils.normalizeDate(r.start_date), end_date: Utils.normalizeDate(r.end_date) })
          if (rotationModal.mode === 'add') {
            const rName = (medicalStaff.value || []).find(s => s.id === data.resident_id)?.full_name || 'Resident'
            const uName = (trainingUnits.value || []).find(u => u.id === data.training_unit_id)?.unit_name || 'unit'
            rotations.value.unshift(normalize(await API.createRotation(data)))
            showToast('Rotation scheduled', `${rName.split(' ')[0]} → ${uName} · ${data.start_date} – ${data.end_date}`, 'success')
          } else {
            const prev = rotations.value.find(r => r.id === f.id)
            const result = normalize(await API.updateRotation(f.id, data))
            const idx = rotations.value.findIndex(r => r.id === result.id)
            if (idx !== -1) rotations.value[idx] = result
            // Build diff summary
            const changes = []
            if (prev && prev.start_date !== data.start_date) changes.push(`Start ${prev.start_date} → ${data.start_date}`)
            if (prev && prev.end_date !== data.end_date) changes.push(`End ${prev.end_date} → ${data.end_date}`)
            if (prev && prev.training_unit_id !== data.training_unit_id) {
              const uName = (trainingUnits.value || []).find(u => u.id === data.training_unit_id)?.unit_name || 'new unit'
              changes.push(`Unit → ${uName}`)
            }
            if (prev && prev.supervising_attending_id !== data.supervising_attending_id) changes.push('Supervisor changed')
            showToast('Rotation updated', changes.length ? changes.join(' · ') : 'No changes detected', 'success')
          }
          rotationModal.show = false; clearAll('rotation')
        } catch (e) {
          let msg = e.message || 'Failed to save rotation'
          if (msg.includes('overlapping')) msg = 'Dates conflict with an existing rotation.'
          if (msg.includes('date')) msg = 'Invalid date — check start and end dates.'
          showToast('Error', msg, 'error')
        } finally { saving.value = false }
      }

      const deleteRotation = (rotation) => {
        const isActive = ['active', 'scheduled'].includes(rotation.rotation_status)
        const resident = Utils.formatDrName(getResidentName(rotation.resident_id))
        const unit     = getTrainingUnitName(rotation.training_unit_id)

        showConfirmation({
          title:   isActive ? 'Cancel Rotation' : 'Remove Rotation Record',
          message: isActive
            ? 'This will cancel the rotation and mark it as ended early. The record is preserved for audit and training history purposes.'
            : 'This rotation is already completed or cancelled. Remove it from the visible list?',
          confirmButtonText:  isActive ? 'Cancel rotation' : 'Remove record',
          confirmButtonClass: 'btn-danger',
          details: `${resident} · ${unit}`,
          onConfirm: async () => {
            try {
              await API.deleteRotation(rotation.id)
              const idx = rotations.value.findIndex(r => r.id === rotation.id)
              if (idx !== -1) rotations.value[idx] = { ...rotations.value[idx], rotation_status: 'terminated_early' }
              showToast('Success', isActive ? 'Rotation cancelled' : 'Record removed', 'success')
              await loadRotations()
            } catch (e) {
              showToast('Error', e?.message || 'Failed to cancel rotation', 'error')
              await loadRotations()
            }
          }
        })
      }

      // ============ [NEW] Compact view computed properties for Rotations ============
      const residentsWithRotations = computed(() => {
        // C2 FIX: was hardcoded to staff_type === 'medical_resident' — use isResidentType()
        // so custom resident types (e.g. 'mir', 'resident_externo') are included
        const residents = medicalStaff.value.filter(s => isResidentType(s.staff_type) && s.employment_status === 'active')
        
        return residents.map(resident => {
          const allResidentRotations = rotations.value.filter(r => r.resident_id === resident.id)
          
          // Sort rotations by date
          const sortedRotations = [...allResidentRotations].sort((a, b) => {
            return new Date(a.start_date) - new Date(b.start_date)
          })
          
          const pastRotations = sortedRotations.filter(r => 
            r.rotation_status === 'completed' || 
            (r.rotation_status !== 'active' && new Date(r.end_date) < new Date())
          )
          
          const currentRotation = sortedRotations.find(r => r.rotation_status === 'active')
          
          const upcomingRotations = sortedRotations.filter(r => 
            r.rotation_status === 'scheduled' && 
            (!currentRotation || new Date(r.start_date) > new Date(currentRotation.end_date))
          )
          
          // Calculate empty slots (assuming max 8 rotations per resident over program)
          const maxRotations = 8
          const totalRotations = sortedRotations.length
          const emptySlots = Math.max(0, maxRotations - totalRotations)
          
          return {
            ...resident,
            allRotations: sortedRotations,
            pastRotations: pastRotations.map(r => ({
              ...r,
              unitName: getTrainingUnitName(r.training_unit_id)
            })),
            currentRotation: currentRotation ? {
              ...currentRotation,
              unitName: getTrainingUnitName(currentRotation.training_unit_id)
            } : null,
            upcomingRotations: upcomingRotations.map(r => ({
              ...r,
              unitName: getTrainingUnitName(r.training_unit_id)
            })),
            totalRotations: sortedRotations.length,
            emptySlots
          }
        }).filter(r => 
          // Apply filters
          (!rotationFilters.resident || r.id === rotationFilters.resident) &&
          (!rotationFilters.trainingUnit || r.allRotations.some(rot => rot.training_unit_id === rotationFilters.trainingUnit)) &&
          (!rotationFilters.status || r.allRotations.some(rot => rot.rotation_status === rotationFilters.status)) &&
          (!debouncedRotationSearch.value || r.full_name.toLowerCase().includes(debouncedRotationSearch.value.toLowerCase()))
        )
      })

      const isRotationActive = (rotation) => {
        return rotation.rotation_status === 'active'
      }

      const getRotationsForDay = (resident, dayIndex) => {
        const today = new Date()
        const startOfWeek = new Date(today)
        startOfWeek.setDate(today.getDate() - today.getDay() + 1) // Monday
        
        const targetDate = new Date(startOfWeek)
        targetDate.setDate(startOfWeek.getDate() + dayIndex - 1)
        const targetDateStr = Utils.normalizeDate(targetDate)
        
        return resident.allRotations?.filter(r => {
          const start = Utils.normalizeDate(r.start_date)
          const end = Utils.normalizeDate(r.end_date)
          return targetDateStr >= start && targetDateStr <= end
        }) || []
      }


      // ============ [NEW] Rotation detail sheet modal ============
      const rotationViewModal = reactive({ show: false, rotation: null })

      const viewRotationDetails = (rotation) => {
        if (!rotation) return
        // Enrich rotation with display-friendly fields expected by the detail sheet
        const resident  = (allStaffLookup?.value || []).find(s => s.id === rotation.resident_id) || medicalStaff.value.find(s => s.id === rotation.resident_id)
        const supervisor = (allStaffLookup?.value || []).find(s => s.id === rotation.supervising_attending_id) || medicalStaff.value.find(s => s.id === rotation.supervising_attending_id)
        const startD = new Date(Utils.normalizeDate(rotation.start_date) + 'T00:00:00')
        const endD   = new Date(Utils.normalizeDate(rotation.end_date)   + 'T00:00:00')
        const today  = new Date(); today.setHours(0,0,0,0)
        const daysTotal = Math.max(1, Math.round((endD - startD) / 86400000))
        const daysLeft  = Math.max(0, Math.round((endD - today)  / 86400000))
        rotationViewModal.rotation = {
          ...rotation,
          unitName:         rotation.unitName || getTrainingUnitName(rotation.training_unit_id),
          residentName:     resident?.full_name   || rotation.residentName || 'Unknown',
          supervisorName:   supervisor?.full_name || rotation.supervisorName || '—',
          daysTotal,
          daysLeft,
          clinicalDuration: Utils.formatClinicalDuration(rotation.start_date, rotation.end_date)
        }
        rotationViewModal.show = true
      }


      // ============ Month Horizon view ============
      const monthHorizon = ref(6)
      const monthOffset  = ref(0)

      const getHorizonMonths = (n, offset) => {
        const today  = new Date()
        const months = []
        for (let i = 0; i < n; i++) {
          const d    = new Date(today.getFullYear(), today.getMonth() + offset + i, 1)
          const prev = i > 0 ? new Date(today.getFullYear(), today.getMonth() + offset + i - 1, 1) : null
          months.push({
            key:         `${d.getFullYear()}-${d.getMonth()}`,
            label:       d.toLocaleDateString('es-ES', { month: 'short' }),
            year:        d.getFullYear(),
            month:       d.getMonth(),
            isCurrent:   d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth(),
            isYearStart: !prev || d.getFullYear() !== prev.getFullYear(),
            daysInMonth: new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
          })
        }
        return months
      }

      const getHorizonRangeLabel = () => {
        const months = getHorizonMonths(monthHorizon.value, monthOffset.value)
        if (!months.length) return ''
        const first = months[0], last = months[months.length - 1]
        if (first.year === last.year)
          return `${first.label} – ${last.label} ${last.year}`
        return `${first.label} ${first.year} – ${last.label} ${last.year}`
      }

      const getResidentRotationsInHorizon = (resident) => {
        const months = getHorizonMonths(monthHorizon.value, monthOffset.value)
        if (!months.length) return []
        const n = months.length
        const horizonStart = new Date(months[0].year, months[0].month, 1)
        const horizonEnd   = new Date(months[n-1].year, months[n-1].month + 1, 0)
        return rotations.value.filter(r =>
          r.resident_id === resident.id &&
          ['active','scheduled','completed'].includes(r.rotation_status) &&
          new Date(r.start_date) <= horizonEnd && new Date(r.end_date) >= horizonStart
        )
      }

      const getRotationBarStyle = (rotation) => {
        const months = getHorizonMonths(monthHorizon.value, monthOffset.value)
        const n = months.length
        if (!n) return { display: 'none' }
        const horizonStart = new Date(months[0].year, months[0].month, 1)
        const horizonEnd   = new Date(months[n-1].year, months[n-1].month + 1, 0)
        const rotStart     = new Date(rotation.start_date + 'T00:00:00')
        const rotEnd       = new Date(rotation.end_date   + 'T00:00:00')
        const cs = rotStart < horizonStart ? horizonStart : rotStart
        const ce = rotEnd   > horizonEnd   ? horizonEnd   : rotEnd
        if (cs > ce) return { display: 'none' }
        const totalDays   = months.reduce((s, m) => s + m.daysInMonth, 0)
        const daysToStart = Math.round((cs - horizonStart) / 86400000)
        const daysToEnd   = Math.round((ce - horizonStart) / 86400000) + 1
        const leftPct  = (daysToStart / totalDays) * 100
        const widthPct = ((daysToEnd - daysToStart) / totalDays) * 100
        return {
          left:  `calc(${leftPct.toFixed(2)}% + 3px)`,
          width: `calc(${widthPct.toFixed(2)}% - 6px)`
        }
      }

      const rotationStartsInHorizon = (rotation) => {
        const months = getHorizonMonths(monthHorizon.value, monthOffset.value)
        if (!months.length) return false
        const horizonStart = new Date(months[0].year, months[0].month, 1)
        return new Date(rotation.start_date + 'T00:00:00') >= horizonStart
      }

      const rotationEndsInHorizon = (rotation) => {
        const months = getHorizonMonths(monthHorizon.value, monthOffset.value)
        if (!months.length) return false
        const n = months.length
        const horizonEnd = new Date(months[n-1].year, months[n-1].month + 1, 0)
        return new Date(rotation.end_date + 'T00:00:00') <= horizonEnd
      }

      // ── Resident gap warnings ─────────────────────────────────────────────
      // Residents who have no rotation scheduled for any of the next 3 months
      const rgwCollapsed = ref(false)
      const residentGapWarnings = computed(() => {
        const today    = new Date(); today.setHours(0,0,0,0)
        const warnings = []
        // All active residents
        const residents = medicalStaff.value.filter(s =>
          isResidentType(s.staff_type) && s.employment_status === 'active' &&
          s.resident_category !== 'external_resident' &&
          s.resident_category !== 'rotating_other_dept'
        )
        for (const resident of residents) {
          const gaps = []
          for (let i = 0; i < 3; i++) {
            const mStart = new Date(today.getFullYear(), today.getMonth() + i, 1)
            const mEnd   = new Date(today.getFullYear(), today.getMonth() + i + 1, 0)
            const covered = rotations.value.some(r =>
              r.resident_id === resident.id &&
              ['active','scheduled'].includes(r.rotation_status) &&
              new Date(r.start_date) <= mEnd && new Date(r.end_date) >= mStart
            )
            if (!covered) {
              gaps.push(mStart.toLocaleDateString('es-ES', { month: 'short' }))
            }
          }
          if (gaps.length > 0) {
            warnings.push({
              id:       resident.id,
              name:     resident.full_name,
              year:     resident.training_year,
              gaps,
              gapCount: gaps.length
            })
          }
        }
        return warnings.sort((a,b) => b.gapCount - a.gapCount)
      })

      return {
        rotations, rotationFilters, rotationModal,
        filteredRotations, filteredRotationsAll, rotationTotalPages,
        loadRotations, showAddRotationModal, editRotation, saveRotation, deleteRotation, selectedUnitCapacity,
        checkRotationAvailability,
        pendingActivations, activationModal, checkAndUpdateRotations, updateRotationStatus,
        confirmPendingActivation, skipPendingActivation, postponeAllActivations, initAutoCheck,
        forceActivationCheck: () => checkAndUpdateRotations(true),
        quickActivate: (rotation) => updateRotationStatus(rotation.id, 'active', { activated_at: new Date().toISOString(), activated_by: currentUser?.value?.full_name || 'manual', notes: 'Manually activated', clinical_notes: rotation.clinical_notes || '', supervisor_evaluation: rotation.supervisor_evaluation || '', goals: rotation.goals || '' }),
        quickComplete: (rotation) => updateRotationStatus(rotation.id, 'completed', { completed_at: new Date().toISOString(), completed_by: currentUser?.value?.full_name || 'manual', notes: 'Manually completed', clinical_notes: rotation.clinical_notes || '', supervisor_evaluation: rotation.supervisor_evaluation || '', goals: rotation.goals || '' }),
        // NEW compact view properties
        residentsWithRotations,
        isRotationActive,
        getRotationsForDay,
        viewRotationDetails,
        // Week view
        rotationViewModal,
        monthHorizon,
        monthOffset,
        getHorizonMonths,
        getHorizonRangeLabel,
        getResidentRotationsInHorizon,
        getRotationBarStyle,
        rotationStartsInHorizon,
        rotationEndsInHorizon,
        residentGapWarnings, rgwCollapsed,
        getResidentName,
        getTrainingUnitName
      }
    }

    // ============ 6.6 useAbsences ============
    function useAbsences({ showToast, showConfirmation, paginate, totalPages, resetPage, applySort, setErr, clearAll, medicalStaff, allStaffLookup, onCallSchedule }) {
      const absences = ref([])
            const absenceFilters = reactive({ staff: '', status: '', reason: '', startDate: '', search: '', hideReturned: true })
            const debouncedAbsenceSearch = ref('')
            watch(() => absenceFilters.search, Utils.debounce(v => { debouncedAbsenceSearch.value = v }, 250))
      const absenceModal = reactive({
        show: false, mode: 'add',
        form: {
          staff_member_id: '', absence_type: 'planned', absence_reason: 'vacation',
          start_date: Utils.normalizeDate(new Date()),
          end_date: Utils.normalizeDate(new Date(Date.now() + 7 * 86400000)),
          covering_staff_id: '', coverage_notes: '', coverage_arranged: false, hod_notes: '',
          // Recurring absence fields
          is_recurring: false,
          recurrence_pattern: 'weekly',
          recurrence_end_date: ''
        }
      })

      const getStaffName = (id) => {
        if (!id) return 'Not assigned'
        const lookup = allStaffLookup?.value || []
        const all    = medicalStaff?.value || []
        const s = lookup.find(x => x.id === id) || all.find(x => x.id === id)
        return s?.full_name || 'Not assigned'
      }

      const validateAbsence = (form) => {
        clearAll('absence'); let ok = true
        if (!form.staff_member_id) { setErr('absence', 'staff_member_id', 'Please select a staff member'); ok = false }
        if (!form.start_date) { setErr('absence', 'start_date', 'Start date is required'); ok = false }
        if (!form.end_date) { setErr('absence', 'end_date', 'End date is required'); ok = false }
        if (form.start_date && form.end_date) {
          const s = new Date(Utils.normalizeDate(form.start_date) + 'T00:00:00')
          const e = new Date(Utils.normalizeDate(form.end_date) + 'T00:00:00')
          if (!isNaN(s.getTime()) && !isNaN(e.getTime()) && e < s) { setErr('absence', 'end_date', 'End date cannot be before start date'); ok = false }
        }
        return ok
      }

      // Warn if this staff member already has a non-cancelled overlapping absence
      const absenceOverlapWarning = computed(() => {
        const f = absenceModal.form
        if (!f.staff_member_id || !f.start_date || !f.end_date) return null
        const editId = absenceModal.mode === 'edit' ? f.id : null
        const newStart = Utils.normalizeDate(f.start_date)
        const newEnd   = Utils.normalizeDate(f.end_date)
        if (!newStart || !newEnd) return null
        const overlap = absences.value.find(a => {
          if (a.staff_member_id !== f.staff_member_id) return false
          if (editId && a.id === editId) return false
          if (a.current_status === 'cancelled') return false
          const aS = Utils.normalizeDate(a.start_date)
          const aE = Utils.normalizeDate(a.end_date)
          return newStart <= aE && newEnd >= aS
        })
        if (!overlap) return null
        return {
          reason: ABSENCE_REASON_LABELS?.[overlap.absence_reason] || overlap.absence_reason,
          start: Utils.formatDateShort(overlap.start_date),
          end: Utils.formatDateShort(overlap.end_date),
          status: overlap.current_status
        }
      })

      // M4 FIX: moved deriveAbsenceStatus before filteredAbsencesAll which uses it
      const deriveAbsenceStatus = (a) => {
        if (a.current_status === 'cancelled')       return 'cancelled'
        if (a.current_status === 'returned_to_duty') return 'returned_to_duty'
        const today = Utils.normalizeDate(new Date())
        const start = Utils.normalizeDate(a.start_date)
        const end   = Utils.normalizeDate(a.end_date)
        // Use DB-aligned values for all statuses so in-memory filter and
        // any future server-side filtering stay consistent with the DB CHECK constraint
        if (end < today)    return 'returned_to_duty'
        if (start <= today) return 'currently_absent'
        return 'planned_leave'
      }

      const filteredAbsencesAll = computed(() => {
        const today = Utils.normalizeDate(new Date())
        let f = absences.value.map(a => {
          const derived = deriveAbsenceStatus(a)
          // Auto-clear coverage_arranged if covering person is also absent in the same period
          let coverageOk = a.coverage_arranged
          if (coverageOk && a.covering_staff_id) {
            const coverIsAbsent = absences.value.some(b =>
              b.id !== a.id &&
              b.staff_member_id === a.covering_staff_id &&
              b.current_status !== 'cancelled' &&
              Utils.normalizeDate(b.start_date) <= Utils.normalizeDate(a.end_date) &&
              Utils.normalizeDate(b.end_date)   >= Utils.normalizeDate(a.start_date)
            )
            if (coverIsAbsent) coverageOk = false
          }
          return { ...a, current_status: derived, coverage_arranged: coverageOk }
        })
        // Hide past/resolved records by default — toggle via "Show Past" filter
        if (!absenceFilters.status && absenceFilters.hideReturned) {
          f = f.filter(a => !['returned_to_duty', 'cancelled'].includes(a.current_status))
        }
        if (absenceFilters.staff) f = f.filter(a => a.staff_member_id === absenceFilters.staff)
        if (absenceFilters.status) f = f.filter(a => a.current_status === absenceFilters.status)
        if (absenceFilters.reason) f = f.filter(a => a.absence_reason === absenceFilters.reason)
        if (absenceFilters.startDate) f = f.filter(a => Utils.normalizeDate(a.start_date) >= absenceFilters.startDate)
        if (debouncedAbsenceSearch.value) {
          const q = debouncedAbsenceSearch.value.toLowerCase()
          f = f.filter(a => getStaffName(a.staff_member_id).toLowerCase().includes(q) || (ABSENCE_REASON_LABELS[a.absence_reason] || '').toLowerCase().includes(q))
        }
        return applySort(f, 'absences')
      })
      const filteredAbsences = computed(() => paginate(filteredAbsencesAll.value, 'absences'))
      const absenceTotalPages = computed(() => totalPages(filteredAbsencesAll.value, 'absences'))

      watch(absenceFilters, () => resetPage('absences'), { deep: true })

      const absenceKPIs = computed(() => {
        const today = Utils.normalizeDate(new Date())
        const all   = absences.value.map(a => ({ ...a, current_status: deriveAbsenceStatus(a) }))
        const absentNow  = all.filter(a => a.current_status === 'currently_absent')
        const upcoming   = all.filter(a => a.current_status === 'planned_leave')
        const now        = new Date()
        const thisMonth  = all.filter(a => {
          const s = new Date(a.start_date)
          return s.getMonth() === now.getMonth() && s.getFullYear() === now.getFullYear()
        })
        const noCoverage = [...absentNow, ...upcoming].filter(a => !a.coverage_arranged)
        const nextAbs    = upcoming.sort((a,b) => new Date(a.start_date)-new Date(b.start_date))[0]
        return {
          absentNow:    absentNow.length,
          absentName:   absentNow[0] ? (allStaffLookup.value.find(s => s.id === absentNow[0].staff_member_id)?.full_name || '') : '',
          absentDay:    absentNow[0] ? (()=>{
            try {
              const s = new Date(absentNow[0].start_date + 'T00:00:00')
              const t = new Date(); t.setHours(0,0,0,0)
              const d = Math.floor((t - s)/(864e5)) + 1
              return isNaN(d) || d < 1 ? 1 : d
            } catch { return 1 }
          })() : 0,
          upcoming:     upcoming.length,
          nextDate:     nextAbs ? Utils.formatDate(nextAbs.start_date) : '',
          nextName:     nextAbs ? (allStaffLookup.value.find(s => s.id === nextAbs.staff_member_id)?.full_name||'') : '',
          thisMonth:    thisMonth.length,
          coveredCount: thisMonth.filter(a=>a.coverage_arranged).length,
          noCoverage:   noCoverage.length,
        }
      })


      const loadAbsences = async () => {
        try {
          const raw = await API.getAbsences()
          const stalePatches = []

          // Filter cancelled (soft-deleted) records — they must not reappear after refresh
          const active = raw.filter(a => a.current_status !== 'cancelled')

          absences.value = active.map(a => {
            const normalized = { ...a, start_date: Utils.normalizeDate(a.start_date), end_date: Utils.normalizeDate(a.end_date) }
            const derived = deriveAbsenceStatus(normalized)
            // Silently patch stale records (ended but still 'currently_absent' in DB)
            // deriveAbsenceStatus returns 'returned_to_duty' for past absences — never 'completed'
            if (derived === 'returned_to_duty' &&
                a.current_status &&
                a.current_status !== 'returned_to_duty' &&
                a.current_status !== 'cancelled') {
              const patch = {
                staff_member_id:   a.staff_member_id,
                absence_type:      a.absence_type,
                absence_reason:    a.absence_reason,
                start_date:        Utils.normalizeDate(a.start_date),
                end_date:          Utils.normalizeDate(a.end_date),
                coverage_arranged: a.coverage_arranged || false,
                covering_staff_id: a.covering_staff_id || null,
                coverage_notes:    a.coverage_notes || '',
                hod_notes:         a.hod_notes || ''
              }
              stalePatches.push(API.updateAbsence(a.id, patch).catch(() => {}))
            }
            return { ...normalized, current_status: derived }
          })

          if (stalePatches.length) await Promise.all(stalePatches)
        } catch { showToast('Error', 'Failed to load absences', 'error') }
      }

      const showAddAbsenceModal = (staff = null) => {
        clearAll('absence'); absenceModal.mode = 'add'
        Object.assign(absenceModal.form, {
          staff_member_id: staff?.id || '', absence_type: 'planned', absence_reason: 'vacation',
          start_date: Utils.normalizeDate(new Date()), end_date: Utils.normalizeDate(new Date(Date.now() + 7 * 86400000)),
          covering_staff_id: '', coverage_notes: '', coverage_arranged: false, hod_notes: ''
        })
        absenceModal.show = true
      }

      const editAbsence = (absence) => {
        clearAll('absence'); absenceModal.mode = 'edit'
        Object.assign(absenceModal.form, {
          id: absence.id,
          staff_member_id:    absence.staff_member_id    || '',
          absence_type:       absence.absence_type       || 'planned',
          absence_reason:     absence.absence_reason     || 'vacation',
          start_date:         Utils.normalizeDate(absence.start_date),
          end_date:           Utils.normalizeDate(absence.end_date),
          covering_staff_id:  absence.covering_staff_id  || '',
          coverage_notes:     absence.coverage_notes     || '',
          coverage_arranged:  absence.coverage_arranged  ?? false,
          hod_notes:          absence.hod_notes          || '',
          current_status:     absence.current_status     || null
        })
        absenceModal.show = true
      }

      const saveAbsence = async (saving) => {
        if (!validateAbsence(absenceModal.form)) { showToast('Validation Error', 'Please fix the highlighted fields', 'error'); return }
        if (saving?.value) return
        if (saving) saving.value = true

        // ── On-call conflict check ──────────────────────────────────────────
        const f = absenceModal.form
        if (f.staff_member_id && f.start_date && f.end_date) {
          const absStart = Utils.normalizeDate(f.start_date)
          const absEnd   = Utils.normalizeDate(f.end_date)
          const conflicts = (onCallSchedule?.value || []).filter(s => {
            const d = Utils.normalizeDate(s.duty_date)
            return d >= absStart && d <= absEnd &&
              (s.primary_physician_id === f.staff_member_id || s.backup_physician_id === f.staff_member_id)
          })
          if (conflicts.length > 0) {
            const fmt    = (d) => new Date(d + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })
            const lines  = conflicts.slice(0, 4).map(s => {
              const role = s.primary_physician_id === f.staff_member_id ? 'Primary' : 'Backup'
              return `${fmt(s.duty_date)} · ${role} · ${s.start_time}–${s.end_time}`
            }).join('\n')
            const more   = conflicts.length > 4 ? `\n+${conflicts.length - 4} more` : ''
            const staffName = medicalStaff.value.find(x => x.id === f.staff_member_id)?.full_name || 'This physician'
            await new Promise((resolve) => {
              showConfirmation({
                title: '⚠️ On-Call Conflict Detected',
                message: `${staffName} has ${conflicts.length} on-call shift${conflicts.length > 1 ? 's' : ''} during this absence period that will be left uncovered:`,
                details: lines + more,
                icon: 'fa-phone-slash',
                confirmButtonText: 'Save Anyway',
                confirmButtonClass: 'btn-danger',
                onConfirm: () => resolve(true),
                onCancel:  () => resolve(false)
              })
            }).then(async (confirmed) => {
              if (!confirmed) { saving.value = false; return }
              await _doSaveAbsence(saving)
            })
            return
          }
        }
        await _doSaveAbsence(saving)
      }

      const _doSaveAbsence = async (saving) => {
        saving.value = true
        try {
          const f = absenceModal.form
          const data = {
            staff_member_id: f.staff_member_id, absence_type: f.absence_type || 'planned',
            absence_reason: f.absence_reason || 'vacation', start_date: Utils.normalizeDate(f.start_date),
            end_date: Utils.normalizeDate(f.end_date), coverage_arranged: f.coverage_arranged || false,
            covering_staff_id: f.covering_staff_id || null, coverage_notes: f.coverage_notes || '', hod_notes: f.hod_notes || ''
          }
          const normalize = a => ({ ...(a?.data || a), start_date: Utils.normalizeDate((a?.data || a).start_date), end_date: Utils.normalizeDate((a?.data || a).end_date) })
          if (absenceModal.mode === 'add') {
            const sName = (medicalStaff.value || []).find(s => s.id === f.staff_member_id)?.full_name?.split(' ')[0] || 'Staff'
            const reason = (f.absence_reason || '').replace(/_/g, ' ')
            absences.value.unshift(normalize(await API.createAbsence(data)))
            showToast('Absence recorded', `${sName} · ${reason} · ${f.start_date} – ${f.end_date}`, 'success')
          } else {
            const prevAbs = absences.value.find(a => a.id === f.id)
            const record = normalize(await API.updateAbsence(f.id, data))
            const idx = absences.value.findIndex(a => a.id === (record.id || f.id))
            if (idx !== -1) absences.value[idx] = record
            const absChanges = []
            if (prevAbs && prevAbs.start_date !== f.start_date) absChanges.push(`Start → ${f.start_date}`)
            if (prevAbs && prevAbs.end_date !== f.end_date) absChanges.push(`End → ${f.end_date}`)
            if (prevAbs && prevAbs.absence_reason !== f.absence_reason) absChanges.push(`Reason → ${(f.absence_reason||'').replace(/_/g,' ')}`)
            if (prevAbs && prevAbs.coverage_arranged !== f.coverage_arranged) absChanges.push(f.coverage_arranged ? 'Coverage arranged ✓' : 'Coverage removed')
            showToast('Absence updated', absChanges.length ? absChanges.join(' · ') : 'Saved', 'success')
          }
          absenceModal.show = false; clearAll('absence'); await loadAbsences()
        } catch (e) { showToast('Error', e.message || 'Failed to save absence', 'error') }
        finally { saving.value = false }
      }

      const deleteAbsence = (absence) => showConfirmation({
        title: 'Cancel Absence Record', message: 'This will mark the absence as cancelled. The record is retained for audit purposes but will no longer appear in the active list.',
        icon: 'fa-ban', confirmButtonText: 'Cancel Absence', confirmButtonClass: 'btn-danger',
        details: `Staff: ${getStaffName(absence.staff_member_id)}`,
        onConfirm: async () => {
          try {
            await API.deleteAbsence(absence.id)
            absences.value = absences.value.filter(a => a.id !== absence.id)
            showToast('Success', 'Absence record cancelled', 'success')
            await loadAbsences()
          } catch (e) {
            showToast('Error', e?.message || 'Failed to cancel absence record', 'error')
            await loadAbsences()
          }
        }
      })

      const purgeAbsence = (absence) => showConfirmation({
        title: 'Permanently Delete Record',
        message: `This will permanently remove this absence record from the system. This action cannot be undone and the record will not appear in any future audit trail.`,
        icon: 'fa-trash-alt',
        confirmButtonText: 'Delete Permanently',
        confirmButtonClass: 'btn-danger',
        details: `Staff: ${getStaffName(absence.staff_member_id)} · ${ABSENCE_REASON_LABELS[absence.absence_reason] || absence.absence_reason} · ${Utils.formatDate(absence.start_date)} → ${Utils.formatDate(absence.end_date)}`,
        onConfirm: async () => {
          try {
            await API.purgeAbsence(absence.id)
            absences.value = absences.value.filter(a => a.id !== absence.id)
            showToast('Deleted', 'Absence record permanently removed', 'success')
          } catch (e) {
            showToast('Error', e?.message || 'Failed to delete record', 'error')
            await loadAbsences()
          }
        }
      })

      // ── Absence Resolution Workflow ───────────────────────────────────────
      // Surfaces when an absence period has ended but no formal resolution has been recorded.
      const absenceResolutionModal = reactive({
        show: false,
        absence: null,
        action: null,        // 'confirm_return' | 'extend' | 'archive'
        returnDate: Utils.normalizeDate(new Date()),
        returnNotes: '',
        extendedEndDate: '',
        saving: false
      })

      const openResolutionModal = (absence) => {
        absenceResolutionModal.absence = absence
        absenceResolutionModal.action = 'confirm_return'
        absenceResolutionModal.returnDate = Utils.normalizeDate(new Date())
        absenceResolutionModal.returnNotes = ''
        absenceResolutionModal.extendedEndDate = Utils.normalizeDate(new Date(Date.now() + 7 * 86400000))
        absenceResolutionModal.saving = false
        absenceResolutionModal.show = true
      }

      const resolveAbsence = async () => {
        const m = absenceResolutionModal
        if (!m.absence) return
        m.saving = true
        try {
          if (m.action === 'confirm_return') {
            // Call dedicated /return endpoint — updates end_date, sets returned_to_duty, writes audit
            await API.returnToDuty(m.absence.id, {
              return_date: m.returnDate,
              notes: m.returnNotes || 'Staff confirmed returned to duty'
            })
            showToast('Confirmed', `${getStaffName(m.absence.staff_member_id)} marked as returned`, 'success')

          } else if (m.action === 'extend') {
            // Standard PUT update with new end date
            await API.updateAbsence(m.absence.id, {
              ...m.absence,
              end_date: m.extendedEndDate,
              hod_notes: (m.absence.hod_notes ? m.absence.hod_notes + '\n' : '') +
                `[EXTENDED: ${new Date().toISOString()}] New end date: ${m.extendedEndDate}` +
                (m.returnNotes ? ` — ${m.returnNotes}` : '')
            })
            showToast('Updated', 'Absence extended', 'success')

          } else if (m.action === 'archive') {
            // Soft-delete via DELETE endpoint — sets cancelled, writes audit note
            await API.deleteAbsence(m.absence.id)
            showToast('Archived', 'Absence record archived', 'success')
          }

          m.show = false
          await loadAbsences()
        } catch (e) {
          showToast('Error', e?.message || 'Failed to resolve absence', 'error')
        } finally { m.saving = false }
      }

      return {
        absences, absenceFilters, absenceModal, absenceOverlapWarning,
        filteredAbsences, filteredAbsencesAll, absenceTotalPages, absenceKPIs,
        loadAbsences, showAddAbsenceModal, editAbsence, saveAbsence, deleteAbsence, purgeAbsence,
        absenceResolutionModal, openResolutionModal, resolveAbsence,
        getStaffName
      }
    }

    // ============ 6.7 useDepartments ============
    function useDepartments({ showToast, showConfirmation, medicalStaff, trainingUnits, rotations }) {
      const departments = ref([])
            const allDepartmentsLookup = ref([])  // includes inactive — for name resolution only
      const departmentFilters = reactive({ search: '', status: '' })
      const departmentModal = reactive({ show: false, mode: 'add', form: { name: '', code: '', status: 'active', head_of_department_id: '', hospital_id: '', description: '', contact_email: '', contact_phone: '' } })

      // Department reassignment modal — shown when dept has active staff/units
      const deptReassignModal = reactive({
        show: false,
        dept: null,
        impact: { activeStaff: [], activeUnits: [], activeRotations: [] },
        staffTargetDeptId: '',
        unitsTargetDeptId: ''
      })

      const filteredDepartments = computed(() => {
        let f = departments.value
        if (departmentFilters.search) { const q = departmentFilters.search.toLowerCase(); f = f.filter(d => d.name?.toLowerCase().includes(q) || d.code?.toLowerCase().includes(q)) }
        if (departmentFilters.status) f = f.filter(d => d.status === departmentFilters.status)
        return f
      })

      // Use allDepartmentsLookup for name resolution so deactivated depts still resolve
      const getDepartmentName  = (id) => allDepartmentsLookup.value.find(d => d.id === id)?.name || departments.value.find(d => d.id === id)?.name || ''
      const getPrimaryDepartment = () => departments.value.find(d => d.is_primary) || null
      const getExternalDepartments = () => departments.value.filter(d => d.is_external && d.status !== 'inactive')
      const isDepartmentExternal = (id) => departments.value.find(d => d.id === id)?.is_external || false
      const isDepartmentPrimary = (id) => departments.value.find(d => d.id === id)?.is_primary || false
      const getDepartmentUnits = (id) => trainingUnits.value.filter(u => u.department_id === id)
      const getDepartmentStaffCount = (id) => medicalStaff.value.filter(s => s.department_id === id).length

      // Break down residents by category for a department
      const getDeptResidentStats = (id) => {
        const residents = medicalStaff.value.filter(s => s.department_id === id && isResidentType(s.staff_type))
        return {
          total: residents.length,
          internal:  residents.filter(r => r.resident_category === 'department_internal').length,
          rotating:  residents.filter(r => r.resident_category === 'rotating_other_dept').length,
          external:  residents.filter(r => r.resident_category === 'external_resident').length,
          list: residents
        }
      }

      // Residents whose home_department_id points to this dept (rotating from here to elsewhere)
      const getDeptHomeResidents = (id) => medicalStaff.value.filter(s =>
        s.home_department_id === id && isResidentType(s.staff_type)
      )

      const loadDepartments = async () => {
        try {
          const [active, all] = await Promise.all([API.getDepartments(), API.getAllDepartments()])
          departments.value = active
          allDepartmentsLookup.value = all
        } catch { showToast('Error', 'Failed to load departments', 'error') }
      }

      const showAddDepartmentModal = () => {
        departmentModal.mode = 'add'
        Object.assign(departmentModal.form, { name: '', code: '', status: 'active', head_of_department_id: '', hospital_id: '', description: '', contact_email: '', contact_phone: '' })
        departmentModal.show = true
      }
      const editDepartment = (d) => { departmentModal.mode = 'edit'; Object.assign(departmentModal.form, { ...d }); departmentModal.show = true }

      const saveDepartment = async (saving) => {
        const f = departmentModal?.form || {}
        if (!f.name?.trim()) { showToast('Validation Error', 'Department name is required', 'error'); return }
        saving.value = true
        try {
          if (departmentModal.mode === 'add') {
            departments.value.unshift(await API.createDepartment(departmentModal.form))
            showToast('Success', 'Department created', 'success')
          } else {
            const result = await API.updateDepartment(departmentModal.form.id, departmentModal.form)
            const idx = departments.value.findIndex(d => d.id === result.id)
            if (idx !== -1) departments.value[idx] = result
            showToast('Success', 'Department updated', 'success')
          }
          departmentModal.show = false
        } catch (e) { showToast('Error', e?.message || 'An unexpected error occurred', 'error') }
        finally { saving.value = false }
      }

      const deleteDepartment = async (dept) => {
        // Step 1: fetch impact from backend
        let impact
        try { impact = (await API.getDepartmentImpact(dept.id))?.impact }
        catch { showToast('Error', 'Could not check department dependencies', 'error'); return }

        const { activeStaff = [], activeUnits = [], activeRotations = [], canDelete } = impact

        // Step 2: if active rotations exist — hard block (can't safely reassign rotations away)
        if (activeRotations.length > 0) {
          showConfirmation({
            title: 'Cannot Deactivate Department',
            message: `"${dept.name}" has ${activeRotations.length} active rotation(s) in its training units.`,
            icon: 'fa-exclamation-triangle',
            confirmButtonText: 'OK', confirmButtonClass: 'btn-secondary',
            details: 'Complete or reassign all active rotations before deactivating this department.',
            onConfirm: () => {}
          })
          return
        }

        // Step 3: clean — no deps at all
        if (canDelete) {
          showConfirmation({
            title: 'Deactivate Department',
            message: `Deactivate "${dept.name}" (${dept.code})?`,
            icon: 'fa-building',
            confirmButtonText: 'Deactivate', confirmButtonClass: 'btn-danger',
            details: 'No active staff or units are assigned to this department.',
            onConfirm: async () => {
              try {
                await API.deleteDepartment(dept.id, null)
                departments.value = departments.value.filter(d => d.id !== dept.id)
                showToast('Deactivated', `${dept.name} has been deactivated`, 'success')
              } catch (e) { showToast('Error', e?.message || 'Failed to deactivate department', 'error') }
            }
          })
          return
        }

        // Step 4: has active staff or units — open reassignment modal
        Object.assign(deptReassignModal, {
          show: true, dept,
          impact: { activeStaff, activeUnits, activeRotations },
          staffTargetDeptId: '',
          unitsTargetDeptId: ''
        })
      }

      const confirmDeptReassignAndDeactivate = async () => {
        const { dept, impact, staffTargetDeptId, unitsTargetDeptId } = deptReassignModal
        const needsStaffReassign = impact.activeStaff.length > 0
        const needsUnitReassign = impact.activeUnits.length > 0
        if (needsStaffReassign && !staffTargetDeptId) { showToast('Required', 'Please select a department for staff reassignment', 'warning'); return }
        if (needsUnitReassign && !unitsTargetDeptId) { showToast('Required', 'Please select a department for unit reassignment', 'warning'); return }
        try {
          await API.deleteDepartment(dept.id, {
            staffDeptId: needsStaffReassign ? staffTargetDeptId : null,
            unitsDeptId: needsUnitReassign ? unitsTargetDeptId : null
          })
          departments.value = departments.value.filter(d => d.id !== dept.id)
          deptReassignModal.show = false
          showToast('Deactivated', `${dept.name} deactivated — staff and units reassigned`, 'success')
          // Reload to pick up fresh state
          await loadDepartments()
        } catch (e) { showToast('Error', e?.message || 'Failed to deactivate department', 'error') }
      }

      // Department detail panel
      const deptPanel = reactive({ show: false, dept: null, tab: 'staff' })

      const openDeptPanel = (dept) => {
        deptPanel.dept = dept
        deptPanel.tab = 'staff'
        deptPanel.show = true
      }

      const closeDeptPanel = () => { deptPanel.show = false }

      // Staff in this department grouped by type
      const deptPanelAttending = computed(() => {
        if (!deptPanel.dept) return []
        return medicalStaff.value.filter(s =>
          s.department_id === deptPanel.dept.id && !isResidentType(s.staff_type)
        ).sort((a,b) => a.full_name.localeCompare(b.full_name))
      })

      const deptPanelResidents = computed(() => {
        if (!deptPanel.dept) return []
        return medicalStaff.value.filter(s =>
          s.department_id === deptPanel.dept.id && isResidentType(s.staff_type)
        ).sort((a,b) => a.full_name.localeCompare(b.full_name))
      })

      // Units belonging to this department
      const deptPanelUnits = computed(() => {
        if (!deptPanel.dept) return []
        return trainingUnits.value.filter(u => u.department_id === deptPanel.dept.id)
      })

      // deptPanelRotations is defined in the main setup after rotationOps loads
      // (rotations ref not available here at construction time)

      // Get supervisor name for a unit
      const getUnitSupervisorName = (unit) => {
        if (!unit) return null
        const supId = unit.supervisor_id || unit.default_supervisor_id
        if (!supId) return null
        return ((allStaffLookup?.value || []).find(s => s.id === supId) || medicalStaff.value.find(s => s.id === supId))?.full_name || null
      }

      // Days remaining for a rotation
      const rotDaysLeft = (r) => {
        const diff = Math.ceil((new Date(r.end_date) - new Date()) / 86400000)
        return diff > 0 ? diff : 0
      }

      const viewDepartmentStaff = (dept) => openDeptPanel(dept)

      return {
        departments, allDepartmentsLookup, departmentFilters, departmentModal, deptReassignModal,
        filteredDepartments, getDepartmentName, getPrimaryDepartment, getExternalDepartments, isDepartmentExternal, isDepartmentPrimary, getDepartmentUnits, getDepartmentStaffCount, getDeptResidentStats, getDeptHomeResidents,
        loadDepartments, showAddDepartmentModal, editDepartment, saveDepartment,
        deleteDepartment, confirmDeptReassignAndDeactivate, viewDepartmentStaff,
        deptPanel, openDeptPanel, closeDeptPanel,
        deptPanelAttending, deptPanelResidents, deptPanelUnits,
        getUnitSupervisorName
      }
    }

    // ============ 6.8 useTrainingUnits ============
    function useTrainingUnits({ showToast, showConfirmation, rotations, trainingUnits, allStaffLookup, allDepartmentsLookup }) {
      // trainingUnits is a shared ref hoisted in main setup — do not redeclare
      const trainingUnitFilters = reactive({ search: '', department: '', status: '' })
      const debouncedTrainingSearch = ref('')
      watch(() => trainingUnitFilters.search, Utils.debounce(v => { debouncedTrainingSearch.value = v }, 250))
      
      // ── Unit staff (attendings who work in each unit) ─────────────────────
      const unitStaffCache  = ref({})   // { [unitId]: [{ id, role, staff: {...} }] }
      const unitStaffLoading = ref({})  // { [unitId]: true/false }

      const loadUnitStaff = async (unitId) => {
        if (unitStaffLoading.value[unitId]) return
        unitStaffLoading.value[unitId] = true
        try {
          const res = await API.request(`/api/training-units/${unitId}/staff`)
          unitStaffCache.value = { ...unitStaffCache.value, [unitId]: res?.data || [] }
        } catch { unitStaffCache.value[unitId] = [] }
        finally { unitStaffLoading.value[unitId] = false }
      }

      const getUnitAttendingCount = (unitId) => (unitStaffCache.value[unitId] || []).length


      const addStaffToUnit = async (unitId, staffId, role = 'primary') => {
        try {
          const res = await API.request(`/api/training-units/${unitId}/staff`, {
            method: 'POST', body: JSON.stringify({ staff_id: staffId, role })
          })
          const updated = [...(unitStaffCache.value[unitId] || []), res.data]
          unitStaffCache.value = { ...unitStaffCache.value, [unitId]: updated }
          showToast('Clinician assigned', `Added to unit team`, 'success')
          return res.data
        } catch (e) {
          showToast('Error', e?.message || 'Failed to assign', 'error')
          throw e
        }
      }

      const removeStaffFromUnit = async (unitId, staffId) => {
        try {
          await API.request(`/api/training-units/${unitId}/staff/${staffId}`, { method: 'DELETE' })
          unitStaffCache.value = {
            ...unitStaffCache.value,
            [unitId]: (unitStaffCache.value[unitId] || []).filter(m => m.staff?.id !== staffId)
          }
          showToast('Removed', 'Clinician removed from unit team', 'info')
        } catch (e) {
          showToast('Error', e?.message || 'Failed to remove', 'error')
        }
      }
      const trainingUnitModal = reactive({ show: false, mode: 'add', form: { unit_name: '', unit_code: '', department_id: '', maximum_residents: 2, unit_status: 'active', unit_type: 'clinical_unit', supervising_attending_id: '', unit_description: '', specialty: '', location_building: '', location_floor: '' } })
      const unitResidentsModal = reactive({ show: false, unit: null, rotations: [] })
      const unitCliniciansModal = reactive({ show: false, unit: null, clinicians: [], supervisorId: '', allStaff: [] })

      const filteredTrainingUnits = computed(() => {
        // Only show units linked to Neumología/Pulmonology — filter out rotation destinations
        // A unit belongs to Neumología if: specialty=Pulmonology/Surgery/Critical Care etc (our units)
        // OR department_name contains Neumología/Pulmonology
        // Exclude units from external services (Cardiología, Medicina Interna etc that are rotation DESTINATIONS)
        // We identify ours by dept_name matching the home department name pattern
        let f = trainingUnits.value.filter(u => {
          const deptName = (u.department?.name || u.department_name || '').toLowerCase()
          // Primary check: unit's department_id is in our known departments list.
          // This covers all newly created units without needing hardcoded names.
          if (u.department_id && allDepartmentsLookup.value.some(d => d.id === u.department_id)) return true
          // Fallback: legacy units without a department_id — keep old name matching
          return deptName.includes('neumolog') || deptName.includes('pulmonolog') ||
                 deptName.includes('cirugía torácica') ||
                 u.unit_code === 'UCRI' || u.unit_code === 'PFR' || u.unit_code === 'UTB' ||
                 u.unit_code === 'SUEÑO' || u.unit_code === 'TRANSP'
        })
        if (debouncedTrainingSearch.value) { const q = debouncedTrainingSearch.value.toLowerCase(); f = f.filter(u => u.unit_name?.toLowerCase().includes(q)) }
        if (trainingUnitFilters.department) f = f.filter(u => u.department_id === trainingUnitFilters.department)
        if (trainingUnitFilters.status) {
          if (trainingUnitFilters.status === 'available') {
            f = f.filter(u => getUnitActiveRotationCount(u.id) < u.maximum_residents)
          } else if (trainingUnitFilters.status === 'full') {
            f = f.filter(u => getUnitActiveRotationCount(u.id) >= u.maximum_residents)
          } else {
            f = f.filter(u => u.unit_status === trainingUnitFilters.status)
          }
        }
        // Sort by urgency: overlap > full > partial > available
        return [...f].sort((a, b) => {
          const score = (u) => {
            if (getUnitOverlapWarning(u.id)) return 0
            const ratio = getUnitActiveRotationCount(u.id) / (u.maximum_residents || 1)
            if (ratio >= 1) return 1
            if (ratio > 0.5) return 2
            if (ratio > 0) return 3
            return 4
          }
          return score(a) - score(b)
        })
      })

      // Groups filteredTrainingUnits by department for section-header card layout
      const DEPT_NAME_MAP = {
        'Department of Pulmonology': 'Neumología',
        'Cirugía Torácica y Trasplante Pulmonar': 'Cirugía Torácica y Trasplante',
        'General Medicine': 'Medicina General',
        'INT. MEDICINE': 'Medicina Interna'
      }
      const unitsByDepartment = computed(() => {
        const depts = {}
        filteredTrainingUnits.value.forEach(u => {
          const key = u.department_id || '__none__'
          const rawName = u.department?.name || u.department_name || 'Sin departamento'
          const displayName = DEPT_NAME_MAP[rawName] || rawName
          if (!depts[key]) depts[key] = { deptId: key, deptName: displayName, units: [] }
          depts[key].units.push(u)
        })
        return Object.values(depts).sort((a, b) => {
          if (a.deptName === 'Neumología') return -1
          if (b.deptName === 'Neumología') return 1
          return a.deptName.localeCompare(b.deptName, 'es')
        })
      })

      const getUnitActiveRotationCount = (id) => {
        const today = new Date(); today.setHours(0,0,0,0)
        return rotations.value.filter(r =>
          r.training_unit_id === id &&
          r.rotation_status === 'active' &&
          new Date(r.start_date + 'T00:00:00') <= today &&
          new Date(r.end_date   + 'T00:00:00') >= today
        ).length
      }

      const getUnitScheduledCount = (id) => {
        const today = new Date(); today.setHours(0,0,0,0)
        return rotations.value.filter(r =>
          r.training_unit_id === id &&
          r.rotation_status === 'scheduled' &&
          new Date(r.start_date + 'T00:00:00') > today
        ).length
      }

      // Check for future overlap conflicts: will scheduled + active exceed capacity at any point?
      const getUnitOverlapWarning = (id) => {
        const unit = trainingUnits.value.find(u => u.id === id)
        if (!unit) return null
        const maxSlots = unit.maximum_residents
        const upcoming = rotations.value.filter(r =>
          r.training_unit_id === id &&
          ['active','scheduled'].includes(r.rotation_status)
        )
        // Check each rotation's start date — how many others overlap at that moment?
        for (const rot of upcoming) {
          const checkDate = new Date(rot.start_date + 'T00:00:00')
          const concurrent = upcoming.filter(r =>
            new Date(r.start_date + 'T00:00:00') <= checkDate && new Date(r.end_date + 'T00:00:00') >= checkDate
          ).length
          if (concurrent > maxSlots) {
            return { date: rot.start_date, concurrent, max: maxSlots }
          }
        }
        return null
      }

      const getUnitRotations = (id) => rotations.value
        .filter(r => r.training_unit_id === id && ['active', 'scheduled'].includes(r.rotation_status))
        .sort((a, b) => new Date(a.start_date) - new Date(b.start_date))

      const getResidentShortName = (id) => {
        const s = allStaffLookup.value.find(x => x.id === id)
               || medicalStaff.value.find(x => x.id === id)
        if (!s) {
          // Last resort: use the joined resident object already on the rotation record
          const rot = rotations.value.find(r => r.resident_id === id)
          if (rot?.resident?.full_name) {
            const parts = rot.resident.full_name.trim().split(' ')
            return parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1][0]}.` : rot.resident.full_name
          }
          return '—'
        }
        const parts = (s.full_name || '').trim().split(' ')
        return parts.length > 1 ? `${parts[0]} ${parts[parts.length-1][0]}.` : s.full_name
      }

      // ── Timeline view state ─────────────────────────────────────────────
      const trainingUnitView    = ref('timeline')  // 'timeline' | 'detail'
      const trainingUnitHorizon = ref(6)            // months to show: 3 | 6 | 12

      // Generate the array of month objects for the timeline header
      const getTimelineMonths = (horizonMonths) => {
        const today = new Date()
        const months = []
        for (let i = 0; i < horizonMonths; i++) {
          const d = new Date(today.getFullYear(), today.getMonth() + i, 1)
          months.push({
            key:       `${d.getFullYear()}-${d.getMonth()}`,
            label:     d.toLocaleDateString('es-ES', { month: 'short', year: i === 0 || d.getMonth() === 0 ? '2-digit' : undefined }),
            year:      d.getFullYear(),
            month:     d.getMonth(),   // 0-based
            isCurrent: i === 0
          })
        }
        return months
      }

      // For each slot (1..max), compute monthly status across the horizon
      const getUnitSlots = (unitId, maxResidents, horizonMonths) => {
        // All active+scheduled rotations for this unit, sorted by start date
        const unitRots = rotations.value.filter(r =>
          r.training_unit_id === unitId && ['active','scheduled'].includes(r.rotation_status)
        ).sort((a,b) => new Date(a.start_date) - new Date(b.start_date))

        const months = getTimelineMonths(horizonMonths)

        // Assign rotations to physical slots using a greedy bin-packing algorithm
        // so sequential rotations reuse the same slot (e.g. Slot 1: R1 Jan-Mar, then R3 Apr-Jun)
        const slots = Array.from({ length: maxResidents }, () => ({ rotations: [] }))

        for (const rot of unitRots) {
          const rotStart = new Date(rot.start_date)
          const rotEnd   = new Date(rot.end_date)
          // Find first slot where no existing rotation overlaps this one
          const targetSlot = slots.find(slot =>
            slot.rotations.every(existing => {
              const eEnd = new Date(existing.end_date)
              const eStart = new Date(existing.start_date)
              return rotEnd < eStart || rotStart > eEnd  // no overlap
            })
          )
          if (targetSlot) targetSlot.rotations.push(rot)
          // If no slot available (over-capacity), rotation not shown — capacity exceeded
        }

        return slots.map((slot, slotIdx) => {
          // Build month-by-month data — may have multiple rotations covering different months
          const monthData = months.map(m => {
            const mStart = new Date(m.year, m.month, 1)
            const mEnd   = new Date(m.year, m.month + 1, 0)

            // Find which rotation (if any) covers this month
            const coveringRot = slot.rotations.find(rot => {
              const rotStart = new Date(rot.start_date)
              const rotEnd   = new Date(rot.end_date)
              return rotStart <= mEnd && rotEnd >= mStart
            })

            let status   = 'free'
            let tooltip  = `Slot ${slotIdx + 1} — ${m.label}: Available`
            let showName = false
            let initials = null
            let residentName = null

            if (coveringRot) {
              residentName = getResidentShortName(coveringRot.resident_id)
              initials     = residentName !== '—'
                ? residentName.split(' ').map(p => p[0]).join('').slice(0,2).toUpperCase()
                : '?'
              const rotStart = new Date(coveringRot.start_date)
              const rotEnd   = new Date(coveringRot.end_date)
              const fullMonth = rotStart <= mStart && rotEnd >= mEnd
              status    = fullMonth ? 'occupied' : 'partial'
              showName  = fullMonth
              const fmtStart = rotStart.toLocaleDateString('es-ES',{day:'2-digit',month:'short'})
              const fmtEnd   = rotEnd.toLocaleDateString('es-ES',{day:'2-digit',month:'short'})
              tooltip = `${residentName} · ${fmtStart} → ${fmtEnd}`
            }

            return { key: m.key, label: m.label, year: m.year, month: m.month, isCurrent: m.isCurrent, status, tooltip, showName, initials }
          })

          // Primary resident for the slot label (current/first active rotation)
          const primaryRot = slot.rotations.find(r => r.rotation_status === 'active') || slot.rotations[0]
          const primaryName = primaryRot ? getResidentShortName(primaryRot.resident_id) : null
          const primaryInitials = primaryName && primaryName !== '—'
            ? primaryName.split(' ').map(p => p[0]).join('').slice(0,2).toUpperCase()
            : null

          return {
            slotIdx,
            residentId:   primaryRot?.resident_id || null,
            residentName: primaryName,
            initials:     primaryInitials,
            rotationCount: slot.rotations.length,
            months: monthData
          }
        })
      }

      // Days until a rotation ends (for "Free in Xd" chip)
      const getDaysUntilFree = (endDate) => {
        const today = new Date(); today.setHours(0,0,0,0)
        const end   = new Date(Utils.normalizeDate(endDate) + 'T00:00:00')
        return Math.ceil((end - today) / (1000 * 60 * 60 * 24))
      }

      // ── Timeline cell popover ─────────────────────────────────────────
      const tlPopover = reactive({ show: false, unitName: '', slotIdx: 0, monthLabel: '', entries: [], x: 0, y: 0 })

      const openCellPopover = (event, unitId, unitName, slot, month) => {
        event.stopPropagation()
        // Collect ALL rotations in this slot that touch this month
        const mStart = new Date(month.year, month.month, 1)
        const mEnd   = new Date(month.year, month.month + 1, 0)
        // Get all rotations for this unit to find ones in this slot and month
        const unitRots = rotations.value.filter(r =>
          r.training_unit_id === unitId && ['active','scheduled'].includes(r.rotation_status)
        )
        // We need the same slot assignment as getUnitSlots — find rotations assigned to this slotIdx
        // Use greedy bin-packing identical to getUnitSlots
        const allSlots = Array.from({ length: 20 }, () => ({ rotations: [] }))
        const sorted = [...unitRots].sort((a,b) => new Date(a.start_date) - new Date(b.start_date))
        for (const rot of sorted) {
          const rotStart = new Date(rot.start_date)
          const rotEnd   = new Date(rot.end_date)
          const target = allSlots.find(s => s.rotations.every(e => {
            const eEnd = new Date(e.end_date); const eStart = new Date(e.start_date)
            return rotEnd < eStart || rotStart > eEnd
          }))
          if (target) target.rotations.push(rot)
        }
        const slotRots = allSlots[slot.slotIdx]?.rotations || []
        // Filter to those touching this month
        const touching = slotRots.filter(rot => {
          const s = new Date(rot.start_date); const e = new Date(rot.end_date)
          return s <= mEnd && e >= mStart
        })
        const fmt = (d) => new Date(d).toLocaleDateString('es-ES', { day:'2-digit', month:'short', year:'2-digit' })
        const entries = touching.length
          ? touching.map(rot => ({
              name: getResidentShortName(rot.resident_id),
              start: fmt(rot.start_date),
              end:   fmt(rot.end_date),
              status: rot.rotation_status,
              partial: new Date(rot.start_date) > mStart || new Date(rot.end_date) < mEnd
            }))
          : [{ name: '—', start: null, end: null, status: 'free', partial: false }]
        // Position near the clicked cell
        const rect = event.currentTarget.getBoundingClientRect()
        tlPopover.show = true
        tlPopover.unitName = unitName
        tlPopover.slotIdx = slot.slotIdx + 1
        tlPopover.monthLabel = month.label
        tlPopover.entries = entries
        const popoverWidth = 300
        const popoverHeight = 120 // conservative estimate
        const viewportWidth = window.innerWidth
        const viewportHeight = window.innerHeight
        const left = rect.left + popoverWidth > viewportWidth
          ? Math.max(4, rect.right - popoverWidth)
          : rect.left
        const top = rect.bottom + popoverHeight > viewportHeight
          ? rect.top - popoverHeight - 4
          : rect.bottom + 6
        tlPopover.x = left
        tlPopover.y = top
      }
      const closeCellPopover = () => { tlPopover.show = false }

      // ── Units Occupancy Panel ─────────────────────────────────────────────
      const occupancyPanel   = reactive({ show: false })
      const unitDetailDrawer = reactive({ show: false, unit: null })

      const getUnitMonthOccupancy = (unitId, year, month) => {
        const mStart = new Date(year, month, 1)
        const mEnd   = new Date(year, month + 1, 0)
        const unit   = trainingUnits.value.find(u => u.id === unitId)
        if (!unit) return { status: 'free', occupied: 0, scheduled: 0, total: 0 }
        const maxSlots = unit.maximum_residents
        const touching = (rotations.value || []).filter(r =>
          r.training_unit_id === unitId &&
          ['active','scheduled'].includes(r.rotation_status) &&
          new Date(r.start_date + 'T00:00:00') <= mEnd && new Date(r.end_date + 'T00:00:00') >= mStart
        )
        // Separate truly active (date range covers any day in month) from scheduled future
        const today = new Date(); today.setHours(0,0,0,0)
        const isCurrentMonth = mStart <= today && mEnd >= today
        const active    = isCurrentMonth
          ? touching.filter(r => r.rotation_status === 'active' && new Date(r.start_date + 'T00:00:00') <= today && new Date(r.end_date + 'T00:00:00') >= today).length
          : touching.filter(r => ['active','scheduled'].includes(r.rotation_status)).length
        const scheduled = touching.filter(r => r.rotation_status === 'scheduled').length
        const occupied  = isCurrentMonth ? active : touching.length
        if (occupied === 0) return { status: 'free', occupied: 0, total: maxSlots }
        const isClosing = touching.some(r => {
          const e = new Date(r.end_date + 'T00:00:00')
          return e.getFullYear() === year && e.getMonth() === month && e < mEnd
        })
        if (occupied >= maxSlots) return { status: isClosing ? 'closing' : 'occupied', occupied, total: maxSlots }
        return { status: isClosing ? 'closing' : 'partial', occupied, total: maxSlots }
      }

      const getNextFreeMonth = (unitId) => {
        const today = new Date()
        const unit  = trainingUnits.value.find(u => u.id === unitId)
        if (!unit) return null
        for (let i = 0; i < 24; i++) {
          const d = new Date(today.getFullYear(), today.getMonth() + i, 1)
          const occ = getUnitMonthOccupancy(unitId, d.getFullYear(), d.getMonth())
          if (occ.occupied < occ.total) {
            return {
              label:      d.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }),
              shortLabel: d.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' }),
              date:       `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-01`,
              monthsAway: i,
              freeSlots:  occ.total - occ.occupied
            }
          }
        }
        return null
      }

      const occupancyHeatmap = computed(() => {
        const today = new Date()
        const activeUnits = trainingUnits.value.filter(u => u.unit_status === 'active')
        return Array.from({ length: 12 }, (_, i) => {
          const d = new Date(today.getFullYear(), today.getMonth() + i, 1)
          let free = 0, partial = 0, closing = 0, full = 0
          for (const u of activeUnits) {
            const occ = getUnitMonthOccupancy(u.id, d.getFullYear(), d.getMonth())
            if      (occ.status === 'free')    free++
            else if (occ.status === 'closing') closing++
            else if (occ.status === 'partial') partial++
            else                               full++
          }
          return {
            key: `${d.getFullYear()}-${d.getMonth()}`,
            label: d.toLocaleDateString('es-ES', { month: 'short' }),
            yearLabel: (i === 0 || d.getMonth() === 0) ? `'${d.getFullYear().toString().slice(-2)}` : '',
            isCurrent: i === 0,
            free, partial, closing, full, total: activeUnits.length
          }
        })
      })

      const occupancyPanelUnits = computed(() => {
        const today = new Date()
        if (!rotations.value) return []
        return trainingUnits.value
          .filter(u => u.unit_status === 'active')
          .map(u => {
            const occ      = getUnitMonthOccupancy(u.id, today.getFullYear(), today.getMonth())
            const nextFree = getNextFreeMonth(u.id)
            return { ...u, occ, nextFree }
          })
          .sort((a, b) => {
            const order = { free: 0, closing: 1, partial: 2, occupied: 3 }
            const diff  = (order[a.occ.status] ?? 4) - (order[b.occ.status] ?? 4)
            if (diff !== 0) return diff
            return (a.nextFree?.monthsAway ?? 99) - (b.nextFree?.monthsAway ?? 99)
          })
      })

      const openUnitDetail = (unit) => {
        const today = new Date()
        const occ      = getUnitMonthOccupancy(unit.id, today.getFullYear(), today.getMonth())
        const nextFree = getNextFreeMonth(unit.id)
        unitDetailDrawer.unit = { ...unit, occ, nextFree }
        unitDetailDrawer.show = true
      }

      const loadTrainingUnits = async () => {
        try {
          trainingUnits.value = await API.getTrainingUnits()
          // Pre-load attending staff for all active units (non-blocking, fills unitStaffCache)
          trainingUnits.value
            .filter(u => u.unit_status !== 'inactive')
            .forEach(u => loadUnitStaff(u.id))
        }
        catch { showToast('Error', 'Failed to load training units', 'error') }
      }

      const showAddTrainingUnitModal = (opts = {}) => {
        trainingUnitModal.mode = 'add'
        Object.assign(trainingUnitModal.form, {
          unit_name: '', unit_code: '',
          department_id: opts.department_id || '',
          maximum_residents: 2, unit_status: 'active',
          unit_type: 'clinical_unit', supervising_attending_id: '',
          unit_description: '', specialty: '', location_building: '', location_floor: ''
        })
        trainingUnitModal.show = true
      }
      const editTrainingUnit = (u) => { trainingUnitModal.mode = 'edit'; trainingUnitModal.form = { ...u }; trainingUnitModal.show = true }

      const deleteTrainingUnit = (unit) => {
        const activeRotations = rotations.value.filter(r =>
          r.training_unit_id === unit.id && ['active', 'scheduled'].includes(r.rotation_status)
        )
        if (activeRotations.length > 0) {
          showConfirmation({
            title: 'Cannot Delete Training Unit',
            message: `"${unit.unit_name}" has ${activeRotations.length} active or scheduled rotation(s) assigned to it.`,
            icon: 'fa-exclamation-triangle',
            confirmButtonText: 'OK',
            confirmButtonClass: 'btn-secondary',
            details: 'Reassign or complete all active rotations before deleting this unit.',
            onConfirm: () => {}
          })
          return
        }
        showConfirmation({
          title: 'Delete Training Unit', icon: 'fa-trash',
          message: `Delete "${unit.unit_name}"?`,
          confirmButtonText: 'Delete Unit', confirmButtonClass: 'btn-danger',
          details: activeRotations.length === 0 ? 'No active rotations are assigned to this unit.' : '',
          onConfirm: async () => {
            try {
              await API.deleteTrainingUnit(unit.id)
              // Backend soft-deletes (sets unit_status = 'inactive') — remove from active list locally
              trainingUnits.value = trainingUnits.value.filter(u => u.id !== unit.id)
              showToast('Deactivated', `${unit.unit_name} deactivated`, 'success')
            } catch (e) {
              showToast('Error', e?.message || 'Failed to deactivate training unit', 'error')
              try { trainingUnits.value = await API.getTrainingUnits() } catch {}
            }
          }
        })
      }

      const openUnitClinicians = (unit, allStaff) => {
        unitCliniciansModal.unit = unit
        // Pre-populate from unitStaffCache (the new source of truth)
        const cachedStaff = unitStaffCache.value[unit.id] || []
        unitCliniciansModal.clinicians = cachedStaff.map(m => m.staff?.id).filter(Boolean)
        unitCliniciansModal.supervisorId = unit.supervisor_id || unit.supervising_attending_id || ''
        // Filter to same-department attendings/fellows only
        // If unit has a department_id, only show staff from that department
        const deptFilter = unit.department_id
          ? s => s.department_id === unit.department_id
          : () => true
        unitCliniciansModal.allStaff = allStaff.filter(s =>
          (staffTypeMap.value[s.staff_type]?.can_supervise ||
           ['attending_physician','fellow'].includes(s.staff_type)) &&
          s.employment_status === 'active' &&
          deptFilter(s)
        )
        unitCliniciansModal.show = true
      }

      // Open clinicians modal from dept panel attending row — assign attending to a unit
      const assignAttendingToUnit = (staff) => {
        // Find all units in the same department as this attending
        const deptUnits = trainingUnits.value.filter(u =>
          u.department_id === staff.department_id && u.unit_status === 'active'
        )
        if (deptUnits.length === 0) {
          showToast('No Units', 'No active units in this department', 'warning')
          return
        }
        // If attending already supervises a unit, open that unit's clinicians modal
        const currentUnit = deptUnits.find(u => u.supervisor_id === staff.id)
        const targetUnit = currentUnit || deptUnits[0]
        // Pre-select this attending
        unitCliniciansModal.unit = targetUnit
        unitCliniciansModal.clinicians = (unitStaffCache.value[targetUnit.id] || []).map(m => m.staff?.id).filter(Boolean)
        unitCliniciansModal.supervisorId = staff.id  // pre-select this attending
        const deptFilter = targetUnit.department_id
          ? s => s.department_id === targetUnit.department_id
          : () => true
        unitCliniciansModal.allStaff = medicalStaff.value.filter(s =>
          (staffTypeMap.value[s.staff_type]?.can_supervise ||
           ['attending_physician','fellow'].includes(s.staff_type)) &&
          s.employment_status === 'active' &&
          deptFilter(s)
        )
        unitCliniciansModal.show = true
      }

      const saveUnitClinicians = async () => {
        const u = unitCliniciansModal.unit
        if (!u?.id) { showToast('Error', 'No unit selected', 'error'); return }
        try {
          // 1. Update the unit's designated supervisor (backward compat field)
          const payload = {
            unit_name: u.unit_name, unit_code: u.unit_code, department_id: u.department_id,
            maximum_residents: u.maximum_residents || 5, unit_status: u.unit_status || 'active',
          }
          if (unitCliniciansModal.supervisorId) payload.supervising_attending_id = unitCliniciansModal.supervisorId
          if (u.specialty)         payload.specialty         = u.specialty
          if (u.location_building) payload.location_building = u.location_building
          if (u.location_floor)    payload.location_floor    = u.location_floor
          await API.updateTrainingUnit(u.id, payload)

          // 2. Sync clinical team to unit_staff table
          const selectedIds  = unitCliniciansModal.clinicians || []
          const currentStaff = unitStaffCache.value[u.id] || []
          const currentIds   = currentStaff.map(m => m.staff?.id).filter(Boolean)

          // Add newly selected clinicians
          const toAdd = selectedIds.filter(id => !currentIds.includes(id))
          await Promise.all(toAdd.map(staffId =>
            API.request(`/api/training-units/${u.id}/staff`, {
              method: 'POST',
              body: JSON.stringify({ staff_id: staffId, role: staffId === unitCliniciansModal.supervisorId ? 'primary' : 'secondary' })
            }).catch(() => null)  // ignore 409 duplicates
          ))

          // Remove deselected clinicians
          const toRemove = currentIds.filter(id => !selectedIds.includes(id))
          await Promise.all(toRemove.map(staffId =>
            API.request(`/api/training-units/${u.id}/staff/${staffId}`, { method: 'DELETE' }).catch(() => null)
          ))

          // Refresh cache for this unit
          await loadUnitStaff(u.id)

          // Update local trainingUnits record
          const idx = trainingUnits.value.findIndex(x => x.id === u.id)
          if (idx !== -1) {
            trainingUnits.value[idx] = {
              ...trainingUnits.value[idx],
              supervising_attending_id: unitCliniciansModal.supervisorId || null,
              supervisor_id: unitCliniciansModal.supervisorId || null,
            }
          }
          unitCliniciansModal.show = false
          showToast('Saved', `Clinical team updated · ${selectedIds.length} clinician${selectedIds.length !== 1 ? 's' : ''}`, 'success')
        } catch(e) { showToast('Error', e?.message || 'Failed to save unit staff', 'error') }
      }

      const viewUnitResidents = (unit, allRotations) => {
        unitResidentsModal.unit = unit
        unitResidentsModal.rotations = allRotations.filter(r => r.training_unit_id === unit.id && ['active', 'scheduled'].includes(r.rotation_status))
        unitResidentsModal.show = true
      }

      const saveTrainingUnit = async (saving, deptLookup) => {
        const f = trainingUnitModal.form
        if (!f.unit_name?.trim()) { showToast('Validation Error', 'Unit name is required', 'error'); return }
        if (!f.unit_code?.trim()) { showToast('Validation Error', 'Unit code is required', 'error'); return }
        if (!f.department_id) { showToast('Validation Error', 'Please select a department / service', 'error'); return }
        if (!f.maximum_residents || f.maximum_residents < 1) { showToast('Validation Error', 'Maximum residents must be at least 1', 'error'); return }
        saving.value = true
        try {
          // Exact fields from backend Joi trainingUnit schema — nothing more, nothing less
          // department_name is NOT NULL in schema — derive from departments list
          const deptRecord = deptLookup?.value?.find(d => d.id === f.department_id) || null
          const data = {
            unit_name: f.unit_name.trim(),
            unit_code: f.unit_code.trim().toUpperCase(),
            department_id: f.department_id || null,
            department_name: deptRecord?.name || f.department_name || 'Pulmonology',
            maximum_residents: parseInt(f.maximum_residents) || 5,
            unit_status: f.unit_status || 'active',
            unit_type: f.unit_type || 'training_unit',
            unit_description: f.unit_description || '',
            specialty: f.specialty || '',
            location_building: f.location_building || '',
            location_floor: f.location_floor || '',
            supervisor_id: f.supervising_attending_id || null,
            supervising_attending_id: f.supervising_attending_id || null,
          }
          if (trainingUnitModal.mode === 'add') { trainingUnits.value.unshift(await API.createTrainingUnit(data)); showToast('Success', 'Training unit created', 'success') }
          else { const result = await API.updateTrainingUnit(f.id, data); const idx = trainingUnits.value.findIndex(u => u.id === result.id); if (idx !== -1) trainingUnits.value[idx] = result; showToast('Success', 'Training unit updated', 'success') }
          trainingUnitModal.show = false
        } catch (e) { showToast('Error', e?.message || 'An unexpected error occurred', 'error') }
        finally { saving.value = false }
      }

      // ── Weekly Staffing Grid ─────────────────────────────────────────
      // Used in the Training Units weekly view tab
      const weeklyStaffingGrid = computed(() => {
        const today = new Date(); today.setHours(0,0,0,0)
        // Find Monday of current week
        const monday = new Date(today)
        monday.setDate(today.getDate() - ((today.getDay() + 6) % 7))
        const days = Array.from({ length: 7 }, (_, i) => {
          const d = new Date(monday); d.setDate(monday.getDate() + i)
          const iso = d.toISOString().split('T')[0]
          return { iso, date: d, isToday: iso === today.toISOString().split('T')[0], isWeekend: d.getDay() === 0 || d.getDay() === 6, label: d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' }) }
        })
        const activeUnits = trainingUnits.value.filter(u => u.unit_status === 'active')
        const rows = activeUnits.map(unit => {
          const cells = days.map(day => {
            const activeRots = (rotations.value || []).filter(r =>
              r.training_unit_id === unit.id &&
              ['active','scheduled'].includes(r.rotation_status) &&
              r.start_date <= day.iso && r.end_date >= day.iso
            )
            return { rots: activeRots, count: activeRots.length, full: activeRots.length >= unit.maximum_residents }
          })
          return { unitId: unit.id, unitName: unit.unit_name, maxResidents: unit.maximum_residents, cells }
        })
        return { monday, days, rows }
      })

      return { trainingUnits, trainingUnitFilters, trainingUnitModal, unitsByDepartment, unitResidentsModal, unitCliniciansModal, filteredTrainingUnits, getUnitActiveRotationCount, getUnitRotations, getUnitScheduledCount, getUnitOverlapWarning, getResidentShortName, loadTrainingUnits, showAddTrainingUnitModal, editTrainingUnit, deleteTrainingUnit, openUnitClinicians, saveUnitClinicians, assignAttendingToUnit, viewUnitResidents, saveTrainingUnit, trainingUnitView, trainingUnitHorizon, getTimelineMonths, getUnitSlots, getDaysUntilFree, tlPopover, openCellPopover, closeCellPopover, unitStaffCache, loadUnitStaff, getUnitAttendingCount, addStaffToUnit, removeStaffFromUnit,
        occupancyPanel, unitDetailDrawer, occupancyHeatmap, occupancyPanelUnits, getUnitMonthOccupancy, getNextFreeMonth, openUnitDetail,
        weeklyStaffingGrid }
    }

    // ============ 6.9 useComms ============
    function useComms({ showToast, showConfirmation, medicalStaff, onCallSchedule, absences, rotations }) {
      const announcements  = ref([])
      const opsMetrics     = Vue.ref([])
      const opsLoading     = Vue.ref(false)
      const briefingForm   = Vue.reactive({
        show: false,
        fields: {
          interconsultas_total:         { label: 'Interconsultas',      sub_label: 'urgentes', value: '', sub: '' },
          er_patients_waiting:          { label: 'ER — Neumología',     sub_label: 'espera media (min)', value: '', sub: '' },
          beds_free_total:              { label: 'Camas libres',        sub_label: 'de las cuales UCI', value: '', sub: '' },
          discharges_pending_total:     { label: 'Altas pendientes',    sub_label: 'esperando informe', value: '', sub: '' },
          bronchoscopies_urgent:        { label: 'Broncoscopias urg.',  sub_label: 'suite libre desde (hora)', value: '', sub: '' },
        }
      })

      const loadOpsMetrics = async () => {
        opsLoading.value = true
        try {
          const res = await API.getOpsMetrics()
          opsMetrics.value = res?.data || []
        } catch(e) { opsMetrics.value = []; console.error('[neumDesk] loadOpsMetrics failed:', e) }
        finally { opsLoading.value = false }
      }

      const getMetric = (key) => opsMetrics.value.find(m => m.metric_key === key)
      const metricVal = (key) => getMetric(key)?.metric_value ?? null
      const metricSub = (key) => getMetric(key)?.metric_sub ?? null
      const metricVal2 = (key) => getMetric(key)?.metric_value2 ?? null

      const saveDailyBriefing = async (saving) => {
        if (saving?.value) return
        if (saving) saving.value = true
        try {
          const rows = []
          for (const [key, field] of Object.entries(briefingForm.fields)) {
            if (field.value !== '' && field.value !== null) {
              rows.push({
                metric_key:   key,
                metric_value: parseInt(field.value) || 0,
                metric_sub:   field.sub || null,
                metric_value2: null,
              })
            }
          }
          if (!rows.length) { showToast('Validation', 'Enter at least one number', 'warning'); return }
          await API.postOpsMetrics(rows)
          briefingForm.show = false
          showToast('Briefing posted', 'Pulse tiles updated for the team', 'success')
          await loadOpsMetrics()
        } catch(e) { showToast('Error', e.message || 'Failed to post briefing', 'error') }
        finally { if (saving) saving.value = false }
      }

      const updateMetricInline = async (key, value, sub = null) => {
        try {
          await API.postOpsMetrics([{ metric_key: key, metric_value: parseInt(value)||0, metric_sub: sub }])
          await loadOpsMetrics()
        } catch(e) { showToast('Error', 'Failed to update', 'error') }
      }

      const communicationsFilters = reactive({ search: '', priority: '', audience: '', type: '' })

      // ── Ops Room state ──────────────────────────────────────────
      const broadcastForm  = Vue.reactive({ show: false, type: 'broadcast', text: '', expiryHours: 4 })
      const feedFilter     = Vue.ref('all')   // all | broadcast | protocol | announcement | kudos

      // Live broadcast = announcements with priority 'urgent' that haven't expired
      const livebroadcasts = Vue.computed(() =>
        (announcements.value || []).filter(a => {
          if (a.priority_level !== 'urgent') return false
          if (!a.publish_end_date) return true
          return new Date(a.publish_end_date) > new Date()
        }).slice(0, 3)
      )

      // Feed = all non-expired announcements ordered by created_at desc
      const feedItems = Vue.computed(() => {
        let items = (announcements.value || []).slice()
        if (feedFilter.value !== 'all') {
          items = items.filter(a => (a.type || 'announcement') === feedFilter.value)
        }
        return items.slice(0, 30)
      })

      // Pulse stats derived from existing data
      const commsPulse = Vue.computed(() => {
        const today = new Date()
        const todayStr = today.toISOString().slice(0, 10)
        const onDuty = (medicalStaff?.value || []).filter(s => s.employment_status === 'active').length
        const onCall = (onCallSchedule?.value || []).filter(s => {
          const d = s.duty_date ? Utils.normalizeDate(s.duty_date) : ''
          return d === todayStr
        }).length
        const absent = (absences?.value || []).filter(a => {
          const s = Utils.normalizeDate(a.start_date)
          const e = Utils.normalizeDate(a.end_date)
          return todayStr >= s && todayStr <= e && a.current_status === 'currently_absent'
        }).length
        const activeBroadcasts = livebroadcasts.value.length
        // residents currently on active rotation (closure access to rotations)
        let onRotation = 0
        try { onRotation = (rotations?.value || []).filter(r => r.rotation_status === 'active').length } catch(e) {}
        return { onDuty, onCall, absent, activeBroadcasts, onRotation }
      })

      const broadcastTypeConfig = {
        broadcast:    { label: 'Broadcast', color: '#ef4444', bg: 'rgba(239,68,68,.08)',   barColor: '#ef4444' },
        protocol:     { label: 'Protocol',  color: '#10b981', bg: 'rgba(16,185,129,.08)', barColor: '#10b981' },
        announcement: { label: 'Announcement', color: '#94a3b8', bg: 'rgba(148,163,184,.08)', barColor: '#94a3b8' },
        kudos:        { label: 'Recognition', color: '#0ea5e9', bg: 'rgba(14,165,233,.08)', barColor: '#0ea5e9' },
      }

      const getAnnouncementType = (a) => {
        if (a.priority_level === 'urgent') return 'broadcast'
        if (a.type) return a.type
        if (a.priority_level === 'high') return 'protocol'
        return 'announcement'
      }

      const openBroadcastForm = (type = 'broadcast') => {
        broadcastForm.show   = true
        broadcastForm.type   = type
        broadcastForm.text   = ''
        broadcastForm.expiryHours = type === 'broadcast' ? 4 : type === 'kudos' ? 168 : 72
      }

      const submitBroadcast = async (saving) => {
        if (!broadcastForm.text.trim()) { showToast('Validation', 'Message is required', 'warning'); return }
        if (saving?.value) return
        if (saving) saving.value = true
        try {
          const typeMap = {
            broadcast:    { priority_level: 'urgent',  type: 'broadcast'    },
            protocol:     { priority_level: 'high',    type: 'protocol'     },
            announcement: { priority_level: 'normal',  type: 'announcement' },
            kudos:        { priority_level: 'low',     type: 'kudos'        },
          }
          const cfg = typeMap[broadcastForm.type] || typeMap.announcement
          const endDate = new Date(Date.now() + broadcastForm.expiryHours * 3600000)
          await API.createAnnouncement({
            title:            broadcastForm.text.slice(0, 100),
            content:          broadcastForm.text,
            priority_level:   cfg.priority_level,
            type:             cfg.type,
            target_audience:  'all_staff',
            publish_start_date: new Date().toISOString().slice(0,10),
            publish_end_date:   endDate.toISOString().slice(0,10),
          })
          broadcastForm.show = false
          showToast('Posted', `${broadcastTypeConfig[broadcastForm.type]?.label || 'Message'} sent to department`, 'success')
          await loadAnnouncements()
        } catch(e) { showToast('Error', e.message || 'Failed to post', 'error') }
        finally { if (saving) saving.value = false }
      }

      const dismissBroadcast = async (announcement) => {
        // Mark as read locally; optionally call API to record seen
        const idx = announcements.value.findIndex(a => a.id === announcement.id)
        if (idx !== -1) announcements.value[idx] = { ...announcements.value[idx], _dismissed: true }
      }
      const communicationsModal = reactive({
        show: false, activeTab: 'announcement', mode: 'add',
        form: { id: null, title: '', content: '', priority: 'normal', target_audience: 'all_staff', target_department_id: '', updateType: 'daily', dailySummary: '', highlight1: '', highlight2: '', alerts: { erBusy: false, icuFull: false, wardFull: false, staffShortage: false }, metricName: '', metricValue: '', metricTrend: 'stable', metricChange: '', metricNote: '', alertLevel: 'low', alertMessage: '', affectedAreas: { er: false, icu: false, ward: false, surgery: false } }
      })

      const filteredAnnouncements = computed(() => {
        let f = announcements.value
        if (communicationsFilters.search) { const q = communicationsFilters.search.toLowerCase(); f = f.filter(a => a.title?.toLowerCase().includes(q) || a.content?.toLowerCase().includes(q)) }
        if (communicationsFilters.priority) f = f.filter(a => a.priority_level === communicationsFilters.priority)
        if (communicationsFilters.audience) f = f.filter(a => a.target_audience === communicationsFilters.audience)
        return f.slice(0, 20)
      })

      const recentAnnouncements = computed(() => filteredAnnouncements.value)
      const unreadAnnouncements = computed(() => announcements.value.filter(a => !a.read).length)

      const loadAnnouncements = async () => {
        try { announcements.value = await API.getAnnouncements() }
        catch { showToast('Error', 'Failed to load announcements', 'error') }
      }

      const showCommunicationsModal = () => {
        communicationsModal.mode = 'add'
        communicationsModal.show = true; communicationsModal.activeTab = 'announcement'
        Object.assign(communicationsModal.form, { id: null, title: '', content: '', priority: 'normal', target_audience: 'all_staff', updateType: 'daily', dailySummary: '', highlight1: '', highlight2: '', alerts: { erBusy: false, icuFull: false, wardFull: false, staffShortage: false }, metricName: '', metricValue: '', metricTrend: 'stable', metricChange: '', metricNote: '', alertLevel: 'low', alertMessage: '', affectedAreas: { er: false, icu: false, ward: false, surgery: false } })
      }

      const editAnnouncement = (ann) => {
        communicationsModal.mode = 'edit'
        communicationsModal.activeTab = 'announcement'
        Object.assign(communicationsModal.form, { id: ann.id, title: ann.title || '', content: ann.content || '', priority: ann.priority_level || 'normal', target_audience: ann.target_audience || 'all_staff' })
        communicationsModal.show = true
      }

      const announcementReadModal = reactive({ show: false, announcement: null })
      const viewAnnouncement = (a) => { announcementReadModal.announcement = a; announcementReadModal.show = true }

      const saveCommunication = async (saving, saveClinicalStatus) => {
        // Validate before setting loading — better UX
        if (communicationsModal.activeTab === 'announcement') {
          const f = communicationsModal.form
          if (!f.title?.trim()) { showToast('Validation Error', 'Title is required', 'error'); return }
          if (!f.content?.trim()) { showToast('Validation Error', 'Content is required', 'error'); return }
        }
        saving.value = true
        try {
          if (communicationsModal.activeTab === 'announcement') {
            const f = communicationsModal.form
            const payload = { title: f.title, content: f.content, priority_level: f.priority, target_audience: f.target_audience || 'all_staff', type: 'announcement' }
            if (communicationsModal.mode === 'edit' && f.id) {
              const result = await API.updateAnnouncement(f.id, payload)
              const idx = announcements.value.findIndex(a => a.id === f.id)
              if (idx !== -1) announcements.value[idx] = result
              showToast('Success', 'Announcement updated', 'success')
            } else {
              announcements.value.unshift(await API.createAnnouncement(payload))
              showToast('Success', 'Announcement posted', 'success')
            }
          } else { await saveClinicalStatus() }
          communicationsModal.show = false
        } catch (e) { showToast('Error', e?.message || 'An unexpected error occurred', 'error') }
        finally { saving.value = false }
      }

      const deleteAnnouncement = (ann) => showConfirmation({
        title: 'Delete Announcement', message: `Delete "${ann.title}"?`,
        icon: 'fa-trash', confirmButtonText: 'Delete', confirmButtonClass: 'btn-danger',
        onConfirm: async () => {
          try {
            await API.deleteAnnouncement(ann.id)
            announcements.value = announcements.value.filter(a => a.id !== ann.id)
            showToast('Success', 'Announcement deleted', 'success')
          } catch (e) {
            showToast('Error', e?.message || 'Failed to delete announcement', 'error')
          }
        }
      })

      return { announcements, communicationsFilters, communicationsModal, announcementReadModal, filteredAnnouncements, recentAnnouncements, unreadAnnouncements, loadAnnouncements, loadOpsMetrics, opsMetrics, opsLoading, briefingForm, getMetric, metricVal, metricSub, metricVal2, saveDailyBriefing, updateMetricInline, broadcastForm, feedFilter, livebroadcasts, feedItems, commsPulse, broadcastTypeConfig, getAnnouncementType, openBroadcastForm, submitBroadcast, dismissBroadcast, showCommunicationsModal, editAnnouncement, viewAnnouncement, saveCommunication, deleteAnnouncement }
    }

    // ============ 6.10 useLiveStatus ============
    function useLiveStatus({ showToast, showConfirmation, medicalStaff, currentUser }) {
      const clinicalStatus = ref(null)
      const clinicalStatusHistory = ref([])
      const isLoadingStatus = ref(false)
      const newStatusText = ref('')
      const selectedAuthorId = ref('')
      const expiryHours = ref(8)
      const activeMedicalStaff = ref([])
      const liveStatsEditMode = ref(false)
      const quickStatus = ref('')

      const recentStatuses = computed(() => clinicalStatusHistory.value)
      const isStatusExpired = (exp) => { if (!exp) return true; try { return new Date() > new Date(exp) } catch { return true } }
      const getStatusBadgeClass = (status) => (!status || isStatusExpired(status.expires_at)) ? 'badge-warning' : 'badge-success'

      const calculateTimeRemaining = (expiryTime) => {
        if (!expiryTime) return 'N/A'
        try {
          const diff = new Date(expiryTime) - new Date()
          if (diff <= 0) return 'Expired'
          const h = Math.floor(diff / 3600000); const m = Math.floor((diff % 3600000) / 60000)
          return h > 0 ? `${h}h ${m}m` : `${m}m`
        } catch { return 'N/A' }
      }

      const getStatusLocation = (status) => {
        if (!status?.status_text) return 'Pulmonology Department'
        if (status.location) return status.location
        const t = status.status_text.toLowerCase()
        if (t.includes('icu') || t.includes('intensive care')) return 'Respiratory ICU'
        if (t.includes('sleep') || t.includes('cpap')) return 'Sleep Medicine Lab'
        if (t.includes('bronchoscopy') || t.includes('pft')) return 'Pulmonary Procedure Unit'
        if (t.includes('ventilator')) return 'Respiratory Therapy Unit'
        if (t.includes('er') || t.includes('emergency')) return 'Emergency Department'
        if (t.includes('ward') || t.includes('floor')) return 'General Ward'
        return 'Pulmonology Department'
      }

      const formattedExpiry = computed(() => {
        if (!clinicalStatus.value?.expires_at) return ''
        const diff = Math.ceil((new Date(clinicalStatus.value.expires_at) - new Date()) / 3600000)
        if (diff <= 1) return 'Expires soon'
        if (diff <= 4) return `Expires in ${diff}h`
        return `Expires ${Utils.formatTime(clinicalStatus.value.expires_at)}`
      })

      const loadClinicalStatus = async () => {
        isLoadingStatus.value = true
        try { const r = await API.getClinicalStatus(); clinicalStatus.value = r?.success ? r.data : null }
        catch (e) { clinicalStatus.value = null; console.error('[neumDesk] loadClinicalStatus failed:', e) }
        finally { isLoadingStatus.value = false }
      }

      const loadClinicalStatusHistory = async () => {
        try {
          const history = await API.getClinicalStatusHistory(20)
          const cid = clinicalStatus.value?.id; const now = new Date()
          clinicalStatusHistory.value = history.filter(s => s.id !== cid && (!s.expires_at || now < new Date(s.expires_at))).slice(0, 5)
        } catch { clinicalStatusHistory.value = [] }
      }

      const loadActiveMedicalStaff = async () => {
        try {
          const data = await API.getMedicalStaff()
          activeMedicalStaff.value = data.filter(s => s.employment_status === 'active')
          if (currentUser.value) {
            const found = currentUser.value?.email ? activeMedicalStaff.value.find(s => s.professional_email === currentUser.value.email) : null
            if (found) selectedAuthorId.value = found.id
          }
        } catch { activeMedicalStaff.value = [] }
      }

      const saveClinicalStatus = async () => {
        if (!newStatusText.value.trim() || !selectedAuthorId.value) { showToast('Error', 'Please fill all required fields', 'error'); return }
        isLoadingStatus.value = true
        try {
          const response = await API.createClinicalStatus({ status_text: newStatusText.value.trim(), author_id: selectedAuthorId.value, expires_in_hours: expiryHours.value })
          if (response?.success && response.data) {
            if (clinicalStatus.value) clinicalStatusHistory.value.unshift(clinicalStatus.value)
            clinicalStatus.value = response.data; newStatusText.value = ''; selectedAuthorId.value = ''; liveStatsEditMode.value = false
            await loadClinicalStatusHistory(); showToast('Success', 'Live status updated for all staff', 'success')
          } else { throw new Error(response?.error || 'Failed to save status') }
        } catch (e) { showToast('Error', e.message || 'Could not update status', 'error') }
        finally { isLoadingStatus.value = false }
      }

      const deleteClinicalStatus = () => {
        if (!clinicalStatus.value) return
        showConfirmation({ title: 'Clear Live Status', message: 'Clear the current live status?', icon: 'fa-trash', confirmButtonText: 'Clear', confirmButtonClass: 'btn-danger', onConfirm: async () => { await API.deleteClinicalStatus(clinicalStatus.value.id); clinicalStatus.value = null; showToast('Success', 'Live status cleared', 'success') } })
      }

      const refreshStatus = () => { loadClinicalStatus(); showToast('Refreshed', 'Live status updated', 'info') }
      const showCreateStatusModal = () => { liveStatsEditMode.value = true; newStatusText.value = ''; selectedAuthorId.value = ''; expiryHours.value = 8 }
      const setQuickStatus = (status) => { quickStatus.value = status }

      return { clinicalStatus, clinicalStatusHistory, isLoadingStatus, newStatusText, selectedAuthorId, expiryHours, activeMedicalStaff, liveStatsEditMode, quickStatus, recentStatuses, isStatusExpired, getStatusBadgeClass, calculateTimeRemaining, getStatusLocation, formattedExpiry, loadClinicalStatus, loadClinicalStatusHistory, loadActiveMedicalStaff, saveClinicalStatus, deleteClinicalStatus, refreshStatus, showCreateStatusModal, setQuickStatus }
    }

    // ============ 6.11 useResearch ============
    function useResearch({ showToast, showConfirmation, paginate, totalPages, resetPage, applySort, clearAll, medicalStaff, loadAnalyticsSummary, loadResearchLinesPerformance, loadPartnerCollaborations }) {
      const researchLines         = ref([])
      const clinicalTrials        = ref([])
      const innovationProjects    = ref([])
      const researchLineFilters = reactive({ search: '', active: '' })
      const debouncedResearchSearch = ref('')
      watch(() => researchLineFilters.search, Utils.debounce(v => { debouncedResearchSearch.value = v }, 250))
      const trialFilters = reactive({ line: '', phase: '', status: '', search: '' })
      const projectFilters = reactive({ research_line_id: '', category: '', stage: '', funding_status: '', search: '' })

      // ── Page navigation (overview → line → study/project) ─────
      const researchHubPage   = ref('overview')  // 'overview' | 'line' | 'study' | 'project'
      const selectedLine      = ref(null)
      const selectedStudy     = ref(null)
      const selectedProject   = ref(null)

      const openLine    = (line)    => { selectedLine.value = line;    selectedStudy.value = null; selectedProject.value = null; researchHubPage.value = 'line'    }
      const openStudy   = (study)   => { selectedStudy.value = study;   researchHubPage.value = 'study'   }
      const openProject = (project) => { selectedProject.value = project; researchHubPage.value = 'project' }
      const goToOverview= ()        => { researchHubPage.value = 'overview' }
      const goToLine    = ()        => { researchHubPage.value = 'line'; selectedStudy.value = null; selectedProject.value = null }

      const researchLineModal = reactive({ show: false, mode: 'add', form: { line_number: null, name: '', description: '', capabilities: 'Alcance y capacidades', sort_order: 0, active: true } })

      const clinicalTrialModal = reactive({ show: false, mode: 'add', form: {
        protocol_id: '', title: '', research_line_id: '',
        phase: 'Phase III', status: 'Reclutando',
        description: '', inclusion_criteria: '', exclusion_criteria: '',
        principal_investigator_id: '', co_investigators: [], sub_investigators: [],
        contact_email: '', featured_in_website: true, display_order: 0,
        start_date: '', end_date: '', estimated_end_date: '', actual_end_date: '',
        sponsor_name: '', sponsor_type: '', study_type: 'Observational',
        enrollment_target: null, actual_enrollment: null, funding_amount: null,
        tags: [], milestones: [],
        additional_line_ids: [],
        // New schema fields
        protocol_finalized: false, ethics_status: null,
        funding_status: 'not_applicable', target_diseases: [],
        scope_type: 'specific', scope_note: '',
        is_multicentre: false, participating_centres: null,
        population_type: 'adult',
        // Team fields
        data_manager_id: '',
        team_roles: {},        // { staffId: 'Co-PI', staffId2: 'Research Nurse' }
        external_team: [],     // [{ name, institution, role, email }]
        _diseaseInput: '',
        _extMemberDraft: { name: '', institution: '', role: '', email: '' },
      }})

      const trialDetailModal = reactive({ show: false, trial: null, study: null })

      const innovationProjectModal = reactive({ show: false, mode: 'add', form: {
        title: '', category: 'Dispositivo', current_stage: 'development',
        description: '', clinical_rationale: '', research_line_id: '',
        lead_investigator_id: '', co_investigators: [],
        partner_needs: [], partner_found: false, partner_name: '',
        funding_status: 'not_applicable', funding_source: '',
        budget: null, trl_level: null, ip_status: '',
        keywords: [], keywordsInput: '', tags: [], milestones: [],
        additional_line_ids: [],
        featured_in_website: true, display_order: 0,
        start_date: '', estimated_end_date: '',
        scope_finalized: false, target_diseases: [],
        scope_type: 'specific', scope_note: '',
        regulatory_pathway: 'none', population_type: 'adult',
        team_roles: {}, external_team: [],
        // New fields
        project_nature: 'clinical_innovation',  // 'clinical_study' | 'clinical_innovation' | 'hybrid'
        project_url:    '',   // Primary URL (GitHub or deployed app)
        repo_url:       '',   // GitHub repository
        demo_url:       '',   // Live demo / deployed domain
        is_featured:    false,
        _diseaseInput: '',
        _extMemberDraft: { name: '', institution: '', role: '', email: '' },
      }})

      const assignCoordinatorModal = reactive({ show: false, lineId: null, lineName: '', selectedCoordinatorId: '' })

      const getResearchLineName = (id) => { if (!id) return 'Not assigned'; const l = researchLines.value.find(l => l.id === id); return l ? (l.research_line_name || l.name) : 'Unknown' }
      const getClinicianResearchLines = (id) => { if (!id || !researchLines.value.length) return []; return researchLines.value.filter(l => l.coordinator_id === id).map(l => ({ line_number: l.line_number, name: l.research_line_name || l.name, role: 'Coordinador/a', id: l.id })) }

      const filteredResearchLines = computed(() => {
        let f = researchLines.value
        if (debouncedResearchSearch.value) {
          const q = debouncedResearchSearch.value.toLowerCase()
          f = f.filter(l =>
            (l.research_line_name || l.name)?.toLowerCase().includes(q) ||
            l.description?.toLowerCase().includes(q) ||
            l.capabilities?.toLowerCase().includes(q) ||
            (Array.isArray(l.keywords) && l.keywords.some(k => k.toLowerCase().includes(q)))
          )
        }
        if (researchLineFilters.active !== '') { const active = researchLineFilters.active === 'true'; f = f.filter(l => l.active === active) }
        return applySort(f, 'research_lines')
      })

      // ── Research helpers: normalize mixed ES/EN statuses + recruitment health ──
      const trialStatusKey = (t) => {
        const s = String(t?.status || t?.recruitment_status || '').toLowerCase()
        if (/(reclut|recruit)/.test(s)) return 'recruiting'
        if (/(activ|ongoing|in progress)/.test(s)) return 'active'
        if (/(prepar|setup|pending)/.test(s)) return 'prep'
        if (/(complet|finaliz|closed|done)/.test(s)) return 'done'
        return 'other'
      }
      const TRIAL_STATUS_LABEL = { recruiting: 'Recruiting', active: 'Active', prep: 'In preparation', done: 'Completed', other: 'Other' }
      const countTrialsByStatus = (key) => clinicalTrials.value.filter(t => trialStatusKey(t) === key).length

      // Recruitment health: where a trial stands vs its target, and whether it's behind pace
      const trialEnrollment = (t) => {
        const target = Number(t?.enrollment_target) || 0
        const actual = Number(t?.actual_enrollment) || 0
        if (!target) return null
        const pct = Math.min(100, Math.round((actual / target) * 100))
        let health = 'ontrack', label = 'On track'
        if (pct >= 100) { health = 'complete'; label = 'Target met' }
        else if (pct < 25 && trialStatusKey(t) === 'recruiting') { health = 'behind'; label = 'Slow start' }
        else if (pct < 50 && trialStatusKey(t) === 'recruiting') { health = 'watch'; label = 'Building' }
        return { target, actual, pct, health, label, remaining: Math.max(0, target - actual) }
      }

      const filteredTrialsAll = computed(() => {
        let f = clinicalTrials.value
        if (trialFilters.line) f = f.filter(t => t.research_line_id === trialFilters.line)
        if (trialFilters.phase) f = f.filter(t => t.phase === trialFilters.phase)
        if (trialFilters.status) f = f.filter(t => trialStatusKey(t) === trialFilters.status)
        if (trialFilters.search) { const q = trialFilters.search.toLowerCase(); f = f.filter(t => t.protocol_id?.toLowerCase().includes(q) || t.title?.toLowerCase().includes(q)) }
        return applySort(f, 'trials')
      })
      const filteredTrials = computed(() => paginate(filteredTrialsAll.value, 'trials'))
      const trialTotalPages = computed(() => totalPages(filteredTrialsAll.value, 'trials'))

      const filteredProjectsAll = computed(() => {
        let f = innovationProjects.value
        if (projectFilters.research_line_id) f = f.filter(p => p.research_line_id === projectFilters.research_line_id)
        if (projectFilters.category) f = f.filter(p => p.category === projectFilters.category)
        if (projectFilters.stage) f = f.filter(p => (p.current_stage || p.development_stage) === projectFilters.stage)
        if (projectFilters.funding_status) f = f.filter(p => (p.funding_status || 'not_applicable') === projectFilters.funding_status)
        if (projectFilters.search) { const q = projectFilters.search.toLowerCase(); f = f.filter(p => p.title?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q) || (Array.isArray(p.keywords) && p.keywords.some(k => k.toLowerCase().includes(q)))) }
        return applySort(f, 'projects')
      })
      const filteredProjects = computed(() => paginate(filteredProjectsAll.value, 'projects'))
      const projectTotalPages = computed(() => totalPages(filteredProjectsAll.value, 'projects'))

      // ── Keyword chip helpers ──────────────────────────────────────────────
      const addKeyword = (form) => {
        if (!form.keywordsInput?.trim()) return
        const incoming = form.keywordsInput.split(',').map(k => k.trim()).filter(Boolean)
        incoming.forEach(kw => { if (kw && !form.keywords.includes(kw)) form.keywords.push(kw) })
        form.keywordsInput = ''
      }
      const removeKeyword = (form, idx) => { form.keywords.splice(idx, 1) }
      const handleKeywordKey = (e, form) => {
        if (e.key === 'Enter' || e.key === ',' || e.key === 'Tab') {
          e.preventDefault(); addKeyword(form)
        }
      }

      // ── Disease tag helpers ────────────────────────────────────
      const addDisease = (form, disease) => {
        if (!disease?.trim()) return
        if (!Array.isArray(form.target_diseases)) form.target_diseases = []
        if (!form.target_diseases.includes(disease.trim())) form.target_diseases.push(disease.trim())
        form._diseaseInput = ''
      }
      const removeDisease = (form, idx) => { form.target_diseases.splice(idx, 1) }
      const handleDiseaseKey = (e, form) => {
        if (e.key === 'Enter' || e.key === ',' || e.key === 'Tab') {
          e.preventDefault(); addDisease(form, form._diseaseInput)
        }
      }

      // ── External team helpers ──────────────────────────────────
      const addExternalMember = (form) => {
        const d = form._extMemberDraft
        if (!d.name?.trim() && !d.institution?.trim()) return
        if (!Array.isArray(form.external_team)) form.external_team = []
        form.external_team.push({
          name:        d.name?.trim()        || null,
          institution: d.institution?.trim() || null,
          role:        d.role?.trim()        || null,
          email:       d.email?.trim()       || null,
        })
        form._extMemberDraft = { name: '', institution: '', role: '', email: '' }
      }
      const removeExternalMember = (form, idx) => { form.external_team.splice(idx, 1) }

      // ── Internal team role helpers ─────────────────────────────
      // team_roles: { staffId: 'Co-PI', staffId2: 'Research Nurse' }
      const setTeamRole = (form, staffId, role) => {
        if (!form.team_roles) form.team_roles = {}
        if (role) form.team_roles[staffId] = role
        else delete form.team_roles[staffId]
      }
      const getTeamRole = (form, staffId) => form.team_roles?.[staffId] || ''

      // When an internal member is added to co_investigators, auto-assign default role
      const addCoInvestigator = (form, staffId) => {
        if (!staffId || form.co_investigators.includes(staffId)) return
        form.co_investigators.push(staffId)
        if (!form.team_roles[staffId]) form.team_roles[staffId] = 'Co-investigator'
      }
      const removeCoInvestigator = (form, staffId) => {
        form.co_investigators = form.co_investigators.filter(id => id !== staffId)
        delete form.team_roles[staffId]
      }

      // ── Milestone helpers ──────────────────────────────────────
      const addMilestone = (form, label, date) => {
        if (!label?.trim()) return
        if (!Array.isArray(form.milestones)) form.milestones = []
        form.milestones.push({ id: Date.now(), label: label.trim(), date: date || null, done: false })
      }
      const toggleMilestone = (form, idx) => {
        if (form.milestones[idx]) form.milestones[idx].done = !form.milestones[idx].done
      }
      const removeMilestone = (form, idx) => { form.milestones.splice(idx, 1) }

      // ── Study/Project completeness score ──────────────────────
      const getStudyCompleteness = (s) => {
        const checks = [
          !!s.principal_investigator_id,
          !!s.start_date,
          !!(s.end_date || s.estimated_end_date),
          !!(s.enrollment_target),
          !!(s.sponsor_name || s.sponsor_type),
          !!s.ethics_status,
          !!s.study_type,
          !!(s.target_diseases?.length),
          !!s.protocol_finalized,
        ]
        return {
          score: checks.filter(Boolean).length, total: checks.length,
          missing: ['PI','Fecha inicio','Fecha fin','Enrolamiento objetivo','Sponsor','Aprobación ética','Tipo de estudio','Enfermedades diana','Protocolo finalizado'].filter((_, i) => !checks[i])
        }
      }
      const getProjectCompleteness = (p) => {
        const checks = [
          !!p.lead_investigator_id,
          !!p.start_date,
          !!(p.budget || p.funding_source || p.funding_status !== 'not_applicable'),
          !!(p.target_diseases?.length),
          !!(p.trl_level),
          !!(p.regulatory_pathway && p.regulatory_pathway !== 'none'),
        ]
        return { score: checks.filter(Boolean).length, total: checks.length,
          missing: ['Investigador principal','Fecha inicio','Financiación','Enfermedades','Nivel TRL','Vía regulatoria'].filter((_, i) => !checks[i]) }
      }

      const researchLoading = ref(false)

      const loadResearchLines = async () => { try { researchLines.value = await API.getResearchLines() } catch (e) { console.error('[neumDesk] loadResearchLines failed:', e) } }
      const loadClinicalTrials = async () => { try { clinicalTrials.value = await API.getAllClinicalTrials() } catch (e) { console.error('[neumDesk] loadClinicalTrials failed:', e) } }
      const loadInnovationProjects = async () => { try { innovationProjects.value = await API.getAllInnovationProjects() } catch (e) { console.error('[neumDesk] loadInnovationProjects failed:', e) } }

      // Load all three research datasets together — used by on-demand navigation
      const loadAllResearch = async () => {
        if (researchLoading.value) return  // already in flight
        researchLoading.value = true
        try {
          await Promise.all([
            loadResearchLines(),
            loadClinicalTrials(),
            loadInnovationProjects()
          ])
        } finally {
          researchLoading.value = false
        }
      }

      const showAddResearchLineModal = () => { clearAll('research'); researchLineModal.mode = 'add'; Object.assign(researchLineModal.form, { line_number: researchLines.value.length + 1, name: '', description: '', capabilities: '', sort_order: researchLines.value.length + 1, active: true, keywords: [], keywordsInput: '' }); researchLineModal.show = true }
      const showAddTrialModal = (line = null) => { clinicalTrialModal.mode = 'add'; Object.assign(clinicalTrialModal.form, { protocol_id: `HUAC-${Date.now().toString().slice(-6)}`, title: '', research_line_id: line?.id || '', phase: 'Phase III', status: 'Reclutando', description: '', inclusion_criteria: '', exclusion_criteria: '', principal_investigator_id: '', co_investigators: [], sub_investigators: [], contact_email: '', featured_in_website: true, display_order: clinicalTrials.value.length + 1, start_date: '', end_date: '', additional_line_ids: [] }); clinicalTrialModal.show = true }
      const showAddProjectModal = (line = null) => { innovationProjectModal.mode = 'add'; Object.assign(innovationProjectModal.form, { title: '', category: 'Dispositivo', current_stage: 'Idea', description: '', clinical_rationale: '', research_line_id: line?.id || '', lead_investigator_id: '', co_investigators: [], partner_needs: [], partner_found: false, partner_name: '', funding_status: 'not_applicable', keywords: [], keywordsInput: '', featured_in_website: true, is_featured: false, display_order: innovationProjects.value.length + 1, additional_line_ids: [] }); innovationProjectModal.show = true }

      const openAssignCoordinatorModal = (line) => { assignCoordinatorModal.lineId = line.id; assignCoordinatorModal.lineName = line.research_line_name || line.name; assignCoordinatorModal.selectedCoordinatorId = line.coordinator_id || ''; assignCoordinatorModal.show = true }
      const editResearchLine = (l) => { researchLineModal.mode = 'edit'; researchLineModal.form = { ...l, research_line_name: l.research_line_name || l.name || '', keywordsInput: Array.isArray(l.keywords) ? l.keywords.join(', ') : (l.keywordsInput || '') }; researchLineModal.show = true }
      const editTrial = (t) => {
        clinicalTrialModal.mode = 'edit'
        // C3 FIX: preserve display_order from the stored record, not reset to list length
        clinicalTrialModal.form = {
          ...t,
          end_date:          t.end_date || t.estimated_end_date || '',
          start_date:        t.start_date || '',
          co_investigators:  Array.isArray(t.co_investigators)  ? [...t.co_investigators]  : (t.co_investigator_id  ? [t.co_investigator_id]  : []),
          sub_investigators: Array.isArray(t.sub_investigators) ? [...t.sub_investigators] : (t.sub_investigator_id ? [t.sub_investigator_id] : []),
          additional_line_ids: Array.isArray(t.additional_lines) ? t.additional_lines.map(l => l.id) : [],
          // Render-crash fix: the edit modal's v-model reads form._extMemberDraft.name etc.
          // The spread above does not carry these UI-only scratch fields, so without
          // re-initialising them the template dereferences undefined and the whole modal
          // throws on every render. Always provide them in edit mode too.
          _extMemberDraft: { name: '', institution: '', role: '', email: '' },
          _diseaseInput: t._diseaseInput || ''
        }
        clinicalTrialModal.show = true
      }
      const editProject = (p) => { innovationProjectModal.mode = 'edit'; const coI = Array.isArray(p.co_investigators) && p.co_investigators.length ? p.co_investigators : (Array.isArray(p.co_leads) ? p.co_leads : []); const kws = Array.isArray(p.keywords) && p.keywords.length ? p.keywords : (Array.isArray(p.tags) ? p.tags : []); innovationProjectModal.form = { ...p, current_stage: p.current_stage || p.development_stage || 'Idea', partner_needs: Array.isArray(p.partner_needs) ? [...p.partner_needs] : [], co_investigators: [...coI], keywords: [...kws], keywordsInput: kws.length ? kws.join(', ') : '', partner_found: p.partner_found || false, partner_name: p.partner_name || '', funding_status: p.funding_status || 'not_applicable', clinical_rationale: p.clinical_rationale || '', additional_line_ids: Array.isArray(p.additional_lines) ? p.additional_lines.map(l => l.id) : [], _extMemberDraft: { name: '', institution: '', role: '', email: '' } }; innovationProjectModal.show = true }
      const viewTrial = (t) => { trialDetailModal.trial = t; trialDetailModal.study = t; trialDetailModal.show = true }

      const saveResearchLine = async (saving) => {
        // Normalise: HTML form uses research_line_name, JS defaults use name — backend DB stores 'name'
        const f = researchLineModal.form
        const lineName = (f.research_line_name || f.name || '').trim()
        if (!lineName) { showToast('Validation Error', 'Research line name is required', 'error'); return }
        saving.value = true
        try {
          // FIX 14: Parse keywords from comma-separated string into array
          const keywords = f.keywordsInput ? f.keywordsInput.split(',').map(k => k.trim()).filter(Boolean) : (Array.isArray(f.keywords) ? f.keywords : [])
          // FIX 15: Never send the placeholder text as capabilities
          const capabilities = (f.capabilities && f.capabilities !== 'Alcance y capacidades') ? f.capabilities : ''
          const payload = { ...f, name: lineName, keywords, capabilities }
          delete payload.research_line_name // backend only knows 'name'
          delete payload.keywordsInput
          // These come from the view join — not writable columns on research_lines table
          delete payload.coordinator_name
          delete payload.coordinator_email
          delete payload.coordinator_type
          delete payload.full_name
          delete payload.professional_email
          if (researchLineModal.mode === 'add') { researchLines.value.unshift(await API.createResearchLine(payload)); showToast('Success', 'Research line created', 'success') }
          else { const result = await API.updateResearchLine(f.id, payload); const idx = researchLines.value.findIndex(l => l.id === result.id); if (idx !== -1) researchLines.value[idx] = result; showToast('Success', 'Research line updated', 'success') }
          researchLineModal.show = false; await loadResearchLines(); loadAnalyticsSummary()
        } catch (e) { showToast('Error', e?.message || 'An unexpected error occurred', 'error') }
        finally { saving.value = false }
      }

      const saveClinicalTrial = async (saving) => {
        const f = clinicalTrialModal.form
        if (!f.title?.trim()) { showToast('Validation Error', 'Trial title is required', 'error'); return }
        if (!f.principal_investigator_id) { showToast('Validation Error', 'Principal investigator is required', 'error'); return }
        // FIX 8: date relationship validation
        if (f.start_date && f.end_date && f.end_date < f.start_date) { showToast('Validation Error', 'End date cannot be before start date', 'error'); return }
        saving.value = true
        try {
          const payload = { ...f }
          // Mirror end_date → estimated_end_date so both DB columns stay in sync
          if (payload.end_date) payload.estimated_end_date = payload.end_date
          delete payload.co_investigator_id // legacy field
          delete payload.sub_investigator_id // legacy field
          if (clinicalTrialModal.mode === 'add') { clinicalTrials.value.unshift(await API.createClinicalTrial(payload)); showToast('Success', 'Clinical study created', 'success') }
          else { const result = await API.updateClinicalTrial(payload.id, payload); const idx = clinicalTrials.value.findIndex(t => t.id === result.id); if (idx !== -1) clinicalTrials.value[idx] = result; showToast('Success', 'Clinical study updated', 'success') }
          clinicalTrialModal.show = false; await loadClinicalTrials(); loadAnalyticsSummary()
        } catch (e) { showToast('Error', e?.message || 'Failed to save study', 'error') }
        finally { saving.value = false }
      }

      const saveInnovationProject = async (saving) => {
        const f = innovationProjectModal.form
        if (!f.title?.trim()) { showToast('Validation Error', 'Project title is required', 'error'); return }
        saving.value = true
        try {
          const payload = { ...f }
          // Parse keywords from comma-separated string into array
          payload.keywords = f.keywordsInput ? f.keywordsInput.split(',').map(k => k.trim()).filter(Boolean) : (Array.isArray(f.keywords) ? f.keywords : [])
          delete payload.keywordsInput
          // m3 FIX: removed legacy co_leads/tags mirroring — backend B6 whitelist
          // no longer passes these through to Supabase, so mirroring was silently dropped anyway.
          // co_investigators and keywords are sent directly under their correct column names.
          // Stage normalisation
          if (!payload.current_stage && payload.development_stage) payload.current_stage = payload.development_stage
          delete payload.development_stage
          // Partner logic: if partner found, no longer need partner_needs list
          if (payload.partner_found) payload.partner_needs = []
          else payload.partner_name = ''
          if (innovationProjectModal.mode === 'add') { innovationProjects.value.unshift(await API.createInnovationProject(payload)); showToast('Success', 'Innovation project created', 'success') }
          else { const result = await API.updateInnovationProject(payload.id, payload); const idx = innovationProjects.value.findIndex(p => p.id === result.id); if (idx !== -1) innovationProjects.value[idx] = result; showToast('Success', 'Innovation project updated', 'success') }
          innovationProjectModal.show = false; await loadInnovationProjects(); loadAnalyticsSummary(); loadPartnerCollaborations()
        } catch (e) { showToast('Error', e?.message || 'Failed to save project', 'error') }
        finally { saving.value = false }
      }

      const saveCoordinatorAssignment = async () => {
        try { await API.assignCoordinator(assignCoordinatorModal.lineId, assignCoordinatorModal.selectedCoordinatorId || null); await loadResearchLines(); assignCoordinatorModal.show = false; showToast('Success', 'Coordinator assigned', 'success'); loadResearchLinesPerformance() }
        catch (e) { showToast('Error', e.message || 'Failed to assign coordinator', 'error') }
      }

      const deleteResearchLine = (line) => {
        const activeTrials = clinicalTrials.value.filter(t => t.research_line_id === line.id && !['Completado','Suspendido','Cancelado'].includes(t.status))
        const activeProjects = innovationProjects.value.filter(p => p.research_line_id === line.id)
        if (activeTrials.length || activeProjects.length) {
          showConfirmation({
            title: 'Cannot Delete Research Line',
            message: `"${line.research_line_name || line.name}" has ${activeTrials.length} active trial(s) and ${activeProjects.length} project(s) linked to it.`,
            icon: 'fa-exclamation-triangle',
            confirmButtonText: 'OK', confirmButtonClass: 'btn-secondary',
            details: 'Reassign or remove all associated trials and projects before deleting this research line.',
            onConfirm: () => {}
          })
          return
        }
        showConfirmation({
          title: 'Delete Research Line', message: `Delete "${line.research_line_name || line.name}"?`,
          icon: 'fa-trash', confirmButtonText: 'Delete', confirmButtonClass: 'btn-danger',
          details: 'No active trials or projects are linked to this line.',
          onConfirm: async () => { await API.deleteResearchLine(line.id); await loadResearchLines(); showToast('Success', 'Research line deleted', 'success'); loadAnalyticsSummary() }
        })
      }
      const deleteClinicalTrial = (trial) => showConfirmation({ title: 'Delete Study', message: `Delete "${trial.title}"?`, icon: 'fa-trash', confirmButtonText: 'Delete', confirmButtonClass: 'btn-danger', details: `Protocol: ${trial.protocol_id}`, onConfirm: async () => { await API.deleteClinicalTrial(trial.id); await loadClinicalTrials(); showToast('Success', 'Study deleted', 'success'); loadAnalyticsSummary() } })
      const deleteInnovationProject = (project) => showConfirmation({ title: 'Delete Project', message: `Delete "${project.title}"?`, icon: 'fa-trash', confirmButtonText: 'Delete', confirmButtonClass: 'btn-danger', onConfirm: async () => { await API.deleteInnovationProject(project.id); await loadInnovationProjects(); showToast('Success', 'Project deleted', 'success'); loadAnalyticsSummary(); loadPartnerCollaborations() } })

      // ── Quick research profile built entirely from local refs (no API call) ──
      const getStaffResearchQuick = (staffId) => {
        if (!staffId) return null
        const coordinatorLines = researchLines.value.filter(l => l.coordinator_id === staffId)
        const trialsAsPI  = clinicalTrials.value.filter(t => t.principal_investigator_id === staffId)
        const trialsAsCoI = clinicalTrials.value.filter(t => (t.co_investigators || []).includes(staffId))
        const trialsAsSub = clinicalTrials.value.filter(t => (t.sub_investigators || []).includes(staffId))
        const projectsAsLead = innovationProjects.value.filter(p => p.lead_investigator_id === staffId)
        const projectsAsCoI  = innovationProjects.value.filter(p => (p.co_investigators || []).includes(staffId))

        const allTrials = [...new Map([...trialsAsPI, ...trialsAsCoI, ...trialsAsSub].map(t => [t.id, t])).values()]
        const allProjects = [...new Map([...projectsAsLead, ...projectsAsCoI].map(p => [p.id, p])).values()]

        if (!coordinatorLines.length && !allTrials.length && !allProjects.length) return null

        return {
          isCoordinator: coordinatorLines.length > 0,
          coordinatorLines: coordinatorLines.map(l => ({ id: l.id, line_number: l.line_number, name: l.research_line_name || l.name })),
          trials: {
            asPI: trialsAsPI.length, asCoI: trialsAsCoI.length, asSubI: trialsAsSub.length,
            active: allTrials.filter(t => ['Activo','Reclutando'].includes(t.status)).length,
            list: allTrials.map(t => ({
              id: t.id, title: t.title, phase: t.phase, status: t.status,
              role: trialsAsPI.find(x => x.id === t.id) ? 'Principal Investigator'
                  : trialsAsCoI.find(x => x.id === t.id) ? 'Co-Investigator' : 'Sub-Investigator'
            }))
          },
          projects: {
            asLead: projectsAsLead.length,
            list: allProjects.map(p => ({
              id: p.id, title: p.title, current_stage: p.current_stage,
              role: projectsAsLead.find(x => x.id === p.id) ? 'Lead' : 'Co-Investigator'
            }))
          },
          allResearchLines: (() => {
            const lineMap = {}
            coordinatorLines.forEach(l => {
              if (!lineMap[l.id]) lineMap[l.id] = { id: l.id, line_number: l.line_number, name: l.research_line_name || l.name, roles: [], trialsCount: 0, projectsCount: 0 }
              lineMap[l.id].roles.push('Coordinator')
            })
            ;[...trialsAsPI, ...trialsAsCoI, ...trialsAsSub].forEach(t => {
              const lineId = t.research_line_id; if (!lineId) return
              const line = researchLines.value.find(l => l.id === lineId); if (!line) return
              if (!lineMap[lineId]) lineMap[lineId] = { id: lineId, line_number: line.line_number, name: line.research_line_name || line.name, roles: [], trialsCount: 0, projectsCount: 0 }
              const role = trialsAsPI.find(x => x.id === t.id) ? 'Principal Investigator' : trialsAsCoI.find(x => x.id === t.id) ? 'Co-Investigator' : 'Sub-Investigator'
              if (!lineMap[lineId].roles.includes(role)) lineMap[lineId].roles.push(role)
              lineMap[lineId].trialsCount++
            })
            ;[...projectsAsLead, ...projectsAsCoI].forEach(p => {
              const lineId = p.research_line_id; if (!lineId) return
              const line = researchLines.value.find(l => l.id === lineId); if (!line) return
              if (!lineMap[lineId]) lineMap[lineId] = { id: lineId, line_number: line.line_number, name: line.research_line_name || line.name, roles: [], trialsCount: 0, projectsCount: 0 }
              const role = projectsAsLead.find(x => x.id === p.id) ? 'Project Lead' : 'Co-Investigator'
              if (!lineMap[lineId].roles.includes(role)) lineMap[lineId].roles.push(role)
              lineMap[lineId].projectsCount++
            })
            return Object.values(lineMap).sort((a,b) => a.line_number - b.line_number)
          })()
        }
      }

      return { researchLines, clinicalTrials, innovationProjects, researchLoading, researchLineFilters, trialFilters, projectFilters, researchLineModal, clinicalTrialModal, innovationProjectModal, assignCoordinatorModal, trialDetailModal, filteredResearchLines, filteredTrials, filteredTrialsAll, filteredProjects, filteredProjectsAll, trialTotalPages, projectTotalPages, getResearchLineName, getClinicianResearchLines, trialStatusKey, TRIAL_STATUS_LABEL, countTrialsByStatus, trialEnrollment, loadResearchLines, loadClinicalTrials, loadInnovationProjects, loadAllResearch, showAddResearchLineModal, showAddTrialModal, showAddProjectModal, openAssignCoordinatorModal, editResearchLine, editTrial, editProject, viewTrial, saveResearchLine, saveClinicalTrial, saveInnovationProject, saveCoordinatorAssignment, deleteResearchLine, deleteClinicalTrial, deleteInnovationProject, addKeyword, removeKeyword, handleKeywordKey, getStaffResearchQuick,
        // Page navigation
        researchHubPage, selectedLine, selectedStudy, selectedProject,
        openLine, openStudy, openProject, goToOverview, goToLine,
        // Disease helpers
        addDisease, removeDisease, handleDiseaseKey,
        // External team helpers
        addExternalMember, removeExternalMember,
        setTeamRole, getTeamRole, addCoInvestigator, removeCoInvestigator,
        // Milestone helpers
        addMilestone, toggleMilestone, removeMilestone,
        // Completeness
        getStudyCompleteness, getProjectCompleteness,
      }
    }

    // ============ 6.12 useAnalytics ============
    function useAnalytics({ showToast, hasPermission }) {
      const researchDashboard = ref(null)
      const researchLinesPerformance = ref([])
      const partnerCollaborations = ref(null)
      const trialsTimeline = ref(null)
      const analyticsSummary = ref(null)
      const loadingAnalytics = ref(false)
      const exportModal = reactive({ show: false, type: 'clinical-trials', format: 'csv', loading: false })
      const analyticsActiveTab = ref('dashboard') // 'dashboard' | 'performance' | 'partners'

      // ── Research Hub unified state ────────────────────────────────────────
      const researchHubTab = ref('lines')
      const selectedResearchLine = ref(null)
      const researchDetailPanel = ref(false)
      // Mission Control: which line row is selected in the left panel
      const activeMissionLine = ref(null)

      const openLineDetail = (line) => {
        selectedResearchLine.value = line
        activeMissionLine.value = line
      }
      const closeLineDetail = () => {
        researchDetailPanel.value = false
        setTimeout(() => { selectedResearchLine.value = null }, 300)
      }

      // Portfolio KPIs — computed from local refs, instant, no API needed
      const portfolioKPIs = computed(() => {
        try {
          const totalLines    = (researchLines.value || []).length
          const activeLines   = (researchLines.value || []).filter(l => l.active !== false).length
          const totalTrials   = (clinicalTrials.value || []).length
          const activeTrials  = (clinicalTrials.value || []).filter(t => ['Activo','Reclutando'].includes(t.status)).length
          const recruitingTrials = (clinicalTrials.value || []).filter(t => t.status === 'Reclutando').length
          const totalProjects = (innovationProjects.value || []).length
          const lateStageProjects = (innovationProjects.value || []).filter(p => ['Piloto','Validación','Escalamiento','Comercialización'].includes(p.current_stage)).length
          const totalEnrolled = (clinicalTrials.value || []).reduce((s, t) => s + (t.actual_enrollment || 0), 0)
          const totalTarget   = (clinicalTrials.value || []).reduce((s, t) => s + (t.enrollment_target || 0), 0)
          return { totalLines, activeLines, totalTrials, activeTrials, recruitingTrials, totalProjects, lateStageProjects, totalEnrolled, totalTarget }
        } catch { return { totalLines: 0, activeLines: 0, totalTrials: 0, activeTrials: 0, recruitingTrials: 0, totalProjects: 0, lateStageProjects: 0, totalEnrolled: 0, totalTarget: 0 } }
      })

      // Line accent colours — cycles through 6 department colours
      const LINE_ACCENTS = [
        { bg: 'linear-gradient(135deg,#3b82f6,#6366f1)', light: '#eff6ff', color: '#1e40af' },
        { bg: 'linear-gradient(135deg,#10b981,#0891b2)', light: '#d1fae5', color: '#065f46' },
        { bg: 'linear-gradient(135deg,#22d3ee,#0ea5e9)', light: '#e0f7fa', color: '#0e7490' },
        { bg: 'linear-gradient(135deg,#f59e0b,#f97316)', light: '#fef3c7', color: '#92400e' },
        { bg: 'linear-gradient(135deg,#a78bfa,#8b5cf6)', light: '#ede9fe', color: '#5b21b6' },
        { bg: 'linear-gradient(135deg,#fb7185,#ec4899)', light: '#fce7f3', color: '#9d174d' },
      ]
      const getLineAccent = (lineNumber) => LINE_ACCENTS[((lineNumber || 1) - 1) % 6]

      const loadResearchDashboard = async (localResearchLines, localTrials, localProjects) => {
        if (!hasPermission('analytics', 'read')) return
        loadingAnalytics.value = true
        try {
          const data = await API.getResearchDashboard()
          if (data) {
            // Augment with researchLines table the backend doesn't return
            const lines = localResearchLines?.value || []
            const trials = localTrials?.value || []
            const projects = localProjects?.value || []
            data.researchLines = lines.map(line => ({
              id: line.id,
              line_number: line.line_number,
              name: line.research_line_name || line.name,
              active: line.active,
              coordinator_name: line.coordinator_name || null,
              coordinator_id: line.coordinator_id || null,
              trialsCount: trials.filter(t => t.research_line_id === line.id).length,
              projectsCount: projects.filter(p => p.research_line_id === line.id).length
            }))
            researchDashboard.value = data
          }
        }
        catch { showToast('Error', 'Failed to load research dashboard', 'error') }
        finally { loadingAnalytics.value = false }
      }
      const loadResearchLinesPerformance = async () => { if (!hasPermission('analytics', 'read')) return; try { researchLinesPerformance.value = await API.getResearchLinesPerformance() } catch { showToast('Error', 'Failed to load performance data', 'error') } }
      const loadPartnerCollaborations = async () => {
        if (!hasPermission('analytics', 'read')) return
        try {
          const raw = await API.getPartnerCollaborations()
          if (raw) {
            // Compute needsByType from partnerNeeds (group by first word as category proxy)
            const needs = raw.partnerNeeds || []
            const byType = {}
            needs.forEach(n => {
              const type = n.name.split(' ')[0] || 'Other'
              byType[type] = (byType[type] || 0) + n.count
            })
            raw.needsByType = Object.entries(byType).map(([type, count]) => ({ type, count })).sort((a,b) => b.count - a.count)
            partnerCollaborations.value = raw
          }
        } catch { showToast('Error', 'Failed to load partner data', 'error') }
      }
      const loadTrialsTimeline = async (years = 3) => { if (!hasPermission('analytics', 'read')) return; try { trialsTimeline.value = await API.getClinicalTrialsTimeline(years) } catch { showToast('Error', 'Failed to load timeline', 'error') } }
      const loadAnalyticsSummary = async () => { if (!hasPermission('analytics', 'read')) return; try { analyticsSummary.value = await API.getAnalyticsSummary() } catch (e) { console.error('[neumDesk] loadAnalyticsSummary failed:', e) } }

      const loadStaffResearchProfile = async (staffProfileModal, staffId) => {
        if (!staffId || !hasPermission('analytics', 'read')) return
        staffProfileModal.loadingResearch = true
        try { staffProfileModal.researchProfile = await API.getStaffResearchProfile(staffId) }
        catch { showToast('Error', 'Failed to load research profile', 'error') }
        finally { staffProfileModal.loadingResearch = false }
      }

      const handleExport = async () => {
        if (!hasPermission('analytics', 'export')) { showToast('Error', 'No permission to export data', 'error'); return }
        exportModal.loading = true
        try {
          const data = await API.exportData(exportModal.type, exportModal.format)
          const blob = new Blob([data], { type: 'text/csv' })
          const url = window.URL.createObjectURL(blob)
          const a = document.createElement('a'); a.href = url; a.download = `${exportModal.type}-${new Date().toISOString().split('T')[0]}.csv`
          document.body.appendChild(a); a.click(); document.body.removeChild(a); window.URL.revokeObjectURL(url)
          showToast('Success', 'Export completed', 'success'); exportModal.show = false
        } catch (e) { showToast('Error', e.message || 'Export failed', 'error') }
        finally { exportModal.loading = false }
      }

      const showExportModal = () => { exportModal.type = 'clinical-trials'; exportModal.show = true }

      return { researchDashboard, researchLinesPerformance, partnerCollaborations, trialsTimeline, analyticsSummary, loadingAnalytics, exportModal, analyticsActiveTab, researchHubTab, selectedResearchLine, researchDetailPanel, openLineDetail, closeLineDetail, loadResearchDashboard, loadResearchLinesPerformance, loadPartnerCollaborations, loadTrialsTimeline, loadAnalyticsSummary, loadStaffResearchProfile, handleExport, showExportModal,
        activeMissionLine, portfolioKPIs, getLineAccent, LINE_ACCENTS }
    }

    // ============ 6.13 useDashboard ============

    // ============================================================
    // NEWS & BLOG — useNews composable
    // ============================================================
    function useNews({ showToast, showConfirmation, medicalStaff, allStaffLookup, researchLines }) {
      const newsPosts      = ref([])
      const newsLoading    = ref(false)
      const activeNewsMenu = ref(null)
      const newsLoaded     = ref(false) // FIX Bug4: tracks whether fetch has been attempted, not just if results exist
      const newsModal      = reactive({
        show: false, mode: 'add', _tab: 'meta',
        form: {
          id: null, post_type: 'article', title: '', body: '', featured_image_url: '',
          image_urls: [],  // up to 5, for articles and highlights
          author_id: '', research_line_id: '', is_public: false,
          status: 'draft', expires_at: '', published_at: '',
          journal_name: '', authors_text: '', doi: '',
          _imageInput: ''  // local draft input
        }
      })
      const newsFilters    = reactive({ type: '', status: '', search: '', scope: '' })
      const debouncedNewsSearch = ref('')
      watch(() => newsFilters.search, Utils.debounce(v => { debouncedNewsSearch.value = v }, 250))
      const newsWordCount  = computed(() => {
        const t = newsModal.form.body || ''
        return t.trim() === '' ? 0 : t.trim().split(/\s+/).length
      })
      const newsWordLimit  = computed(() => newsModal.form.post_type === 'update' ? 80 : newsModal.form.post_type === 'highlight' ? 120 : 400)

      // ── Helpers ─────────────────────────────────────────────
      const formatAuthorName = (staffId) => {
        const s = (allStaffLookup?.value || []).find(m => m.id === staffId) || (medicalStaff.value || []).find(m => m.id === staffId)
        if (!s) return '—'
        const parts = (s.full_name || '').trim().split(' ')
        const last  = parts[parts.length - 1]
        return `Dr. ${last}`
      }
      const getLineName = (lineId) => {
        const l = (researchLines.value || []).find(r => r.id === lineId)
        return l ? `L${l.line_number} — ${l.short_name || l.research_line_name || l.name}` : '—'
      }
      const autoExpiry = (type) => {
        const d = new Date()
        if (type === 'update')    d.setDate(d.getDate() + 90)
        if (type === 'article')   d.setMonth(d.getMonth() + 18)
        if (type === 'highlight') d.setMonth(d.getMonth() + 12)
        if (type === 'publication') return ''
        return d.toISOString().split('T')[0]
      }

      // Auto-update expiry when post type changes in add mode
      watch(() => newsModal.form.post_type, (newType) => {
        if (newsModal.mode === 'add' && newType !== 'publication') {
          newsModal.form.expires_at = autoExpiry(newType)
        }
        if (newType === 'publication') {
          newsModal.form.expires_at = ''
        }
      })

      // ── Filtered list ────────────────────────────────────────
      const filteredNews = computed(() => {
        let posts = newsPosts.value || []
        if (newsFilters.type)   posts = posts.filter(p => p.post_type === newsFilters.type)
        if (newsFilters.status) posts = posts.filter(p => p.status === newsFilters.status)
        if (newsFilters.scope === 'public')   posts = posts.filter(p => p.is_public)
        if (newsFilters.scope === 'internal') posts = posts.filter(p => !p.is_public)
        if (debouncedNewsSearch.value) {
          const q = debouncedNewsSearch.value.toLowerCase()
          posts = posts.filter(p =>
            (p.title || '').toLowerCase().includes(q) ||
            (p.body  || '').toLowerCase().includes(q)
          )
        }
        return posts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      })

      // ── CRUD ────────────────────────────────────────────────
      const loadNews = async () => {
        newsLoading.value = true
        try {
          // CRITICAL FIX: GET /api/news returns { data: [...] } not a raw array.
          // Must unwrap .data — if we use getList/ensureArray the Object.values()
          // fallback would flatten the nested author/research_line join objects.
          const res = await API.request('/api/news')
          newsPosts.value = res?.data || Utils.ensureArray(res) || []
        } catch (e) { newsPosts.value = []; console.error('[neumDesk] loadNews failed:', e); showToast('Error', 'Could not load publications', 'error') }
        finally { newsLoading.value = false; newsLoaded.value = true }
      }
      const preloadNews = async () => {
        if (newsLoaded.value || newsLoading.value) return
        try {
          const res = await API.request('/api/news')
          newsPosts.value = res?.data || Utils.ensureArray(res) || []
          newsLoaded.value = true
        } catch (e) { console.error('[neumDesk] preloadNews failed:', e) }
      }

      const showAddNewsModal = () => {
        newsModal.mode = 'add'
        Object.assign(newsModal.form, {
          id: null, post_type: 'article', title: '', body: '', featured_image_url: '',
          image_urls: [], author_id: '', research_line_id: '', is_public: false,
          status: 'draft', expires_at: autoExpiry('article'), published_at: '',
          journal_name: '', authors_text: '', doi: '', _imageInput: ''
        })
        newsModal.show = true
      }

      const editNews = (post) => {
        newsModal.mode = 'edit'
        newsModal._tab = post.post_type === 'publication' ? 'publish' : 'content'
        const _s = (v) => v == null ? '' : String(v)
        Object.assign(newsModal.form, {
          ...post,
          body:               _s(post.body),
          featured_image_url: _s(post.featured_image_url),
          journal_name:       _s(post.journal_name),
          authors_text:       _s(post.authors_text),
          doi:                _s(post.doi),
          research_line_id:   post.research_line_id || '',
          author_id:          post.author_id || '',
          expires_at:         post.expires_at   ? post.expires_at.split('T')[0]   : '',
          published_at:       post.published_at ? post.published_at.split('T')[0] : '',
          image_urls:         Array.isArray(post.image_urls) ? [...post.image_urls] : (post.featured_image_url ? [post.featured_image_url] : []),
          _imageInput: ''
        })
        newsModal.show = true
      }

      const saveNews = async () => {
        const _t = (v) => (v == null ? '' : String(v)).trim()
        if (!_t(newsModal.form.title)) { showToast('Validation', 'Title is required', 'warning'); return }
        if (newsModal.form.post_type === 'highlight' && !(newsModal.form.image_urls?.length)) {
          showToast('Validation', 'Highlight requires at least one image', 'warning'); return
        }
        // Publication validation — require journal name or DOI
        if (newsModal.form.post_type === 'publication' && !_t(newsModal.form.journal_name) && !_t(newsModal.form.doi)) {
          showToast('Validation', 'Publications require at least a journal name or DOI', 'warning'); return
        }
        if (newsModal.form.post_type !== 'publication' && !newsModal.form.author_id) {
          showToast('Validation', 'Author is required', 'warning'); return
        }
        if (newsModal.form.post_type !== 'publication' && newsWordCount.value > newsWordLimit.value) {
          showToast('Validation', `Exceeds ${newsWordLimit.value} word limit`, 'warning'); return
        }
        const payload = {
          post_type:          newsModal.form.post_type,
          title:              _t(newsModal.form.title),
          body:               _t(newsModal.form.body) || null,
          author_id:          newsModal.form.author_id || null,
          research_line_id:   newsModal.form.research_line_id || null,
          is_public:          newsModal.form.is_public,
          status:             newsModal.form.status,
          image_urls:         Array.isArray(newsModal.form.image_urls) ? newsModal.form.image_urls : [],
          expires_at:         newsModal.form.expires_at || null,
          journal_name:       _t(newsModal.form.journal_name) || null,
          authors_text:       _t(newsModal.form.authors_text) || null,
          doi:                _t(newsModal.form.doi) || null,
          word_count:         newsWordCount.value
        }
        if (payload.status === 'published' && !payload.expires_at && newsModal.form.post_type !== 'publication') {
          payload.expires_at = autoExpiry(newsModal.form.post_type)
        }
        try {
          if (newsModal.mode === 'add') {
            await API.request('/api/news', { method: 'POST', body: payload })
            showToast('Published', 'Post created', 'success')
          } else {
            await API.request(`/api/news/${newsModal.form.id}`, { method: 'PUT', body: payload })
            showToast('Updated', 'Post saved', 'success')
          }
          newsModal.show = false
          await loadNews()
        } catch (e) { showToast('Error', e.message, 'error') }
      }

      // Strip joined/virtual fields before any PUT to backend
      const cleanPost = (post) => {
        const { author, research_line, ...rest } = post
        return rest
      }

      const publishNews = async (post) => {
        try {
          const expiry = post.expires_at || (post.post_type !== 'publication' ? autoExpiry(post.post_type) : null)
          await API.request(`/api/news/${post.id}`, { method: 'PUT', body: {
            ...cleanPost(post), status: 'published',
            published_at: new Date().toISOString(),
            expires_at: expiry
          }})
          showToast('Published', 'Post is now live', 'success')
          await loadNews()
        } catch (e) { showToast('Error', e.message, 'error') }
      }

      const toggleNewsFeature = async (post) => {
        const featuring = !post.is_featured
        try {
          const res = await API.request(`/api/news/${post.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ is_featured: featuring })
          })
          if (res.error) {
            // Max 5 reached
            showToast('Limit reached', res.message || 'Maximum 5 featured posts allowed', 'warning')
            return
          }
          // Update local state
          const idx = newsPosts.value.findIndex(p => p.id === post.id)
          if (idx !== -1) newsPosts.value[idx] = { ...newsPosts.value[idx], is_featured: featuring }
          showToast('Updated', featuring ? 'Post featured on homepage' : 'Post removed from homepage', 'success')
        } catch (e) {
          showToast('Error', 'Failed to update feature status', 'error')
        }
      }

      const archiveNews = async (post) => {
        showConfirmation({
          title: 'Archive Post',
          message: `Archive "${post.title}"? It will be hidden from view but not deleted.`,
          onConfirm: async () => {
            try {
              await API.request(`/api/news/${post.id}`, { method: 'PUT', body: { ...cleanPost(post), status: 'archived' }})
              showToast('Archived', 'Post archived', 'info')
              await loadNews()
            } catch (e) { showToast('Error', e.message, 'error') }
          }
        })
      }

      const deleteNews = async (post) => {
        showConfirmation({
          title: 'Delete Post',
          message: `Permanently delete "${post.title}"? This cannot be undone.`,
          onConfirm: async () => {
            try {
              await API.request(`/api/news/${post.id}`, { method: 'DELETE' })
              showToast('Deleted', 'Post deleted', 'success')
              await loadNews()
            } catch (e) { showToast('Error', e.message, 'error') }
          }
        })
      }

      const togglePublic = async (post) => {
        try {
          await API.request(`/api/news/${post.id}`, { method: 'PUT', body: { ...cleanPost(post), is_public: !post.is_public }})
          showToast('Updated', post.is_public ? 'Now internal only' : 'Now public on website', 'success')
          await loadNews()
        } catch (e) { showToast('Error', e.message, 'error') }
      }

      return {
        newsPosts, newsLoading, newsLoaded, newsModal, newsFilters, filteredNews,
        newsWordCount, newsWordLimit, activeNewsMenu,
        loadNews, preloadNews, showAddNewsModal, editNews, saveNews,
        publishNews, archiveNews, deleteNews, toggleNewsFeature, togglePublic,
        formatAuthorName, getLineName, autoExpiry
      }
    }

    function useDashboard({ medicalStaff, allStaffLookup, rotations, absences, onCallSchedule, trainingUnits = ref([]) }) {
      const systemStats = ref({
        totalStaff: 0, activeAttending: 0, activeResidents: 0, onCallNow: 0, inSurgery: 0,
        activeRotations: 0, endingThisWeek: 0, startingNextWeek: 0, onLeaveStaff: 0,
        departmentStatus: 'normal', activePatients: 0, icuOccupancy: 0, wardOccupancy: 0,
        pendingApprovals: 0, nextShiftChange: new Date(Date.now() + 6 * 3600000).toISOString()
      })
      const currentTime = ref(new Date())

      const animateCount = (targetRef, end, duration = 600) => {
        if (!end) return
        const start = performance.now()
        const step = (now) => {
          const p = Math.min((now - start) / duration, 1); const e = 1 - Math.pow(1 - p, 3)
          targetRef.value = Math.round(end * e)
          if (p < 1) requestAnimationFrame(step); else targetRef.value = end
        }
        requestAnimationFrame(step)
      }

      const loadSystemStats = async () => {
        try { const data = await API.getSystemStats(); if (data?.success) Object.assign(systemStats.value, data.data) } catch (e) { console.error('[neumDesk] loadSystemStats failed:', e) }
      }

      const updateDashboardStats = () => {
        const ns = medicalStaff.value.length
        const na = medicalStaff.value.filter(s => s.staff_type === 'attending_physician' && s.employment_status === 'active').length
        // M1 FIX: was hardcoded to 'medical_resident' — use isResidentType() for dynamic types
        const nr = medicalStaff.value.filter(s => isResidentType(s.staff_type) && s.employment_status === 'active').length

        if (systemStats.value.totalStaff === 0 && ns > 0) {
          const tr = { value: 0 }, ar = { value: 0 }, rr = { value: 0 }
          animateCount(tr, ns, 700); animateCount(ar, na, 600); animateCount(rr, nr, 650)
          const iv = setInterval(() => {
            systemStats.value.totalStaff = tr.value; systemStats.value.activeAttending = ar.value; systemStats.value.activeResidents = rr.value
            if (tr.value >= ns) clearInterval(iv)
          }, 16)
        } else { systemStats.value.totalStaff = ns; systemStats.value.activeAttending = na; systemStats.value.activeResidents = nr }

        const today = Utils.normalizeDate(new Date())
        systemStats.value.onLeaveStaff = absences.value.filter(a => {
          const s = Utils.normalizeDate(a.start_date), e = Utils.normalizeDate(a.end_date)
          if (!s || !e || !(s <= today && today <= e)) return false
          if (a.current_status) return a.current_status === 'currently_absent'
          return true
        }).length

        systemStats.value.activeRotations = rotations.value.filter(r => r.rotation_status === 'active').length

        const todayDate = new Date(); todayDate.setHours(0, 0, 0, 0)
        const nextWeek = new Date(todayDate.getTime() + 7 * 86400000)
        const twoWeeks = new Date(todayDate.getTime() + 14 * 86400000)

        systemStats.value.endingThisWeek = rotations.value.filter(r => {
          if (r.rotation_status !== 'active') return false
          const e = new Date(Utils.normalizeDate(r.end_date) + 'T00:00:00')
          return !isNaN(e.getTime()) && e >= todayDate && e <= nextWeek
        }).length

        systemStats.value.startingNextWeek = rotations.value.filter(r => {
          if (r.rotation_status !== 'scheduled') return false
          const s = new Date(Utils.normalizeDate(r.start_date) + 'T00:00:00')
          return !isNaN(s.getTime()) && s >= nextWeek && s <= twoWeeks
        }).length

        const unique = new Set()
        onCallSchedule.value.filter(s => Utils.normalizeDate(s.duty_date) === today).forEach(s => {
          if (s.primary_physician_id) unique.add(s.primary_physician_id)
          if (s.backup_physician_id) unique.add(s.backup_physician_id)
        })
        systemStats.value.onCallNow = unique.size
      }

      // ── Situational awareness — "What is happening today" narrative ──
      const situationItems = computed(() => {
        const items = []
        const todayDate = new Date(); todayDate.setHours(0,0,0,0)
        const in7  = new Date(todayDate.getTime() + 7  * 86400000)
        const in30 = new Date(todayDate.getTime() + 30 * 86400000)

        // Rotations ending this week
        const endingThisWeek = rotations.value.filter(r => {
          if (r.rotation_status !== 'active') return false
          const e = new Date(r.end_date + 'T00:00:00')
          return e >= todayDate && e <= in7
        })
        if (endingThisWeek.length > 0) {
          const names = endingThisWeek.slice(0,2).map(r => {
            const s = (allStaffLookup?.value || []).find(x => x.id === r.resident_id) || medicalStaff.value.find(x => x.id === r.resident_id)
            return s ? Utils.formatDrName(s.full_name) : 'Unknown'
          }).join(', ')
          const more = endingThisWeek.length > 2 ? ` +${endingThisWeek.length-2}` : ''
          items.push({ icon: 'fa-clock', type: 'warn', text: `${endingThisWeek.length} rotation${endingThisWeek.length>1?'s':''} ending this week — ${names}${more}`, action: 'resident_rotations', actionFilter: { rotationStatus: 'active' } })
        }

        // Free slots opening within 30 days
        const freeSlots = []
        trainingUnits.value.forEach(unit => {
          const activeRots = rotations.value.filter(r => r.training_unit_id === unit.id && r.rotation_status === 'active')
          activeRots.forEach(r => {
            const end = new Date(r.end_date + 'T00:00:00')
            if (end >= todayDate && end <= in30 && activeRots.length >= unit.maximum_residents) {
              freeSlots.push({ unit: unit.unit_name, date: r.end_date })
            }
          })
        })
        if (freeSlots.length > 0) {
          const first = freeSlots[0]
          const fmtDate = new Date(first.date + 'T00:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
          items.push({ icon: 'fa-calendar-plus', type: 'info', text: `Slot opens in ${first.unit} from ${fmtDate}`, action: 'training_units' })
        }

        // Starting next 7 days
        const startingThisWeek = rotations.value.filter(r => {
          if (r.rotation_status !== 'scheduled') return false
          const s = new Date(r.start_date + 'T00:00:00')
          return s >= todayDate && s <= in7
        })
        if (startingThisWeek.length > 0) {
          items.push({ icon: 'fa-play-circle', type: 'ok', text: `${startingThisWeek.length} rotation${startingThisWeek.length>1?'s':''} starting this week`, action: 'resident_rotations' })
        }

        // Residents with no rotation in the next month
        const unassigned = medicalStaff.value.filter(s => {
          if (!isResidentType(s.staff_type) || s.employment_status !== 'active') return false
          const mStart = new Date(todayDate.getFullYear(), todayDate.getMonth() + 1, 1)
          const mEnd   = new Date(todayDate.getFullYear(), todayDate.getMonth() + 2, 0)
          return !rotations.value.some(r =>
            r.resident_id === s.id &&
            ['active','scheduled'].includes(r.rotation_status) &&
            new Date(r.start_date) <= mEnd && new Date(r.end_date) >= mStart
          )
        })
        if (unassigned.length > 0) {
          const names = unassigned.slice(0,2).map(s => Utils.formatDrName(s.full_name) || '').join(', ')
          const more  = unassigned.length > 2 ? ` +${unassigned.length - 2}` : ''
          items.push({ icon: 'fa-user-clock', type: 'warn', text: `${unassigned.length} resident${unassigned.length>1?'s':''} unassigned next month — ${names}${more}`, action: 'resident_rotations', urgent: unassigned.length > 2 })
        }

        // On-call gaps in next 7 days
        const ocGaps = []
        for (let i = 0; i < 7; i++) {
          const d = new Date(todayDate.getTime() + i * 86400000)
          const ds = Utils.normalizeDate(d)
          const hasPrimary = onCallSchedule.value.some(s => Utils.normalizeDate(s.duty_date) === ds && ['primary_call','primary','weekend_coverage'].includes(s.shift_type))
          if (!hasPrimary) ocGaps.push(d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' }))
        }
        if (ocGaps.length > 0) {
          items.push({ icon: 'fa-phone-slash', type: 'danger', text: `${ocGaps.length} day${ocGaps.length>1?'s':''} without primary on-call — ${ocGaps.slice(0,2).join(', ')}${ocGaps.length>2?'…':''}`, action: 'oncall_schedule', urgent: true })
        }

        // Gap + slot match — pair residents finishing soon with units opening soon
        const gapSlotMatches = []
        const endingSoon = rotations.value.filter(r => {
          if (r.rotation_status !== 'active') return false
          const e = new Date(r.end_date + 'T00:00:00')
          return e >= todayDate && e <= in30
        })
        endingSoon.forEach(rot => {
          const resident = (allStaffLookup?.value || []).find(s => s.id === rot.resident_id) || medicalStaff.value.find(s => s.id === rot.resident_id)
          if (!resident) return
          // Find units with free slots opening around the same time
          trainingUnits.value.forEach(unit => {
            const active = rotations.value.filter(r =>
              r.training_unit_id === unit.id && r.rotation_status === 'active'
            )
            if (active.length < unit.maximum_residents) {
              gapSlotMatches.push({
                residentName: resident.full_name,
                residentId: resident.id,
                unitName: unit.unit_name,
                unitId: unit.id,
                endDate: rot.end_date
              })
            }
          })
        })
        if (gapSlotMatches.length > 0) {
          const m = gapSlotMatches[0]
          items.push({
            icon: 'fa-link', type: 'info',
            text: `${Utils.formatDrName(m.residentName)} finishing rotation — ${m.unitName} has a free slot`,
            action: 'resident_rotations',
            actionFilter: { resident: m.residentId }
          })
        }

        // Add "all covered" positive if nothing is wrong but we have data
        if (items.length === 0 && medicalStaff.value.length > 0) {
          const todayStr = Utils.normalizeDate(new Date())
          const hasCoverage = onCallSchedule.value.some(s =>
            Utils.normalizeDate(s.duty_date) === todayStr &&
            ['primary_call','primary','weekend_coverage'].includes(s.shift_type)
          )
          const hasActiveRotations = rotations.value.some(r => r.rotation_status === 'active')
          items.push({
            icon: 'fa-check-circle',
            type: 'ok',
            text: [
              hasCoverage ? 'On-call covered' : null,
              hasActiveRotations ? `${rotations.value.filter(r=>r.rotation_status==='active').length} rotations active` : null,
              `${medicalStaff.value.filter(s=>s.employment_status==='active').length} staff available`,
            ].filter(Boolean).join(' · '),
            action: null
          })
        }
        return items.sort((a,b) => {
          const p = { danger: 0, warn: 1, info: 2, ok: 3 }
          return (p[a.type] ?? 4) - (p[b.type] ?? 4)
        })
      })

      // Top 3 priority items for the dashboard briefing card
      const dailyBriefing = computed(() => {
        const dataReady = medicalStaff.value.length > 0 || rotations.value.length > 0 || onCallSchedule.value.length > 0
        if (!dataReady) return []
        return situationItems.value.slice(0, 4)
      })

      // systemSummary — department health overview for dashboard
      const systemSummary = computed(() => {
        const today = Utils.normalizeDate(new Date())
        const activeStaff     = medicalStaff.value.filter(s => s.employment_status === 'active').length
        const onLeave         = medicalStaff.value.filter(s => s.employment_status === 'on_leave').length
        const activeRotations = rotations.value.filter(r => r.rotation_status === 'active').length
        const scheduledRots   = rotations.value.filter(r => r.rotation_status === 'scheduled').length
        const todayHasCoverage= onCallSchedule.value.some(s =>
          Utils.normalizeDate(s.duty_date) === today &&
          ['primary_call','primary','weekend_coverage'].includes(s.shift_type)
        )
        const dangerAlerts = situationItems.value.filter(i => i.type === 'danger').length
        const warnAlerts   = situationItems.value.filter(i => i.type === 'warn').length
        const healthScore  = Math.max(0, 100
          - (dangerAlerts * 25)
          - (warnAlerts   * 10)
          - (onLeave > 0 && !todayHasCoverage ? 15 : 0)
        )
        return {
          activeStaff, onLeave, activeRotations, scheduledRots, todayHasCoverage,
          dangerAlerts, warnAlerts, healthScore,
          healthLabel: healthScore >= 80 ? 'Optimal' : healthScore >= 60 ? 'Good' : healthScore >= 40 ? 'Attention' : 'Action required',
          healthColor: healthScore >= 80 ? 'var(--nm-teal,#00b3b3)' : healthScore >= 60 ? '#3b82f6' : healthScore >= 40 ? '#f59e0b' : '#ef4444',
        }
      })

      const currentTimeFormatted = computed(() => Utils.formatTime(currentTime.value))
      return { systemStats, currentTime, currentTimeFormatted, loadSystemStats, updateDashboardStats, situationItems, dailyBriefing, systemSummary }
    }

    // ============ 7. ROOT APP ============
    const app = createApp({
      setup() {
        const loading = ref(false)
        const saving = ref(false)

        const showPassword = ref(false)
        const loginError = ref('')
        const loginFieldErrors = reactive({ email: '', password: '' })
        const clearLoginError = (field) => { if (field === 'email') loginFieldErrors.email = ''; if (field === 'password') loginFieldErrors.password = ''; loginError.value = '' }
        const handleForgotPassword = () => { showToast('Info', 'Password reset link sent', 'info') }

        const auth = useAuth()
        const { currentUser, loginForm, loginLoading, hasPermission, isAdmin } = auth
        const ui = useUI()
        const { showToast, showConfirmation, currentView, userMenuOpen, userProfileModal } = ui

        const { sortState, sortBy, sortIcon, applySort } = makeSort({
          medical_staff: { field: 'full_name', dir: 'asc' },
          rotations: { field: 'start_date', dir: 'desc' },
          oncall: { field: 'duty_date', dir: 'asc' },
          absences: { field: 'start_date', dir: 'desc' },
          trials: { field: 'protocol_id', dir: 'asc' },
          research_lines: { field: 'line_number', dir: 'asc' }
        })

        const { pagination, resetPage, paginate, totalPages, goToPage } = makePagination([
          ['medical_staff', 25], ['rotations', 25], ['oncall', 25], ['absences', 25], ['trials', 25], ['projects', 25], ['research_lines', 50]
        ])

        const { fieldErrors, setErr, clearErr: clearFieldError, clearAll } = makeValidation(['rotation', 'staff', 'absence', 'oncall', 'research'])

        // ── Shared refs hoisted above all composables ──────────────────────
        // Both useTrainingUnits and useRotations need each other's data.
        // Hoisting the refs here breaks the circular dependency cleanly:
        // both composables receive the same reactive container,
        // so when either load function fills it all consumers see it immediately.
        const trainingUnits = ref([])
        const rotations     = ref([])
        // researchLines hoisted so useStaff can clear coordinator assignments on role revoke
        const researchLinesShared = ref([])
        // allDepartmentsLookup hoisted so useTrainingUnits can filter units by department
        // without requiring useDepartments to be initialised first
        const allDepartmentsLookupShared = ref([])

        const staffOps = useStaff({ showToast, showConfirmation, paginate, totalPages, resetPage, applySort, fieldErrors, setErr, clearAll, currentUser, researchLines: researchLinesShared, loadResearchLines: async () => { try { researchLinesShared.value = await API.getResearchLines() } catch {} } })
        const { medicalStaff, allStaffLookup, hospitalsList } = staffOps

        const { trainingUnitFilters, trainingUnitModal, unitsByDepartment, unitResidentsModal, unitCliniciansModal,
          filteredTrainingUnits, getUnitActiveRotationCount, getUnitRotations, getUnitScheduledCount, getUnitOverlapWarning, getResidentShortName,
          loadTrainingUnits, showAddTrainingUnitModal,
          editTrainingUnit, deleteTrainingUnit, openUnitClinicians, saveUnitClinicians,
          assignAttendingToUnit,
          viewUnitResidents, saveTrainingUnit,
          trainingUnitView, trainingUnitHorizon, getTimelineMonths, getUnitSlots, getDaysUntilFree,
          tlPopover, openCellPopover, closeCellPopover,
          occupancyPanel, unitDetailDrawer, occupancyHeatmap, occupancyPanelUnits,
          getUnitMonthOccupancy, getNextFreeMonth, openUnitDetail,
          unitStaffCache,
          weeklyStaffingGrid
        } = useTrainingUnits({ showToast, showConfirmation, trainingUnits, rotations, allStaffLookup, allDepartmentsLookup: allDepartmentsLookupShared })

        const rotationOps = useRotations({ showToast, showConfirmation, paginate, totalPages, resetPage, applySort, setErr, clearAll, medicalStaff, allStaffLookup, trainingUnits, rotations, currentUser })

        // Destructure getHorizonMonths so absence timeline functions can use it without qualification
        const { getHorizonMonths } = rotationOps

        const { departments, allDepartmentsLookup, departmentFilters, departmentModal, deptReassignModal,
          filteredDepartments, getDepartmentName, getPrimaryDepartment, getExternalDepartments, isDepartmentExternal, isDepartmentPrimary, getDepartmentUnits, getDepartmentStaffCount, getDeptResidentStats, getDeptHomeResidents,
          loadDepartments, showAddDepartmentModal, editDepartment, saveDepartment,
          deleteDepartment, confirmDeptReassignAndDeactivate, viewDepartmentStaff,
          deptPanel, openDeptPanel, closeDeptPanel,
          deptPanelAttending, deptPanelResidents, deptPanelUnits,
          getUnitSupervisorName } = useDepartments({
          showToast, showConfirmation, medicalStaff, trainingUnits, rotations
        })

        // deptPanelRotations — uses the shared rotations ref, needs deptPanelUnits
        const deptPanelRotations = computed(() => {
          if (!deptPanel.dept) return []
          const unitIds = new Set(deptPanelUnits.value.map(u => u.id))
          return rotations.value.filter(r =>
            unitIds.has(r.training_unit_id) &&
            ['active','scheduled'].includes(r.rotation_status)
          ).sort((a,b) => new Date(a.end_date + 'T00:00:00') - new Date(b.end_date + 'T00:00:00'))
        })

        const rotDaysLeft = (r) => {
          if (!r) return 0
          const diff = Math.ceil((new Date(Utils.normalizeDate(r.end_date) + 'T00:00:00') - new Date()) / 86400000)
          return diff > 0 ? diff : 0
        }

        const absenceOps = useAbsences({ showToast, showConfirmation, paginate, totalPages, resetPage, applySort, setErr, clearAll, medicalStaff, allStaffLookup, onCallSchedule: ref([]) })
        const { absences } = absenceOps

        // ── Unit staff absence impact (needs absences in scope) ──────────────
        const getUnitAbsentAttendingCount = (unitId) => {
          const staff = unitStaffCache.value[unitId] || []
          const today = new Date().toISOString().slice(0, 10)
          return staff.filter(a => {
            if (!a.staff?.id) return false
            return absences.value.some(ab =>
              ab.staff_member_id === a.staff.id &&
              !['cancelled','returned_to_duty'].includes(ab.current_status) &&
              ab.start_date <= today && ab.end_date >= today
            )
          }).length
        }
        const getUnitPresentAttendingCount = (unitId) =>
          (unitStaffCache.value[unitId] || []).length - getUnitAbsentAttendingCount(unitId)
        const isUnitUnderstaffed = (unitId) => {
          const total = (unitStaffCache.value[unitId] || []).length
          if (total === 0) return false
          const absent = getUnitAbsentAttendingCount(unitId)
          return absent > 0 && (absent / total) >= 0.5
        }
        const isStaffAbsentToday = (staffId) => {
          const today = new Date().toISOString().slice(0, 10)
          return absences.value.some(ab =>
            ab.staff_member_id === staffId &&
            !['cancelled','returned_to_duty'].includes(ab.current_status) &&
            ab.start_date <= today && ab.end_date >= today
          )
        }

        // ── Dashboard alert: units that are understaffed today ───────────────
        const understaffedUnitAlerts = computed(() => {
          return trainingUnits.value
            .filter(u => u.unit_status === 'active' && isUnitUnderstaffed(u.id))
            .map(u => ({
              id: u.id,
              unitName: u.unit_name,
              present: getUnitPresentAttendingCount(u.id),
              total: (unitStaffCache.value[u.id] || []).length
            }))
        })

        const getAbsenceUnitImpact = (staffId, startDate, endDate) => {
          if (!staffId || !unitStaffCache?.value) return []
          try {
            return Object.entries(unitStaffCache.value)
              .filter(([, members]) => Array.isArray(members) && members.some(m => m.staff?.id === staffId))
              .map(([unitId]) => {
                const unit  = trainingUnits.value?.find(u => u.id === unitId)
                const total = (unitStaffCache.value[unitId] || []).length
                const absent = getUnitAbsentAttendingCount(unitId)
                return { unitId, unitName: unit?.unit_name || 'Unit', total, absent,
                         remaining: total - absent - 1 }
              })
              .filter(u => u.total > 0)
          } catch { return [] }
        }

        const onCallOps = useOnCall({ showToast, showConfirmation, paginate, totalPages, resetPage, applySort, setErr, clearAll, medicalStaff, allStaffLookup, absences })
        const { onCallSchedule, coverageAreas, oncallChipStyle } = onCallOps

        // ── Root-level cross-composable computed ─────────────────
        // absenceOnCallConflict: needs absenceModal (useAbsences) AND
        // onCallSchedule (useOnCall) — defined here where both are in scope
        const absenceOnCallConflict = computed(() => {
          const pid   = absenceOps.absenceModal?.form?.staff_member_id
          const start = absenceOps.absenceModal?.form?.start_date
          const end   = absenceOps.absenceModal?.form?.end_date
          if (!pid || !start || !end) return []
          const s = Utils.normalizeDate(start)
          const e = Utils.normalizeDate(end)
          return (onCallSchedule?.value || []).filter(shift => {
            const d = Utils.normalizeDate(shift.duty_date)
            return d >= s && d <= e &&
              (shift.primary_physician_id === pid || shift.backup_physician_id === pid)
          }).map(shift => ({
            date: new Date(shift.duty_date + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' }),
            role: shift.primary_physician_id === pid ? 'Primary' : 'Backup',
            area: shift.coverage_area?.name || (coverageAreas?.value || []).find(a => a.id === shift.coverage_area_id)?.name || null,
            time: `${(shift.start_time||'').slice(0,5)} → ${(shift.end_time||'').slice(0,5)}`
          }))
        })

        
        // ============ STAFF DEACTIVATION WORKFLOW ============
        // Professional reassignment flow: scan future records before deactivating
        const reassignmentModal = reactive({
          show: false, staff: null, saving: false,
          affectedShifts: [], affectedRotations: [], affectedAbsences: [],
          replacements: {}
        })

        const deleteMedicalStaff = (staff) => {
          const today = Utils.normalizeDate(new Date())

          // Scan future on-call shifts
          const affectedShifts = []
          onCallSchedule.value.forEach(s => {
            if (Utils.normalizeDate(s.duty_date) < today) return
            if (s.primary_physician_id === staff.id) affectedShifts.push({ ...s, role: 'primary' })
            else if (s.backup_physician_id === staff.id) affectedShifts.push({ ...s, role: 'backup' })
          })

          // Scan active/scheduled rotations
          const affectedRotations = []
          rotations.value.forEach(r => {
            if (['completed', 'cancelled'].includes(r.rotation_status)) return
            if (r.supervising_attending_id === staff.id) affectedRotations.push({ ...r, role: 'supervisor' })
            else if (r.resident_id === staff.id) affectedRotations.push({ ...r, role: 'resident' })
          })

          // Scan future absences where this person is the cover
          const affectedAbsences = []
          absences.value.forEach(a => {
            if (Utils.normalizeDate(a.end_date) < today) return
            if (a.covering_staff_id === staff.id) affectedAbsences.push({ ...a, role: 'cover' })
          })

          const total = affectedShifts.length + affectedRotations.length + affectedAbsences.length

          if (total === 0) {
            showConfirmation({
              title: 'Remove Staff Member',
              message: `Remove ${staff.full_name} from active staff?`,
              icon: 'fa-user-times',
              confirmButtonText: 'Confirm Removal',
              confirmButtonClass: 'btn-danger',
              details: 'No upcoming assignments found. All historical records are preserved for audit purposes.',
              onConfirm: async () => {
                try {
                  await staffOps.deactivateStaffMember(staff.id, staff.full_name)
                  showToast('Done', `${staff.full_name} has been deactivated`, 'success')
                } catch (e) { showToast('Error', e.message || 'Failed to remove staff member', 'error') }
              }
            })
          } else {
            Object.assign(reassignmentModal, {
              show: true, staff, saving: false,
              affectedShifts, affectedRotations, affectedAbsences,
              replacements: {}
            })
          }
        }

        const confirmReassignAndDeactivate = async () => {
          const { staff, affectedShifts, affectedRotations, affectedAbsences, replacements } = reassignmentModal
          reassignmentModal.saving = true
          try {
            // Patch on-call shifts
            for (const shift of affectedShifts) {
              const newId = replacements[`shift_${shift.role}_${shift.id}`] || null
              const existing = onCallSchedule.value.find(s => s.id === shift.id) || shift
              const payload = {
                primary_physician_id: shift.role === 'primary' ? newId : existing.primary_physician_id,
                backup_physician_id:  shift.role === 'backup'  ? newId : existing.backup_physician_id,
                duty_date: existing.duty_date, shift_type: existing.shift_type,
                start_time: existing.start_time, end_time: existing.end_time,
                coverage_notes: existing.coverage_notes || ''
              }
              await API.updateOnCall(shift.id, payload)
              const idx = onCallSchedule.value.findIndex(s => s.id === shift.id)
              if (idx !== -1) {
                if (shift.role === 'primary') onCallSchedule.value[idx].primary_physician_id = newId
                else onCallSchedule.value[idx].backup_physician_id = newId
              }
            }
            // Patch rotation supervisors (residents can't be re-assigned here)
            for (const rot of affectedRotations.filter(r => r.role === 'supervisor')) {
              const newId = replacements[`rotation_supervisor_${rot.id}`] || null
              const existing = rotations.value.find(r => r.id === rot.id) || rot
              await API.updateRotation(rot.id, { ...existing, supervising_attending_id: newId })
              const idx = rotations.value.findIndex(r => r.id === rot.id)
              if (idx !== -1) rotations.value[idx].supervising_attending_id = newId
            }
            // Patch absence cover assignments
            for (const abs of affectedAbsences) {
              const newId = replacements[`absence_cover_${abs.id}`] || null
              const existing = absences.value.find(a => a.id === abs.id) || abs
              await API.updateAbsence(abs.id, { ...existing, covering_staff_id: newId })
              const idx = absences.value.findIndex(a => a.id === abs.id)
              if (idx !== -1) absences.value[idx].covering_staff_id = newId
            }
            // Now deactivate
            await staffOps.deactivateStaffMember(staff.id, staff.full_name)
            const updatedCount = affectedShifts.length + affectedRotations.filter(r => r.role === 'supervisor').length + affectedAbsences.length
            reassignmentModal.show = false
            showToast('Done', `${staff.full_name} deactivated. ${updatedCount} assignment(s) updated.`, 'success')
          } catch (e) {
            showToast('Error', e.message || 'Failed to complete removal', 'error')
          } finally { reassignmentModal.saving = false }
        }


        const commsOps = useComms({ showToast, showConfirmation, medicalStaff, onCallSchedule, absences, rotations })
        const liveOps = useLiveStatus({ showToast, showConfirmation, medicalStaff, currentUser })
        const analyticsOps = useAnalytics({ showToast, hasPermission })
        const { loadAnalyticsSummary, loadResearchLinesPerformance, loadPartnerCollaborations } = analyticsOps

        const researchOps = useResearch({ showToast, showConfirmation, paginate, totalPages, resetPage, applySort, clearAll, medicalStaff, loadAnalyticsSummary, loadResearchLinesPerformance, loadPartnerCollaborations })
        // Keep the hoisted ref in sync so useStaff coordinator-clear logic sees live data
        watch(researchOps.researchLines, (v) => { researchLinesShared.value = v }, { immediate: true })

        // Enrich researchLines with stats — computed so it never mutates its own dependency
        const enrichedResearchLines = computed(() => {
          const lines    = researchOps.researchLines.value || []
          const trials   = researchOps.clinicalTrials.value || []
          const projects = researchOps.innovationProjects.value || []
          if (!lines.length) return lines
          return lines.map(line => ({
            ...line,
            stats: {
              totalStudies:    trials.filter(t => t.research_line_id === line.id).length,
              activeTrials:    trials.filter(t => t.research_line_id === line.id && ['Activo','Reclutando'].includes(t.status)).length,
              totalProjects:   projects.filter(p => p.research_line_id === line.id).length,
              totalEnrollment: trials.filter(t => t.research_line_id === line.id).reduce((s, t) => s + (t.actual_enrollment || 0), 0)
            }
          }))
        })

        // Root-level filteredResearchLines using enriched data so nav shows real stats
        const filteredResearchLines = computed(() => {
          let f = enrichedResearchLines.value
          const filters = researchOps.researchLineFilters
          if (filters.search) {
            const q = filters.search.toLowerCase()
            f = f.filter(l =>
              (l.research_line_name || l.name)?.toLowerCase().includes(q) ||
              l.description?.toLowerCase().includes(q) ||
              (Array.isArray(l.keywords) && l.keywords.some(k => k.toLowerCase().includes(q)))
            )
          }
          if (filters.active !== '') { const active = filters.active === 'true'; f = f.filter(l => l.active === active) }
          return f
        })

        // Auto-select the first research line when lines load so the right panel isn't empty
        watch(enrichedResearchLines, (lines) => {
          if (lines && lines.length > 0 && !analyticsOps.activeMissionLine.value) {
            analyticsOps.activeMissionLine.value = lines[0]
          }
        }, { immediate: true })
        // Rewire analyticsOps.portfolioKPIs to use the real research data refs from researchOps
        const portfolioKPIs = computed(() => {
          try {
            const totalLines       = (researchOps.researchLines.value || []).length
            const activeLines      = (researchOps.researchLines.value || []).filter(l => l.active !== false).length
            const totalTrials      = (researchOps.clinicalTrials.value || []).length
            const activeTrials     = (researchOps.clinicalTrials.value || []).filter(t => ['Activo','Reclutando'].includes(t.status)).length
            const recruitingTrials = (researchOps.clinicalTrials.value || []).filter(t => t.status === 'Reclutando').length
            const totalProjects    = (researchOps.innovationProjects.value || []).length
            const lateStageProjects = (researchOps.innovationProjects.value || []).filter(p => ['Piloto','Validación','Escalamiento','Comercialización'].includes(p.current_stage)).length
            const totalEnrolled    = (researchOps.clinicalTrials.value || []).reduce((s, t) => s + (t.actual_enrollment || 0), 0)
            const totalTarget      = (researchOps.clinicalTrials.value || []).reduce((s, t) => s + (t.enrollment_target || 0), 0)
            return { totalLines, activeLines, totalTrials, activeTrials, recruitingTrials, totalProjects, lateStageProjects, totalEnrolled, totalTarget }
          } catch { return { totalLines: 0, activeLines: 0, totalTrials: 0, activeTrials: 0, recruitingTrials: 0, totalProjects: 0, lateStageProjects: 0, totalEnrolled: 0, totalTarget: 0 } }
        })
        // Keep hoisted dept lookup in sync so useTrainingUnits filteredTrainingUnits always has fresh data
        watch(allDepartmentsLookup, (v) => { allDepartmentsLookupShared.value = v }, { immediate: true })
        // Wrap loadResearchDashboard so it always receives the live research data refs —
        // the raw function takes parameters; calling it bare from the template passes nothing.
        const loadResearchDashboard = () => analyticsOps.loadResearchDashboard(
          researchOps.researchLines,
          researchOps.clinicalTrials,
          researchOps.innovationProjects
        )
        const dashOps = useDashboard({ medicalStaff, allStaffLookup, rotations, absences, onCallSchedule, trainingUnits })

        const newsOps = useNews({ showToast, showConfirmation, medicalStaff, allStaffLookup, researchLines: researchOps.researchLines })

        // ── EMERGENCY CALLOUTS (DUTY LOG) ─────────────────────────────
        const callouts        = ref([])
        const calloutsLoading = ref(false)
        const calloutSummary  = ref([])
        const calloutPeriod   = reactive({ year: new Date().getFullYear(), month: new Date().getMonth() + 1 })
        const calloutModal    = reactive({
          show: false, mode: 'add',
          form: { id: null, staff_id: '', called_at: '', end_time: '', reason_category: 'respiratory_emergency', time_type: 'night', notes: '', coverage_area_id: '' }
        })
        const suggestCalloutArea = (staffId) => {
          if (!staffId) return
          const today = Utils.normalizeDate(new Date())
          // Find the shift this physician is on tonight
          const shift = (onCallSchedule?.value || []).find(s =>
            s.primary_physician_id === staffId &&
            Utils.normalizeDate(s.duty_date) === today &&
            s.coverage_area_id
          )
          if (shift?.coverage_area_id && !calloutModal.form.coverage_area_id) {
            calloutModal.form.coverage_area_id = shift.coverage_area_id
          }
        }

        const calloutReasonLabels = {
          respiratory_emergency: 'Respiratory emergency',
          bronchospasm:          'Bronchospasm',
          haemoptysis:           'Haemoptysis',
          post_procedure:        'Post-procedure complication',
          icu_transfer:          'ICU transfer support',
          patient_deterioration: 'Patient deterioration',
          other:                 'Other'
        }
        const calloutTimeTypes = { night:'Night', weekend:'Weekend', daytime:'Daytime', holiday:'Holiday' }

        let _calloutsLoadedKey = ''
        const loadCallouts = async (force = false) => {
          const key = `${calloutPeriod.year}-${calloutPeriod.month}`
          if (!force && _calloutsLoadedKey === key && callouts.value.length > 0) return
          calloutsLoading.value = true
          try {
            const p = new URLSearchParams({ year: calloutPeriod.year, month: calloutPeriod.month, limit: 200 })
            const res = await API.request(`/api/emergency-callouts?${p}`)
            callouts.value = res.data || []
            if (res._tableNotFound) {
              showToast('Setup needed', 'Run the emergency_callouts SQL migration in Supabase. See System Guide.', 'warning')
            }
            _calloutsLoadedKey = key
          } catch(e) { showToast('Error', 'Failed to load duty log', 'error') }
          finally { calloutsLoading.value = false }
        }

        const loadCalloutSummary = async () => {
          try {
            const p = new URLSearchParams({ year: calloutPeriod.year, month: calloutPeriod.month })
            calloutSummary.value = await API.request(`/api/emergency-callouts/summary?${p}`) || []
          } catch(e) { console.error('[neumDesk] loadCalloutSummary failed:', e) }
        }

        const openLogCalloutModal = () => {
          const now = new Date()
          const pad = n => String(n).padStart(2,'0')
          Object.assign(calloutModal.form, { id:null, staff_id:'', called_at:`${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`, end_time:'', reason_category:'respiratory_emergency', time_type: now.getHours() >= 22 || now.getHours() < 7 ? 'night' : now.getDay() === 0 || now.getDay() === 6 ? 'weekend' : 'daytime', notes:'', coverage_area_id:'' })
          calloutModal.mode = 'add'; calloutModal.show = true
        }

        const editCallout = (c) => {
          Object.assign(calloutModal.form, { id:c.id, staff_id:c.staff_id, called_at:c.called_at?.slice(0,16)||'', end_time:c.end_time?.slice(0,16)||'', reason_category:c.reason_category||'other', time_type:c.time_type||'night', notes:c.notes||'' })
          calloutModal.mode = 'edit'; calloutModal.show = true
        }

        const saveCallout = async () => {
          const f = calloutModal.form
          if (!f.staff_id || !f.called_at) { showToast('Validation', 'Physician and call time are required', 'warning'); return }
          try {
            const payload = { staff_id:f.staff_id, called_at:f.called_at, end_time:f.end_time||null, reason_category:f.reason_category, time_type:f.time_type, notes:f.notes }
            if (calloutModal.mode === 'add') {
              await API.request('/api/emergency-callouts', { method:'POST', body: payload })
              showToast('Logged', 'Emergency call-out recorded', 'success')
            } else {
              await API.request(`/api/emergency-callouts/${f.id}`, { method:'PUT', body: payload })
              showToast('Updated', 'Call-out record updated', 'success')
            }
            calloutModal.show = false
            await loadCallouts(); await loadCalloutSummary()
          } catch(e) { showToast('Error', e.message || 'Failed to save', 'error') }
        }

        const deleteCallout = async (c) => {
          showConfirmation({ title:'Delete call-out record', message:`Remove this call-out entry for ${c.staff?.full_name || 'this physician'}?`, confirmButtonText:'Delete', confirmButtonClass:'btn-danger',
            onConfirm: async () => {
              try {
                await API.request(`/api/emergency-callouts/${c.id}`, { method:'DELETE' })
                showToast('Deleted', 'Call-out record removed', 'success')
                await loadCallouts(); await loadCalloutSummary()
              } catch(e) { showToast('Error', e.message || 'Failed to delete', 'error') }
            }
          })
        }

        // ── Callout analytics computeds (moved from template to avoid block-body) ──
        const calloutsByArea = Vue.computed(() => {
          const cas = coverageAreas?.value || []
          const acc = {}
          ;(callouts.value || []).filter(c => c.coverage_area_id).forEach(c => {
            const name = cas.find(a => a.id === c.coverage_area_id)?.name || c.coverage_area_id
            acc[name] = (acc[name] || 0) + 1
          })
          return Object.entries(acc).sort((a,b) => b[1]-a[1]).slice(0, 6)
        })
        const calloutsByReason = Vue.computed(() => {
          const acc = {}
          ;(callouts.value || []).forEach(c => {
            const k = c.reason_category || 'other'
            acc[k] = (acc[k] || 0) + 1
          })
          return Object.entries(acc).sort((a,b) => b[1]-a[1]).slice(0, 6)
        })

        const calloutKPIs = computed(() => {
          const c = callouts.value
          const now = new Date()
          const thisMonth = c.filter(x => { const d = new Date(x.called_at); return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() })
          const ytd = c.filter(x => new Date(x.called_at).getFullYear() === now.getFullYear())
          return {
            thisMonth: thisMonth.length,
            night:     thisMonth.filter(x => x.time_type === 'night').length,
            weekend:   thisMonth.filter(x => x.time_type === 'weekend').length,
            holiday:   thisMonth.filter(x => x.time_type === 'holiday').length,
            ytd:       ytd.length,
          }
        })

        const availablePhysicians = computed(() => medicalStaff.value.filter(s =>
          s.employment_status === 'active' && s.staff_type && isOnCallEligible(s.staff_type)
        ))

        const calloutFairnessAlert = computed(() => {
          if (!availablePhysicians?.value?.length) return false
          const totals = availablePhysicians.value.map(p =>
            (onCallOps.filteredOnCallSchedules.value || []).filter(s => s.primary_physician_id === p.id || s.backup_physician_id === p.id).length +
            (calloutSummary.value.find(s => s.staff_id === p.id)?.total || 0)
          )
          const avg = totals.reduce((a,b) => a+b, 0) / Math.max(1, totals.length)
          return avg > 0 && totals.some(t => t > avg * 1.5)
        })

        // calloutDistribution — per-physician duty load with deviation from avg
        const calloutDistribution = computed(() => {
          if (!availablePhysicians?.value?.length) return []
          const physicians = availablePhysicians.value
          const items = physicians.map(p => {
            const scheduled = (onCallOps.filteredOnCallSchedules.value || []).filter(
              s => s.primary_physician_id === p.id || s.backup_physician_id === p.id
            ).length
            const summary = calloutSummary.value.find(s => s.staff_id === p.id) || {}
            const callouts = summary.total || 0
            const night    = summary.night || 0
            const weekend  = summary.weekend || 0
            const total    = scheduled + callouts
            return { id: p.id, name: p.full_name, staffType: p.staff_type, scheduled, callouts, night, weekend, total }
          })
          const avg = items.reduce((s,i) => s + i.total, 0) / Math.max(1, items.length)
          return items
            .map(i => ({ ...i, avg, deviation: avg > 0 ? Math.round((i.total / avg - 1) * 100) : 0 }))
            .sort((a,b) => b.total - a.total)
        })

        // auto-load when on-call view is active
        watch(() => currentView.value, v => {
          if (v === 'oncall_schedule')  { loadCallouts(); loadCalloutSummary(); onCallOps.loadCoverageAreas() }
          if (v === 'communications')   { commsOps.loadAnnouncements(); commsOps.loadOpsMetrics() }
        }, { immediate: false })

        // ── NEWS READER DRAWER ────────────────────────────────────────
        const newsDrawer = reactive({ show: false, post: null })
        const openNewsDrawer = (post) => { newsDrawer.post = post; newsDrawer.show = true }
        const closeNewsDrawer = () => { newsDrawer.show = false; newsDrawer.post = null }
        const newsDrawerPrev = computed(() => {
          if (!newsDrawer.post) return null
          const list = newsOps.filteredNews.value
          const idx = list.findIndex(p => p.id === newsDrawer.post.id)
          return idx > 0 ? list[idx - 1] : null
        })
        const newsDrawerNext = computed(() => {
          if (!newsDrawer.post) return null
          const list = newsOps.filteredNews.value
          const idx = list.findIndex(p => p.id === newsDrawer.post.id)
          return idx < list.length - 1 ? list[idx + 1] : null
        })
        const newsDrawerBodyParagraphs = computed(() => {
          const body = newsDrawer.post?.body
          if (!body) return []
          const chunks = body.split(/\n{2,}/).map(s => s.trim()).filter(Boolean)
          if (chunks.length <= 1) {
            const sentences = body.match(/[^.!?]+[.!?]+/g) || [body]
            const paras = []
            for (let i = 0; i < sentences.length; i += 3)
              paras.push(sentences.slice(i, i + 3).join(' ').trim())
            return paras
          }
          return chunks
        })
        // FIX: newsDrawerAuthorFull must be declared BEFORE newsDrawerInitials uses it
        const newsDrawerAuthorFull = computed(() => {
          const id = newsDrawer.post?.author_id
          if (!id) return ''
          const s = (medicalStaff.value || []).find(m => m.id === id)
          return s?.full_name || ''
        })
        const newsDrawerInitials = computed(() => {
          const name = newsDrawerAuthorFull.value || ''
          const parts = name.trim().split(/\s+/).filter(w => w.replace('.','').length > 1)
          if (parts.length >= 2) return (parts[0][0] + parts[parts.length-1][0]).toUpperCase()
          return name[0]?.toUpperCase() || '?'
        })
        const newsDrawerReadMins = computed(() => {
          const wc = newsDrawer.post?.word_count
          return wc ? Math.max(1, Math.round(wc / 200)) : null
        })
        const newsDrawerLineName = computed(() => {
          const id = newsDrawer.post?.research_line_id
          if (!id) return ''
          return newsOps.getLineName(id)
        })
        // ── END NEWS READER DRAWER ────────────────────────────────────

        const { newsPosts, newsLoading, newsLoaded, newsModal, newsFilters, filteredNews,
                newsWordCount, newsWordLimit,
                loadNews, showAddNewsModal, editNews, saveNews,
                publishNews, archiveNews, deleteNews, toggleNewsFeature, togglePublic: toggleNewsPublic,
                formatAuthorName: newsAuthorName, getLineName: newsLineName } = newsOps

        const openAssignRotationFromUnit = (unit, startDate) => {
          occupancyPanel.show   = false
          unitDetailDrawer.show = false
          rotationOps.showAddRotationModal(null, unit)
          if (startDate) rotationOps.rotationModal.form.start_date = startDate
        }
        const { systemStats, updateDashboardStats, loadSystemStats, situationItems, dailyBriefing, systemSummary } = dashOps

        // ============ NEW COMPACT VIEW STATE ============
        const rotationView = ref('detailed') // 'compact', 'detailed', 'month'
        const onCallView = ref('detailed')
        const oncallTab  = ref('schedule')
        const oncallMonthOffset = ref(0)  // 0 = current month, -1 = prev, +1 = next

        // ── Monthly view computed helpers ─────────────────────────────────
        const _ocmDate = Vue.computed(() =>
          new Date(new Date().getFullYear(), new Date().getMonth() + oncallMonthOffset.value, 1)
        )
        const oncallMonthEmptyCells = Vue.computed(() => {
          const dow = _ocmDate.value.getDay()
          const blanks = dow === 0 ? 6 : dow - 1
          return Array.from({ length: blanks }, (_, i) => i)
        })
        const oncallMonthDays = Vue.computed(() => {
          const d = _ocmDate.value
          const n = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
          return Array.from({ length: n }, (_, i) => i + 1)
        })
        const getOncallShiftsForDay = (day) => {
          const d = _ocmDate.value
          const yr = d.getFullYear()
          const mo = String(d.getMonth() + 1).padStart(2, '0')
          const dy = String(day).padStart(2, '0')
          const iso = `${yr}-${mo}-${dy}`
          return (onCallOps.onCallSchedule?.value || []).filter(s => (s.duty_date || '').slice(0, 10) === iso)
        }
        const isOncallCellToday = (day) => {
          const d = _ocmDate.value
          const t = new Date()
          return d.getFullYear() === t.getFullYear() &&
                 d.getMonth() === t.getMonth() &&
                 day === t.getDate()
        }
        const oncallMonthSummary = Vue.computed(() => {
          const d = _ocmDate.value
          const yr = d.getFullYear()
          const mo = String(d.getMonth() + 1).padStart(2, '0')
          const covered = [...new Set(
            (onCallOps.onCallSchedule?.value || [])
              .filter(s => (s.duty_date || '').startsWith(`${yr}-${mo}`))
              .map(s => s.duty_date)
          )]
          const daysInMonth = new Date(yr, d.getMonth() + 1, 0).getDate()
          return `${covered.length}/${daysInMonth} days scheduled`
        })

        // ============ EXISTING COMPUTED PROPERTIES ============
        // Name lookups — canonical versions live in their composables and are
        // exposed via ...staffOps / ...rotationOps spreads in the return below.
        // These aliases unify access from templates that call them directly.
        const getStaffName       = (id) => { if (!id) return 'Not assigned'; const s = allStaffLookup.value.find(x => x.id === id) || medicalStaff.value.find(x => x.id === id); return s?.full_name || 'Not assigned' }
        const getSupervisorName  = (id) => getStaffName(id)
        const getPhysicianName   = (id) => getStaffName(id)
        const getResidentName    = (id) => getStaffName(id)
        const getTrainingUnitName = (id) => trainingUnits.value.find(u => u.id === id)?.unit_name || 'Not assigned'
        const calculateAbsenceDuration = (s, e) => Utils.dateDiff(s, e)
        const getDaysRemaining = (d) => Utils.daysUntil(d)

        // isToday(dateStr) — true if the given YYYY-MM-DD string is today's date
        const isToday = (dateStr) => {
          if (!dateStr) return false
          const today = new Date(); today.setHours(0,0,0,0)
          const d = new Date(dateStr); d.setHours(0,0,0,0)
          return d.getTime() === today.getTime()
        }

        const getRotationProgress = (rotation) => {
          if (!rotation) return { pct: 0, label: '', urgent: false, done: false }
          const start = new Date(Utils.normalizeDate(rotation.start_date || rotation.rotation_start_date) + 'T00:00:00')
          const end   = new Date(Utils.normalizeDate(rotation.end_date   || rotation.rotation_end_date)   + 'T23:59:59')
          const now   = new Date()
          if (rotation.rotation_status === 'completed') return { pct: 100, label: 'Completed', urgent: false, done: true }
          if (rotation.rotation_status === 'cancelled') return { pct: 0, label: 'Cancelled', urgent: false, done: false }
          if (isNaN(start.getTime()) || isNaN(end.getTime())) return { pct: 0, label: '', urgent: false, done: false }
          const total = end - start
          const elapsed = now - start
          const pct = Math.min(100, Math.max(0, Math.round(elapsed / total * 100)))
          const daysLeft = Math.ceil((end - now) / 86400000)
          const urgent = daysLeft <= 7 && daysLeft >= 0
          const label = daysLeft <= 0 ? 'Ending' : daysLeft === 1 ? '1 day left' : `${daysLeft}d left`
          return { pct, label, urgent, done: false }
        }
        const getDaysUntilStart = (d) => Utils.daysUntil(d)

        const getCurrentRotationForStaff = (id) => rotations.value.find(r => r.resident_id === id && r.rotation_status === 'active') || null
        const isOnCallToday = (staffId) => { const today = Utils.normalizeDate(new Date()); return onCallSchedule.value.some(s => (s.primary_physician_id === staffId || s.backup_physician_id === staffId) && Utils.normalizeDate(s.duty_date) === today) }
        const getUpcomingOnCall = (staffId) => { if (!staffId) return []; const today = Utils.normalizeDate(new Date()); return onCallSchedule.value.filter(s => (s.primary_physician_id === staffId || s.backup_physician_id === staffId) && Utils.normalizeDate(s.duty_date) >= today).sort((a, b) => Utils.normalizeDate(a.duty_date).localeCompare(Utils.normalizeDate(b.duty_date))) }
        const getUpcomingLeave = (staffId) => {
          if (!staffId) return []
          const today = Utils.normalizeDate(new Date())
          return absences.value
            .filter(a => a.staff_member_id === staffId
              && Utils.normalizeDate(a.start_date) >= today
              && a.current_status !== 'cancelled'
              && a.current_status !== 'completed')
            .sort((a, b) => Utils.normalizeDate(a.start_date).localeCompare(Utils.normalizeDate(b.start_date)))
        }
        // Returns active + scheduled rotations for a resident (used in profile Rotations tab)
        const getUpcomingRotations = (staffId) => {
          if (!staffId) return []
          return rotations.value.filter(r =>
            r.resident_id === staffId && ['active', 'scheduled'].includes(r.rotation_status)
          ).sort((a, b) => {
            // active first, then by start date
            if (a.rotation_status === 'active' && b.rotation_status !== 'active') return -1
            if (a.rotation_status !== 'active' && b.rotation_status === 'active') return 1
            return (a.start_date || '').localeCompare(b.start_date || '')
          })
        }
                const getRotationHistory = (staffId) => { if (!staffId) return []; return rotations.value.filter(r => r.resident_id === staffId && !['active', 'scheduled'].includes(r.rotation_status)).sort((a, b) => Utils.normalizeDate(b.end_date || b.rotation_end_date).localeCompare(Utils.normalizeDate(a.end_date || a.rotation_end_date))) }
        const getRotationDaysLeft = (staffId) => { const r = getCurrentRotationForStaff(staffId); return r ? getDaysRemaining(r.end_date || r.rotation_end_date) : 0 }
        const getCurrentRotationSupervisor = (staffId) => { const r = getCurrentRotationForStaff(staffId); return r?.supervising_attending_id ? getStaffName(r.supervising_attending_id) : 'Not assigned' }
        const hasProfessionalCredentials = (staff) => !!(staff?.academic_degree || staff?.specialization || staff?.training_year || staff?.clinical_certificate || staff?.medical_license)

        const toggleProfileSection = (key) => {
          if (!staffOps.staffProfileModal.collapsed) staffOps.staffProfileModal.collapsed = {}
          staffOps.staffProfileModal.collapsed[key] = !staffOps.staffProfileModal.collapsed[key]
        }

        // Load certificates into profile modal on demand
        const loadStaffCertificates = async (staffId) => {
          if (!staffId) return
          staffOps.staffProfileModal.loadingCerts = true
          staffOps.staffProfileModal.certificates = []
          try {
            const data = await API.request(`/api/medical-staff/${staffId}/certificates`)
            staffOps.staffProfileModal.certificates = Array.isArray(data) ? data : []
          } catch { staffOps.staffProfileModal.certificates = [] }
          finally { staffOps.staffProfileModal.loadingCerts = false }
        }

        const loadStaffUnits = async (staffId) => {
          if (!staffId) return
          staffOps.staffProfileModal.unitsLoading = true
          staffOps.staffProfileModal.units = []
          try {
            const res = await API.request(`/api/staff/${staffId}/units`)
            staffOps.staffProfileModal.units = Array.isArray(res?.data) ? res.data : []
          } catch (e) {
            staffOps.staffProfileModal.units = []
            console.error('[neumDesk] loadStaffUnits failed:', e)
          } finally { staffOps.staffProfileModal.unitsLoading = false }
        }

        const viewStaffDetails = async (staff) => {
          if (!staff || !staff.id) { console.warn('viewStaffDetails: staff object is undefined or missing id'); return; }
          staffOps.staffProfileModal.staff = staff; staffOps.staffProfileModal.activeTab = 'overview'; staffOps.staffProfileModal.show = true
          // Instant local profile from refs — shown immediately with no loading state
          const quickProfile = researchOps.getStaffResearchQuick(staff.id)
          if (quickProfile) staffOps.staffProfileModal.researchProfile = quickProfile
          // Prefetch ALL tab data in parallel — no waiting for tab clicks
          const prefetchAll = [
            // Certificates — previously only loaded on tab click
            loadStaffCertificates(staff.id),
            // Research profile
            hasPermission('analytics', 'read') ? analyticsOps.loadStaffResearchProfile(staffOps.staffProfileModal, staff.id) : Promise.resolve(),
            // Leave balance
            API.getLeaveBalance(staff.id).then(b => { staffOps.staffProfileModal.leaveBalance = b }).catch(() => { staffOps.staffProfileModal.leaveBalance = null }),
          ]
          // Supervision (attending/supervisors only)
          if (staff.staff_type === 'attending_physician' || staffTypeMap.value[staff.staff_type]?.can_supervise) {
            staffOps.staffProfileModal.loadingSupervision = true
            prefetchAll.push(
              API.getSupervisedResidents(staff.id)
                .then(d => { staffOps.staffProfileModal.supervisionData = d })
                .catch(() => { staffOps.staffProfileModal.supervisionData = { current: [], currentCount: 0, pastCount: 0, totalDaysSupervised: 0 } })
                .finally(() => { staffOps.staffProfileModal.loadingSupervision = false })
            )
          }
          // Fire all in parallel — no sequential waiting
          await Promise.allSettled(prefetchAll)
        }

        const formatStaffType = (t) => formatStaffTypeGlobal(t)  // single definition — composable copies removed
        const formatStaffTypeShortFn = (t) => formatStaffTypeShort(t)
        const getStaffTypeClass = (t) => getStaffTypeClassGlobal(t)
        const formatEmploymentStatus = (s) => ({ active: 'Active', on_leave: 'On Leave', inactive: 'Inactive' }[s] || s)
        const formatAbsenceReason = (r) => ABSENCE_REASON_LABELS[r] || r
        const formatRotationStatus = (s) => ROTATION_STATUS_LABELS[s] || s
        const getUserRoleDisplay = (r) => USER_ROLE_LABELS[r] || r
        const formatAudience = (a) => {
          const base = { all_staff: 'All Staff', all: 'All (incl. admin)', residents_only: 'Residents Only', attending_only: 'Attendings Only', medical_staff: 'Medical Staff', residents: 'Residents', attendings: 'Attendings' }
          if (base[a]) return base[a]
          if (a?.startsWith('dept_')) {
            const deptId = a.replace('dept_', '')
            const dept = departments.value.find(d => d.id === deptId) || allDepartmentsLookup.value.find(d => d.id === deptId)
            return dept ? `${dept.name} — All` : 'Department'
          }
          return a || '—'
        }
        // Only the 4 values the DB CHECK constraint allows:
        const formatStudyStatus = (s) => ({
          'Reclutando': 'Recruiting', 'Activo': 'Active',
          'Completado': 'Completed', 'En preparación': 'In preparation'
        }[s] || s)
        const getCurrentViewTitle = () => VIEW_TITLES[currentView.value] || 'neumDesk'
        const getCurrentViewSubtitle = () => {
          const v = currentView.value
          try {
            // ── Medical Staff ──────────────────────────────────────────────
            if (v === 'medical_staff') {
              const staff = medicalStaff.value || []
              const active = staff.filter(s => s.employment_status === 'active').length
              const residents = staff.filter(s => s.employment_status === 'active' && isResidentType(s.staff_type)).length
              const attendings = active - residents
              if (!active) return 'No active staff'
              return `${attendings} attending${attendings !== 1 ? 's' : ''} · ${residents} resident${residents !== 1 ? 's' : ''}`
            }
            // ── On-call ────────────────────────────────────────────────────
            if (v === 'oncall_schedule') {
              const today = Utils.normalizeDate(new Date())
              const todayShifts = (onCallOps.onCallSchedule?.value || []).filter(s =>
                Utils.normalizeDate(s.duty_date) === today
              )
              if (!todayShifts.length) return 'No shifts scheduled today'
              const areas = [...new Set(todayShifts.map(s =>
                s.coverage_area?.name || (onCallOps.coverageAreas?.value || []).find(a => a.id === s.coverage_area_id)?.name
              ).filter(Boolean))]
              return areas.length
                ? `Tonight: ${areas.slice(0,3).join(', ')}${areas.length > 3 ? ` +${areas.length - 3}` : ''}`
                : `${todayShifts.length} shift${todayShifts.length !== 1 ? 's' : ''} scheduled today`
            }
            // ── Rotations ──────────────────────────────────────────────────
            if (v === 'resident_rotations') {
              const rots = rotations.value || []
              const active = rots.filter(r => r.rotation_status === 'active').length
              const endingSoon = rots.filter(r => r.rotation_status === 'active' && getDaysRemaining(r.end_date) >= 0 && getDaysRemaining(r.end_date) <= 7).length
              if (!active) return 'No active rotations'
              const end = endingSoon ? ` · ${endingSoon} ending this week` : ''
              return `${active} active${end}`
            }
            // ── Training Units ─────────────────────────────────────────────
            if (v === 'training_units') {
              const units = trainingUnits.value || []
              const active = units.filter(u => u.unit_status === 'active').length
              const withSlots = units.filter(u => {
                const cur = (rotations.value || []).filter(r => r.training_unit_id === u.id && r.rotation_status === 'active').length
                return u.unit_status === 'active' && cur < (u.maximum_residents || 999)
              }).length
              if (!active) return 'No active units'
              return `${active} unit${active !== 1 ? 's' : ''} · ${withSlots} with open slot${withSlots !== 1 ? 's' : ''}`
            }
            // ── Staff Absence ──────────────────────────────────────────────
            if (v === 'staff_absence') {
              const kpis = absenceOps.absenceKPIs?.value
              if (!kpis) return 'Loading…'
              if (kpis.absentNow === 0 && kpis.upcoming === 0) return 'All staff present · No planned leave'
              const parts = []
              if (kpis.absentNow > 0) parts.push(`${kpis.absentNow} absent today`)
              if (kpis.noCoverage > 0) parts.push(`${kpis.noCoverage} need cover`)
              else if (kpis.upcoming > 0) parts.push(`${kpis.upcoming} planned`)
              return parts.join(' · ')
            }
            // ── Research ──────────────────────────────────────────────────
            if (['research_hub','research_lines','clinical_trials','innovation_projects','analytics_dashboard','analytics_performance','analytics_partners'].includes(v)) {
              const lines = researchOps.researchLines?.value?.length || 0
              const trials = researchOps.clinicalTrials?.value?.filter(t => ['Reclutando','Activo'].includes(t.status)).length || 0
              const projects = researchOps.innovationProjects?.value?.length || 0
              if (!lines && !trials) return 'No research data loaded yet'
              return `${lines} line${lines !== 1 ? 's' : ''} · ${trials} active stud${trials !== 1 ? 'ies' : 'y'} · ${projects} project${projects !== 1 ? 's' : ''}`
            }
            // ── News ──────────────────────────────────────────────────────
            if (v === 'news') {
              const posts = newsOps.newsPosts?.value || []
              const published = posts.filter(p => p.status === 'published').length
              const drafts = posts.filter(p => p.status === 'draft').length
              if (!posts.length) return 'No posts yet'
              return `${published} published${drafts ? ` · ${drafts} draft${drafts !== 1 ? 's' : ''}` : ''}`
            }
            // ── Dashboard ─────────────────────────────────────────────────
            if (v === 'dashboard') {
              const hour = new Date().getHours()
              const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
              const name = currentUser.value?.full_name?.split(' ')[0] || ''
              return name ? `${greeting}, ${name}` : greeting
            }
          } catch { /* fallback below */ }
          return ''
        }
        const getSearchPlaceholder = () => 'Search...'

        const getStaffTypeIcon = (t) => ({ attending_physician: 'fa-user-md', medical_resident: 'fa-user-graduate', fellow: 'fa-user-tie', nurse_practitioner: 'fa-user-nurse' }[t] || 'fa-user')
        // ── Unified avatar helpers ────────────────────────────────────────────
        const nmAv = (name, staffType, size = 'md') => Utils.avatarClass(staffType || '', name || '', size)
        const nmAvI = (name) => Utils.getInitials(name || '')
        const getAbsenceReasonIcon = (r) => ({ vacation: 'fa-umbrella-beach', sick_leave: 'fa-procedures', conference: 'fa-chalkboard-teacher', training: 'fa-graduation-cap', personal: 'fa-user-clock', other: 'fa-question-circle' }[r] || 'fa-clock')
        const calculateCapacityPercent = (cur, max) => (!cur || !max) ? 0 : Math.round((cur / max) * 100)
        const getPreviewCardClass = () => absenceOps.absenceModal.form.absence_type === 'planned' ? 'planned' : 'unplanned'
        const getPreviewIcon = () => ({ vacation: 'fas fa-umbrella-beach', conference: 'fas fa-chalkboard-teacher', sick_leave: 'fas fa-heartbeat', training: 'fas fa-graduation-cap', personal: 'fas fa-home', other: 'fas fa-ellipsis-h' }[absenceOps.absenceModal.form.absence_reason] || 'fas fa-clock')
        const getPreviewReasonText = () => formatAbsenceReason(absenceOps.absenceModal.form.absence_reason)
        const getPreviewStatusClass = () => absenceOps.absenceModal.form.absence_type === 'planned' ? 'status-planned' : 'status-unplanned'
        const getPreviewStatusText = () => absenceOps.absenceModal.form.absence_type === 'planned' ? 'Planned' : 'Unplanned'
        const updatePreview = () => { }
        const requestFullDossier = () => showToast('Info', 'Dossier request sent. Our team will contact you.', 'info')

        // All clinical staff eligible for on-call (attendings, fellows, NPs, and residents)
        // Dynamic: uses staffTypeMap flags instead of hardcoded type key lists
        // Falls back to legacy keys so nothing breaks if staffTypeMap isn't loaded yet

        const availableResidents = computed(() => {
          // Use isResidentType() which handles both staffTypeMap lookup AND fallback
          const residents = medicalStaff.value.filter(s =>
            s.employment_status === 'active' && isResidentType(s.staff_type)
          )
          // Sort: free residents first, currently rotating last
          const activeRotatingIds = new Set(
            rotations.value
              .filter(r => r.rotation_status === 'active')
              .map(r => r.resident_id)
          )
          return residents.sort((a, b) => {
            const aRot = activeRotatingIds.has(a.id) ? 1 : 0
            const bRot = activeRotatingIds.has(b.id) ? 1 : 0
            return aRot - bRot
          })
        })
        const availableAttendings = computed(() => medicalStaff.value.filter(s =>
          s.employment_status === 'active' && s.staff_type &&
          (staffTypeMap.value[s.staff_type] != null
            ? staffTypeMap.value[s.staff_type].can_supervise
            : s.staff_type === 'attending_physician')
        ))
        const availableHeadsOfDepartment = computed(() => availableAttendings.value)
        const availableReplacementStaff = computed(() => medicalStaff.value.filter(s => s.employment_status === 'active'))

        const showUserProfileModal = () => {
          // Real link from the backend (app_users.medical_staff_id),
          // not a runtime email/name guess — see B-something fix below.
          const linkedStaff = currentUser.value?.linked_staff || null
          userProfileModal.form = {
            full_name: currentUser.value?.full_name || '',
            email: currentUser.value?.email || '',
            department_id: currentUser.value?.department_id || '',
            linked_staff_id: linkedStaff?.id || null
          }
          userProfileModal.show = true; userMenuOpen.value = false
        }

        const saveUserProfile = async () => {
          saving.value = true
          try {
            // Update display name in app_users
            if (currentUser.value) {
              currentUser.value.full_name = userProfileModal.form.full_name
              currentUser.value.department_id = userProfileModal.form.department_id
            }
            localStorage.setItem(CONFIG.USER_KEY, JSON.stringify(currentUser.value))
            // If this user has a linked staff record, open it for full profile editing
            if (userProfileModal.form.linked_staff_id) {
              const staffRecord = medicalStaff.value.find(s => s.id === userProfileModal.form.linked_staff_id)
              if (staffRecord) {
                userProfileModal.show = false
                viewStaffDetails(staffRecord)
                showToast('Profile', 'Edit your full clinical profile below', 'info')
                return
              }
            }
            userProfileModal.show = false; showToast('Success', 'Profile updated', 'success')
          }
          catch (e) { showToast('Error', e?.message || 'An unexpected error occurred', 'error') }
          finally { saving.value = false }
        }

        const handleLogin = async () => {
          loginFieldErrors.email = !loginForm.email ? 'Email required' : ''
          loginFieldErrors.password = !loginForm.password ? 'Password required' : ''
          if (loginFieldErrors.email || loginFieldErrors.password) { loginError.value = 'Please fill all required fields'; return }
          loginLoading.value = true; loginError.value = ''
          try {
            const response = await API.login(loginForm.email, loginForm.password)
            currentUser.value = response.user; localStorage.setItem(CONFIG.USER_KEY, JSON.stringify(response.user))
            showToast('Success', `Welcome, ${response.user.full_name}!`, 'success')
            // FIX: set currentView BEFORE loadAllData — currentUser already triggers the
            // app-layout (v-else on !currentUser), so leaving currentView at 'login' here
            // meant the dashboard had no matching v-if branch and rendered blank with the
            // breadcrumb falling back to 'neumDesk' until loadAllData fully resolved.
            currentView.value = 'dashboard'
            await loadAllData()
          } catch (e) { loginError.value = e.message || 'Invalid email or password'; showToast('Error', 'Login failed', 'error') }
          finally { loginLoading.value = false }
        }

        const handleLogout = () => showConfirmation({
          title: 'Logout', message: 'Are you sure you want to logout?',
          icon: 'fa-sign-out-alt', confirmButtonText: 'Logout', confirmButtonClass: 'btn-danger',
          onConfirm: async () => {
            try { await API.logout() } finally { currentUser.value = null; currentView.value = 'login'; userMenuOpen.value = false; showToast('Info', 'Logged out successfully', 'info') }
          }
        })

        // switchView(view, filters) — supports cross-navigation with pre-applied filters
        // filters example: { department: deptId, category: 'external_resident' }
        const switchView = async (view, filters = {}) => {
          currentView.value = view; ui.mobileMenuOpen.value = false
          // Apply pre-filters if provided (cross-view navigation)
          if (filters.department) {
            if (staffFilters && staffFilters.department !== undefined) staffFilters.department = filters.department
            if (trainingUnitFilters && trainingUnitFilters.department !== undefined) trainingUnitFilters.department = filters.department
          }
          if (filters.residentCategory && staffFilters) { staffFilters.staffType = 'medical_resident'; staffFilters.residentCategory = filters.residentCategory }
          if (filters.status && staffFilters) staffFilters.status = filters.status
          if (filters.staffType && staffFilters) staffFilters.staffType = filters.staffType
          if (filters.rotationStatus && rotationFilters) rotationFilters.status = filters.rotationStatus
          if (filters.trainingUnit && rotationFilters) rotationFilters.trainingUnit = filters.trainingUnit
          ui.searchResultsOpen.value = false
          if (pagination[view]) pagination[view].page = 1
          // Trigger entrance animation on content area
          const ca = document.querySelector('.content-area')
          if (ca) { ca.classList.remove('content-view-enter'); void ca.offsetWidth; ca.classList.add('content-view-enter') }
          if (view === 'news') {
            currentView.value = 'news'
            // FIX Bug4: use newsLoaded flag, not length — empty result shouldn't trigger refetch
            if (!newsLoaded.value && !newsLoading.value) loadNews()
            return
          }
          if (view === 'communications') {
            currentView.value = 'communications'
            commsOps.loadAnnouncements()
            commsOps.loadOpsMetrics()
            return
          }
          if (view === 'system_settings') {
            currentView.value = 'system_settings'
            if (!staffTypesList.value.length) loadStaffTypes(true)
            if (!rotationServices.value.length) loadRotationServices()
            if (!onCallOps.coverageAreas.value.length) onCallOps.loadCoverageAreas()
            if (isAdmin() && !permMgmt.users.length && !permMgmt.loading) loadPermissionUsers()
            return
          }
          if (view === 'research_hub') {
            // Direct navigation — always reset to overview
            researchOps.researchHubPage.value = 'overview'
            if (!analyticsOps.researchHubTab.value) analyticsOps.researchHubTab.value = 'lines'
            currentView.value = 'research_hub'
            if (!researchOps.researchLines.value.length && !researchOps.researchLoading.value) {
              researchOps.loadAllResearch()
            }
            return
          } else if (view === 'research_lines') {
            analyticsOps.researchHubTab.value = 'lines'
            currentView.value = 'research_hub'
            if (filters.line) researchOps.trialFilters.line = filters.line
            if (!researchOps.researchLines.value.length && !researchOps.researchLoading.value) {
              researchOps.loadAllResearch()
            }
            return
          } else if (view === 'clinical_trials') {
            analyticsOps.researchHubTab.value = 'trials'
            currentView.value = 'research_hub'
            if (filters.line) researchOps.trialFilters.line = filters.line
            if (!researchOps.clinicalTrials.value.length && !researchOps.researchLoading.value) {
              researchOps.loadAllResearch()
            }
            return
          } else if (view === 'innovation_projects') {
            analyticsOps.researchHubTab.value = 'projects'
            currentView.value = 'research_hub'
            if (!researchOps.innovationProjects.value.length && !researchOps.researchLoading.value) {
              researchOps.loadAllResearch()
            }
            return
          }
        }

        const toggleStatsSidebar = () => { ui.statsSidebarOpen.value = !ui.statsSidebarOpen.value }

        // Research Hub drill-down helpers — need access to both analyticsOps and researchOps
        const drillToTrials = (lineId) => {
          if (lineId) researchOps.trialFilters.line = lineId
          analyticsOps.researchHubTab.value = 'trials'
          analyticsOps.researchDetailPanel.value = false
          currentView.value = 'research_hub'
        }
        const drillToProjects = (lineId) => {
          if (lineId) researchOps.projectFilters.research_line_id = lineId
          analyticsOps.researchHubTab.value = 'projects'
          analyticsOps.researchDetailPanel.value = false
          currentView.value = 'research_hub'
        }
        const handleGlobalSearch = () => {
          if (!ui.globalSearchQuery.value.trim()) { ui.searchResultsOpen.value = false; return }
          ui.searchResultsOpen.value = true
        }

        const globalSearchResults = Vue.computed(() => {
          const q = (ui.globalSearchQuery.value || '').toLowerCase().trim()
          if (!q || q.length < 2) return {}
          const results = {}
          const close = () => { ui.searchResultsOpen.value = false; ui.globalSearchQuery.value = '' }

          // ── Staff ──────────────────────────────────────────────────────
          const staff = (staffOps.medicalStaff.value || []).filter(s =>
            (s.full_name || '').toLowerCase().includes(q) ||
            (s.professional_email || '').toLowerCase().includes(q) ||
            (s.staff_id || '').toLowerCase().includes(q)
          ).slice(0, 4)
          if (staff.length) results.staff = staff.map(s => ({
            id: s.id, name: s.full_name,
            meta: rotationOps.formatStaffType ? rotationOps.formatStaffType(s.staff_type) : s.staff_type,
            icon: 'fa-user-md', action: () => { viewStaffDetails(s); close() }
          }))

          // ── Rotations ──────────────────────────────────────────────────
          const rots = (rotationOps.rotations.value || []).filter(r => {
            const rn = (staffOps.medicalStaff.value || []).find(s => s.id === r.resident_id)
            const un = (trainingUnits.value || []).find(u => u.id === r.training_unit_id)
            return (rn && (rn.full_name || '').toLowerCase().includes(q)) ||
                   (un && (un.unit_name || '').toLowerCase().includes(q))
          }).slice(0, 3)
          if (rots.length) results.rotations = rots.map(r => {
            const rn = (staffOps.medicalStaff.value || []).find(s => s.id === r.resident_id)
            const un = (trainingUnits.value || []).find(u => u.id === r.training_unit_id)
            return { id: r.id, name: rn ? rn.full_name : 'Resident',
              meta: `${un?.unit_name || 'Rotation'} · ${r.rotation_status}`,
              icon: 'fa-calendar-check', action: () => { switchView('resident_rotations'); close() } }
          })

          // ── On-call shifts ─────────────────────────────────────────────
          const today = Utils.normalizeDate(new Date())
          const oncall = (onCallOps.onCallSchedule?.value || []).filter(s => {
            const d = Utils.normalizeDate(s.duty_date)
            if (d < today) return false
            const pName = (staffOps.medicalStaff.value || []).find(x => x.id === s.primary_physician_id)?.full_name || ''
            const aName = s.coverage_area?.name || (onCallOps.coverageAreas?.value || []).find(a => a.id === s.coverage_area_id)?.name || ''
            return pName.toLowerCase().includes(q) || aName.toLowerCase().includes(q)
          }).slice(0, 3)
          if (oncall.length) results.oncall = oncall.map(s => {
            const pName = (staffOps.medicalStaff.value || []).find(x => x.id === s.primary_physician_id)?.full_name || '—'
            const aName = s.coverage_area?.name || (onCallOps.coverageAreas?.value || []).find(a => a.id === s.coverage_area_id)?.name || ''
            return { id: s.id, name: pName,
              meta: `On-call · ${aName || 'No area'} · ${Utils.normalizeDate(s.duty_date)}`,
              icon: 'fa-phone', action: () => { switchView('oncall_schedule'); close() } }
          })

          // ── Absences ───────────────────────────────────────────────────
          const abs = (absenceOps.absences?.value || []).filter(a => {
            if (['cancelled','returned_to_duty'].includes(a.current_status)) return false
            const sName = (staffOps.medicalStaff.value || []).find(x => x.id === a.staff_member_id)?.full_name || ''
            return sName.toLowerCase().includes(q)
          }).slice(0, 3)
          if (abs.length) results.absences = abs.map(a => {
            const sName = (staffOps.medicalStaff.value || []).find(x => x.id === a.staff_member_id)?.full_name || '—'
            const reason = a.absence_reason?.replace(/_/g, ' ') || 'Absence'
            return { id: a.id, name: sName,
              meta: `${reason} · ${Utils.normalizeDate(a.start_date)} → ${Utils.normalizeDate(a.end_date || a.start_date)}`,
              icon: 'fa-user-clock', action: () => { switchView('staff_absence'); close() } }
          })

          // ── Coverage areas ─────────────────────────────────────────────
          const areas = (onCallOps.coverageAreas?.value || []).filter(a =>
            (a.name || '').toLowerCase().includes(q) || (a.code || '').toLowerCase().includes(q)
          ).slice(0, 2)
          if (areas.length) results.areas = areas.map(a => ({
            id: a.id, name: a.name,
            meta: `Coverage area · ${a.code}${a.requires_coverage ? ' · Required' : ''}`,
            icon: 'fa-map-marker-alt', action: () => { switchView('oncall_schedule'); close() }
          }))

          // ── Training units ─────────────────────────────────────────────
          const units = (trainingUnits.value || []).filter(u =>
            (u.unit_name || '').toLowerCase().includes(q) ||
            (u.unit_code || '').toLowerCase().includes(q)
          ).slice(0, 2)
          if (units.length) results.units = units.map(u => ({
            id: u.id, name: u.unit_name,
            meta: `Training unit · ${u.unit_status}`,
            icon: 'fa-hospital', action: () => { switchView('training_units'); close() }
          }))

          // ── Research ───────────────────────────────────────────────────
          const lines = (researchOps.researchLines.value || []).filter(l =>
            (l.research_line_name || l.name || '').toLowerCase().includes(q) ||
            (l.description || '').toLowerCase().includes(q)
          ).slice(0, 2)
          if (lines.length) results.research = lines.map(l => ({
            id: l.id, name: l.research_line_name || l.name,
            meta: 'Research line', icon: 'fa-flask',
            action: () => { switchView('research_lines'); close() }
          }))

          return results
        })

        const clearSearch = () => { ui.globalSearchQuery.value = ''; ui.searchResultsOpen.value = false }
        // BUG FIX: this used to be an inline template expression calling
        // window.setTimeout(...) directly. Vue's template compiler doesn't
        // treat 'window' as a safe bare global inside expressions, so it
        // compiled to _ctx.window.setTimeout(...) — and since the component
        // has no 'window' property, that's undefined.setTimeout(...), which
        // threw on every blur of the search input. Moving it into a real
        // function avoids the whole class of problem.
        const closeSearchOnBlur = () => { setTimeout(() => { ui.searchResultsOpen.value = false }, 200) }

        // ── Academic Degrees Management ────────────────────────────────────────
        const academicDegreeModal = reactive({
          show: false, mode: 'add',
          form: { id: null, name: '', abbreviation: '', display_order: 0, is_active: true }
        })
        const openAddAcademicDegree = () => {
          Object.assign(academicDegreeModal.form, { id: null, name: '', abbreviation: '', display_order: (academicDegrees.value.length + 1) * 10, is_active: true })
          academicDegreeModal.mode = 'add'
          academicDegreeModal.show = true
        }
        const openEditAcademicDegree = (deg) => {
          Object.assign(academicDegreeModal.form, { id: deg.id, name: deg.name, abbreviation: deg.abbreviation || '', display_order: deg.display_order || 0, is_active: deg.is_active !== false })
          academicDegreeModal.mode = 'edit'
          academicDegreeModal.show = true
        }
        const saveAcademicDegree = async () => {
          const f = academicDegreeModal.form
          if (!f.name?.trim()) { showToast('Validation', 'Degree name is required', 'warn'); return }
          try {
            if (academicDegreeModal.mode === 'add') {
              const created = await API.createAcademicDegree({ name: f.name.trim(), abbreviation: f.abbreviation?.trim() || null, display_order: f.display_order, is_active: f.is_active })
              academicDegrees.value.push(created)
              showToast('Success', 'Academic degree added', 'success')
            } else {
              const updated = await API.updateAcademicDegree(f.id, { name: f.name.trim(), abbreviation: f.abbreviation?.trim() || null, display_order: f.display_order, is_active: f.is_active })
              const idx = academicDegrees.value.findIndex(d => d.id === f.id)
              if (idx !== -1) academicDegrees.value[idx] = updated
              showToast('Success', 'Academic degree updated', 'success')
            }
            academicDegreeModal.show = false
            await loadAcademicDegrees()
          } catch (e) { showToast('Error', e?.message || 'Failed to save degree', 'error') }
        }
        const deleteAcademicDegree = (deg) => {
          showConfirmation({
            title: 'Delete Degree', message: `Delete "${deg.name}"? This cannot be undone.`,
            confirmText: 'Delete', confirmButtonClass: 'btn-danger',
            onConfirm: async () => {
              try {
                await API.deleteAcademicDegree(deg.id)
                academicDegrees.value = academicDegrees.value.filter(d => d.id !== deg.id)
                showToast('Success', 'Degree deleted', 'success')
              } catch (e) { showToast('Error', e?.message || 'Failed to delete', 'error') }
            }
          })
        }

        // ── Staff Types Management ─────────────────────────────────────────────
        // Loads dynamic staff types from DB and builds the reactive lookup map
        // ── Rotation Services ────────────────────────────────────────────
        const rotationServicesLoading = ref(false)
        const rotationServiceModal = reactive({
          show: false, mode: 'add',
          form: { name: '', service_type: 'rotation_service', contact_name: '', contact_email: '', contact_phone: '' }
        })

        const loadRotationServices = async () => {
          rotationServicesLoading.value = true
          try { rotationServices.value = await API.getRotationServices() }
          catch { console.error('Failed to load rotation services') }
          finally { rotationServicesLoading.value = false }
        }

        const openAddRotationService = () => {
          rotationServiceModal.mode = 'add'
          Object.assign(rotationServiceModal.form, { name: '', service_type: 'rotation_service', contact_name: '', contact_email: '', contact_phone: '' })
          rotationServiceModal.show = true
        }

        const openEditRotationService = (svc) => {
          rotationServiceModal.mode = 'edit'
          Object.assign(rotationServiceModal.form, { id: svc.id, name: svc.name, service_type: svc.service_type, contact_name: svc.contact_name || '', contact_email: svc.contact_email || '', contact_phone: svc.contact_phone || '' })
          rotationServiceModal.show = true
        }

        const saveRotationService = async () => {
          const f = rotationServiceModal.form
          if (!f.name?.trim()) { showToast('Validation', 'Service name is required', 'warn'); return }
          try {
            if (rotationServiceModal.mode === 'add') {
              await API.createRotationService(f)
              showToast('Success', 'Rotation service added', 'success')
            } else {
              await API.updateRotationService(f.id, f)
              showToast('Success', 'Rotation service updated', 'success')
            }
            rotationServiceModal.show = false
            await loadRotationServices()
          } catch (e) { showToast('Error', e?.message || 'Failed to save', 'error') }
        }

        const deleteRotationService = async (svc) => {
          showConfirmation({
            title: 'Remove Rotation Service',
            message: `Remove "${svc.name}" from the rotation services list?`,
            icon: 'fa-trash', confirmButtonText: 'Remove', confirmButtonClass: 'btn-danger',
            details: 'If residents are linked to this service, it will be deactivated instead of deleted.',
            onConfirm: async () => {
              try {
                await API.deleteRotationService(svc.id)
                await loadRotationServices()
                showToast('Done', 'Rotation service removed', 'success')
              } catch (e) { showToast('Error', e?.message || 'Failed to remove', 'error') }
            }
          })
        }

        const staffTypesLoading = ref(false) // FIX Bug6: dedicated loading flag for Settings skeleton
        const loadStaffTypes = async (includeInactive = false) => {
          staffTypesLoading.value = true
          try {
            const raw = await API.getStaffTypes(includeInactive)
            staffTypesList.value = raw
            // Build the fast-lookup map: { type_key → { display_name, badge_class, is_resident_type, can_supervise } }
            const map = {}
            raw.forEach(t => { map[t.type_key] = t })
            staffTypeMap.value = map
          } catch { console.error('Failed to load staff types') }
          finally { staffTypesLoading.value = false }
        }

        // ── Academic Degrees ────────────────────────────────────────────────
        const ACADEMIC_DEGREES_FALLBACK = [
          { id: 'LMed',     name: 'Licenciado en Medicina',                abbreviation: 'LMed'     },
          { id: 'GMed',     name: 'Grado en Medicina',                     abbreviation: 'GMed'     },
          { id: 'MIR',      name: 'Médico Interno Residente',              abbreviation: 'MIR'      },
          { id: 'PhD',      name: 'Doctor en Medicina (PhD)',              abbreviation: 'PhD'      },
          { id: 'MU',       name: 'Máster Universitario',                  abbreviation: 'MU'       },
          { id: 'EspNeum',  name: 'Especialista en Neumología',            abbreviation: 'Esp-Neum' },
          { id: 'DUE',      name: 'Diplomado Universitario en Enfermería', abbreviation: 'DUE'      },
          { id: 'GEnf',     name: 'Grado en Enfermería',                   abbreviation: 'GEnf'     },
          { id: 'TSID',     name: 'Técnico Superior Imagen Diagnóstica',   abbreviation: 'TSID'     },
          { id: 'LFarm',    name: 'Licenciado en Farmacia',                abbreviation: 'LFarm'    },
        ]

        const loadAcademicDegrees = async () => {
          try {
            const data = await API.getAcademicDegrees()
            const sorted = (data.length ? data : ACADEMIC_DEGREES_FALLBACK)
              .slice().sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
            academicDegrees.value = sorted
          } catch {
            academicDegrees.value = ACADEMIC_DEGREES_FALLBACK
          }
        }

        // Staff Types manager modal (lives in System Settings)
        const staffTypeModal = reactive({
          show: false, mode: 'add',
          form: { type_key: '', display_name: '', badge_class: 'badge-secondary', is_resident_type: false, can_supervise: false, display_order: 0 },
          saving: false, deleting: false
        })
        const openAddStaffType = () => {
          Object.assign(staffTypeModal.form, { type_key: '', display_name: '', badge_class: 'badge-secondary', is_resident_type: false, can_supervise: false, display_order: staffTypesList.value.length * 10 })
          staffTypeModal.mode = 'add'
          staffTypeModal.show = true
        }
        const openEditStaffType = (t) => {
          Object.assign(staffTypeModal.form, { ...t })
          staffTypeModal.mode = 'edit'
          staffTypeModal.show = true
        }
        const saveStaffType = async () => {
          if (!staffTypeModal.form.display_name?.trim()) { showToast('Validation', 'Display name is required', 'error'); return }
          if (staffTypeModal.mode === 'add' && !staffTypeModal.form.type_key?.trim()) { showToast('Validation', 'Type key is required', 'error'); return }
          staffTypeModal.saving = true
          try {
            if (staffTypeModal.mode === 'add') {
              await API.createStaffType(staffTypeModal.form)
              showToast('Success', `Staff type "${staffTypeModal.form.display_name}" created`, 'success')
            } else {
              await API.updateStaffType(staffTypeModal.form.id, staffTypeModal.form)
              showToast('Success', `Staff type updated`, 'success')
            }
            await loadStaffTypes(true)
            staffTypeModal.show = false
          } catch (e) { showToast('Error', e.message || 'Failed to save staff type', 'error') }
          finally { staffTypeModal.saving = false }
        }
        const deleteStaffType = async (t) => {
          showConfirmation({
            title: 'Remove Staff Type',
            message: `Remove "${t.display_name}"? If staff members use this type it will be deactivated rather than deleted.`,
            icon: 'fa-trash', confirmButtonText: 'Remove', confirmButtonClass: 'btn-danger',
            onConfirm: async () => {
              try {
                const res = await API.deleteStaffType(t.id)
                showToast('Success', res?.message || 'Staff type removed', 'success')
                await loadStaffTypes(true)
              } catch (e) { showToast('Error', e.message || 'Failed to remove staff type', 'error') }
            }
          })
        }
        const toggleStaffTypeActive = async (t) => {
          try {
            await API.updateStaffType(t.id, { is_active: !t.is_active })
            showToast('Success', `Staff type ${t.is_active ? 'deactivated' : 'activated'}`, 'success')
            await loadStaffTypes(true)
          } catch (e) { showToast('Error', 'Failed to update staff type', 'error') }
        }

        const warmBackend = async () => {
          // Fire a lightweight ping to wake Railway from sleep before the real requests hit.
          // /health requires no auth and returns immediately once the container is warm.
          // We don't await the result — just send and move on. By the time the main
          // requests arrive the container will already be processing.
          try { fetch(`${CONFIG.API_BASE_URL}/health`).catch(() => {}) } catch {}
        }

        // ── Core system settings ────────────────────────────────────────────
        const activeSvcId = ref(null)
        const systemSettings = reactive({
          hospital_name: 'neumDesk Hospital',
          max_residents_per_unit: 10,
          default_rotation_duration: 12,
          enable_audit_logging: true,
          notifications_enabled: true,
          absence_notifications: true,
          maintenance_mode: false
        })
        const loadSystemSettings = async () => {
          try {
            const data = await API.request('/api/settings')
            if (data && typeof data === 'object') Object.assign(systemSettings, data)
          } catch { /* silently use defaults */ }
        }
        const saveSystemSettings = async () => {
          try {
            await API.request('/api/settings', { method: 'PUT', body: { ...systemSettings } })
            showToast('Saved', 'System settings updated', 'success')
          } catch (e) { showToast('Error', e?.message || 'Failed to save settings', 'error') }
        }

        // Maintenance Mode locks out every non-admin user system-wide — unlike the
        // other toggles on this page, it needs its own confirmation and it needs to
        // save immediately, not wait for the generic "Save Settings" button. Turning
        // it back off never needs confirmation (that's always the safe direction).
        const confirmMaintenanceModeToggle = (event) => {
          const turningOn = event.target.checked
          event.target.checked = systemSettings.maintenance_mode // revert visual state; reactive value below is the source of truth
          if (!turningOn) { systemSettings.maintenance_mode = false; saveSystemSettings(); return }
          showConfirmation({
            title: 'Enable Maintenance Mode',
            message: 'This blocks all non-admin access to the API immediately, for everyone, system-wide.',
            details: 'You will still have access. Everyone else will see a maintenance notice until you turn this back off.',
            icon: 'fa-exclamation-triangle', confirmButtonText: 'Enable Maintenance Mode', confirmButtonClass: 'btn-danger',
            onConfirm: () => { systemSettings.maintenance_mode = true; saveSystemSettings() }
          })
        }

        const getUnitFillColor = (unit, rotations) => {
        const cur = (rotations?.value || rotations || []).filter(r => r.training_unit_id === unit.id && r.rotation_status === 'active').length
        const max = unit.maximum_residents || 1
        const pct = cur / max
        return pct >= 1 ? '#e24b4a' : pct >= 0.75 ? '#ef9f27' : cur === 0 ? 'var(--nm-surface3)' : '#10b981'
      }

      // ══════════════════════════════════════════════════════════════
      // PERMISSIONS MANAGEMENT — admin UI for granting per-user tags
      // ══════════════════════════════════════════════════════════════
      const permMgmt = reactive({
        users: [],       // all app_users with their permissions arrays
        loading: false,
        saving: null,    // userId:module being saved right now
        error: null,
        moduleFilter: '' // '' = show everyone; a module key = only show users with any access to it
      })

      // Sorted/grouped view of permMgmt.users — admins first (already the
      // people most worth checking), then everyone else ordered by how
      // many modules they can access, most to least. Within the filtered
      // view, "who can edit X" reads naturally top to bottom.
      const sortedPermUsers = computed(() => {
        let users = permMgmt.users
        if (permMgmt.moduleFilter) {
          users = users.filter(u => {
            const p = getUserPerm(u, permMgmt.moduleFilter)
            return p && (p.can_read || p.can_write)
          })
        }
        return [...users].sort((a, b) => {
          const aAdmin = a.admin_level >= 1 ? 1 : 0
          const bAdmin = b.admin_level >= 1 ? 1 : 0
          if (aAdmin !== bAdmin) return bAdmin - aAdmin
          const aCount = (a.permissions || []).filter(p => p.can_read || p.can_write).length
          const bCount = (b.permissions || []).filter(p => p.can_read || p.can_write).length
          if (aCount !== bCount) return bCount - aCount
          return (a.full_name || '').localeCompare(b.full_name || '')
        })
      })

      const ALL_MODULES = [
        { key: 'medical_staff',        label: 'Medical Staff',      icon: '👤' },
        { key: 'oncall_schedule',       label: 'On-call Schedule',   icon: '📞' },
        { key: 'resident_rotations',    label: 'Rotations',          icon: '🔄' },
        { key: 'training_units',        label: 'Training Units',     icon: '🏥' },
        { key: 'staff_absence',         label: 'Absences',           icon: '📅' },
        { key: 'communications',        label: 'Communications',     icon: '📢' },
        { key: 'research_lines',        label: 'Research Lines',     icon: '🔬' },
        { key: 'clinical_trials',       label: 'Clinical Trials',    icon: '⚗️' },
        { key: 'innovation_projects',   label: 'Innovation',         icon: '💡' },
        { key: 'analytics',             label: 'Analytics',          icon: '📊' },
        { key: 'news_posts',            label: 'Publications',       icon: '📰' },
        { key: 'system_settings',       label: 'Settings',           icon: '⚙️' },
        { key: 'user_management',       label: 'User Management',    icon: '🔐' },
      ]

      const loadPermissionUsers = async () => {
        permMgmt.loading = true
        permMgmt.error = null
        try {
          const data = await API.request('/api/permissions/users')
          permMgmt.users = data?.data || []
        } catch (e) {
          permMgmt.error = 'Could not load users'
          console.error('[neumDesk] loadPermissionUsers failed:', e)
        } finally {
          permMgmt.loading = false
        }
      }

      const getUserPerm = (user, moduleKey) => {
        return user.permissions?.find(p => p.module === moduleKey) || null
      }

      // Cycle through permission states: none → read → read+write → none
      const cyclePermission = async (user, moduleKey) => {
        const key = user.id + ':' + moduleKey
        const current = getUserPerm(user, moduleKey)
        // The cycle is none -> read -> read+write -> none. Revoking happens
        // on the read+write -> none step. Block that specific transition
        // when it's the admin's own row, so they can't lock themselves out.
        const aboutToRevoke = current && current.can_read && current.can_write
        if (aboutToRevoke && user.id === currentUser.value?.id) {
          showToast('Not allowed', `You can't revoke your own access to ${moduleKey}. Ask another admin if you need this changed.`, 'error')
          return
        }
        permMgmt.saving = key
        try {
          let can_read = false, can_write = false
          if (!current || (!current.can_read && !current.can_write)) {
            can_read = true; can_write = false   // none → read
          } else if (current.can_read && !current.can_write) {
            can_read = true; can_write = true    // read → read+write
          } else {
            can_read = false; can_write = false  // read+write → none (revoke)
          }
          await API.request(`/api/permissions/${user.id}/${moduleKey}`, {
            method: 'PUT',
            body: { can_read, can_write }
          })
          // Update local state immediately — no full reload needed
          if (!user.permissions) user.permissions = []
          const idx = user.permissions.findIndex(p => p.module === moduleKey)
          if (!can_read && !can_write) {
            if (idx >= 0) user.permissions.splice(idx, 1)
          } else {
            const updated = { module: moduleKey, can_read, can_write }
            if (idx >= 0) Object.assign(user.permissions[idx], updated)
            else user.permissions.push(updated)
          }
        } catch (e) {
          showToast('Error', `Could not update ${moduleKey} permission`, 'error')
          console.error('[neumDesk] cyclePermission failed:', e)
        } finally {
          permMgmt.saving = null
        }
      }

      // ── Link user ↔ clinical staff profile ────────────────────────────
      const linkStaffModal = reactive({ show: false, user: null, userName: '', query: '' })

      const openLinkStaff = (user) => {
        linkStaffModal.user = user
        linkStaffModal.userName = user.full_name || 'this user'
        linkStaffModal.query = ''
        linkStaffModal.show = true
      }

      const linkStaffCandidates = Vue.computed(() => {
        const q = (linkStaffModal.query || '').toLowerCase().trim()
        // Staff already linked to other users shouldn't double-link
        const taken = new Set(permMgmt.users.filter(u => u.linked_staff && u.id !== linkStaffModal.user?.id).map(u => u.linked_staff.id))
        let list = (medicalStaff?.value || []).filter(s => !taken.has(s.id))
        if (q) list = list.filter(s => (s.full_name || '').toLowerCase().includes(q))
        return list.slice(0, 30)
      })

      const confirmLinkStaff = async (staff) => {
        const user = linkStaffModal.user
        if (!user || !staff) return
        try {
          await API.request(`/api/users/${user.id}/link-staff`, {
            method: 'PUT',
            body: { staff_id: staff.id }
          })
          // optimistic local update
          user.linked_staff = { id: staff.id, full_name: staff.full_name }
          linkStaffModal.show = false
          showToast('Profile linked', `${user.full_name} is now linked to ${staff.full_name}.`, 'success')
        } catch (e) {
          showToast('Link failed', e.message || 'Could not link the clinical profile. The server may not support this yet.', 'error')
          console.error('[neumDesk] confirmLinkStaff failed:', e)
        }
      }

      const unlinkUserStaff = async (user) => {
        if (!user) return
        showConfirmation({
          title: 'Unlink clinical profile',
          message: `Remove the link between ${user.full_name} and ${user.linked_staff?.full_name || 'their staff profile'}?`,
          confirmButtonText: 'Unlink',
          confirmButtonClass: 'btn-danger',
          onConfirm: async () => {
            try {
              await API.request(`/api/users/${user.id}/link-staff`, { method: 'PUT', body: { staff_id: null } })
              user.linked_staff = null
              showToast('Profile unlinked', `${user.full_name} is no longer linked to a clinical profile.`, 'success')
            } catch (e) {
              showToast('Unlink failed', e.message || 'Could not unlink. The server may not support this yet.', 'error')
              console.error('[neumDesk] unlinkUserStaff failed:', e)
            }
          }
        })
      }

      // Returns inline style string for a permission pill tag.
      // Extracted from the template because Vue's compiler rejects IIFEs with if-statements.
      const permSummary = (user) => {
        const perms = Array.isArray(user?.permissions) ? user.permissions : []
        let write = 0, read = 0
        for (const p of perms) {
          if (p.can_write) write++
          else if (p.can_read) read++
        }
        const total = ALL_MODULES.length
        return { write, read, none: total - write - read, total }
      }

      const permSummaryText = (user) => {
        if (user?.admin_level >= 1) return 'Administrator · full access'
        const s = permSummary(user)
        if (s.write === 0 && s.read === 0) return 'No permissions granted'
        const parts = []
        if (s.write) parts.push(s.write + ' full')
        if (s.read) parts.push(s.read + ' read-only')
        return parts.join(' · ') + ' of ' + s.total
      }

      const permPillStyle = (user, moduleKey) => {
        const base = 'padding:4px 10px;border-radius:100px;font-size:11px;font-weight:500;cursor:pointer;transition:all .15s;border:1px solid;white-space:nowrap;'
        const saving = permMgmt.saving === user.id + ':' + moduleKey
        if (saving) return base + 'opacity:.5;cursor:wait;background:var(--nm-surface2);border-color:var(--nm-border);color:var(--nm-text3)'
        const p = getUserPerm(user, moduleKey)
        if (!p || (!p.can_read && !p.can_write)) return base + 'background:var(--nm-surface2);border-color:var(--nm-border);color:var(--nm-text3)'
        if (p.can_read && !p.can_write) return base + 'background:rgba(59,130,246,.1);border-color:rgba(59,130,246,.35);color:#3b82f6'
        return base + 'background:rgba(16,185,129,.15);border-color:rgba(16,185,129,.45);color:#059669'
      }

      const toggleAdminLevel = async (user) => {
        const newLevel = (user.admin_level >= 1) ? 0 : 1
        try {
          await API.request(`/api/permissions/${user.id}/admin-level`, {
            method: 'PUT',
            body: { admin_level: newLevel }
          })
          user.admin_level = newLevel
          showToast('Updated', newLevel ? `${user.full_name} is now an admin` : `Admin removed from ${user.full_name}`, 'success')
        } catch (e) {
          showToast('Error', 'Could not update admin level', 'error')
        }
      }


      // ── Soft-delete with undo ──────────────────────────────────────────
      // Shows a 5-second undo toast before actually deleting. If user clicks
      // Undo, the delete is cancelled. If they don't, a real DELETE fires.
      const pendingDeletes = reactive({})  // id -> timeout handle

      const deleteWithUndo = (label, deleteFn, id) => {
        if (pendingDeletes[id]) {
          clearTimeout(pendingDeletes[id])
          delete pendingDeletes[id]
        }
        showToast('Deleted', label + ' will be removed in 5s — ', 'warn', 5000, {
          label: 'Undo',
          fn: () => {
            if (pendingDeletes[id]) { clearTimeout(pendingDeletes[id]); delete pendingDeletes[id] }
            showToast('Restored', label + ' deletion cancelled', 'success')
          }
        })
        pendingDeletes[id] = setTimeout(async () => {
          delete pendingDeletes[id]
          try { await deleteFn() }
          catch (e) { showToast('Error', 'Could not delete ' + label, 'error') }
        }, 5000)
      }


      // ── Notifications ─────────────────────────────────────────────────
      const notifications = reactive({ items: [], unread: 0, open: false, loading: false })

      // ── Template-safe handler methods (Vue rejects if/const in attribute bindings) ──
      const toggleNotifBell = () => {
        notifications.open = !notifications.open
        if (notifications.open) loadNotifications()
      }
      const clickNotifItem = (n) => {
        markNotifRead(n.id)
        if (n.action_view) { switchView(n.action_view); notifications.open = false }
      }
      const maybeLoadPermUsers = () => {
        if (!permMgmt.users.length && !permMgmt.loading) loadPermissionUsers()
      }
      const addNewsImage = (form) => {
        if (form._imageInput?.trim()) { form.image_urls.push(form._imageInput.trim()); form._imageInput = '' }
      }

      // Uploads a picked file to Supabase Storage via the backend and adds
      // the returned public URL to the post's image list. Raw fetch (not
      // API.request) because FormData must not be JSON.stringify'd.
      const newsImageUploading = ref(false)
      const triggerNewsImagePicker = () => { document.getElementById('newsImageFileInput')?.click() }
      const uploadNewsImage = async (form, fileInputEvent) => {
        const file = fileInputEvent.target.files?.[0]
        fileInputEvent.target.value = '' // allow picking the same file again later
        if (!file) return
        if (form.image_urls.length >= 5) { showToast('Limit reached', 'Maximum 5 images per post', 'warning'); return }
        newsImageUploading.value = true
        try {
          const token = localStorage.getItem(CONFIG.TOKEN_KEY) || ''
          const fd = new FormData()
          fd.append('file', file)
          const res = await fetch(CONFIG.API_BASE_URL + '/api/upload/news-image', {
            method: 'POST',
            headers: { Authorization: 'Bearer ' + token },
            body: fd
          })
          const data = await res.json()
          if (!res.ok) throw new Error(data?.error || 'Upload failed')
          form.image_urls.push(data.url)
          showToast('Uploaded', 'Image added', 'success')
        } catch (e) {
          showToast('Error', e.message || 'Could not upload image', 'error')
        } finally {
          newsImageUploading.value = false
        }
      }

      // Staff public-profile photo upload — same pattern as news images,
      // but the result is written directly to form.public_photo_url
      // (a single field) rather than pushed onto an array.
      const staffPhotoUploading = ref(false)
      const triggerStaffPhotoPicker = () => { document.getElementById('staffPhotoFileInput')?.click() }
      const uploadStaffPhoto = async (form, fileInputEvent) => {
        const file = fileInputEvent.target.files?.[0]
        fileInputEvent.target.value = ''
        if (!file) return
        staffPhotoUploading.value = true
        try {
          const token = localStorage.getItem(CONFIG.TOKEN_KEY) || ''
          const fd = new FormData()
          fd.append('file', file)
          const res = await fetch(CONFIG.API_BASE_URL + '/api/upload/staff-photo', {
            method: 'POST',
            headers: { Authorization: 'Bearer ' + token },
            body: fd
          })
          const data = await res.json()
          if (!res.ok) throw new Error(data?.error || 'Upload failed')
          form.public_photo_url = data.url
          showToast('Uploaded', 'Photo updated', 'success')
        } catch (e) {
          showToast('Error', e.message || 'Could not upload photo', 'error')
        } finally {
          staffPhotoUploading.value = false
        }
      }
      const toggleResidentManagerRole = () => {
        const f = medicalStaffModal.form
        if (f.staff_type === 'attending_physician' && !(isRoleTaken('resident_manager') && !f.is_resident_manager)) {
          handleRoleAssignment('resident_manager', !f.is_resident_manager)
          f.is_resident_manager = !f.is_resident_manager
        }
      }
      const toggleOncallManagerRole = () => {
        const f = medicalStaffModal.form
        if (f.staff_type === 'attending_physician' && !(isRoleTaken('oncall_manager') && !f.is_oncall_manager)) {
          handleRoleAssignment('oncall_manager', !f.is_oncall_manager)
          f.is_oncall_manager = !f.is_oncall_manager
        }
      }
      const toggleResearchCoordinator = () => {
        medicalStaffModal.form.is_research_coordinator = !medicalStaffModal.form.is_research_coordinator
        if (!medicalStaffModal.form.is_research_coordinator) medicalStaffModal.form._coordLineId = null
      }

      const loadNotifications = async () => {
        try {
          notifications.loading = true
          const data = await API.request('/api/notifications?limit=20')
          notifications.items = data?.data || []
          notifications.unread = data?.unread_count || 0
        } catch (e) { console.error('[neumDesk] loadNotifications failed:', e) }
        finally { notifications.loading = false }
      }

      const markNotifRead = async (id) => {
        const n = notifications.items.find(x => x.id === id)
        if (n && !n.read) {
          n.read = true
          notifications.unread = Math.max(0, notifications.unread - 1)
          await API.request('/api/notifications/' + id + '/read', { method: 'PUT' }).catch(() => {})
        }
      }

      const markAllNotifsRead = async () => {
        notifications.items.forEach(n => { n.read = true })
        notifications.unread = 0
        await API.request('/api/notifications/read-all', { method: 'PUT' }).catch(() => {})
      }

      // Poll every 60s for new notifications
      let _notifPollTimer = null
      const startNotifPolling = () => {
        if (_notifPollTimer) return
        loadNotifications()
        _notifPollTimer = setInterval(loadNotifications, 60000)
      }
      const stopNotifPolling = () => { if (_notifPollTimer) { clearInterval(_notifPollTimer); _notifPollTimer = null } }


      // ── Bulk selection ────────────────────────────────────────────────
      const bulkSelect = reactive({
        active: false,
        selected: [],   // plain array — Vue reactive() cannot track Set mutations
        module: null
      })

      const toggleBulkMode = (module) => {
        if (bulkSelect.active && bulkSelect.module === module) {
          bulkSelect.active = false
          bulkSelect.selected.splice(0)
          bulkSelect.module = null
        } else {
          bulkSelect.active = true
          bulkSelect.selected.splice(0)
          bulkSelect.module = module
        }
      }

      const toggleBulkItem = (id) => {
        const idx = bulkSelect.selected.indexOf(id)
        if (idx > -1) bulkSelect.selected.splice(idx, 1)
        else bulkSelect.selected.push(id)
      }

      const bulkApproveAbsences = async () => {
        if (!bulkSelect.selected.length) return
        const ids = [...bulkSelect.selected]
        let done = 0
        for (const id of ids) {
          try {
            await API.request('/api/absences/' + id, { method: 'PUT', body: { status: 'approved' } })
            done++
          } catch (e) { console.error('bulk approve failed for', id, e) }
        }
        showToast('Approved', done + ' absence' + (done !== 1 ? 's' : '') + ' approved', 'success')
        bulkSelect.selected.splice(0)
        bulkSelect.active = false
        await loadAllData()
      }

      const bulkDeleteAbsences = async () => {
        if (!bulkSelect.selected.length) return
        const ids = [...bulkSelect.selected]
        showToast('Warning', 'Deleting ' + ids.length + ' records in 5s — ', 'warn', 5000, {
          label: 'Undo',
          fn: () => { bulkSelect.selected.splice(0); showToast('Cancelled', 'Bulk delete cancelled', 'success') }
        })
        setTimeout(async () => {
          for (const id of ids) {
            await API.request('/api/absences/' + id, { method: 'DELETE' }).catch(() => {})
          }
          bulkSelect.selected.splice(0)
          bulkSelect.active = false
          await loadAllData()
        }, 5000)
      }


      // ── Data export ───────────────────────────────────────────────────
      const exportCSV = async (type) => {
        try {
          const token = localStorage.getItem('neumax_token') || ''
          const BACKEND = window.CONFIG?.BACKEND_URL || 'https://neumac-manage-back-end-production.up.railway.app'
          const url = BACKEND + '/api/export/' + type
          const res = await fetch(url, { headers: { Authorization: 'Bearer ' + token } })
          if (!res.ok) throw new Error('Export failed: ' + res.status)
          const blob = await res.blob()
          const a = document.createElement('a')
          a.href = URL.createObjectURL(blob)
          a.download = type + '-export.csv'
          a.click()
          URL.revokeObjectURL(a.href)
          showToast('Downloaded', type + ' data exported as CSV', 'success')
        } catch (e) {
          showToast('Error', 'Export failed: ' + e.message, 'error')
        }
      }

      const downloadIcal = async () => {
        try {
          const token = localStorage.getItem('neumax_token') || ''
          const BACKEND = window.CONFIG?.BACKEND_URL || 'https://neumac-manage-back-end-production.up.railway.app'
          const res = await fetch(BACKEND + '/api/ical/oncall', { headers: { Authorization: 'Bearer ' + token } })
          if (!res.ok) throw new Error('iCal export failed')
          const blob = await res.blob()
          const a = document.createElement('a')
          a.href = URL.createObjectURL(blob)
          a.download = 'guardias-neumologia.ics'
          a.click()
          URL.revokeObjectURL(a.href)
          showToast('Downloaded', 'iCal file ready — import into your calendar app', 'success')
        } catch (e) {
          showToast('Error', 'Could not download calendar file', 'error')
        }
      }

      // Print helper — opens a print-optimised view
      const printView = (title) => {
        document.title = 'Print – ' + title + ' – neumDesk'
        window.print()
        setTimeout(() => { document.title = 'neumDesk' }, 2000)
      }

      // ── Profile: download schedule (iCal) + share ─────────────────────
      const downloadStaffSchedule = (staff) => {
        if (!staff) return
        try {
          const name = staff.full_name || 'staff'
          const shifts = (onCallSchedule?.value || []).filter(s =>
            s.primary_physician_id === staff.id || s.backup_physician_id === staff.id)
          const rots = (rotations?.value || []).filter(r =>
            r.resident_id === staff.id || r.supervising_attending_id === staff.id)
          const esc = (t) => String(t || '').replace(/[,;\\]/g, ' ').replace(/\n/g, ' ')
          const dt = (d) => Utils.normalizeDate(d).replace(/-/g, '')
          let ics = 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//neumDesk//Schedule//EN\r\n'
          shifts.forEach((s, i) => {
            ics += 'BEGIN:VEVENT\r\nUID:oncall-' + (s.id || i) + '@neumdesk\r\n' +
              'DTSTART;VALUE=DATE:' + dt(s.duty_date) + '\r\n' +
              'SUMMARY:' + esc('On-call' + (s.primary_physician_id === staff.id ? ' (primary)' : ' (backup)')) + '\r\n' +
              'END:VEVENT\r\n'
          })
          rots.forEach((r, i) => {
            if (!r.start_date) return
            ics += 'BEGIN:VEVENT\r\nUID:rot-' + (r.id || i) + '@neumdesk\r\n' +
              'DTSTART;VALUE=DATE:' + dt(r.start_date) + '\r\n' +
              (r.end_date ? 'DTEND;VALUE=DATE:' + dt(r.end_date) + '\r\n' : '') +
              'SUMMARY:' + esc('Rotation' + (r.training_unit_name ? ' · ' + r.training_unit_name : '')) + '\r\n' +
              'END:VEVENT\r\n'
          })
          ics += 'END:VCALENDAR'
          if (shifts.length === 0 && rots.length === 0) {
            showToast('Nothing to download', name + ' has no scheduled shifts or rotations yet.', 'info')
            return
          }
          const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' })
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url; a.download = name.replace(/\s+/g, '_') + '_schedule.ics'
          document.body.appendChild(a); a.click(); document.body.removeChild(a)
          URL.revokeObjectURL(url)
          showToast('Schedule downloaded', name + "'s schedule saved as .ics", 'success')
        } catch (e) { showToast('Download failed', e.message || 'Could not generate schedule', 'error') }
      }

      const shareStaffProfile = async (staff) => {
        if (!staff) return
        const name = staff.full_name || 'Staff'
        const lines = [
          name,
          staff.staff_type ? formatStaffType(staff.staff_type) : '',
          staff.professional_email ? 'Email: ' + staff.professional_email : '',
          staff.mobile_phone ? 'Mobile: ' + staff.mobile_phone : ''
        ].filter(Boolean)
        const text = lines.join('\n')
        try {
          if (navigator.share) {
            await navigator.share({ title: name + ' · neumDesk', text })
            return
          }
          if (navigator.clipboard) {
            await navigator.clipboard.writeText(text)
            showToast('Copied to clipboard', name + "'s details copied — ready to share.", 'success')
            return
          }
          showToast('Share', text, 'info')
        } catch (e) { /* user cancelled share — no-op */ }
      }


      // ── Onboarding tooltips ───────────────────────────────────────────
      const onboarding = reactive({ active: false, step: 0 })
      const ONBOARDING_KEY = 'neumax_onboarded_v1'

      const ONBOARDING_STEPS = [
        { selector: '.sidebar', title: 'Navigation', text: 'Use the sidebar to move between modules — clinical, operations, and research.' },
        { selector: '[data-tour="staff"]', title: 'Medical Staff', text: 'All 94 staff members live here. Search, filter, view profiles, and manage rotations.' },
        { selector: '[data-tour="oncall"]', title: 'On-call Schedule', text: 'See and manage guardias. The calendar view shows coverage gaps automatically.' },
        { selector: '[data-tour="research"]', title: 'Research Hub', text: 'Research lines, clinical trials, and innovation projects all in one place.' },
        { selector: '[data-tour="settings"]', title: 'Settings & Permissions', text: 'Manage staff types, services, and — if you are an admin — user permissions.' },
      ]

      const startOnboarding = () => { onboarding.step = 0; onboarding.active = true }
      const nextOnboardingStep = () => {
        if (onboarding.step < ONBOARDING_STEPS.length - 1) onboarding.step++
        else finishOnboarding()
      }
      const finishOnboarding = () => {
        onboarding.active = false
        localStorage.setItem(ONBOARDING_KEY, '1')
      }
      const checkFirstVisit = () => {
        if (!localStorage.getItem(ONBOARDING_KEY)) {
          setTimeout(startOnboarding, 1500) // slight delay after login
        }
      }


      // ── Background polling — real-time feel without WebSockets ────────
      // Polls on-call schedule and absence records every 30s since these
      // change most frequently during a working day.
      let _realtimePoll = null
      const startRealtimePolling = () => {
        if (_realtimePoll) return
        _realtimePoll = setInterval(async () => {
          try {
            await Promise.allSettled([
              onCallOps?.loadOnCallSchedule?.(),
              absenceOps?.loadAbsences?.()
            ])
          } catch (e) { /* non-fatal */ }
        }, 30000)
      }
      const stopRealtimePolling = () => { if (_realtimePoll) { clearInterval(_realtimePoll); _realtimePoll = null } }

      // Start polling and notifications when user logs in, stop on logout
      watch(() => currentUser.value, (user) => {
        if (user) { startRealtimePolling(); startNotifPolling(); checkFirstVisit() }
        else { stopRealtimePolling(); stopNotifPolling() }
      })

      const loadAllData = async () => {
          if (loading.value) return  // already in flight — don't double-fire
          loading.value = true
          try {
            // Wake Railway immediately — runs in background while we set up
            warmBackend()

            // loadAcademicDegrees is synchronous (uses fallback data) — free.
            // loadStaffTypes needs ONE network call — run it in parallel with the
            // first main batch. staffTypeMap will be populated by the time any
            // staff dropdown renders because Vue defers rendering until microtasks settle.
            await Promise.all([
              loadStaffTypes(),
              loadAcademicDegrees(),
              loadRotationServices(),
              onCallOps.loadCoverageAreas(),
              loadSystemSettings(),
              staffOps.loadMedicalStaff(),
              loadDepartments(),
              loadTrainingUnits()
            ])

            // Second batch: depends on staff + units being loaded
            await Promise.all([
              rotationOps.loadRotations(),
              onCallOps.loadOnCallSchedule(),
              absenceOps.loadAbsences()
            ])

            updateDashboardStats()

            // Third batch: non-critical, fire and forget
            Promise.all([
              onCallOps.loadTodaysOnCall(),
              commsOps.loadAnnouncements(),
              liveOps.loadClinicalStatus(),
              liveOps.loadActiveMedicalStaff(),
              researchOps.loadResearchLines(),
              loadSystemStats(),
              newsOps.preloadNews() // silent prefetch — no loading flag
            ]).then(() => updateDashboardStats())

            // Low priority — research analytics
            Promise.all([
              researchOps.loadClinicalTrials(),
              researchOps.loadInnovationProjects(),
              analyticsOps.loadAnalyticsSummary()
            ])

          } catch { showToast('Error', 'Failed to load some data', 'error') }
          finally { loading.value = false }
        }

        watch([medicalStaff, rotations, trainingUnits, absences], () => updateDashboardStats(), { deep: true })

        // ── isOnline — declared at root scope so template can access it ──
        const isOnline = ref(navigator.onLine)
        // Update when API layer fires events
        window.addEventListener('neumax:online',  () => { isOnline.value = true  })
        window.addEventListener('neumax:offline', () => { isOnline.value = false })

        onMounted(() => {
          const token = localStorage.getItem(CONFIG.TOKEN_KEY)
          const user = localStorage.getItem(CONFIG.USER_KEY)
          if (token && user) {
            try {
              // Validate token with backend before showing the app.
              // This blocks access from shared/QR sessions with expired tokens.
              const parsed = JSON.parse(user)
              currentUser.value = parsed  // optimistic — show splash while validating
              currentView.value = 'dashboard'
              // Validate in background — if invalid, session-expired event fires
              API.request('/api/auth/me').then(data => {
                if (data && data.id) {
                  currentUser.value = { ...parsed, ...data }
                  loadAllData()
                  loadBrain()  // department-curated agent knowledge (Supabase-backed)
                } else {
                  window.dispatchEvent(new CustomEvent('neumax:session-expired'))
                }
              }).catch(() => {
                window.dispatchEvent(new CustomEvent('neumax:session-expired'))
              })
            }
            catch { currentView.value = 'login' }
          } else { currentView.value = 'login' }

          // Session expiry — redirect to login cleanly from anywhere in the app
          // ── Online / offline / maintenance ──
          window.addEventListener('neumax:online', () => {
            isOnline.value = true
            showToast('Connection restored', 'Back online — syncing…', 'success', 3000)
            if (currentUser.value) {
              try { staffOps.loadMedicalStaff(true); rotationOps.loadRotations(true) } catch {}
            }
          })
          window.addEventListener('neumax:offline', () => {
            isOnline.value = false
            showToast('No connection', 'You are offline. Changes cannot be saved until you reconnect.', 'warning', 0)
          })
          window.addEventListener('neumax:maintenance', () => {
            showToast('System Maintenance', 'The system is temporarily offline for maintenance.', 'warning', 0)
          })

          // ── Dashboard auto-refresh every 5 min ──
          const dashRefreshInterval = setInterval(() => {
            if (currentUser.value && currentView.value === 'dashboard') {
              try { dashOps.loadSystemStats() } catch {}
            }
          }, 300000)

          window.addEventListener('neumax:session-expired', () => {
            currentUser.value = null
            currentView.value = 'login'
            // Close all open panels/modals
            try {
              const modals = [staffOps.medicalStaffModal, staffOps.staffProfileModal,
                departmentModal, trainingUnitModal, unitResidentsModal, unitCliniciansModal,
                rotationOps.rotationModal, rotationOps.rotationViewModal,
                onCallOps.onCallModal, absenceOps.absenceModal, commsOps.communicationsModal]
              modals.forEach(m => { if (m && 'show' in m) m.show = false })
              if (deptPanel) deptPanel.show = false
            } catch {}
            // Set friendly message on login page
            loginError.value = 'Your session has expired. Please log in again.'
            showToast('Session Expired', 'Your session has expired. Please log in again.', 'warning', 6000)
          })

          window.addEventListener('neumax:maintenance', () => { ui.isMaintenanceMode.value = true })

          const statusInterval = setInterval(() => { if (currentUser.value && !liveOps.isLoadingStatus.value) liveOps.loadClinicalStatus() }, 60000)
          const timeInterval = setInterval(() => { dashOps.currentTime.value = new Date() }, 60000)

          let rotationCheckInterval = null
          if (rotationOps.initAutoCheck) rotationCheckInterval = rotationOps.initAutoCheck()

          document.addEventListener('keydown', (e) => {
            if (e.key !== 'Escape') return
            const modals = [staffOps.medicalStaffModal, staffOps.staffProfileModal, departmentModal, trainingUnitModal, unitResidentsModal, unitCliniciansModal, rotationOps.rotationModal, rotationOps.rotationViewModal, onCallOps.onCallModal, absenceOps.absenceModal, commsOps.communicationsModal, userProfileModal, ui.confirmationModal, researchOps.researchLineModal, researchOps.clinicalTrialModal, researchOps.innovationProjectModal, researchOps.assignCoordinatorModal, analyticsOps.exportModal, rotationOps.activationModal]
            modals.forEach(m => { if (m.show) m.show = false })
          })

          // Warn before leaving with an open modal that has unsaved data
          window.addEventListener('beforeunload', (e) => {
            const openModals = [
              staffOps.medicalStaffModal, rotationOps.rotationModal,
              onCallOps.onCallModal, absenceOps.absenceModal,
              researchOps.researchLineModal, researchOps.clinicalTrialModal,
              researchOps.innovationProjectModal
            ]
            const hasOpenModal = openModals.some(m => m.show)
            if (hasOpenModal) {
              e.preventDefault()
              e.returnValue = 'You have unsaved changes. Are you sure you want to leave?'
              return e.returnValue
            }
          })

          onUnmounted(() => { clearInterval(statusInterval); clearInterval(timeInterval); clearInterval(dashRefreshInterval); if (rotationCheckInterval) clearInterval(rotationCheckInterval) })
        })

        // ── ⌘K Command Palette (defined here — full access to all refs) ──
        const cmdQuery       = ref('')
        const cmdSelectedIdx = ref(0)
        watch(cmdQuery, () => { cmdSelectedIdx.value = 0 })

        // ── GLOBAL PHYSICIAN POPOVER ──────────────────────────────────────────
        const popover = Vue.reactive({ staff: null, visible: false })
        let _popoverTimer = null

        const showPopover = (staffObj, event) => {
          if (!staffObj) return
          clearTimeout(_popoverTimer)
          _popoverTimer = setTimeout(() => {
            popover.staff = staffObj
            const el = document.getElementById('staffPopover')
            if (!el) return
            const rect = event.currentTarget?.getBoundingClientRect?.() || event.target?.getBoundingClientRect?.() || { top: event.clientY, left: event.clientX, width: 0, height: 0 }
            const vpW = window.innerWidth, vpH = window.innerHeight
            const pw = 300, ph = 360  // approx popover size
            let left = rect.left + rect.width / 2 - pw / 2
            let top  = rect.bottom + 8
            if (left + pw > vpW - 12) left = vpW - pw - 12
            if (left < 12) left = 12
            if (top + ph > vpH - 12) top = rect.top - ph - 8
            el.style.left = left + 'px'
            el.style.top  = top  + 'px'
            el.classList.add('visible')
            popover.visible = true
          }, 220)
        }

        const hidePopover = () => {
          clearTimeout(_popoverTimer)
          const el = document.getElementById('staffPopover')
          if (el) el.classList.remove('visible')
          setTimeout(() => { popover.staff = null; popover.visible = false }, 200)
        }

        // Keep popover open when hovering over it
        if (typeof document !== 'undefined') {
          document.addEventListener('mouseover', (e) => {
            const pop = document.getElementById('staffPopover')
            if (pop && pop.contains(e.target)) return  // inside popover = stay
            if (!e.target.closest('[data-popover-staff]')) hidePopover()
          }, { passive: true })
        }

        // ── ABSENCE COVERAGE CALENDAR ─────────────────────────────────────────
        const absenceCalendarOffset = Vue.ref(0) // months from now

        const absenceMoveMonth = (delta) => { absenceCalendarOffset.value += delta }

        const absenceCalendarTitle = Vue.computed(() => {
          const d = new Date()
          d.setMonth(d.getMonth() + absenceCalendarOffset.value)
          return d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
        })

        const absenceCalendarCells = Vue.computed(() => {
          const d = new Date()
          d.setMonth(d.getMonth() + absenceCalendarOffset.value)
          const year = d.getFullYear(), month = d.getMonth()
          const firstDay = new Date(year, month, 1).getDay()  // 0=Sun
          const startOffset = (firstDay === 0) ? 6 : firstDay - 1  // Mon-first
          const daysInMonth  = new Date(year, month+1, 0).getDate()
          const daysInPrev   = new Date(year, month, 0).getDate()
          const cells = []
          const today = new Date(); today.setHours(0,0,0,0)

          // Fill prev month overflow
          for (let i = startOffset; i > 0; i--) {
            cells.push({ date: null, day: daysInPrev - i + 1, otherMonth: true, absences: [] })
          }
          // Fill current month
          for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
            const cellDate = new Date(year, month, day)
            const dayAbsences = (absences.value || []).filter(a => {
              if (!a.start_date || !a.end_date) return false
              const s = new Date(a.start_date + 'T00:00:00')
              const e = new Date(a.end_date + 'T23:59:59')
              return cellDate >= s && cellDate <= e
            })
            const isToday = cellDate.getTime() === today.getTime()
            // Coverage risk: multiple senior staff absent = risk
            const seniorAbsent = dayAbsences.filter(a => {
              const staff = medicalStaff.value.find(s => s.id === a.staff_member_id)
              return staff && !isResidentType(staff.staff_type)
            }).length
            cells.push({
              date: dateStr, day, otherMonth: false, isToday,
              absences: dayAbsences,
              riskLevel: seniorAbsent >= 2 ? 'gap' : seniorAbsent === 1 ? 'risk' : dayAbsences.length > 0 ? 'covered' : 'clear'
            })
          }
          // Fill to complete grid (multiple of 7)
          let next = 1
          while (cells.length % 7 !== 0) {
            cells.push({ date: null, day: next++, otherMonth: true, absences: [] })
          }
          return cells
        })



        const cmdItems = computed(() => {
          const q = cmdQuery.value.toLowerCase().trim()
          const views = [
            { type:'view', id:'dashboard',         label:'Overview',       sub:'Dashboard'       },
            { type:'view', id:'medical_staff',      label:'Medical Staff',  sub:'Clinical'        },
            { type:'view', id:'oncall_schedule',    label:'On-call',        sub:'Clinical · live' },
            { type:'view', id:'training_units',     label:'Clinical Units', sub:'Structure'       },
            { type:'view', id:'resident_rotations', label:'Rotations',      sub:'Structure'       },
            { type:'view', id:'staff_absence',      label:'Absence',        sub:'Administration'  },
            { type:'view', id:'system_settings',    label:'Settings',       sub:'Administration'  },
            { type:'view', id:'research_hub',       label:'Research Hub',   sub:'Research'        },
            { type:'view', id:'news',               label:'News & Posts',   sub:'Research'        },
          ]
          const staffItems = !q ? [] : medicalStaff.value
            .filter(s => s.full_name?.toLowerCase().includes(q))
            .slice(0,5)
            .map(s => ({ type:'staff', id:s.id, label:s.full_name, sub:formatStaffType(s.staff_type) || 'Staff member' }))
          const unitItems = !q ? [] : trainingUnits.value
            .filter(u => u.unit_name?.toLowerCase().includes(q))
            .slice(0,3)
            .map(u => ({ type:'unit', id:u.id, label:u.unit_name, sub:'Clinical unit' }))
          // Action items — shown when query matches action keywords or staff name with action verb
          const actionItems = []
          const actionKeywords = ['add','new','log','create','assign','absence','rotation','callout','call-out','duty','guardia','aviso']
          const hasActionWord = actionKeywords.some(k => q.includes(k))
          if (q.includes('rotation') || q.includes('assign') || (hasActionWord && q.includes('rotat'))) {
            actionItems.push({ type:'action', id:'add_rotation', label:'Add rotation', sub:'Assign a resident to a unit', icon:'fa-calendar-plus', fn: () => rotationOps.showAddRotationModal() })
          }
          if (q.includes('absence') || q.includes('ausencia') || (hasActionWord && q.includes('abs'))) {
            actionItems.push({ type:'action', id:'add_absence', label:'Log absence', sub:'Record a new absence', icon:'fa-user-minus', fn: () => { switchView('staff_absence'); Vue.nextTick(() => absenceOps?.showAddAbsenceModal?.()) } })
          }
          if (q.includes('callout') || q.includes('call-out') || q.includes('aviso') || q.includes('guardia') || (hasActionWord && q.includes('call'))) {
            actionItems.push({ type:'action', id:'log_callout', label:'Log call-out', sub:'Record an emergency duty call', icon:'fa-phone', fn: () => { switchView('oncall_schedule'); Vue.nextTick(() => { if (typeof openLogCalloutModal === 'function') openLogCalloutModal() }) } })
          }
          if (!q || q.includes('staff') || q.includes('medico') || q.includes('doctor') || (hasActionWord && (q.includes('new') || q.includes('add')))) {
            if (q && hasActionWord) actionItems.push({ type:'action', id:'add_staff', label:'Add staff member', sub:'Register a new physician or resident', icon:'fa-user-plus', fn: () => { switchView('medical_staff'); Vue.nextTick(() => staffOps?.showAddMedicalStaffModal?.()) } })
          }
          // Staff action items — when query contains a staff name + action word
          const staffActionItems = !q ? [] : medicalStaff.value
            .filter(s => s.full_name?.toLowerCase().includes(q) && hasActionWord)
            .slice(0,3)
            .flatMap(s => [
              { type:'action', id:'rot_'+s.id, label:'Assign rotation — ' + (s.full_name.split(' ').slice(-1)[0]), sub:'Open rotation modal pre-filled', fn: () => rotationOps.showAddRotationModal(s) },
              { type:'action', id:'abs_'+s.id, label:'Log absence — ' + (s.full_name.split(' ').slice(-1)[0]),    sub:'Open absence modal pre-filled',  fn: () => { switchView('staff_absence'); Vue.nextTick(() => absenceOps?.showAddAbsenceModal?.(s)) } },
            ])
          const viewItems = views.filter(v => !q || v.label.toLowerCase().includes(q) || v.sub.toLowerCase().includes(q))
          return [...actionItems, ...staffActionItems, ...staffItems, ...unitItems, ...viewItems].slice(0, 12)
        })

        const executeCmdItem = (item) => {
          if (!item) return
          ui.cmdPaletteOpen.value = false
          cmdQuery.value = ''
          if (item.type === 'action' && item.fn) { item.fn(); return }
          if (item.type === 'view')  switchView(item.id)
          else if (item.type === 'unit')  switchView('training_units')
          else if (item.type === 'staff') switchView('medical_staff')
        }

        // Focus cmd input whenever palette opens
        watch(() => ui.cmdPaletteOpen.value, (open) => {
          if (open) {
            Vue.nextTick(() => {
              const inp = document.querySelector('.cmd-input-row input')
              if (inp) inp.focus()
            })
          }
        })

        // Arrow key navigation for palette (needs cmdItems in scope)
        window.addEventListener('keydown', (e) => {
          if (!ui.cmdPaletteOpen.value) return
          if (e.key === 'ArrowDown') { e.preventDefault(); cmdSelectedIdx.value = Math.min(cmdSelectedIdx.value + 1, Math.max(cmdItems.value.length - 1, 0)) }
          if (e.key === 'ArrowUp')   { e.preventDefault(); cmdSelectedIdx.value = Math.max(cmdSelectedIdx.value - 1, 0) }
          if (e.key === 'Enter') { e.preventDefault(); executeCmdItem(cmdItems.value[cmdSelectedIdx.value]) }
        })

        // Ask-bar keyboard: "/" opens it (when not typing), Esc closes it.
        // Distinct from ⌘K (palette) — "/" to know, ⌘K to go.
        window.addEventListener('keydown', (e) => {
          const tag = e.target?.tagName?.toLowerCase()
          const typing = ['input','textarea','select'].includes(tag) || e.target?.isContentEditable
          if (e.key === '/' && !typing && !e.metaKey && !e.ctrlKey && !askBar.open) {
            e.preventDefault(); openAskBar()
            Vue.nextTick(() => { const inp = document.querySelector('.askbar-input input'); if (inp) inp.focus() })
            return
          }
          if (e.key === 'Escape' && askBar.open) { closeAskBar(); return }
        })



      // ═══════════════════════════════════════════════════════════════
      //  CLINICAL INTELLIGENCE LAYER — hover popovers + availability
      // ═══════════════════════════════════════════════════════════════

      // ── Hover popover system ──
      const hoverPopover = Vue.reactive({
        show: false, x: 0, y: 0,
        staffId: null, data: null, entering: false,
        _timer: null, _hideTimer: null
      })

      const getStaffPulseState = (staffId) => {
        if (!staffId) return 'inactive'
        const staff = medicalStaff.value.find(s => s.id === staffId)
        if (!staff) return 'inactive'
        if (staff.employment_status === 'on_leave') return 'leave'
        const today = Utils.normalizeDate(new Date())
        const onCallToday = onCallSchedule.value.some(s =>
          Utils.normalizeDate(s.duty_date) === today && s.primary_physician_id === staffId
        )
        if (onCallToday) return 'oncall'
        const rot = rotations.value.find(r => r.resident_id === staffId && r.rotation_status === 'active')
        if (rot) {
          const daysLeft = Math.ceil((new Date(rot.end_date) - new Date()) / 86400000)
          if (daysLeft <= 7) return 'ending'
        }
        if (staff.employment_status === 'inactive') return 'inactive'
        return 'available'
      }

      const getStaffNextEvent = (staffId) => {
        if (!staffId) return null
        const today = new Date(); today.setHours(0,0,0,0)
        // Check current rotation ending soon
        const rot = rotations.value.find(r =>
          r.resident_id === staffId && r.rotation_status === 'active'
        )
        if (rot) {
          const end = new Date(rot.end_date + 'T00:00:00')
          const daysLeft = Math.ceil((end - today) / 86400000)
          if (daysLeft <= 14) return { type: 'ending', label: `Rotation ends in ${daysLeft}d`, color: 'ending' }
        }
        // Check next on-call
        const nextOC = onCallSchedule.value
          .filter(s => s.primary_physician_id === staffId)
          .filter(s => new Date(s.duty_date + 'T00:00:00') >= today)
          .sort((a,b) => a.duty_date.localeCompare(b.duty_date))[0]
        if (nextOC) {
          const d = new Date(nextOC.duty_date + 'T00:00:00')
          const diff = Math.ceil((d - today) / 86400000)
          const label = diff === 0 ? 'On call today' : diff === 1 ? 'On call tomorrow' : `On call ${d.toLocaleDateString('en-GB', {weekday:'short',day:'numeric',month:'short'})}`
          return { type: 'oncall', label, color: 'oncall' }
        }
        // Check upcoming leave
        const nextLeave = absences.value
          .filter(a => a.staff_member_id === staffId)
          .filter(a => new Date(a.end_date + 'T00:00:00') >= today && a.current_status !== 'returned_to_duty')
          .sort((a,b) => a.start_date.localeCompare(b.start_date))[0]
        if (nextLeave) {
          const start = new Date(nextLeave.start_date + 'T00:00:00')
          const diff = Math.ceil((start - today) / 86400000)
          const label = diff <= 0 ? 'On leave now' : `Leave in ${diff}d`
          return { type: 'leave', label, color: 'leave' }
        }
        // Check scheduled rotation
        const nextRot = rotations.value.find(r =>
          r.resident_id === staffId && r.rotation_status === 'scheduled'
        )
        if (nextRot) {
          const start = new Date(nextRot.start_date + 'T00:00:00')
          const diff = Math.ceil((start - today) / 86400000)
          if (diff <= 30) return { type: 'rotation', label: `Rotation starts in ${diff}d`, color: 'rotation' }
        }
        return null
      }

      const buildStaffPopoverData = (staffId) => {
        const staff = medicalStaff.value.find(s => s.id === staffId)
        if (!staff) return null
        const pulse = getStaffPulseState(staffId)
        const nextEvent = getStaffNextEvent(staffId)
        const currentRot = rotations.value.find(r => r.resident_id === staffId && r.rotation_status === 'active')
        const upcomingOC = onCallSchedule.value
          .filter(s => s.primary_physician_id === staffId)
          .filter(s => new Date(s.duty_date + 'T00:00:00') >= new Date())
          .sort((a,b) => a.duty_date.localeCompare(b.duty_date))
          .slice(0, 3)
        const currentLeave = absences.value.find(a => {
          const today = Utils.normalizeDate(new Date())
          return a.staff_member_id === staffId &&
            Utils.normalizeDate(a.start_date) <= today &&
            Utils.normalizeDate(a.end_date) >= today
        })
        const certCount = 0 // loaded separately on drawer open
        return { staff, pulse, nextEvent, currentRot, upcomingOC, currentLeave }
      }

      const showIntelPopover = (staffIdOrObj, event) => {
        // Accept both a UUID string and a full staff object
        const staffId = (typeof staffIdOrObj === 'object' && staffIdOrObj !== null)
          ? (staffIdOrObj.id || staffIdOrObj)
          : staffIdOrObj
        if (hoverPopover._timer) clearTimeout(hoverPopover._timer)
        if (hoverPopover._hideTimer) clearTimeout(hoverPopover._hideTimer)
        hoverPopover._timer = setTimeout(() => {
          const data = buildStaffPopoverData(staffId)
          if (!data) return
          const rect = event.currentTarget?.getBoundingClientRect?.() || { right: event.clientX, top: event.clientY, bottom: event.clientY + 20, left: event.clientX }
          const popW = 300, popH = 280
          // Try right of element first, fall back to left if too close to edge
          let x = rect.right + 12
          if (x + popW > window.innerWidth - 8) x = rect.left - popW - 12
          // Try below element top, but keep within viewport
          let y = rect.top
          if (y + popH > window.innerHeight - 8) y = window.innerHeight - popH - 8
          // Never go off screen top/left
          x = Math.max(8, x)
          y = Math.max(8, y)
          hoverPopover.x = x
          hoverPopover.y = y
          hoverPopover.staffId = staffId
          hoverPopover.data = data
          hoverPopover.show = true
          hoverPopover.entering = true
          setTimeout(() => { hoverPopover.entering = false }, 200)
        }, 280)
      }

      const hideIntelPopover = () => {
        if (hoverPopover._timer) { clearTimeout(hoverPopover._timer); hoverPopover._timer = null }
        hoverPopover._hideTimer = setTimeout(() => { hoverPopover.show = false }, 150)
      }

      // ── Absence calendar computed ──
      const absCalendarMonth = Vue.ref(new Date().getMonth())
      const absCalendarYear  = Vue.ref(new Date().getFullYear())

      const absCalendarDays = Vue.computed(() => {
        const year = absCalendarYear.value
        const month = absCalendarMonth.value
        const firstDay = new Date(year, month, 1)
        const lastDay  = new Date(year, month + 1, 0)
        const startDow = (firstDay.getDay() + 6) % 7 // Mon=0
        const days = []
        // Pad with previous month days
        for (let i = startDow - 1; i >= 0; i--) {
          const d = new Date(year, month, -i)
          days.push({ date: Utils.normalizeDate(d), day: d.getDate(), otherMonth: true, absences: [], risk: 'low' })
        }
        // Current month days
        for (let d = 1; d <= lastDay.getDate(); d++) {
          const date = new Date(year, month, d)
          const dateStr = Utils.normalizeDate(date)
          const dayAbsences = absences.value.filter(a => {
            const s = Utils.normalizeDate(a.start_date)
            const e = Utils.normalizeDate(a.end_date)
            return s <= dateStr && e >= dateStr &&
              a.current_status !== 'returned_to_duty' && a.current_status !== 'cancelled'
          })
          // Risk: high if senior staff absent, medium if any
          const seniorAbsent = dayAbsences.filter(a => {
            const staff = medicalStaff.value.find(s => s.id === a.staff_member_id)
            return staff && !isResidentType(staff.staff_type)
          }).length
          const risk = seniorAbsent >= 2 ? 'high' : seniorAbsent === 1 ? 'medium' : dayAbsences.length > 0 ? 'low' : 'none'
          const isToday = dateStr === Utils.normalizeDate(new Date())
          days.push({ date: dateStr, day: d, otherMonth: false, absences: dayAbsences, risk, isToday })
        }
        // Pad to complete grid (multiples of 7)
        const remaining = (7 - (days.length % 7)) % 7
        for (let d = 1; d <= remaining; d++) {
          const date = new Date(year, month + 1, d)
          days.push({ date: Utils.normalizeDate(date), day: d, otherMonth: true, absences: [], risk: 'low' })
        }
        return days
      })

      const absCalendarTitle = Vue.computed(() => {
        return new Date(absCalendarYear.value, absCalendarMonth.value, 1)
          .toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
      })

      const absCalPrevMonth = () => {
        if (absCalendarMonth.value === 0) { absCalendarMonth.value = 11; absCalendarYear.value-- }
        else absCalendarMonth.value--
      }
      const absCalNextMonth = () => {
        if (absCalendarMonth.value === 11) { absCalendarMonth.value = 0; absCalendarYear.value++ }
        else absCalendarMonth.value++
      }

      // Absence view mode
      const absenceViewMode = Vue.ref('table') // 'table' | 'calendar' | 'timeline'
      const absTimelineHorizon  = Vue.ref(3)   // 1 | 3 | 6 months
      const absTimelineOffset   = Vue.ref(0)   // months from today
      const absTimelinePlanning = Vue.ref(false) // false=review, true=planning

      // ── Absence colour map ───────────────────────────────────────────
      const ABS_COLOURS = {
        vacation:   { bg: '#0ea5e9', label: 'Vacation'   },
        sick_leave: { bg: '#ef4444', label: 'Sick leave' },
        conference: { bg: '#10b981', label: 'Conference' },
        training:   { bg: '#8b5cf6', label: 'Training'   },
        personal:   { bg: '#64748b', label: 'Personal'   },
        other:      { bg: '#94a3b8', label: 'Other'      },
      }

      // ── Staff rows for timeline ──────────────────────────────────────
      // Review: only staff with absences in horizon
      // Planning: all active staff
      const absTimelineStaff = Vue.computed(() => {
        const months   = getHorizonMonths(absTimelineHorizon.value, absTimelineOffset.value)
        if (!months.length) return { attendings: [], residents: [] }
        const hStart   = new Date(months[0].year, months[0].month, 1)
        const hEnd     = new Date(months[months.length-1].year, months[months.length-1].month + 1, 0)
        const allStaff = (medicalStaff.value || []).filter(s => s.employment_status !== 'inactive')

        // In Review mode: only show active/planned absences (skip returned_to_duty)
        const relevantAbsences = (absences.value || []).filter(a =>
          !['returned_to_duty', 'cancelled'].includes(a.current_status)
        )

        const hasAbsInHorizon = (staffId) =>
          relevantAbsences.some(a => {
            const s = new Date(a.start_date + 'T00:00:00')
            const e = new Date((a.end_date || a.start_date) + 'T00:00:00')
            return a.staff_member_id === staffId && s <= hEnd && e >= hStart
          })

        const eligible = absTimelinePlanning.value
          ? allStaff
          : allStaff.filter(s => hasAbsInHorizon(s.id))

        const attendings = eligible.filter(s => !isResidentType(s.staff_type))
        const residents  = eligible.filter(s =>  isResidentType(s.staff_type))
        return { attendings, residents }
      })

      // ── Get absence bars for one staff member in the horizon ─────────
      const getStaffAbsencesInHorizon = (staffId) => {
        const months = getHorizonMonths(absTimelineHorizon.value, absTimelineOffset.value)
        if (!months.length) return []
        const hStart = new Date(months[0].year, months[0].month, 1)
        const hEnd   = new Date(months[months.length-1].year, months[months.length-1].month + 1, 0)
        return (absences.value || []).filter(a => {
          if (a.staff_member_id !== staffId) return false
          if (['returned_to_duty', 'cancelled'].includes(a.current_status)) return false
          const s = new Date(a.start_date + 'T00:00:00')
          const e = new Date((a.end_date || a.start_date) + 'T00:00:00')
          return s <= hEnd && e >= hStart
        })
      }

      // ── Bar style (reuses rotation logic exactly) ────────────────────
      const getAbsenceBarStyle = (absence) => {
        const months    = getHorizonMonths(absTimelineHorizon.value, absTimelineOffset.value)
        const n         = months.length
        if (!n) return { display: 'none' }
        const hStart    = new Date(months[0].year, months[0].month, 1)
        const hEnd      = new Date(months[n-1].year, months[n-1].month + 1, 0)
        const absStart  = new Date(absence.start_date + 'T00:00:00')
        const absEnd    = new Date((absence.end_date || absence.start_date) + 'T00:00:00')
        const cs        = absStart < hStart ? hStart : absStart
        const ce        = absEnd   > hEnd   ? hEnd   : absEnd
        if (cs > ce) return { display: 'none' }
        const totalDays = months.reduce((s, m) => s + m.daysInMonth, 0)
        const daysToStart = Math.round((cs - hStart) / 86400000)
        const daysToEnd   = Math.round((ce - hStart) / 86400000) + 1
        const leftPct   = (daysToStart / totalDays) * 100
        const widthPct  = ((daysToEnd - daysToStart) / totalDays) * 100
        const clippedL  = absStart < hStart
        const clippedR  = absEnd   > hEnd
        return {
          left:         `calc(${leftPct.toFixed(2)}% + ${clippedL ? '0' : '3'}px)`,
          width:        `calc(${widthPct.toFixed(2)}% - ${clippedL || clippedR ? '3' : '6'}px)`,
          background:   ABS_COLOURS[absence.absence_reason]?.bg || '#94a3b8',
          borderRadius: clippedL && clippedR ? '0' : clippedL ? '0 4px 4px 0' : clippedR ? '4px 0 0 4px' : '4px',
        }
      }

      // ── Coverage lane: attendings NOT absent per month ───────────────
      const absTimelineCoverage = Vue.computed(() => {
        const months     = getHorizonMonths(absTimelineHorizon.value, absTimelineOffset.value)
        const totalAtt   = (medicalStaff.value || []).filter(s =>
          !isResidentType(s.staff_type) && s.employment_status === 'active').length
        return months.map(m => {
          const mStart = new Date(m.year, m.month, 1)
          const mEnd   = new Date(m.year, m.month + 1, 0)
          const absentAtt = (absences.value || []).filter(a => {
            if (['returned_to_duty', 'cancelled'].includes(a.current_status)) return false
            if (isResidentType((medicalStaff.value || []).find(s => s.id === a.staff_member_id)?.staff_type)) return false
            const s = new Date(a.start_date + 'T00:00:00')
            const e = new Date((a.end_date || a.start_date) + 'T00:00:00')
            return s <= mEnd && e >= mStart
          }).length
          const available = Math.max(0, totalAtt - absentAtt)
          const pct       = totalAtt > 0 ? available / totalAtt : 1
          const state     = pct >= 0.7 ? 'ok' : pct >= 0.4 ? 'warn' : 'critical'
          return { ...m, available, total: totalAtt, pct, state }
        })
      })

      // ── Today position as % across the horizon ───────────────────────
      const absTimelineTodayPct = Vue.computed(() => {
        const months = getHorizonMonths(absTimelineHorizon.value, absTimelineOffset.value)
        if (!months.length) return -1
        const hStart     = new Date(months[0].year, months[0].month, 1)
        const hEnd       = new Date(months[months.length-1].year, months[months.length-1].month + 1, 0)
        const today      = new Date()
        if (today < hStart || today > hEnd) return -1
        const totalDays  = months.reduce((s, m) => s + m.daysInMonth, 0)
        const daysToday  = Math.round((today - hStart) / 86400000)
        return (daysToday / totalDays) * 100
      })

      // ── Horizon label (reuse rotation logic) ────────────────────────
      const getAbsHorizonLabel = () => {
        const months = getHorizonMonths(absTimelineHorizon.value, absTimelineOffset.value)
        if (!months.length) return ''
        if (months.length === 1) return `${months[0].label} ${months[0].year}`
        const first = months[0]; const last = months[months.length-1]
        if (first.year === last.year)
          return `${first.label} – ${last.label} ${last.year}`
        return `${first.label} ${first.year} – ${last.label} ${last.year}`
      }

      // ── 30-day coverage strip for absence ──
      const absCoverage30 = Vue.computed(() => {
        const days = []
        const total = medicalStaff.value.filter(s => s.employment_status === 'active').length
        for (let i = 0; i < 30; i++) {
          const d = new Date(); d.setDate(d.getDate() + i); d.setHours(0,0,0,0)
          const dateStr = Utils.normalizeDate(d)
          const absent = absences.value.filter(a => {
            const s = Utils.normalizeDate(a.start_date)
            const e = Utils.normalizeDate(a.end_date)
            return s <= dateStr && e >= dateStr &&
              a.current_status !== 'returned_to_duty' && a.current_status !== 'cancelled'
          }).length
          const available = Math.max(0, total - absent)
          const pct = total > 0 ? (available / total) : 1
          const label = d.toLocaleDateString('en-GB', { weekday:'short', day:'numeric', month:'short' })
          days.push({ date: dateStr, absent, available, pct, label, isToday: i === 0 })
        }
        return days
      })

      // ── Unit 30-day timeline ──
      const getUnit30DayTimeline = (unitId) => {
        const unit = trainingUnits.value.find(u => u.id === unitId)
        if (!unit) return []
        const days = []
        for (let i = 0; i < 30; i++) {
          const d = new Date(); d.setDate(d.getDate() + i)
          const dateStr = Utils.normalizeDate(d)
          const active = rotations.value.filter(r =>
            r.training_unit_id === unitId &&
            ['active','scheduled'].includes(r.rotation_status) &&
            Utils.normalizeDate(r.start_date) <= dateStr &&
            Utils.normalizeDate(r.end_date) >= dateStr
          ).length
          const full = active >= (unit.maximum_residents || 1)
          const isToday = i === 0
          days.push({ active, full, isToday })
        }
        return days
      }

      // ── Dept pulse bar stats ──
      const deptPulseStats = Vue.computed(() => {
        const today = Utils.normalizeDate(new Date())
        const active = medicalStaff.value.filter(s => s.employment_status === 'active').length
        const onLeave = absences.value.filter(a => {
          const s = Utils.normalizeDate(a.start_date)
          const e = Utils.normalizeDate(a.end_date)
          return s <= today && e >= today && a.current_status !== 'returned_to_duty'
        }).length
        const onCallToday = [...new Set(
          onCallSchedule.value
            .filter(s => Utils.normalizeDate(s.duty_date) === today)
            .map(s => s.primary_physician_id)
        )].length
        const rotationCount = rotations.value.filter(r => r.rotation_status === 'active').length
        return { active, onLeave, onCallToday, rotationCount }
      })


      // ══════════════════════════════════════════════════════════════
      //  ASK BAR — natural-language command bar (RAG / retrieval-based)
      //  Answers are composed from LIVE app data (on-call, trials,
      //  rotations, absences, pulse) — NOT generated by a language model.
      //  This keeps answers grounded and verifiable (no hallucination).
      //
      //  ┌─ FUTURE: LLM hook ──────────────────────────────────────────┐
      //  │ Later, an LLM can be layered on top to (a) parse fuzzier      │
      //  │ phrasing into intents and (b) phrase answers more naturally.  │
      //  │ The retrieval layer below would become the LLM's "tools" /    │
      //  │ context. See askBarResolve() for the exact slot-in point.     │
      //  │ Intentionally NOT implemented now — RAG/retrieval only.       │
      //  └──────────────────────────────────────────────────────────────┘
      // ══════════════════════════════════════════════════════════════
      const askBar = reactive({
        open: false,
        query: '',
        lastAsked: '',
        loading: false,
        thinking: null,    // string shown while it "thinks" (what it's checking)
        trace: [],         // live reasoning steps [{label, src, done}] — the agent feel
        turns: [],         // conversation history: [{ q, text, chips, actions, sources, followups, confidence, asOf, streaming }]
        context: null,     // remembered entity for follow-ups: { type:'staff', id, name, date }
        snoozed: [],       // dismissed alert keys (#16)
        entityMenu: null,  // #3 inline entity action popover { id, name, x, y }
        view: 'digest'     // 'digest' (proactive scan) | 'conversation'
      })

      // ── PROACTIVE SCAN ENGINE ─────────────────────────────────────────
      // Runs synthesis checks across live data and returns prioritized
      // alerts. This is what makes the surface "proactive" — it finds
      // problems before being asked. Pure retrieval, no LLM.
      const askBarScan = Vue.computed(() => {
        const alerts = []
        const within = (date, a) => {
          const d = Utils.normalizeDate(date), s = Utils.normalizeDate(a.start_date), e = Utils.normalizeDate(a.end_date)
          return d >= s && d <= e
        }
        try {
          // 1. On-call ↔ absence conflicts (HIGH)
          const absList = (absences.value || []).filter(a => !['returned_to_duty','cancelled'].includes(a.current_status))
          ;(onCallSchedule.value || []).forEach(shift => {
            const pid = shift.primary_physician_id || shift.backup_physician_id
            if (!pid) return
            const clash = absList.find(a => a.staff_member_id === pid && within(shift.duty_date, a))
            if (clash) alerts.push({ sev: 'high', title: `${getStaffName(pid)} is on-call ${Utils.formatDateShort(shift.duty_date)} but on leave that day`, detail: 'Conflict · on-call schedule × leave records', action: 'Reassign coverage', view: 'oncall_schedule', staffId: pid, resolve: 'reassign_oncall', _key: 'conflict-'+pid+'-'+Utils.normalizeDate(shift.duty_date) })
          })
          // 2. Coverage gaps (MED)
          ;(understaffedUnitAlerts.value || []).slice(0,3).forEach(g => {
            alerts.push({ sev: 'med', title: `${g.unitName} has a coverage gap`, detail: 'Understaffed · rotation units', action: 'Open schedule', view: 'oncall_schedule', resolve: 'reassign_oncall', _key: 'gap-'+(g.unitName||'u') })
          })
          // 3. Slow-recruiting trials (MED)
          ;(researchOps.clinicalTrials.value || []).forEach(t => {
            const e = researchOps.trialEnrollment ? researchOps.trialEnrollment(t) : null
            if (e && e.health === 'behind') alerts.push({ sev: 'med', title: `"${t.title}" recruiting slowly`, detail: `${e.actual} / ${e.target} enrolled · ${e.pct}% of target`, action: 'Open trial', view: 'research_hub', resolve: 'open_trial', trialId: t.id, _key: 'slow-'+t.id })
          })
          // 4. Residents with no supervisor on active rotation (MED)
          const unsup = (rotations.value || []).filter(r => r.rotation_status === 'active' && !r.supervising_attending_id)
          if (unsup.length) alerts.push({ sev: 'med', title: `${unsup.length} resident${unsup.length===1?'':'s'} with no assigned supervisor`, detail: unsup.slice(0,3).map(r => getStaffName(r.resident_id)).join(', ') + ' · active rotation', action: 'Assign supervisor', view: 'resident_rotations', resolve: 'assign_supervisor', _key: 'unsup' })
          // 5. Double-booked (primary === backup) (HIGH)
          ;(onCallSchedule.value || []).forEach(shift => {
            if (shift.primary_physician_id && shift.primary_physician_id === shift.backup_physician_id) {
              alerts.push({ sev: 'high', title: `${getStaffName(shift.primary_physician_id)} is both primary and backup on ${Utils.formatDateShort(shift.duty_date)}`, detail: 'Data issue · on-call schedule', action: 'Open schedule', view: 'oncall_schedule', staffId: shift.primary_physician_id, resolve: 'reassign_oncall', _key: 'dup-'+shift.primary_physician_id })
            }
          })
          // #11 More checks
          const todayIso = Utils.normalizeDate(new Date())
          const in30 = Utils.normalizeDate(new Date(Date.now() + 30*864e5))
          // 6. Trials past their target date but not complete
          ;(researchOps.clinicalTrials.value || []).forEach(t => {
            if (t.target_end_date && Utils.normalizeDate(t.target_end_date) < todayIso && researchOps.trialStatusKey && researchOps.trialStatusKey(t) !== 'done') {
              alerts.push({ sev: 'med', title: `"${t.title}" is past its target end date`, detail: `Target was ${Utils.formatDateShort(t.target_end_date)} · still open`, action: 'Open trial', view: 'research_hub', resolve: 'open_trial', trialId: t.id, _key: 'trial-late-'+t.id })
            }
          })
          // 7. Rotations ending within 30d with no successor scheduled for that unit
          ;(rotations.value || []).filter(r => r.rotation_status === 'active' && r.end_date && Utils.normalizeDate(r.end_date) <= in30).forEach(r => {
            const successor = (rotations.value || []).some(o => o.training_unit_id === r.training_unit_id && o.id !== r.id && o.start_date && Utils.normalizeDate(o.start_date) >= Utils.normalizeDate(r.end_date))
            if (!successor && r.training_unit_id) alerts.push({ sev: 'med', title: `${getStaffName(r.resident_id)}'s rotation ends soon with no successor`, detail: `Ends ${Utils.formatDateShort(r.end_date)} · no incoming resident`, action: 'Open rotations', view: 'resident_rotations', resolve: 'assign_supervisor', _key: 'rot-end-'+r.id })
          })

        } catch (e) { /* fail safe — empty scan */ }

        // #16 filter out snoozed alerts (by stable key)
        const snoozed = askBar.snoozed || []
        let live = alerts.filter(a => !snoozed.includes(a._key))

        // #12 severity scoring: high → med, and within tier keep insertion order
        const sevRank = { high: 0, med: 1, low: 2 }
        live.sort((a,b) => (sevRank[a.sev] ?? 9) - (sevRank[b.sev] ?? 9))

        // #20 root-cause grouping: if several alerts name the same person, tag them
        const nameCount = {}
        live.forEach(a => { if (a.staffId) nameCount[a.staffId] = (nameCount[a.staffId]||0)+1 })
        live.forEach(a => { if (a.staffId && nameCount[a.staffId] > 1) a._rootCause = getStaffName(a.staffId) })

        return live
      })
      const askBarScanCount = Vue.computed(() => askBarScan.value.length)
      const askBarNow = () => { const d = new Date(); return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }

      const askBarSuggestions = [
        { t: 'Anything I should worry about?',     d: 'Synthesis · conflicts & gaps', icon: 'gap',     intent: 'issues' },
        { t: "Who's on-call this weekend?",        d: 'Coverage · live schedule', icon: 'oncall',     intent: 'oncall_upcoming' },
        { t: 'Which trials are recruiting?',       d: 'Research · active studies', icon: 'research',  intent: 'trials_recruiting' },
        { t: "Draft today's briefing",             d: 'Ops · auto-compose',        icon: 'briefing',  intent: 'briefing' },
        { t: 'Who is absent right now?',           d: 'Coverage · today',          icon: 'absence',   intent: 'absent_now' }
      ]

      const openAskBar  = () => { askBar.open = true; askBar.view = askBarScanCount.value ? 'digest' : 'conversation' }
      const closeAskBar = () => { askBar.open = false; askBar.query = '' }
      const askBarToggleTeach = () => {
        askBar.view = askBar.view === 'teach' ? 'conversation' : 'teach'
        if (askBar.view === 'teach') loadBrain()
      }
      const askBarReset = () => { askBar.turns = []; askBar.context = null; askBar.view = askBarScanCount.value ? 'digest' : 'conversation' }
      const runSuggestion = (s) => { askBar.query = s.t; askBarResolve(s.intent) }
      const askBarSnooze = (alert) => {
        if (alert._key && !askBar.snoozed.includes(alert._key)) askBar.snoozed.push(alert._key)
      }
      const askBarAlertAction = (alert) => {
        // #15 deep-link + #18 safe act-on: route to the SPECIFIC resolution flow,
        // not just the view. These open a modal (a safe, confirmable action) rather
        // than performing a silent write.
        askBarLog('action', { label: alert.action, resolve: alert.resolve, title: alert.title })
        closeAskBar()
        Vue.nextTick(() => {
          try {
            if (alert.resolve === 'reassign_oncall' && typeof showAddOnCallModal === 'function') {
              switchView('oncall_schedule'); showAddOnCallModal()
            } else if (alert.resolve === 'assign_supervisor') {
              switchView('resident_rotations')
            } else if (alert.resolve === 'open_trial' && alert.trialId && researchOps.viewTrial) {
              switchView('research_hub')
              const t = (researchOps.clinicalTrials.value || []).find(x => x.id === alert.trialId)
              if (t) researchOps.viewTrial(t)
            } else if (alert.staffId) {
              askBarOpenStaff(alert.staffId)
            } else if (alert.view) {
              switchView(alert.view)
            }
          } catch (e) { if (alert.view) switchView(alert.view) }
        })
      }

      // ── Intent matcher: maps free text → a known intent (keyword RAG) ──
      // ── Batch 2 foundations ───────────────────────────────────────────
      // #8 Entity resolution — fuzzy match a name fragment to a staff member.
      // Detect which staff attribute a question asks about (phrasing-robust).
      const askBarDetectStaffAttr = (qRaw) => {
        const q = (qRaw || '').toLowerCase()
        if (/(phd|doctorate|doctoral)/.test(q)) return 'phd'
        if (/\btrials?\b|\bstudies\b|\bstudy\b/.test(q) && /(which|what|list|how many)/.test(q)) return null
        if (/(\bpi\b|principal investigator|can .* be .* investigator|lead .* trial|lead investigator)/.test(q)) return 'pi'
        if (/(certificate|certified|certification|cert\b|credential)/.test(q)) return 'certs'
        if (/(specialty|speciali[sz]ation|subspecialty|area of)/.test(q)) return 'specialty'
        if (/(email|phone|contact|reach|number)/.test(q)) return 'contact'
        if (/(residency|which year|what year|r[1-4]\b|training year)/.test(q)) return 'residency'
        if (/(supervise|supervisor|can .* supervise)/.test(q)) return 'supervise'
        if (/(license|licence|licensed)/.test(q)) return 'license'
        if (/(role|position|title|what (is|does) .* (do|role)|job)/.test(q)) return 'role'
        if (/(status|active|employed|still (here|working))/.test(q)) return 'status'
        return null
      }
      const askBarIsResident = (s) => {
        const t = (s?.staff_type || '').toLowerCase()
        return /resident|mir|r[1-4]/.test(t) || !!s?.residency_year_override || !!s?.training_year
      }

      // ── Metric engine (powers ranked + comparison queries) ──
      // Detect which measurable the question is about.
      const askBarDetectMetric = (q) => {
        if (/(trial|study|studies|enrol|recruit|pi\b|investigat)/.test(q)) return { key: 'trials', label: 'trials as PI', unit: '', source: 'research' }
        if (/(rotation|resident|supervis)/.test(q)) return { key: 'supervising', label: 'residents supervised', unit: '', source: 'rotations' }
        if (/(leave|absent|vacation|off\b)/.test(q)) return { key: 'leave', label: 'leave records', unit: '', source: 'leave records' }
        // default: on-call load
        return { key: 'shifts', label: 'on-call shifts', unit: '', source: 'on-call schedule' }
      }
      // Compute a person's value for a metric (null if not applicable).
      const askBarMetricValue = (s, key) => {
        if (!s) return null
        if (key === 'shifts') return (onCallSchedule.value || []).filter(x => x.primary_physician_id === s.id).length
        if (key === 'trials') return (researchOps.clinicalTrials.value || []).filter(t => t.principal_investigator_id === s.id).length
        if (key === 'supervising') return (rotations.value || []).filter(r => r.rotation_status === 'active' && r.supervising_attending_id === s.id).length
        if (key === 'leave') return (absences.value || []).filter(a => a.staff_member_id === s.id).length
        return null
      }
      // Extract up to two named people from a comparison query.
      // ── §3 Semantic Layer: extract a leave/absence Event from natural language ──
      // Maps to the real Joi enums: absence_type planned|unplanned,
      // absence_reason vacation|conference|sick_leave|training|personal|other.
      // ── §6 §7 §9 Leave-entry write flow: extract → (clarify reason) → propose → confirm → write ──
      const _reasonLabels = { vacation: 'vacation', conference: 'conference', sick_leave: 'sick leave', training: 'training', personal: 'personal', other: 'other' }
      const askBarStartLeaveFlow = (asked) => {
        const ex = askBarExtractLeave(asked)
        askBar.view = 'conversation'
        // Missing subject or dates → can't propose; ask plainly.
        if (!ex.subject) {
          askBar.turns.push(Vue.reactive({ q: asked, text: "I couldn't tell who this is for. Try naming the person, e.g. \u201cput Marcos on leave next Thursday.\u201d", chips: [], actions: [], sources: [], followups: [], confidence: 'low', asOf: askBarNow(), streaming: false }))
          return
        }
        if (!ex.start) {
          askBar.turns.push(Vue.reactive({ q: asked, text: `When is ${ex.subject.full_name} away? Give a day or range, e.g. \u201cnext Thursday and Friday.\u201d`, chips: [], actions: [], sources: [], followups: [], confidence: 'low', asOf: askBarNow(), streaming: false }))
          return
        }
        // Reason missing → CLARIFY before proposing (never guess a clinical fact).
        if (!ex.reason) {
          const pending = { subject: ex.subject, covering: ex.covering, start: ex.start, end: ex.end, type: ex.type }
          askBar.turns.push(Vue.reactive({
            q: asked,
            text: `What type of leave is this for ${ex.subject.full_name}?`,
            chips: [], actions: [], sources: [], followups: [], confidence: 'high',
            leaveClarify: pending,
            leaveReasons: [ ['vacation','Vacation'], ['sick_leave','Sick'], ['conference','Conference'], ['training','Training'], ['personal','Personal'] ],
            asOf: askBarNow(), streaming: false
          }))
          return
        }
        askBarProposeLeave(ex)
      }

      // A reason chip was tapped on the clarify turn → now propose.
      const askBarPickLeaveReason = (pending, reason) => {
        askBarProposeLeave({ subject: pending.subject, covering: pending.covering, start: pending.start, end: pending.end, type: pending.type, reason })
      }

      // Build the structured PROPOSAL (§9) with inline on-call conflict check (§7).
      const askBarProposeLeave = (ex) => {
        // Days
        const s = new Date(ex.start), e = new Date(ex.end)
        const days = Math.max(1, Math.round((e - s) / 86400000) + 1)
        // On-call conflict: is the subject on duty on any day in the range?
        const conflicts = (onCallSchedule.value || []).filter(o => {
          if (o.primary_physician_id !== ex.subject.id) return false
          const d = Utils.normalizeDate(o.duty_date)
          return d >= ex.start && d <= ex.end
        }).map(o => Utils.normalizeDate(o.duty_date))
        const fmt = (iso) => { try { return new Date(iso).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }) } catch (e) { return iso } }
        const dateLabel = ex.start === ex.end ? fmt(ex.start) : `${fmt(ex.start)} – ${fmt(ex.end)}`
        const proposal = {
          kind: 'leave',
          subject: { id: ex.subject.id, name: ex.subject.full_name },
          reason: ex.reason, reasonLabel: _reasonLabels[ex.reason] || ex.reason,
          type: ex.type,
          start: ex.start, end: ex.end, days, dateLabel,
          covering: ex.covering ? { id: ex.covering.id, name: ex.covering.full_name } : null,
          conflicts
        }
        askBar.turns.push(Vue.reactive({
          q: '', text: '', proposal, chips: [], actions: [], sources: ['staff', 'leave records', 'on-call schedule'],
          followups: [], confidence: conflicts.length ? 'medium' : 'high', asOf: askBarNow(), streaming: false
        }))
      }

      // §6 EXECUTE: confirm tapped → write through the existing knowledge-layer capability.
      const askBarConfirmLeave = async (proposal, turn) => {
        turn.writing = true
        const body = {
          staff_member_id: proposal.subject.id,
          absence_type: proposal.type,
          absence_reason: proposal.reason,
          start_date: proposal.start,
          end_date: proposal.end,
          coverage_arranged: !!proposal.covering,
          covering_staff_id: proposal.covering ? proposal.covering.id : null,
          coverage_notes: proposal.covering ? `Covered by ${proposal.covering.name}` : ''
        }
        try {
          const saved = await API.request('/api/absence-records', { method: 'POST', body })
          turn.writing = false
          turn.committed = true
          // refresh local absence data so the rest of the app reflects it immediately
          try { absenceOps.loadAbsences() } catch (e) {}
          turn.commitText = `\u2713 Recorded: ${proposal.subject.name} \u2014 ${proposal.reasonLabel}, ${proposal.dateLabel}${proposal.covering ? `, covered by ${proposal.covering.name}` : ''}.`
        } catch (err) {
          turn.writing = false
          turn.commitError = (err && err.message) ? err.message : 'Could not save. Check permissions or try again.'
        }
      }
      const askBarCancelLeave = (turn) => { turn.cancelled = true }

      // ── §3 Extract an on-call assignment from natural language ──
      const askBarExtractOncall = (qRaw) => {
        const q = (qRaw || '').toLowerCase()
        // backup: "with X as backup", "backup Y"
        let backup = null
        const bM = q.match(/(?:backup|back-up|second)\s+(?:is\s+)?([a-zñáéíóú]+)/i) || q.match(/with\s+([a-zñáéíóú]+)\s+(?:as\s+)?backup/i)
        if (bM) backup = askBarResolveStaff(bM[1])
        // subject: strip verbs/oncall words/dates/backup, resolve remainder
        let subjectQ = q
          .replace(/\b(put|assign|schedule|book|set|add|give|make|cover|covering|takes?|does?|doing)\b/g, ' ')
          .replace(/\b(on call|on-call|oncall|duty|guardia|call|shift|for|the|is|as)\b/g, ' ')
          .replace(/(?:backup|back-up|second)\s+(?:is\s+)?[a-zñáéíóú]+/gi, ' ')
          .replace(/with\s+[a-zñáéíóú]+\s+(?:as\s+)?backup/gi, ' ')
          .replace(/\b(from|on|next|this|until|till|to|and)\b/g, ' ')
          .replace(/\b(mon|tue|wed|thu|fri|sat|sun)[a-z]*\b/g, ' ')
          .replace(/\d{1,4}[-/:]\d{1,2}([-/:]\d{1,4})?/g, ' ')
          .replace(/\s+/g, ' ').trim()
        const subject = askBarResolveStaff(subjectQ) || askBarResolveStaff(q)
        const dates = askBarExtractDates(q)
        return { subject, backup, start: dates.start, end: dates.end, raw: qRaw }
      }

      const askBarStartOncallFlow = (asked) => {
        const ex = askBarExtractOncall(asked)
        askBar.view = 'conversation'
        if (!ex.subject) {
          askBar.turns.push(Vue.reactive({ q: asked, text: "Who should be on call? Try naming them, e.g. \u201cput Antelo on call next Friday.\u201d", chips: [], actions: [], sources: [], followups: [], confidence: 'low', asOf: askBarNow(), streaming: false }))
          return
        }
        if (!ex.start) {
          askBar.turns.push(Vue.reactive({ q: asked, text: `Which day is ${ex.subject.full_name} on call? Give a date, e.g. \u201cnext Friday.\u201d`, chips: [], actions: [], sources: [], followups: [], confidence: 'low', asOf: askBarNow(), streaming: false }))
          return
        }
        askBarProposeOncall(ex)
      }

      const askBarProposeOncall = (ex) => {
        const fmt = (iso) => { try { return new Date(iso).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }) } catch (e) { return iso } }
        // §7 CONFLICT PREVENTION: is the subject on LEAVE on this day?
        const onLeave = (absences.value || []).filter(a => {
          if (a.staff_member_id !== ex.subject.id) return false
          const s = Utils.normalizeDate(a.start_date), e = Utils.normalizeDate(a.end_date)
          return ex.start >= s && ex.start <= e
        })
        // Already on call that day? (from local schedule)
        const already = (onCallSchedule.value || []).some(o => o.primary_physician_id === ex.subject.id && Utils.normalizeDate(o.duty_date) === ex.start)
        const proposal = {
          kind: 'oncall',
          subject: { id: ex.subject.id, name: ex.subject.full_name },
          backup: ex.backup ? { id: ex.backup.id, name: ex.backup.full_name } : null,
          date: ex.start, dateLabel: fmt(ex.start),
          blocked: onLeave.length > 0,
          alreadyOnCall: already,
          noBackup: !ex.backup,
          // §8 PROACTIVE: if blocked, the Workforce Agent suggests who CAN cover instead.
          alternatives: (onLeave.length > 0)
            ? askBarWorkforceAvailable(ex.start, { excludeId: ex.subject.id }).slice(0, 3)
            : []
        }
        askBar.turns.push(Vue.reactive({
          q: '', text: '', oncallProposal: proposal, chips: [], actions: [],
          sources: ['staff', 'on-call schedule', 'leave records'], followups: [],
          confidence: proposal.blocked ? 'low' : (proposal.noBackup ? 'medium' : 'high'),
          asOf: askBarNow(), streaming: false
        }))
      }

      const askBarConfirmOncall = async (proposal, turn) => {
        turn.writing = true
        const body = {
          duty_date: proposal.date,
          primary_physician_id: proposal.subject.id,
          shift_type: 'primary_call',
          start_time: '08:00',
          end_time: '08:00',
          backup_physician_id: proposal.backup ? proposal.backup.id : null,
          coverage_notes: proposal.backup ? `Backup: ${proposal.backup.name}` : ''
        }
        try {
          await API.request('/api/oncall', { method: 'POST', body })
          turn.writing = false; turn.committed = true
          try { onCallOps.loadOnCallSchedule() } catch (e) {}
          turn.commitText = `\u2713 ${proposal.subject.name} is on call ${proposal.dateLabel}${proposal.backup ? `, backup ${proposal.backup.name}` : ''}.`
        } catch (err) {
          turn.writing = false
          const msg = (err && err.message) ? err.message : 'Could not save.'
          turn.commitError = /already exists|duplicate/i.test(msg) ? `There's already a primary on call that day. ${msg}` : msg
        }
      }
      const askBarCancelOncall = (turn) => { turn.cancelled = true }
      // §8 Pick a suggested replacement → re-propose the on-call for that person.
      const askBarPickReplacement = (alt, forDate, oldTurn) => {
        oldTurn.cancelled = true
        const person = (medicalStaff.value || []).find(s => s.id === alt.id)
        if (person) askBarProposeOncall({ subject: person, backup: null, start: forDate, end: forDate })
      }

      // ══ §6 ROTA DRAFTING — first "prepare work" capability (batch on-call) ══
      const askBarStartRotaDraft = (asked) => {
        askBar.view = 'conversation'
        const today = new Date()
        const q = (asked || '').toLowerCase()
        const base = new Date(today)
        const dow = base.getDay()
        const toMon = ((1 - dow) + 7) % 7 || 7
        const monday = new Date(base)
        monday.setDate(base.getDate() + (/this week/.test(q) ? (dow === 0 ? 1 : 1 - dow) : toMon))
        const iso = (d) => Utils.normalizeDate(d)
        const days = []
        const draftLoad = {}
        for (let i = 0; i < 7; i++) {
          const d = new Date(monday); d.setDate(monday.getDate() + i)
          const dISO = iso(d)
          let pool = askBarWorkforceAvailable(dISO)
          pool = pool.map(p => ({ ...p, weighted: p.shifts + (draftLoad[p.id] || 0) })).sort((a, b) => a.weighted - b.weighted)
          const pick = pool[0] || null
          if (pick) draftLoad[pick.id] = (draftLoad[pick.id] || 0) + 1
          days.push({
            date: dISO,
            label: d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }),
            assignee: pick ? { id: pick.id, name: pick.name } : null,
            options: pool.slice(0, 4).map(p => ({ id: p.id, name: p.name }))
          })
        }
        const gaps = days.filter(d => !d.assignee).length
        const rangeLabel = `${days[0].label} – ${days[6].label}`
        askBar.turns.push(Vue.reactive({
          q: '', text: '', rotaDraft: { days, rangeLabel, gaps },
          chips: [], actions: [], sources: ['staff', 'on-call schedule', 'leave records'],
          followups: [], confidence: gaps ? 'medium' : 'high', asOf: askBarNow(), streaming: false
        }))
      }

      const askBarRotaSwap = (draft, dayIdx) => {
        const day = draft.days[dayIdx]
        if (!day.options || day.options.length < 2) return
        const curIdx = day.assignee ? day.options.findIndex(o => o.id === day.assignee.id) : -1
        const next = day.options[(curIdx + 1) % day.options.length]
        day.assignee = { id: next.id, name: next.name }
      }

      const askBarConfirmRota = async (draft, turn) => {
        turn.writing = true
        const shifts = draft.days.filter(d => d.assignee).map(d => ({
          duty_date: d.date, primary_physician_id: d.assignee.id,
          shift_type: 'primary_call', start_time: '15:00', end_time: '08:00'
        }))
        if (!shifts.length) { turn.writing = false; turn.commitError = 'Nothing to save — every day is unfilled.'; return }
        try {
          const res = await API.request('/api/oncall/batch', { method: 'POST', body: { shifts } })
          turn.writing = false; turn.committed = true
          try { onCallOps.loadOnCallSchedule() } catch (e) {}
          const n = (res && res.count) ? res.count : shifts.length
          turn.commitText = `\u2713 Rota published: ${n} shift${n===1?'':'s'} for ${draft.rangeLabel}.`
        } catch (err) {
          turn.writing = false
          const msg = (err && err.message) ? err.message : 'Could not save.'
          turn.commitError = /duplicate|already/i.test(msg) ? 'Some days already have a primary on call — clear those first, then retry.' : msg
        }
      }
      const askBarCancelRota = (turn) => { turn.cancelled = true }

      // ══ §6 RETURN FROM LEAVE — close an open absence ══
      const askBarStartReturnFlow = (asked) => {
        askBar.view = 'conversation'
        const person = askBarResolveStaff(asked.replace(/\b(is |back|returned?|to|duty|work|no longer|on leave|absent|off|the)\b/gi, ' '))
                    || askBarResolveStaff(asked)
        if (!person) {
          askBar.turns.push(Vue.reactive({ q: asked, text: "Who's back? Name the person, e.g. \u201cMarcos is back.\u201d", chips: [], actions: [], sources: [], followups: [], confidence: 'low', asOf: askBarNow(), streaming: false }))
          return
        }
        // find their open absence
        const open = (absences.value || []).filter(a => a.staff_member_id === person.id && !['returned_to_duty','cancelled'].includes(a.current_status))
        if (!open.length) {
          askBar.turns.push(Vue.reactive({ q: asked, text: `${person.full_name} doesn't have an open leave record to close.`, chips: [], actions: [{ label: 'Open leave', view: 'staff_absence' }], sources: ['leave records'], followups: [], confidence: 'high', asOf: askBarNow(), streaming: false }))
          return
        }
        const rec = open.sort((a,b) => Utils.normalizeDate(b.start_date).localeCompare(Utils.normalizeDate(a.start_date)))[0]
        const fmt = (d) => { try { return new Date(d).toLocaleDateString('en-GB', { weekday:'short', day:'numeric', month:'short' }) } catch(e){ return d } }
        askBar.turns.push(Vue.reactive({
          q: '', text: '', returnProposal: {
            id: rec.id, name: person.full_name,
            reason: formatAbsenceReason ? formatAbsenceReason(rec.absence_reason) : rec.absence_reason,
            was: `${fmt(rec.start_date)} – ${fmt(rec.end_date)}`, today: Utils.normalizeDate(new Date())
          },
          chips: [], actions: [], sources: ['leave records'], followups: [], confidence: 'high', asOf: askBarNow(), streaming: false
        }))
      }
      const askBarConfirmReturn = async (proposal, turn) => {
        turn.writing = true
        try {
          await API.request(`/api/absence-records/${proposal.id}/return`, { method: 'PUT', body: { return_date: proposal.today } })
          turn.writing = false; turn.committed = true
          try { absenceOps.loadAbsences() } catch (e) {}
          turn.commitText = `\u2713 ${proposal.name} marked back on duty as of today.`
        } catch (err) {
          turn.writing = false
          turn.commitError = (err && err.message) ? err.message : 'Could not update.'
        }
      }
      const askBarCancelReturn = (turn) => { turn.cancelled = true }

      // ══ §6 ROTATION ASSIGNMENT — put a resident in a unit under a supervisor ══
      const askBarStartRotationFlow = (asked) => {
        askBar.view = 'conversation'
        const q = asked.toLowerCase()
        // supervisor: "under X", "supervised by X", "with X"
        let supervisor = null
        const sM = q.match(/(?:under|supervised by|with)\s+([a-zñáéíóú]+)/i)
        if (sM) supervisor = askBarResolveStaff(sM[1])
        // unit: match a training-unit name mentioned — handle Spanish names + aliases
        const units = (trainingUnits.value || []).filter(u => (u.unit_status || 'active') !== 'inactive')
        const _norm = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        // common English→department aliases mapping to real unit-name fragments
        const UNIT_ALIASES = [
          [/\b(icu|intensive care)\b/, 'uci'], [/\b(sleep|sleep lab)\b/, 'sueño'],
          [/\b(ward|hospitali[sz]ation|inpatient)\b/, 'hospitaliz'], [/\bpft|lung function|respiratory function\b/, 'pfr'],
          [/\bthoracic surgery\b/, 'torácica'], [/\btransplant\b/, 'trasplante'],
          [/\bcardiology\b/, 'cardiolog'], [/\bradiology\b/, 'radiolog'],
          [/\binternal medicine\b/, 'interna'], [/\bbronch\w*\b/, 'broncopleural'],
          [/\bexternal\b/, 'externa'], [/\bsevere asthma\b/, 'asma']
        ]
        let unit = units.find(u => _norm(q).includes(_norm(u.unit_name)))  // direct name match
        if (!unit) {  // alias match
          for (const [rx, frag] of UNIT_ALIASES) {
            if (rx.test(q)) { unit = units.find(u => _norm(u.unit_name).includes(frag)); if (unit) break }
          }
        }
        if (!unit) {  // loose: any significant unit word appears in the query
          unit = units.find(u => _norm(u.unit_name).split(/\s+/).some(w => w.length > 3 && _norm(q).includes(w)))
        }
        // resident: strip supervisor PHRASE first, then unit, then filler words
        let rq = q
          .replace(/(?:under|supervised by|with)\s+[a-zñáéíóú]+/gi, ' ')
          .replace(/\b(icu|ward|sleep lab|sleep|clinic|bronch\w*)\b/g, ' ')
          .replace(/\b(put|assign|place|move|rotate|schedule|in|the|rotation|to|for|next|this|from|on|and)\b/g, ' ')
          .replace(/\b(mon|tue|wed|thu|fri|sat|sun)[a-z]*\b/g, ' ')
          .replace(/\s+/g,' ').trim()
        const resident = askBarResolveStaff(rq) || (function(){
          const r = askBarResolveStaff(q)
          return (r && supervisor && r.id === supervisor.id) ? null : r
        })()
        const dates = askBarExtractDates(q)
        if (!resident) { askBar.turns.push(Vue.reactive({ q: asked, text: "Which resident? Name them, e.g. \u201cput Santalla in the ICU rotation under Antelo.\u201d", chips: [], actions: [], sources: [], followups: [], confidence: 'low', asOf: askBarNow(), streaming: false })); return }
        if (!unit) { askBar.turns.push(Vue.reactive({ q: asked, text: `Which unit should ${resident.full_name} rotate into? (e.g. ICU, Sleep Lab)`, chips: [], actions: [{ label: 'Open units', view: 'training_units' }], sources: ['units'], followups: [], confidence: 'low', asOf: askBarNow(), streaming: false })); return }
        // supervisor eligibility check (must be able to supervise)
        const supOk = supervisor && (supervisor.can_supervise_residents !== false) && isOnCallEligible(supervisor.staff_type)
        // unit capacity check
        const activeInUnit = (rotations.value || []).filter(r => r.rotation_status === 'active' && r.training_unit_id === unit.id).length
        const cap = unit.maximum_residents || 5
        const fmt = (d) => { try { return new Date(d).toLocaleDateString('en-GB',{day:'numeric',month:'short'}) } catch(e){ return d } }
        askBar.turns.push(Vue.reactive({
          q: '', text: '', rotationProposal: {
            resident: { id: resident.id, name: resident.full_name },
            unit: { id: unit.id, name: unit.unit_name },
            supervisor: supervisor ? { id: supervisor.id, name: supervisor.full_name } : null,
            supWarn: supervisor && !supOk,
            noSup: !supervisor,
            start: dates.start, end: dates.end,
            startLabel: dates.start ? fmt(dates.start) : null,
            atCapacity: activeInUnit >= cap, occ: `${activeInUnit}/${cap}`
          },
          chips: [], actions: [], sources: ['staff','units','rotations'], followups: [],
          confidence: (!supervisor || activeInUnit >= cap) ? 'medium' : 'high', asOf: askBarNow(), streaming: false
        }))
      }
      const askBarConfirmRotation = async (p, turn) => {
        if (p.noSup || p.supWarn || !p.start) return  // guardrails: need valid supervisor + dates
        turn.writing = true
        const body = {
          resident_id: p.resident.id, training_unit_id: p.unit.id,
          supervising_attending_id: p.supervisor.id,
          start_date: p.start, end_date: p.end || p.start,
          rotation_status: 'scheduled', rotation_category: 'clinical_rotation'
        }
        try {
          await API.request('/api/rotations', { method: 'POST', body })
          turn.writing = false; turn.committed = true
          try { if (rotationOps && rotationOps.loadRotations) rotationOps.loadRotations() } catch (e) {}
          turn.commitText = `\u2713 ${p.resident.name} scheduled in ${p.unit.name} under ${p.supervisor.name}.`
        } catch (err) {
          turn.writing = false
          turn.commitError = (err && err.message) ? err.message : 'Could not save.'
        }
      }
      const askBarCancelRotation = (turn) => { turn.cancelled = true }

      const askBarExtractLeave = (qRaw) => {
        const q = (qRaw || '').toLowerCase()
        // 1. Reason (null if not stated → caller asks the clarify question)
        let reason = null, type = 'planned'
        if (/\b(sick|ill|unwell|off sick|sick leave)\b/.test(q)) { reason = 'sick_leave'; type = /today|now|called in|emergency/.test(q) ? 'unplanned' : 'planned' }
        else if (/\b(conference|congress|symposium)\b/.test(q)) reason = 'conference'
        else if (/\b(training|course|workshop|teaching)\b/.test(q)) reason = 'training'
        else if (/\b(vacation|holiday|annual leave|leave|off|away|absent)\b/.test(q)) reason = 'vacation'
        // 2. Covering person ("X covers", "covered by X", "Y is covering")
        let covering = null
        const covM = q.match(/(?:cover(?:ed|ing|s)?(?:\s+by)?|backup|replace[sd]?\s+by)\s+([a-zñáéíóú]+)/i)
        if (covM) covering = askBarResolveStaff(covM[1])
        // 3. Subject person — strip verbs/reason/coverage words, resolve the remainder
        let subjectQ = q
          .replace(/\b(put|mark|record|register|set|book|schedule|add|log)\b/g, ' ')
          .replace(/\b(on leave|off sick|off|absent|leave|vacation|holiday|sick|conference|congress|training|course|out|away)\b/g, ' ')
          .replace(/(?:cover(?:ed|ing|s)?(?:\s+by)?|backup|replace[sd]?\s+by)\s+[a-zñáéíóú]+/gi, ' ')
          .replace(/\b(from|on|next|this|until|till|to|the|and|is|going|for)\b/g, ' ')
          .replace(/\b(mon|tue|wed|thu|fri|sat|sun)[a-z]*\b/g, ' ')
          .replace(/\d{1,4}[-/]\d{1,2}([-/]\d{1,4})?/g, ' ')
          .replace(/\s+/g, ' ').trim()
        const subject = askBarResolveStaff(subjectQ) || askBarResolveStaff(q)
        // 4. Dates — parse a range or single day (deterministic clean-path)
        const dates = askBarExtractDates(q)
        return { subject, reason, type, covering, start: dates.start, end: dates.end, raw: qRaw }
      }

      // Deterministic date parsing for the clean path: weekday names, next/this,
      // "X to Y", explicit ISO dates. Returns {start,end} ISO or nulls.
      const askBarExtractDates = (q) => {
        const today = new Date()
        const iso = (d) => Utils.normalizeDate(d)
        const WD = { sun:0, sunday:0, mon:1, monday:1, tue:2, tuesday:2, wed:3, wednesday:3, thu:4, thursday:4, thur:4, fri:5, friday:5, sat:6, saturday:6 }
        // explicit ISO dates first
        const isos = (q.match(/\d{4}-\d{2}-\d{2}/g) || [])
        if (isos.length) return { start: isos[0], end: isos[isos.length - 1] }
        // collect weekday mentions in order
        const found = []
        const re = /\b(next|this)?\s*(sun|mon|tue|tues|wed|thu|thur|thurs|fri|sat)[a-z]*\b/g
        let m
        while ((m = re.exec(q)) !== null) {
          const wd = WD[m[2].slice(0,3)] ?? WD[m[2]]
          if (wd === undefined) continue
          const base = new Date(today)
          let delta = (wd - base.getDay() + 7) % 7
          if (delta === 0) delta = 7            // "thursday" = the coming thursday
          if (/next/.test(m[1] || '')) { if (delta <= 7) delta += 0 } // "next thu" ~ coming thu (kept simple)
          const d = new Date(base); d.setDate(base.getDate() + delta)
          found.push(iso(d))
        }
        if (found.length) return { start: found[0], end: found[found.length - 1] }
        // "tomorrow" / "today"
        if (/\btomorrow\b/.test(q)) { const d = new Date(today); d.setDate(today.getDate()+1); return { start: iso(d), end: iso(d) } }
        if (/\btoday\b/.test(q)) return { start: iso(today), end: iso(today) }
        return { start: null, end: null }
      }

      const askBarExtractTwoNames = (qRaw) => {
        const q = (qRaw || '').toLowerCase()
        // split on connectors, resolve each side
        const parts = q.split(/\b(?:or|and|vs\.?|versus|,)\b/).map(p => p.trim()).filter(Boolean)
        const found = []
        const seen = new Set()
        for (const part of parts) {
          const person = askBarResolveStaff(part)
          if (person && !seen.has(person.id)) { seen.add(person.id); found.push(person) }
          if (found.length === 2) break
        }
        // fallback: scan whole query for any two distinct staff by surname token
        if (found.length < 2) {
          const staff = medicalStaff.value || []
          for (const s of staff) {
            const toks = (s.full_name||'').toLowerCase().split(/\s+/).filter(w=>w.length>2)
            if (toks.some(t => q.includes(t)) && !seen.has(s.id)) { seen.add(s.id); found.push(s) }
            if (found.length === 2) break
          }
        }
        return found
      }

      // Levenshtein distance for typo tolerance (bounded, cheap for short words).
      const _lev = (a, b) => {
        a = a || ''; b = b || ''
        if (Math.abs(a.length - b.length) > 3) return 99
        const m = a.length, n = b.length
        if (!m) return n; if (!n) return m
        let prev = Array.from({ length: n + 1 }, (_, i) => i)
        for (let i = 1; i <= m; i++) {
          const cur = [i]
          for (let j = 1; j <= n; j++) {
            cur[j] = a[i-1] === b[j-1] ? prev[j-1] : 1 + Math.min(prev[j-1], prev[j], cur[j-1])
          }
          prev = cur
        }
        return prev[n]
      }
      // Fuzzy token match: does query token approximately equal a name token?
      const _fuzzyHit = (qt, nameTok) => {
        if (nameTok.includes(qt) || qt.includes(nameTok)) return true
        const tol = qt.length <= 4 ? 1 : qt.length <= 7 ? 2 : 3
        return _lev(qt, nameTok) <= tol
      }

      // Returns all staff scored against the query, sorted best-first.
      const askBarRankStaffMatches = (qRaw) => {
        let q = (qRaw || '').toLowerCase()
          .replace(/[''']s\b/g, '')
          .replace(/[?.,!;:()"']/g, ' ')
          .replace(/\b(dr|dra|doctor|doctora)\.?\b/g, '')
          .replace(/\s+/g, ' ').trim()
        if (q.length < 3) return []
        const STOP = new Set(['on','call','oncall','today','tomorrow','leave','absent','off','who','is','are','the','of','a','an','for','in','this','week','weekend','month','rotation','shift','schedule','duty','guardia','cover','backup','best','draft','write','note','email','message','and','not','with','their','his','her','trials','trial','studies','study','pi','investigator','lead','which','what','have','has','does','do','phd','certificate','certificates','specialty','can','be','year'])
        const staff = medicalStaff.value || []
        const nameTokens = new Set()
        staff.forEach(s => (s.full_name||'').toLowerCase().split(/\s+/).forEach(w => { if (w.length > 2) nameTokens.add(w) }))
        const candidateWords = q.split(/\s+/).filter(w => w.length > 2 && !STOP.has(w))
        const qt = candidateWords.filter(w => nameTokens.has(w) || [...nameTokens].some(nt => _fuzzyHit(w, nt)))
        if (!qt.length) {
          const compact = q.replace(/\s+/g,'')
          const hit = staff.find(s => (s.full_name||'').toLowerCase().replace(/\s+/g,'').includes(compact))
          return (compact.length >= 5 && hit) ? [{ s: hit, score: 1 }] : []
        }
        const scored = []
        for (const s of staff) {
          const nameToks = (s.full_name || '').toLowerCase().split(/\s+/).filter(w => w.length > 2)
          let score = 0
          for (const t of qt) {
            if (nameToks.some(nt => nt.includes(t) || t.includes(nt))) score += 1
            else if (nameToks.some(nt => _fuzzyHit(t, nt))) score += 0.7
          }
          if (score >= 0.7) scored.push({ s, score })
        }
        scored.sort((a,b) => b.score - a.score)
        return scored
      }

      const askBarResolveStaff = (qRaw) => {
        const ranked = askBarRankStaffMatches(qRaw)
        return ranked.length ? ranked[0].s : null
      }

      // #7 Ambiguity: returns {person} if clear, or {ambiguous:[...]} if a tie.
      const askBarResolveStaffClarified = (qRaw) => {
        const ranked = askBarRankStaffMatches(qRaw)
        if (!ranked.length) return { person: null }
        // A tie = top two share the same score AND it's a meaningful match
        if (ranked.length >= 2 && ranked[0].score === ranked[1].score) {
          const tied = ranked.filter(r => r.score === ranked[0].score)
          if (tied.length >= 2) return { ambiguous: tied.map(r => r.s) }
        }
        return { person: ranked[0].s }
      }

      // #2 Temporal parsing — turn phrases into a {start,end} date window.
      const askBarParseRange = (qRaw) => {
        const q = (qRaw || '').toLowerCase()
        const d = new Date(); const iso = (x) => Utils.normalizeDate(x)
        const addDays = (base, n) => { const x = new Date(base); x.setDate(x.getDate() + n); return x }
        const today = new Date(d.getFullYear(), d.getMonth(), d.getDate())
        if (/today|hoy/.test(q)) return { start: iso(today), end: iso(today), label: 'today' }
        if (/tomorrow|mañana|manana/.test(q)) { const t = addDays(today,1); return { start: iso(t), end: iso(t), label: 'tomorrow' } }
        if (/this week|esta semana/.test(q)) { const day = today.getDay() || 7; return { start: iso(addDays(today, 1-day)), end: iso(addDays(today, 7-day)), label: 'this week' } }
        if (/next week|próxima semana|proxima semana/.test(q)) { const day = today.getDay() || 7; return { start: iso(addDays(today, 8-day)), end: iso(addDays(today, 14-day)), label: 'next week' } }
        if (/weekend|fin de semana/.test(q)) { const day = today.getDay(); const sat = addDays(today, (6-day+7)%7); return { start: iso(sat), end: iso(addDays(sat,1)), label: 'this weekend' } }
        if (/this month|este mes/.test(q)) { const s = new Date(d.getFullYear(), d.getMonth(), 1), e = new Date(d.getFullYear(), d.getMonth()+1, 0); return { start: iso(s), end: iso(e), label: 'this month' } }
        if (/this quarter|este trimestre/.test(q)) { const qm = Math.floor(d.getMonth()/3)*3; const s = new Date(d.getFullYear(), qm, 1), e = new Date(d.getFullYear(), qm+3, 0); return { start: iso(s), end: iso(e), label: 'this quarter' } }
        // named weekday → next occurrence
        const wd = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday']
        for (let i=0;i<7;i++){ if (q.includes(wd[i])) { const delta = (i - today.getDay() + 7) % 7 || 7; const t = addDays(today, delta); return { start: iso(t), end: iso(t), label: wd[i] } } }
        return null
      }

      // #3 / #7 retrieval helpers
      const askBarCountResidentsEndingBy = (endIso) => (rotations.value || []).filter(r => r.rotation_status === 'active' && r.end_date && Utils.normalizeDate(r.end_date) <= endIso).length
      const askBarOnCallLoad = () => {
        // #7 ranking: count upcoming shifts per physician
        const counts = {}
        ;(onCallSchedule.value || []).forEach(s => { const id = s.primary_physician_id; if (id) counts[id] = (counts[id]||0)+1 })
        return Object.entries(counts).map(([id,n]) => ({ id: Number(id), name: getStaffName(Number(id)), shifts: n })).sort((a,b) => b.shifts - a.shifts)
      }
      // #6 cross-domain join: PIs who are also on-call in a window
      const askBarPIsOnCall = (range) => {
        const piIds = new Set((researchOps.clinicalTrials.value || []).map(t => t.principal_investigator_id).filter(Boolean))
        const inWin = (s) => { const d = Utils.normalizeDate(s.duty_date); return range ? (d >= range.start && d <= range.end) : d >= Utils.normalizeDate(new Date()) }
        const hits = []
        ;(onCallSchedule.value || []).forEach(s => { if (s.primary_physician_id && piIds.has(s.primary_physician_id) && inWin(s)) { if (!hits.find(h=>h.id===s.primary_physician_id)) hits.push({ id: s.primary_physician_id, name: getStaffName(s.primary_physician_id), date: s.duty_date }) } })
        return hits
      }

      // Brain-driven concept detection: which concepts does this question contain?
      const askBarDetectConcepts = (qRaw) => {
        const q = (qRaw || '').toLowerCase()
        const brain = getBrain()
        const found = new Set()
        for (const [concept, words] of Object.entries(brain.concepts || {})) {
          if (Array.isArray(words) && words.some(w => q.includes(w.toLowerCase()))) found.add(concept)
        }
        return found
      }

      // Brain-driven intent match: evaluate each intent's match rules against
      // the detected concepts + phrase patterns. Returns the intent key or null.
      const askBarMatchFromBrain = (qRaw) => {
        const q = (qRaw || '').toLowerCase()
        const concepts = askBarDetectConcepts(qRaw)
        const brain = getBrain()
        for (const [intentKey, def] of Object.entries(brain.intents || {})) {
          const m = def.match || {}
          let ok = true
          // also_match_phrases: regex shortcuts that force a match
          if (def.also_match_phrases && def.also_match_phrases.some(p => { try { return new RegExp(p).test(q) } catch { return false } })) {
            return intentKey
          }
          if (m.all_concepts && !m.all_concepts.every(c => concepts.has(c))) ok = false
          if (ok && m.any_concept && !m.any_concept.some(c => concepts.has(c))) ok = false
          if (ok && m.with_concept && !m.with_concept.some(c => concepts.has(c))) ok = false
          // require at least one positive condition to have matched
          const hasCondition = m.all_concepts || m.any_concept
          if (ok && hasCondition) return intentKey
        }
        return null
      }

      // ══════════════════════════════════════════════════════════════
      //  ROUTING TABLE — the single source of truth for intent matching.
      //  Each row: { intent, patterns:[regex], priority, min }.
      //  The matcher scores every row and returns the best WITH a
      //  confidence, so low-confidence queries fall to clarify/unknown
      //  instead of being force-fit. Editable data, not scattered ifs.
      //  (Ordered by specificity; priority breaks score ties.)
      // ══════════════════════════════════════════════════════════════
      const ASKBAR_ROUTES = [
        // — WRITE intents (Level 2/3) — imperative verbs, very high priority —
        { intent: 'record_leave', priority: 120, patterns: [/(put|mark|record|register|set|book|schedule|add|log)\b.*(on leave|off|absent|leave|vacation|holiday|sick|conference|congress|training|course|out)\b/, /(on leave|off sick|absent|going on leave)\b.*(from|on|next|this|until|till)\b/], anti: [/who|which|list|how many|is\b.*\bon leave/] },
        { intent: 'record_oncall', priority: 121, patterns: [/(put|assign|schedule|book|set|add|give|make)\b.*(on call|on-call|oncall|duty|guardia|call)\b/, /(cover|covering|takes?|do(es|ing)?)\b.*(call|duty|guardia|shift)\b/], anti: [/who|which|list|how many|is\b.*\bon call|busiest|most|compare|rank|draft|week|rota/] },
        { intent: 'draft_rota', priority: 123, patterns: [/(draft|prepare|generate|build|make|plan|propose)\b.*(rota|on.?call schedule|call schedule|week.*call|weekly.*call)/, /(rota|on.?call).*(for )?(next|this|the) week/], anti: [/who|which|is\b/] },
        { intent: 'return_leave', priority: 122, patterns: [/\b(is )?back\b/, /returned?\b/, /back (to|on) (duty|work)/, /no longer (on leave|absent|off)/, /end.*leave early/], require: [/back|return|no longer|end/], anti: [/who|which|list|when.*back/] },
        { intent: 'assign_rotation', priority: 122, patterns: [/(put|assign|place|move|rotate|schedule)\b.*(rotation|rotat|in (the )?(icu|ward|unit|sleep|clinic))/, /(rotation|rotate).*(under|with|supervis)/], anti: [/who|which|list|how many|rotating where/] },
        // — Comparison & ranking (very specific) —
        { intent: 'compare_staff', priority: 100, patterns: [/\bcompare\b/, /(who has (more|less|fewer)|more than|busier|less busy).*\b(or|and|vs|versus)\b/, /\b(or|vs|versus)\b.*(more|less|busier|shifts|trials)/] },
        { intent: 'rank_staff', priority: 95, patterns: [/(busiest|fewest|least|lightest|heaviest|overloaded)/, /who has the (most|fewest|least)/, /\bmost\b.*(shift|call|trial|resident|load)/], anti: [/\bcompare\b/] },
        // — Newly-reachable entities (close the agent coverage gap) —
        { intent: 'hospitals_overview', priority: 77, patterns: [/\bhospitals?\b/, /which sites?/, /our sites?/, /hospital complex/, /where.*(located|sites)/] },
        { intent: 'callouts_overview', priority: 77, patterns: [/emergency callout/, /\bcallout/, /called in/, /emergency cover/, /urgent cover/] },
        { intent: 'announcements_overview', priority: 77, patterns: [/announcement/, /\bnotice/, /\bmemo\b/, /what.*(posted|announced)/, /department news/, /any news/] },
        { intent: 'coverage_areas_overview', priority: 77, patterns: [/coverage area/, /which areas/, /areas.*(cover|coverage)/, /cover(age)? zones?/] },
        { intent: 'ops_metrics_overview', priority: 76, patterns: [/ops metric/, /operational metric/, /\bkpi/, /department metric/, /how are we doing/, /metrics? (today|now)/] },
        // — Cross-cutting joins —
        { intent: 'units_at_capacity', priority: 90, patterns: [/units? at capacity/, /\bcapacity\b/, /full unit/, /units? full/, /occupancy/, /overcrowded/] },
        { intent: 'unsupervised_residents', priority: 90, patterns: [/unsupervised/, /without .* supervisor/, /no supervisor/, /residents? .* no supervisor/] },
        { intent: 'certs_expiring', priority: 88, patterns: [/(certificate|cert)s?.*(expir|due|lapse|renew)/, /expiring cert/, /whose cert/, /cert.*status/] },
        { intent: 'staff_can_pi', priority: 85, patterns: [/(who|which|how many).*(can be |be a |become )?(pi|principal investigator)\b/, /\bpi.eligible\b/, /eligible.*\bpi\b/] },
        { intent: 'staff_with_phd', priority: 85, patterns: [/(who|which|how many).*(phd|doctorate)/, /phd.*(staff|have|hold)/, /whose? .* phd/] },
        { intent: 'residents_by_year', priority: 85, patterns: [/(how many|number of).*resident/, /residents.*(do we have|are there|by year)/, /residents.*\br[1-4]\b/] },
        { intent: 'trials_by_person', priority: 84, patterns: [/(which|what|list).*(trials?|studies).*(pi|investigator|lead)/, /(trials?|studies).*(is|are)\s+\w+.*(pi|on|leading)/, /(trials?|studies).*(by|led by|of)\s+\w+/, /(what|which) trials?.*\bon\b/] },
        // — Entity overviews —
        { intent: 'rotations_deep', priority: 80, patterns: [/who.*rotating/, /which residents.*rotat/, /residents.*where/, /rotating where/, /under whom/] },
        { intent: 'departments_overview', priority: 78, patterns: [/\bdepartment/, /which dept/, /list.*department/] },
        { intent: 'research_lines', priority: 78, patterns: [/research line/, /research area/, /líneas?/, /lines of research/] },
        { intent: 'innovation_projects', priority: 78, patterns: [/innovation/, /\bpatent/, /prototype/, /proyecto/] },
        { intent: 'units_overview', priority: 76, patterns: [/training unit/, /clinical unit/, /which unit/, /what unit/, /our units/, /the units/, /units do we/, /list.*units/] },
        { intent: 'trials_overview', priority: 76, patterns: [/(how many|total|all).*(trial|study|studies)/, /(trial|study).*(overview|total|status)/] },
        // — Agent actions —
        { intent: 'recommend_backup', priority: 74, patterns: [/(best|who should|who could|recommend|suggest).*(backup|cover|replace|fill in)/, /(if|when).*(out|away|on leave|absent).*(who|cover|backup)/] },
        { intent: 'draft_email', priority: 74, patterns: [/(draft|write|compose).*(email|message|note|announcement|memo|letter)/, /(draft|write|compose)\b/] },
        { intent: 'count_rotations_ending', priority: 72, patterns: [/(how many|count|cuántos|number of).*(rotation)/], require: [/(end|finish|before|by|terminan|antes|soon)/] },
        { intent: 'rank_oncall', priority: 70, patterns: [/(most|busiest|overloaded|más).*(on-call|call|shift|guardia)/, /who.*(most|busiest).*call/] },
        { intent: 'pis_oncall', priority: 70, patterns: [/(pi|investigator|principal).*(on-call|call|guardia)/, /(on-call|call).*(pi|investigator)/] },
        // — Broad concept intents (lowest priority; catch-alls) —
        { intent: 'issues', priority: 40, patterns: [/conflict/, /problem/, /\bissue/, /wrong/, /double.book/, /clash/, /overlap/, /anything i should/, /concern/, /\brisk\b/, /attention/] },
        { intent: 'briefing', priority: 38, patterns: [/\bbrief/, /resumen/, /\bsummary\b/, /standup/, /stand-up/] },
        { intent: 'coverage_gaps', priority: 55, patterns: [/\bgap/, /understaff/, /uncovered/, /\bshort\b/, /sin cobertura/, /hueco/, /coverage gap/] },
        { intent: 'absent_now', priority: 34, patterns: [/absent/, /\bleave\b/, /\boff\b/, /vacation/, /baja/, /ausen/] },
        { intent: 'trials_recruiting', priority: 32, patterns: [/recruit/, /reclut/, /\btrial\b/, /\bstudy\b/, /studies/, /estudio/, /ensayo/] },
        { intent: 'oncall_upcoming', priority: 30, patterns: [/on-call/, /on call/, /oncall/, /guardia/, /\bduty\b/], anti: [/gap|uncovered|understaff|rotation|rotating/] },
        { intent: 'rotations_active', priority: 52, patterns: [/rotation/, /rotating/, /\bresident\b/, /supervis/, /\bevaluation\b/, /\brota\b/], anti: [/on-call|on call|guardia|draft|assign|put .* under/] }
      ]

      // Scored matcher: returns { intent, confidence } — confidence is 'high'
      // when a route matches strongly, 'low' when nothing does (→ unknown/clarify).
      const askBarMatchScored = (qRaw) => {
        const q = (qRaw || '').toLowerCase()
        // 1. Score the routing table (authoritative — specific, ordered, editable).
        let best = null
        for (const r of ASKBAR_ROUTES) {
          if (r.anti && r.anti.some(rx => rx.test(q))) continue
          if (r.require && !r.require.some(rx => rx.test(q))) continue
          const hits = r.patterns.filter(rx => rx.test(q)).length
          if (!hits) continue
          const score = r.priority + (hits - 1) * 2
          if (!best || score > best.priority) best = { intent: r.intent, priority: score }
        }
        // 2. If a strong route matched (priority >= 50), it wins outright.
        if (best && best.priority >= 50) return { intent: best.intent, confidence: 'high' }
        // 3. Otherwise let the brain (editable concepts) try — good for phrasings
        //    the routing table doesn't cover, incl. bilingual vocabulary.
        const fromBrain = askBarMatchFromBrain(qRaw)
        if (fromBrain) return { intent: fromBrain, confidence: 'high' }
        // 4. Fall back to the best weak route, if any.
        if (best) return { intent: best.intent, confidence: 'medium' }
        // 5. Nothing matched → unknown (triggers precise "I don't know").
        return { intent: 'unknown', confidence: 'low' }
      }

      const askBarMatchIntent = (qRaw) => askBarMatchScored(qRaw).intent

      const askBarMatchIntentLegacy = (qRaw) => {
        const q = (qRaw || '').toLowerCase()
        // Retained only for the fuzzy keyword-bucket fallback below.
        const buckets = {
          oncall_upcoming: ['call','duty','cover','guard','weekend','tonight','tomorrow'],
          absent_now: ['away','holiday','sick','out','leave','absence'],
          trials_recruiting: ['enrol','enroll','patient','participant','protocol','sponsor','study','studies'],
          coverage_gaps: ['gap','missing','empty','unfilled','hole','understaff'],
          briefing: ['today','update','status','happening','summary','overview'],
          issues: ['ok','fine','alright','worry','wrong','check','everything','safe']
        }
        let best = null, bestScore = 0
        for (const [intent, words] of Object.entries(buckets)) {
          const score = words.reduce((n, w) => n + (q.includes(w) ? 1 : 0), 0)
          if (score > bestScore) { bestScore = score; best = intent }
        }
        if (best && bestScore >= 1) return best
        return 'unknown'
      }

      // ── Retrieval: build an answer from real data for a given intent ──
      // (This is the "RAG" layer. A future LLM would call into these same
      //  retrievals as tools and phrase the result; not implemented now.)
      // Resolve a follow-up: detect pronouns/short refs that depend on
      // the remembered context (e.g. "is she also on leave?").
      const askBarResolveFollowup = (qRaw) => {
        const q = (qRaw || '').toLowerCase()
        const topicLeave = /(leave|absent|off|vacation|baja|ausen)/.test(q)
        const topicCall = /(on-call|on call|oncall|guardia|schedule|rota)/.test(q)
        const topicRot = /(rotation|supervis|rotación)/.test(q)
        const hasPronoun = /\b(she|he|her|him|they|them|same person|that person)\b|\b(también|tambien)\b/.test(q)
        // #8: try to resolve a NAMED person first (priority over pronoun/context).
        // Runs regardless of query length — only skipped when a pronoun is present.
        if ((topicLeave || topicCall || topicRot) && !hasPronoun) {
          const person = askBarResolveStaff(q)
          if (person) {
            askBar.context = { type: 'staff', id: person.id, name: person.full_name }
            if (topicLeave) return { kind: 'staff_leave', id: person.id, name: person.full_name }
            if (topicCall)  return { kind: 'staff_oncall', id: person.id, name: person.full_name }
            if (topicRot)   return { kind: 'staff_rotation', id: person.id, name: person.full_name }
          }
        }
        // Bare name with no topic/pronoun → summarize that person (works regardless of context).
        if (!hasPronoun && !topicLeave && !topicCall && !topicRot && askBarDetectConcepts(q).size === 0) {
          const res = askBarResolveStaffClarified(q)
          if (res.ambiguous) return { kind: 'clarify_staff', options: res.ambiguous, attr: askBarDetectStaffAttr(q) || null }
          if (res.person) {
            const person = res.person
            askBar.context = { type: 'staff', id: person.id, name: person.full_name }
            const attr = askBarDetectStaffAttr(q)
            if (attr) return { kind: 'staff_attr', id: person.id, name: person.full_name, attr }
            return { kind: 'staff_summary', id: person.id, name: person.full_name }
          }
        }
        // Named person + attribute even with other words (e.g. "does antelo have a phd?")
        {
          const attr = askBarDetectStaffAttr(q)
          if (attr && !hasPronoun) {
            const res = askBarResolveStaffClarified(q)
            if (res.ambiguous) return { kind: 'clarify_staff', options: res.ambiguous, attr }
            if (res.person) { askBar.context = { type: 'staff', id: res.person.id, name: res.person.full_name }; return { kind: 'staff_attr', id: res.person.id, name: res.person.full_name, attr } }
          }
          // pronoun + attribute → remembered person
          if (attr && hasPronoun && askBar.context && askBar.context.type === 'staff') {
            return { kind: 'staff_attr', id: askBar.context.id, name: askBar.context.name, attr }
          }
        }
        // pronoun / short reference → use remembered context
        if (!askBar.context) return null
        const ctx = askBar.context
        const refersToCtx = hasPronoun  // only true pronoun refs use remembered context
        if (!refersToCtx || ctx.type !== 'staff') return null
        if (topicLeave) return { kind: 'staff_leave', id: ctx.id, name: ctx.name }
        if (topicCall)  return { kind: 'staff_oncall', id: ctx.id, name: ctx.name }
        if (topicRot)   return { kind: 'staff_rotation', id: ctx.id, name: ctx.name }
        return null
      }

      // ── Batch 1: thinking states per intent (what it's checking) ──
      const askBarThinkingFor = (intent) => {
        const map = {
          issues: 'Cross-referencing schedule, leave & rotations…',
          briefing: 'Reading today’s duty, leave & coverage…',
          coverage_gaps: 'Checking unit staffing levels…',
          absent_now: 'Scanning leave records…',
          trials_recruiting: 'Reviewing trial enrollment…',
          oncall_upcoming: 'Reading the on-call schedule…',
          rotations_active: 'Checking active rotations…',
          staff_leave: 'Cross-referencing leave records…',
          staff_oncall: 'Reading the on-call schedule…',
          staff_rotation: 'Checking rotation assignments…'
        }
        return map[intent] || 'Pulling from live data…'
      }

      // Stream an answer's text into the turn, char-batched, so it feels alive.
      const askBarStreamTurn = (turn, fullText, done) => {
        turn.text = ''
        turn.streaming = true
        const step = Math.max(1, Math.round(fullText.length / 36)) // ~36 frames
        let i = 0
        const tick = () => {
          i = Math.min(fullText.length, i + step)
          turn.text = fullText.slice(0, i)
          Vue.nextTick(() => { const c = document.querySelector('.askbar-conv'); if (c) c.scrollTop = c.scrollHeight })
          if (i < fullText.length) { setTimeout(tick, 18) }
          else { turn.streaming = false; if (done) done() }
        }
        tick()
      }

      // ── Phase 1: permission map + audit (#37, #36) ──
      // Which module each intent reads from — used to gate answers by access.
      const askBarIntentModule = {
        oncall_upcoming: 'oncall_schedule', rank_oncall: 'oncall_schedule', pis_oncall: 'oncall_schedule',
        absent_now: 'staff_absence', staff_leave: 'staff_absence',
        staff_oncall: 'oncall_schedule', staff_rotation: 'resident_rotations',
        coverage_gaps: 'oncall_schedule', rotations_active: 'resident_rotations',
        count_rotations_ending: 'resident_rotations',
        trials_recruiting: 'clinical_trials', trials_overview: 'clinical_trials', trials_by_person: 'clinical_trials',
        research_lines: 'research_lines', innovation_projects: 'innovation_projects',
        staff_with_phd: 'medical_staff', staff_can_pi: 'medical_staff', residents_by_year: 'medical_staff',
        certs_expiring: 'medical_staff', units_overview: 'training_units', units_at_capacity: 'training_units',
        unsupervised_residents: 'resident_rotations', rotations_deep: 'resident_rotations', departments_overview: null,
        compare_staff: 'medical_staff', rank_staff: 'medical_staff',
        coverage_areas_overview: 'oncall_schedule', callouts_overview: 'oncall_schedule', hospitals_overview: null, clinical_units_overview: 'training_units', draft_rota: 'oncall_schedule', return_leave: 'staff_absence', assign_rotation: 'resident_rotations',
        announcements_overview: 'communications', ops_metrics_overview: 'communications',
        briefing: null, issues: null, unknown: null,  // synthesis/briefing span modules — allowed
        recommend_backup: null, draft_email: null  // agent synthesis — allowed (read multiple)
      }
      // Audit trail: every question asked + action taken (clinical accountability).
      const askBarAudit = Vue.ref([])
      const askBarLog = (type, detail) => {
        askBarAudit.value.push({ type, detail, at: new Date().toISOString(), user: currentUser.value?.full_name || 'unknown' })
        if (askBarAudit.value.length > 200) askBarAudit.value.shift()
      }

      // ══════════════════════════════════════════════════════════════
      //  AGENT LAYER (on RAG) — reasoning trace, recommendations,
      //  varied phrasing, drafting. Makes the deterministic engine FEEL
      //  like an agent: it shows real steps over real data, phrases
      //  naturally, and can recommend/draft — but never invents (every
      //  fact comes from retrieval; the "AI feel" is presentation).
      // ══════════════════════════════════════════════════════════════

      // Reasoning trace: the real steps the engine takes per intent.
      // Each step names what it checked + which data source (its "tools").
      const askBarTraceFor = (intent) => {
        // Brain first: if the intent defines a trace, use it.
        const bDef = (getBrain().intents || {})[intent]
        if (bDef && Array.isArray(bDef.trace) && bDef.trace.length) return bDef.trace
        // Fallback: legacy hardcoded traces
        const traces = {
          issues:          [['Reading the on-call schedule','on-call'], ['Cross-referencing leave records','leave'], ['Checking rotations & coverage','rotations'], ['Looking for conflicts','synthesis']],
          oncall_upcoming: [['Reading the on-call schedule','on-call'], ['Resolving physician names','staff']],
          absent_now:      [['Scanning leave records','leave'], ['Filtering to today','leave']],
          trials_recruiting:[['Reviewing trials','research'], ['Computing enrollment health','research']],
          coverage_gaps:   [['Checking unit staffing','rotations'], ['Comparing to expected levels','synthesis']],
          rank_oncall:     [['Reading the on-call schedule','on-call'], ['Counting shifts per physician','on-call'], ['Ranking by load','synthesis']],
          pis_oncall:      [['Pulling principal investigators','research'], ['Cross-referencing on-call','on-call'], ['Joining the two','synthesis']],
          count_rotations_ending:[['Reading active rotations','rotations'], ['Filtering by end date','rotations'], ['Counting','synthesis']],
          recommend_backup:[['Identifying who is out','on-call'], ['Finding eligible physicians','staff'], ['Removing anyone on leave','leave'], ['Ranking by call load','synthesis']],
          briefing:        [['Reading today’s duty','on-call'], ['Checking leave & coverage','leave'], ['Composing the briefing','synthesis']],
          staff_leave:     [['Looking up the person','staff'], ['Checking their leave','leave']],
          staff_oncall:    [['Looking up the person','staff'], ['Reading their shifts','on-call']],
          staff_rotation:  [['Looking up the person','staff'], ['Checking their rotation','rotations']]
        }
        return traces[intent] || [['Pulling from live data','data']]
      }

      // #41 varied phrasing — small pools so answers don't feel stamped.
      const _pick = (arr) => arr[Math.floor(Math.random() * arr.length)]
      const askBarLead = (kind) => {
        // Brain first: phrasing pools live in the brain (editable, growable).
        const bp = getBrain().phrasings || {}
        const brainKey = { found: 'found', none: 'none_found', rec: 'recommend_lead' }[kind]
        let lead
        if (brainKey && Array.isArray(bp[brainKey]) && bp[brainKey].length) lead = _pick(bp[brainKey])
        else {
          const pools = {
            found:   ['Here’s what I found:', 'Looking at the data:', 'From the records:'],
            none:    ['Nothing came up there.', 'I don’t see anything for that.', 'No matches in the data.'],
            rec:     ['I’d suggest', 'My recommendation:', 'Best option looks like']
          }
          lead = _pick(pools[kind] || [''])
        }
        // Builders append the name themselves — strip any {name} slot + tidy spacing.
        return lead.replace(/\s*\{name\}\s*/g, ' ').replace(/\s+/g, ' ').trim()
      }

      // Recommendation engine (#46-style reasoning, deterministic):
      // "if X is out, who's the best backup?" → rank eligible, not-on-leave
      // physicians by lightest call load.
      // ══ §5 WORKFORCE AGENT — reusable availability reasoning ══
      // "Who can be on call on <dutyDate>?" → eligible ∩ active ∩ not-excluded ∩
      // not-on-leave-that-day ∩ not-already-on-call, ranked by call load (fairness).
      // One core, reused by recommend_backup, the on-call block, and rota drafting.
      const askBarWorkforceAvailable = (dutyDate, opts = {}) => {
        const excludeId = opts.excludeId || null
        const norm = (d) => Utils.normalizeDate(d)
        const dd = dutyDate ? norm(dutyDate) : null
        const onLeaveThatDay = (id) => (absences.value || []).some(a =>
          a.staff_member_id === id &&
          !['returned_to_duty', 'cancelled'].includes(a.current_status) &&
          (!dd || (norm(a.start_date) <= dd && norm(a.end_date) >= dd)))
        const alreadyOnCall = (id) => dd && (onCallSchedule.value || []).some(o =>
          o.primary_physician_id === id && norm(o.duty_date) === dd)
        const load = {}
        ;(onCallSchedule.value || []).forEach(s => { if (s.primary_physician_id) load[s.primary_physician_id] = (load[s.primary_physician_id] || 0) + 1 })
        return (medicalStaff.value || [])
          .filter(s => s.employment_status === 'active' && isOnCallEligible(s.staff_type) && s.id !== excludeId && !onLeaveThatDay(s.id) && !alreadyOnCall(s.id))
          .map(s => ({ id: s.id, name: s.full_name, shifts: load[s.id] || 0 }))
          .sort((a, b) => a.shifts - b.shifts)
      }

      const askBarRecommendBackup = (qRaw) => {
        const q = (qRaw || '').toLowerCase()
        const outPerson = askBarResolveStaff(q)
        // who's out + which date
        let dutyDate = null, outId = outPerson?.id || null
        const range = askBarParseRange(q)
        const today = Utils.normalizeDate(new Date())
        // find the shift the "out" person holds (or just upcoming)
        const shifts = (onCallSchedule.value || []).filter(s => Utils.normalizeDate(s.duty_date) >= today)
        if (outId) { const sh = shifts.find(s => s.primary_physician_id === outId); if (sh) dutyDate = sh.duty_date }
        if (!dutyDate && range) dutyDate = range.start
        // Reuse the Workforce Agent core (eligible ∩ available ∩ not-on-leave, fair).
        const eligible = askBarWorkforceAvailable(dutyDate, { excludeId: outId })
        return { outName: outPerson?.full_name, dutyDate, eligible }
      }

      const askBarResolve = (forcedIntent) => {
        const asked = askBar.query.trim()
        if (!asked && !forcedIntent) return
        askBar.view = 'conversation'
        // #2 MULTI-INTENT: "is Antelo on call AND does she have a phd?" — if the
        // query splits into two clauses that each route to a DIFFERENT strong intent,
        // answer both in sequence. Guarded so normal "and" phrases aren't split.
        if (!forcedIntent && !askBar._multiGuard) {
          const parts = asked.split(/\s+(?:and|&|;)\s+/i).map(s => s.trim()).filter(s => s.length > 4)
          if (parts.length === 2) {
            const i0 = askBarMatchScored(parts[0]), i1 = askBarMatchScored(parts[1])
            const strong = (r) => r.confidence === 'high' && r.intent !== 'unknown'
            if (strong(i0) && strong(i1) && i0.intent !== i1.intent) {
              askBar._multiGuard = true
              askBar.query = parts[0]; askBarResolve()
              setTimeout(() => { askBar.query = parts[1]; askBarResolve(); askBar._multiGuard = false }, 900)
              return
            }
          }
        }
        // Determine intent. Priority:
        //  1. A forced intent (suggestion/chip click)
        //  2. A strong brain/legacy intent match (actions like draft, lookups like oncall)
        //  3. A context/entity follow-up (pronouns, bare names) — only if no strong intent
        let intent, followup = null
        if (forcedIntent) {
          intent = forcedIntent
        } else {
          const q = asked.toLowerCase()
          const hasPronoun = /\b(she|he|her|him|they|them|same person|that person)\b|\b(también|tambien)\b/.test(q)
          const hasTopic = /(leave|absent|off|vacation|baja|ausen|on-call|on call|oncall|guardia|rotation|supervis)/.test(q)
          // 1. Pronoun reference with remembered context → context follow-up
          if (hasPronoun && askBar.context) {
            followup = askBarResolveFollowup(asked)
          }
          // 1b. A specific staff attribute question ("does X have a phd?", "X's certificates")
          //     → resolve as a deep person-attribute query, before generic intents.
          if (!followup) {
            const attr = askBarDetectStaffAttr(q)
            if (attr) {
              const maybe = askBarResolveFollowup(asked)
              if (maybe && (maybe.kind === 'staff_attr' || maybe.kind === 'staff_summary' || maybe.kind === 'clarify_staff')) followup = maybe
            }
          }
          // 2. STRONG scored intent wins next — analytical intents (rank, compare,
          //    unsupervised, rotations_deep, etc.) must not be pre-empted by a
          //    greedy name grab. Only high-confidence routes qualify here.
          if (!followup) {
            const scored = askBarMatchScored(asked)
            if (scored.confidence === 'high' && scored.intent !== 'unknown') {
              intent = scored.intent
            }
          }
          // 3. Named person + a topic ("is antelo on leave?") → entity follow-up,
          //    ONLY if no strong intent claimed it, and not a draft/recommend verb.
          if (!followup && !intent && hasTopic && !hasPronoun && !/(draft|write|compose|best|recommend|suggest)/.test(q)) {
            const maybe = askBarResolveFollowup(asked)
            if (maybe && maybe.id) followup = maybe
          }
          // 4. Otherwise any intent match (medium confidence, catch-alls)
          if (!followup && !intent) {
            const matched = askBarMatchIntent(asked)
            if (matched && matched !== 'unknown') {
              intent = matched
            } else {
              // 5. No intent — try entity follow-up (bare name)
              followup = askBarResolveFollowup(asked)
            }
          }
          if (followup) intent = followup.kind
          else if (!intent) intent = 'unknown'
        }
        askBar.lastResolvedIntent = intent
        askBarLog('ask', { q: asked || `[${intent}]`, intent })
        // ── §6 WRITE path: leave entry needs create-permission and a propose→confirm flow ──
        if (intent === 'record_leave') {
          askBar.query = ''
          if (!hasPermission('staff_absence', 'write')) {
            askBar.loading = false; askBar.thinking = null
            askBar.turns.push(Vue.reactive({ q: asked, text: "You don't have permission to record leave. Ask an administrator for staff-absence create access.", chips: [], actions: [], sources: [], followups: [], confidence: 'low', asOf: askBarNow(), streaming: false }))
            return
          }
          askBarStartLeaveFlow(asked)
          return
        }
        if (intent === 'record_oncall') {
          askBar.query = ''
          if (!hasPermission('oncall_schedule', 'write')) {
            askBar.loading = false; askBar.thinking = null
            askBar.turns.push(Vue.reactive({ q: asked, text: "You don't have permission to schedule on-call. Ask an administrator for on-call create access.", chips: [], actions: [], sources: [], followups: [], confidence: 'low', asOf: askBarNow(), streaming: false }))
            return
          }
          askBarStartOncallFlow(asked)
          return
        }
        if (intent === 'draft_rota') {
          askBar.query = ''
          if (!hasPermission('oncall_schedule', 'write')) {
            askBar.loading = false; askBar.thinking = null
            askBar.turns.push(Vue.reactive({ q: asked, text: "You don't have permission to schedule on-call.", chips: [], actions: [], sources: [], followups: [], confidence: 'low', asOf: askBarNow(), streaming: false }))
            return
          }
          askBarStartRotaDraft(asked)
          return
        }
        if (intent === 'return_leave') {
          askBar.query = ''
          if (!hasPermission('staff_absence', 'write')) {
            askBar.loading = false; askBar.thinking = null
            askBar.turns.push(Vue.reactive({ q: asked, text: "You don't have permission to update leave records.", chips: [], actions: [], sources: [], followups: [], confidence: 'low', asOf: askBarNow(), streaming: false }))
            return
          }
          askBarStartReturnFlow(asked)
          return
        }
        if (intent === 'assign_rotation') {
          askBar.query = ''
          if (!hasPermission('resident_rotations', 'write')) {
            askBar.loading = false; askBar.thinking = null
            askBar.turns.push(Vue.reactive({ q: asked, text: "You don't have permission to assign rotations.", chips: [], actions: [], sources: [], followups: [], confidence: 'low', asOf: askBarNow(), streaming: false }))
            return
          }
          askBarStartRotationFlow(asked)
          return
        }
        // #37 permission-aware: if the intent's module is one the user can't read, decline.
        // Permission module: brain's intent.permission wins; else legacy map.
        const bIntent = (getBrain().intents || {})[intent]
        const mod = (bIntent && 'permission' in bIntent) ? bIntent.permission : askBarIntentModule[intent]
        if (mod && !hasPermission(mod, 'read')) {
          askBar.loading = false; askBar.thinking = null
          const turn = Vue.reactive({ q: asked, text: `You don't have access to that information. Ask an administrator if you need ${mod.replace(/_/g,' ')} access.`, chips: [], actions: [], sources: [], followups: [], confidence: 'low', asOf: askBarNow(), streaming: false })
          askBar.turns.push(turn)
          askBar.query = ''
          return
        }
        // Show the reasoning trace (real steps over real data) — the "agent" feel.
        askBar.trace = askBarTraceFor(intent).map(([label, src]) => ({ label, src, done: false }))
        askBar.thinking = askBarThinkingFor(intent)
        askBar.loading = true
        askBar.lastAsked = asked
        askBar.query = ''
        // Reveal trace steps one by one for a "working" feel.
        askBar.trace.forEach((step, i) => { setTimeout(() => { if (askBar.trace[i]) askBar.trace[i].done = true }, 160 + i * 200) })
        const traceTime = 160 + askBar.trace.length * 200
        setTimeout(() => {
          let ans
          try {
            ans = followup ? askBarBuildFollowup(followup) : askBarBuildAnswer(forcedIntent || askBarMatchIntent(asked))
          } catch (e) {
            ans = { text: "Sorry — I couldn't pull that together. Try rephrasing, or check the relevant view directly.", chips: [], actions: [], sources: [], followups: [], confidence: 'low' }
          }
          askBar.loading = false
          askBar.thinking = null
          // Push the turn with a held-back text, then stream it in. Keep the trace on the turn.
          const full = ans.text || ''
          const turn = Vue.reactive({ q: asked, text: '', chips: ans.chips || [], actions: ans.actions || [], sources: ans.sources || [], followups: ans.followups || [], confidence: ans.confidence || 'high', visual: ans.visual || null, isDraft: ans.isDraft || false, isClarify: ans.isClarify || false, trace: askBar.trace.slice(), traceOpen: false, asOf: askBarNow(), streaming: true })
          askBar.trace = []
          askBar.turns.push(turn)
          askBarStreamTurn(turn, full)
        }, Math.max(480, traceTime))
      }

      // Follow-up answers that use remembered context
      const askBarBuildFollowup = (fu) => {
        const today = Utils.normalizeDate(new Date())
        if (fu.kind === 'clarify_staff') {
          // #7 Ambiguous name → ask which person, offering each with role context.
          const opts = fu.options || []
          const names = opts.map(s => s.full_name)
          const text = `There ${opts.length===2?'are two':'are several'} people that could match — which did you mean?`
          const initials = (n) => (n||'').split(/\s+/).map(w=>w[0]).join('').slice(0,2).toUpperCase()
          const roleLine = (s) => { const bits = [_toTitle(s.staff_type||'staff')]; if (s.specialization) bits.push(s.specialization); else if (s.residency_year_override||s.training_year) bits.push((s.residency_year_override||s.training_year)+' resident'); return bits.join(' · ') }
          return { text, chips: opts.slice(0,5).map(s => ({ label: s.full_name, id: s.id, clarifyAttr: fu.attr || null, av: initials(s.full_name), meta: roleLine(s) })), actions: [], sources: ['staff'], followups: [], confidence: 'high', isClarify: true }
        }
        if (fu.kind === 'staff_summary' || fu.kind === 'staff_attr') {
          const s = (medicalStaff.value || []).find(x => x.id === fu.id)
          if (!s) return { text: `I couldn't find that person's record.`, chips: [], actions: [], sources: ['staff'], followups: [], confidence: 'low' }
          const name = s.full_name
          // Deep attribute answer if a specific attribute was asked
          if (fu.attr) {
            const A = fu.attr
            const yes = (b) => b ? 'Yes' : 'No'
            const roleFlags = []
            if (s.is_chief_of_department) roleFlags.push('Chief of Department')
            if (s.is_research_coordinator) roleFlags.push('Research Coordinator')
            if (s.is_resident_manager) roleFlags.push('Resident Manager')
            if (s.is_oncall_manager) roleFlags.push('On-call Manager')
            const map = {
              role:      () => `${name} is ${_toTitle(s.staff_type || 'staff')}${s.specialization ? ', ' + s.specialization : ''}${roleFlags.length ? ' (' + roleFlags.join(', ') + ')' : ''}.`,
              specialty: () => s.specialization || s.specialty ? `${name}'s specialty is ${s.specialization || s.specialty}.` : `No specialty is recorded for ${name}.`,
              certs:     () => { const c = [s.clinical_certificate, s.clinical_study_certificate, s.other_certificate].filter(Boolean); return c.length ? `${name} holds: ${c.join(', ')}.` : `No certificates are recorded for ${name}.` },
              phd:       () => s.has_phd ? `Yes — ${name} has a PhD${s.phd_field ? ' in ' + s.phd_field : ''}.` : `No — ${name} does not have a PhD on record.`,
              pi:        () => `${name} ${s.can_be_pi ? 'can' : 'cannot'} serve as Principal Investigator${s.can_be_coi ? ', and can be a Co-Investigator' : ''}.`,
              residency: () => { const yr = s.residency_year_override || s.training_year; return yr ? `${name} is a ${yr} resident.` : (askBarIsResident(s) ? `${name} is a resident (year not recorded).` : `${name} is not a resident.`) },
              contact:   () => { const c = [s.professional_email, s.mobile_phone].filter(Boolean); return c.length ? `${name}: ${c.join(' · ')}.` : `No contact details are recorded for ${name}.` },
              supervise: () => `${name} ${s.can_supervise_residents ? 'can' : 'cannot'} supervise residents.`,
              license:   () => `${name} ${(s.has_medical_license || s.medical_license) ? 'has' : 'does not have'} a medical license on record.`,
              status:    () => `${name} is ${_toTitle(s.employment_status || 'active')}.`
            }
            if (map[A]) return { text: map[A](), chips: [{ label: name, id: s.id }], actions: [{ label: 'Open profile', view: 'medical_staff', primary: true }], sources: ['staff'], followups: [], confidence: 'high' }
          }
          // Full summary: role + status + on-call/leave/rotation + research flags
          const today = Utils.normalizeDate(new Date())
          const onLeave = (absences.value || []).find(a => a.staff_member_id === fu.id && !['returned_to_duty','cancelled'].includes(a.current_status))
          const nextShift = (onCallSchedule.value || []).filter(x => (x.primary_physician_id === fu.id || x.backup_physician_id === fu.id) && Utils.normalizeDate(x.duty_date) >= today).sort((a,b)=>Utils.normalizeDate(a.duty_date).localeCompare(Utils.normalizeDate(b.duty_date)))[0]
          const rot = (rotations.value || []).find(r => r.resident_id === fu.id && r.rotation_status === 'active')
          let text = `${name} — ${_toTitle(s.staff_type || 'staff')}${s.specialization ? ', ' + s.specialization : ''}.`
          const extras = []
          if (s.residency_year_override || s.training_year) extras.push(`${s.residency_year_override || s.training_year} resident`)
          if (s.has_phd) extras.push('PhD')
          if (s.can_be_pi) extras.push('PI-eligible')
          if (s.is_research_coordinator) extras.push('research coordinator')
          if (extras.length) text += ` ${extras.join(' · ')}.`
          const live = []
          if (onLeave) live.push(`on leave ${Utils.formatDateShort(onLeave.start_date)}–${Utils.formatDateShort(onLeave.end_date)}`)
          if (nextShift) live.push(`next on-call ${Utils.formatDateShort(nextShift.duty_date)}`)
          if (rot) live.push('on an active rotation')
          if (live.length) text += ` Currently ${live.join('; ')}.`
          return { text, chips: [{ label: name, id: s.id }], actions: [{ label: 'Open profile', view: 'medical_staff', primary: true }], sources: ['staff', 'on-call schedule', 'leave records', 'rotations'], followups: [{ label: 'Certificates?', followupKind: 'staff_attr', attr: 'certs' }, { label: 'Can be PI?', followupKind: 'staff_attr', attr: 'pi' }], confidence: 'high' }
        }
        if (fu.kind === 'staff_leave') {
          const leave = (absences.value || []).find(a => a.staff_member_id === fu.id && !['returned_to_duty','cancelled'].includes(a.current_status))
          // Check conflict with remembered date
          const ctxDate = askBar.context?.date
          if (leave) {
            const range = `${Utils.formatDateShort(leave.start_date)}–${Utils.formatDateShort(leave.end_date)}`
            let text = `Yes — ${fu.name} is on leave ${range}.`
            if (ctxDate) {
              const d = Utils.normalizeDate(ctxDate), s = Utils.normalizeDate(leave.start_date), e = Utils.normalizeDate(leave.end_date)
              if (d >= s && d <= e) text += ` That overlaps the ${Utils.formatDateShort(ctxDate)} duty — a conflict you'll want to resolve.`
            }
            return { text, chips: [{ label: fu.name, id: fu.id }], actions: [{ label: 'Open on-call schedule', view: 'oncall_schedule', primary: true }], sources: ['leave records', 'on-call schedule'], followups: [{ label: 'Who could cover instead?', intent: 'oncall_upcoming' }] }
          }
          return { text: `No — ${fu.name} has no active or upcoming leave on record.`, chips: [], actions: [], sources: ['leave records'], followups: [] }
        }
        if (fu.kind === 'staff_oncall') {
          const shifts = (onCallSchedule.value || []).filter(s => (s.primary_physician_id === fu.id || s.backup_physician_id === fu.id) && Utils.normalizeDate(s.duty_date) >= today)
          if (!shifts.length) return { text: `${fu.name} has no upcoming on-call shifts.`, chips: [], actions: [], sources: ['on-call schedule'], followups: [] }
          return { text: `${fu.name} is next on-call ${Utils.formatDateShort(shifts[0].duty_date)}.`, chips: [{ label: fu.name, id: fu.id }], actions: [{ label: 'Open schedule', view: 'oncall_schedule', primary: true }], sources: ['on-call schedule'], followups: [] }
        }
        if (fu.kind === 'staff_rotation') {
          const rot = (rotations.value || []).find(r => r.resident_id === fu.id && r.rotation_status === 'active')
          if (rot) return { text: `${fu.name} is on an active rotation${rot.supervising_attending_id ? ', supervised by ' + getStaffName(rot.supervising_attending_id) : ' with no assigned supervisor'}.`, chips: [{ label: fu.name, id: fu.id }], actions: [], sources: ['rotations'], followups: [] }
          return { text: `${fu.name} is not on an active rotation.`, chips: [], actions: [], sources: ['rotations'], followups: [] }
        }
        return { text: 'I lost the thread there — could you rephrase?', chips: [], actions: [], sources: [], followups: [] }
      }

      const _askBarBuildAnswerRaw = (intent) => {
        const fmt = (d) => Utils.formatDateShort(d)
        const staffName = (id) => getStaffName(id)
        if (intent === 'briefing') {
          const p = commsOps.commsPulse.value
          const gaps = understaffedUnitAlerts.value || []
          let text = `${p.onDuty} staff on duty, ${p.onCall} on-call today.`
          if (p.absent) text += ` ${p.absent} absent on leave.`
          if (gaps.length) text += ` ${gaps.length} coverage gap${gaps.length===1?'':'s'} flagged (${gaps[0].unitName}).`
          if (p.onRotation) text += ` ${p.onRotation} residents on active rotation.`
          if (!p.absent && !gaps.length) text += ' All units covered, no gaps.'
          return { text, chips: [], actions: [{ label: 'Open Ops Room', view: 'communications', primary: true }], sources: ['on-call schedule', 'leave records', 'rotations'], followups: [], confidence: 'high' }
        }
        if (intent === 'coverage_gaps') {
          const gaps = understaffedUnitAlerts.value || []
          if (!gaps.length) return { text: 'No coverage gaps right now — every unit has the expected staffing.', chips: [], actions: [{ label: 'Open Ops Room', view: 'communications' }] }
          const text = `${gaps.length} coverage gap${gaps.length===1?'':'s'} flagged: ` + gaps.slice(0,4).map(g => g.unitName).join(', ') + '. You may want to assign cover.'
          return { text, chips: [], actions: [{ label: 'Open on-call schedule', view: 'oncall_schedule', primary: true }] }
        }
        if (intent === 'absent_now') {
          const today = Utils.normalizeDate(new Date())
          const q = (askBar.lastAsked || askBar.query || '').toLowerCase()
          // #temporal: "this week", "tomorrow", "friday" etc → filter to that range.
          const range = askBarParseRange(q)
          const rangeLabel = range ? range.label : 'today'
          const overlaps = (a) => {
            const s = Utils.normalizeDate(a.start_date), e = Utils.normalizeDate(a.end_date)
            if (range) return s <= range.end && e >= range.start   // any overlap with the window
            return today >= s && today <= e && a.current_status === 'currently_absent'
          }
          const out = (absences.value || []).filter(a => overlaps(a) && !['cancelled'].includes(a.current_status))
          if (!out.length) return { text: `Nobody is absent ${rangeLabel} — full attendance.`, chips: [], actions: [{ label: 'Open leave view', view: 'staff_absence' }], sources: ['leave records'], confidence: 'high' }
          const _reasonLbl = { vacation: 'vacation', sick_leave: 'sick', conference: 'conference', training: 'training', personal: 'personal', other: 'leave' }
          const rows = out.slice(0,6).map(a => ({
            id: a.staff_member_id, name: staffName(a.staff_member_id),
            reason: _reasonLbl[a.absence_reason] || (a.absence_reason || 'leave').replace(/_/g,' '),
            until: a.end_date ? fmt(a.end_date) : null,
            covered: !!a.covering_staff_id, cover: a.covering_staff_id ? staffName(a.covering_staff_id) : null
          }))
          const uncovered = rows.filter(r => !r.covered).length
          const _names = out.slice(0,3).map(a => staffName(a.staff_member_id)).join(', ')
          const text = `${out.length} absent ${rangeLabel}${uncovered ? ` — ${uncovered} without cover` : ''}: ${_names}${out.length>3?'…':''}.`
          return { text, visual: { type: 'absence', rows }, chips: [], actions: [{ label: 'Open leave view', view: 'staff_absence', primary: true }], sources: ['leave records'], followups: [{ label: 'Any coverage gaps?', intent: 'coverage_gaps' }, { label: "Who's on call today?", intent: 'oncall_upcoming' }], confidence: 'high' }
        }
        if (intent === 'trials_recruiting') {
          const trials = (researchOps.clinicalTrials.value || []).filter(t => researchOps.trialStatusKey && researchOps.trialStatusKey(t) === 'recruiting')
          if (!trials.length) return { text: 'No trials are actively recruiting right now.', chips: [], actions: [{ label: 'Open research hub', view: 'research_hub' }], sources: ['research'], followups: [], confidence: 'high' }
          const names = trials.slice(0,5).map(t => t.title).join(', ')
          const text = `${trials.length} trial${trials.length===1?'':'s'} recruiting: ${names}.`
          // #25 rich card: per-trial enrollment bars
          const visual = { type: 'enroll', items: trials.slice(0,5).map(t => {
            const e = researchOps.trialEnrollment ? researchOps.trialEnrollment(t) : null
            return { title: t.title, pct: e ? e.pct : 0, label: e ? `${e.actual}/${e.target}` : '—', health: e ? e.health : 'ontrack' }
          }) }
          return { text, visual, chips: [], actions: [{ label: 'Open research hub', view: 'research_hub', primary: true }], sources: ['research'], followups: [], confidence: 'high' }
        }
        if (intent === 'trials_overview') {
          const trials = researchOps.clinicalTrials.value || []
          if (!trials.length) return { text: 'No clinical trials are on record.', chips: [], actions: [{ label: 'Open research hub', view: 'research_hub' }], sources: ['research'], followups: [], confidence: 'high' }
          const k = researchOps.trialStatusKey
          const rec = trials.filter(t => k && k(t)==='recruiting').length, act = trials.filter(t => k && k(t)==='active').length
          const enrolled = trials.reduce((s,t)=>s+(t.actual_enrollment||0),0)
          return { text: `${trials.length} trial${trials.length===1?'':'s'} on record — ${rec} recruiting, ${act} active. ${enrolled} participants enrolled across all studies.`, chips: [], actions: [{ label: 'Open research hub', view: 'research_hub', primary: true }], sources: ['research'], followups: [{ label: 'Which are recruiting?', intent: 'trials_recruiting' }], confidence: 'high' }
        }
        if (intent === 'trials_by_person') {
          const person = askBarResolveStaff(askBar.lastAsked || askBar.query)
          const trials = (researchOps.clinicalTrials.value || []).filter(t => t.principal_investigator_id === person?.id)
          if (!person) return { text: 'Which investigator did you mean? Try naming them.', chips: [], actions: [], sources: ['research'], followups: [], confidence: 'low' }
          if (!trials.length) return { text: `${person.full_name} is not listed as PI on any trial.`, chips: [{label:person.full_name,id:person.id}], actions: [{ label: 'Open research hub', view: 'research_hub' }], sources: ['research'], followups: [], confidence: 'high' }
          return { text: `${person.full_name} is PI on ${trials.length} trial${trials.length===1?'':'s'}: ${trials.slice(0,4).map(t=>t.title).join(', ')}.`, chips: [{label:person.full_name,id:person.id}], actions: [{ label: 'Open research hub', view: 'research_hub', primary: true }], sources: ['research'], followups: [], confidence: 'high' }
        }
        if (intent === 'research_lines') {
          const lines = researchOps.researchLines.value || []
          if (!lines.length) return { text: 'No research lines are defined yet.', chips: [], actions: [{ label: 'Open research hub', view: 'research_hub' }], sources: ['research'], followups: [], confidence: 'high' }
          const sorted = [...lines].sort((a,b)=>(a.line_number||99)-(b.line_number||99))
          const text = `${lines.length} research line${lines.length===1?'':'s'}: ` + sorted.slice(0,6).map(l => `${l.line_number?'L'+l.line_number+' ':''}${l.research_line_name || l.name}${l.coordinator_id?' (coord: '+getStaffName(l.coordinator_id)+')':''}`).join('; ') + '.'
          return { text, chips: [], actions: [{ label: 'Open research hub', view: 'research_hub', primary: true }], sources: ['research'], followups: [], confidence: 'high' }
        }
        if (intent === 'innovation_projects') {
          const projs = researchOps.innovationProjects.value || []
          if (!projs.length) return { text: 'No innovation projects are on record.', chips: [], actions: [{ label: 'Open research hub', view: 'research_hub' }], sources: ['research'], followups: [], confidence: 'high' }
          const byStage = {}
          projs.forEach(p => { const s = p.current_stage || 'Unspecified'; byStage[s] = (byStage[s]||0)+1 })
          const stageStr = Object.entries(byStage).map(([s,n])=>`${n} ${s}`).join(', ')
          return { text: `${projs.length} innovation project${projs.length===1?'':'s'} in the pipeline (${stageStr}).`, chips: [], actions: [{ label: 'Open research hub', view: 'research_hub', primary: true }], sources: ['research'], followups: [], confidence: 'high' }
        }
        // ── CROSS-CUTTING JOINS (the intelligence) ──
        if (intent === 'staff_can_pi') {
          const pis = (medicalStaff.value || []).filter(s => s.can_be_pi && s.employment_status === 'active')
          if (!pis.length) return { text: 'No staff are currently flagged as PI-eligible.', chips: [], actions: [], sources: ['staff'], followups: [], confidence: 'high' }
          const _f=askBarWantsFull(askBar.lastAsked||askBar.query); const _pn=(_f?pis:pis.slice(0,6)).map(s=>s.full_name); return { text: `${pis.length} staff can serve as PI: ${_f&&_pn.length>6?'\n• '+_pn.join('\n• '):_pn.join(', ')}${!_f&&pis.length>6?` …and ${pis.length-6} more (ask "list all").`:'.'}`, chips: pis.slice(0,5).map(s=>({label:s.full_name,id:s.id})), actions: [{ label: 'Open staff', view: 'medical_staff', primary: true }], sources: ['staff'], followups: [], confidence: 'high' }
        }
        if (intent === 'staff_with_phd') {
          const phds = (medicalStaff.value || []).filter(s => s.has_phd)
          if (!phds.length) return { text: 'No staff have a PhD on record.', chips: [], actions: [], sources: ['staff'], followups: [], confidence: 'high' }
          const _f2=askBarWantsFull(askBar.lastAsked||askBar.query); const _pd=(_f2?phds:phds.slice(0,6)).map(s=>s.full_name+(s.phd_field?' ('+s.phd_field+')':'')); return { text: `${phds.length} staff hold a PhD: ${_f2&&_pd.length>6?'\n• '+_pd.join('\n• '):_pd.join(', ')}${!_f2&&phds.length>6?` …and ${phds.length-6} more (ask "list all").`:'.'}`, chips: phds.slice(0,5).map(s=>({label:s.full_name,id:s.id})), actions: [{ label: 'Open staff', view: 'medical_staff', primary: true }], sources: ['staff'], followups: [], confidence: 'high' }
        }
        if (intent === 'residents_by_year') {
          const residents = (medicalStaff.value || []).filter(s => askBarIsResident(s))
          if (!residents.length) return { text: 'No residents are on record.', chips: [], actions: [], sources: ['staff'], followups: [], confidence: 'high' }
          const byYear = {}
          residents.forEach(s => { const y = s.residency_year_override || s.training_year || '?'; byYear[y] = (byYear[y]||0)+1 })
          const yStr = Object.entries(byYear).sort().map(([y,n])=>`${n} ${y}`).join(', ')
          return { text: `${residents.length} residents: ${yStr}.`, chips: [], actions: [{ label: 'Open staff', view: 'medical_staff', primary: true }], sources: ['staff'], followups: [], confidence: 'high' }
        }
        if (intent === 'units_overview') {
          const units = (trainingUnits.value) || []
          if (!units.length) return { text: 'No training units are defined.', chips: [], actions: [{ label: 'Open units', view: 'training_units' }], sources: ['units'], followups: [], confidence: 'high' }
          const active = units.filter(u => (u.unit_status||'active')==='active').length
          const full = askBarWantsFull(askBar.lastAsked || askBar.query)
          const names = (full ? units : units.slice(0,5)).map(u => u.unit_name)
          // When showing the full list, render one-per-line for readability.
          const body = full && names.length > 6 ? '\n• ' + names.join('\n• ') : names.join(', ')
          const tail = (!full && units.length > 5) ? ` …and ${units.length-5} more (ask "list all units").` : '.'
          return { text: `${units.length} unit${units.length===1?'':'s'} (${active} active): ${body}${tail}`, chips: [], actions: [{ label: 'Open units', view: 'training_units', primary: true }], sources: ['units'], followups: [], confidence: 'high' }
        }
        if (intent === 'rotations_deep') {
          // Who's rotating where, under whom
          const active = (rotations.value || []).filter(r => r.rotation_status === 'active')
          if (!active.length) return { text: 'No residents are on active rotation right now.', chips: [], actions: [{ label: 'Open rotations', view: 'resident_rotations' }], sources: ['rotations'], followups: [], confidence: 'high' }
          const units = trainingUnits.value || []
          const unitName = (id) => (units.find(u => u.id === id)||{}).unit_name || 'a unit'
          const lines = active.slice(0,5).map(r => `${getStaffName(r.resident_id)} in ${unitName(r.training_unit_id)}${r.supervising_attending_id ? ' under ' + getStaffName(r.supervising_attending_id) : ' (no supervisor)'}`)
          return { text: `${active.length} active rotation${active.length===1?'':'s'}: ${lines.join('; ')}.`, chips: [], actions: [{ label: 'Open rotations', view: 'resident_rotations', primary: true }], sources: ['rotations', 'staff', 'units'], followups: [], confidence: 'high' }
        }
        if (intent === 'departments_overview') {
          const depts = departments.value || []
          if (!depts.length) return { text: 'No departments are on record.', chips: [], actions: [], sources: ['departments'], followups: [], confidence: 'high' }
          const _f3=askBarWantsFull(askBar.lastAsked||askBar.query); const _dn=(_f3?depts:depts.slice(0,6)).map(d=>d.name+(d.head_of_department_id?' (head: '+getStaffName(d.head_of_department_id)+')':'')); return { text: `${depts.length} department${depts.length===1?'':'s'}: ${_f3&&_dn.length>6?'\n• '+_dn.join('\n• '):_dn.join(', ')}${!_f3&&depts.length>6?` …and ${depts.length-6} more.`:'.'}`, chips: [], actions: [], sources: ['departments'], followups: [], confidence: 'high' }
        }
        if (intent === 'hospitals_overview') {
          const hs = (hospitalsList.value || []).filter(h => h.is_active !== false)
          if (!hs.length) return { text: 'No hospitals are on record.', chips: [], actions: [], sources: ['hospitals'], followups: [], confidence: 'high' }
          const byComplex = {}
          hs.forEach(h => { const c = h.parent_complex || h.region || 'other'; byComplex[c] = (byComplex[c] || 0) + 1 })
          const grouped = Object.keys(byComplex).length > 1
          let text = `${hs.length} hospital${hs.length===1?'':'s'}: ${hs.slice(0,8).map(h => h.name + (h.city ? ` (${h.city})` : '')).join(', ')}.`
          if (grouped) text += ` Across ${Object.keys(byComplex).length} complexes/regions.`
          return { text, chips: [], actions: [], sources: ['hospitals'], followups: [], confidence: 'high' }
        }
        if (intent === 'clinical_units_overview') {
          // Clinical units are covered by the training-units view; redirect there.
          return { text: 'Clinical/training units are listed under Units.', chips: [], actions: [{ label: 'Open units', view: 'training_units', primary: true }], sources: ['units'], followups: [{ label: 'Which units are at capacity?', intent: 'units_at_capacity' }], confidence: 'high' }
        }
        if (intent === 'coverage_areas_overview') {
          const areas = (coverageAreas.value || []).filter(a => a.is_active !== false)
          if (!areas.length) return { text: 'No coverage areas are defined.', chips: [], actions: [{ label: 'Open on-call', view: 'oncall_schedule' }], sources: ['coverage areas'], followups: [], confidence: 'high' }
          const req = areas.filter(a => a.requires_coverage)
          let text = `${areas.length} coverage area${areas.length===1?'':'s'}: ${areas.slice(0,8).map(a=>a.name).join(', ')}.`
          if (req.length) text += ` ${req.length} require${req.length===1?'s':''} coverage${req.some(a=>a.applies_weekends)?' (some include weekends)':''}.`
          return { text, chips: [], actions: [{ label: 'Open on-call', view: 'oncall_schedule', primary: true }], sources: ['coverage areas'], followups: [{ label: "Who's on call today?", intent: 'oncall_upcoming' }], confidence: 'high' }
        }
        if (intent === 'callouts_overview') {
          const cos = callouts.value || []
          if (!cos.length) return { text: 'No emergency callouts are on record.', chips: [], actions: [{ label: 'Open callouts', view: 'oncall_schedule' }], sources: ['emergency callouts'], followups: [], confidence: 'high' }
          const recent = cos.slice(0, 5)
          const byReason = {}
          cos.forEach(c => { const r = c.reason_category || 'unspecified'; byReason[r] = (byReason[r] || 0) + 1 })
          const top = Object.entries(byReason).sort((a,b) => b[1]-a[1]).slice(0,3).map(([r,n]) => `${r.replace(/_/g,' ')} (${n})`).join(', ')
          const fmt = (d) => { try { return new Date(d).toLocaleDateString('en-GB', { day:'numeric', month:'short' }) } catch(e){ return '' } }
          return { text: `${cos.length} emergency callout${cos.length===1?'':'s'} on record. Most recent: ${recent.map(c => `${getStaffName(c.staff_id)} (${fmt(c.called_at)})`).join(', ')}.${top ? ` By reason: ${top}.` : ''}`, chips: recent.slice(0,4).map(c=>({label:getStaffName(c.staff_id),id:c.staff_id})), actions: [{ label: 'Open callouts', view: 'oncall_schedule', primary: true }], sources: ['emergency callouts', 'staff'], followups: [], confidence: 'high' }
        }
        if (intent === 'announcements_overview') {
          const anns = (commsOps.announcements.value) || []
          if (!anns.length) return { text: 'No announcements are posted right now.', chips: [], actions: [{ label: 'Open comms', view: 'communications' }], sources: ['announcements'], followups: [], confidence: 'high' }
          const today = Utils.normalizeDate(new Date())
          const active = anns.filter(a => (!a.publish_end_date || Utils.normalizeDate(a.publish_end_date) >= today))
          const list = (active.length ? active : anns).slice(0, 4)
          const prio = (a) => a.priority_level && /high|urgent/i.test(a.priority_level) ? ' ⚠' : ''
          return { text: `${active.length || anns.length} announcement${(active.length||anns.length)===1?'':'s'}: ${list.map(a => `“${a.title}”${prio(a)}`).join(', ')}.`, chips: [], actions: [{ label: 'Open comms', view: 'communications', primary: true }], sources: ['announcements'], followups: [], confidence: 'high' }
        }
        if (intent === 'ops_metrics_overview') {
          const ms = (commsOps.opsMetrics.value) || []
          if (!ms.length) return { text: "No operational metrics have been posted yet. They're set from the communications view.", chips: [], actions: [{ label: 'Open comms', view: 'communications' }], sources: ['ops metrics'], followups: [], confidence: 'high' }
          const today = Utils.normalizeDate(new Date())
          const current = ms.filter(m => !m.valid_for_date || Utils.normalizeDate(m.valid_for_date) === today)
          const show = (current.length ? current : ms).slice(0, 6)
          return { text: `Current metrics: ${show.map(m => `${(m.metric_key||'').replace(/_/g,' ')}: ${m.metric_value}${m.metric_sub ? ' '+m.metric_sub : ''}`).join(' · ')}.`, chips: [], actions: [{ label: 'Open comms', view: 'communications', primary: true }], sources: ['ops metrics'], followups: [{ label: "Today's briefing", intent: 'briefing' }], confidence: 'high' }
        }
        if (intent === 'certs_expiring') {
          // Staff whose certificate_status flags an issue (expiring/expired)
          const flagged = (medicalStaff.value || []).filter(s => /(expir|vencid|caduc|pending|due)/i.test(s.certificate_status || ''))
          if (!flagged.length) return { text: 'No staff have flagged or expiring certificates on record.', chips: [], actions: [], sources: ['staff'], followups: [], confidence: 'high' }
          return { text: `${flagged.length} staff have certificate issues: ${flagged.slice(0,5).map(s=>s.full_name + ' (' + s.certificate_status + ')').join(', ')}.`, chips: flagged.slice(0,5).map(s=>({label:s.full_name,id:s.id})), actions: [{ label: 'Open staff', view: 'medical_staff', primary: true }], sources: ['staff'], followups: [], confidence: 'high' }
        }
        // ── THE EXTRA 10% — proactive cross-cutting intelligence ──
        if (intent === 'units_at_capacity') {
          const units = trainingUnits.value || []
          const active = (rotations.value || []).filter(r => r.rotation_status === 'active')
          const rows = units.map(u => { const n = active.filter(r => r.training_unit_id === u.id).length; const cap = u.maximum_residents || 5; return { name: u.unit_name, n, cap, full: n >= cap } }).filter(r => r.n > 0)
          const full = rows.filter(r => r.full)
          if (!rows.length) return { text: 'No units currently have residents assigned.', chips: [], actions: [{ label: 'Open units', view: 'training_units' }], sources: ['units', 'rotations'], followups: [], confidence: 'high' }
          let text = full.length ? `${full.length} unit${full.length===1?'':'s'} at or over capacity: ${full.map(r=>r.name).join(', ')}.` : 'No units are at capacity.'
          // Occupancy readout — a fill bar per unit, red when full.
          const occ = rows.sort((a,b) => (b.n/b.cap) - (a.n/a.cap)).slice(0,8).map(r => ({
            name: r.name, n: r.n, cap: r.cap, pct: Math.min(100, Math.round((r.n/r.cap)*100)), full: r.full
          }))
          return { text, visual: { type: 'occupancy', rows: occ }, chips: [], actions: [{ label: 'Open units', view: 'training_units', primary: true }], sources: ['units', 'rotations'], followups: [{ label: 'Who has no supervisor?', intent: 'unsupervised_residents' }, { label: 'Who is rotating where?', intent: 'rotations_deep' }], confidence: 'high' }
        }
        if (intent === 'unsupervised_residents') {
          const unsup = (rotations.value || []).filter(r => r.rotation_status === 'active' && !r.supervising_attending_id)
          if (!unsup.length) return { text: 'Every active rotation has an assigned supervisor. All good.', chips: [], actions: [], sources: ['rotations'], followups: [{ label: 'Who is rotating where?', intent: 'rotations_deep' }], confidence: 'high' }
          const units = trainingUnits.value || []
          const unitName = (id) => (units.find(u => u.id === id)||{}).unit_name || '—'
          const rows = unsup.slice(0,8).map(r => ({ id: r.resident_id, name: getStaffName(r.resident_id), unit: unitName(r.training_unit_id) }))
          return { text: `${unsup.length} resident${unsup.length===1?'':'s'} without a supervisor: ${rows.slice(0,3).map(r=>r.name).join(', ')}${rows.length>3?'…':''}.`, visual: { type: 'risklist', rows }, chips: [], actions: [{ label: 'Open rotations', view: 'resident_rotations', primary: true }], sources: ['rotations', 'staff'], followups: [{ label: 'Who could supervise?', intent: 'staff_can_pi' }, { label: 'Units at capacity?', intent: 'units_at_capacity' }], confidence: 'high' }
        }
        if (intent === 'rank_staff') {
          // Superlative queries: "busiest attending", "who has the most shifts", "least loaded"
          const q = (askBar.lastAsked || '').toLowerCase()
          const metric = askBarDetectMetric(q)
          const wantLeast = /(least|fewest|lightest|less|lowest)/.test(q)
          const rows = (medicalStaff.value || [])
            .filter(s => s.employment_status === 'active')
            .map(s => ({ s, v: askBarMetricValue(s, metric.key) }))
            .filter(r => r.v !== null)
          if (!rows.length) return { text: `I don't have enough data to rank by ${metric.label}.`, chips: [], actions: [], sources: [metric.source], followups: [], confidence: 'low' }
          rows.sort((a,b) => (wantLeast ? a.v - b.v : b.v - a.v) || a.s.full_name.localeCompare(b.s.full_name))
          const top = rows[0], runner = rows[1]
          // If several tie at the top value, name them rather than picking one arbitrarily.
          const tied = rows.filter(r => r.v === top.v)
          let text
          if (tied.length > 1 && tied.length < rows.length) {
            text = `${tied.map(r=>r.s.full_name).join(', ')} are tied for the ${wantLeast ? 'fewest' : 'most'} ${metric.label} — ${top.v}${metric.unit} each.`
          } else if (tied.length === rows.length) {
            text = `Everyone is level on ${metric.label} — ${top.v}${metric.unit} each.`
          } else {
            text = `${top.s.full_name} has the ${wantLeast ? 'fewest' : 'most'} ${metric.label} — ${top.v}${metric.unit}`
            if (runner) text += `, ${wantLeast ? 'ahead of' : 'compared to'} ${runner.s.full_name}'s ${runner.v}${metric.unit}`
            text += '.'
          }
          // Visual: instrument bars for the top handful.
          const maxV = Math.max(...rows.map(r => r.v), 1)
          const bars = rows.slice(0, 5).map((r, i) => ({ name: r.s.full_name, value: r.v, pct: Math.round((r.v / maxV) * 100), win: i === 0 }))
          return { text, visual: { type: 'bars', metric: metric.label, bars }, chips: rows.slice(0,4).map(r=>({label:`${r.s.full_name} · ${r.v}`,id:r.s.id})), actions: [{ label: 'Open staff', view: 'medical_staff', primary: true }], sources: [metric.source, 'staff'], followups: [], confidence: 'high' }
        }
        if (intent === 'compare_staff') {
          // "who has more shifts, Antelo or López?"  /  "compare Antelo and López"
          const q = askBar.lastAsked || ''
          const names = askBarExtractTwoNames(q)
          if (names.length < 2) return { text: 'Name two people to compare, e.g. "compare Antelo and López".', chips: [], actions: [], sources: ['staff'], followups: [], confidence: 'low' }
          const metric = askBarDetectMetric(q.toLowerCase())
          const a = names[0], b = names[1]
          const va = askBarMetricValue(a, metric.key), vb = askBarMetricValue(b, metric.key)
          if (va === null && vb === null) return { text: `I don't have ${metric.label} data for either of them.`, chips: [], actions: [], sources: [metric.source], followups: [], confidence: 'low' }
          const na = va===null?0:va, nb = vb===null?0:vb
          let text
          if (na === nb) text = `${a.full_name} and ${b.full_name} are even — both have ${na}${metric.unit} ${metric.label}.`
          else { const hi = na>nb?a:b, lo = na>nb?b:a, hv = Math.max(na,nb), lv = Math.min(na,nb); text = `${hi.full_name} has more ${metric.label}: ${hv}${metric.unit} versus ${lo.full_name}'s ${lv}${metric.unit} — a difference of ${hv-lv}.` }
          const maxV = Math.max(na, nb, 1)
          const bars = [{ name: a.full_name, value: na, pct: Math.round((na/maxV)*100), win: na >= nb }, { name: b.full_name, value: nb, pct: Math.round((nb/maxV)*100), win: nb > na }]
          const delta = Math.abs(na - nb)
          return { text, visual: { type: 'bars', metric: metric.label, bars, delta: delta ? `Difference of ${delta} ${metric.label}` : 'They\u2019re even' }, chips: [{label:`${a.full_name} · ${na}`,id:a.id},{label:`${b.full_name} · ${nb}`,id:b.id}], actions: [{ label: 'Open staff', view: 'medical_staff', primary: true }], sources: [metric.source, 'staff'], followups: [], confidence: 'high' }
        }
        if (intent === 'oncall_upcoming') {
          const today = Utils.normalizeDate(new Date())
          const q = (askBar.lastAsked || askBar.query || '').toLowerCase()
          const all = (onCallSchedule.value || [])
            .sort((a,b) => Utils.normalizeDate(a.duty_date).localeCompare(Utils.normalizeDate(b.duty_date)))
          // #temporal: did they name a specific day? ("tomorrow", "friday", "next monday", a date)
          const dr = askBarExtractDates(q)
          const wantsToday = /\btoday\b|\bhoy\b|\bnow\b|right now/.test(q)
          let up, dayLabel = null
          if (wantsToday) {
            up = all.filter(s => Utils.normalizeDate(s.duty_date) === today); dayLabel = 'today'
          } else if (dr.start) {
            // specific day (or range) named
            up = all.filter(s => { const d = Utils.normalizeDate(s.duty_date); return d >= dr.start && d <= (dr.end || dr.start) })
            dayLabel = (dr.start === dr.end || !dr.end) ? fmt(dr.start) : `${fmt(dr.start)}–${fmt(dr.end)}`
          } else {
            up = all.filter(s => Utils.normalizeDate(s.duty_date) >= today).slice(0, 4)
          }
          if (!up.length) {
            const none = dayLabel ? `No one is scheduled on call for ${dayLabel}.` : "No upcoming on-call shifts are scheduled. You may want to set the rota."
            return { text: none, chips: [], actions: [{ label: 'Open on-call schedule', view: 'oncall_schedule', primary: true }], sources: ['on-call schedule'], followups: [] }
          }
          let text
          if (dayLabel) {
            text = up.length === 1
              ? `${staffName(up[0].primary_physician_id)} is on call ${dayLabel === 'today' ? 'today' : ('on ' + dayLabel)}.`
              : `On call ${dayLabel}: ${up.map(s => staffName(s.primary_physician_id)).join(', ')}.`
          } else {
            text = up[0] && Utils.normalizeDate(up[0].duty_date) === today
              ? `${staffName(up[0].primary_physician_id)} is on call today.`
              : `Next on call: ${staffName(up[0].primary_physician_id)} on ${fmt(up[0].duty_date)}.`
          }
          const roster = up.slice(0,7).map(s => ({
            id: s.primary_physician_id, name: staffName(s.primary_physician_id),
            date: fmt(s.duty_date), today: Utils.normalizeDate(s.duty_date) === today,
            backup: s.backup_physician_id ? staffName(s.backup_physician_id) : null
          }))
          if (up[0]?.primary_physician_id) askBar.context = { type: 'staff', id: up[0].primary_physician_id, name: staffName(up[0].primary_physician_id), date: up[0].duty_date }
          return { text, visual: { type: 'roster', rows: roster }, chips: [], actions: [{ label: 'Open on-call schedule', view: 'oncall_schedule', primary: true }], sources: ['on-call schedule'], followups: [{ label: 'Anyone on leave that day?', followupKind: 'staff_leave' }] }
        }
        if (intent === 'rotations_active') {
          const active = (rotations.value || []).filter(r => r.rotation_status === 'active')
          if (!active.length) return { text: 'No active rotations right now.', chips: [], actions: [{ label: 'Open rotations', view: 'resident_rotations' }] }
          const text = `${active.length} resident${active.length===1?'':'s'} on active rotation.`
          return { text, chips: [], actions: [{ label: 'Open rotations', view: 'resident_rotations', primary: true }], sources: ['rotations'], followups: [] }
        }
        if (intent === 'count_rotations_ending') {
          // #3 counting + #2 temporal
          const range = askBarParseRange(askBar.lastAsked || askBar.query) || { end: Utils.normalizeDate(new Date(new Date().getFullYear(), new Date().getMonth()+1, 0)), label: 'this month' }
          const n = askBarCountResidentsEndingBy(range.end)
          return { text: `${n} resident${n===1?'':'s'} finish their rotation on or before ${range.label || Utils.formatDateShort(range.end)}.`, chips: [], actions: [{ label: 'Open rotations', view: 'resident_rotations', primary: true }], sources: ['rotations'], followups: [], confidence: n ? 'high' : 'high' }
        }
        if (intent === 'rank_oncall') {
          // #7 ranking
          const ranked = askBarOnCallLoad()
          if (!ranked.length) return { text: 'No upcoming on-call shifts are scheduled, so there’s no load to compare yet.', chips: [], actions: [{ label: 'Open schedule', view: 'oncall_schedule' }], sources: ['on-call schedule'], followups: [], confidence: 'high' }
          const top = ranked[0]
          const text = `${top.name} has the most upcoming on-call load — ${top.shifts} shift${top.shifts===1?'':'s'}` + (ranked[1] ? `, ahead of ${ranked[1].name} (${ranked[1].shifts}).` : '.')
          return { text, chips: ranked.slice(0,3).map(r => ({ label: `${r.name} · ${r.shifts}`, id: r.id })), actions: [{ label: 'Open schedule', view: 'oncall_schedule', primary: true }], sources: ['on-call schedule'], followups: [], confidence: 'high' }
        }
        if (intent === 'pis_oncall') {
          // #6 cross-domain join
          const range = askBarParseRange(askBar.lastAsked || askBar.query)
          const hits = askBarPIsOnCall(range)
          if (!hits.length) return { text: `No principal investigators are on-call ${range ? range.label : 'in the upcoming schedule'}.`, chips: [], actions: [], sources: ['research', 'on-call schedule'], followups: [], confidence: 'high' }
          const text = `${hits.length} PI${hits.length===1?'':'s'} ${hits.length===1?'is':'are'} on-call ${range ? range.label : 'soon'}: ` + hits.slice(0,4).map(h => `${h.name} (${Utils.formatDateShort(h.date)})`).join(', ') + '.'
          return { text, chips: hits.slice(0,4).map(h => ({ label: h.name, id: h.id })), actions: [{ label: 'Open schedule', view: 'oncall_schedule', primary: true }], sources: ['research', 'on-call schedule'], followups: [], confidence: 'high' }
        }
        if (intent === 'recommend_backup') {
          // Deterministic "reasoning": rank eligible, not-on-leave physicians by lightest load.
          const r = askBarRecommendBackup(askBar.lastAsked || askBar.query)
          if (!r.eligible.length) return { text: 'I couldn’t find an eligible physician who is free and not on leave for that slot. You may need to look outside the usual on-call pool.', chips: [], actions: [{ label: 'Open schedule', view: 'oncall_schedule', primary: true }], sources: ['on-call schedule', 'leave records', 'staff'], followups: [], confidence: 'high' }
          const top = r.eligible[0]
          const dateStr = r.dutyDate ? ` on ${Utils.formatDateShort(r.dutyDate)}` : ''
          const others = r.eligible.slice(1, 3)
          let text = `${askBarLead('rec')} ${top.name}`
          text += top.shifts === 0 ? ` — they have no on-call shifts scheduled${dateStr ? '' : ' yet'}, so they'd keep the rota balanced.` : ` — they carry the lightest call load (${top.shifts} shift${top.shifts===1?'':'s'})${dateStr}.`
          if (others.length) text += ` ${others.map(o => o.name).join(' and ')} ${others.length===1?'is':'are'} also free, but ${others.length===1?'has':'have'} more shifts.`
          return { text, chips: r.eligible.slice(0,3).map(e => ({ label: `${e.name} · ${e.shifts}`, id: e.id })), actions: [{ label: 'Open on-call schedule', view: 'oncall_schedule', primary: true }], sources: ['on-call schedule', 'leave records', 'staff'], followups: [{ label: 'See everyone’s load', intent: 'rank_oncall' }], confidence: 'high' }
        }
        if (intent === 'draft_email') {
          // Drafting from a template filled with real data — grounded, not generated.
          const today = Utils.normalizeDate(new Date())
          const nextShift = (onCallSchedule.value || []).filter(s => Utils.normalizeDate(s.duty_date) >= today).sort((a,b)=>Utils.normalizeDate(a.duty_date).localeCompare(Utils.normalizeDate(b.duty_date)))[0]
          const primary = nextShift ? getStaffName(nextShift.primary_physician_id) : null
          const backup = nextShift && nextShift.backup_physician_id ? getStaffName(nextShift.backup_physician_id) : null
          const dateStr = nextShift ? Utils.formatDateShort(nextShift.duty_date) : 'the upcoming shift'
          const backupClause = backup ? (', with ' + backup + ' as backup') : ''
          let body = 'Subject: On-call coverage — ' + dateStr + '\n\nTeam,\n\n'
          if (primary) body += primary + ' will cover primary on-call on ' + dateStr + backupClause + '. Please direct urgencies accordingly.\n\n'
          else body += 'Please note the upcoming on-call coverage as set in the schedule.\n\n'
          body += 'Thanks,\nDepartment coordination'
          return { text: body, chips: [], actions: [{ label: 'Open Ops Room', view: 'communications', primary: true }], sources: ['on-call schedule', 'staff'], followups: [{ label: 'Make it shorter', intent: 'draft_email' }], confidence: 'high', isDraft: true }
        }
        if (intent === 'issues') {
          // SYNTHESIS — cross-reference data to surface problems no single view shows.
          const problems = []
          const chips = []
          // 1. On-call ↔ absence conflicts (someone scheduled on-call while on leave)
          const absList = (absences.value || []).filter(a => !['returned_to_duty','cancelled'].includes(a.current_status))
          const within = (date, a) => {
            const d = Utils.normalizeDate(date), s = Utils.normalizeDate(a.start_date), e = Utils.normalizeDate(a.end_date)
            return d >= s && d <= e
          }
          ;(onCallSchedule.value || []).forEach(shift => {
            const pid = shift.primary_physician_id || shift.backup_physician_id
            if (!pid) return
            const clash = absList.find(a => a.staff_member_id === pid && within(shift.duty_date, a))
            if (clash) {
              problems.push(`${getStaffName(pid)} is on-call ${Utils.formatDateShort(shift.duty_date)} but also on leave that day`)
              if (!chips.find(c => c.id === pid)) chips.push({ label: getStaffName(pid), id: pid })
            }
          })
          // 2. Coverage gaps (understaffed units)
          const gaps = understaffedUnitAlerts.value || []
          gaps.slice(0,3).forEach(g => problems.push(`${g.unitName} has a coverage gap`))
          // 3. Backup same as primary (data error)
          ;(onCallSchedule.value || []).forEach(shift => {
            if (shift.primary_physician_id && shift.primary_physician_id === shift.backup_physician_id) {
              problems.push(`${getStaffName(shift.primary_physician_id)} is listed as both primary and backup on ${Utils.formatDateShort(shift.duty_date)}`)
            }
          })
          if (!problems.length) return { text: 'No conflicts found. On-call coverage, leave, and rotations are all consistent — nothing needs your attention right now.', chips: [], actions: [] }
          const text = `Found ${problems.length} thing${problems.length===1?'':'s'} worth a look: ` + problems.slice(0,5).map(p => '• ' + p).join('  ') + (problems.length>5 ? `  …and ${problems.length-5} more.` : '')
          return { text, chips: chips.slice(0,4), actions: [{ label: 'Open on-call schedule', view: 'oncall_schedule', primary: true }], sources: ['on-call schedule', 'leave records', 'rotations'], followups: [] }
        }
        // unknown — #14 precise "I don't know": name what's actually missing
        // rather than a generic capability dump. Detect what they reached for.
        {
          const uq = (askBar.lastAsked || askBar.query || '').toLowerCase()
          const staffTried = askBarResolveStaff(uq)
          let text, tip = null
          if (staffTried) {
            // They named a real person but asked something we can't answer about them.
            text = `I found ${staffTried.full_name}, but I couldn't tell what you wanted to know about them. I can give their role, specialty, certificates, PhD, PI-eligibility, residency year, contact, on-call, leave, or rotation.`
          } else if (/(cost|budget|salary|pay|money|€|expense)/.test(uq)) {
            text = "I don't hold financial or salary data — that's not in the operational records I can see."
          } else if (/(patient|diagnosis|treatment|clinical outcome|admission)/.test(uq)) {
            text = "I work with departmental operations — staff, on-call, rotations, trials, units — not individual patient or clinical-outcome data."
          } else if (/(email|message|phone|address|reach|contact)/.test(uq)) {
            text = "I couldn't match that to a person. Try naming them, e.g. \"how do I reach Antelo?\""
          } else if (/(history|last (week|month|year)|previous|past|used to|before)/.test(uq)) {
            text = "I answer from current records — I don't have historical snapshots to look back through yet."
          } else {
            text = "I couldn't map that to something in the records. I can answer about staff (role, certs, PhD, PI, residency), on-call, leave, rotations, trials, research lines, innovation projects, units, departments — plus cross-cutting questions like who's PI-eligible or which units are at capacity."
            // #19 Teach-from-usage: record what we couldn't answer so an admin can teach it.
            try { brainLogFailed(askBar.lastAsked || askBar.query || '') } catch (e) {}
          }
          return { text, chips: [], actions: [], sources: [], followups: [], confidence: 'low' }
        }
      }

      // Ensure every answer carries sources/followups arrays (defaults) + confidence.
      // #5 Provenance: plain-language description of what each source is.
      const askBarSourceDesc = (s) => ({
        'staff': 'From the medical-staff directory',
        'on-call schedule': 'From the on-call duty roster',
        'leave records': 'From staff absence records',
        'rotations': 'From resident rotation assignments',
        'units': 'From training-unit definitions',
        'research': 'From the research registry',
        'departments': 'From the department list',
        'coverage areas': 'From on-call coverage areas',
        'emergency callouts': 'From the emergency callout log',
        'announcements': 'From department announcements',
        'ops metrics': 'From posted operational metrics',
        'hospitals': 'From the hospital directory'
      }[s] || ('From ' + s))

      // Detect when the user wants the COMPLETE list, not a truncated summary.
      const askBarWantsFull = (q) => /\b(full|all|every|complete|entire|whole|list|show me|todos|todas|completa|lista)\b/i.test(q || '')

      const askBarBuildAnswer = (intent) => {
        const a = _askBarBuildAnswerRaw(intent) || {}
        // #4 Confidence from real signals: downgrade when the answer rests on
        // no data or thin evidence; keep high only when grounded in real records.
        let conf = a.confidence || 'high'
        const txt = (a.text || '').toLowerCase()
        const emptyish = /no .* (on record|scheduled|found|are defined)|nobody is|nothing came up|couldn'?t (map|tell|pull)|don'?t have|no matches|full attendance|none /.test(txt)
        const hasSources = Array.isArray(a.sources) && a.sources.length > 0
        if (emptyish) conf = 'low'
        else if (!hasSources && conf === 'high') conf = 'medium'
        return { text: a.text || '', chips: a.chips || [], actions: a.actions || [], sources: a.sources || [], followups: a.followups || [], confidence: conf, visual: a.visual || null, isDraft: a.isDraft || false }
      }

      const askBarGoTo = (action) => {
        if (action.view) { askBarLog('action', { label: action.label, view: action.view }); switchView(action.view); closeAskBar() }
      }
      // #3 Inline entity actions — tap a person chip → mini action menu.
      const askBarEntityMenu = (c, ev) => {
        const s = (medicalStaff.value || []).find(x => x.id === c.id)
        if (!s) { askBarOpenStaff(c.id); return }
        // toggle: same chip closes it
        if (askBar.entityMenu && askBar.entityMenu.id === c.id) { askBar.entityMenu = null; return }
        let x = 0, y = 0
        try { const r = ev.currentTarget.getBoundingClientRect(); x = r.left; y = r.bottom + 6 } catch (e) {}
        askBar.entityMenu = { id: s.id, name: s.full_name, x, y }
      }
      const askBarEntityAction = (action) => {
        const m = askBar.entityMenu
        if (!m) return
        askBar.entityMenu = null
        if (action === 'profile') { askBarOpenStaff(m.id); return }
        // 'oncall' / 'phd' / 'summary' → ask a scoped follow-up about this person
        const qmap = { oncall: m.name + ' on call', summary: m.name, contact: 'how to reach ' + m.name }
        askBar.query = qmap[action] || m.name
        askBar.context = { type: 'staff', id: m.id, name: m.name }
        askBarResolve()
      }
      const askBarCopyAnswer = (turn, ev) => {
        // Build a clean plain-text version of the answer (text + any comparison bars).
        let out = turn.text || ''
        if (turn.visual && turn.visual.type === 'bars' && Array.isArray(turn.visual.bars)) {
          out += '\n' + turn.visual.bars.map(b => `  ${b.name}: ${b.value}`).join('\n')
          if (turn.visual.delta) out += `\n  ${turn.visual.delta}`
        }
        if (turn.sources && turn.sources.length) out += `\n\n(sources: ${turn.sources.join(', ')} — as of ${turn.asOf || 'now'})`
        const done = () => { try { const btn = ev && ev.currentTarget; if (btn) { btn.classList.add('askbar-copy--ok'); setTimeout(() => btn.classList.remove('askbar-copy--ok'), 1400) } } catch (e) {} }
        try {
          if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(out).then(done, done)
          else { const ta = document.createElement('textarea'); ta.value = out; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta); done() }
        } catch (e) { done() }
      }
      const askBarOpenStaff = (id) => {
        const s = (medicalStaff.value || []).find(x => x.id === id)
        if (s) { viewStaffDetails(s); closeAskBar() }
      }
      // #7 A clarification chip was tapped → answer for that specific person now.
      const askBarResolveClarified = (c) => {
        const s = (medicalStaff.value || []).find(x => x.id === c.id)
        if (!s) return
        askBar.context = { type: 'staff', id: s.id, name: s.full_name }
        const fu = c.clarifyAttr ? { kind: 'staff_attr', id: s.id, name: s.full_name, attr: c.clarifyAttr } : { kind: 'staff_summary', id: s.id, name: s.full_name }
        askBar.view = 'conversation'
        askBar.loading = true
        setTimeout(() => {
          let ans
          try { ans = askBarBuildFollowup(fu) } catch (e) { ans = { text: `Here's ${s.full_name}.`, chips: [], actions: [], sources: ['staff'], followups: [], confidence: 'high' } }
          askBar.loading = false
          const turn = Vue.reactive({ q: s.full_name, text: '', chips: ans.chips || [], actions: ans.actions || [], sources: ans.sources || [], followups: ans.followups || [], confidence: ans.confidence || 'high', visual: ans.visual || null, isDraft: ans.isDraft || false, asOf: askBarNow(), streaming: true })
          askBar.turns.push(turn)
          askBarStreamTurn(turn, ans.text || '')
        }, 260)
      }
      // Run a follow-up chip: either a fresh intent, or a context-based follow-up
      const askBarRunFollowup = (fu) => {
        askBar.view = 'conversation'
        const intent = fu.followupKind || fu.intent || 'unknown'
        askBar.thinking = askBarThinkingFor(intent)
        askBar.loading = true
        setTimeout(() => {
          let ans
          try {
            if (fu.followupKind && askBar.context) ans = askBarBuildFollowup({ kind: fu.followupKind, id: askBar.context.id, name: askBar.context.name })
            else ans = askBarBuildAnswer(fu.intent || 'unknown')
          } catch (e) { ans = { text: 'Could not resolve that follow-up.', chips: [], actions: [], sources: [], followups: [], confidence: 'low' } }
          askBar.loading = false
          askBar.thinking = null
          const turn = Vue.reactive({ q: fu.label, text: '', chips: ans.chips || [], actions: ans.actions || [], sources: ans.sources || [], followups: ans.followups || [], confidence: ans.confidence || 'high', visual: ans.visual || null, asOf: askBarNow(), streaming: true })
          askBar.turns.push(turn)
          askBarStreamTurn(turn, ans.text || '')
        }, 420)
      }


        return {
          // Existing returns
          loading, saving, currentUser, loginForm, loginLoading, hasPermission,
          ...Object.fromEntries(Object.entries(ui).filter(([k]) => k !== 'showToast')),
          showToast, showConfirmation, ui,
          ...staffOps,  // medicalStaff, allStaffLookup, hospitalsList (clinicalUnits removed — unused)
          deleteMedicalStaff,          // override useStaff's deactivateStaffMember with full workflow
          reassignmentModal, confirmReassignAndDeactivate,
          ...onCallOps,
          ...rotationOps,
          ...absenceOps,
          absenceOnCallConflict,  // root-level: cross-composable computed
          formatTrainingYear: Utils.formatTrainingYear, formatStudyStatus, formatSpecialization: Utils.formatSpecialization, effectiveResidentYear: Utils.effectiveResidentYear,
          formatPhone: Utils.formatPhone, formatLicense: Utils.formatLicense,
          getResidentCategoryInfo: Utils.getResidentCategoryInfo, formatResidentCategorySimple: Utils.formatResidentCategorySimple,
          formatResidentCategoryDetailed: Utils.formatResidentCategoryDetailed, getResidentCategoryIcon: Utils.getResidentCategoryIcon,
          getResidentCategoryTooltip: Utils.getResidentCategoryTooltip, getRoleInfo: Utils.getRoleInfo, getStaffRoles: Utils.getStaffRoles,
          getDaysRemainingColor: Utils.getDaysRemainingColor, isToday,
          normalizeDate: Utils.normalizeDate, formatDateShort: Utils.formatDateShort,
          departments, allDepartmentsLookup, departmentFilters, departmentModal, deptReassignModal,
          filteredDepartments, getDepartmentName, getPrimaryDepartment, getExternalDepartments, isDepartmentExternal, isDepartmentPrimary, getDepartmentUnits, getDepartmentStaffCount, getDeptResidentStats, getDeptHomeResidents,
          loadDepartments, showAddDepartmentModal, editDepartment, saveDepartment,
          deleteDepartment, confirmDeptReassignAndDeactivate, viewDepartmentStaff,
          deptPanel, openDeptPanel, closeDeptPanel,
          deptPanelAttending, deptPanelResidents, deptPanelUnits, deptPanelRotations,
          getUnitSupervisorName, rotDaysLeft,
          trainingUnits, trainingUnitFilters, trainingUnitModal, unitsByDepartment, unitResidentsModal, unitCliniciansModal, filteredTrainingUnits,
          getUnitActiveRotationCount, getUnitRotations, getUnitScheduledCount, getUnitOverlapWarning, getResidentShortName, loadTrainingUnits, showAddTrainingUnitModal,
        trainingUnitView, trainingUnitHorizon, getTimelineMonths, getUnitSlots, getDaysUntilFree, tlPopover, openCellPopover, closeCellPopover,
          unitStaffCache,
          weeklyStaffingGrid,
          occupancyPanel, unitDetailDrawer, occupancyHeatmap, occupancyPanelUnits,
          getUnitMonthOccupancy, getNextFreeMonth, openUnitDetail, openAssignRotationFromUnit,
          editTrainingUnit, deleteTrainingUnit, saveTrainingUnit, assignAttendingToUnit,
          openUnitClinicians: (unit) => openUnitClinicians(unit, medicalStaff.value),
          saveUnitClinicians,
          viewUnitResidents: (unit) => viewUnitResidents(unit, rotations.value),
          checkRotationAvailability: rotationOps.checkRotationAvailability,
          rotationAvailability: rotationOps.rotationModal,  // exposes .availability state
          ...commsOps,
          saveCommunication: (sv) => commsOps.saveCommunication(sv ?? saving, liveOps.saveClinicalStatus),
          ...liveOps,
          ...researchOps,
          researchLines: enrichedResearchLines,
          filteredResearchLines,
          // Page navigation — expose at root level for template
          researchHubPage:  researchOps.researchHubPage,
          selectedLine:     researchOps.selectedLine,
          selectedStudy:    researchOps.selectedStudy,
          selectedProject:  researchOps.selectedProject,
          openLine: (line) => { researchOps.openLine(line); },
          openStudy:        researchOps.openStudy,
          openProject:      researchOps.openProject,
          goToOverview:     researchOps.goToOverview,
          goToLine:         researchOps.goToLine,
          lineTab:          ref('studies'),
          // Option constants for dropdowns
          DISEASE_OPTIONS, ETHICS_STATUS_OPTS, FUNDING_STATUS_OPTS,
          SPONSOR_TYPE_OPTS, STUDY_TYPE_OPTS, POPULATION_OPTS, REGULATORY_OPTS,
          TEAM_ROLE_OPTIONS,
          // Disease/milestone/completeness helpers
          addDisease: researchOps.addDisease,
          removeDisease: researchOps.removeDisease,
          handleDiseaseKey: researchOps.handleDiseaseKey,
          addExternalMember: researchOps.addExternalMember,
          removeExternalMember: researchOps.removeExternalMember,
          setTeamRole: researchOps.setTeamRole,
          getTeamRole: researchOps.getTeamRole,
          addCoInvestigator: researchOps.addCoInvestigator,
          removeCoInvestigator: researchOps.removeCoInvestigator,
          addMilestone: researchOps.addMilestone,
          toggleMilestone: researchOps.toggleMilestone,
          removeMilestone: researchOps.removeMilestone,
          getStudyCompleteness: researchOps.getStudyCompleteness,
          getProjectCompleteness: researchOps.getProjectCompleteness,
          researchLoading: researchOps.researchLoading,
          saveResearchLine: () => researchOps.saveResearchLine(saving),
          saveClinicalTrial: () => researchOps.saveClinicalTrial(saving),
          saveInnovationProject: () => researchOps.saveInnovationProject(saving),
          ...analyticsOps,
          loadResearchDashboard, // override with wired wrapper that passes research data refs
          ...dashOps,
          handleLogin, handleLogout,
          switchView, situationItems, dailyBriefing, systemSummary, toggleStatsSidebar,
          popover, showPopover, hidePopover,
          absenceCalendarOffset, absenceCalendarCells, absenceCalendarTitle, absenceMoveMonth,
          hoverPopover, showIntelPopover, hideIntelPopover,
          getStaffPulseState, getStaffNextEvent,
          absCalendarDays, absCalendarTitle, absCalendarMonth, absCalendarYear,
          absCalPrevMonth, absCalNextMonth, absenceViewMode, absTimelineHorizon, absTimelineOffset, absTimelinePlanning, absTimelineStaff, getStaffAbsencesInHorizon, getAbsenceBarStyle, absTimelineCoverage, absTimelineTodayPct, getAbsHorizonLabel, ABS_COLOURS,
          absCoverage30, getUnit30DayTimeline, deptPulseStats, handleGlobalSearch, globalSearchResults, clearSearch, closeSearchOnBlur, isOnline,
          getPhaseColor: (p) => Utils.getPhaseColor(p),
          getStageColor: (s) => Utils.getStageColor(s), loadStaffCertificates, loadStaffUnits,
          newsPosts, newsLoading, newsLoaded, newsModal, newsFilters, filteredNews,
          newsWordCount, newsWordLimit,
          loadNews, showAddNewsModal, editNews, saveNews,
          publishNews, archiveNews, deleteNews, toggleNewsFeature, toggleNewsPublic,
          newsAuthorName, newsLineName,
          newsDrawer, openNewsDrawer, closeNewsDrawer,
          newsDrawerPrev, newsDrawerNext, newsDrawerBodyParagraphs,
          newsDrawerInitials, newsDrawerAuthorFull, newsDrawerReadMins, newsDrawerLineName,
          drillToTrials, drillToProjects,
          portfolioKPIs,
          getLineAccent:     getLineAccentGlobal,

          systemSettings, saveSystemSettings, loadSystemSettings, confirmMaintenanceModeToggle, activeSvcId,
          permMgmt, sortedPermUsers, ALL_MODULES, loadPermissionUsers, getUserPerm, cyclePermission, toggleAdminLevel, permPillStyle, permSummary, permSummaryText, isAdmin,
          linkStaffModal, openLinkStaff, linkStaffCandidates, confirmLinkStaff, unlinkUserStaff,
          // Phase 3 features
          deleteWithUndo, pendingDeletes,
          notifications, loadNotifications, markNotifRead, markAllNotifsRead,
          toggleNotifBell, clickNotifItem, maybeLoadPermUsers,
          addNewsImage, uploadNewsImage, newsImageUploading, triggerNewsImagePicker,
          uploadStaffPhoto, staffPhotoUploading, triggerStaffPhotoPicker,
          toggleResidentManagerRole, toggleOncallManagerRole, toggleResearchCoordinator,
          bulkSelect, toggleBulkMode, toggleBulkItem, bulkApproveAbsences, bulkDeleteAbsences,
          exportCSV, downloadIcal, printView, downloadStaffSchedule, shareStaffProfile,
          // Ask bar (RAG intelligence surface)
          askBar, askBarSuggestions, askBarScan, askBarScanCount, askBarNow, askBarAudit, openAskBar, closeAskBar, askBarReset, askBarResolve, runSuggestion, askBarGoTo, askBarOpenStaff, askBarResolveClarified, askBarCopyAnswer, askBarEntityMenu, askBarEntityAction, askBarAlertAction, askBarSnooze, askBarRunFollowup,
          brainRows: _brainRows, brainLoading: _brainLoading, loadBrain, brainAdd, brainToggle, brainDelete, teachForm, teachMsg, teachSubmit, askBarToggleTeach,
          askBarPickLeaveReason, askBarConfirmLeave, askBarCancelLeave, askBarConfirmOncall, askBarCancelOncall, askBarPickReplacement, askBarRotaSwap, askBarConfirmRota, askBarCancelRota, askBarConfirmReturn, askBarCancelReturn, askBarConfirmRotation, askBarCancelRotation, askBarSourceDesc,
          onboarding, ONBOARDING_STEPS, startOnboarding, nextOnboardingStep, finishOnboarding,
          staffTypesList, staffTypeMap, academicDegrees, loadAcademicDegrees, formatStaffTypeGlobal, getStaffTypeClassGlobal, isResidentType, isOnCallEligible,
          staffTypesLoading, staffTypeModal, openAddStaffType, openEditStaffType, saveStaffType, deleteStaffType, toggleStaffTypeActive, loadStaffTypes,
          rotationServices, rotationServicesLoading, rotationServiceModal,
          loadRotationServices, openAddRotationService, openEditRotationService, saveRotationService, deleteRotationService,
          academicDegreeModal, openAddAcademicDegree, openEditAcademicDegree, saveAcademicDegree, deleteAcademicDegree,
          searchResultsOpen: ui.searchResultsOpen,
          sortState, sortBy, sortIcon, pagination,
          goToPage: (view, page) => {
            const arrMap = {
              medical_staff: staffOps.filteredMedicalStaffAll.value,
              rotations:     rotationOps.filteredRotationsAll.value,
              oncall:        onCallOps.filteredOnCallAll.value,
              absences:      absenceOps.filteredAbsencesAll.value,
              trials:        researchOps.filteredTrialsAll.value,
              projects:      researchOps.filteredProjectsAll.value
            }
            goToPage(view, page, arrMap[view] || [])
          },
          staffTotalPages: staffOps.staffTotalPages,
          compactStaffWithDividers: staffOps.compactStaffWithDividers,
          rotationTotalPages: rotationOps.rotationTotalPages,
          oncallTotalPages: onCallOps.oncallTotalPages,
          absenceTotalPages: absenceOps.absenceTotalPages,
          trialTotalPages: researchOps.trialTotalPages,
          projectTotalPages: researchOps.projectTotalPages,
          addKeyword: (form) => researchOps.addKeyword(form),
          removeKeyword: (form, idx) => researchOps.removeKeyword(form, idx),
          handleKeywordKey: (e, form) => researchOps.handleKeywordKey(e, form),
          fieldErrors, clearFieldError: (form, field) => clearFieldError(form, field),
          viewStaffDetails, toggleProfileSection, showUserProfileModal, saveUserProfile,
          getStaffName, getSupervisorName, getPhysicianName, getResidentName, getTrainingUnitName,
          calculateAbsenceDuration, getDaysRemaining, getDaysUntilStart, getRotationProgress,
          getCurrentRotationForStaff, isOnCallToday, getUpcomingOnCall,
          getUpcomingRotations, getUpcomingLeave, getRotationHistory, getRotationDaysLeft,
          getCurrentRotationSupervisor, hasProfessionalCredentials,
          getRotationServiceName,

          // ── Inline handler methods (extracted from templates — Vue doesn't allow const/if inline) ──
          // ── view resident from rotation row (lines 1928, 6365) ──
          openResidentProfile: (residentId) => {
            const s = (allStaffLookup?.value || []).find(x => x.id === residentId) || medicalStaff.value.find(x => x.id === residentId)
            if (s) viewStaffDetails(s)
          },
          // ── toggle PI/CoI investigator role on staff form (line 4913) ──
          toggleInvestigadorRole: () => {
            const f = staffOps.medicalStaffModal.form
            const isOn = f.can_be_pi || f.can_be_coi
            f.can_be_pi = !isOn
            f.can_be_coi = !isOn
            if (isOn) {
              f._investigadorLines = []
              f.is_research_coordinator = false
              f._coordLineId = null
            }
          },
          // ── toggle a research line on the investigador list (line 4942) ──
          toggleInvestigadorLine: (lineId) => {
            const f = staffOps.medicalStaffModal.form
            const lines = f._investigadorLines || []
            const idx = lines.indexOf(lineId)
            if (idx > -1) lines.splice(idx, 1)
            else lines.push(lineId)
            f._investigadorLines = [...lines]
          },

          onAddHospitalInline: async () => {
            const h = await staffOps.addHospitalInline(
              staffOps.medicalStaffModal._newHospitalName,
              staffOps.medicalStaffModal._newHospitalNetwork
            )
            if (h) {
              staffOps.medicalStaffModal.form.hospital_id = h.id
              staffOps.medicalStaffModal.form._networkHint = h.parent_complex
              staffOps.medicalStaffModal._addingHospital = false
              staffOps.medicalStaffModal._newHospitalName = ''
            }
          },
          onRotationServiceChange: () => {
            const id = staffOps.medicalStaffModal.form.home_department_id
            const svc = rotationServices.value.find(s => s.id === id)
            if (!svc) return
            const f = staffOps.medicalStaffModal.form
            if (!f.external_contact_name  && svc.contact_name)  f.external_contact_name  = svc.contact_name
            if (!f.external_contact_email && svc.contact_email) f.external_contact_email = svc.contact_email
            if (!f.external_contact_phone && svc.contact_phone) f.external_contact_phone = svc.contact_phone
          },
          onUnitNameInput: () => {
            if (trainingUnitModal.mode === 'add') {
              trainingUnitModal.form.unit_code = trainingUnitModal.form.unit_name
                .split(/\s+/).map(w => w[0] || '').join('').toUpperCase().slice(0, 6)
            }
          },

          formatStaffType, formatStaffTypeShortFn, getStaffTypeClass, formatEmploymentStatus, formatAbsenceReason,
          formatRotationStatus, getUserRoleDisplay, formatAudience, formatStudyStatus,
          getCurrentViewTitle, getCurrentViewSubtitle, getSearchPlaceholder,
          showPassword, loginError, loginFieldErrors, clearLoginError, handleForgotPassword,
          normalizeDate: (d) => Utils.normalizeDate(d),
          formatDate: (d) => Utils.formatDate(d),
          formatDrName: (n) => Utils.formatDrName(n),
          formatNewsDate: (d) => Utils.formatNewsDate(d),
          formatDateShort: (d) => Utils.formatDateShort(d),
          formatDatePlusDays: (d, n) => Utils.formatDatePlusDays(d, n),
          formatRelativeDate: (d) => Utils.formatRelativeDate(d),
          formatTime: (d) => Utils.formatTime(d),
          formatClinicalDuration: (s, e) => Utils.formatClinicalDuration(s, e),
          formatRelativeTime: (d) => Utils.formatRelativeTime(d),
          formatTimeAgo: (d) => Utils.formatRelativeTime(d),
          getInitials: (n) => Utils.getInitials(n),
          getTomorrow: () => Utils.getTomorrow(),
          getStaffTypeIcon, getAbsenceReasonIcon, nmAv, nmAvI, getAbsenceUnitImpact, getUnitAbsentAttendingCount, getUnitPresentAttendingCount, isUnitUnderstaffed, isStaffAbsentToday, calculateCapacityPercent, getUnitFillColor,
          understaffedUnitAlerts,
          getPreviewCardClass, getPreviewIcon, getPreviewReasonText,
          getPreviewStatusClass, getPreviewStatusText, updatePreview, requestFullDossier,
          getPhaseColor: Utils.getPhaseColor, getPartnerTypeColor: Utils.getPartnerTypeColor, getStageColor: Utils.getStageColor, getStageConfig: Utils.getStageConfig, PROJECT_STAGES: PROJECT_STAGES_DATA, formatPercentage: Utils.formatPercentage,
          availablePhysicians, availableResidents, availableAttendings, availableHeadsOfDepartment, availableReplacementStaff,
          // FIX 11: Partner needs options with an "Other" escape hatch handled in template
          availablePartnerNeeds: ['Financiación', 'Distribución', 'Fabricación', 'Software', 'Regulatorio', 'Ensayos clínicos', 'Licencia de tecnología', 'Co-desarrollo'],
          togglePartnerNeed: (need) => {
            const arr = researchOps.innovationProjectModal.form.partner_needs
            const idx = arr.indexOf(need)
            if (idx === -1) arr.push(need); else arr.splice(idx, 1)
          },
          // FIX 5: toggle helpers for co_investigators and sub_investigators arrays
          toggleCoInvestigator: (id) => {
            const arr = researchOps.clinicalTrialModal.form.co_investigators
            const idx = arr.indexOf(id)
            if (idx === -1) arr.push(id); else arr.splice(idx, 1)
          },
          toggleSubInvestigator: (id) => {
            const arr = researchOps.clinicalTrialModal.form.sub_investigators
            const idx = arr.indexOf(id)
            if (idx === -1) arr.push(id); else arr.splice(idx, 1)
          },
          toggleProjectCoInvestigator: (id) => {
            const arr = researchOps.innovationProjectModal.form.co_investigators
            const idx = arr.indexOf(id)
            if (idx === -1) arr.push(id); else arr.splice(idx, 1)
          },
          saveMedicalStaff: () => staffOps.saveMedicalStaff(saving),
          saveDepartment: () => saveDepartment(saving),
          saveTrainingUnit: () => saveTrainingUnit(saving, allDepartmentsLookup),
          saveRotation: () => rotationOps.saveRotation(saving),
          saveOnCallSchedule: () => onCallOps.saveOnCallSchedule(saving),
          saveOnCall: () => onCallOps.saveOnCallSchedule(saving),
          saveAbsence: () => absenceOps.saveAbsence(saving),
          saveUserProfile, hasPermission,
          dismissAlert: ui.dismissAlert, activeAlertsCount: ui.activeAlertsCount,
          
          // NEW: Compact view properties - now coming from composables
          rotationView,
          onCallView, oncallTab, oncallMonthOffset, calloutsByArea, calloutsByReason,
          oncallMonthEmptyCells, oncallMonthDays, getOncallShiftsForDay, isOncallCellToday, oncallMonthSummary, oncallChipStyle,
          residentsWithRotations: rotationOps.residentsWithRotations,
          groupedOnCallSchedules: onCallOps.groupedOnCallSchedules,
          staffWithOnCallOrbs: onCallOps.staffWithOnCallOrbs,
          upcomingOnCallDays:  onCallOps.upcomingOnCallDays,
          getRotationsForDay: rotationOps.getRotationsForDay,
          rotationViewModal: rotationOps.rotationViewModal,
          monthHorizon: rotationOps.monthHorizon,
          monthOffset:  rotationOps.monthOffset,
          getHorizonMonths:              rotationOps.getHorizonMonths,
          getHorizonRangeLabel:          rotationOps.getHorizonRangeLabel,
          getResidentRotationsInHorizon: rotationOps.getResidentRotationsInHorizon,
          getRotationBarStyle:           rotationOps.getRotationBarStyle,
          rotationStartsInHorizon:       rotationOps.rotationStartsInHorizon,
          rotationEndsInHorizon:         rotationOps.rotationEndsInHorizon,
          isRotationActive: rotationOps.isRotationActive,
          isShiftActive: onCallOps.isShiftActive,
          viewRotationDetails: rotationOps.viewRotationDetails,
          residentGapWarnings: rotationOps.residentGapWarnings,
          rgwCollapsed: rotationOps.rgwCollapsed,
          cmdQuery, cmdSelectedIdx, cmdItems, executeCmdItem,
          isOffline: ui.isOffline, isMaintenanceMode: ui.isMaintenanceMode,
          callouts, calloutsLoading, calloutSummary, calloutPeriod, calloutModal,
          calloutKPIs, calloutDistribution, calloutFairnessAlert, calloutReasonLabels, calloutTimeTypes,
          openLogCalloutModal, suggestCalloutArea, editCallout, saveCallout, deleteCallout,
          loadCallouts, loadCalloutSummary,
        }    
      }
    })

    app.config.errorHandler = (err, instance, info) => {
      console.error('[neumDesk render error]', err, info)
      const viewName = instance?.setupState?.currentView?.value
      showOnScreenError('Render error' + (viewName ? ' (' + viewName + ' view)' : ''), err, info)
    }

    app.mount('#app')

  } catch (error) {
    console.error('[neumDesk fatal error]', error)
    const safeMsg = (error && (error.message || String(error))) || 'Unknown error'
    const safeStack = (error && error.stack) ? String(error.stack).split('\n').slice(0, 6).join('\n') : ''
    document.body.innerHTML = `
      <div style="padding:40px;text-align:center;margin-top:100px;color:#333;font-family:Arial,sans-serif;">
        <h2 style="color:#dc3545;">⚠️ Application Error</h2>
        <p style="margin:20px 0;color:#666;">The application failed to load. Please refresh the page.</p>
        <pre style="text-align:left;max-width:700px;margin:0 auto 20px;padding:14px 16px;background:#1c1917;color:#fecaca;border-radius:8px;font-size:12px;white-space:pre-wrap;word-break:break-word;">${safeMsg}${safeStack ? '\n\n' + safeStack : ''}</pre>
        <button onclick="window.location.reload()"
                style="padding:12px 24px;background:#007bff;color:white;border:none;border-radius:6px;cursor:pointer;">
          🔄 Refresh Page
        </button>
      </div>`;
    throw error;    
  }
});
