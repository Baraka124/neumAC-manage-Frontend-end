// ============ NEUMOCARE HOSPITAL MANAGEMENT SYSTEM v8.1 ============

document.addEventListener('DOMContentLoaded', function() {

    if (typeof Vue === 'undefined') {
        document.body.innerHTML = `
            <div style="padding: 40px; text-align: center; margin-top: 100px; color: #333;">
                <h2 style="color: #dc3545;">⚠️ Critical Error</h2>
                <p>Vue.js failed to load. Please refresh the page.</p>
                <button onclick="window.location.reload()"
                        style="padding: 12px 24px; background: #007bff; color: white;
                               border: none; border-radius: 6px; cursor: pointer; margin-top: 20px;">
                    Refresh Page
                </button>
            </div>
        `;
        return;
    }

    const { createApp, ref, reactive, computed, onMounted, watch, onUnmounted } = Vue;

    // ============ CONFIGURATION ============
    const CONFIG = {
        API_BASE_URL: window.location.hostname.includes('localhost')
            ? 'http://localhost:3000'
            : 'https://neumac-manage-back-end-production.up.railway.app',
        TOKEN_KEY: 'neumocare_token',
        USER_KEY: 'neumocare_user',
        APP_VERSION: '8.1'
    };

    // ============ UTILITIES ============
    class EnhancedUtils {
        static formatDate(dateString) {
            if (!dateString) return 'N/A';
            try {
                const date = new Date(dateString);
                if (isNaN(date.getTime())) return dateString;
                return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            } catch { return dateString; }
        }

        static formatDateTime(dateString) {
            if (!dateString) return 'N/A';
            try {
                const date = new Date(dateString);
                if (isNaN(date.getTime())) return dateString;
                return date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
            } catch { return dateString; }
        }

        static getInitials(name) {
            if (!name || typeof name !== 'string') return '??';
            return name.split(' ').map(w => w[0]).join('').toUpperCase().substring(0, 2);
        }

        static ensureArray(data) {
            if (Array.isArray(data)) return data;
            if (data && typeof data === 'object' && data.data && Array.isArray(data.data)) return data.data;
            if (data && typeof data === 'object') return Object.values(data);
            return [];
        }

        static truncateText(text, maxLength = 100) {
            if (!text) return '';
            return text.length <= maxLength ? text : text.substring(0, maxLength) + '...';
        }

        static formatTime(dateString) {
            if (!dateString) return '';
            try {
                const date = new Date(dateString);
                return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            } catch { return dateString; }
        }

        static formatRelativeTime(dateString) {
            if (!dateString) return 'Just now';
            try {
                const diffMins = Math.floor((new Date() - new Date(dateString)) / 60000);
                if (diffMins < 1) return 'Just now';
                if (diffMins < 60) return `${diffMins}m ago`;
                if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
                return `${Math.floor(diffMins / 1440)}d ago`;
            } catch { return 'Just now'; }
        }

        static calculateDateDifference(startDate, endDate) {
            try {
                const start = new Date(startDate);
                const end = new Date(endDate);
                if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
                return Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24));
            } catch { return 0; }
        }

        static generateId(prefix) {
            return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 9)}`;
        }
    }

    // ============ API SERVICE ============
    class ApiService {
        constructor() {
            this.token = localStorage.getItem(CONFIG.TOKEN_KEY) || null;
        }

        getHeaders() {
            const headers = { 'Content-Type': 'application/json', 'Accept': 'application/json' };
            const token = localStorage.getItem(CONFIG.TOKEN_KEY);
            if (token && token.trim()) headers['Authorization'] = `Bearer ${token}`;
            return headers;
        }

        async request(endpoint, options = {}) {
            const url = `${CONFIG.API_BASE_URL}${endpoint}`;
            try {
                const config = {
                    method: options.method || 'GET',
                    headers: this.getHeaders(),
                    mode: 'cors',
                    cache: 'no-cache',
                    credentials: 'include'
                };
                if (options.body && typeof options.body === 'object') {
                    config.body = JSON.stringify(options.body);
                }
                const response = await fetch(url, config);
                if (response.status === 204) return null;
                if (!response.ok) {
                    if (response.status === 401) {
                        this.token = null;
                        localStorage.removeItem(CONFIG.TOKEN_KEY);
                        localStorage.removeItem(CONFIG.USER_KEY);
                        throw new Error('Session expired. Please login again.');
                    }
                    let errorText;
                    try { errorText = await response.text(); }
                    catch { errorText = `HTTP ${response.status}: ${response.statusText}`; }
                    throw new Error(errorText);
                }
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) return await response.json();
                return await response.text();
            } catch (error) {
                if (error.message.includes('CORS') || error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
                    throw new Error('Cannot connect to server. Please check your network connection.');
                }
                throw error;
            }
        }

        async login(email, password) {
            const data = await this.request('/api/auth/login', { method: 'POST', body: { email, password } });
            if (data.token) {
                this.token = data.token;
                localStorage.setItem(CONFIG.TOKEN_KEY, data.token);
                localStorage.setItem(CONFIG.USER_KEY, JSON.stringify(data.user));
            }
            return data;
        }

        async logout() {
            try { await this.request('/api/auth/logout', { method: 'POST' }); }
            finally {
                this.token = null;
                localStorage.removeItem(CONFIG.TOKEN_KEY);
                localStorage.removeItem(CONFIG.USER_KEY);
            }
        }

        async getMedicalStaff() { try { return EnhancedUtils.ensureArray(await this.request('/api/medical-staff')); } catch { return []; } }
        async createMedicalStaff(d) { return await this.request('/api/medical-staff', { method: 'POST', body: d }); }
        async updateMedicalStaff(id, d) { return await this.request(`/api/medical-staff/${id}`, { method: 'PUT', body: d }); }
        async deleteMedicalStaff(id) { return await this.request(`/api/medical-staff/${id}`, { method: 'DELETE' }); }

        async getDepartments() { try { return EnhancedUtils.ensureArray(await this.request('/api/departments')); } catch { return []; } }
        async createDepartment(d) { return await this.request('/api/departments', { method: 'POST', body: d }); }
        async updateDepartment(id, d) { return await this.request(`/api/departments/${id}`, { method: 'PUT', body: d }); }

        async getTrainingUnits() { try { return EnhancedUtils.ensureArray(await this.request('/api/training-units')); } catch { return []; } }
        async createTrainingUnit(d) { return await this.request('/api/training-units', { method: 'POST', body: d }); }
        async updateTrainingUnit(id, d) { return await this.request(`/api/training-units/${id}`, { method: 'PUT', body: d }); }

        async getRotations() { try { return EnhancedUtils.ensureArray(await this.request('/api/rotations')); } catch { return []; } }
        async createRotation(d) { return await this.request('/api/rotations', { method: 'POST', body: d }); }
        async updateRotation(id, d) { return await this.request(`/api/rotations/${id}`, { method: 'PUT', body: d }); }
        async deleteRotation(id) { return await this.request(`/api/rotations/${id}`, { method: 'DELETE' }); }

        async getOnCallSchedule() { try { return EnhancedUtils.ensureArray(await this.request('/api/oncall')); } catch { return []; } }
        async getOnCallToday() { try { return EnhancedUtils.ensureArray(await this.request('/api/oncall/today')); } catch { return []; } }
        async createOnCall(d) { return await this.request('/api/oncall', { method: 'POST', body: d }); }
        async updateOnCall(id, d) { return await this.request(`/api/oncall/${id}`, { method: 'PUT', body: d }); }
        async deleteOnCall(id) { return await this.request(`/api/oncall/${id}`, { method: 'DELETE' }); }

        async getAbsences() { try { return EnhancedUtils.ensureArray(await this.request('/api/absence-records')); } catch { return []; } }
        async createAbsence(d) { return await this.request('/api/absence-records', { method: 'POST', body: d }); }
        async updateAbsence(id, d) { return await this.request(`/api/absence-records/${id}`, { method: 'PUT', body: d }); }
        async deleteAbsence(id) { return await this.request(`/api/absence-records/${id}`, { method: 'DELETE' }); }

        async getAnnouncements() { try { return EnhancedUtils.ensureArray(await this.request('/api/announcements')); } catch { return []; } }
        async createAnnouncement(d) { return await this.request('/api/announcements', { method: 'POST', body: d }); }
        async updateAnnouncement(id, d) { return await this.request(`/api/announcements/${id}`, { method: 'PUT', body: d }); }
        async deleteAnnouncement(id) { return await this.request(`/api/announcements/${id}`, { method: 'DELETE' }); }

        async getClinicalStatus() {
            try { return await this.request('/api/live-status/current'); }
            catch (error) { return { success: false, data: null, error: error.message }; }
        }
        async createClinicalStatus(d) { return await this.request('/api/live-status', { method: 'POST', body: d }); }
        async updateClinicalStatus(id, d) { return await this.request(`/api/live-status/${id}`, { method: 'PUT', body: d }); }
        async deleteClinicalStatus(id) { return await this.request(`/api/live-status/${id}`, { method: 'DELETE' }); }
        async getClinicalStatusHistory(limit = 10) {
            try { return EnhancedUtils.ensureArray(await this.request(`/api/live-status/history?limit=${limit}`)); }
            catch { return []; }
        }

        async getSystemStats() {
            try { return await this.request('/api/system-stats') || {}; }
            catch { return { activeAttending: 0, activeResidents: 0, onCallNow: 0, inSurgery: 0, pendingApprovals: 0 }; }
        }
    }

    const API = new ApiService();

    // ============ VUE APP ============
    const app = createApp({
        setup() {

            // ── User & Auth ──────────────────────────────────────────
            const currentUser = ref(null);
            const loginForm = reactive({ email: '', password: '', remember_me: false });
            const loginLoading = ref(false);

            // ── UI State ─────────────────────────────────────────────
            const currentView = ref('login');
            const sidebarCollapsed = ref(false);
            const mobileMenuOpen = ref(false);
            const userMenuOpen = ref(false);
            const statsSidebarOpen = ref(false);
            const globalSearchQuery = ref('');

            // ── Loading ───────────────────────────────────────────────
            const loading = ref(false);
            const saving = ref(false);
            const loadingSchedule = ref(false);
            const isLoadingStatus = ref(false);

            // ── Data Stores ───────────────────────────────────────────
            const medicalStaff = ref([]);
            const departments = ref([]);
            const trainingUnits = ref([]);
            const rotations = ref([]);
            const absences = ref([]);
            const onCallSchedule = ref([]);
            const announcements = ref([]);

            // ── Live Status ───────────────────────────────────────────
            const clinicalStatus = ref(null);
            const clinicalStatusHistory = ref([]);
            const newStatusText = ref('');
            const selectedAuthorId = ref('');
            const expiryHours = ref(8);
            const activeMedicalStaff = ref([]);
            const liveStatsEditMode = ref(false);
            const quickStatus = ref('');
            const currentTime = ref(new Date());

            // ── Dashboard ─────────────────────────────────────────────
            const systemStats = ref({
                totalStaff: 0, activeAttending: 0, activeResidents: 0,
                onCallNow: 0, inSurgery: 0, activeRotations: 0,
                endingThisWeek: 0, startingNextWeek: 0, onLeaveStaff: 0,
                departmentStatus: 'normal', activePatients: 0,
                icuOccupancy: 0, wardOccupancy: 0, pendingApprovals: 0,
                nextShiftChange: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString()
            });
            const todaysOnCall = ref([]);
            const todaysOnCallCount = computed(() => todaysOnCall.value.length);

            // ── UI Components ─────────────────────────────────────────
            const toasts = ref([]);
            const systemAlerts = ref([]);

            // ── Filters ───────────────────────────────────────────────
            const staffFilters = reactive({ search: '', staffType: '', department: '', status: '' });
            const onCallFilters = reactive({ date: '', shiftType: '', physician: '', coverageArea: '' });
            const rotationFilters = reactive({ resident: '', status: '', trainingUnit: '', supervisor: '' });
            const absenceFilters = reactive({ staff: '', status: '', reason: '', startDate: '' });

            // ── Permission Matrix ─────────────────────────────────────
            const PERMISSION_MATRIX = {
                system_admin: {
                    medical_staff: ['create', 'read', 'update', 'delete'],
                    oncall_schedule: ['create', 'read', 'update', 'delete'],
                    resident_rotations: ['create', 'read', 'update', 'delete'],
                    training_units: ['create', 'read', 'update', 'delete'],
                    staff_absence: ['create', 'read', 'update', 'delete'],
                    department_management: ['create', 'read', 'update', 'delete'],
                    communications: ['create', 'read', 'update', 'delete'],
                    system: ['manage_departments', 'manage_updates']
                },
                department_head: {
                    medical_staff: ['read', 'update'],
                    oncall_schedule: ['create', 'read', 'update'],
                    resident_rotations: ['create', 'read', 'update'],
                    training_units: ['read', 'update'],
                    staff_absence: ['create', 'read', 'update'],
                    department_management: ['read'],
                    communications: ['create', 'read'],
                    system: ['manage_updates']
                },
                attending_physician: {
                    medical_staff: ['read'], oncall_schedule: ['read'],
                    resident_rotations: ['read'], training_units: ['read'],
                    staff_absence: ['read'], department_management: ['read'],
                    communications: ['read']
                },
                medical_resident: {
                    medical_staff: ['read'], oncall_schedule: ['read'],
                    resident_rotations: ['read'], training_units: ['read'],
                    staff_absence: ['read'], department_management: [],
                    communications: ['read']
                }
            };

            // ── Modal States ──────────────────────────────────────────

            const staffProfileModal = reactive({
                show: false, staff: null, activeTab: 'assignments'
            });

            // NEW: Unit Residents Modal
            const unitResidentsModal = reactive({
                show: false, unit: null, rotations: []
            });

            const medicalStaffModal = reactive({
                show: false, mode: 'add', activeTab: 'basic',
                form: {
                    full_name: '', staff_type: 'medical_resident', staff_id: '',
                    employment_status: 'active', professional_email: '', department_id: '',
                    academic_degree: '', specialization: '', resident_year: '',
                    clinical_certificate: '', certificate_status: 'current'
                }
            });

            const communicationsModal = reactive({
                show: false, activeTab: 'announcement',
                form: {
                    title: '', content: '', priority: 'normal', target_audience: 'all_staff',
                    updateType: 'daily', dailySummary: '', highlight1: '', highlight2: '',
                    alerts: { erBusy: false, icuFull: false, wardFull: false, staffShortage: false },
                    metricName: '', metricValue: '', metricTrend: 'stable', metricChange: '',
                    metricNote: '', alertLevel: 'low', alertMessage: '',
                    affectedAreas: { er: false, icu: false, ward: false, surgery: false }
                }
            });

            const onCallModal = reactive({
                show: false, mode: 'add',
                form: {
                    duty_date: new Date().toISOString().split('T')[0],
                    shift_type: 'primary_call', start_time: '08:00', end_time: '17:00',
                    primary_physician_id: '', backup_physician_id: '', coverage_area: 'emergency'
                }
            });

            const rotationModal = reactive({
                show: false, mode: 'add',
                form: {
                    rotation_id: '', resident_id: '', training_unit_id: '',
                    rotation_start_date: new Date().toISOString().split('T')[0],
                    rotation_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    rotation_status: 'scheduled', rotation_category: 'clinical_rotation',
                    supervising_attending_id: ''
                }
            });

            const trainingUnitModal = reactive({
                show: false, mode: 'add',
                form: {
                    unit_name: '', unit_code: '', department_id: '', maximum_residents: 10,
                    unit_status: 'active', specialty: '', supervising_attending_id: ''
                }
            });

            const absenceModal = reactive({
                show: false, mode: 'add', activeTab: 'basic',
                form: {
                    staff_member_id: '', absence_reason: 'vacation',
                    start_date: new Date().toISOString().split('T')[0],
                    end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    absence_type: 'planned', covering_staff_id: '', coverage_notes: '',
                    coverage_arranged: false, hod_notes: '', current_status: 'pending'
                }
            });

            const departmentModal = reactive({
                show: false, mode: 'add',
                form: { name: '', code: '', status: 'active', head_of_department_id: '' }
            });

            const userProfileModal = reactive({
                show: false,
                form: { full_name: '', email: '', department_id: '' }
            });

            const confirmationModal = reactive({
                show: false, title: '', message: '', icon: 'fa-question-circle',
                confirmButtonText: 'Confirm', confirmButtonClass: 'btn-primary',
                cancelButtonText: 'Cancel', onConfirm: null, details: ''
            });

            // ════════════════════════════════════════════════════════
            // CORE FUNCTIONS
            // ════════════════════════════════════════════════════════

            const showToast = (title, message, type = 'info', duration = 5000) => {
                const icons = { info: 'fas fa-info-circle', success: 'fas fa-check-circle', error: 'fas fa-exclamation-circle', warning: 'fas fa-exclamation-triangle' };
                const toast = { id: Date.now(), title, message, type, icon: icons[type], duration };
                toasts.value.push(toast);
                if (duration > 0) setTimeout(() => removeToast(toast.id), duration);
            };

            const removeToast = (id) => {
                const index = toasts.value.findIndex(t => t.id === id);
                if (index > -1) toasts.value.splice(index, 1);
            };

            const showConfirmation = (options) => {
                Object.assign(confirmationModal, { show: true, ...options });
            };

            const confirmAction = async () => {
                if (confirmationModal.onConfirm) {
                    try { await confirmationModal.onConfirm(); }
                    catch (error) { showToast('Error', error.message, 'error'); }
                }
                confirmationModal.show = false;
            };

            const cancelConfirmation = () => { confirmationModal.show = false; };

            // ── Formatting ────────────────────────────────────────────

            const formatStaffType = (type) => ({
                'medical_resident': 'Medical Resident', 'attending_physician': 'Attending Physician',
                'fellow': 'Fellow', 'nurse_practitioner': 'Nurse Practitioner'
            }[type] || type);

            const getStaffTypeClass = (type) => ({
                'medical_resident': 'badge-primary', 'attending_physician': 'badge-success',
                'fellow': 'badge-info', 'nurse_practitioner': 'badge-warning'
            }[type] || 'badge-secondary');

            const formatEmploymentStatus = (status) => ({
                'active': 'Active', 'on_leave': 'On Leave', 'inactive': 'Inactive'
            }[status] || status);

            const formatAbsenceReason = (reason) => ({
                'vacation': 'Vacation', 'sick_leave': 'Sick Leave', 'conference': 'Conference',
                'training': 'Training', 'personal': 'Personal', 'other': 'Other'
            }[reason] || reason);

            const formatAbsenceStatus = (status) => ({
                'active': 'Active', 'upcoming': 'Upcoming', 'completed': 'Completed'
            }[status] || status);

            const formatRotationStatus = (status) => ({
                'scheduled': 'Scheduled', 'active': 'Active',
                'completed': 'Completed', 'cancelled': 'Cancelled'
            }[status] || status);

            const getUserRoleDisplay = (role) => ({
                'system_admin': 'System Administrator', 'department_head': 'Department Head',
                'attending_physician': 'Attending Physician', 'medical_resident': 'Medical Resident'
            }[role] || role);

            const getCurrentViewTitle = () => ({
                'dashboard': 'Dashboard Overview', 'medical_staff': 'Medical Staff Management',
                'oncall_schedule': 'On-call Schedule', 'resident_rotations': 'Resident Rotations',
                'training_units': 'Training Units', 'staff_absence': 'Staff Absence Management',
                'department_management': 'Department Management', 'communications': 'Communications Center'
            }[currentView.value] || 'NeumoCare Dashboard');

            const getCurrentViewSubtitle = () => ({
                'dashboard': 'Real-time department overview and analytics',
                'medical_staff': 'Manage physicians, residents, and clinical staff',
                'oncall_schedule': 'View and manage on-call physician schedules',
                'resident_rotations': 'Track and manage resident training rotations',
                'training_units': 'Clinical training units and resident assignments',
                'staff_absence': 'Track staff absences and coverage assignments',
                'department_management': 'Organizational structure and clinical units',
                'communications': 'Department announcements and capacity updates'
            }[currentView.value] || 'Hospital Management System');

            const getSearchPlaceholder = () => ({
                'dashboard': 'Search staff, units, rotations...',
                'medical_staff': 'Search by name or email...',
                'oncall_schedule': 'Search on-call schedules...',
                'resident_rotations': 'Search rotations...',
                'training_units': 'Search training units...',
                'staff_absence': 'Search absences...',
                'department_management': 'Search departments...',
                'communications': 'Search announcements...'
            }[currentView.value] || 'Search across system...');

            const formatTimeAgo = (dateString) => EnhancedUtils.formatRelativeTime(dateString);

            // ── Data Helpers ──────────────────────────────────────────

            const getDepartmentName = (departmentId) => {
                if (!departmentId) return 'Not assigned';
                const dept = departments.value.find(d => d.id === departmentId);
                return dept ? dept.name : 'Not assigned';
            };

            const getStaffName = (staffId) => {
                if (!staffId) return 'Not assigned';
                const staff = medicalStaff.value.find(s => s.id === staffId);
                return staff ? staff.full_name : 'Unknown Staff';
            };

            const getTrainingUnitName = (unitId) => {
                if (!unitId) return 'Not assigned';
                const unit = trainingUnits.value.find(u => u.id === unitId);
                return unit ? unit.unit_name : 'Unknown Unit';
            };

            const getSupervisorName = (supervisorId) => getStaffName(supervisorId);
            const getPhysicianName = (physicianId) => getStaffName(physicianId);
            const getResidentName = (residentId) => getStaffName(residentId);

            const getDepartmentUnits = (departmentId) =>
                trainingUnits.value.filter(unit => unit.department_id === departmentId);

            const getDepartmentStaffCount = (departmentId) =>
                medicalStaff.value.filter(staff => staff.department_id === departmentId).length;

            const getCurrentRotationForStaff = (staffId) =>
                rotations.value.find(r => r.resident_id === staffId && r.rotation_status === 'active') || null;

            const calculateAbsenceDuration = (startDate, endDate) =>
                EnhancedUtils.calculateDateDifference(startDate, endDate);

            // ── NEW: Unit Residents Helpers ───────────────────────────

            // Count of active+scheduled rotations for a unit (shown as badge on button)
            const getUnitActiveRotationCount = (unitId) =>
                rotations.value.filter(r =>
                    r.training_unit_id === unitId &&
                    (r.rotation_status === 'active' || r.rotation_status === 'scheduled')
                ).length;

            // Days remaining until rotation end (for active rotations)
            const getDaysRemaining = (endDate) => {
                if (!endDate) return 0;
                const end = new Date(endDate);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                return Math.max(0, Math.ceil((end - today) / (1000 * 60 * 60 * 24)));
            };

            // Days until rotation starts (for scheduled rotations)
            const getDaysUntilStart = (startDate) => {
                if (!startDate) return 0;
                const start = new Date(startDate);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                return Math.max(0, Math.ceil((start - today) / (1000 * 60 * 60 * 24)));
            };

            // ── On-call Helpers ───────────────────────────────────────

            const isOnCallToday = (staffId) => {
                const today = new Date().toISOString().split('T')[0];
                return onCallSchedule.value.some(s =>
                    (s.primary_physician_id === staffId || s.backup_physician_id === staffId) &&
                    s.duty_date === today
                );
            };

            const getOnCallShiftTime = (staffId) => {
                const today = new Date().toISOString().split('T')[0];
                const s = onCallSchedule.value.find(s =>
                    (s.primary_physician_id === staffId || s.backup_physician_id === staffId) &&
                    s.duty_date === today
                );
                return s ? `${s.start_time} – ${s.end_time}` : '';
            };

            const getOnCallCoverage = (staffId) => {
                const today = new Date().toISOString().split('T')[0];
                const s = onCallSchedule.value.find(s =>
                    (s.primary_physician_id === staffId || s.backup_physician_id === staffId) &&
                    s.duty_date === today
                );
                return s ? (s.coverage_area || 'Not specified') : '';
            };

            // Days left in staff's current rotation (used in profile modal)
            const getRotationDaysLeft = (staffId) => {
                const rotation = getCurrentRotationForStaff(staffId);
                if (!rotation) return 0;
                // Handle both field name variants from the backend
                const endDate = rotation.end_date || rotation.rotation_end_date;
                return getDaysRemaining(endDate);
            };

            // ── Profile Helpers (real data only) ──────────────────────

            const getCurrentUnit = (staffId) => {
                const rotation = rotations.value.find(r =>
                    r.resident_id === staffId && r.rotation_status === 'active'
                );
                return rotation ? getTrainingUnitName(rotation.training_unit_id) : 'Not assigned';
            };

            const getCurrentWard = (staffId) => {
                const rotation = rotations.value.find(r =>
                    r.resident_id === staffId && r.rotation_status === 'active'
                );
                if (rotation?.training_unit_id) {
                    const unit = trainingUnits.value.find(u => u.id === rotation.training_unit_id);
                    if (unit) return unit.unit_name;
                }
                return 'Not assigned';
            };

            // Real: based on on-call schedule only — no random
            const getCurrentActivityStatus = (staffId) => {
                const today = new Date().toISOString().split('T')[0];
                const onCall = onCallSchedule.value.find(s =>
                    (s.primary_physician_id === staffId || s.backup_physician_id === staffId) &&
                    s.duty_date === today
                );
                return onCall ? 'oncall' : 'available';
            };

            // Removed fake random patient counts — return null so UI hides them
            const getCurrentPatientCount = () => null;
            const getICUPatientCount = () => null;
            const getWardPatientCount = () => null;

            // No fake schedule — return empty; UI shows "No scheduled activities"
            const getTodaysSchedule = () => [];

            // No fake activity log — return empty; UI shows "No recent activities"
            const getRecentActivities = () => [];

            const getRotationSupervisor = (staffId) => {
                const rotation = rotations.value.find(r =>
                    r.resident_id === staffId && r.rotation_status === 'active'
                );
                return rotation?.supervising_attending_id
                    ? getStaffName(rotation.supervising_attending_id)
                    : 'Not assigned';
            };

            // ── Live Status ───────────────────────────────────────────

            const getStatusLocation = (status) => {
                if (!status || !status.status_text) return 'Pulmonology Department';
                if (status.location) return status.location;
                if (status.department) return status.department;
                if (status.coverage_area) return status.coverage_area;
                const text = status.status_text.toLowerCase();
                if (text.includes('icu') || text.includes('intensive care')) return 'Respiratory ICU';
                if (text.includes('respiratory') || text.includes('pulmonology') || text.includes('lung')) return 'Pulmonology Department';
                if (text.includes('bronchoscopy') || text.includes('pft')) return 'Pulmonary Procedure Unit';
                if (text.includes('sleep') || text.includes('cpap') || text.includes('bipap')) return 'Sleep Medicine Lab';
                if (text.includes('ventilator') || text.includes('respiratory therapy')) return 'Respiratory Therapy Unit';
                if (text.includes('asthma') || text.includes('copd')) return 'Chronic Airways Clinic';
                if (text.includes('tuberculosis') || text.includes(' tb ')) return 'TB/Respiratory Infections Unit';
                if (text.includes('er') || text.includes('emergency') || text.includes('triage')) return 'Emergency Department';
                if (text.includes('ward') || text.includes('floor')) return 'General Ward';
                if (text.includes('surgery') || text.includes('thoracic')) return 'Thoracic Surgery';
                if (text.includes('consult') || text.includes('clinic')) return 'Consultation Clinic';
                if (text.includes('radiology') || text.includes('x-ray') || text.includes('chest imaging')) return 'Radiology';
                if (text.includes('transplant') || text.includes('lung transplant')) return 'Transplant Unit';
                if (text.includes('rehab') || text.includes('pulmonary rehab')) return 'Pulmonary Rehabilitation';
                if (text.includes('call') || text.includes('schedule')) return 'On-call Office';
                return 'Pulmonology Department';
            };

            const getRecentStatuses = () => clinicalStatusHistory.value;

            const getStatusBadgeClass = (status) => {
                if (!status) return 'badge-gray';
                return isStatusExpired(status.expires_at) ? 'badge-warning' : 'badge-success';
            };

            const calculateTimeRemaining = (expiryTime) => {
                if (!expiryTime) return 'N/A';
                try {
                    const diff = new Date(expiryTime) - new Date();
                    if (diff <= 0) return 'Expired';
                    const hours = Math.floor(diff / (1000 * 60 * 60));
                    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
                } catch { return 'N/A'; }
            };

            const isStatusExpired = (expiresAt) => {
                if (!expiresAt) return true;
                try { return new Date() > new Date(expiresAt); }
                catch { return true; }
            };

            const refreshStatus = () => {
                loadClinicalStatus();
                loadSystemStats();
                showToast('Status Refreshed', 'Live status updated', 'info');
            };

            const showCreateStatusModal = () => {
                liveStatsEditMode.value = true;
                newStatusText.value = '';
                selectedAuthorId.value = '';
                expiryHours.value = 8;
            };

            const setQuickStatus = (status) => {
                quickStatus.value = status;
                const messages = {
                    normal: 'All systems normal. No critical issues.',
                    busy: 'ICU at high capacity. Please triage admissions.',
                    shortage: 'Staff shortage affecting multiple areas.',
                    equipment: 'Equipment issues reported. Using backup systems.'
                };
                communicationsModal.form.dailySummary = messages[status] || '';
                if (status === 'busy') communicationsModal.form.alerts.icuFull = true;
                if (status === 'shortage') communicationsModal.form.alerts.staffShortage = true;
                if (status === 'normal') {
                    Object.assign(communicationsModal.form.alerts,
                        { erBusy: false, icuFull: false, wardFull: false, staffShortage: false });
                }
            };

            const formatAudience = (audience) => ({
                'all_staff': 'All Staff', 'medical_staff': 'Medical Staff',
                'residents': 'Residents', 'attendings': 'Attending Physicians'
            }[audience] || audience);

            // ── Absence Modal Preview ─────────────────────────────────

            const getPreviewCardClass = () => {
                if (absenceModal.form.absence_type === 'planned') return 'planned';
                if (absenceModal.form.absence_type === 'unplanned') return 'unplanned';
                return 'active';
            };

            const getPreviewIcon = () => ({
                'vacation': 'fas fa-umbrella-beach text-blue-500',
                'conference': 'fas fa-chalkboard-teacher text-green-500',
                'sick_leave': 'fas fa-heartbeat text-red-500',
                'training': 'fas fa-graduation-cap text-purple-500',
                'personal': 'fas fa-home text-yellow-500',
                'other': 'fas fa-ellipsis-h text-gray-500'
            }[absenceModal.form.absence_reason] || 'fas fa-clock text-gray-500');

            const getPreviewReasonText = () => formatAbsenceReason(absenceModal.form.absence_reason);

            const getPreviewStatusClass = () => ({
                'planned': 'status-planned', 'unplanned': 'status-unplanned'
            }[absenceModal.form.absence_type] || 'status-active');

            const getPreviewStatusText = () => ({
                'planned': 'Planned', 'unplanned': 'Unplanned'
            }[absenceModal.form.absence_type] || 'Active');

            const updatePreview = () => {};

            // ── NEUMAC UI Helpers ─────────────────────────────────────

            const getShiftStatusClass = (shift) => {
                if (!shift?.raw) return 'neumac-status-oncall';
                const today = new Date().toISOString().split('T')[0];
                if (shift.raw.duty_date === today && shift.startTime && shift.endTime) {
                    const now = new Date().getHours() * 100 + new Date().getMinutes();
                    const start = parseInt(shift.startTime.replace(':', ''));
                    const end = parseInt(shift.endTime.replace(':', ''));
                    if (now >= start && now <= end) return 'neumac-status-critical';
                }
                return shift.shiftType === 'Primary' ? 'neumac-status-oncall' : 'neumac-status-busy';
            };

            const isCurrentShift = (shift) => {
                if (!shift?.raw) return false;
                const today = new Date().toISOString().split('T')[0];
                if (shift.raw.duty_date !== today || !shift.startTime || !shift.endTime) return false;
                const now = new Date().getHours() * 100 + new Date().getMinutes();
                return now >= parseInt(shift.startTime.replace(':', '')) &&
                       now <= parseInt(shift.endTime.replace(':', ''));
            };

            const getStaffTypeIcon = (staffType) => ({
                'attending_physician': 'fa-user-md', 'medical_resident': 'fa-user-graduate',
                'fellow': 'fa-user-tie', 'nurse_practitioner': 'fa-user-nurse'
            }[staffType] || 'fa-user');

            const calculateCapacityPercent = (current, max) =>
                (!current || !max || max === 0) ? 0 : Math.round((current / max) * 100);

            const getCapacityDotClass = (index, current) => {
                if (!current || current === 0) return 'available';
                if (index <= current) {
                    const pct = (current / (index || 1)) * 100;
                    if (pct >= 90) return 'full';
                    if (pct >= 75) return 'limited';
                    return 'filled';
                }
                return 'available';
            };

            const getMeterFillClass = (current, max) => {
                if (!current || !max) return '';
                const pct = (current / max) * 100;
                if (pct >= 90) return 'neumac-meter-fill-full';
                if (pct >= 75) return 'neumac-meter-fill-limited';
                return '';
            };

            const getAbsenceReasonIcon = (reason) => ({
                'vacation': 'fa-umbrella-beach', 'sick_leave': 'fa-procedures',
                'conference': 'fa-chalkboard-teacher', 'training': 'fa-graduation-cap',
                'personal': 'fa-user-clock', 'other': 'fa-question-circle'
            }[reason] || 'fa-clock');

            const getScheduleIcon = (activity) => {
                if (!activity) return 'fa-calendar-check';
                const a = activity.toLowerCase();
                if (a.includes('round')) return 'fa-stethoscope';
                if (a.includes('clinic')) return 'fa-clinic-medical';
                if (a.includes('surgery')) return 'fa-scalpel-path';
                if (a.includes('meeting')) return 'fa-users';
                if (a.includes('lecture')) return 'fa-chalkboard-teacher';
                if (a.includes('consultation')) return 'fa-comments-medical';
                return 'fa-calendar-check';
            };

            // ════════════════════════════════════════════════════════
            // DATA LOADING
            // ════════════════════════════════════════════════════════

            const loadMedicalStaff = async () => {
                try { medicalStaff.value = await API.getMedicalStaff(); }
                catch { showToast('Error', 'Failed to load medical staff', 'error'); }
            };

            const loadDepartments = async () => {
                try { departments.value = await API.getDepartments(); }
                catch { showToast('Error', 'Failed to load departments', 'error'); }
            };

            const loadTrainingUnits = async () => {
                try { trainingUnits.value = await API.getTrainingUnits(); }
                catch { showToast('Error', 'Failed to load training units', 'error'); }
            };

            const loadRotations = async () => {
                try { rotations.value = await API.getRotations(); }
                catch { showToast('Error', 'Failed to load rotations', 'error'); }
            };

            const loadAbsences = async () => {
                try { absences.value = await API.getAbsences(); }
                catch { showToast('Error', 'Failed to load absences', 'error'); }
            };

            const loadOnCallSchedule = async () => {
                loadingSchedule.value = true;
                try { onCallSchedule.value = await API.getOnCallSchedule(); }
                catch { showToast('Error', 'Failed to load on-call schedule', 'error'); }
                finally { loadingSchedule.value = false; }
            };

            const loadTodaysOnCall = async () => {
                loadingSchedule.value = true;
                try {
                    const data = await API.getOnCallToday();
                    todaysOnCall.value = data.map(item => {
                        const startTime = item.start_time ? item.start_time.substring(0, 5) : 'N/A';
                        const endTime = item.end_time ? item.end_time.substring(0, 5) : 'N/A';
                        const physicianName = item.primary_physician?.full_name || 'Unknown Physician';
                        let shiftTypeDisplay = 'Unknown';
                        if (item.shift_type === 'primary_call' || item.shift_type === 'primary') shiftTypeDisplay = 'Primary';
                        else if (item.shift_type === 'backup_call' || item.shift_type === 'backup') shiftTypeDisplay = 'Backup';
                        const matchingStaff = medicalStaff.value.find(s => s.id === item.primary_physician_id);
                        return {
                            id: item.id, startTime, endTime, physicianName,
                            staffType: matchingStaff ? formatStaffType(matchingStaff.staff_type) : 'Physician',
                            shiftType: shiftTypeDisplay,
                            coverageArea: item.coverage_area || 'General Coverage',
                            backupPhysician: item.backup_physician?.full_name || null,
                            contactInfo: item.primary_physician?.professional_email || 'No contact info',
                            raw: item
                        };
                    });
                } catch {
                    showToast('Error', "Failed to load today's on-call schedule", 'error');
                    todaysOnCall.value = [];
                } finally { loadingSchedule.value = false; }
            };

            const loadAnnouncements = async () => {
                try { announcements.value = await API.getAnnouncements(); }
                catch { showToast('Error', 'Failed to load announcements', 'error'); }
            };

            const loadClinicalStatus = async () => {
                isLoadingStatus.value = true;
                try {
                    const response = await API.getClinicalStatus();
                    clinicalStatus.value = (response && response.success) ? response.data : null;
                } catch { clinicalStatus.value = null; }
                finally { isLoadingStatus.value = false; }
            };

            const loadClinicalStatusHistory = async () => {
                try {
                    const history = await API.getClinicalStatusHistory(20);
                    const currentId = clinicalStatus.value?.id;
                    const now = new Date();
                    clinicalStatusHistory.value = history
                        .filter(s => {
                            if (s.id === currentId) return false;
                            if (s.expires_at) {
                                try { return now < new Date(s.expires_at); } catch { return true; }
                            }
                            return true;
                        })
                        .slice(0, 5);
                } catch { clinicalStatusHistory.value = []; }
            };

            const loadActiveMedicalStaff = async () => {
                try {
                    const data = await API.getMedicalStaff();
                    activeMedicalStaff.value = data.filter(s => s.employment_status === 'active');
                    if (currentUser.value) {
                        const match = activeMedicalStaff.value.find(s => s.professional_email === currentUser.value.email);
                        if (match) selectedAuthorId.value = match.id;
                    }
                } catch { activeMedicalStaff.value = []; }
            };

            const loadSystemStats = async () => {
                try {
                    const data = await API.getSystemStats();
                    if (data && data.success) Object.assign(systemStats.value, data.data);
                } catch {}
            };

            const updateDashboardStats = () => {
                systemStats.value.totalStaff = medicalStaff.value.length;
                systemStats.value.activeAttending = medicalStaff.value.filter(s =>
                    s.staff_type === 'attending_physician' && s.employment_status === 'active').length;
                systemStats.value.activeResidents = medicalStaff.value.filter(s =>
                    s.staff_type === 'medical_resident' && s.employment_status === 'active').length;

                const today = new Date().toISOString().split('T')[0];
                systemStats.value.onLeaveStaff = absences.value.filter(a => {
                    if (!a.start_date || !a.end_date) return false;
                    const active = a.start_date <= today && today <= a.end_date;
                    if (!active) return false;
                    if (a.current_status) {
                        return ['currently_absent', 'active', 'on_leave', 'approved'].includes(a.current_status.toLowerCase());
                    }
                    return true;
                }).length;

                systemStats.value.activeRotations = rotations.value.filter(r => r.rotation_status === 'active').length;

                const todayDate = new Date();
                const nextWeek = new Date(todayDate.getTime() + 7 * 24 * 60 * 60 * 1000);
                systemStats.value.endingThisWeek = rotations.value.filter(r => {
                    if (r.rotation_status !== 'active') return false;
                    const end = new Date(r.rotation_end_date || r.end_date);
                    return !isNaN(end.getTime()) && end >= todayDate && end <= nextWeek;
                }).length;

                const twoWeeks = new Date(todayDate.getTime() + 14 * 24 * 60 * 60 * 1000);
                systemStats.value.startingNextWeek = rotations.value.filter(r => {
                    if (r.rotation_status !== 'scheduled') return false;
                    const start = new Date(r.rotation_start_date || r.start_date);
                    return !isNaN(start.getTime()) && start >= nextWeek && start <= twoWeeks;
                }).length;

                const uniqueOnCall = new Set();
                onCallSchedule.value
                    .filter(s => s.duty_date === today)
                    .forEach(s => {
                        if (s.primary_physician_id) uniqueOnCall.add(s.primary_physician_id);
                        if (s.backup_physician_id) uniqueOnCall.add(s.backup_physician_id);
                    });
                systemStats.value.onCallNow = uniqueOnCall.size;
            };

            const loadAllData = async () => {
                loading.value = true;
                try {
                    await Promise.all([
                        loadMedicalStaff(), loadDepartments(), loadTrainingUnits(),
                        loadRotations(), loadAbsences(), loadOnCallSchedule(),
                        loadTodaysOnCall(), loadAnnouncements(),
                        loadClinicalStatus(), loadSystemStats()
                    ]);
                    await loadActiveMedicalStaff();
                    updateDashboardStats();
                    showToast('Success', 'System data loaded successfully', 'success');
                } catch {
                    showToast('Error', 'Failed to load some data', 'error');
                } finally { loading.value = false; }
            };

            // ════════════════════════════════════════════════════════
            // AUTHENTICATION
            // ════════════════════════════════════════════════════════

            const handleLogin = async () => {
                if (!loginForm.email || !loginForm.password) {
                    showToast('Error', 'Email and password are required', 'error');
                    return;
                }
                loginLoading.value = true;
                try {
                    const response = await API.login(loginForm.email, loginForm.password);
                    currentUser.value = response.user;
                    localStorage.setItem(CONFIG.USER_KEY, JSON.stringify(response.user));
                    showToast('Success', `Welcome, ${response.user.full_name}!`, 'success');
                    await loadAllData();
                    currentView.value = 'dashboard';
                } catch (error) {
                    showToast('Error', error.message || 'Login failed', 'error');
                } finally { loginLoading.value = false; }
            };

            const handleLogout = () => {
                showConfirmation({
                    title: 'Logout', message: 'Are you sure you want to logout?',
                    icon: 'fa-sign-out-alt', confirmButtonText: 'Logout', confirmButtonClass: 'btn-danger',
                    onConfirm: async () => {
                        try { await API.logout(); }
                        finally {
                            currentUser.value = null;
                            currentView.value = 'login';
                            userMenuOpen.value = false;
                            showToast('Info', 'Logged out successfully', 'info');
                        }
                    }
                });
            };

            // ════════════════════════════════════════════════════════
            // NAVIGATION & UI
            // ════════════════════════════════════════════════════════

            const switchView = (view) => { currentView.value = view; mobileMenuOpen.value = false; };
            const toggleStatsSidebar = () => { statsSidebarOpen.value = !statsSidebarOpen.value; };
            const handleGlobalSearch = () => {
                if (globalSearchQuery.value.trim())
                    showToast('Search', `Searching for "${globalSearchQuery.value}"`, 'info');
            };
            const dismissAlert = (id) => {
                const index = systemAlerts.value.findIndex(a => a.id === id);
                if (index > -1) systemAlerts.value.splice(index, 1);
            };

            // ════════════════════════════════════════════════════════
            // MODAL SHOW FUNCTIONS
            // ════════════════════════════════════════════════════════

            const showAddMedicalStaffModal = () => {
                medicalStaffModal.mode = 'add';
                medicalStaffModal.activeTab = 'basic';
                medicalStaffModal.form = {
                    full_name: '', staff_type: 'medical_resident',
                    staff_id: `MD-${Date.now().toString().slice(-6)}`,
                    employment_status: 'active', professional_email: '', department_id: '',
                    academic_degree: '', specialization: '', training_year: '',
                    clinical_certificate: '', certificate_status: '',
                    resident_category: '', primary_clinic: '', work_phone: '',
                    medical_license: '', can_supervise_residents: false, special_notes: '',
                    resident_type: '', home_department: '', external_institution: '',
                    years_experience: null, biography: '', date_of_birth: null,
                    mobile_phone: '', office_phone: '', training_level: ''
                };
                medicalStaffModal.show = true;
            };

            const showAddDepartmentModal = () => {
                departmentModal.mode = 'add';
                departmentModal.form = { name: '', code: '', status: 'active', head_of_department_id: '' };
                departmentModal.show = true;
            };

            const showAddTrainingUnitModal = () => {
                trainingUnitModal.mode = 'add';
                trainingUnitModal.form = {
                    unit_name: '', unit_code: '', department_id: '', maximum_residents: 10,
                    unit_status: 'active', specialty: '', supervising_attending_id: ''
                };
                trainingUnitModal.show = true;
            };

            const showAddRotationModal = () => {
                rotationModal.mode = 'add';
                rotationModal.form = {
                    rotation_id: `ROT-${Date.now().toString().slice(-6)}`,
                    resident_id: '', training_unit_id: '',
                    rotation_start_date: new Date().toISOString().split('T')[0],
                    rotation_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    rotation_status: 'scheduled', rotation_category: 'clinical_rotation',
                    supervising_attending_id: ''
                };
                rotationModal.show = true;
            };

            const showAddOnCallModal = () => {
                onCallModal.mode = 'add';
                onCallModal.form = {
                    duty_date: new Date().toISOString().split('T')[0],
                    shift_type: 'primary_call', start_time: '08:00', end_time: '17:00',
                    primary_physician_id: '', backup_physician_id: '',
                    coverage_area: 'emergency',
                    schedule_id: `SCH-${Date.now().toString().slice(-6)}`
                };
                onCallModal.show = true;
            };

            const showAddAbsenceModal = () => {
                absenceModal.mode = 'add';
                absenceModal.form = {
                    staff_member_id: '', absence_type: 'planned', absence_reason: 'vacation',
                    start_date: new Date().toISOString().split('T')[0],
                    end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    current_status: 'pending', covering_staff_id: '',
                    coverage_notes: '', coverage_arranged: false, hod_notes: ''
                };
                absenceModal.show = true;
            };

            const showCommunicationsModal = () => {
                communicationsModal.show = true;
                communicationsModal.activeTab = 'announcement';
                communicationsModal.form = {
                    title: '', content: '', priority: 'normal', target_audience: 'all_staff',
                    updateType: 'daily', dailySummary: '', highlight1: '', highlight2: '',
                    alerts: { erBusy: false, icuFull: false, wardFull: false, staffShortage: false },
                    metricName: '', metricValue: '', metricTrend: 'stable', metricChange: '',
                    metricNote: '', alertLevel: 'low', alertMessage: '',
                    affectedAreas: { er: false, icu: false, ward: false, surgery: false }
                };
            };

            const showUserProfileModal = () => {
                userProfileModal.form = {
                    full_name: currentUser.value?.full_name || '',
                    email: currentUser.value?.email || '',
                    department_id: currentUser.value?.department_id || ''
                };
                userProfileModal.show = true;
                userMenuOpen.value = false;
            };

            // ════════════════════════════════════════════════════════
            // VIEW / EDIT FUNCTIONS
            // ════════════════════════════════════════════════════════

            // Opens profile with Assignments tab active (no fake clinical tab)
            const viewStaffDetails = (staff) => {
                staffProfileModal.staff = staff;
                staffProfileModal.activeTab = 'assignments';
                staffProfileModal.show = true;
                userMenuOpen.value = false;
            };

            const editMedicalStaff = (staff) => {
                medicalStaffModal.mode = 'edit';
                medicalStaffModal.form = { ...staff };
                medicalStaffModal.show = true;
                staffProfileModal.show = false;
            };

            const editDepartment = (department) => {
                departmentModal.mode = 'edit';
                departmentModal.form = { ...department };
                departmentModal.show = true;
            };

            const editTrainingUnit = (unit) => {
                trainingUnitModal.mode = 'edit';
                trainingUnitModal.form = { ...unit };
                trainingUnitModal.show = true;
            };

            const editRotation = (rotation) => {
                rotationModal.mode = 'edit';
                rotationModal.form = { ...rotation };
                rotationModal.show = true;
            };

            const editOnCallSchedule = (schedule) => {
                onCallModal.mode = 'edit';
                onCallModal.form = { ...schedule };
                onCallModal.show = true;
            };

            const editAbsence = (absence) => {
                absenceModal.mode = 'edit';
                absenceModal.form = { ...absence };
                absenceModal.show = true;
            };

            // NEW: Opens Unit Residents modal — active + scheduled only
            const viewUnitResidents = (unit) => {
                const unitRotations = rotations.value.filter(r =>
                    r.training_unit_id === unit.id &&
                    (r.rotation_status === 'active' || r.rotation_status === 'scheduled')
                );
                // Sort: active first, then by start_date
                unitRotations.sort((a, b) => {
                    if (a.rotation_status === 'active' && b.rotation_status !== 'active') return -1;
                    if (b.rotation_status === 'active' && a.rotation_status !== 'active') return 1;
                    const dateA = new Date(a.start_date || a.rotation_start_date || 0);
                    const dateB = new Date(b.start_date || b.rotation_start_date || 0);
                    return dateA - dateB;
                });
                unitResidentsModal.unit = unit;
                unitResidentsModal.rotations = unitRotations;
                unitResidentsModal.show = true;
            };

            const viewDepartmentStaff = (department) => {
                showToast('Department Staff', `Viewing staff for ${department.name}`, 'info');
            };

            // ════════════════════════════════════════════════════════
            // SAVE FUNCTIONS
            // ════════════════════════════════════════════════════════

            const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

            const saveMedicalStaff = async () => {
                saving.value = true;
                if (!medicalStaffModal.form.full_name?.trim()) {
                    showToast('Error', 'Full name is required', 'error');
                    saving.value = false;
                    return;
                }
                try {
                    const clean = (v) => (v === null || v === undefined) ? '' : String(v).trim();
                    const staffData = {
                        full_name: medicalStaffModal.form.full_name.trim(),
                        staff_type: medicalStaffModal.form.staff_type || 'medical_resident',
                        staff_id: medicalStaffModal.form.staff_id || EnhancedUtils.generateId('MD'),
                        employment_status: medicalStaffModal.form.employment_status || 'active',
                        professional_email: medicalStaffModal.form.professional_email || '',
                        department_id: medicalStaffModal.form.department_id || null,
                        academic_degree: clean(medicalStaffModal.form.academic_degree),
                        specialization: clean(medicalStaffModal.form.specialization),
                        training_year: clean(medicalStaffModal.form.training_year),
                        clinical_certificate: clean(medicalStaffModal.form.clinical_certificate),
                        certificate_status: clean(medicalStaffModal.form.certificate_status),
                        resident_category: clean(medicalStaffModal.form.resident_category),
                        primary_clinic: clean(medicalStaffModal.form.primary_clinic),
                        work_phone: clean(medicalStaffModal.form.work_phone),
                        medical_license: clean(medicalStaffModal.form.medical_license),
                        can_supervise_residents: medicalStaffModal.form.can_supervise_residents || false,
                        special_notes: clean(medicalStaffModal.form.special_notes),
                        resident_type: clean(medicalStaffModal.form.resident_type),
                        home_department: clean(medicalStaffModal.form.home_department),
                        external_institution: clean(medicalStaffModal.form.external_institution),
                        years_experience: medicalStaffModal.form.years_experience || null,
                        biography: clean(medicalStaffModal.form.biography),
                        date_of_birth: medicalStaffModal.form.date_of_birth || null,
                        mobile_phone: clean(medicalStaffModal.form.mobile_phone),
                        office_phone: clean(medicalStaffModal.form.office_phone),
                        training_level: clean(medicalStaffModal.form.training_level)
                    };
                    if (staffData.professional_email && !isValidEmail(staffData.professional_email)) {
                        showToast('Error', 'Please enter a valid email address', 'error');
                        saving.value = false;
                        return;
                    }
                    if (medicalStaffModal.mode === 'add') {
                        const result = await API.createMedicalStaff(staffData);
                        medicalStaff.value.unshift(result);
                        showToast('Success', 'Medical staff added successfully', 'success');
                    } else {
                        const result = await API.updateMedicalStaff(medicalStaffModal.form.id, staffData);
                        const index = medicalStaff.value.findIndex(s => s.id === result.id);
                        if (index !== -1) medicalStaff.value[index] = result;
                        showToast('Success', 'Medical staff updated successfully', 'success');
                    }
                    medicalStaffModal.show = false;
                    updateDashboardStats();
                } catch (error) {
                    if (error.message?.includes('email')) showToast('Error', 'Please enter a valid email address', 'error');
                    else showToast('Error', error.message || 'Failed to save medical staff', 'error');
                } finally { saving.value = false; }
            };

            const saveDepartment = async () => {
                saving.value = true;
                try {
                    if (departmentModal.mode === 'add') {
                        const result = await API.createDepartment(departmentModal.form);
                        departments.value.unshift(result);
                        showToast('Success', 'Department created successfully', 'success');
                    } else {
                        const result = await API.updateDepartment(departmentModal.form.id, departmentModal.form);
                        const index = departments.value.findIndex(d => d.id === result.id);
                        if (index !== -1) departments.value[index] = result;
                        showToast('Success', 'Department updated successfully', 'success');
                    }
                    departmentModal.show = false;
                } catch (error) { showToast('Error', error.message, 'error'); }
                finally { saving.value = false; }
            };

            const saveTrainingUnit = async () => {
                saving.value = true;
                try {
                    const unitData = {
                        unit_name: trainingUnitModal.form.unit_name,
                        unit_code: trainingUnitModal.form.unit_code,
                        department_id: trainingUnitModal.form.department_id,
                        supervisor_id: trainingUnitModal.form.supervising_attending_id || null,
                        maximum_residents: trainingUnitModal.form.maximum_residents,
                        unit_status: trainingUnitModal.form.unit_status,
                        description: trainingUnitModal.form.specialty || ''
                    };
                    if (trainingUnitModal.mode === 'add') {
                        const result = await API.createTrainingUnit(unitData);
                        trainingUnits.value.unshift(result);
                        showToast('Success', 'Training unit created successfully', 'success');
                    } else {
                        const result = await API.updateTrainingUnit(trainingUnitModal.form.id, unitData);
                        const index = trainingUnits.value.findIndex(u => u.id === result.id);
                        if (index !== -1) trainingUnits.value[index] = result;
                        showToast('Success', 'Training unit updated successfully', 'success');
                    }
                    trainingUnitModal.show = false;
                    updateDashboardStats();
                } catch (error) { showToast('Error', error.message, 'error'); }
                finally { saving.value = false; }
            };

            const saveRotation = async () => {
                if (!rotationModal.form.resident_id) {
                    showToast('Error', 'Please select a resident', 'error'); return;
                }
                if (!rotationModal.form.training_unit_id) {
                    showToast('Error', 'Please select a training unit', 'error'); return;
                }

                const startDateStr = rotationModal.form.rotation_start_date;
                const endDateStr = rotationModal.form.rotation_end_date;
                if (!startDateStr || !endDateStr) {
                    showToast('Error', 'Please enter both start and end dates', 'error'); return;
                }

                const parseDate = (dateStr) => {
                    if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) return new Date(dateStr + 'T00:00:00');
                    if (dateStr.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
                        const [day, month, year] = dateStr.split('/');
                        return new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T00:00:00`);
                    }
                    return new Date(dateStr);
                };

                const startDate = parseDate(startDateStr);
                const endDate = parseDate(endDateStr);
                if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                    showToast('Error', 'Invalid date format. Use YYYY-MM-DD or DD/MM/YYYY', 'error'); return;
                }
                if (endDate <= startDate) {
                    showToast('Error', 'End date must be after start date', 'error'); return;
                }

                rotationModal.form.rotation_start_date = startDate.toISOString().split('T')[0];
                rotationModal.form.rotation_end_date = endDate.toISOString().split('T')[0];

                // Overlap check
                const hasOverlap = rotations.value.some(r => {
                    if (r.resident_id !== rotationModal.form.resident_id) return false;
                    if (r.rotation_status === 'cancelled') return false;
                    if (rotationModal.mode === 'edit' && r.id === rotationModal.form.id) return false;
                    const rStart = new Date((r.start_date || r.rotation_start_date) + 'T00:00:00');
                    const rEnd = new Date((r.end_date || r.rotation_end_date) + 'T23:59:59');
                    return startDate <= rEnd && endDate >= rStart;
                });

                if (hasOverlap) {
                    showToast('Scheduling Conflict',
                        `${getResidentName(rotationModal.form.resident_id)} already has a rotation during these dates.`,
                        'error');
                    return;
                }

                saving.value = true;
                try {
                    const rotationData = {
                        rotation_id: rotationModal.form.rotation_id || EnhancedUtils.generateId('ROT'),
                        resident_id: rotationModal.form.resident_id,
                        training_unit_id: rotationModal.form.training_unit_id,
                        supervising_attending_id: rotationModal.form.supervising_attending_id || null,
                        start_date: rotationModal.form.rotation_start_date,
                        end_date: rotationModal.form.rotation_end_date,
                        rotation_category: rotationModal.form.rotation_category || 'clinical_rotation',
                        rotation_status: rotationModal.form.rotation_status || 'scheduled'
                    };

                    if (rotationModal.mode === 'add') {
                        const result = await API.createRotation(rotationData);
                        rotations.value.unshift(result);
                        showToast('Success', 'Rotation scheduled successfully', 'success');
                    } else {
                        const result = await API.updateRotation(rotationModal.form.id, rotationData);
                        const index = rotations.value.findIndex(r => r.id === result.id);
                        if (index !== -1) rotations.value[index] = result;
                        showToast('Success', 'Rotation updated successfully', 'success');
                    }

                    rotationModal.show = false;
                    await loadRotations();
                    updateDashboardStats();
                } catch (error) {
                    let msg = error.message || 'Failed to save rotation';
                    if (msg.includes('overlapping')) msg = 'Rotation dates conflict with existing schedule';
                    showToast('Error', msg, 'error');
                } finally { saving.value = false; }
            };

            const saveOnCallSchedule = async () => {
                saving.value = true;
                try {
                    const onCallData = {
                        duty_date: onCallModal.form.duty_date,
                        shift_type: onCallModal.form.shift_type || 'primary_call',
                        start_time: onCallModal.form.start_time || '08:00',
                        end_time: onCallModal.form.end_time || '17:00',
                        primary_physician_id: onCallModal.form.primary_physician_id,
                        backup_physician_id: onCallModal.form.backup_physician_id || null,
                        coverage_area: onCallModal.form.coverage_area || 'general',
                        schedule_id: onCallModal.form.schedule_id || EnhancedUtils.generateId('SCH')
                    };
                    if (onCallModal.mode === 'add') {
                        const result = await API.createOnCall(onCallData);
                        onCallSchedule.value.unshift(result);
                        showToast('Success', 'On-call scheduled successfully', 'success');
                    } else {
                        const result = await API.updateOnCall(onCallModal.form.id, onCallData);
                        const index = onCallSchedule.value.findIndex(s => s.id === result.id);
                        if (index !== -1) onCallSchedule.value[index] = result;
                        showToast('Success', 'On-call updated successfully', 'success');
                    }
                    onCallModal.show = false;
                    loadTodaysOnCall();
                } catch (error) { showToast('Error', error.message || 'Failed to save on-call schedule', 'error'); }
                finally { saving.value = false; }
            };

            const saveAbsence = async () => {
                saving.value = true;
                try {
                    const absenceData = {
                        staff_member_id: absenceModal.form.staff_member_id,
                        absence_type: absenceModal.form.absence_type || 'planned',
                        absence_reason: absenceModal.form.absence_reason,
                        start_date: absenceModal.form.start_date,
                        end_date: absenceModal.form.end_date,
                        current_status: absenceModal.form.current_status || 'planned_leave',
                        covering_staff_id: absenceModal.form.covering_staff_id || null,
                        coverage_notes: absenceModal.form.coverage_notes || '',
                        coverage_arranged: absenceModal.form.coverage_arranged || false,
                        hod_notes: absenceModal.form.hod_notes || '',
                        recorded_by: currentUser.value?.id || null
                    };
                    if (absenceModal.mode === 'add') {
                        const result = await API.createAbsence(absenceData);
                        absences.value.unshift(result);
                        showToast('Success', 'Absence recorded successfully', 'success');
                    } else {
                        const result = await API.updateAbsence(absenceModal.form.id, absenceData);
                        const index = absences.value.findIndex(a => a.id === result.id);
                        if (index !== -1) absences.value[index] = result;
                        showToast('Success', 'Absence updated successfully', 'success');
                    }
                    absenceModal.show = false;
                    await loadAbsences();
                    updateDashboardStats();
                } catch (error) { showToast('Error', error.message || 'Failed to save absence record', 'error'); }
                finally { saving.value = false; }
            };

            const saveClinicalStatus = async () => {
                if (!newStatusText.value.trim() || !selectedAuthorId.value) {
                    showToast('Error', 'Please fill all required fields', 'error'); return;
                }
                isLoadingStatus.value = true;
                try {
                    const response = await API.createClinicalStatus({
                        status_text: newStatusText.value.trim(),
                        author_id: selectedAuthorId.value,
                        expires_in_hours: expiryHours.value
                    });
                    if (response && response.success && response.data) {
                        if (clinicalStatus.value) {
                            clinicalStatusHistory.value.unshift(clinicalStatus.value);
                            if (clinicalStatusHistory.value.length > 5)
                                clinicalStatusHistory.value = clinicalStatusHistory.value.slice(0, 5);
                        }
                        clinicalStatus.value = response.data;
                        newStatusText.value = '';
                        selectedAuthorId.value = '';
                        liveStatsEditMode.value = false;
                        await loadClinicalStatusHistory();
                        showToast('Success', 'Live status has been updated for all staff', 'success');
                        await loadSystemStats();
                    } else {
                        throw new Error(response?.error || 'Failed to save status');
                    }
                } catch (error) {
                    showToast('Error', error.message || 'Could not update status. Please try again.', 'error');
                } finally { isLoadingStatus.value = false; }
            };

            const saveCommunication = async () => {
                saving.value = true;
                try {
                    if (communicationsModal.activeTab === 'announcement') {
                        const result = await API.createAnnouncement({
                            title: communicationsModal.form.title,
                            content: communicationsModal.form.content,
                            priority_level: communicationsModal.form.priority,
                            target_audience: communicationsModal.form.target_audience,
                            type: 'announcement'
                        });
                        announcements.value.unshift(result);
                        showToast('Success', 'Announcement posted successfully', 'success');
                    } else {
                        await saveClinicalStatus();
                    }
                    communicationsModal.show = false;
                } catch (error) { showToast('Error', error.message, 'error'); }
                finally { saving.value = false; }
            };

            const saveUserProfile = async () => {
                saving.value = true;
                try {
                    currentUser.value.full_name = userProfileModal.form.full_name;
                    currentUser.value.department_id = userProfileModal.form.department_id;
                    localStorage.setItem(CONFIG.USER_KEY, JSON.stringify(currentUser.value));
                    userProfileModal.show = false;
                    showToast('Success', 'Profile updated successfully', 'success');
                } catch (error) { showToast('Error', error.message, 'error'); }
                finally { saving.value = false; }
            };

            // ════════════════════════════════════════════════════════
            // DELETE FUNCTIONS
            // ════════════════════════════════════════════════════════

            const deleteMedicalStaff = async (staff) => {
                showConfirmation({
                    title: 'Delete Medical Staff', message: `Are you sure you want to delete ${staff.full_name}?`,
                    icon: 'fa-trash', confirmButtonText: 'Delete', confirmButtonClass: 'btn-danger',
                    details: 'This action cannot be undone.',
                    onConfirm: async () => {
                        try {
                            await API.deleteMedicalStaff(staff.id);
                            const i = medicalStaff.value.findIndex(s => s.id === staff.id);
                            if (i > -1) medicalStaff.value.splice(i, 1);
                            showToast('Success', 'Medical staff deleted successfully', 'success');
                            updateDashboardStats();
                        } catch (error) { showToast('Error', error.message, 'error'); }
                    }
                });
            };

            const deleteRotation = async (rotation) => {
                showConfirmation({
                    title: 'Delete Rotation', message: 'Are you sure you want to delete this rotation?',
                    icon: 'fa-trash', confirmButtonText: 'Delete', confirmButtonClass: 'btn-danger',
                    details: `Resident: ${getResidentName(rotation.resident_id)}`,
                    onConfirm: async () => {
                        try {
                            await API.deleteRotation(rotation.id);
                            const i = rotations.value.findIndex(r => r.id === rotation.id);
                            if (i > -1) rotations.value.splice(i, 1);
                            showToast('Success', 'Rotation deleted successfully', 'success');
                            updateDashboardStats();
                        } catch (error) { showToast('Error', error.message, 'error'); }
                    }
                });
            };

            const deleteOnCallSchedule = async (schedule) => {
                showConfirmation({
                    title: 'Delete On-Call Schedule', message: 'Are you sure you want to delete this on-call schedule?',
                    icon: 'fa-trash', confirmButtonText: 'Delete', confirmButtonClass: 'btn-danger',
                    details: `Physician: ${getPhysicianName(schedule.primary_physician_id)}`,
                    onConfirm: async () => {
                        try {
                            await API.deleteOnCall(schedule.id);
                            const i = onCallSchedule.value.findIndex(s => s.id === schedule.id);
                            if (i > -1) onCallSchedule.value.splice(i, 1);
                            showToast('Success', 'On-call schedule deleted successfully', 'success');
                            loadTodaysOnCall();
                        } catch (error) { showToast('Error', error.message, 'error'); }
                    }
                });
            };

            const deleteAbsence = async (absence) => {
                showConfirmation({
                    title: 'Delete Absence', message: 'Are you sure you want to delete this absence record?',
                    icon: 'fa-trash', confirmButtonText: 'Delete', confirmButtonClass: 'btn-danger',
                    details: `Staff: ${getStaffName(absence.staff_member_id)}`,
                    onConfirm: async () => {
                        try {
                            await API.deleteAbsence(absence.id);
                            const i = absences.value.findIndex(a => a.id === absence.id);
                            if (i > -1) absences.value.splice(i, 1);
                            showToast('Success', 'Absence deleted successfully', 'success');
                            updateDashboardStats();
                        } catch (error) { showToast('Error', error.message, 'error'); }
                    }
                });
            };

            const deleteAnnouncement = async (announcement) => {
                showConfirmation({
                    title: 'Delete Announcement', message: `Delete "${announcement.title}"?`,
                    icon: 'fa-trash', confirmButtonText: 'Delete', confirmButtonClass: 'btn-danger',
                    onConfirm: async () => {
                        try {
                            await API.deleteAnnouncement(announcement.id);
                            const i = announcements.value.findIndex(a => a.id === announcement.id);
                            if (i > -1) announcements.value.splice(i, 1);
                            showToast('Success', 'Announcement deleted successfully', 'success');
                        } catch (error) { showToast('Error', error.message, 'error'); }
                    }
                });
            };

            const deleteClinicalStatus = async () => {
                if (!clinicalStatus.value) return;
                showConfirmation({
                    title: 'Clear Live Status', message: 'Are you sure you want to clear the current live status?',
                    icon: 'fa-trash', confirmButtonText: 'Clear', confirmButtonClass: 'btn-danger',
                    onConfirm: async () => {
                        try {
                            await API.deleteClinicalStatus(clinicalStatus.value.id);
                            clinicalStatus.value = null;
                            showToast('Success', 'Live status cleared', 'success');
                        } catch (error) { showToast('Error', error.message, 'error'); }
                    }
                });
            };

            // ════════════════════════════════════════════════════════
            // ACTION FUNCTIONS
            // ════════════════════════════════════════════════════════

            const contactPhysician = (shift) => {
                if (shift.contactInfo && shift.contactInfo !== 'No contact info') {
                    showToast('Contact Physician', `Contact ${shift.physicianName} via ${shift.contactInfo.includes('@') ? 'email' : 'phone'}`, 'info');
                } else {
                    showToast('No Contact Info', `No contact information available for ${shift.physicianName}`, 'warning');
                }
            };

            const viewAnnouncement = (announcement) => {
                showToast(announcement.title, EnhancedUtils.truncateText(announcement.content, 100), 'info');
            };

            // ════════════════════════════════════════════════════════
            // PERMISSIONS
            // ════════════════════════════════════════════════════════

            const hasPermission = (module, action = 'read') => {
                const role = currentUser.value?.user_role;
                if (!role) return false;
                if (role === 'system_admin') return true;
                const permissions = PERMISSION_MATRIX[role]?.[module];
                if (!permissions) return false;
                return permissions.includes(action) || permissions.includes('*');
            };

            // ════════════════════════════════════════════════════════
            // COMPUTED PROPERTIES
            // ════════════════════════════════════════════════════════

            const authToken = computed(() => localStorage.getItem(CONFIG.TOKEN_KEY));
            const unreadAnnouncements = computed(() => announcements.value.filter(a => !a.read).length);
            const unreadLiveUpdates = computed(() => {
                if (!clinicalStatus.value) return 0;
                return localStorage.getItem('lastSeenStatusId') !== clinicalStatus.value.id ? 1 : 0;
            });
            const formattedExpiry = computed(() => {
                if (!clinicalStatus.value?.expires_at) return '';
                const diffHours = Math.ceil((new Date(clinicalStatus.value.expires_at) - new Date()) / (1000 * 60 * 60));
                if (diffHours <= 1) return 'Expires soon';
                if (diffHours <= 4) return `Expires in ${diffHours}h`;
                return `Expires ${EnhancedUtils.formatTime(clinicalStatus.value.expires_at)}`;
            });

            const availablePhysicians = computed(() =>
                medicalStaff.value.filter(s =>
                    ['attending_physician', 'fellow', 'nurse_practitioner'].includes(s.staff_type) &&
                    s.employment_status === 'active'
                )
            );
            const availableResidents = computed(() =>
                medicalStaff.value.filter(s => s.staff_type === 'medical_resident' && s.employment_status === 'active')
            );
            const availableAttendings = computed(() =>
                medicalStaff.value.filter(s => s.staff_type === 'attending_physician' && s.employment_status === 'active')
            );
            const availableHeadsOfDepartment = computed(() => availableAttendings.value);
            const availableReplacementStaff = computed(() =>
                medicalStaff.value.filter(s => s.employment_status === 'active' && s.staff_type === 'medical_resident')
            );

            const filteredMedicalStaff = computed(() => {
                let f = medicalStaff.value;
                if (staffFilters.search) {
                    const s = staffFilters.search.toLowerCase();
                    f = f.filter(staff =>
                        staff.full_name?.toLowerCase().includes(s) ||
                        staff.staff_id?.toLowerCase().includes(s) ||
                        staff.professional_email?.toLowerCase().includes(s)
                    );
                }
                if (staffFilters.staffType) f = f.filter(s => s.staff_type === staffFilters.staffType);
                if (staffFilters.department) f = f.filter(s => s.department_id === staffFilters.department);
                if (staffFilters.status) f = f.filter(s => s.employment_status === staffFilters.status);
                return f;
            });

            const filteredOnCallSchedules = computed(() => {
                let f = onCallSchedule.value;
                if (onCallFilters.date) f = f.filter(s => s.duty_date === onCallFilters.date);
                if (onCallFilters.shiftType) f = f.filter(s => s.shift_type === onCallFilters.shiftType);
                if (onCallFilters.physician) f = f.filter(s =>
                    s.primary_physician_id === onCallFilters.physician ||
                    s.backup_physician_id === onCallFilters.physician
                );
                if (onCallFilters.coverageArea) f = f.filter(s => s.coverage_area === onCallFilters.coverageArea);
                return f;
            });

            const filteredRotations = computed(() => {
                let f = rotations.value;
                if (rotationFilters.resident) f = f.filter(r => r.resident_id === rotationFilters.resident);
                if (rotationFilters.status) f = f.filter(r => r.rotation_status === rotationFilters.status);
                if (rotationFilters.trainingUnit) f = f.filter(r => r.training_unit_id === rotationFilters.trainingUnit);
                if (rotationFilters.supervisor) f = f.filter(r => r.supervising_attending_id === rotationFilters.supervisor);
                return f;
            });

            const filteredAbsences = computed(() => {
                let f = absences.value;
                if (absenceFilters.staff) f = f.filter(a => a.staff_member_id === absenceFilters.staff);
                if (absenceFilters.status) {
                    f = f.filter(a => {
                        const status = a.current_status || a.status || a.absence_status;
                        return status === absenceFilters.status;
                    });
                }
                if (absenceFilters.reason) f = f.filter(a => a.absence_reason === absenceFilters.reason);
                if (absenceFilters.startDate) f = f.filter(a => a.start_date >= absenceFilters.startDate);
                return f;
            });

            const recentAnnouncements = computed(() => announcements.value.slice(0, 10));
            const activeAlertsCount = computed(() =>
                systemAlerts.value.filter(a => a.status === 'active' || !a.status).length
            );
            const currentTimeFormatted = computed(() => EnhancedUtils.formatTime(currentTime.value));

            // ════════════════════════════════════════════════════════
            // LIFECYCLE
            // ════════════════════════════════════════════════════════

            onMounted(() => {
                const token = localStorage.getItem(CONFIG.TOKEN_KEY);
                const user = localStorage.getItem(CONFIG.USER_KEY);
                if (token && user) {
                    try {
                        currentUser.value = JSON.parse(user);
                        loadAllData();
                        currentView.value = 'dashboard';
                    } catch { currentView.value = 'login'; }
                } else {
                    currentView.value = 'login';
                }

                const statusInterval = setInterval(() => {
                    if (currentUser.value && !isLoadingStatus.value) loadClinicalStatus();
                }, 60000);

                const timeInterval = setInterval(() => {
                    currentTime.value = new Date();
                }, 60000);

                document.addEventListener('keydown', (e) => {
                    if (e.key === 'Escape') {
                        [medicalStaffModal, departmentModal, trainingUnitModal, rotationModal,
                         onCallModal, absenceModal, communicationsModal, staffProfileModal,
                         userProfileModal, confirmationModal, unitResidentsModal]
                            .forEach(modal => { if (modal.show) modal.show = false; });
                    }
                });

                onUnmounted(() => {
                    clearInterval(statusInterval);
                    clearInterval(timeInterval);
                });
            });

            watch([medicalStaff, rotations, trainingUnits, absences], () => {
                updateDashboardStats();
            }, { deep: true });

            // ════════════════════════════════════════════════════════
            // RETURN
            // ════════════════════════════════════════════════════════
            return {
                // State
                currentUser, loginForm, loginLoading, loading, saving, loadingSchedule, isLoadingStatus,
                currentView, sidebarCollapsed, mobileMenuOpen, userMenuOpen, statsSidebarOpen, globalSearchQuery,

                // Data
                medicalStaff, departments, trainingUnits, rotations, absences, onCallSchedule, announcements,

                // Live Status
                clinicalStatus, newStatusText, selectedAuthorId, expiryHours, activeMedicalStaff,
                liveStatsEditMode, quickStatus, currentTime,
                getStatusLocation, getRecentStatuses,

                // Dashboard
                systemStats, todaysOnCall, todaysOnCallCount,

                // UI
                toasts, systemAlerts,

                // Filters
                staffFilters, onCallFilters, rotationFilters, absenceFilters,

                // Modals
                staffProfileModal, unitResidentsModal, medicalStaffModal, communicationsModal,
                onCallModal, rotationModal, trainingUnitModal, absenceModal,
                departmentModal, userProfileModal, confirmationModal,

                // Formatting
                formatDate: EnhancedUtils.formatDate,
                formatDateTime: EnhancedUtils.formatDateTime,
                formatTime: EnhancedUtils.formatTime,
                formatRelativeTime: EnhancedUtils.formatRelativeTime,
                getInitials: EnhancedUtils.getInitials,
                formatStaffType, getStaffTypeClass, formatEmploymentStatus,
                formatAbsenceReason, formatAbsenceStatus, formatRotationStatus,
                getUserRoleDisplay, getCurrentViewTitle, getCurrentViewSubtitle,
                getSearchPlaceholder, formatTimeAgo,

                // Data Helpers
                getDepartmentName, getStaffName, getTrainingUnitName, getSupervisorName,
                getPhysicianName, getResidentName, getDepartmentUnits, getDepartmentStaffCount,
                getCurrentRotationForStaff, calculateAbsenceDuration,

                // NEW: Unit Residents Helpers
                getUnitActiveRotationCount, getDaysRemaining, getDaysUntilStart,

                // On-call / Profile Helpers
                isOnCallToday, getOnCallShiftTime, getOnCallCoverage, getRotationDaysLeft,
                getCurrentUnit, getCurrentWard, getCurrentActivityStatus,
                getCurrentPatientCount, getICUPatientCount, getWardPatientCount,
                getTodaysSchedule, getRecentActivities, getRotationSupervisor,

                // Live Status
                getStatusBadgeClass, calculateTimeRemaining, isStatusExpired,
                refreshStatus, showCreateStatusModal, setQuickStatus, formatAudience,
                loadClinicalStatus, loadActiveMedicalStaff, saveClinicalStatus,

                // Absence Preview
                getPreviewCardClass, getPreviewIcon, getPreviewReasonText,
                getPreviewStatusClass, getPreviewStatusText, updatePreview,

                // NEUMAC UI
                getShiftStatusClass, isCurrentShift, getStaffTypeIcon,
                calculateCapacityPercent, getCapacityDotClass, getMeterFillClass,
                getAbsenceReasonIcon, getScheduleIcon,

                // Toast / Confirmation
                showToast, removeToast, dismissAlert,
                showConfirmation, confirmAction, cancelConfirmation,

                // Auth
                handleLogin, handleLogout,

                // Navigation
                switchView, toggleStatsSidebar, handleGlobalSearch,

                // Modal Show
                showAddMedicalStaffModal, showAddDepartmentModal, showAddTrainingUnitModal,
                showAddRotationModal, showAddOnCallModal, showAddAbsenceModal,
                showCommunicationsModal, showUserProfileModal,

                // View / Edit
                viewStaffDetails, editMedicalStaff, editDepartment, editTrainingUnit,
                editRotation, editOnCallSchedule, editAbsence,
                viewUnitResidents, viewDepartmentStaff,

                // Save
                saveMedicalStaff, saveDepartment, saveTrainingUnit, saveRotation,
                saveOnCallSchedule, saveAbsence, saveCommunication, saveUserProfile,

                // Delete
                deleteMedicalStaff, deleteRotation, deleteOnCallSchedule,
                deleteAbsence, deleteAnnouncement, deleteClinicalStatus,

                // Permissions
                hasPermission,

                // Computed
                authToken, unreadAnnouncements, unreadLiveUpdates, formattedExpiry,
                availablePhysicians, availableResidents, availableAttendings,
                availableHeadsOfDepartment, availableReplacementStaff,
                filteredMedicalStaff, filteredOnCallSchedules, filteredRotations,
                filteredAbsences, recentAnnouncements,
                activeAlertsCount, currentTimeFormatted,

                // Action
                contactPhysician, viewAnnouncement
            };
        }
    });

    app.mount('#app');
});
