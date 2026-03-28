// app.js
import { createApp, ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { createPinia } from 'pinia'
import {
  useUIStore, useUserStore, useStaffStore, useRotationStore,
  useTrainingStore, useOnCallStore, useAbsenceStore, useResearchStore, useNewsStore
} from './stores.js'
import { Utils } from './utils.js'
import { API } from './api.js'
import { PROJECT_STAGES } from './config.js'

const pinia = createPinia()

const app = createApp({  
  template: `
    <div>
      <!-- Login screen -->
      <div v-if="currentView === 'login'" class="login-container">
        <div class="login-card">
          <div class="lc-brand">
            <div class="lc-form">
              <div class="lc-field">
                <input v-model="loginForm.email" type="email" placeholder="Email" />
              </div>
              <div class="lc-field">
                <input v-model="loginForm.password" type="password" placeholder="Password" />
              </div>
              <button @click="handleLogin" :disabled="loginLoading">Login</button>
              <div v-if="loginError" class="login-error">{{ loginError }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Main app layout -->
      <div v-else class="app-layout">
        <div class="sidebar">
          <div class="sidebar-header">NeumoCare</div>
          <div class="sidebar-nav">
            <div @click="switchView('dashboard')" :class="{ active: currentView === 'dashboard' }">Dashboard</div>
            <div @click="switchView('medical_staff')" :class="{ active: currentView === 'medical_staff' }">Staff</div>
            <div @click="switchView('resident_rotations')" :class="{ active: currentView === 'resident_rotations' }">Rotations</div>
            <div @click="switchView('oncall_schedule')" :class="{ active: currentView === 'oncall_schedule' }">On-Call</div>
            <div @click="switchView('training_units')" :class="{ active: currentView === 'training_units' }">Training Units</div>
            <div @click="switchView('staff_absence')" :class="{ active: currentView === 'staff_absence' }">Absences</div>
            <div @click="switchView('research_hub')" :class="{ active: currentView === 'research_hub' }">Research</div>
            <div @click="switchView('news')" :class="{ active: currentView === 'news' }">News</div>
          </div>
        </div>
        
        <div class="main-content">
          <div class="top-navbar">
            <div class="navbar-title">{{ getCurrentViewTitle() }}</div>
          </div>
          
          <div class="content-area">
            <!-- Dashboard View -->
            <div v-if="currentView === 'dashboard'">
              <h2>Dashboard</h2>
              <div class="stats-grid">
                <div class="stat-card">Active Staff: {{ systemStats.activeAttending + systemStats.activeResidents }}</div>
                <div class="stat-card">On Call: {{ systemStats.onCallNow }}</div>
                <div class="stat-card">Active Rotations: {{ systemStats.activeRotations }}</div>
                <div class="stat-card">On Leave: {{ systemStats.onLeaveStaff }}</div>
              </div>
              <div v-if="dailyBriefing.length" class="daily-briefing">
                <h3>Daily Briefing</h3>
                <div v-for="item in dailyBriefing" :key="item.text" class="briefing-item">
                  {{ item.text }}
                </div>
              </div>
            </div>

            <!-- Staff View -->
            <div v-if="currentView === 'medical_staff'">
              <div class="filter-bar">
                <input v-model="staffFilters.search" placeholder="Search staff..." />
                <select v-model="staffFilters.staffType">
                  <option value="">All Types</option>
                  <option value="attending_physician">Attending</option>
                  <option value="medical_resident">Resident</option>
                  <option value="fellow">Fellow</option>
                </select>
                <select v-model="staffFilters.status">
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="on_leave">On Leave</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div class="table-responsive">
                <table class="table">
                  <thead>
                    <tr>
                      <th @click="sortBy('medical_staff', 'full_name')">Name <i :class="sortIcon('medical_staff', 'full_name')"></i></th>
                      <th @click="sortBy('medical_staff', 'staff_type')">Type <i :class="sortIcon('medical_staff', 'staff_type')"></i></th>
                      <th>Department</th>
                      <th @click="sortBy('medical_staff', 'employment_status')">Status <i :class="sortIcon('medical_staff', 'employment_status')"></i></th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="staff in filteredMedicalStaff" :key="staff.id" @click="viewStaffDetails(staff)">
                      <td>{{ staff.full_name }}</td>
                      <td><span :class="'badge ' + getStaffTypeClass(staff.staff_type)">{{ formatStaffType(staff.staff_type) }}</span></td>
                      <td>{{ getDepartmentName(staff.department_id) }}</td>
                      <td>{{ formatEmploymentStatus(staff.employment_status) }}</td>
                      <td class="table-actions">
                        <button class="btn-icon" @click.stop="editMedicalStaff(staff)"><i class="fas fa-edit"></i></button>
                        <button class="btn-icon" @click.stop="deleteMedicalStaff(staff)"><i class="fas fa-trash"></i></button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div class="pagination">
                <button @click="goToPage('medical_staff', pagination.medical_staff.page - 1)" :disabled="pagination.medical_staff.page === 1">Previous</button>
                <span>Page {{ pagination.medical_staff.page }} of {{ staffTotalPages }}</span>
                <button @click="goToPage('medical_staff', pagination.medical_staff.page + 1)" :disabled="pagination.medical_staff.page === staffTotalPages">Next</button>
              </div>
            </div>

            <!-- Rotations View -->
            <div v-if="currentView === 'resident_rotations'">
              <div class="filter-bar">
                <input v-model="rotationFilters.search" placeholder="Search resident..." />
                <select v-model="rotationFilters.status">
                  <option value="">All Status</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <div class="table-responsive">
                <table class="table">
                  <thead>
                    <tr>
                      <th @click="sortBy('rotations', 'resident_id')">Resident <i :class="sortIcon('rotations', 'resident_id')"></i></th>
                      <th>Unit</th>
                      <th @click="sortBy('rotations', 'start_date')">Start Date <i :class="sortIcon('rotations', 'start_date')"></i></th>
                      <th @click="sortBy('rotations', 'end_date')">End Date <i :class="sortIcon('rotations', 'end_date')"></i></th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="rot in filteredRotations" :key="rot.id" @click="viewRotationDetails(rot)">
                      <td>{{ getResidentName(rot.resident_id) }}</td>
                      <td>{{ getTrainingUnitName(rot.training_unit_id) }}</td>
                      <td>{{ formatDate(rot.start_date) }}</td>
                      <td>{{ formatDate(rot.end_date) }}</td>
                      <td><span class="badge" :class="{ 'badge-success': rot.rotation_status === 'active', 'badge-info': rot.rotation_status === 'scheduled', 'badge-secondary': rot.rotation_status === 'completed' }">{{ formatRotationStatus(rot.rotation_status) }}</span></td>
                      <td class="table-actions">
                        <button class="btn-icon" @click.stop="editRotation(rot)"><i class="fas fa-edit"></i></button>
                        <button class="btn-icon" @click.stop="deleteRotation(rot)"><i class="fas fa-trash"></i></button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- On-Call View -->
            <div v-if="currentView === 'oncall_schedule'">
              <div class="filter-bar">
                <input v-model="onCallFilters.search" placeholder="Search physician..." />
                <input type="date" v-model="onCallFilters.date" />
              </div>
              <div class="table-responsive">
                <table class="table">
                  <thead>
                    <tr>
                      <th @click="sortBy('oncall', 'duty_date')">Date <i :class="sortIcon('oncall', 'duty_date')"></i></th>
                      <th>Primary Physician</th>
                      <th>Backup Physician</th>
                      <th>Shift Type</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="schedule in filteredOnCallSchedules" :key="schedule.id">
                      <td>{{ formatDate(schedule.duty_date) }} <span v-if="isToday(schedule.duty_date)" class="badge badge-success">Today</span></td>
                      <td>{{ getPhysicianName(schedule.primary_physician_id) }}</td>
                      <td>{{ getPhysicianName(schedule.backup_physician_id) || '—' }}</td>
                      <td><span class="badge" :class="{ 'badge-primary': schedule.shift_type === 'primary_call', 'badge-secondary': schedule.shift_type === 'backup_call' }">{{ schedule.shift_type === 'primary_call' ? 'Primary' : 'Backup' }}</span></td>
                      <td class="table-actions">
                        <button class="btn-icon" @click.stop="editOnCallSchedule(schedule)"><i class="fas fa-edit"></i></button>
                        <button class="btn-icon" @click.stop="deleteOnCallSchedule(schedule)"><i class="fas fa-trash"></i></button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Training Units View -->
            <div v-if="currentView === 'training_units'">
              <div class="filter-bar">
                <input v-model="trainingUnitFilters.search" placeholder="Search units..." />
              </div>
              <div class="training-units-grid">
                <div v-for="unit in filteredTrainingUnits" :key="unit.id" class="training-unit-card" @click="openUnitDetail(unit)">
                  <div class="training-unit-header">
                    <div class="training-unit-title">
                      <i class="fas fa-hospital-user"></i>
                      <span>{{ unit.unit_name }}</span>
                    </div>
                    <span class="badge" :class="{ 'badge-success': unit.unit_status === 'active', 'badge-secondary': unit.unit_status !== 'active' }">{{ unit.unit_status }}</span>
                  </div>
                  <div class="training-unit-stats">
                    <div class="training-unit-stat-row">
                      <span class="training-unit-stat-label">Capacity</span>
                      <span>{{ getUnitActiveRotationCount(unit.id) }} / {{ unit.maximum_residents }}</span>
                    </div>
                    <div class="training-unit-stat-row">
                      <span class="training-unit-stat-label">Scheduled</span>
                      <span>{{ getUnitScheduledCount(unit.id) }}</span>
                    </div>
                    <div class="training-unit-stat-row">
                      <span class="training-unit-stat-label">Department</span>
                      <span>{{ getDepartmentName(unit.department_id) }}</span>
                    </div>
                  </div>
                  <div class="training-unit-actions">
                    <button class="btn-sm btn-outline" @click.stop="editTrainingUnit(unit)">Edit</button>
                    <button class="btn-sm btn-outline" @click.stop="viewUnitResidents(unit)">Residents</button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Absences View -->
            <div v-if="currentView === 'staff_absence'">
              <div class="filter-bar">
                <input v-model="absenceFilters.search" placeholder="Search staff..." />
                <select v-model="absenceFilters.reason">
                  <option value="">All Reasons</option>
                  <option value="vacation">Vacation</option>
                  <option value="sick_leave">Sick Leave</option>
                  <option value="personal">Personal</option>
                </select>
              </div>
              <div class="table-responsive">
                <table class="table">
                  <thead>
                    <tr>
                      <th @click="sortBy('absences', 'staff_member_id')">Staff <i :class="sortIcon('absences', 'staff_member_id')"></i></th>
                      <th @click="sortBy('absences', 'start_date')">Start Date <i :class="sortIcon('absences', 'start_date')"></i></th>
                      <th @click="sortBy('absences', 'end_date')">End Date <i :class="sortIcon('absences', 'end_date')"></i></th>
                      <th>Reason</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="absence in filteredAbsences" :key="absence.id">
                      <td>{{ getStaffName(absence.staff_member_id) }}</td>
                      <td>{{ formatDate(absence.start_date) }}</td>
                      <td>{{ formatDate(absence.end_date) }}</td>
                      <td>{{ formatAbsenceReason(absence.absence_reason) }}</td>
                      <td><span class="badge" :class="{ 'badge-warning': absence.current_status === 'currently_absent', 'badge-info': absence.current_status === 'upcoming', 'badge-success': absence.current_status === 'returned_to_duty' }">{{ absence.current_status }}</span></td>
                      <td class="table-actions">
                        <button class="btn-icon" @click.stop="editAbsence(absence)"><i class="fas fa-edit"></i></button>
                        <button class="btn-icon" @click.stop="deleteAbsence(absence)"><i class="fas fa-trash"></i></button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Research Hub View -->
            <div v-if="currentView === 'research_hub'">
              <h2>Research Hub</h2>
              <div class="research-lines-grid">
                <div v-for="line in researchStore.researchLines" :key="line.id" class="research-line-card">
                  <div class="research-line-header">
                    <span class="research-line-number">L{{ line.line_number }}</span>
                    <div class="research-line-actions">
                      <button class="btn-icon" @click="editResearchLine(line)"><i class="fas fa-edit"></i></button>
                    </div>
                  </div>
                  <div class="research-line-name">{{ line.research_line_name || line.name }}</div>
                  <div class="research-line-description">{{ line.description }}</div>
                </div>
              </div>
            </div>

            <!-- News View -->
            <div v-if="currentView === 'news'">
              <h2>News & Updates</h2>
              <div v-for="post in newsStore.filteredNews" :key="post.id" class="news-card" @click="openNewsDrawer(post)">
                <div class="news-card-body">
                  <div class="news-card-title">{{ post.title }}</div>
                  <div class="news-card-meta">
                    <span class="news-meta-item"><i class="far fa-calendar-alt"></i> {{ formatNewsDate(post.created_at) }}</span>
                    <span class="news-meta-item"><i class="far fa-user"></i> {{ newsAuthorName(post.author_id) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  setup() {
    // ── Stores ─────────────────────────────────────────────────────────────
    const uiStore       = useUIStore()
    const userStore     = useUserStore()
    const staffStore    = useStaffStore()
    const rotationStore = useRotationStore()
    const trainingStore = useTrainingStore()
    const onCallStore   = useOnCallStore()
    const absenceStore  = useAbsenceStore()
    const researchStore = useResearchStore()
    const newsStore     = useNewsStore()

    // ── Local state ─────────────────────────────────────────────────────────
    const loading      = ref(false)
    const saving       = ref(false)
    const showPassword = ref(false)
    const currentTime  = ref(new Date())
    const currentView  = ref('login')

    // View modes
    const staffView          = ref('table')
    const onCallView         = ref('detailed')
    const rotationView       = ref('detailed')
    const researchHubTab     = ref('lines')
    const analyticsActiveTab = ref('dashboard')

    // Filters (local — mirror store filters for template v-model convenience)
    const staffFilters       = reactive({ search: '', staffType: '', department: '', status: '', residentCategory: '', hospital: '', networkType: '' })
    const rotationFilters    = reactive({ resident: '', status: '', trainingUnit: '', supervisor: '', search: '' })
    const onCallFilters      = reactive({ date: '', shiftType: '', physician: '', coverageArea: '', search: '' })
    const absenceFilters     = reactive({ staff: '', status: '', reason: '', startDate: '', search: '', hideReturned: true })
    const trainingUnitFilters= reactive({ search: '', department: '', status: '' })
    const trialFilters       = reactive({ line: '', phase: '', status: '', search: '' })
    const projectFilters     = reactive({ research_line_id: '', category: '', stage: '', funding_status: '', search: '' })

    // Pagination & sort (local — used by computed filtered lists below)
    const pagination = reactive({
      medical_staff: { page: 1, size: 15 },
      rotations:     { page: 1, size: 15 },
      oncall:        { page: 1, size: 15 },
      absences:      { page: 1, size: 15 }
    })
    const sortState = reactive({
      medical_staff: { field: 'full_name',  dir: 'asc'  },
      rotations:     { field: 'start_date', dir: 'desc' },
      oncall:        { field: 'duty_date',  dir: 'asc'  },
      absences:      { field: 'start_date', dir: 'desc' }
    })

    // Modals
    const staffProfileModal      = reactive({ show: false, staff: null, activeTab: 'activity', collapsed: {}, researchProfile: null, supervisionData: null, leaveBalance: null, loadingResearch: false, loadingSupervision: false, loadingLeave: false })
    const medicalStaffModal      = reactive({ show: false, mode: 'add', activeTab: 'basic', _addingHospital: false, _newHospitalName: '', _newHospitalNetwork: 'external', _certs: [], _addingCert: false, _newCert: { name: '', issued_month: '', renewal_months: 24 }, _addingStaffType: false, _newStaffTypeName: '', _newStaffTypeIsResident: false, _savingStaffType: false, form: {} })
    const rotationModal          = reactive({ show: false, mode: 'add', checkingAvailability: false, availability: null, form: {} })
    const rotationViewModal      = reactive({ show: false, rotation: null })
    const activationModal        = reactive({ show: false, rotations: [], selectedRotation: null, notes: '', action: 'activate' })
    const onCallModal            = reactive({ show: false, mode: 'add', form: {} })
    const absenceModal           = reactive({ show: false, mode: 'add', form: {} })
    const absenceResolutionModal = reactive({ show: false, absence: null, action: null, saving: false, returnDate: '', returnNotes: '', extendedEndDate: '' })
    const trainingUnitModal      = reactive({ show: false, mode: 'add', form: {} })
    const unitResidentsModal     = reactive({ show: false, unit: null, rotations: [] })
    const unitCliniciansModal    = reactive({ show: false, unit: null, clinicians: [], supervisorId: '', allStaff: [] })
    const unitDetailDrawer       = reactive({ show: false, unit: null })
    const occupancyPanel         = reactive({ show: false })
    const tlPopover              = reactive({ show: false, unitName: '', slotIdx: 0, monthLabel: '', entries: [], x: 0, y: 0 })
    const researchLineModal      = reactive({ show: false, mode: 'add', form: {} })
    const clinicalTrialModal     = reactive({ show: false, mode: 'add', form: {} })
    const innovationProjectModal = reactive({ show: false, mode: 'add', form: {} })
    const assignCoordinatorModal = reactive({ show: false, lineId: null, lineName: '', selectedCoordinatorId: '' })
    const trialDetailModal       = reactive({ show: false, trial: null })
    const deptPanel              = reactive({ show: false, dept: null, tab: 'staff' })
    const reassignmentModal      = reactive({ show: false, staff: null, saving: false, affectedShifts: [], affectedRotations: [], affectedAbsences: [], replacements: {} })
    const deptReassignModal      = reactive({ show: false, dept: null, impact: { activeStaff: [], activeUnits: [], activeRotations: [] }, staffTargetDeptId: '', unitsTargetDeptId: '' })
    const staffTypeModal         = reactive({ show: false, mode: 'add', saving: false, form: {} })
    const exportModal            = reactive({ show: false, type: 'clinical-trials', format: 'csv', loading: false })
    const userProfileModal       = reactive({ show: false, form: { full_name: '', email: '', department_id: '', linked_staff_id: null } })
    const announcementReadModal  = reactive({ show: false, announcement: null })
    const communicationsModal    = reactive({ show: false, activeTab: 'announcement', mode: 'add', form: {} })

    // System data
    const systemStats           = reactive({ totalStaff: 0, activeAttending: 0, activeResidents: 0, onCallNow: 0, activeRotations: 0, endingThisWeek: 0, startingNextWeek: 0, onLeaveStaff: 0, departmentStatus: 'normal', activePatients: 0, icuOccupancy: 0, wardOccupancy: 0 })
    const clinicalStatus        = ref(null)
    const clinicalStatusHistory = ref([])
    const isLoadingStatus       = ref(false)
    const newStatusText         = ref('')
    const selectedAuthorId      = ref('')
    const expiryHours           = ref(8)
    const liveStatsEditMode     = ref(false)
    const researchDashboard     = ref(null)
    const researchLinesPerformance = ref([])
    const partnerCollaborations = ref(null)
    const trialsTimeline        = ref(null)
    const analyticsSummary      = ref(null)
    const loadingAnalytics      = ref(false)
    const dailyBriefing         = ref([])
    const todaysOnCall          = ref([])
    const residentGapWarnings   = ref([])
    const announcements         = ref([])
    const departments           = ref([])

    // Login (local — kept here to avoid cross-contamination with store)
    const loginForm    = ref({ email: '', password: '', remember_me: false })
    const loginLoading = ref(false)
    const loginError   = ref('')

    // ── Formatting helpers ──────────────────────────────────────────────────
    const hasPermission          = (module, action) => userStore.hasPermission(module, action)
    const formatDate             = (d) => Utils.formatDate(d)
    const formatDateShort        = (d) => Utils.formatDateShort(d)
    const formatRelativeDate     = (d) => Utils.formatRelativeDate(d)
    const formatTime             = (d) => Utils.formatTime(d)
    const formatRelativeTime     = (d) => Utils.formatRelativeTime(d)
    const formatTimeAgo          = (d) => Utils.formatRelativeTime(d)
    const formatNewsDate         = (d) => Utils.formatNewsDate(d)
    const formatClinicalDuration = (s, e) => Utils.formatClinicalDuration(s, e)
    const normalizeDate          = (d) => Utils.normalizeDate(d)
    const getInitials            = (n) => Utils.getInitials(n)
    const formatPercentage       = (v, t) => Utils.formatPercentage(v, t)
    const getPhaseColor          = (p) => Utils.getPhaseColor(p)
    const getStageColor          = (s) => Utils.getStageColor(s)
    const getStageConfig         = (s) => Utils.getStageConfig(s)
    const getPartnerTypeColor    = (t) => Utils.getPartnerTypeColor(t)
    const getTomorrow            = ()  => Utils.getTomorrow ? Utils.getTomorrow() : new Date(Date.now() + 86400000)

    const getStaffName        = (id) => staffStore.getStaffName(id)
    const getResidentName     = (id) => staffStore.getStaffName(id)
    const getSupervisorName   = (id) => staffStore.getStaffName(id)
    const getPhysicianName    = (id) => staffStore.getStaffName(id)
    const getTrainingUnitName = (id) => trainingStore.getTrainingUnitName(id)
    const getDepartmentName   = (id) => departments.value.find(d => d.id === id)?.name || ''
    const getResearchLineName = (id) => researchStore.getResearchLineName(id)
    const getLineAccent       = (n)  => researchStore.getLineAccent(n)

    const formatStaffType       = (t) => staffStore.formatStaffType(t)
    const formatStaffTypeShort  = (t) => staffStore.formatStaffTypeShort(t)
    const getStaffTypeClass     = (t) => staffStore.getStaffTypeClass(t)
    const isResidentType        = (t) => staffStore.isResidentType(t)
    const formatEmploymentStatus= (s) => staffStore.formatEmploymentStatus(s)
    const formatAbsenceReason   = (r) => absenceStore.formatAbsenceReason(r)
    const formatRotationStatus  = (s) => rotationStore.formatRotationStatus(s)
    const formatStudyStatus     = (s) => ({ 'Reclutando': 'Recruiting', 'Activo': 'Active', 'Completado': 'Completed', 'Suspendido': 'Suspended' }[s] || s)
    const formatAudience        = (a) => ({ all_staff: 'All Staff', all: 'All (incl. admin)', residents_only: 'Residents Only', attending_only: 'Attendings Only' }[a] || a)
    const formatTrainingYear    = (y) => Utils.formatTrainingYear(y)
    const formatPhone           = (p) => Utils.formatPhone(p)
    const formatLicense         = (l) => Utils.formatLicense(l)
    const formatSpecialization  = (s) => Utils.formatSpecialization(s)
    const effectiveResidentYear = (s) => Utils.effectiveResidentYear(s)
    const getRoleInfo           = (r) => Utils.getRoleInfo(r)
    const getStaffRoles         = (s) => Utils.getStaffRoles(s)
    const getResidentCategoryInfo       = (c, s) => Utils.getResidentCategoryInfo(c, s)
    const formatResidentCategorySimple  = (c)    => Utils.getResidentCategoryInfo(c).shortText
    const formatResidentCategoryDetailed= (s)    => s?.resident_category ? Utils.getResidentCategoryInfo(s.resident_category, s).text : null
    const getResidentCategoryIcon       = (c)    => Utils.getResidentCategoryInfo(c).icon
    const getResidentCategoryTooltip    = (s)    => {
      if (!s?.resident_category) return ''
      const map = { department_internal: 'Department internal resident', rotating_other_dept: s.home_department ? `Rotating from ${s.home_department} department` : 'Resident from another department', external_resident: s.external_institution ? `External resident from ${s.external_institution}` : 'External resident from another institution' }
      return map[s.resident_category] || ''
    }

    const calculateAbsenceDuration = (s, e) => Utils.dateDiff(s, e)
    const getDaysRemaining          = (d) => Utils.daysUntil(d)
    const getDaysUntilStart         = (d) => Utils.daysUntil(d)
    const getDaysRemainingColor     = (days) => { if (days <= 0) return '#ef4444'; if (days < 5) return '#f59e0b'; return '#10b981' }
    const isToday                   = (d) => onCallStore.isToday(d)

    // Rotation helpers
    const getHorizonMonths            = (n, offset) => rotationStore.getHorizonMonths(n, offset)
    const getHorizonRangeLabel        = ()           => rotationStore.getHorizonRangeLabel()
    const getResidentRotationsInHorizon = (r)        => rotationStore.getResidentRotationsInHorizon(r)
    const getRotationBarStyle         = (r)          => rotationStore.getRotationBarStyle(r)
    const rotationStartsInHorizon     = (r)          => rotationStore.rotationStartsInHorizon(r)
    const rotationEndsInHorizon       = (r)          => rotationStore.rotationEndsInHorizon(r)
    const isRotationActive            = (r)          => r.rotation_status === 'active'
    const isShiftActive               = (s)          => onCallStore.isToday(s.duty_date)

    const getRotationProgress = (rotation) => {
      if (!rotation) return { pct: 0, label: '', urgent: false, done: false }
      const start = new Date(Utils.normalizeDate(rotation.start_date) + 'T00:00:00')
      const end   = new Date(Utils.normalizeDate(rotation.end_date) + 'T23:59:59')
      const now   = new Date()
      if (rotation.rotation_status === 'completed') return { pct: 100, label: 'Completed', urgent: false, done: true }
      if (isNaN(start.getTime()) || isNaN(end.getTime())) return { pct: 0, label: '', urgent: false, done: false }
      const pct = Math.min(100, Math.max(0, Math.round((now - start) / (end - start) * 100)))
      const daysLeft = Math.ceil((end - now) / 86400000)
      return { pct, label: daysLeft <= 0 ? 'Ending' : daysLeft === 1 ? '1 day left' : `${daysLeft}d left`, urgent: daysLeft <= 7 && daysLeft >= 0, done: false }
    }
    const getCurrentRotationForStaff = (id) => rotationStore.rotations.find(r => r.resident_id === id && r.rotation_status === 'active')
    const getRotationHistory         = (id) => rotationStore.rotations.filter(r => r.resident_id === id && !['active', 'scheduled'].includes(r.rotation_status))
    const getUpcomingRotations       = (id) => rotationStore.rotations.filter(r => r.resident_id === id && ['active', 'scheduled'].includes(r.rotation_status))
    const getRotationDaysLeft        = (id) => { const r = getCurrentRotationForStaff(id); return r ? Utils.daysUntil(r.end_date) : 0 }
    const getCurrentRotationSupervisor = (id) => { const r = getCurrentRotationForStaff(id); return r?.supervising_attending_id ? getStaffName(r.supervising_attending_id) : 'Not assigned' }
    const viewRotationDetails        = (rotation) => {
      rotationViewModal.rotation = { ...rotation, unitName: getTrainingUnitName(rotation.training_unit_id), residentName: getResidentName(rotation.resident_id), supervisorName: getStaffName(rotation.supervising_attending_id) || '—', clinicalDuration: Utils.formatClinicalDuration(rotation.start_date, rotation.end_date), daysTotal: Math.max(1, Math.round((new Date(rotation.end_date) - new Date(rotation.start_date)) / 86400000)), daysLeft: Math.max(0, Math.round((new Date(rotation.end_date) - new Date()) / 86400000)) }
      rotationViewModal.show = true
    }

    // Training unit helpers
    const getUnitActiveRotationCount = (id) => trainingStore.getUnitActiveRotationCount(id)
    const getUnitRotations           = (id) => trainingStore.getUnitRotations(id)
    const getUnitScheduledCount      = (id) => trainingStore.getUnitScheduledCount(id)
    const getUnitOverlapWarning      = (id) => trainingStore.getUnitOverlapWarning(id)
    const getUnitMonthOccupancy      = (unitId, year, month) => trainingStore.getUnitMonthOccupancy(unitId, year, month)
    const getNextFreeMonth           = (unitId) => trainingStore.getNextFreeMonth(unitId)
    const getTimelineMonths          = (n) => trainingStore.getTimelineMonths(n)
    const getUnitSlots               = (unitId, max, horizon) => trainingStore.getUnitSlots(unitId, max, horizon)
    const getDaysUntilFree           = (endDate) => trainingStore.getDaysUntilFree(endDate)
    const getResidentShortName       = (id) => { const name = getStaffName(id); if (!name || name === 'Not assigned') return '—'; const parts = name.trim().split(' '); return parts.length > 1 ? `${parts[0][0]}. ${parts[parts.length - 1]}` : name }

    // On-call helpers
    const isOnCallToday   = (staffId) => onCallStore.onCallSchedule.some(s => (s.primary_physician_id === staffId || s.backup_physician_id === staffId) && onCallStore.isToday(s.duty_date))
    const getUpcomingOnCall = (staffId) => onCallStore.onCallSchedule.filter(s => (s.primary_physician_id === staffId || s.backup_physician_id === staffId) && Utils.normalizeDate(s.duty_date) >= Utils.normalizeDate(new Date()))
    const getUpcomingLeave  = (staffId) => absenceStore.absences.filter(a => a.staff_member_id === staffId && Utils.normalizeDate(a.start_date) >= Utils.normalizeDate(new Date()) && a.current_status !== 'cancelled')

    // Research helpers
    const addKeyword     = (form) => researchStore.addKeyword(form)
    const removeKeyword  = (form, idx) => researchStore.removeKeyword(form, idx)
    const handleKeywordKey = (e, form) => researchStore.handleKeywordKey(e, form)

    // News helpers
    const newsWordCount = computed(() => newsStore.newsWordCount)
    const newsWordLimit = 5000
    const newsAuthorName = (id) => newsStore.formatAuthorName(id)
    const newsLineName   = (id) => newsStore.getLineName(id)

    // ── Pagination & sort ───────────────────────────────────────────────────
    const goToPage = (view, page) => { if (pagination[view]) pagination[view].page = page }
    const sortBy   = (view, field) => {
      const s = sortState[view]; if (!s) return
      s.dir = (s.field === field && s.dir === 'asc') ? 'desc' : 'asc'; s.field = field
    }
    const sortIcon = (view, field) => {
      const s = sortState[view]; if (!s || s.field !== field) return 'fa-sort'
      return s.dir === 'asc' ? 'fa-sort-up' : 'fa-sort-down'
    }

    // ── View / navigation ───────────────────────────────────────────────────
    const getCurrentViewTitle = () => {
      const t = { dashboard: 'Dashboard Overview', medical_staff: 'Medical Staff Management', oncall_schedule: 'On-call Schedule', resident_rotations: 'Resident Rotations', training_units: 'Clinical Units', staff_absence: 'Staff Absence Management', research_hub: 'Research Hub', news: 'News & Posts' }
      return t[currentView.value] || 'NeumoCare Dashboard'
    }
    const getCurrentViewSubtitle = () => {
      const s = { dashboard: 'Real-time department overview and analytics', medical_staff: 'Manage physicians, residents, and clinical staff', oncall_schedule: 'View and manage on-call physician schedules', resident_rotations: 'Track and manage resident training rotations', training_units: 'Clinical units and resident assignments', staff_absence: 'Track staff absences and coverage assignments', research_hub: 'Research lines, studies, projects and analytics', news: 'Department news and publications' }
      return s[currentView.value] || ''
    }
    const getSearchPlaceholder = () => {
      const p = { medical_staff: 'Search staff...', oncall_schedule: 'Search schedule...', resident_rotations: 'Search rotations...', training_units: 'Search units...', staff_absence: 'Search absences...', research_hub: 'Search research...' }
      return p[currentView.value] || 'Search...'
    }

    const switchView = async (view, filters = {}) => {
      currentView.value = view
      uiStore.mobileMenuOpen = false; uiStore.searchResultsOpen = false
      if (filters.department)       staffFilters.department = filters.department
      if (filters.residentCategory) { staffFilters.staffType = 'medical_resident'; staffFilters.residentCategory = filters.residentCategory }
      if (filters.rotationStatus)   rotationFilters.status = filters.rotationStatus
      if (filters.trainingUnit)     rotationFilters.trainingUnit = filters.trainingUnit
      if (view === 'research_hub' && researchStore.researchLines.length === 0) {
        await Promise.all([researchStore.loadResearchLines(), researchStore.loadClinicalTrials(), researchStore.loadInnovationProjects()])
      }
    }

    const handleGlobalSearch = () => { if (uiStore.globalSearchQuery.trim()) uiStore.searchResultsOpen = true }
    const clearSearch         = () => { uiStore.globalSearchQuery = ''; uiStore.searchResultsOpen = false }
    const globalSearchResults = computed(() => {
      const q = uiStore.globalSearchQuery.toLowerCase().trim(); if (!q || q.length < 2) return []
      const results = []
      staffStore.medicalStaff.filter(s => s.full_name?.toLowerCase().includes(q)).slice(0, 5).forEach(s => results.push({ type: 'staff', icon: 'fa-user-md', label: s.full_name, sub: staffStore.formatStaffType(s.staff_type), action: () => { viewStaffDetails(s); uiStore.searchResultsOpen = false } }))
      researchStore.researchLines.filter(l => (l.research_line_name || l.name)?.toLowerCase().includes(q)).slice(0, 3).forEach(l => results.push({ type: 'research', icon: 'fa-flask', label: l.research_line_name || l.name, sub: 'Research Line', action: () => { switchView('research_hub'); uiStore.searchResultsOpen = false } }))
      return results
    })

    // ── Auth ────────────────────────────────────────────────────────────────
    const handleLogin = async () => {
      if (!loginForm.value.email || !loginForm.value.password) {
        uiStore.showToast('Error', 'Please fill all required fields', 'error'); return
      }
      loginLoading.value = true; loginError.value = ''
      try {
        const response = await API.login(loginForm.value.email, loginForm.value.password)
        userStore.currentUser = response.user
        localStorage.setItem('neumocare_user', JSON.stringify(response.user))
        uiStore.showToast('Success', `Welcome, ${response.user.full_name}!`, 'success')
        await loadAllData()
        currentView.value = 'dashboard'
      } catch (e) {
        loginError.value = e.message || 'Invalid email or password'
        uiStore.showToast('Error', 'Login failed', 'error')
      } finally { loginLoading.value = false }
    }

    const handleLogout = () => {
      uiStore.showConfirmation({
        title: 'Logout', message: 'Are you sure you want to logout?',
        icon: 'fa-sign-out-alt', confirmButtonText: 'Logout', confirmButtonClass: 'btn-danger',
        onConfirm: async () => { await userStore.logout(); currentView.value = 'login' }
      })
    }

    const showUserProfileModal = () => {
      userProfileModal.form.full_name = userStore.currentUser?.full_name || ''
      userProfileModal.form.email = userStore.currentUser?.email || ''
      userProfileModal.show = true; uiStore.userMenuOpen = false
    }
    const saveUserProfile = async () => {
      saving.value = true
      try {
        userStore.currentUser.full_name = userProfileModal.form.full_name
        localStorage.setItem('neumocare_user', JSON.stringify(userStore.currentUser))
        userProfileModal.show = false; uiStore.showToast('Success', 'Profile updated', 'success')
      } catch { uiStore.showToast('Error', 'Failed to update profile', 'error') }
      finally { saving.value = false }
    }
    const hasProfessionalCredentials = (s) => !!(s?.medical_license || s?.clinical_certificate || s?.specialization)

    // ── Staff actions ───────────────────────────────────────────────────────
    const viewStaffDetails = (staff) => {
      if (!staff?.id) return
      staffProfileModal.staff = staff; staffProfileModal.activeTab = 'activity'; staffProfileModal.show = true
    }

    const showAddMedicalStaffModal = (opts = {}) => {
      medicalStaffModal.mode = 'add'; medicalStaffModal.activeTab = 'basic'
      medicalStaffModal._addingHospital = false; medicalStaffModal._newHospitalName = ''; medicalStaffModal._newHospitalNetwork = 'external'
      medicalStaffModal._addingStaffType = false; medicalStaffModal._newStaffTypeName = ''; medicalStaffModal._newStaffTypeIsResident = false; medicalStaffModal._savingStaffType = false
      medicalStaffModal.form = { full_name: '', staff_type: 'medical_resident', staff_id: `MD-${Date.now().toString().slice(-6)}`, employment_status: 'active', professional_email: '', department_id: opts.department_id || '', academic_degree: '', specialization: '', training_year: '', clinical_certificate: '', certificate_status: '', mobile_phone: '', office_phone: '', medical_license: '', can_supervise_residents: false, special_notes: '', can_be_pi: false, can_be_coi: false, other_certificate: '', resident_category: null, home_department: null, external_institution: null, home_department_id: null, external_contact_name: null, external_contact_email: null, external_contact_phone: null, academic_degree_id: null, has_medical_license: false, residency_start_date: null, residency_year_override: null, is_chief_of_department: false, is_research_coordinator: false, is_resident_manager: false, is_oncall_manager: false, clinical_study_certificates: [], hospital_id: null, has_phd: false, phd_field: '', years_experience: null, _networkHint: null }
      medicalStaffModal.show = true
    }

    const editMedicalStaff = (staff) => {
      medicalStaffModal.mode = 'edit'; medicalStaffModal.activeTab = 'basic'
      medicalStaffModal.form = { ...staff }; medicalStaffModal.show = true
    }

    const saveMedicalStaff = async () => {
      saving.value = true
      try {
        const f = medicalStaffModal.form
        if (medicalStaffModal.mode === 'edit') { await staffStore.updateStaff(f.id, f) }
        else { await staffStore.createStaff(f) }
        medicalStaffModal.show = false
      } catch (e) { uiStore.showToast('Error', e?.message || 'Failed to save staff', 'error') }
      finally { saving.value = false }
    }

    const deleteMedicalStaff = (staff) => {
      uiStore.showConfirmation({
        title: 'Remove Staff Member', message: `Remove ${staff.full_name} from active staff?`,
        icon: 'fa-user-times', confirmButtonText: 'Confirm Removal', confirmButtonClass: 'btn-danger',
        details: 'All historical records are preserved for audit purposes.',
        onConfirm: async () => { await staffStore.deleteStaff(staff.id) }
      })
    }

    // ── Rotation actions ────────────────────────────────────────────────────
    const showAddRotationModal = (resident = null, unit = null) => {
      rotationModal.mode = 'add'
      rotationModal.form = { rotation_id: `ROT-${Date.now().toString().slice(-6)}`, resident_id: resident?.id || '', training_unit_id: unit?.id || '', start_date: Utils.localDateStr(new Date()), end_date: Utils.localDateStr(new Date(Date.now() + 30 * 86400000)), rotation_status: 'scheduled', rotation_category: 'clinical_rotation', supervising_attending_id: '' }
      rotationModal.show = true
    }
    const editRotation = (rotation) => {
      rotationModal.mode = 'edit'
      rotationModal.form = { ...rotation, start_date: Utils.normalizeDate(rotation.start_date), end_date: Utils.normalizeDate(rotation.end_date) }
      rotationModal.show = true
    }
    const saveRotation = async () => {
      saving.value = true
      try {
        const f = rotationModal.form
        if (rotationModal.mode === 'edit') { await rotationStore.updateRotation(f.id, f) }
        else { await rotationStore.createRotation(f) }
        rotationModal.show = false
      } catch (e) { uiStore.showToast('Error', e?.message || 'Failed to save rotation', 'error') }
      finally { saving.value = false }
    }
    const deleteRotation = (rotation) => {
      uiStore.showConfirmation({
        title: 'Terminate Rotation', message: 'This will mark the rotation as terminated early.',
        icon: 'fa-stop-circle', confirmButtonText: 'Terminate', confirmButtonClass: 'btn-danger',
        details: `Resident: ${getResidentName(rotation.resident_id)}`,
        onConfirm: async () => { await rotationStore.deleteRotation(rotation.id) }
      })
    }

    // ── On-call actions ─────────────────────────────────────────────────────
    const showAddOnCallModal = (physician = null) => {
      onCallModal.mode = 'add'
      onCallModal.form = { duty_date: Utils.localDateStr(new Date()), shift_type: 'primary_call', start_time: '15:00', end_time: '08:00', primary_physician_id: physician?.id || '', backup_physician_id: '', coverage_area: 'emergency', coverage_notes: '' }
      onCallModal.show = true
    }
    const editOnCallSchedule = (schedule) => {
      onCallModal.mode = 'edit'
      onCallModal.form = { ...schedule, duty_date: Utils.normalizeDate(schedule.duty_date), shift_type: ['primary', 'primary_call'].includes(schedule.shift_type) ? 'primary_call' : 'backup_call' }
      onCallModal.show = true
    }
    const saveOnCallSchedule = async () => {
      saving.value = true
      try {
        const f = onCallModal.form
        if (onCallModal.mode === 'edit') { await onCallStore.updateOnCall(f.id, f) }
        else { await onCallStore.createOnCall(f) }
        onCallModal.show = false
      } catch (e) { uiStore.showToast('Error', e?.message || 'Failed to save on-call schedule', 'error') }
      finally { saving.value = false }
    }
    const deleteOnCallSchedule = (schedule) => {
      uiStore.showConfirmation({
        title: 'Delete On-Call', message: 'Delete this on-call schedule?',
        icon: 'fa-trash', confirmButtonText: 'Delete', confirmButtonClass: 'btn-danger',
        details: `Physician: ${getPhysicianName(schedule.primary_physician_id)}`,
        onConfirm: async () => { await onCallStore.deleteOnCall(schedule.id) }
      })
    }

    // ── Absence actions ─────────────────────────────────────────────────────
    const showAddAbsenceModal = (staff = null) => {
      absenceModal.mode = 'add'
      absenceModal.form = { staff_member_id: staff?.id || '', absence_type: 'planned', absence_reason: 'vacation', start_date: Utils.localDateStr(new Date()), end_date: Utils.localDateStr(new Date(Date.now() + 7 * 86400000)), covering_staff_id: '', coverage_notes: '', coverage_arranged: false, hod_notes: '' }
      absenceModal.show = true
    }
    const editAbsence = (absence) => {
      absenceModal.mode = 'edit'
      absenceModal.form = { ...absence, start_date: Utils.normalizeDate(absence.start_date), end_date: Utils.normalizeDate(absence.end_date), covering_staff_id: absence.covering_staff_id || '', coverage_notes: absence.coverage_notes || '', coverage_arranged: absence.coverage_arranged ?? false, hod_notes: absence.hod_notes || '' }
      absenceModal.show = true
    }
    const saveAbsence = async () => {
      saving.value = true
      try {
        const f = absenceModal.form
        if (absenceModal.mode === 'edit') { await absenceStore.updateAbsence(f.id, f) }
        else { await absenceStore.createAbsence(f) }
        absenceModal.show = false
      } catch (e) { uiStore.showToast('Error', e?.message || 'Failed to save absence', 'error') }
      finally { saving.value = false }
    }
    const deleteAbsence = (absence) => {
      uiStore.showConfirmation({
        title: 'Cancel Absence Record', message: 'This will mark the absence as cancelled.',
        icon: 'fa-ban', confirmButtonText: 'Cancel Absence', confirmButtonClass: 'btn-danger',
        details: `Staff: ${getStaffName(absence.staff_member_id)}`,
        onConfirm: async () => { await absenceStore.deleteAbsence(absence.id) }
      })
    }
    const openResolutionModal = (absence) => {
      absenceResolutionModal.absence = absence; absenceResolutionModal.action = 'confirm_return'
      absenceResolutionModal.returnDate = Utils.localDateStr(new Date()); absenceResolutionModal.returnNotes = ''
      absenceResolutionModal.extendedEndDate = Utils.localDateStr(new Date(Date.now() + 7 * 86400000))
      absenceResolutionModal.show = true
    }
    const resolveAbsence = async () => {
      const m = absenceResolutionModal; if (!m.absence) return
      m.saving = true
      try {
        if (m.action === 'confirm_return') {
          await absenceStore.returnToDuty(m.absence.id, m.returnDate, m.returnNotes || 'Staff confirmed returned to duty')
        } else if (m.action === 'extend') {
          await absenceStore.updateAbsence(m.absence.id, { ...m.absence, end_date: m.extendedEndDate, hod_notes: (m.absence.hod_notes ? m.absence.hod_notes + '\n' : '') + `[EXTENDED: ${new Date().toISOString()}] New end date: ${m.extendedEndDate}` + (m.returnNotes ? ` — ${m.returnNotes}` : '') })
        } else if (m.action === 'archive') {
          await absenceStore.deleteAbsence(m.absence.id)
        }
        m.show = false; uiStore.showToast('Success', 'Absence resolved', 'success')
      } catch (e) { uiStore.showToast('Error', e?.message || 'Failed to resolve absence', 'error') }
      finally { m.saving = false }
    }

    // ── Training unit actions ───────────────────────────────────────────────
    const showAddTrainingUnitModal = () => {
      trainingUnitModal.mode = 'add'
      trainingUnitModal.form = { unit_name: '', unit_code: '', department_id: '', maximum_residents: 10, unit_status: 'active', unit_type: 'training_unit', unit_description: '', specialty: '', supervising_attending_id: '' }
      trainingUnitModal.show = true
    }
    const editTrainingUnit = (unit) => { trainingUnitModal.mode = 'edit'; trainingUnitModal.form = { ...unit }; trainingUnitModal.show = true }
    const saveTrainingUnit = async () => {
      saving.value = true
      try {
        const f = trainingUnitModal.form
        if (trainingUnitModal.mode === 'edit') { await trainingStore.updateTrainingUnit(f.id, f) }
        else { await trainingStore.createTrainingUnit(f) }
        trainingUnitModal.show = false; uiStore.showToast('Success', 'Training unit saved', 'success')
      } catch (e) { uiStore.showToast('Error', e?.message || 'Failed to save unit', 'error') }
      finally { saving.value = false }
    }
    const deleteTrainingUnit = (unit) => {
      uiStore.showConfirmation({
        title: 'Delete Training Unit', message: `Delete "${unit.unit_name}"?`,
        icon: 'fa-trash', confirmButtonText: 'Delete Unit', confirmButtonClass: 'btn-danger',
        onConfirm: async () => { await trainingStore.deleteTrainingUnit(unit.id); uiStore.showToast('Deactivated', `${unit.unit_name} deactivated`, 'success') }
      })
    }
    const openUnitDetail = (unit) => {
      const today = new Date()
      unitDetailDrawer.unit = { ...unit, occ: getUnitMonthOccupancy(unit.id, today.getFullYear(), today.getMonth()), nextFree: getNextFreeMonth(unit.id) }
      unitDetailDrawer.show = true
    }
    const openUnitClinicians = (unit) => {
      unitCliniciansModal.unit = unit
      unitCliniciansModal.supervisorId = unit.supervisor_id || unit.supervising_attending_id || ''
      unitCliniciansModal.allStaff = staffStore.medicalStaff.filter(s => ['attending_physician', 'fellow'].includes(s.staff_type) && s.employment_status === 'active')
      unitCliniciansModal.show = true
    }
    const saveUnitClinicians = async () => {
      const u = unitCliniciansModal.unit
      await trainingStore.updateTrainingUnit(u.id, { ...u, supervising_attending_id: unitCliniciansModal.supervisorId || null })
      unitCliniciansModal.show = false; uiStore.showToast('Saved', 'Supervisor assignment updated', 'success')
    }
    const viewUnitResidents = (unit) => {
      unitResidentsModal.unit = unit
      unitResidentsModal.rotations = rotationStore.rotations.filter(r => r.training_unit_id === unit.id && ['active', 'scheduled'].includes(r.rotation_status))
      unitResidentsModal.show = true
    }
    const openAssignRotationFromUnit = (unit) => showAddRotationModal(null, unit)
    const openCellPopover = (event, unitId, unitName, slot, month) => {
      trainingStore.openCellPopover(event, unitId, unitName, slot, month)
      Object.assign(tlPopover, trainingStore.tlPopover)
    }
    const closeCellPopover = () => { trainingStore.closeCellPopover(); tlPopover.show = false }

    // ── Communications ──────────────────────────────────────────────────────
    const showCommunicationsModal = () => {
      communicationsModal.mode = 'add'; communicationsModal.activeTab = 'announcement'
      communicationsModal.form = { id: null, title: '', content: '', priority: 'normal', target_audience: 'all_staff' }
      communicationsModal.show = true
    }
    const saveCommunication = async () => {
      saving.value = true
      try {
        const f = communicationsModal.form
        if (communicationsModal.activeTab === 'announcement') {
          if (communicationsModal.mode === 'edit') { await API.updateAnnouncement(f.id, { title: f.title, content: f.content, priority_level: f.priority, target_audience: f.target_audience }) }
          else { await API.createAnnouncement({ title: f.title, content: f.content, priority_level: f.priority, target_audience: f.target_audience }) }
          announcements.value = await API.getAnnouncements()
          uiStore.showToast('Success', communicationsModal.mode === 'edit' ? 'Announcement updated' : 'Announcement posted', 'success')
        }
        communicationsModal.show = false
      } catch (e) { uiStore.showToast('Error', e?.message || 'An unexpected error occurred', 'error') }
      finally { saving.value = false }
    }

    // ── Research actions ────────────────────────────────────────────────────
    const showAddResearchLineModal  = () => researchStore.showAddResearchLineModal()
    const editResearchLine          = (l) => researchStore.editResearchLine(l)
    const saveResearchLine          = async () => { saving.value = true; try { await researchStore.saveResearchLine() } catch (e) { uiStore.showToast('Error', e?.message || 'Failed', 'error') } finally { saving.value = false } }
    const deleteResearchLine        = (l) => { uiStore.showConfirmation({ title: 'Delete Research Line', message: `Delete "${l.research_line_name || l.name}"?`, icon: 'fa-trash', confirmButtonText: 'Delete', confirmButtonClass: 'btn-danger', onConfirm: () => researchStore.deleteResearchLine(l.id) }) }
    const showAddTrialModal         = (l = null) => researchStore.showAddTrialModal(l)
    const editTrial                 = (t) => researchStore.editTrial(t)
    const saveClinicalTrial         = async () => { saving.value = true; try { await researchStore.saveClinicalTrial() } catch (e) { uiStore.showToast('Error', e?.message || 'Failed', 'error') } finally { saving.value = false } }
    const deleteClinicalTrial       = (t) => { uiStore.showConfirmation({ title: 'Delete Study', message: `Delete "${t.title}"?`, icon: 'fa-trash', confirmButtonText: 'Delete', confirmButtonClass: 'btn-danger', onConfirm: () => researchStore.deleteClinicalTrial(t.id) }) }
    const viewTrial                 = (t) => researchStore.viewTrial(t)
    const showAddProjectModal       = (l = null) => researchStore.showAddProjectModal(l)
    const editProject               = (p) => researchStore.editProject(p)
    const saveInnovationProject     = async () => { saving.value = true; try { await researchStore.saveInnovationProject() } catch (e) { uiStore.showToast('Error', e?.message || 'Failed', 'error') } finally { saving.value = false } }
    const deleteInnovationProject   = (p) => { uiStore.showConfirmation({ title: 'Delete Project', message: `Delete "${p.title}"?`, icon: 'fa-trash', confirmButtonText: 'Delete', confirmButtonClass: 'btn-danger', onConfirm: () => researchStore.deleteInnovationProject(p.id) }) }
    const openAssignCoordinatorModal= (l) => { researchStore.openAssignCoordinatorModal(l); Object.assign(assignCoordinatorModal, researchStore.assignCoordinatorModal) }
    const saveCoordinatorAssignment  = async () => { await researchStore.saveCoordinatorAssignment(); assignCoordinatorModal.show = false }
    const openLineDetail            = (l) => researchStore.setActiveMissionLine(l)
    const drillToTrials             = (lineId) => { researchStore.trialFilters.line = lineId; researchStore.researchHubTab = 'trials'; switchView('research_hub') }
    const drillToProjects           = (lineId) => { researchStore.projectFilters.research_line_id = lineId; researchStore.researchHubTab = 'projects'; switchView('research_hub') }
    const toggleCoInvestigator      = (id) => { const arr = researchStore.clinicalTrialModal.form.co_investigators; const i = arr.indexOf(id); if (i === -1) arr.push(id); else arr.splice(i, 1) }
    const toggleSubInvestigator     = (id) => { const arr = researchStore.clinicalTrialModal.form.sub_investigators; const i = arr.indexOf(id); if (i === -1) arr.push(id); else arr.splice(i, 1) }
    const toggleProjectCoInvestigator=(id) => { const arr = researchStore.innovationProjectModal.form.co_investigators; const i = arr.indexOf(id); if (i === -1) arr.push(id); else arr.splice(i, 1) }
    const togglePartnerNeed         = (need) => { const arr = researchStore.innovationProjectModal.form.partner_needs; const i = arr.indexOf(need); if (i === -1) arr.push(need); else arr.splice(i, 1) }

    // ── News actions ────────────────────────────────────────────────────────
    const showAddNewsModal  = ()     => newsStore.showAddModal()
    const editNews          = (p)    => newsStore.editNews(p)
    const saveNews          = async () => { saving.value = true; try { await newsStore.saveNews() } catch (e) { uiStore.showToast('Error', e?.message || 'Failed', 'error') } finally { saving.value = false } }
    const deleteNews        = (p)    => { uiStore.showConfirmation({ title: 'Delete Post', message: `Permanently delete "${p.title}"?`, icon: 'fa-trash', confirmButtonText: 'Delete', confirmButtonClass: 'btn-danger', onConfirm: () => newsStore.deleteNews(p.id) }) }
    const publishNews       = (p)    => newsStore.publishNews(p.id, p)
    const archiveNews       = (p)    => newsStore.archiveNews(p.id, p)
    const toggleNewsPublic  = (p)    => newsStore.togglePublic(p.id, p)
    const openNewsDrawer    = (p)    => newsStore.openNewsDrawer(p)
    const closeNewsDrawer   = ()     => newsStore.closeNewsDrawer()
    const loadNews          = ()     => newsStore.loadNews()
    const newsDrawerPrev    = () => {
      const posts = newsStore.filteredNews; const idx = posts.findIndex(p => p.id === newsStore.newsDrawer.post?.id)
      if (idx > 0) newsStore.newsDrawer.post = posts[idx - 1]
    }
    const newsDrawerNext = () => {
      const posts = newsStore.filteredNews; const idx = posts.findIndex(p => p.id === newsStore.newsDrawer.post?.id)
      if (idx < posts.length - 1) newsStore.newsDrawer.post = posts[idx + 1]
    }
    const newsDrawerBodyParagraphs = computed(() => (newsStore.newsDrawer.post?.body || '').split('\n').filter(Boolean))
    const newsDrawerInitials    = computed(() => Utils.getInitials(newsStore.newsDrawer.post?.author_name || ''))
    const newsDrawerAuthorFull  = computed(() => newsStore.newsDrawer.post?.author_name || '—')
    const newsDrawerReadMins    = computed(() => { const wc = (newsStore.newsDrawer.post?.body || '').trim().split(/\s+/).filter(Boolean).length; return Math.max(1, Math.round(wc / 200)) })
    const newsDrawerLineName    = computed(() => newsStore.getLineName(newsStore.newsDrawer.post?.research_line_id))

    // ── Analytics / export ──────────────────────────────────────────────────
    const showExportModal = () => { exportModal.show = true }
    const handleExport = async () => {
      exportModal.loading = true
      try {
        const data = await API.exportData(exportModal.type, exportModal.format)
        const blob = new Blob([data], { type: 'text/csv' })
        const url  = window.URL.createObjectURL(blob)
        const a    = document.createElement('a'); a.href = url; a.download = `${exportModal.type}-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a); a.click(); document.body.removeChild(a); window.URL.revokeObjectURL(url)
        uiStore.showToast('Success', 'Export completed', 'success'); exportModal.show = false
      } catch (e) { uiStore.showToast('Error', e.message || 'Export failed', 'error') }
      finally { exportModal.loading = false }
    }

    // ── Clinical status ─────────────────────────────────────────────────────
    const loadClinicalStatus = async () => {
      isLoadingStatus.value = true
      try { const r = await API.getClinicalStatus(); clinicalStatus.value = r?.success ? r.data : null }
      catch { clinicalStatus.value = null }
      finally { isLoadingStatus.value = false }
    }
    const loadClinicalStatusHistory = async () => {
      try { clinicalStatusHistory.value = await API.getClinicalStatusHistory(20) }
      catch { clinicalStatusHistory.value = [] }
    }
    const refreshStatus = () => { loadClinicalStatus(); loadClinicalStatusHistory() }
    const showCreateStatusModal = () => { liveStatsEditMode.value = true; newStatusText.value = ''; selectedAuthorId.value = ''; expiryHours.value = 8 }
    const calculateTimeRemaining = (expiry) => {
      if (!expiry) return 'N/A'; const diff = new Date(expiry) - new Date(); if (diff <= 0) return 'Expired'
      const h = Math.floor(diff / 3600000); const m = Math.floor((diff % 3600000) / 60000)
      return h > 0 ? `${h}h ${m}m` : `${m}m`
    }
    const isStatusExpired = (expiry) => !expiry || new Date() > new Date(expiry)

    // ── Dashboard stats ─────────────────────────────────────────────────────
    const updateDashboardStats = () => {
      const today   = Utils.normalizeDate(new Date())
      const nextWeek= Utils.normalizeDate(new Date(Date.now() + 7 * 86400000))
      const twoWeeks= Utils.normalizeDate(new Date(Date.now() + 14 * 86400000))
      systemStats.totalStaff      = staffStore.medicalStaff.length
      systemStats.activeAttending = staffStore.medicalStaff.filter(s => s.staff_type === 'attending_physician' && s.employment_status === 'active').length
      systemStats.activeResidents = staffStore.medicalStaff.filter(s => isResidentType(s.staff_type) && s.employment_status === 'active').length
      systemStats.onLeaveStaff    = absenceStore.absences.filter(a => { const s = Utils.normalizeDate(a.start_date); const e = Utils.normalizeDate(a.end_date); return s <= today && today <= e && a.current_status !== 'cancelled' }).length
      systemStats.activeRotations = rotationStore.rotations.filter(r => r.rotation_status === 'active').length
      systemStats.endingThisWeek  = rotationStore.rotations.filter(r => r.rotation_status === 'active' && Utils.normalizeDate(r.end_date) >= today && Utils.normalizeDate(r.end_date) <= nextWeek).length
      systemStats.startingNextWeek= rotationStore.rotations.filter(r => r.rotation_status === 'scheduled' && Utils.normalizeDate(r.start_date) >= nextWeek && Utils.normalizeDate(r.start_date) <= twoWeeks).length
      const unique = new Set()
      onCallStore.onCallSchedule.filter(s => Utils.normalizeDate(s.duty_date) === today).forEach(s => { if (s.primary_physician_id) unique.add(s.primary_physician_id); if (s.backup_physician_id) unique.add(s.backup_physician_id) })
      systemStats.onCallNow = unique.size
      todaysOnCall.value        = onCallStore.todaysOnCall
      residentGapWarnings.value = rotationStore.residentGapWarnings

      const items = []
      const endingRots = rotationStore.rotations.filter(r => r.rotation_status === 'active' && Utils.normalizeDate(r.end_date) >= today && Utils.normalizeDate(r.end_date) <= nextWeek)
      if (endingRots.length) items.push({ type: 'warn',   text: `${endingRots.length} rotation${endingRots.length > 1 ? 's' : ''} ending this week`, action: 'resident_rotations', icon: 'fa-clock' })
      const startingRots = rotationStore.rotations.filter(r => r.rotation_status === 'scheduled' && Utils.normalizeDate(r.start_date) >= today && Utils.normalizeDate(r.start_date) <= nextWeek)
      if (startingRots.length) items.push({ type: 'ok',   text: `${startingRots.length} rotation${startingRots.length > 1 ? 's' : ''} starting this week`, action: 'resident_rotations', icon: 'fa-play-circle' })
      const ocGaps = []
      for (let i = 0; i < 7; i++) { const d = new Date(Date.now() + i * 86400000); const ds = Utils.normalizeDate(d); if (!onCallStore.onCallSchedule.some(s => Utils.normalizeDate(s.duty_date) === ds && s.shift_type === 'primary_call')) ocGaps.push(d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })) }
      if (ocGaps.length) items.push({ type: 'danger', text: `${ocGaps.length} day${ocGaps.length > 1 ? 's' : ''} without primary on-call`, action: 'oncall_schedule', icon: 'fa-phone-slash' })
      dailyBriefing.value = items.slice(0, 3)
    }

    // ── Load all data ───────────────────────────────────────────────────────
    const loadAllData = async () => {
      loading.value = true
      try {
        await Promise.all([
          staffStore.loadStaff(),
          staffStore.loadAcademicDegrees(),
          rotationStore.loadRotations(),
          trainingStore.loadTrainingUnits(),
          onCallStore.loadOnCallSchedule(),
          absenceStore.loadAbsences(),
          researchStore.loadResearchLines(),
          researchStore.loadClinicalTrials(),
          researchStore.loadInnovationProjects(),
          newsStore.loadNews(),
          API.getDepartments().then(data => { departments.value = data })
        ])
        await onCallStore.loadTodaysOnCall()
        await Promise.all([
          API.getAnnouncements().then(data => { announcements.value = data }),
          loadClinicalStatus(),
          loadClinicalStatusHistory(),
          API.getSystemStats().then(data => { Object.assign(systemStats, data) }),
          API.getAnalyticsSummary().then(data => { analyticsSummary.value = data }),
          API.getResearchDashboard().then(data => { researchDashboard.value = data }),
          researchStore.loadResearchLinesPerformance().then(() => { researchLinesPerformance.value = researchStore.researchLinesPerformance }),
          researchStore.loadPartnerCollaborations().then(() => { partnerCollaborations.value = researchStore.partnerCollaborations }),
          API.getClinicalTrialsTimeline().then(data => { trialsTimeline.value = data })
        ])
        updateDashboardStats()
      } catch { uiStore.showToast('Error', 'Failed to load some data', 'error') }
      finally { loading.value = false }
    }

    // ── Computed filtered lists ─────────────────────────────────────────────
    const filteredMedicalStaff = computed(() => {
      let f = staffStore.medicalStaff
      if (staffFilters.search)          { const q = staffFilters.search.toLowerCase(); f = f.filter(x => x.full_name?.toLowerCase().includes(q) || x.professional_email?.toLowerCase().includes(q)) }
      if (staffFilters.staffType)       f = f.filter(x => x.staff_type        === staffFilters.staffType)
      if (staffFilters.department)      f = f.filter(x => x.department_id     === staffFilters.department)
      if (staffFilters.status)          f = f.filter(x => x.employment_status === staffFilters.status)
      if (staffFilters.residentCategory)f = f.filter(x => x.resident_category === staffFilters.residentCategory)
      if (staffFilters.hospital)        f = f.filter(x => x.hospital_id       === staffFilters.hospital)
      if (staffFilters.networkType) {
        const ids = staffStore.hospitalsList.filter(h => h.parent_complex === staffFilters.networkType).map(h => h.id)
        f = f.filter(x => ids.includes(x.hospital_id))
      }
      const { field, dir } = sortState.medical_staff
      const start = (pagination.medical_staff.page - 1) * pagination.medical_staff.size
      const sorted = [...f].sort((a, b) => { const cmp = String(a[field] ?? '').localeCompare(String(b[field] ?? ''), undefined, { numeric: true }); return dir === 'asc' ? cmp : -cmp })
      return sorted.slice(start, start + pagination.medical_staff.size)
    })
    const filteredMedicalStaffAll = computed(() => {
      let f = staffStore.medicalStaff
      if (staffFilters.search)          { const q = staffFilters.search.toLowerCase(); f = f.filter(x => x.full_name?.toLowerCase().includes(q) || x.professional_email?.toLowerCase().includes(q)) }
      if (staffFilters.staffType)       f = f.filter(x => x.staff_type        === staffFilters.staffType)
      if (staffFilters.department)      f = f.filter(x => x.department_id     === staffFilters.department)
      if (staffFilters.status)          f = f.filter(x => x.employment_status === staffFilters.status)
      if (staffFilters.residentCategory)f = f.filter(x => x.resident_category === staffFilters.residentCategory)
      return f
    })
    const staffTotalPages = computed(() => Math.max(1, Math.ceil(filteredMedicalStaffAll.value.length / pagination.medical_staff.size)))

    const filteredRotations = computed(() => {
      let f = rotationStore.rotations
      if (rotationFilters.resident)    f = f.filter(r => r.resident_id      === rotationFilters.resident)
      if (rotationFilters.status)      f = f.filter(r => r.rotation_status  === rotationFilters.status)
      if (rotationFilters.trainingUnit)f = f.filter(r => r.training_unit_id === rotationFilters.trainingUnit)
      if (rotationFilters.search)      { const q = rotationFilters.search.toLowerCase(); f = f.filter(r => getResidentName(r.resident_id).toLowerCase().includes(q)) }
      const { field, dir } = sortState.rotations
      const sorted = [...f].sort((a, b) => { let va = a[field] ?? '', vb = b[field] ?? ''; if (field === 'start_date' || field === 'end_date') { va = Utils.normalizeDate(va); vb = Utils.normalizeDate(vb) } const cmp = String(va).localeCompare(String(vb), undefined, { numeric: true }); return dir === 'asc' ? cmp : -cmp })
      const start = (pagination.rotations.page - 1) * pagination.rotations.size
      return sorted.slice(start, start + pagination.rotations.size)
    })
    const filteredRotationsAll = computed(() => {
      let f = rotationStore.rotations
      if (rotationFilters.resident)    f = f.filter(r => r.resident_id      === rotationFilters.resident)
      if (rotationFilters.status)      f = f.filter(r => r.rotation_status  === rotationFilters.status)
      if (rotationFilters.trainingUnit)f = f.filter(r => r.training_unit_id === rotationFilters.trainingUnit)
      return f
    })
    const rotationTotalPages = computed(() => Math.max(1, Math.ceil(filteredRotationsAll.value.length / pagination.rotations.size)))

    const filteredOnCallSchedules = computed(() => {
      let f = onCallStore.onCallSchedule
      const today = Utils.normalizeDate(new Date())
      if (!onCallFilters.date && !onCallFilters.search) f = f.filter(s => Utils.normalizeDate(s.duty_date) >= today)
      if (onCallFilters.date)      f = f.filter(s => Utils.normalizeDate(s.duty_date) === onCallFilters.date)
      if (onCallFilters.shiftType) f = f.filter(s => s.shift_type === onCallFilters.shiftType)
      if (onCallFilters.physician) f = f.filter(s => s.primary_physician_id === onCallFilters.physician || s.backup_physician_id === onCallFilters.physician)
      if (onCallFilters.search)    { const q = onCallFilters.search.toLowerCase(); f = f.filter(s => getPhysicianName(s.primary_physician_id).toLowerCase().includes(q)) }
      const { field, dir } = sortState.oncall
      const sorted = [...f].sort((a, b) => { let va = a[field] ?? '', vb = b[field] ?? ''; if (field === 'duty_date') { va = Utils.normalizeDate(va); vb = Utils.normalizeDate(vb) } const cmp = String(va).localeCompare(String(vb), undefined, { numeric: true }); return dir === 'asc' ? cmp : -cmp })
      const start = (pagination.oncall.page - 1) * pagination.oncall.size
      return sorted.slice(start, start + pagination.oncall.size)
    })
    const oncallTotalPages = computed(() => Math.max(1, Math.ceil(onCallStore.onCallSchedule.length / pagination.oncall.size)))

    const filteredAbsences = computed(() => {
      const deriveStatus = (a) => {
        if (a.current_status === 'cancelled')        return 'cancelled'
        if (a.current_status === 'returned_to_duty') return 'returned_to_duty'
        const today = Utils.normalizeDate(new Date()), start = Utils.normalizeDate(a.start_date), end = Utils.normalizeDate(a.end_date)
        if (end < today)    return 'completed'
        if (start <= today) return 'currently_absent'
        return 'upcoming'
      }
      let f = absenceStore.absences.map(a => ({ ...a, current_status: deriveStatus(a) }))
      if (!absenceFilters.status && absenceFilters.hideReturned) f = f.filter(a => a.current_status !== 'returned_to_duty' && a.current_status !== 'cancelled')
      if (absenceFilters.staff)     f = f.filter(a => a.staff_member_id  === absenceFilters.staff)
      if (absenceFilters.status)    f = f.filter(a => a.current_status   === absenceFilters.status)
      if (absenceFilters.reason)    f = f.filter(a => a.absence_reason   === absenceFilters.reason)
      if (absenceFilters.startDate) f = f.filter(a => Utils.normalizeDate(a.start_date) >= absenceFilters.startDate)
      if (absenceFilters.search)    { const q = absenceFilters.search.toLowerCase(); f = f.filter(a => getStaffName(a.staff_member_id).toLowerCase().includes(q)) }
      const { field, dir } = sortState.absences
      const sorted = [...f].sort((a, b) => { let va = a[field] ?? '', vb = b[field] ?? ''; if (field === 'start_date' || field === 'end_date') { va = Utils.normalizeDate(va); vb = Utils.normalizeDate(vb) } const cmp = String(va).localeCompare(String(vb), undefined, { numeric: true }); return dir === 'asc' ? cmp : -cmp })
      const start = (pagination.absences.page - 1) * pagination.absences.size
      return sorted.slice(start, start + pagination.absences.size)
    })
    const absencesTotalPages = computed(() => Math.max(1, Math.ceil(absenceStore.absences.length / pagination.absences.size)))

    const filteredTrainingUnits = computed(() => {
      let f = trainingStore.trainingUnits
      if (trainingUnitFilters.search)     { const q = trainingUnitFilters.search.toLowerCase(); f = f.filter(u => u.unit_name?.toLowerCase().includes(q)) }
      if (trainingUnitFilters.department) f = f.filter(u => u.department_id === trainingUnitFilters.department)
      if (trainingUnitFilters.status)     f = f.filter(u => u.unit_status   === trainingUnitFilters.status)
      return f
    })

    const filteredTrials = computed(() => {
      let f = researchStore.clinicalTrials
      if (trialFilters.line)   f = f.filter(t => t.research_line_id === trialFilters.line)
      if (trialFilters.phase)  f = f.filter(t => t.phase            === trialFilters.phase)
      if (trialFilters.status) f = f.filter(t => t.status           === trialFilters.status)
      if (trialFilters.search) { const q = trialFilters.search.toLowerCase(); f = f.filter(t => t.protocol_id?.toLowerCase().includes(q) || t.title?.toLowerCase().includes(q)) }
      return f
    })
    const filteredProjects = computed(() => {
      let f = researchStore.innovationProjects
      if (projectFilters.research_line_id) f = f.filter(p => p.research_line_id === projectFilters.research_line_id)
      if (projectFilters.category)         f = f.filter(p => p.category         === projectFilters.category)
      if (projectFilters.stage)            f = f.filter(p => (p.current_stage || p.development_stage) === projectFilters.stage)
      if (projectFilters.funding_status)   f = f.filter(p => (p.funding_status || 'not_applicable')   === projectFilters.funding_status)
      if (projectFilters.search)           { const q = projectFilters.search.toLowerCase(); f = f.filter(p => p.title?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q)) }
      return f
    })

    // ── Lifecycle ───────────────────────────────────────────────────────────
    const intervals = []
    onMounted(async () => {
      const token = localStorage.getItem('neumocare_token')
      const user  = localStorage.getItem('neumocare_user')
      if (token && user) {
        try {
          userStore.currentUser = JSON.parse(user)
          currentView.value = 'dashboard'
          // Validate token in background
          API.request('/api/auth/me').then(data => {
            if (data?.id) { userStore.currentUser = { ...userStore.currentUser, ...data }; loadAllData() }
            else window.dispatchEvent(new CustomEvent('neumax:session-expired'))
          }).catch(() => window.dispatchEvent(new CustomEvent('neumax:session-expired')))
        } catch { currentView.value = 'login' }
      } else { currentView.value = 'login' }

      intervals.push(setInterval(() => { currentTime.value = new Date(); updateDashboardStats() }, 60000))
      intervals.push(setInterval(() => { if (userStore.currentUser && !isLoadingStatus.value) loadClinicalStatus() }, 60000))

      window.addEventListener('neumax:session-expired', () => {
        userStore.currentUser = null; currentView.value = 'login'
        uiStore.showToast('Session Expired', 'Your session has expired. Please log in again.', 'warning', 6000)
      })
      document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return
        const modals = [medicalStaffModal, staffProfileModal, rotationModal, rotationViewModal, onCallModal, absenceModal, absenceResolutionModal, trainingUnitModal, unitResidentsModal, unitCliniciansModal, researchLineModal, clinicalTrialModal, innovationProjectModal, assignCoordinatorModal, trialDetailModal, userProfileModal, uiStore.confirmationModal, exportModal, communicationsModal, activationModal]
        modals.forEach(m => { if (m.show) m.show = false })
      })
    })
    onUnmounted(() => intervals.forEach(clearInterval))

    // ── Return ──────────────────────────────────────────────────────────────
    return {
      // Stores (direct access for template)
      uiStore, userStore, staffStore, rotationStore, trainingStore, onCallStore, absenceStore, researchStore, newsStore,

      // State
      loading, saving, showPassword, currentTime, currentView,
      staffView, onCallView, rotationView, researchHubTab, analyticsActiveTab,

      // Filters
      staffFilters, rotationFilters, onCallFilters, absenceFilters, trainingUnitFilters, trialFilters, projectFilters,

      // Pagination & sort
      pagination, sortState, sortBy, sortIcon, goToPage,
      staffTotalPages, rotationTotalPages, oncallTotalPages, absencesTotalPages,

      // Modals
      staffProfileModal, medicalStaffModal, rotationModal, rotationViewModal, activationModal,
      onCallModal, absenceModal, absenceResolutionModal, trainingUnitModal, unitResidentsModal,
      unitCliniciansModal, unitDetailDrawer, occupancyPanel, tlPopover,
      researchLineModal, clinicalTrialModal, innovationProjectModal, assignCoordinatorModal,
      trialDetailModal, deptPanel, reassignmentModal, deptReassignModal,
      staffTypeModal, exportModal, userProfileModal, announcementReadModal, communicationsModal,

      // System data
      systemStats, clinicalStatus, clinicalStatusHistory, isLoadingStatus,
      newStatusText, selectedAuthorId, expiryHours, liveStatsEditMode,
      researchDashboard, researchLinesPerformance, partnerCollaborations, trialsTimeline,
      analyticsSummary, loadingAnalytics, dailyBriefing, todaysOnCall, residentGapWarnings,
      announcements, departments,

      // Login
      loginForm, loginLoading, loginError,

      // Formatting helpers
      hasPermission, formatDate, formatDateShort, formatRelativeDate, formatTime,
      formatRelativeTime, formatTimeAgo, formatNewsDate, formatClinicalDuration,
      normalizeDate, getInitials, formatPercentage, getPhaseColor, getStageColor,
      getStageConfig, getPartnerTypeColor, getTomorrow,
      getStaffName, getResidentName, getSupervisorName, getPhysicianName,
      getTrainingUnitName, getDepartmentName, getResearchLineName, getLineAccent,
      formatStaffType, formatStaffTypeShort, getStaffTypeClass, isResidentType,
      formatEmploymentStatus, formatAbsenceReason, formatRotationStatus,
      formatStudyStatus, formatAudience, formatTrainingYear, formatPhone,
      formatLicense, formatSpecialization, effectiveResidentYear,
      getRoleInfo, getStaffRoles, getResidentCategoryInfo, formatResidentCategorySimple,
      formatResidentCategoryDetailed, getResidentCategoryIcon, getResidentCategoryTooltip,
      calculateAbsenceDuration, getDaysRemaining, getDaysUntilStart,
      getDaysRemainingColor, isToday,

      // Rotation helpers
      getHorizonMonths, getHorizonRangeLabel, getResidentRotationsInHorizon,
      getRotationBarStyle, rotationStartsInHorizon, rotationEndsInHorizon,
      isRotationActive, isShiftActive, viewRotationDetails,
      getRotationProgress, getCurrentRotationForStaff, getRotationHistory,
      getUpcomingRotations, getRotationDaysLeft, getCurrentRotationSupervisor,

      // Training helpers
      getUnitActiveRotationCount, getUnitRotations, getUnitScheduledCount,
      getUnitOverlapWarning, getUnitMonthOccupancy, getNextFreeMonth,
      getTimelineMonths, getUnitSlots, getDaysUntilFree, getResidentShortName,

      // On-call helpers
      isOnCallToday, getUpcomingOnCall, getUpcomingLeave,

      // Research helpers
      addKeyword, removeKeyword, handleKeywordKey,
      toggleCoInvestigator, toggleSubInvestigator, toggleProjectCoInvestigator, togglePartnerNeed,

      // News helpers
      newsWordCount, newsWordLimit, newsAuthorName, newsLineName,
      newsDrawerPrev, newsDrawerNext, newsDrawerBodyParagraphs,
      newsDrawerInitials, newsDrawerAuthorFull, newsDrawerReadMins, newsDrawerLineName,

      // Actions
      switchView, handleGlobalSearch, clearSearch, globalSearchResults,
      handleLogin, handleLogout, showUserProfileModal, saveUserProfile,
      hasProfessionalCredentials,
      viewStaffDetails, showAddMedicalStaffModal, editMedicalStaff, saveMedicalStaff, deleteMedicalStaff,
      showAddRotationModal, editRotation, saveRotation, deleteRotation,
      showAddOnCallModal, editOnCallSchedule, saveOnCallSchedule, deleteOnCallSchedule,
      showAddAbsenceModal, editAbsence, saveAbsence, deleteAbsence,
      openResolutionModal, resolveAbsence,
      showAddTrainingUnitModal, editTrainingUnit, saveTrainingUnit, deleteTrainingUnit,
      openUnitDetail, openUnitClinicians, saveUnitClinicians, viewUnitResidents,
      openAssignRotationFromUnit, openCellPopover, closeCellPopover,
      showCommunicationsModal, saveCommunication,
      showAddResearchLineModal, editResearchLine, saveResearchLine, deleteResearchLine,
      showAddTrialModal, editTrial, saveClinicalTrial, deleteClinicalTrial, viewTrial,
      showAddProjectModal, editProject, saveInnovationProject, deleteInnovationProject,
      openAssignCoordinatorModal, saveCoordinatorAssignment, openLineDetail,
      drillToTrials, drillToProjects,
      showAddNewsModal, editNews, saveNews, deleteNews, loadNews,
      publishNews, archiveNews, toggleNewsPublic, openNewsDrawer, closeNewsDrawer,
      showExportModal, handleExport,
      refreshStatus, showCreateStatusModal, calculateTimeRemaining, isStatusExpired,

      // Computed lists
      filteredMedicalStaff, filteredRotations, filteredOnCallSchedules,
      filteredAbsences, filteredTrainingUnits, filteredTrials, filteredProjects,

      // Computed view helpers
      getCurrentViewTitle, getCurrentViewSubtitle, getSearchPlaceholder,

      // Constants
      Utils, PROJECT_STAGES
    }
  }
})

app.use(pinia)
app.mount('#app')
