// ============ NEUMOCARE HOSPITAL MANAGEMENT SYSTEM v10.0 ============
// Frontend Application - Vue.js
// COMPLETE REWRITE WITH ANALYTICS INTEGRATION
// New Features:
//  - Research Analytics Dashboard
//  - Enhanced Staff Profiles with Research Portfolio
//  - Partner Collaboration Analytics
//  - CSV Export Functionality
//  - Performance Metrics with Charts
// ===================================================================

document.addEventListener('DOMContentLoaded', function () {

    try {
        if (typeof Vue === 'undefined') {
            throw new Error('Vue.js not loaded');
        }

        const { createApp, ref, reactive, computed, onMounted, watch, onUnmounted } = Vue;

        // ============ CONFIGURATION ============
        const CONFIG = {
            API_BASE_URL: window.location.hostname.includes('localhost')
                ? 'http://localhost:3000'
                : 'https://neumac-manage-back-end-production.up.railway.app',
            TOKEN_KEY: 'neumocare_token',
            USER_KEY:  'neumocare_user',
            APP_VERSION: '10.0',
            DEBUG: false,
            CACHE_TTL: 300000 // 5 minutes cache for analytics
        };

        // ============ UTILITIES ============
        class EnhancedUtils {
            static normalizeDate(dateStr) {
                if (!dateStr) return '';
                if (dateStr instanceof Date) {
                    if (isNaN(dateStr.getTime())) return '';
                    return dateStr.toISOString().split('T')[0];
                }
                const s = String(dateStr).trim();
                if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
                if (s.includes('T')) return s.split('T')[0];
                if (s.includes('/')) {
                    const parts = s.split('/');
                    if (parts.length === 3) {
                        const [d, m, y] = parts;
                        if (!isNaN(d) && !isNaN(m) && !isNaN(y) && y.length === 4)
                            return `${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`;
                    }
                }
                if (/^\d{2}-\d{2}-\d{4}$/.test(s)) {
                    const [d, m, y] = s.split('-');
                    return `${y}-${m}-${d}`;
                }
                try {
                    const dt = new Date(s);
                    if (!isNaN(dt.getTime())) return dt.toISOString().split('T')[0];
                } catch {}
                return s;
            }

            static formatRelativeDate(dateStr) {
                if (!dateStr) return '';
                try {
                    const iso = EnhancedUtils.normalizeDate(dateStr);
                    const date = new Date(iso + 'T00:00:00');
                    const today = new Date(); today.setHours(0,0,0,0);
                    const diff = Math.ceil((date - today) / 86400000);
                    if (diff === 0) return 'Today';
                    if (diff === 1) return 'Tomorrow';
                    if (diff === -1) return 'Yesterday';
                    if (diff > 1 && diff <= 7) return `In ${diff} days`;
                    if (diff > 7 && diff <= 30) return `In ${Math.ceil(diff/7)}w`;
                    if (diff < -1 && diff >= -7) return `${Math.abs(diff)}d ago`;
                    return EnhancedUtils.formatDate(dateStr);
                } catch { return EnhancedUtils.formatDate(dateStr); }
            }

            static formatDate(dateString) {
                if (!dateString) return 'N/A';
                try {
                    const iso = EnhancedUtils.normalizeDate(dateString);
                    const date = new Date(iso + 'T00:00:00');
                    if (isNaN(date.getTime())) return dateString;
                    return date.toLocaleDateString('en-GB', {
                        weekday: 'short', day: '2-digit', month: 'short', year: 'numeric'
                    });
                } catch { return dateString; }
            }

            static formatDateShort(date) {
                if (!date) return '';
                try {
                    const d = typeof date === 'string' ? new Date(EnhancedUtils.normalizeDate(date) + 'T00:00:00') : date;
                    return d.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short' });
                } catch { return ''; }
            }

            static formatDatePlusDays(dateStr, days) {
                if (!dateStr) return 'NA';
                try {
                    const iso = EnhancedUtils.normalizeDate(dateStr);
                    const d = new Date(iso + 'T00:00:00');
                    if (isNaN(d.getTime())) return 'NA';
                    d.setDate(d.getDate() + days);
                    return d.toLocaleDateString('en-GB', {
                        weekday: 'short', day: '2-digit', month: 'short', year: 'numeric'
                    });
                } catch { return 'NA'; }
            }

            static getTomorrow() {
                const d = new Date();
                d.setDate(d.getDate() + 1);
                return d;
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
                    const diff = Math.floor((new Date() - new Date(dateString)) / 60000);
                    if (diff < 1) return 'Just now';
                    if (diff < 60) return `${diff}m ago`;
                    if (diff < 1440) return `${Math.floor(diff/60)}h ago`;
                    return `${Math.floor(diff/1440)}d ago`;
                } catch { return 'Just now'; }
            }

            static calculateDateDifference(startDate, endDate) {
                try {
                    const s = new Date(EnhancedUtils.normalizeDate(startDate) + 'T00:00:00');
                    const e = new Date(EnhancedUtils.normalizeDate(endDate) + 'T23:59:59');
                    if (isNaN(s.getTime()) || isNaN(e.getTime())) return 0;
                    return Math.ceil(Math.abs(e - s) / 86400000);
                } catch { return 0; }
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

            static generateId(prefix) {
                return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 9)}`;
            }

            // Format percentage for charts
            static formatPercentage(value, total) {
                if (!total) return '0%';
                return `${Math.round((value / total) * 100)}%`;
            }

            // Color generator for charts
            static getPhaseColor(phase) {
                const colors = {
                    'Phase I': '#4d9aff',
                    'Phase II': '#00e5a0',
                    'Phase III': '#ffbe3d',
                    'Phase IV': '#ff5566'
                };
                return colors[phase] || '#7a90b0';
            }

            static getStageColor(stage) {
                const colors = {
                    'Idea': '#9ca3af',
                    'Prototipo': '#60a5fa',
                    'Piloto': '#34d399',
                    'Validación': '#fbbf24',
                    'Escalamiento': '#f97316',
                    'Comercialización': '#10b981'
                };
                return colors[stage] || '#7a90b0';
            }
        }

        // ============ API SERVICE WITH ANALYTICS ============
        class ApiService {
            constructor() {
                this.token = localStorage.getItem(CONFIG.TOKEN_KEY) || null;
                // Simple in-memory cache for analytics
                this.cache = new Map();
            }

            getHeaders() {
                const headers = { 'Content-Type': 'application/json', 'Accept': 'application/json' };
                const token = localStorage.getItem(CONFIG.TOKEN_KEY);
                if (token && token.trim()) headers['Authorization'] = `Bearer ${token}`;
                return headers;
            }

            // Cache helper
            getCached(key) {
                if (!this.cache.has(key)) return null;
                const { data, timestamp } = this.cache.get(key);
                if (Date.now() - timestamp > CONFIG.CACHE_TTL) {
                    this.cache.delete(key);
                    return null;
                }
                return data;
            }

            setCached(key, data) {
                this.cache.set(key, { data, timestamp: Date.now() });
            }

            clearCache() {
                this.cache.clear();
            }

            async request(endpoint, options = {}) {
                const url = `${CONFIG.API_BASE_URL}${endpoint}`;
                const cacheKey = `${options.method || 'GET'}:${endpoint}:${JSON.stringify(options.body || {})}`;
                
                // Return cached data for GET requests if available
                if ((!options.method || options.method === 'GET') && !options.skipCache) {
                    const cached = this.getCached(cacheKey);
                    if (cached) return cached;
                }

                try {
                    const config = {
                        method: options.method || 'GET',
                        headers: this.getHeaders(),
                        mode: 'cors',
                        cache: 'no-cache',
                        credentials: 'include'
                    };
                    if (options.body && typeof options.body === 'object')
                        config.body = JSON.stringify(options.body);

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
                    
                    const ct = response.headers.get('content-type');
                    let result;
                    if (ct && ct.includes('application/json')) {
                        result = await response.json();
                    } else {
                        result = await response.text();
                    }

                    // Cache GET responses
                    if ((!options.method || options.method === 'GET') && !options.skipCache) {
                        this.setCached(cacheKey, result);
                    }
                    
                    return result;
                } catch (error) {
                    if (error.message.includes('CORS') || error.message.includes('Failed to fetch') || error.message.includes('NetworkError'))
                        throw new Error('Cannot connect to server. Please check your network connection.');
                    throw error;
                }
            }

            // ============ AUTH ============
            async login(email, password) {
                try {
                    const data = await this.request('/api/auth/login', { method: 'POST', body: { email, password } });
                    if (data.token) {
                        this.token = data.token;
                        localStorage.setItem(CONFIG.TOKEN_KEY, data.token);
                        localStorage.setItem(CONFIG.USER_KEY, JSON.stringify(data.user));
                        this.clearCache(); // Clear cache on login
                    }
                    return data;
                } catch (error) {
                    throw new Error('Login failed: ' + error.message);
                }
            }

            async logout() {
                try { await this.request('/api/auth/logout', { method: 'POST' }); }
                finally {
                    this.token = null;
                    localStorage.removeItem(CONFIG.TOKEN_KEY);
                    localStorage.removeItem(CONFIG.USER_KEY);
                    this.clearCache();
                }
            }

            // ============ MEDICAL STAFF ============
            async getMedicalStaff() { 
                try { 
                    const data = await this.request('/api/medical-staff'); 
                    return EnhancedUtils.ensureArray(data);
                } catch { 
                    return []; 
                }
            }
            
            async createMedicalStaff(data) { 
                this.clearCache(); // Invalidate cache on write
                return await this.request('/api/medical-staff', { method: 'POST', body: data }); 
            }
            
            async updateMedicalStaff(id, data) { 
                this.clearCache();
                return await this.request(`/api/medical-staff/${id}`, { method: 'PUT', body: data }); 
            }
            
            async deleteMedicalStaff(id) { 
                this.clearCache();
                return await this.request(`/api/medical-staff/${id}`, { method: 'DELETE' }); 
            }

            // ============ DEPARTMENTS ============
            async getDepartments() { 
                try { 
                    const data = await this.request('/api/departments'); 
                    return EnhancedUtils.ensureArray(data);
                } catch { 
                    return []; 
                } 
            }
            
            async createDepartment(data) { 
                this.clearCache();
                return await this.request('/api/departments', { method: 'POST', body: data }); 
            }
            
            async updateDepartment(id, data) { 
                this.clearCache();
                return await this.request(`/api/departments/${id}`, { method: 'PUT', body: data }); 
            }

            // ============ TRAINING UNITS ============
            async getTrainingUnits() { 
                try { 
                    const data = await this.request('/api/training-units'); 
                    return EnhancedUtils.ensureArray(data);
                } catch { 
                    return []; 
                } 
            }
            
            async createTrainingUnit(data) { 
                this.clearCache();
                return await this.request('/api/training-units', { method: 'POST', body: data }); 
            }
            
            async updateTrainingUnit(id, data) { 
                this.clearCache();
                return await this.request(`/api/training-units/${id}`, { method: 'PUT', body: data }); 
            }

            // ============ ROTATIONS ============
            async getRotations() { 
                try { 
                    const data = await this.request('/api/rotations'); 
                    return EnhancedUtils.ensureArray(data);
                } catch { 
                    return []; 
                } 
            }
            
            async createRotation(data) { 
                this.clearCache();
                return await this.request('/api/rotations', { method: 'POST', body: data }); 
            }
            
            async updateRotation(id, data) { 
                this.clearCache();
                return await this.request(`/api/rotations/${id}`, { method: 'PUT', body: data }); 
            }
            
            async deleteRotation(id) { 
                this.clearCache();
                return await this.request(`/api/rotations/${id}`, { method: 'DELETE' }); 
            }

            // ============ ON-CALL ============
            async getOnCallSchedule() { 
                try { 
                    const data = await this.request('/api/oncall'); 
                    return EnhancedUtils.ensureArray(data);
                } catch { 
                    return []; 
                } 
            }
            
            async getOnCallToday() { 
                try { 
                    const data = await this.request('/api/oncall/today'); 
                    return EnhancedUtils.ensureArray(data);
                } catch { 
                    return []; 
                } 
            }
            
            async createOnCall(data) { 
                this.clearCache();
                return await this.request('/api/oncall', { method: 'POST', body: data }); 
            }
            
            async updateOnCall(id, data) { 
                this.clearCache();
                return await this.request(`/api/oncall/${id}`, { method: 'PUT', body: data }); 
            }
            
            async deleteOnCall(id) { 
                this.clearCache();
                return await this.request(`/api/oncall/${id}`, { method: 'DELETE' }); 
            }

            // ============ ABSENCES ============
            async getAbsences() {
                try {
                    const r = await this.request('/api/absence-records');
                    if (r && r.success && Array.isArray(r.data)) return r.data;
                    return EnhancedUtils.ensureArray(r);
                } catch { 
                    return []; 
                }
            }
            
            async createAbsence(data) { 
                this.clearCache();
                return await this.request('/api/absence-records', { method: 'POST', body: data }); 
            }
            
            async updateAbsence(id, data) { 
                this.clearCache();
                return await this.request(`/api/absence-records/${id}`, { method: 'PUT', body: data }); 
            }
            
            async deleteAbsence(id) { 
                this.clearCache();
                return await this.request(`/api/absence-records/${id}`, { method: 'DELETE' }); 
            }

            // ============ ANNOUNCEMENTS ============
            async getAnnouncements() { 
                try { 
                    const data = await this.request('/api/announcements'); 
                    return EnhancedUtils.ensureArray(data);
                } catch { 
                    return []; 
                } 
            }
            
            async createAnnouncement(data) { 
                this.clearCache();
                return await this.request('/api/announcements', { method: 'POST', body: data }); 
            }
            
            async updateAnnouncement(id, data) { 
                this.clearCache();
                return await this.request(`/api/announcements/${id}`, { method: 'PUT', body: data }); 
            }
            
            async deleteAnnouncement(id) { 
                this.clearCache();
                return await this.request(`/api/announcements/${id}`, { method: 'DELETE' }); 
            }

            // ============ LIVE STATUS ============
            async getClinicalStatus() { 
                try { 
                    return await this.request('/api/live-status/current'); 
                } catch { 
                    return { success: false, data: null }; 
                } 
            }
            
            async createClinicalStatus(data) { 
                this.clearCache();
                return await this.request('/api/live-status', { method: 'POST', body: data }); 
            }
            
            async updateClinicalStatus(id, data) { 
                this.clearCache();
                return await this.request(`/api/live-status/${id}`, { method: 'PUT', body: data }); 
            }
            
            async deleteClinicalStatus(id) { 
                this.clearCache();
                return await this.request(`/api/live-status/${id}`, { method: 'DELETE' }); 
            }
            
            async getClinicalStatusHistory(limit = 10) { 
                try { 
                    const data = await this.request(`/api/live-status/history?limit=${limit}`); 
                    return EnhancedUtils.ensureArray(data);
                } catch { 
                    return []; 
                } 
            }

            // ============ SYSTEM STATS ============
            async getSystemStats() {
                try { 
                    return await this.request('/api/system-stats') || {}; 
                }
                catch { 
                    return { 
                        activeAttending: 0, 
                        activeResidents: 0, 
                        onCallNow: 0, 
                        inSurgery: 0, 
                        pendingApprovals: 0 
                    }; 
                }
            }

            // ============ RESEARCH LINES ============
            async getResearchLines() {
                try { 
                    const r = await this.request('/api/research-lines'); 
                    return r?.data || EnhancedUtils.ensureArray(r); 
                }
                catch { 
                    return []; 
                }
            }
            
            async createResearchLine(data) { 
                this.clearCache();
                return await this.request('/api/research-lines', { method: 'POST', body: data }); 
            }
            
            async updateResearchLine(id, data) { 
                this.clearCache();
                return await this.request(`/api/research-lines/${id}`, { method: 'PUT', body: data }); 
            }
            
            async deleteResearchLine(id) { 
                this.clearCache();
                return await this.request(`/api/research-lines/${id}`, { method: 'DELETE' }); 
            }
            
            async assignCoordinator(lineId, coordinatorId) {
                this.clearCache();
                return await this.request(`/api/research-lines/${lineId}/coordinator`, { 
                    method: 'PUT', 
                    body: { coordinator_id: coordinatorId } 
                });
            }

            // ============ CLINICAL TRIALS ============
            async getClinicalTrialsForWebsite(filters = {}) {
                try {
                    const p = new URLSearchParams();
                    if (filters.line) p.append('line', filters.line);
                    if (filters.phase) p.append('phase', filters.phase);
                    if (filters.status) p.append('status', filters.status);
                    if (filters.search) p.append('search', filters.search);
                    const q = p.toString() ? `?${p}` : '';
                    const r = await this.request(`/api/clinical-trials/website${q}`);
                    return r?.data || [];
                } catch { 
                    return []; 
                }
            }
            
            async getAllClinicalTrials() { 
                try { 
                    const r = await this.request('/api/clinical-trials');    
                    return r?.data || EnhancedUtils.ensureArray(r); 
                } catch { 
                    return []; 
                } 
            }
            
            async createClinicalTrial(data) { 
                this.clearCache();
                return await this.request('/api/clinical-trials', { method: 'POST', body: data }); 
            }
            
            async updateClinicalTrial(id, data) { 
                this.clearCache();
                return await this.request(`/api/clinical-trials/${id}`, { method: 'PUT', body: data }); 
            }
            
            async deleteClinicalTrial(id) { 
                this.clearCache();
                return await this.request(`/api/clinical-trials/${id}`, { method: 'DELETE' }); 
            }

            // ============ INNOVATION PROJECTS ============
            async getInnovationProjectsForWebsite() { 
                try { 
                    const r = await this.request('/api/innovation-projects/website'); 
                    return r?.data || []; 
                } catch { 
                    return []; 
                } 
            }
            
            async getAllInnovationProjects() { 
                try { 
                    const r = await this.request('/api/innovation-projects');         
                    return r?.data || EnhancedUtils.ensureArray(r); 
                } catch { 
                    return []; 
                } 
            }
            
            async createInnovationProject(data) { 
                this.clearCache();
                return await this.request('/api/innovation-projects', { method: 'POST', body: data }); 
            }
            
            async updateInnovationProject(id, data) { 
                this.clearCache();
                return await this.request(`/api/innovation-projects/${id}`, { method: 'PUT', body: data }); 
            }
            
            async deleteInnovationProject(id) { 
                this.clearCache();
                return await this.request(`/api/innovation-projects/${id}`, { method: 'DELETE' }); 
            }

            // ============ ANALYTICS ENDPOINTS (NEW) ============
            
            /**
             * Get comprehensive research dashboard statistics
             * Returns summary, research lines, trials by phase/status, projects by stage/category
             */
            async getResearchDashboard() {
                try {
                    const response = await this.request('/api/analytics/research-dashboard');
                    return response?.data || response || {
                        summary: {
                            totalResearchLines: 0,
                            activeResearchLines: 0,
                            totalTrials: 0,
                            activeTrials: 0,
                            totalProjects: 0,
                            activeProjects: 0
                        },
                        researchLines: [],
                        clinicalTrials: { byPhase: {}, byStatus: {}, byResearchLine: {} },
                        innovationProjects: { byStage: {}, byCategory: {}, byResearchLine: {}, partnerNeeds: [] }
                    };
                } catch (error) {
                    console.error('Failed to load research dashboard:', error);
                    return null;
                }
            }

            /**
             * Get detailed performance metrics per research line
             * Returns array with trials/projects stats per line
             */
            async getResearchLinesPerformance() {
                try {
                    const response = await this.request('/api/analytics/research-lines-performance');
                    return response?.data || [];
                } catch (error) {
                    console.error('Failed to load research lines performance:', error);
                    return [];
                }
            }

            /**
             * Get partner collaboration statistics
             * Returns partner needs, collaborations by type, etc.
             */
            async getPartnerCollaborations() {
                try {
                    const response = await this.request('/api/analytics/partner-collaborations');
                    return response?.data || {
                        totalProjectsWithPartners: 0,
                        totalPartnerNeeds: 0,
                        uniquePartnerNeeds: 0,
                        partnerNeeds: [],
                        needsByType: [],
                        needsByCategory: {},
                        needsByResearchLine: {}
                    };
                } catch (error) {
                    console.error('Failed to load partner collaborations:', error);
                    return null;
                }
            }

            /**
             * Get clinical trials timeline data for charts
             * @param {number} years - Number of years to look back
             */
            async getClinicalTrialsTimeline(years = 3) {
                try {
                    const response = await this.request(`/api/analytics/clinical-trials-timeline?years=${years}`);
                    return response?.data || {
                        timeline: [],
                        statusOverTime: {},
                        totalInPeriod: 0
                    };
                } catch (error) {
                    console.error('Failed to load trials timeline:', error);
                    return null;
                }
            }

            /**
             * Get quick summary stats for dashboard widgets
             */
            async getAnalyticsSummary() {
                try {
                    const response = await this.request('/api/analytics/summary');
                    return response?.data || {
                        researchLines: 0,
                        clinicalTrials: { total: 0, active: 0, recent: 0 },
                        innovationProjects: { total: 0, active: 0, recent: 0 }
                    };
                } catch (error) {
                    console.error('Failed to load analytics summary:', error);
                    return null;
                }
            }

            /**
             * Export data as CSV
             * @param {string} type - Export type (research-lines, clinical-trials, innovation-projects, research-performance)
             * @param {string} format - Export format (csv only for now)
             */
            async exportData(type, format = 'csv') {
                try {
                    const response = await this.request(`/api/analytics/export/${type}?format=${format}`, {
                        skipCache: true // Don't cache exports
                    });
                    return response;
                } catch (error) {
                    console.error('Export failed:', error);
                    throw error;
                }
            }

            /**
             * Get research activity for a specific staff member
             * @param {string} staffId - Staff member ID
             */
            async getStaffResearchProfile(staffId) {
                try {
                    // Combine data from multiple endpoints
                    const [performance, dashboard] = await Promise.all([
                        this.getResearchLinesPerformance(),
                        this.getResearchDashboard()
                    ]);

                    // Filter for this staff member
                    const linesCoordinated = (performance || []).filter(line => line.coordinator === staffId);
                    
                    // Get trials where staff is PI or Co-I
                    const allTrials = await this.getAllClinicalTrials();
                    const trialsAsPI = (allTrials || []).filter(t => t.principal_investigator_id === staffId);
                    const trialsAsCoI = (allTrials || []).filter(t => 
                        t.co_investigators && Array.isArray(t.co_investigators) && 
                        t.co_investigators.includes(staffId)
                    );

                    // Get projects where staff is lead
                    const allProjects = await this.getAllInnovationProjects();
                    const projectsAsLead = (allProjects || []).filter(p => p.lead_investigator_id === staffId);

                    // Calculate metrics
                    const activeTrials = trialsAsPI.filter(t => t.status === 'Activo' || t.status === 'Reclutando').length;
                    const completedTrials = trialsAsPI.filter(t => t.status === 'Completado').length;
                    
                    const projectsByStage = {};
                    projectsAsLead.forEach(p => {
                        projectsByStage[p.current_stage] = (projectsByStage[p.current_stage] || 0) + 1;
                    });

                    return {
                        researchLines: linesCoordinated.map(l => ({
                            id: l.id,
                            name: l.name,
                            line_number: l.line_number,
                            trialsCount: l.stats?.totalTrials || 0,
                            projectsCount: l.stats?.totalProjects || 0
                        })),
                        trials: {
                            asPI: trialsAsPI.length,
                            asCoI: trialsAsCoI.length,
                            active: activeTrials,
                            completed: completedTrials,
                            byPhase: this.groupTrialsByPhase(trialsAsPI),
                            byStatus: this.groupTrialsByStatus(trialsAsPI),
                            list: trialsAsPI.slice(0, 5) // Recent 5
                        },
                        projects: {
                            asLead: projectsAsLead.length,
                            byStage: projectsByStage,
                            list: projectsAsLead.slice(0, 5) // Recent 5
                        },
                        partnerNeeds: this.extractPartnerNeedsForStaff(staffId, allProjects)
                    };
                } catch (error) {
                    console.error('Failed to load staff research profile:', error);
                    return null;
                }
            }

            // Helper methods for staff profile
            groupTrialsByPhase(trials) {
                const phases = { 'Phase I': 0, 'Phase II': 0, 'Phase III': 0, 'Phase IV': 0 };
                trials.forEach(t => {
                    if (phases.hasOwnProperty(t.phase)) phases[t.phase]++;
                });
                return phases;
            }

            groupTrialsByStatus(trials) {
                const statuses = { 'Reclutando': 0, 'Activo': 0, 'Completado': 0, 'En preparación': 0 };
                trials.forEach(t => {
                    if (statuses.hasOwnProperty(t.status)) statuses[t.status]++;
                });
                return statuses;
            }

            extractPartnerNeedsForStaff(staffId, projects) {
                const needs = {};
                const staffProjects = (projects || []).filter(p => p.lead_investigator_id === staffId);
                staffProjects.forEach(p => {
                    if (p.partner_needs && Array.isArray(p.partner_needs)) {
                        p.partner_needs.forEach(need => {
                            needs[need] = (needs[need] || 0) + 1;
                        });
                    }
                });
                return Object.entries(needs).map(([name, count]) => ({ name, count }));
            }
        }

        const API = new ApiService();

        // ============ VUE APP ============
        const app = createApp({
            setup() {

                // ============ ANIMATION ============
                const animateCountUp = (targetRef, endValue, duration = 600) => {
                    if (!endValue || endValue === 0) return;
                    const startTime = performance.now();
                    const step = (currentTime) => {
                        const p = Math.min((currentTime - startTime) / duration, 1);
                        const e = 1 - Math.pow(1 - p, 3);
                        targetRef.value = Math.round(endValue * e);
                        if (p < 1) requestAnimationFrame(step);
                        else targetRef.value = endValue;
                    };
                    requestAnimationFrame(step);
                };

                // ============ STATE ============
                const currentUser = ref(null);
                const loginForm = reactive({ email: '', password: '', remember_me: false });
                const loginLoading = ref(false);

                const currentView = ref('login');
                const sidebarCollapsed = ref(false);
                const mobileMenuOpen = ref(false);
                const userMenuOpen = ref(false);
                const statsSidebarOpen = ref(false);
                const globalSearchQuery = ref('');

                // Loading states
                const loading = ref(false);
                const saving = ref(false);
                const loadingSchedule = ref(false);
                const isLoadingStatus = ref(false);
                const loadingAnalytics = ref(false);

                // Core Data
                const medicalStaff = ref([]);
                const departments = ref([]);
                const trainingUnits = ref([]);
                const rotations = ref([]);
                const absences = ref([]);
                const onCallSchedule = ref([]);
                const announcements = ref([]);

                // Research Data
                const researchLines = ref([]);
                const clinicalTrials = ref([]);
                const innovationProjects = ref([]);

                // Analytics Data (NEW)
                const researchDashboard = ref(null);
                const researchLinesPerformance = ref([]);
                const partnerCollaborations = ref(null);
                const trialsTimeline = ref(null);
                const analyticsSummary = ref(null);
                const staffResearchProfile = ref(null);

                // Live status
                const clinicalStatus = ref(null);
                const clinicalStatusHistory = ref([]);
                const newStatusText = ref('');
                const selectedAuthorId = ref('');
                const expiryHours = ref(8);
                const activeMedicalStaff = ref([]);
                const liveStatsEditMode = ref(false);

                const quickStatus = ref('');
                const currentTime = ref(new Date());
                const systemStats = ref({
                    totalStaff: 0, activeAttending: 0, activeResidents: 0,
                    onCallNow: 0, inSurgery: 0, activeRotations: 0,
                    endingThisWeek: 0, startingNextWeek: 0, onLeaveStaff: 0,
                    departmentStatus: 'normal', activePatients: 0,
                    icuOccupancy: 0, wardOccupancy: 0, pendingApprovals: 0,
                    nextShiftChange: new Date(Date.now() + 6 * 3600000).toISOString()
                });

                const todaysOnCall = ref([]);
                const todaysOnCallCount = computed(() => todaysOnCall.value.length);
                const toasts = ref([]);
                const systemAlerts = ref([]);

                // ============ SORT STATE ============
                const sortState = reactive({
                    medical_staff: { field: 'full_name', dir: 'asc' },
                    rotations: { field: 'start_date', dir: 'desc' },
                    oncall: { field: 'duty_date', dir: 'asc' },
                    absences: { field: 'start_date', dir: 'desc' },
                    trials: { field: 'protocol_id', dir: 'asc' },
                    research_lines: { field: 'line_number', dir: 'asc' }
                });

                const sortBy = (view, field) => {
                    const s = sortState[view];
                    if (!s) return;
                    s.dir = (s.field === field && s.dir === 'asc') ? 'desc' : 'asc';
                    s.field = field;
                };

                const sortIcon = (view, field) => {
                    const s = sortState[view];
                    if (!s || s.field !== field) return 'fa-sort';
                    return s.dir === 'asc' ? 'fa-sort-up' : 'fa-sort-down';
                };

                const applySortToArray = (arr, view) => {
                    const s = sortState[view];
                    if (!s || !s.field) return arr;
                    return [...arr].sort((a, b) => {
                        let va = a[s.field] ?? '';
                        let vb = b[s.field] ?? '';
                        if (typeof va === 'string' && /\d{4}-\d{2}-\d{2}/.test(va)) {
                            va = EnhancedUtils.normalizeDate(va);
                            vb = EnhancedUtils.normalizeDate(vb);
                        }
                        const cmp = String(va).localeCompare(String(vb), undefined, { numeric: true });
                        return s.dir === 'asc' ? cmp : -cmp;
                    });
                };

                // ============ PAGINATION STATE ============
                const pagination = reactive({
                    medical_staff: { page: 1, size: 15 },
                    rotations: { page: 1, size: 15 },
                    oncall: { page: 1, size: 15 },
                    absences: { page: 1, size: 15 },
                    trials: { page: 1, size: 15 }
                });

                const resetPage = (view) => { if (pagination[view]) pagination[view].page = 1; };

                const paginateArray = (arr, view) => {
                    if (!pagination[view]) return arr;
                    const { page, size } = pagination[view];
                    return arr.slice((page - 1) * size, page * size);
                };

                const totalPages = (arr, view) => {
                    if (!pagination[view]) return 1;
                    return Math.max(1, Math.ceil(arr.length / pagination[view].size));
                };

                const goToPage = (view, page) => {
                    if (!pagination[view]) return;
                    const tp = totalPages(allFiltered(view), view);
                    pagination[view].page = Math.max(1, Math.min(page, tp));
                };

                const allFiltered = (view) => {
                    const map = {
                        medical_staff: () => filteredMedicalStaffAll.value,
                        rotations: () => filteredRotationsAll.value,
                        oncall: () => filteredOnCallAll.value,
                        absences: () => filteredAbsencesAll.value,
                        trials: () => filteredTrialsAll.value
                    };
                    return map[view] ? map[view]() : [];
                };
                const formatResidentCategorySimple = (category) => {
    const map = {
        'department_internal': 'Internal',
        'rotating_other_dept': 'Rotating',
        'external_resident': 'External'
    };
    return map[category] || category;
};

// Format detailed description with institution/home dept
const formatResidentCategoryDetailed = (staff) => {
    if (!staff.resident_category) return 'Not specified';
    
    switch(staff.resident_category) {
        case 'department_internal':
            return 'Internal Resident';
        case 'rotating_other_dept':
            return staff.home_department 
                ? `Rotating from ${staff.home_department}` 
                : 'Rotating Resident';
        case 'external_resident':
            return staff.external_institution 
                ? `External (${staff.external_institution})` 
                : 'External Resident';
        default:
            return staff.resident_category;
    }
};

// Get icon for resident category
const getResidentCategoryIcon = (category) => {
    const map = {
        'department_internal': 'fa-user-md',
        'rotating_other_dept': 'fa-sync-alt',
        'external_resident': 'fa-globe'
    };
    return map[category] || 'fa-user';
};

// Get tooltip text for resident badge
const getResidentCategoryTooltip = (staff) => {
    if (!staff.resident_category) return '';
    
    switch(staff.resident_category) {
        case 'department_internal':
            return 'Department internal resident';
        case 'rotating_other_dept':
            return staff.home_department 
                ? `Rotating from ${staff.home_department}` 
                : 'Resident from another department';
        case 'external_resident':
            return staff.external_institution 
                ? `External resident from ${staff.external_institution}` 
                : 'External resident from another institution';
        default:
            return '';
    }
};

                // ============ INLINE VALIDATION ============
                const fieldErrors = reactive({
                    rotation: {},
                    staff: {},
                    absence: {},
                    oncall: {},
                    research: {}
                });

                const setFieldError = (form, field, msg) => {
                    if (fieldErrors[form]) fieldErrors[form][field] = msg;
                };

                const clearFieldError = (form, field) => {
                    if (fieldErrors[form] && fieldErrors[form][field]) delete fieldErrors[form][field];
                };

                const clearAllErrors = (form) => {
                    if (fieldErrors[form]) Object.keys(fieldErrors[form]).forEach(k => delete fieldErrors[form][k]);
                };

                // Validation functions
                const validateRotationForm = (form) => {
                    clearAllErrors('rotation');
                    let valid = true;
                    if (!form.resident_id) {
                        setFieldError('rotation', 'resident_id', 'Please select a resident');
                        valid = false;
                    }
                    if (!form.training_unit_id) {
                        setFieldError('rotation', 'training_unit_id', 'Please select a training unit');
                        valid = false;
                    }
                    if (!form.start_date) {
                        setFieldError('rotation', 'start_date', 'Start date is required');
                        valid = false;
                    }
                    if (!form.end_date) {
                        setFieldError('rotation', 'end_date', 'End date is required');
                        valid = false;
                    }
                    if (form.start_date && form.end_date) {
                        const s = new Date(EnhancedUtils.normalizeDate(form.start_date) + 'T00:00:00');
                        const e = new Date(EnhancedUtils.normalizeDate(form.end_date) + 'T00:00:00');
                        if (!isNaN(s.getTime()) && !isNaN(e.getTime()) && e <= s) {
                            setFieldError('rotation', 'end_date', 'End date must be after start date');
                            valid = false;
                        }
                    }
                    return valid;
                };

                const validateStaffForm = (form) => {
                    clearAllErrors('staff');
                    let valid = true;
                    if (!form.full_name?.trim()) {
                        setFieldError('staff', 'full_name', 'Full name is required');
                        valid = false;
                    }
                    if (form.professional_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.professional_email)) {
                        setFieldError('staff', 'professional_email', 'Please enter a valid email address');
                        valid = false;
                    }
                    return valid;
                };

                const validateAbsenceForm = (form) => {
                    clearAllErrors('absence');
                    let valid = true;
                    if (!form.staff_member_id) {
                        setFieldError('absence', 'staff_member_id', 'Please select a staff member');
                        valid = false;
                    }
                    if (!form.start_date) {
                        setFieldError('absence', 'start_date', 'Start date is required');
                        valid = false;
                    }
                    if (!form.end_date) {
                        setFieldError('absence', 'end_date', 'End date is required');
                        valid = false;
                    }
                    if (form.start_date && form.end_date) {
                        const s = new Date(EnhancedUtils.normalizeDate(form.start_date) + 'T00:00:00');
                        const e = new Date(EnhancedUtils.normalizeDate(form.end_date) + 'T00:00:00');
                        if (!isNaN(s.getTime()) && !isNaN(e.getTime()) && e < s) {
                            setFieldError('absence', 'end_date', 'End date cannot be before start date');
                            valid = false;
                        }
                    }
                    return valid;
                };

                const validateOnCallForm = (form) => {
                    clearAllErrors('oncall');
                    let valid = true;
                    if (!form.duty_date) {
                        setFieldError('oncall', 'duty_date', 'Date is required');
                        valid = false;
                    }
                    if (!form.primary_physician_id) {
                        setFieldError('oncall', 'primary_physician_id', 'Please select a physician');
                        valid = false;
                    }
                    if (!form.start_time) {
                        setFieldError('oncall', 'start_time', 'Start time is required');
                        valid = false;
                    }
                    if (!form.end_time) {
                        setFieldError('oncall', 'end_time', 'End time is required');
                        valid = false;
                    }
                    return valid;
                };

                const validateResearchLineForm = (form) => {
                    clearAllErrors('research');
                    let valid = true;
                    if (!form.name?.trim()) {
                        setFieldError('research', 'name', 'Research line name is required');
                        valid = false;
                    }
                    return valid;
                };

                // ============ FILTERS ============
                const staffFilters = reactive({ search: '', staffType: '', department: '', status: '', residentCategory: '' });
                const onCallFilters = reactive({ date: '', shiftType: '', physician: '', coverageArea: '', search: '' });
                const rotationFilters = reactive({ resident: '', status: '', trainingUnit: '', supervisor: '', search: '' });
                const absenceFilters = reactive({ staff: '', status: '', reason: '', startDate: '', search: '' });
                const trainingUnitFilters = reactive({ search: '', department: '', status: '' });
                const departmentFilters = reactive({ search: '', status: '' });
                const communicationsFilters = reactive({ search: '', priority: '', audience: '' });
                const trialFilters = reactive({ line: '', phase: '', status: '', search: '' });
                const projectFilters = reactive({ research_line_id: '', category: '', search: '' });
                const researchLineFilters = reactive({ search: '', active: '' });

                // ============ MODALS ============
                const staffProfileModal = reactive({ 
                    show: false, 
                    staff: null, 
                    activeTab: 'assignments',
                    researchProfile: null,
                    loadingResearch: false
                });
                
                const unitResidentsModal = reactive({ show: false, unit: null, rotations: [] });

                const researchLineModal = reactive({
                    show: false, mode: 'add',
                    form: { line_number: null, name: '', description: '', capabilities: 'Alcance y capacidades', sort_order: 0, active: true }
                });
                
                const clinicalTrialModal = reactive({
                    show: false, mode: 'add',
                    form: { 
                        protocol_id: '', title: '', research_line_id: '', phase: 'Phase III', status: 'Reclutando',
                        description: '', inclusion_criteria: '', exclusion_criteria: '',
                        principal_investigator_id: '', contact_email: '', featured_in_website: true, display_order: 0 
                    }
                });
                
                const innovationProjectModal = reactive({
                    show: false, mode: 'add',
                    form: { 
                        title: '', category: 'Dispositivo', development_stage: 'En Desarrollo', description: '',
                        research_line_id: '', lead_investigator_id: '', partner_needs: [],
                        featured_in_website: true, display_order: 0 
                    }
                });

                const medicalStaffModal = reactive({
                    show: false, mode: 'add', activeTab: 'basic',
                    form: {
                        full_name: '', staff_type: 'medical_resident', staff_id: '', employment_status: 'active',
                        professional_email: '', department_id: '', academic_degree: '', specialization: '',
                        training_year: '', clinical_certificate: '', certificate_status: ''
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
                        duty_date: EnhancedUtils.normalizeDate(new Date()),
                        shift_type: 'primary_call', start_time: '08:00', end_time: '17:00',
                        primary_physician_id: '', backup_physician_id: '',
                        coverage_area: 'emergency', coverage_notes: ''
                    }
                });

                const rotationModal = reactive({
                    show: false, mode: 'add',
                    form: {
                        rotation_id: '', resident_id: '', training_unit_id: '',
                        start_date: EnhancedUtils.normalizeDate(new Date()),
                        end_date: EnhancedUtils.normalizeDate(new Date(Date.now() + 30 * 86400000)),
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
                    show: false, mode: 'add',
                    form: {
                        staff_member_id: '', absence_type: 'planned', absence_reason: 'vacation',
                        start_date: EnhancedUtils.normalizeDate(new Date()),
                        end_date: EnhancedUtils.normalizeDate(new Date(Date.now() + 7 * 86400000)),
                        covering_staff_id: '', coverage_notes: '', coverage_arranged: false, hod_notes: ''
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

                const assignCoordinatorModal = reactive({
                    show: false, lineId: null, lineName: '', selectedCoordinatorId: ''
                });

                // Analytics Modals (NEW)
                const exportModal = reactive({
                    show: false,
                    type: 'clinical-trials',
                    format: 'csv',
                    loading: false
                });

                // ============ PERMISSIONS ============
                const PERMISSION_MATRIX = {
                    system_admin: {
                        medical_staff: ['create', 'read', 'update', 'delete'],
                        oncall_schedule: ['create', 'read', 'update', 'delete'],
                        resident_rotations: ['create', 'read', 'update', 'delete'],
                        training_units: ['create', 'read', 'update', 'delete'],
                        staff_absence: ['create', 'read', 'update', 'delete'],
                        department_management: ['create', 'read', 'update', 'delete'],
                        communications: ['create', 'read', 'update', 'delete'],
                        research_lines: ['create', 'read', 'update', 'delete'],
                        clinical_trials: ['create', 'read', 'update', 'delete'],
                        innovation_projects: ['create', 'read', 'update', 'delete'],
                        analytics: ['read', 'export'],
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
                        research_lines: ['read', 'update'],
                        clinical_trials: ['read', 'create', 'update'],
                        innovation_projects: ['read', 'create', 'update'],
                        analytics: ['read'],
                        system: ['manage_updates']
                    },
                    attending_physician: {
                        medical_staff: ['read'],
                        oncall_schedule: ['read'],
                        resident_rotations: ['read'],
                        training_units: ['read'],
                        staff_absence: ['read'],
                        department_management: ['read'],
                        communications: ['read'],
                        research_lines: ['read'],
                        clinical_trials: ['read'],
                        innovation_projects: ['read'],
                        analytics: ['read']
                    },
                    medical_resident: {
                        medical_staff: ['read'],
                        oncall_schedule: ['read'],
                        resident_rotations: ['read'],
                        training_units: ['read'],
                        staff_absence: ['read'],
                        department_management: [],
                        communications: ['read'],
                        research_lines: ['read'],
                        clinical_trials: ['read'],
                        innovation_projects: ['read'],
                        analytics: []
                    }
                };

                const hasPermission = (module, action = 'read') => {
                    const role = currentUser.value?.user_role;
                    if (!role) return false;
                    if (role === 'system_admin') return true;
                    const perms = PERMISSION_MATRIX[role]?.[module];
                    if (!perms) return false;
                    return perms.includes(action) || perms.includes('*');
                };

                // ============ TOAST SYSTEM ============
                const showToast = (title, message, type = 'info', duration = 5000) => {
                    const icons = { 
                        info: 'fas fa-info-circle', 
                        success: 'fas fa-check-circle',
                        error: 'fas fa-exclamation-circle', 
                        warning: 'fas fa-exclamation-triangle' 
                    };
                    const toast = { id: Date.now(), title, message, type, icon: icons[type], duration };
                    toasts.value.push(toast);
                    if (duration > 0) setTimeout(() => removeToast(toast.id), duration);
                };
                
                const removeToast = (id) => {
                    const i = toasts.value.findIndex(t => t.id === id);
                    if (i > -1) toasts.value.splice(i, 1);
                };

                // ============ CONFIRMATION ============
                const showConfirmation = (options) => Object.assign(confirmationModal, { show: true, ...options });
                
                const confirmAction = async () => {
                    if (confirmationModal.onConfirm) {
                        try { await confirmationModal.onConfirm(); }
                        catch (error) { showToast('Error', error.message, 'error'); }
                    }
                    confirmationModal.show = false;
                };
                
                const cancelConfirmation = () => { confirmationModal.show = false; };

                // ============ DATE/TIME HELPERS (exposed to template) ============
                const normalizeDate = (d) => EnhancedUtils.normalizeDate(d);
                const formatDate = (d) => EnhancedUtils.formatDate(d);
                const formatDateShort = (d) => EnhancedUtils.formatDateShort(d);
                const formatDatePlusDays = (d, n) => EnhancedUtils.formatDatePlusDays(d, n);
                const formatRelativeDate = (d) => EnhancedUtils.formatRelativeDate(d);
                const getTomorrow = () => EnhancedUtils.getTomorrow();
                const formatTime = (d) => EnhancedUtils.formatTime(d);
                const formatRelativeTime = (d) => EnhancedUtils.formatRelativeTime(d);
                const formatTimeAgo = (d) => EnhancedUtils.formatRelativeTime(d);
                const getInitials = (n) => EnhancedUtils.getInitials(n);

                // ============ FORMATTING ============
                const formatStaffType = (type) => ({
                    medical_resident: 'Medical Resident',
                    attending_physician: 'Attending Physician',
                    fellow: 'Fellow',
                    nurse_practitioner: 'Nurse Practitioner'
                }[type] || type);

                const getStaffTypeClass = (type) => ({
                    medical_resident: 'badge-primary',
                    attending_physician: 'badge-success',
                    fellow: 'badge-info',
                    nurse_practitioner: 'badge-warning'
                }[type] || 'badge-secondary');

                const formatEmploymentStatus = (s) => ({
                    active: 'Active',
                    on_leave: 'On Leave',
                    inactive: 'Inactive'
                }[s] || s);

                const formatAbsenceReason = (r) => ({
                    vacation: 'Vacation',
                    sick_leave: 'Sick Leave',
                    conference: 'Conference',
                    training: 'Training',
                    personal: 'Personal',
                    other: 'Other'
                }[r] || r);

                const formatRotationStatus = (s) => ({
                    scheduled: 'Scheduled',
                    active: 'Active',
                    completed: 'Completed',
                    cancelled: 'Cancelled'
                }[s] || s);

                const getUserRoleDisplay = (role) => ({
                    system_admin: 'System Administrator',
                    department_head: 'Department Head',
                    attending_physician: 'Attending Physician',
                    medical_resident: 'Medical Resident'
                }[role] || role);

                const getCurrentViewTitle = () => ({
                    dashboard: 'Dashboard Overview',
                    medical_staff: 'Medical Staff Management',
                    oncall_schedule: 'On-call Schedule',
                    resident_rotations: 'Resident Rotations',
                    training_units: 'Training Units',
                    staff_absence: 'Staff Absence Management',
                    department_management: 'Department Management',
                    communications: 'Communications Center',
                    research_lines: 'Research Lines',
                    clinical_trials: 'Clinical Trials',
                    innovation_projects: 'Innovation Projects',
                    analytics_dashboard: 'Research Analytics Dashboard',
                    analytics_performance: 'Research Lines Performance',
                    analytics_partners: 'Partner Collaborations'
                }[currentView.value] || 'NeumoCare Dashboard');

                const getCurrentViewSubtitle = () => ({
                    dashboard: 'Real-time department overview and analytics',
                    medical_staff: 'Manage physicians, residents, and clinical staff',
                    oncall_schedule: 'View and manage on-call physician schedules',
                    resident_rotations: 'Track and manage resident training rotations',
                    training_units: 'Clinical training units and resident assignments',
                    staff_absence: 'Track staff absences and coverage assignments',
                    department_management: 'Organizational structure and clinical units',
                    communications: 'Department announcements and capacity updates',
                    research_lines: 'Research groups and coordinator assignments',
                    clinical_trials: 'Active clinical trials and studies',
                    innovation_projects: 'Innovation and development projects',
                    analytics_dashboard: 'Comprehensive research metrics and KPIs',
                    analytics_performance: 'Detailed performance by research line',
                    analytics_partners: 'Partner collaboration insights'
                }[currentView.value] || 'Hospital Management System');

                const getSearchPlaceholder = () => ({
                    dashboard: 'Search staff, units, rotations...',
                    medical_staff: 'Search by name, ID, or email...',
                    oncall_schedule: 'Search on-call schedules...',
                    resident_rotations: 'Search by resident name or unit...',
                    training_units: 'Search training units...',
                    staff_absence: 'Search by staff name...',
                    department_management: 'Search departments...',
                    communications: 'Search announcements...',
                    research_lines: 'Search research lines...',
                    clinical_trials: 'Search by protocol or title...',
                    innovation_projects: 'Search innovation projects...',
                    analytics_dashboard: 'Filter analytics...'
                }[currentView.value] || 'Search across system...');

                // ============ DATA HELPERS ============
                const getDepartmentName = (id) => departments.value.find(d => d.id === id)?.name || 'Not assigned';
                const getStaffName = (id) => medicalStaff.value.find(s => s.id === id)?.full_name || 'Not assigned';
                const getTrainingUnitName = (id) => trainingUnits.value.find(u => u.id === id)?.unit_name || 'Not assigned';
                const getSupervisorName = (id) => getStaffName(id);
                const getPhysicianName = (id) => getStaffName(id);
                const getResidentName = (id) => getStaffName(id);
                const getDepartmentUnits = (id) => trainingUnits.value.filter(u => u.department_id === id);
                const getDepartmentStaffCount = (id) => medicalStaff.value.filter(s => s.department_id === id).length;
                const getCurrentRotationForStaff = (id) => rotations.value.find(r => r.resident_id === id && r.rotation_status === 'active') || null;
                const calculateAbsenceDuration = (s, e) => EnhancedUtils.calculateDateDifference(s, e);
                
                const getResearchLineName = (id) => {
                    if (!id) return 'Not assigned';
                    const l = researchLines.value.find(l => l.id === id);
                    return l ? (l.research_line_name || l.name) : 'Unknown';
                };
                
                const getClinicianResearchLines = (id) => {
                    if (!id || !researchLines.value.length) return [];
                    return researchLines.value
                        .filter(l => l.coordinator_id === id)
                        .map(l => ({
                            line_number: l.line_number,
                            name: l.research_line_name || l.name,
                            role: 'Coordinador/a',
                            id: l.id
                        }));
                };

                const getUnitActiveRotationCount = (id) =>
                    rotations.value.filter(r => r.training_unit_id === id && ['active', 'scheduled'].includes(r.rotation_status)).length;

                const getDaysRemaining = (endDate) => {
                    if (!endDate) return 0;
                    const end = new Date(EnhancedUtils.normalizeDate(endDate) + 'T00:00:00');
                    const today = new Date(); today.setHours(0, 0, 0, 0);
                    return Math.max(0, Math.ceil((end - today) / 86400000));
                };

                const getDaysUntilStart = (startDate) => {
                    if (!startDate) return 0;
                    const start = new Date(EnhancedUtils.normalizeDate(startDate) + 'T00:00:00');
                    const today = new Date(); today.setHours(0, 0, 0, 0);
                    return Math.max(0, Math.ceil((start - today) / 86400000));
                };

                // ============ PROFILE HELPERS ============
                const isOnCallToday = (staffId) => {
                    const today = EnhancedUtils.normalizeDate(new Date());
                    return onCallSchedule.value.some(s =>
                        (s.primary_physician_id === staffId || s.backup_physician_id === staffId) &&
                        EnhancedUtils.normalizeDate(s.duty_date) === today);
                };

                const getUpcomingOnCall = (staffId) => {
                    if (!staffId) return [];
                    const today = EnhancedUtils.normalizeDate(new Date());
                    return onCallSchedule.value
                        .filter(s =>
                            (s.primary_physician_id === staffId || s.backup_physician_id === staffId) &&
                            EnhancedUtils.normalizeDate(s.duty_date) >= today)
                        .sort((a, b) => EnhancedUtils.normalizeDate(a.duty_date).localeCompare(EnhancedUtils.normalizeDate(b.duty_date)));
                };

                const getUpcomingLeave = (staffId) => {
                    if (!staffId) return [];
                    const today = EnhancedUtils.normalizeDate(new Date());
                    return absences.value
                        .filter(a => a.staff_member_id === staffId &&
                            EnhancedUtils.normalizeDate(a.start_date) >= today &&
                            a.current_status !== 'cancelled')
                        .sort((a, b) => EnhancedUtils.normalizeDate(a.start_date).localeCompare(EnhancedUtils.normalizeDate(b.start_date)));
                };

                const getRotationHistory = (staffId) => {
                    if (!staffId) return [];
                    return rotations.value
                        .filter(r => r.resident_id === staffId && !['active', 'scheduled'].includes(r.rotation_status))
                        .sort((a, b) => {
                            const ea = EnhancedUtils.normalizeDate(a.end_date || a.rotation_end_date);
                            const eb = EnhancedUtils.normalizeDate(b.end_date || b.rotation_end_date);
                            return eb.localeCompare(ea);
                        });
                };

                const getRotationDaysLeft = (staffId) => {
                    const r = getCurrentRotationForStaff(staffId);
                    return r ? getDaysRemaining(r.end_date || r.rotation_end_date) : 0;
                };

                const hasProfessionalCredentials = (staff) =>
                    !!(staff?.academic_degree || staff?.specialization || staff?.training_year ||
                       staff?.clinical_certificate || staff?.medical_license);

                // ============ STATUS HELPERS ============
                const getStatusLocation = (status) => {
                    if (!status?.status_text) return 'Pulmonology Department';
                    if (status.location) return status.location;
                    const t = status.status_text.toLowerCase();
                    if (t.includes('icu') || t.includes('intensive care')) return 'Respiratory ICU';
                    if (t.includes('sleep') || t.includes('cpap')) return 'Sleep Medicine Lab';
                    if (t.includes('bronchoscopy') || t.includes('pft')) return 'Pulmonary Procedure Unit';
                    if (t.includes('ventilator')) return 'Respiratory Therapy Unit';
                    if (t.includes('er') || t.includes('emergency')) return 'Emergency Department';
                    if (t.includes('ward') || t.includes('floor')) return 'General Ward';
                    return 'Pulmonology Department';
                };

                const recentStatuses = computed(() => clinicalStatusHistory.value);
                const isStatusExpired = (exp) => { if (!exp) return true; try { return new Date() > new Date(exp); } catch { return true; } };
                const getStatusBadgeClass = (status) => (!status || isStatusExpired(status.expires_at)) ? 'badge-warning' : 'badge-success';

                const calculateTimeRemaining = (expiryTime) => {
                    if (!expiryTime) return 'N/A';
                    try {
                        const diff = new Date(expiryTime) - new Date();
                        if (diff <= 0) return 'Expired';
                        const h = Math.floor(diff / 3600000);
                        const m = Math.floor((diff % 3600000) / 60000);
                        return h > 0 ? `${h}h ${m}m` : `${m}m`;
                    } catch { return 'N/A'; }
                };

                const refreshStatus = () => { 
                    loadClinicalStatus(); 
                    loadSystemStats(); 
                    showToast('Refreshed', 'Live status updated', 'info'); 
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
                };

                const formatAudience = (a) => ({
                    all_staff: 'All Staff',
                    medical_staff: 'Medical Staff',
                    residents: 'Residents',
                    attendings: 'Attending Physicians'
                }[a] || a);

                const showCreateStatusModal = () => {
                    liveStatsEditMode.value = true;
                    newStatusText.value = '';
                    selectedAuthorId.value = '';
                    expiryHours.value = 8;
                };

                // ============ ANALYTICS LOADERS (NEW) ============
                const loadResearchDashboard = async (forceRefresh = false) => {
                    if (!hasPermission('analytics', 'read')) return;
                    
                    loadingAnalytics.value = true;
                    try {
                        const data = await API.getResearchDashboard();
                        if (data) {
                            researchDashboard.value = data;
                            
                            // Update summary stats for dashboard cards
                            if (data.summary) {
                                systemStats.value.totalResearchLines = data.summary.totalResearchLines || 0;
                                systemStats.value.totalTrials = data.summary.totalTrials || 0;
                                systemStats.value.totalProjects = data.summary.totalProjects || 0;
                            }
                        }
                    } catch (error) {
                        showToast('Error', 'Failed to load research dashboard', 'error');
                    } finally {
                        loadingAnalytics.value = false;
                    }
                };

                const loadResearchLinesPerformance = async (forceRefresh = false) => {
                    if (!hasPermission('analytics', 'read')) return;
                    
                    try {
                        const data = await API.getResearchLinesPerformance();
                        researchLinesPerformance.value = data || [];
                    } catch (error) {
                        showToast('Error', 'Failed to load research lines performance', 'error');
                    }
                };

                const loadPartnerCollaborations = async (forceRefresh = false) => {
                    if (!hasPermission('analytics', 'read')) return;
                    
                    try {
                        const data = await API.getPartnerCollaborations();
                        partnerCollaborations.value = data;
                    } catch (error) {
                        showToast('Error', 'Failed to load partner collaborations', 'error');
                    }
                };

                const loadTrialsTimeline = async (years = 3, forceRefresh = false) => {
                    if (!hasPermission('analytics', 'read')) return;
                    
                    try {
                        const data = await API.getClinicalTrialsTimeline(years);
                        trialsTimeline.value = data;
                    } catch (error) {
                        showToast('Error', 'Failed to load trials timeline', 'error');
                    }
                };

                const loadAnalyticsSummary = async (forceRefresh = false) => {
                    if (!hasPermission('analytics', 'read')) return;
                    
                    try {
                        const data = await API.getAnalyticsSummary();
                        analyticsSummary.value = data;
                        
                        // Update dashboard stats
                        if (data) {
                            systemStats.value.totalResearchLines = data.researchLines || 0;
                            systemStats.value.totalTrials = data.clinicalTrials?.total || 0;
                            systemStats.value.activeTrials = data.clinicalTrials?.active || 0;
                            systemStats.value.totalProjects = data.innovationProjects?.total || 0;
                            systemStats.value.activeProjects = data.innovationProjects?.active || 0;
                        }
                    } catch (error) {
                        console.error('Failed to load analytics summary:', error);
                    }
                };

                const loadStaffResearchProfile = async (staffId) => {
                    if (!staffId || !hasPermission('analytics', 'read')) return null;
                    
                    staffProfileModal.loadingResearch = true;
                    try {
                        const profile = await API.getStaffResearchProfile(staffId);
                        staffProfileModal.researchProfile = profile;
                        return profile;
                    } catch (error) {
                        showToast('Error', 'Failed to load research profile', 'error');
                        return null;
                    } finally {
                        staffProfileModal.loadingResearch = false;
                    }
                };

                const handleExport = async () => {
                    if (!hasPermission('analytics', 'export')) {
                        showToast('Error', 'You do not have permission to export data', 'error');
                        return;
                    }

                    exportModal.loading = true;
                    try {
                        const data = await API.exportData(exportModal.type, exportModal.format);
                        
                        // Create download link
                        const blob = new Blob([data], { type: 'text/csv' });
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `${exportModal.type}-export-${new Date().toISOString().split('T')[0]}.csv`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        window.URL.revokeObjectURL(url);
                        
                        showToast('Success', 'Export completed successfully', 'success');
                        exportModal.show = false;
                    } catch (error) {
                        showToast('Error', error.message || 'Export failed', 'error');
                    } finally {
                        exportModal.loading = false;
                    }
                };

                // ============ DATA LOADERS ============
                const loadMedicalStaff = async () => {
                    try { 
                        medicalStaff.value = await API.getMedicalStaff(); 
                    } catch { 
                        showToast('Error', 'Failed to load medical staff', 'error'); 
                    }
                };

                const loadDepartments = async () => {
                    try { 
                        departments.value = await API.getDepartments(); 
                    } catch { 
                        showToast('Error', 'Failed to load departments', 'error'); 
                    }
                };

                const loadTrainingUnits = async () => {
                    try { 
                        trainingUnits.value = await API.getTrainingUnits(); 
                    } catch { 
                        showToast('Error', 'Failed to load training units', 'error'); 
                    }
                };

                const loadRotations = async () => {
                    try {
                        const raw = await API.getRotations();
                        rotations.value = raw.map(r => ({
                            ...r,
                            start_date: EnhancedUtils.normalizeDate(r.start_date || r.rotation_start_date),
                            end_date: EnhancedUtils.normalizeDate(r.end_date || r.rotation_end_date)
                        }));
                    } catch { 
                        showToast('Error', 'Failed to load rotations', 'error'); 
                    }
                };

                const loadAbsences = async () => {
                    try {
                        const raw = await API.getAbsences();
                        absences.value = raw.map(a => ({
                            ...a,
                            start_date: EnhancedUtils.normalizeDate(a.start_date),
                            end_date: EnhancedUtils.normalizeDate(a.end_date)
                        }));
                    } catch { 
                        showToast('Error', 'Failed to load absences', 'error'); 
                    }
                };

                const loadOnCallSchedule = async () => {
                    try {
                        loadingSchedule.value = true;
                        const raw = await API.getOnCallSchedule();
                        onCallSchedule.value = raw.map(s => ({
                            ...s,
                            duty_date: EnhancedUtils.normalizeDate(s.duty_date)
                        }));
                    } catch { 
                        showToast('Error', 'Failed to load on-call schedule', 'error'); 
                    } finally { 
                        loadingSchedule.value = false; 
                    }
                };

                const loadTodaysOnCall = async () => {
                    try {
                        loadingSchedule.value = true;
                        const data = await API.getOnCallToday();
                        todaysOnCall.value = data.map(item => {
                            const startTime = item.start_time?.substring(0, 5) || 'N/A';
                            const endTime = item.end_time?.substring(0, 5) || 'N/A';
                            const physicianName = item.primary_physician?.full_name || 'Unknown Physician';
                            const raw = item.shift_type || '';
                            const isPrimary = raw === 'primary_call' || raw === 'primary';
                            const shiftTypeDisplay = isPrimary ? 'Primary' : 'Backup';
                            const shiftTypeClass = isPrimary ? 'badge-primary' : 'badge-secondary';
                            const matchingStaff = medicalStaff.value.find(s => s.id === item.primary_physician_id);
                            return {
                                id: item.id, startTime, endTime, physicianName, shiftTypeDisplay, shiftTypeClass,
                                shiftType: shiftTypeDisplay,
                                staffType: matchingStaff ? formatStaffType(matchingStaff.staff_type) : 'Physician',
                                coverageArea: item.coverage_area || 'General Coverage',
                                backupPhysician: item.backup_physician?.full_name || null,
                                contactInfo: item.primary_physician?.professional_email || 'No contact info',
                                raw: item
                            };
                        });
                    } catch {
                        showToast('Error', "Failed to load today's on-call schedule", 'error');
                        todaysOnCall.value = [];
                    } finally { 
                        loadingSchedule.value = false; 
                    }
                };

                const loadAnnouncements = async () => {
                    try { 
                        announcements.value = await API.getAnnouncements(); 
                    } catch { 
                        showToast('Error', 'Failed to load announcements', 'error'); 
                    }
                };

                const loadSystemStats = async () => {
                    try {
                        const data = await API.getSystemStats();
                        if (data?.success) Object.assign(systemStats.value, data.data);
                    } catch {}
                };

                const loadClinicalStatus = async () => {
                    isLoadingStatus.value = true;
                    try {
                        const r = await API.getClinicalStatus();
                        clinicalStatus.value = (r?.success) ? r.data : null;
                    } catch { 
                        clinicalStatus.value = null; 
                    } finally { 
                        isLoadingStatus.value = false; 
                    }
                };

                const loadClinicalStatusHistory = async () => {
                    try {
                        const history = await API.getClinicalStatusHistory(20);
                        const cid = clinicalStatus.value?.id;
                        const now = new Date();
                        clinicalStatusHistory.value = history
                            .filter(s => s.id !== cid && (!s.expires_at || now < new Date(s.expires_at)))
                            .slice(0, 5);
                    } catch { 
                        clinicalStatusHistory.value = []; 
                    }
                };

                const loadActiveMedicalStaff = async () => {
                    try {
                        const data = await API.getMedicalStaff();
                        activeMedicalStaff.value = data.filter(s => s.employment_status === 'active');
                        if (currentUser.value) {
                            const found = activeMedicalStaff.value.find(s => s.professional_email === currentUser.value.email);
                            if (found) selectedAuthorId.value = found.id;
                        }
                    } catch { 
                        activeMedicalStaff.value = []; 
                    }
                };

                const loadResearchLines = async () => { 
                    try { 
                        researchLines.value = await API.getResearchLines(); 
                    } catch { 
                        showToast('Error', 'Failed to load research lines', 'error'); 
                    } 
                };
                
                const loadClinicalTrials = async () => { 
                    try { 
                        clinicalTrials.value = await API.getAllClinicalTrials(); 
                    } catch {} 
                };
                
                const loadInnovationProjects = async () => { 
                    try { 
                        innovationProjects.value = await API.getAllInnovationProjects(); 
                    } catch {} 
                };

                // ============ DASHBOARD STATS ============
                const updateDashboardStats = () => {
                    const ns = medicalStaff.value.length;
                    const na = medicalStaff.value.filter(s => s.staff_type === 'attending_physician' && s.employment_status === 'active').length;
                    const nr = medicalStaff.value.filter(s => s.staff_type === 'medical_resident' && s.employment_status === 'active').length;

                    if (systemStats.value.totalStaff === 0 && ns > 0) {
                        const tr = { value: 0 }, ar = { value: 0 }, rr = { value: 0 };
                        animateCountUp(tr, ns, 700); animateCountUp(ar, na, 600); animateCountUp(rr, nr, 650);
                        const iv = setInterval(() => {
                            systemStats.value.totalStaff = tr.value;
                            systemStats.value.activeAttending = ar.value;
                            systemStats.value.activeResidents = rr.value;
                            if (tr.value >= ns) clearInterval(iv);
                        }, 16);
                    } else {
                        systemStats.value.totalStaff = ns;
                        systemStats.value.activeAttending = na;
                        systemStats.value.activeResidents = nr;
                    }

                    const today = EnhancedUtils.normalizeDate(new Date());
                    systemStats.value.onLeaveStaff = absences.value.filter(a => {
                        const s = EnhancedUtils.normalizeDate(a.start_date);
                        const e = EnhancedUtils.normalizeDate(a.end_date);
                        if (!s || !e || !(s <= today && today <= e)) return false;
                        if (a.current_status) return ['currently_absent', 'active', 'on_leave', 'approved'].includes(a.current_status.toLowerCase());
                        return true;
                    }).length;

                    systemStats.value.activeRotations = rotations.value.filter(r => r.rotation_status === 'active').length;

                    const todayDate = new Date(); todayDate.setHours(0, 0, 0, 0);
                    const nextWeek = new Date(todayDate.getTime() + 7 * 86400000);
                    const twoWeeks = new Date(todayDate.getTime() + 14 * 86400000);

                    systemStats.value.endingThisWeek = rotations.value.filter(r => {
                        if (r.rotation_status !== 'active') return false;
                        const e = new Date(EnhancedUtils.normalizeDate(r.end_date) + 'T00:00:00');
                        return !isNaN(e.getTime()) && e >= todayDate && e <= nextWeek;
                    }).length;

                    systemStats.value.startingNextWeek = rotations.value.filter(r => {
                        if (r.rotation_status !== 'scheduled') return false;
                        const s = new Date(EnhancedUtils.normalizeDate(r.start_date) + 'T00:00:00');
                        return !isNaN(s.getTime()) && s >= nextWeek && s <= twoWeeks;
                    }).length;

                    const todayStr = EnhancedUtils.normalizeDate(new Date());
                    const unique = new Set();
                    onCallSchedule.value.filter(s => EnhancedUtils.normalizeDate(s.duty_date) === todayStr)
                        .forEach(s => {
                            if (s.primary_physician_id) unique.add(s.primary_physician_id);
                            if (s.backup_physician_id) unique.add(s.backup_physician_id);
                        });
                    systemStats.value.onCallNow = unique.size;
                };

                const loadAllData = async () => {
                    loading.value = true;
                    try {
                        // Load core operational data in parallel
                        await Promise.all([
                            loadMedicalStaff(), 
                            loadDepartments(), 
                            loadTrainingUnits(),
                            loadRotations(), 
                            loadAbsences(), 
                            loadOnCallSchedule(),
                            loadTodaysOnCall(), 
                            loadAnnouncements(), 
                            loadClinicalStatus(),
                            loadSystemStats(), 
                            loadResearchLines(), 
                            loadClinicalTrials(), 
                            loadInnovationProjects()
                        ]);
                        
                        await loadActiveMedicalStaff();
                        
                        // Load analytics summary (lightweight) for dashboard
                        await loadAnalyticsSummary();
                        
                        updateDashboardStats();
                        showToast('Success', 'System data loaded successfully', 'success');
                    } catch { 
                        showToast('Error', 'Failed to load some data', 'error'); 
                    } finally { 
                        loading.value = false; 
                    }
                };

                // ============ FILTERED COMPUTED PROPERTIES ============
                
                // MEDICAL STAFF
                const filteredMedicalStaffAll = computed(() => {
                    let f = medicalStaff.value;
                    if (staffFilters.search) {
                        const s = staffFilters.search.toLowerCase();
                        f = f.filter(x => x.full_name?.toLowerCase().includes(s) ||
                                         x.staff_id?.toLowerCase().includes(s) ||
                                         x.professional_email?.toLowerCase().includes(s));
                    }
                    if (staffFilters.staffType) f = f.filter(x => x.staff_type === staffFilters.staffType);
                    if (staffFilters.department) f = f.filter(x => x.department_id === staffFilters.department);
                    if (staffFilters.status) f = f.filter(x => x.employment_status === staffFilters.status);
                    return applySortToArray(f, 'medical_staff');
                });
                const filteredMedicalStaff = computed(() => paginateArray(filteredMedicalStaffAll.value, 'medical_staff'));

                // ON-CALL
                const filteredOnCallAll = computed(() => {
                    let f = onCallSchedule.value;
                    if (onCallFilters.date) f = f.filter(s => EnhancedUtils.normalizeDate(s.duty_date) === onCallFilters.date);
                    if (onCallFilters.shiftType) f = f.filter(s => s.shift_type === onCallFilters.shiftType);
                    if (onCallFilters.physician) f = f.filter(s => s.primary_physician_id === onCallFilters.physician || s.backup_physician_id === onCallFilters.physician);
                    if (onCallFilters.coverageArea) f = f.filter(s => s.coverage_area === onCallFilters.coverageArea);
                    if (onCallFilters.search) {
                        const q = onCallFilters.search.toLowerCase();
                        f = f.filter(s => getPhysicianName(s.primary_physician_id).toLowerCase().includes(q) ||
                                          (s.coverage_area || '').toLowerCase().includes(q));
                    }
                    return applySortToArray(f, 'oncall');
                });
                const filteredOnCallSchedules = computed(() => paginateArray(filteredOnCallAll.value, 'oncall'));

                // ROTATIONS
                const filteredRotationsAll = computed(() => {
                    let f = rotations.value;
                    if (rotationFilters.resident) f = f.filter(r => r.resident_id === rotationFilters.resident);
                    if (rotationFilters.status) f = f.filter(r => r.rotation_status === rotationFilters.status);
                    if (rotationFilters.trainingUnit) f = f.filter(r => r.training_unit_id === rotationFilters.trainingUnit);
                    if (rotationFilters.supervisor) f = f.filter(r => r.supervising_attending_id === rotationFilters.supervisor);
                    if (rotationFilters.search) {
                        const q = rotationFilters.search.toLowerCase();
                        f = f.filter(r => getResidentName(r.resident_id).toLowerCase().includes(q) ||
                                          getTrainingUnitName(r.training_unit_id).toLowerCase().includes(q));
                    }
                    return applySortToArray(f, 'rotations');
                });
                const filteredRotations = computed(() => paginateArray(filteredRotationsAll.value, 'rotations'));

                // ABSENCES
                const filteredAbsencesAll = computed(() => {
                    let f = absences.value;
                    if (absenceFilters.staff) f = f.filter(a => a.staff_member_id === absenceFilters.staff);
                    if (absenceFilters.reason) f = f.filter(a => a.absence_reason === absenceFilters.reason);
                    if (absenceFilters.startDate) f = f.filter(a => EnhancedUtils.normalizeDate(a.start_date) >= absenceFilters.startDate);
                    if (absenceFilters.search) {
                        const q = absenceFilters.search.toLowerCase();
                        f = f.filter(a => getStaffName(a.staff_member_id).toLowerCase().includes(q) ||
                                          formatAbsenceReason(a.absence_reason).toLowerCase().includes(q));
                    }
                    return applySortToArray(f, 'absences');
                });
                const filteredAbsences = computed(() => paginateArray(filteredAbsencesAll.value, 'absences'));

                // TRAINING UNITS
                const filteredTrainingUnits = computed(() => {
                    let f = trainingUnits.value;
                    if (trainingUnitFilters.search) {
                        const q = trainingUnitFilters.search.toLowerCase();
                        f = f.filter(u => u.unit_name?.toLowerCase().includes(q) ||
                                          getDepartmentName(u.department_id).toLowerCase().includes(q));
                    }
                    if (trainingUnitFilters.department) f = f.filter(u => u.department_id === trainingUnitFilters.department);
                    if (trainingUnitFilters.status) f = f.filter(u => u.unit_status === trainingUnitFilters.status);
                    return f;
                });

                // DEPARTMENTS
                const filteredDepartments = computed(() => {
                    let f = departments.value;
                    if (departmentFilters.search) {
                        const q = departmentFilters.search.toLowerCase();
                        f = f.filter(d => d.name?.toLowerCase().includes(q) || d.code?.toLowerCase().includes(q));
                    }
                    if (departmentFilters.status) f = f.filter(d => d.status === departmentFilters.status);
                    return f;
                });

                // COMMUNICATIONS
                const filteredAnnouncements = computed(() => {
                    let f = announcements.value;
                    if (communicationsFilters.search) {
                        const q = communicationsFilters.search.toLowerCase();
                        f = f.filter(a => a.title?.toLowerCase().includes(q) || a.content?.toLowerCase().includes(q));
                    }
                    if (communicationsFilters.priority) f = f.filter(a => a.priority_level === communicationsFilters.priority);
                    if (communicationsFilters.audience) f = f.filter(a => a.target_audience === communicationsFilters.audience);
                    return f.slice(0, 20);
                });

                // TRIALS
                const filteredTrialsAll = computed(() => {
                    let f = clinicalTrials.value;
                    if (trialFilters.line) f = f.filter(t => t.research_line_id === trialFilters.line);
                    if (trialFilters.phase) f = f.filter(t => t.phase === trialFilters.phase);
                    if (trialFilters.status) f = f.filter(t => t.status === trialFilters.status);
                    if (trialFilters.search) {
                        const q = trialFilters.search.toLowerCase();
                        f = f.filter(t => t.protocol_id?.toLowerCase().includes(q) || t.title?.toLowerCase().includes(q));
                    }
                    return applySortToArray(f, 'trials');
                });
                const filteredTrials = computed(() => paginateArray(filteredTrialsAll.value, 'trials'));

                // PROJECTS
                const filteredProjects = computed(() => {
                    let f = innovationProjects.value;
                    if (projectFilters.research_line_id) f = f.filter(p => p.research_line_id === projectFilters.research_line_id);
                    if (projectFilters.category) f = f.filter(p => p.category === projectFilters.category);
                    if (projectFilters.search) {
                        const q = projectFilters.search.toLowerCase();
                        f = f.filter(p => p.title?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q));
                    }
                    return f;
                });

                // RESEARCH LINES with filters
                const filteredResearchLines = computed(() => {
                    let f = researchLines.value;
                    if (researchLineFilters.search) {
                        const q = researchLineFilters.search.toLowerCase();
                        f = f.filter(l => (l.research_line_name || l.name)?.toLowerCase().includes(q) ||
                                          l.description?.toLowerCase().includes(q));
                    }
                    if (researchLineFilters.active !== '') {
                        const active = researchLineFilters.active === 'true';
                        f = f.filter(l => l.active === active);
                    }
                    return applySortToArray(f, 'research_lines');
                });

                const recentAnnouncements = computed(() => filteredAnnouncements.value);
                const activeAlertsCount = computed(() => systemAlerts.value.filter(a => !a.status || a.status === 'active').length);

                // ============ PAGINATION COUNTS ============
                const staffTotalPages = computed(() => totalPages(filteredMedicalStaffAll.value, 'medical_staff'));
                const rotationTotalPages = computed(() => totalPages(filteredRotationsAll.value, 'rotations'));
                const oncallTotalPages = computed(() => totalPages(filteredOnCallAll.value, 'oncall'));
                const absenceTotalPages = computed(() => totalPages(filteredAbsencesAll.value, 'absences'));
                const trialTotalPages = computed(() => totalPages(filteredTrialsAll.value, 'trials'));

                // ============ AUTH ============
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
                    } finally { 
                        loginLoading.value = false; 
                    }
                };

                const handleLogout = () => {
                    showConfirmation({
                        title: 'Logout', 
                        message: 'Are you sure you want to logout?',
                        icon: 'fa-sign-out-alt', 
                        confirmButtonText: 'Logout', 
                        confirmButtonClass: 'btn-danger',
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

                // ============ NAVIGATION ============
                const switchView = async (view) => {
                    currentView.value = view;
                    mobileMenuOpen.value = false;
                    
                    // Reset pagination on view switch
                    if (pagination[view]) pagination[view].page = 1;
                    
                    // Load analytics data when switching to analytics views
                    if (view === 'analytics_dashboard' && hasPermission('analytics', 'read')) {
                        await loadResearchDashboard();
                        await loadTrialsTimeline();
                    } else if (view === 'analytics_performance' && hasPermission('analytics', 'read')) {
                        await loadResearchLinesPerformance();
                    } else if (view === 'analytics_partners' && hasPermission('analytics', 'read')) {
                        await loadPartnerCollaborations();
                    }
                };
                
                const toggleStatsSidebar = () => { statsSidebarOpen.value = !statsSidebarOpen.value; };
                const handleGlobalSearch = () => {};
                const dismissAlert = (id) => { 
                    const i = systemAlerts.value.findIndex(a => a.id === id); 
                    if (i > -1) systemAlerts.value.splice(i, 1); 
                };

                // ============ SHOW MODAL HELPERS ============
                const showAddMedicalStaffModal = () => {
                    clearAllErrors('staff');
                    medicalStaffModal.mode = 'add';
                    medicalStaffModal.activeTab = 'basic';
                    medicalStaffModal.form = {
                        full_name: '', staff_type: 'medical_resident',
                        staff_id: `MD-${Date.now().toString().slice(-6)}`,
                        employment_status: 'active', professional_email: '', department_id: '',
                        academic_degree: '', specialization: '', training_year: '',
                        clinical_certificate: '', certificate_status: '', mobile_phone: '',
                        medical_license: '', can_supervise_residents: false, special_notes: ''
                    };
                    medicalStaffModal.show = true;
                };

                const showAddRotationModal = () => {
                    clearAllErrors('rotation');
                    rotationModal.mode = 'add';
                    rotationModal.form = {
                        rotation_id: `ROT-${Date.now().toString().slice(-6)}`,
                        resident_id: '', training_unit_id: '',
                        start_date: EnhancedUtils.normalizeDate(new Date()),
                        end_date: EnhancedUtils.normalizeDate(new Date(Date.now() + 30 * 86400000)),
                        rotation_status: 'scheduled', rotation_category: 'clinical_rotation',
                        supervising_attending_id: ''
                    };
                    rotationModal.show = true;
                };

                const showAddOnCallModal = () => {
                    clearAllErrors('oncall');
                    onCallModal.mode = 'add';
                    onCallModal.form = {
                        duty_date: EnhancedUtils.normalizeDate(new Date()),
                        shift_type: 'primary_call', start_time: '08:00', end_time: '17:00',
                        primary_physician_id: '', backup_physician_id: '',
                        coverage_area: 'emergency', coverage_notes: '',
                        schedule_id: `SCH-${Date.now().toString().slice(-6)}`
                    };
                    onCallModal.show = true;
                };

                const showAddAbsenceModal = () => {
                    clearAllErrors('absence');
                    absenceModal.mode = 'add';
                    absenceModal.form = {
                        staff_member_id: '', absence_type: 'planned', absence_reason: 'vacation',
                        start_date: EnhancedUtils.normalizeDate(new Date()),
                        end_date: EnhancedUtils.normalizeDate(new Date(Date.now() + 7 * 86400000)),
                        covering_staff_id: '', coverage_notes: '', coverage_arranged: false, hod_notes: ''
                    };
                    absenceModal.show = true;
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

                // Research modals
                const showAddResearchLineModal = () => {
                    clearAllErrors('research');
                    researchLineModal.mode = 'add';
                    researchLineModal.form = {
                        line_number: researchLines.value.length + 1,
                        name: '', description: '', capabilities: 'Alcance y capacidades',
                        sort_order: researchLines.value.length + 1, active: true
                    };
                    researchLineModal.show = true;
                };

                const showAddTrialModal = () => {
                    clinicalTrialModal.mode = 'add';
                    clinicalTrialModal.form = {
                        protocol_id: `HUAC-${Date.now().toString().slice(-6)}`,
                        title: '', research_line_id: '', phase: 'Phase III', status: 'Reclutando',
                        description: '', inclusion_criteria: '', exclusion_criteria: '',
                        principal_investigator_id: '', contact_email: '',
                        featured_in_website: true, display_order: clinicalTrials.value.length + 1
                    };
                    clinicalTrialModal.show = true;
                };

                const showAddProjectModal = () => {
                    innovationProjectModal.mode = 'add';
                    innovationProjectModal.form = {
                        title: '', category: 'Dispositivo', development_stage: 'En Desarrollo',
                        description: '', research_line_id: '', lead_investigator_id: '',
                        partner_needs: [], featured_in_website: true, display_order: innovationProjects.value.length + 1
                    };
                    innovationProjectModal.show = true;
                };

                const openAssignCoordinatorModal = (line) => {
                    assignCoordinatorModal.lineId = line.id;
                    assignCoordinatorModal.lineName = line.research_line_name || line.name;
                    assignCoordinatorModal.selectedCoordinatorId = line.coordinator_id || '';
                    assignCoordinatorModal.show = true;
                };

                // Export modal
                const showExportModal = () => {
                    exportModal.type = 'clinical-trials';
                    exportModal.show = true;
                };

                // ============ VIEW / EDIT ============
                const viewStaffDetails = async (staff) => {
                    staffProfileModal.staff = staff;
                    staffProfileModal.activeTab = 'assignments';
                    staffProfileModal.show = true;
                    
                    // Load research profile data asynchronously
                    if (hasPermission('analytics', 'read')) {
                        await loadStaffResearchProfile(staff.id);
                    }
                };

                const viewUnitResidents = (unit) => {
                    unitResidentsModal.unit = unit;
                    unitResidentsModal.rotations = rotations.value.filter(r =>
                        r.training_unit_id === unit.id && ['active', 'scheduled'].includes(r.rotation_status));
                    unitResidentsModal.show = true;
                };

                const editMedicalStaff = (staff) => {
                    clearAllErrors('staff');
                    medicalStaffModal.mode = 'edit';
                    medicalStaffModal.form = { ...staff };
                    medicalStaffModal.show = true;
                };

                const editRotation = (rotation) => {
                    clearAllErrors('rotation');
                    rotationModal.mode = 'edit';
                    rotationModal.form = {
                        ...rotation,
                        start_date: EnhancedUtils.normalizeDate(rotation.start_date || rotation.rotation_start_date),
                        end_date: EnhancedUtils.normalizeDate(rotation.end_date || rotation.rotation_end_date)
                    };
                    rotationModal.show = true;
                };

                const editOnCallSchedule = (schedule) => {
                    clearAllErrors('oncall');
                    onCallModal.mode = 'edit';
                    const rawShift = schedule.shift_type || 'primary_call';
                    const normalizedShift = (rawShift === 'primary' || rawShift === 'primary_call') ? 'primary_call' : 'backup_call';
                    onCallModal.form = {
                        ...schedule,
                        duty_date: EnhancedUtils.normalizeDate(schedule.duty_date),
                        shift_type: normalizedShift,
                        coverage_area: schedule.coverage_area || 'emergency',
                        coverage_notes: schedule.coverage_notes || ''
                    };
                    onCallModal.show = true;
                };

                const editAbsence = (absence) => {
                    clearAllErrors('absence');
                    absenceModal.mode = 'edit';
                    absenceModal.form = {
                        id: absence.id,
                        staff_member_id: absence.staff_member_id || '',
                        absence_type: absence.absence_type || 'planned',
                        absence_reason: absence.absence_reason || 'vacation',
                        start_date: EnhancedUtils.normalizeDate(absence.start_date),
                        end_date: EnhancedUtils.normalizeDate(absence.end_date),
                        covering_staff_id: absence.covering_staff_id || '',
                        coverage_notes: absence.coverage_notes || '',
                        coverage_arranged: absence.coverage_arranged || false,
                        hod_notes: absence.hod_notes || '',
                        current_status: absence.current_status || null
                    };
                    absenceModal.show = true;
                };

                const editDepartment = (d) => { 
                    departmentModal.mode = 'edit'; 
                    departmentModal.form = { ...d }; 
                    departmentModal.show = true; 
                };
                
                const editTrainingUnit = (u) => { 
                    trainingUnitModal.mode = 'edit'; 
                    trainingUnitModal.form = { ...u }; 
                    trainingUnitModal.show = true; 
                };
                
                const editResearchLine = (l) => { 
                    researchLineModal.mode = 'edit'; 
                    researchLineModal.form = { ...l }; 
                    researchLineModal.show = true; 
                };
                
                const editTrial = (t) => { 
                    clinicalTrialModal.mode = 'edit'; 
                    clinicalTrialModal.form = { ...t }; 
                    clinicalTrialModal.show = true; 
                };
                
                const editProject = (p) => { 
                    innovationProjectModal.mode = 'edit'; 
                    innovationProjectModal.form = { ...p }; 
                    innovationProjectModal.show = true; 
                };

                const viewDepartmentStaff = (dept) => showToast('Department Staff', `Viewing staff for ${dept.name}`, 'info');
                const viewAnnouncement = (a) => showToast(a.title, EnhancedUtils.truncateText(a.content, 120), 'info');
                
                const contactPhysician = (shift) => {
                    if (shift.contactInfo && shift.contactInfo !== 'No contact info')
                        showToast('Contact Physician', `Contact ${shift.physicianName}: ${shift.contactInfo}`, 'info');
                    else
                        showToast('No Contact Info', `No contact info for ${shift.physicianName}`, 'warning');
                };

                // ============ SAVE FUNCTIONS ============

                const saveRotation = async () => {
                    if (!validateRotationForm(rotationModal.form)) {
                        showToast('Validation Error', 'Please fix the highlighted fields', 'error');
                        return;
                    }

                    const startISO = EnhancedUtils.normalizeDate(rotationModal.form.start_date);
                    const endISO = EnhancedUtils.normalizeDate(rotationModal.form.end_date);

                    const startDate = new Date(startISO + 'T00:00:00');
                    const endDate = new Date(endISO + 'T23:59:59');

                    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                        setFieldError('rotation', 'start_date', 'Invalid date format. Use YYYY-MM-DD.');
                        showToast('Error', 'Invalid date format', 'error');
                        return;
                    }

                    const duration = Math.ceil((endDate - startDate) / 86400000);
                    if (duration > 365) {
                        setFieldError('rotation', 'end_date', `Rotation cannot exceed 365 days (current: ${duration} days)`);
                        showToast('Error', `Rotation cannot exceed 365 days`, 'error');
                        return;
                    }

                    const excludeId = rotationModal.mode === 'edit' ? rotationModal.form.id : null;
                    const hasOverlap = rotations.value.some(r => {
                        if (r.resident_id !== rotationModal.form.resident_id) return false;
                        if (r.rotation_status === 'cancelled') return false;
                        if (excludeId && r.id === excludeId) return false;
                        const eS = new Date(EnhancedUtils.normalizeDate(r.start_date) + 'T00:00:00');
                        const eE = new Date(EnhancedUtils.normalizeDate(r.end_date) + 'T23:59:59');
                        if (isNaN(eS.getTime()) || isNaN(eE.getTime())) return false;
                        return startDate <= eE && endDate >= eS;
                    });

                    if (hasOverlap) {
                        setFieldError('rotation', 'start_date', 'Resident already has a rotation in this period');
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
                            start_date: startISO,
                            end_date: endISO,
                            rotation_category: rotationModal.form.rotation_category || 'clinical_rotation',
                            rotation_status: (rotationModal.form.rotation_status || 'scheduled').toLowerCase()
                        };

                        if (rotationModal.mode === 'add') {
                            const result = await API.createRotation(rotationData);
                            rotations.value.unshift({
                                ...result,
                                start_date: EnhancedUtils.normalizeDate(result.start_date),
                                end_date: EnhancedUtils.normalizeDate(result.end_date)
                            });
                            showToast('Success', 'Rotation scheduled successfully', 'success');
                        } else {
                            const result = await API.updateRotation(rotationModal.form.id, rotationData);
                            const idx = rotations.value.findIndex(r => r.id === result.id);
                            if (idx !== -1) rotations.value[idx] = {
                                ...result,
                                start_date: EnhancedUtils.normalizeDate(result.start_date),
                                end_date: EnhancedUtils.normalizeDate(result.end_date)
                            };
                            showToast('Success', 'Rotation updated successfully', 'success');
                        }
                        rotationModal.show = false;
                        clearAllErrors('rotation');
                        updateDashboardStats();
                    } catch (error) {
                        let msg = error.message || 'Failed to save rotation';
                        if (msg.includes('overlapping')) msg = 'Dates conflict with an existing rotation.';
                        if (msg.includes('date')) msg = 'Invalid date — please check the start and end dates.';
                        showToast('Error', msg, 'error');
                    } finally { 
                        saving.value = false; 
                    }
                };

                const saveOnCallSchedule = async () => {
                    if (!validateOnCallForm(onCallModal.form)) {
                        showToast('Validation Error', 'Please fix the highlighted fields', 'error');
                        return;
                    }
                    saving.value = true;
                    try {
                        const onCallData = {
                            duty_date: EnhancedUtils.normalizeDate(onCallModal.form.duty_date),
                            shift_type: onCallModal.form.shift_type || 'primary_call',
                            start_time: onCallModal.form.start_time || '08:00',
                            end_time: onCallModal.form.end_time || '17:00',
                            primary_physician_id: onCallModal.form.primary_physician_id,
                            backup_physician_id: onCallModal.form.backup_physician_id || null,
                            coverage_notes: onCallModal.form.coverage_notes || '',
                            schedule_id: onCallModal.form.schedule_id || EnhancedUtils.generateId('SCH')
                        };
                        if (onCallModal.mode === 'add') {
                            const result = await API.createOnCall(onCallData);
                            onCallSchedule.value.unshift({
                                ...result,
                                duty_date: EnhancedUtils.normalizeDate(result.duty_date),
                                coverage_area: onCallModal.form.coverage_area
                            });
                            showToast('Success', 'On-call scheduled successfully', 'success');
                        } else {
                            const result = await API.updateOnCall(onCallModal.form.id, onCallData);
                            const idx = onCallSchedule.value.findIndex(s => s.id === result.id);
                            if (idx !== -1) onCallSchedule.value[idx] = {
                                ...result,
                                duty_date: EnhancedUtils.normalizeDate(result.duty_date),
                                coverage_area: onCallModal.form.coverage_area
                            };
                            showToast('Success', 'On-call updated successfully', 'success');
                        }
                        onCallModal.show = false;
                        clearAllErrors('oncall');
                        loadTodaysOnCall();
                    } catch (error) { 
                        showToast('Error', error.message || 'Failed to save on-call schedule', 'error'); 
                    } finally { 
                        saving.value = false; 
                    }
                };

                const saveAbsence = async () => {
                    if (!validateAbsenceForm(absenceModal.form)) {
                        showToast('Validation Error', 'Please fix the highlighted fields', 'error');
                        return;
                    }
                    saving.value = true;
                    try {
                        const absenceData = {
                            staff_member_id: absenceModal.form.staff_member_id,
                            absence_type: absenceModal.form.absence_type || 'planned',
                            absence_reason: absenceModal.form.absence_reason || 'vacation',
                            start_date: EnhancedUtils.normalizeDate(absenceModal.form.start_date),
                            end_date: EnhancedUtils.normalizeDate(absenceModal.form.end_date),
                            coverage_arranged: absenceModal.form.coverage_arranged || false,
                            covering_staff_id: absenceModal.form.covering_staff_id || null,
                            coverage_notes: absenceModal.form.coverage_notes || '',
                            hod_notes: absenceModal.form.hod_notes || ''
                        };
                        if (absenceModal.mode === 'add') {
                            const result = await API.createAbsence(absenceData);
                            const record = result?.data || result;
                            absences.value.unshift({
                                ...record,
                                start_date: EnhancedUtils.normalizeDate(record.start_date),
                                end_date: EnhancedUtils.normalizeDate(record.end_date)
                            });
                            showToast('Success', 'Absence recorded successfully', 'success');
                        } else {
                            const result = await API.updateAbsence(absenceModal.form.id, absenceData);
                            const record = result?.data || result;
                            const idx = absences.value.findIndex(a => a.id === (record.id || absenceModal.form.id));
                            if (idx !== -1) absences.value[idx] = {
                                ...record,
                                start_date: EnhancedUtils.normalizeDate(record.start_date),
                                end_date: EnhancedUtils.normalizeDate(record.end_date)
                            };
                            showToast('Success', 'Absence updated successfully', 'success');
                        }
                        absenceModal.show = false;
                        clearAllErrors('absence');
                        await loadAbsences();
                        updateDashboardStats();
                    } catch (error) { 
                        showToast('Error', error.message || 'Failed to save absence record', 'error'); 
                    } finally { 
                        saving.value = false; 
                    }
                };

                const saveMedicalStaff = async () => {
                    if (!validateStaffForm(medicalStaffModal.form)) {
                        showToast('Validation Error', 'Please fix the highlighted fields', 'error');
                        return;
                    }
                    saving.value = true;
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
                            mobile_phone: clean(medicalStaffModal.form.mobile_phone),
                            medical_license: clean(medicalStaffModal.form.medical_license),
                            can_supervise_residents: medicalStaffModal.form.can_supervise_residents || false,
                            special_notes: clean(medicalStaffModal.form.special_notes)
                        };
                        if (medicalStaffModal.mode === 'add') {
                            const result = await API.createMedicalStaff(staffData);
                            medicalStaff.value.unshift(result);
                            showToast('Success', 'Medical staff added successfully', 'success');
                        } else {
                            const result = await API.updateMedicalStaff(medicalStaffModal.form.id, staffData);
                            const idx = medicalStaff.value.findIndex(s => s.id === result.id);
                            if (idx !== -1) medicalStaff.value[idx] = result;
                            showToast('Success', 'Medical staff updated successfully', 'success');
                        }
                        medicalStaffModal.show = false;
                        clearAllErrors('staff');
                        updateDashboardStats();
                    } catch (error) { 
                        showToast('Error', error.message || 'Failed to save medical staff', 'error'); 
                    } finally { 
                        saving.value = false; 
                    }
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
                            const idx = departments.value.findIndex(d => d.id === result.id);
                            if (idx !== -1) departments.value[idx] = result;
                            showToast('Success', 'Department updated successfully', 'success');
                        }
                        departmentModal.show = false;
                    } catch (error) { 
                        showToast('Error', error.message, 'error'); 
                    } finally { 
                        saving.value = false; 
                    }
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
                            showToast('Success', 'Training unit created', 'success');
                        } else {
                            const result = await API.updateTrainingUnit(trainingUnitModal.form.id, unitData);
                            const idx = trainingUnits.value.findIndex(u => u.id === result.id);
                            if (idx !== -1) trainingUnits.value[idx] = result;
                            showToast('Success', 'Training unit updated', 'success');
                        }
                        trainingUnitModal.show = false;
                        updateDashboardStats();
                    } catch (error) { 
                        showToast('Error', error.message, 'error'); 
                    } finally { 
                        saving.value = false; 
                    }
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
                    } catch (error) { 
                        showToast('Error', error.message, 'error'); 
                    } finally { 
                        saving.value = false; 
                    }
                };

                const saveUserProfile = async () => {
                    saving.value = true;
                    try {
                        currentUser.value.full_name = userProfileModal.form.full_name;
                        currentUser.value.department_id = userProfileModal.form.department_id;
                        localStorage.setItem(CONFIG.USER_KEY, JSON.stringify(currentUser.value));
                        userProfileModal.show = false;
                        showToast('Success', 'Profile updated successfully', 'success');
                    } catch (error) { 
                        showToast('Error', error.message, 'error'); 
                    } finally { 
                        saving.value = false; 
                    }
                };

                // ============ RESEARCH SAVE FUNCTIONS ============
                const saveResearchLine = async () => {
                    if (!validateResearchLineForm(researchLineModal.form)) {
                        showToast('Validation Error', 'Research line name is required', 'error');
                        return;
                    }
                    
                    saving.value = true;
                    try {
                        if (researchLineModal.mode === 'add') {
                            const result = await API.createResearchLine(researchLineModal.form);
                            researchLines.value.unshift(result);
                            showToast('Success', 'Research line created', 'success');
                        } else {
                            const result = await API.updateResearchLine(researchLineModal.form.id, researchLineModal.form);
                            const idx = researchLines.value.findIndex(l => l.id === result.id);
                            if (idx !== -1) researchLines.value[idx] = result;
                            showToast('Success', 'Research line updated', 'success');
                        }
                        researchLineModal.show = false;
                        await loadResearchLines();
                        // Refresh analytics data
                        loadAnalyticsSummary();
                    } catch (error) { 
                        showToast('Error', error.message || 'Failed to save research line', 'error'); 
                    } finally { 
                        saving.value = false; 
                    }
                };

                const saveClinicalTrial = async () => {
                    saving.value = true;
                    try {
                        if (clinicalTrialModal.mode === 'add') {
                            const result = await API.createClinicalTrial(clinicalTrialModal.form);
                            clinicalTrials.value.unshift(result);
                            showToast('Success', 'Clinical trial created', 'success');
                        } else {
                            const result = await API.updateClinicalTrial(clinicalTrialModal.form.id, clinicalTrialModal.form);
                            const idx = clinicalTrials.value.findIndex(t => t.id === result.id);
                            if (idx !== -1) clinicalTrials.value[idx] = result;
                            showToast('Success', 'Clinical trial updated', 'success');
                        }
                        clinicalTrialModal.show = false;
                        await loadClinicalTrials();
                        // Refresh analytics
                        loadAnalyticsSummary();
                    } catch (error) { 
                        showToast('Error', error.message || 'Failed to save clinical trial', 'error'); 
                    } finally { 
                        saving.value = false; 
                    }
                };

                const saveInnovationProject = async () => {
                    saving.value = true;
                    try {
                        if (innovationProjectModal.mode === 'add') {
                            const result = await API.createInnovationProject(innovationProjectModal.form);
                            innovationProjects.value.unshift(result);
                            showToast('Success', 'Innovation project created', 'success');
                        } else {
                            const result = await API.updateInnovationProject(innovationProjectModal.form.id, innovationProjectModal.form);
                            const idx = innovationProjects.value.findIndex(p => p.id === result.id);
                            if (idx !== -1) innovationProjects.value[idx] = result;
                            showToast('Success', 'Innovation project updated', 'success');
                        }
                        innovationProjectModal.show = false;
                        await loadInnovationProjects();
                        // Refresh analytics
                        loadAnalyticsSummary();
                        loadPartnerCollaborations();
                    } catch (error) { 
                        showToast('Error', error.message || 'Failed to save project', 'error'); 
                    } finally { 
                        saving.value = false; 
                    }
                };

                const saveClinicalStatus = async () => {
                    if (!newStatusText.value.trim() || !selectedAuthorId.value) {
                        showToast('Error', 'Please fill all required fields', 'error');
                        return;
                    }
                    isLoadingStatus.value = true;
                    try {
                        const response = await API.createClinicalStatus({
                            status_text: newStatusText.value.trim(),
                            author_id: selectedAuthorId.value,
                            expires_in_hours: expiryHours.value
                        });
                        if (response?.success && response.data) {
                            if (clinicalStatus.value) clinicalStatusHistory.value.unshift(clinicalStatus.value);
                            clinicalStatus.value = response.data;
                            newStatusText.value = '';
                            selectedAuthorId.value = '';
                            liveStatsEditMode.value = false;
                            await loadClinicalStatusHistory();
                            showToast('Success', 'Live status updated for all staff', 'success');
                            await loadSystemStats();
                        } else { 
                            throw new Error(response?.error || 'Failed to save status'); 
                        }
                    } catch (error) { 
                        showToast('Error', error.message || 'Could not update status', 'error'); 
                    } finally { 
                        isLoadingStatus.value = false; 
                    }
                };

                const saveCoordinatorAssignment = async () => {
                    try {
                        await API.assignCoordinator(
                            assignCoordinatorModal.lineId,
                            assignCoordinatorModal.selectedCoordinatorId || null
                        );
                        await loadResearchLines();
                        assignCoordinatorModal.show = false;
                        showToast('Success', 'Coordinator assigned successfully', 'success');
                        
                        // Refresh analytics
                        loadResearchLinesPerformance();
                    } catch (error) { 
                        showToast('Error', error.message || 'Failed to assign coordinator', 'error'); 
                    }
                };

                // ============ DELETE FUNCTIONS ============
                const deleteMedicalStaff = (staff) => showConfirmation({
                    title: 'Delete Staff', 
                    message: `Delete ${staff.full_name}?`,
                    icon: 'fa-trash', 
                    confirmButtonText: 'Delete', 
                    confirmButtonClass: 'btn-danger',
                    details: 'This action cannot be undone.',
                    onConfirm: async () => {
                        await API.deleteMedicalStaff(staff.id);
                        medicalStaff.value = medicalStaff.value.filter(s => s.id !== staff.id);
                        showToast('Success', 'Staff deleted successfully', 'success');
                        updateDashboardStats();
                    }
                });

                const deleteRotation = (rotation) => showConfirmation({
                    title: 'Delete Rotation', 
                    message: 'Delete this rotation?',
                    icon: 'fa-trash', 
                    confirmButtonText: 'Delete', 
                    confirmButtonClass: 'btn-danger',
                    details: `Resident: ${getResidentName(rotation.resident_id)}`,
                    onConfirm: async () => {
                        await API.deleteRotation(rotation.id);
                        rotations.value = rotations.value.filter(r => r.id !== rotation.id);
                        showToast('Success', 'Rotation deleted', 'success');
                        updateDashboardStats();
                    }
                });

                const deleteOnCallSchedule = (schedule) => showConfirmation({
                    title: 'Delete On-Call', 
                    message: 'Delete this on-call schedule?',
                    icon: 'fa-trash', 
                    confirmButtonText: 'Delete', 
                    confirmButtonClass: 'btn-danger',
                    details: `Physician: ${getPhysicianName(schedule.primary_physician_id)}`,
                    onConfirm: async () => {
                        await API.deleteOnCall(schedule.id);
                        onCallSchedule.value = onCallSchedule.value.filter(s => s.id !== schedule.id);
                        showToast('Success', 'Schedule deleted', 'success');
                        loadTodaysOnCall();
                    }
                });

                const deleteAbsence = (absence) => showConfirmation({
                    title: 'Delete Absence', 
                    message: 'Delete this absence record?',
                    icon: 'fa-trash', 
                    confirmButtonText: 'Delete', 
                    confirmButtonClass: 'btn-danger',
                    details: `Staff: ${getStaffName(absence.staff_member_id)}`,
                    onConfirm: async () => {
                        await API.deleteAbsence(absence.id);
                        absences.value = absences.value.filter(a => a.id !== absence.id);
                        showToast('Success', 'Absence deleted', 'success');
                        updateDashboardStats();
                    }
                });

                const deleteAnnouncement = (ann) => showConfirmation({
                    title: 'Delete Announcement', 
                    message: `Delete "${ann.title}"?`,
                    icon: 'fa-trash', 
                    confirmButtonText: 'Delete', 
                    confirmButtonClass: 'btn-danger',
                    onConfirm: async () => {
                        await API.deleteAnnouncement(ann.id);
                        announcements.value = announcements.value.filter(a => a.id !== ann.id);
                        showToast('Success', 'Announcement deleted', 'success');
                    }
                });

                const deleteClinicalStatus = () => {
                    if (!clinicalStatus.value) return;
                    showConfirmation({
                        title: 'Clear Live Status', 
                        message: 'Clear the current live status?',
                        icon: 'fa-trash', 
                        confirmButtonText: 'Clear', 
                        confirmButtonClass: 'btn-danger',
                        onConfirm: async () => {
                            await API.deleteClinicalStatus(clinicalStatus.value.id);
                            clinicalStatus.value = null;
                            showToast('Success', 'Live status cleared', 'success');
                        }
                    });
                };

                const deleteResearchLine = (line) => showConfirmation({
                    title: 'Delete Research Line', 
                    message: `Delete "${line.research_line_name || line.name}"?`,
                    icon: 'fa-trash', 
                    confirmButtonText: 'Delete', 
                    confirmButtonClass: 'btn-danger',
                    onConfirm: async () => {
                        await API.deleteResearchLine(line.id);
                        await loadResearchLines();
                        showToast('Success', 'Research line deleted', 'success');
                        // Refresh analytics
                        loadAnalyticsSummary();
                    }
                });

                const deleteClinicalTrial = (trial) => showConfirmation({
                    title: 'Delete Trial', 
                    message: `Delete "${trial.title}"?`,
                    icon: 'fa-trash', 
                    confirmButtonText: 'Delete', 
                    confirmButtonClass: 'btn-danger',
                    details: `Protocol: ${trial.protocol_id}`,
                    onConfirm: async () => {
                        await API.deleteClinicalTrial(trial.id);
                        await loadClinicalTrials();
                        showToast('Success', 'Trial deleted', 'success');
                        loadAnalyticsSummary();
                    }
                });

                const deleteInnovationProject = (project) => showConfirmation({
                    title: 'Delete Project', 
                    message: `Delete "${project.title}"?`,
                    icon: 'fa-trash', 
                    confirmButtonText: 'Delete', 
                    confirmButtonClass: 'btn-danger',
                    onConfirm: async () => {
                        await API.deleteInnovationProject(project.id);
                        await loadInnovationProjects();
                        showToast('Success', 'Project deleted', 'success');
                        loadAnalyticsSummary();
                        loadPartnerCollaborations();
                    }
                });

                const requestFullDossier = () => showToast('Info', 'Dossier request sent. Our team will contact you shortly.', 'info');

                // ============ MISC HELPERS ============
                const getStaffTypeIcon = (t) => ({ 
                    attending_physician: 'fa-user-md', 
                    medical_resident: 'fa-user-graduate', 
                    fellow: 'fa-user-tie', 
                    nurse_practitioner: 'fa-user-nurse' 
                }[t] || 'fa-user');
                
                const calculateCapacityPercent = (cur, max) => (!cur || !max) ? 0 : Math.round((cur / max) * 100);
                
                const getAbsenceReasonIcon = (r) => ({ 
                    vacation: 'fa-umbrella-beach', 
                    sick_leave: 'fa-procedures', 
                    conference: 'fa-chalkboard-teacher', 
                    training: 'fa-graduation-cap', 
                    personal: 'fa-user-clock', 
                    other: 'fa-question-circle' 
                }[r] || 'fa-clock');
                
                const getPreviewCardClass = () => absenceModal.form.absence_type === 'planned' ? 'planned' : 'unplanned';
                const getPreviewIcon = () => ({ 
                    vacation: 'fas fa-umbrella-beach', 
                    conference: 'fas fa-chalkboard-teacher', 
                    sick_leave: 'fas fa-heartbeat', 
                    training: 'fas fa-graduation-cap', 
                    personal: 'fas fa-home', 
                    other: 'fas fa-ellipsis-h' 
                }[absenceModal.form.absence_reason] || 'fas fa-clock');
                
                const getPreviewReasonText = () => formatAbsenceReason(absenceModal.form.absence_reason);
                const getPreviewStatusClass = () => absenceModal.form.absence_type === 'planned' ? 'status-planned' : 'status-unplanned';
                const getPreviewStatusText = () => absenceModal.form.absence_type === 'planned' ? 'Planned' : 'Unplanned';
                const updatePreview = () => {};
                
                const getCurrentRotationSupervisor = (staffId) => { 
                    const r = getCurrentRotationForStaff(staffId); 
                    return r?.supervising_attending_id ? getStaffName(r.supervising_attending_id) : 'Not assigned'; 
                };

                // ============ COMPUTED ============
                const availablePhysicians = computed(() => medicalStaff.value.filter(s => 
                    ['attending_physician', 'fellow', 'nurse_practitioner'].includes(s.staff_type) && 
                    s.employment_status === 'active'
                ));
                
                const availableResidents = computed(() => medicalStaff.value.filter(s => 
                    s.staff_type === 'medical_resident' && s.employment_status === 'active'
                ));
                
                const availableAttendings = computed(() => medicalStaff.value.filter(s => 
                    s.staff_type === 'attending_physician' && s.employment_status === 'active'
                ));
                
                const availableHeadsOfDepartment = computed(() => availableAttendings.value);
                const availableReplacementStaff = computed(() => medicalStaff.value.filter(s => s.employment_status === 'active'));
                const unreadAnnouncements = computed(() => announcements.value.filter(a => !a.read).length);
                const currentTimeFormatted = computed(() => EnhancedUtils.formatTime(currentTime.value));

                const formattedExpiry = computed(() => {
                    if (!clinicalStatus.value?.expires_at) return '';
                    const diff = Math.ceil((new Date(clinicalStatus.value.expires_at) - new Date()) / 3600000);
                    if (diff <= 1) return 'Expires soon';
                    if (diff <= 4) return `Expires in ${diff}h`;
                    return `Expires ${EnhancedUtils.formatTime(clinicalStatus.value.expires_at)}`;
                });

                // ============ WATCHERS ============
                watch([medicalStaff, rotations, trainingUnits, absences], () => updateDashboardStats(), { deep: true });

                // Reset pagination when filters change
                watch(staffFilters, () => resetPage('medical_staff'), { deep: true });
                watch(rotationFilters, () => resetPage('rotations'), { deep: true });
                watch(onCallFilters, () => resetPage('oncall'), { deep: true });
                watch(absenceFilters, () => resetPage('absences'), { deep: true });
                watch(trialFilters, () => resetPage('trials'), { deep: true });

                // ============ LIFECYCLE ============
                onMounted(() => {
                    const token = localStorage.getItem(CONFIG.TOKEN_KEY);
                    const user = localStorage.getItem(CONFIG.USER_KEY);
                    if (token && user) {
                        try {
                            currentUser.value = JSON.parse(user);
                            loadAllData();
                            currentView.value = 'dashboard';
                        } catch { 
                            currentView.value = 'login'; 
                        }
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
                            [
                                medicalStaffModal, departmentModal, trainingUnitModal, rotationModal,
                                onCallModal, absenceModal, communicationsModal, staffProfileModal,
                                userProfileModal, confirmationModal, unitResidentsModal,
                                researchLineModal, clinicalTrialModal, innovationProjectModal,
                                assignCoordinatorModal, exportModal
                            ].forEach(m => { if (m.show) m.show = false; });
                        }
                    });

                    onUnmounted(() => {
                        clearInterval(statusInterval);
                        clearInterval(timeInterval);
                    });
                });

                // ============ RETURN ============
                return {
                    // State
                    currentUser, loginForm, loginLoading, loading, saving, loadingSchedule, isLoadingStatus, loadingAnalytics,
                    currentView, sidebarCollapsed, mobileMenuOpen, userMenuOpen, statsSidebarOpen, globalSearchQuery,

                    // Data
                    medicalStaff, departments, trainingUnits, rotations, absences, onCallSchedule, announcements,
                    researchLines, clinicalTrials, innovationProjects,

                    // Analytics Data
                    researchDashboard, researchLinesPerformance, partnerCollaborations, 
                    trialsTimeline, analyticsSummary, staffResearchProfile,

                    // Live Status
                    clinicalStatus, recentStatuses, newStatusText, selectedAuthorId, expiryHours,
                    activeMedicalStaff, liveStatsEditMode,

                    // UI
                    quickStatus, currentTime, systemStats, todaysOnCall, todaysOnCallCount,
                    toasts, systemAlerts,

                    // Sort
                    sortState, sortBy, sortIcon,

                    // Pagination
                    pagination, goToPage,
                    staffTotalPages, rotationTotalPages, oncallTotalPages, absenceTotalPages, trialTotalPages,

                    // Validation
                    fieldErrors, clearFieldError,

                    // Filters
                    staffFilters, onCallFilters, rotationFilters, absenceFilters,
                    trainingUnitFilters, departmentFilters, communicationsFilters,
                    trialFilters, projectFilters, researchLineFilters,

                    // Modals
                    staffProfileModal, unitResidentsModal, medicalStaffModal, communicationsModal,
                    onCallModal, rotationModal, trainingUnitModal, absenceModal, departmentModal,
                    userProfileModal, confirmationModal, assignCoordinatorModal,
                    researchLineModal, clinicalTrialModal, innovationProjectModal,
                    exportModal,

                    // Date helpers
                    normalizeDate, formatDate, formatDateShort, formatDatePlusDays,
                    formatRelativeDate, getTomorrow, formatTime, formatRelativeTime, 
                    formatTimeAgo, getInitials, formatDateTime: EnhancedUtils.formatDateTime,

                    // Formatters
                    formatStaffType, getStaffTypeClass, formatEmploymentStatus, formatAbsenceReason,
                    formatRotationStatus, getUserRoleDisplay,
                    getCurrentViewTitle, getCurrentViewSubtitle, getSearchPlaceholder,

                    // Data helpers
                    getDepartmentName, getStaffName, getTrainingUnitName, getSupervisorName,
                    getPhysicianName, getResidentName, getDepartmentUnits, getDepartmentStaffCount,
                    getCurrentRotationForStaff, calculateAbsenceDuration,
                    getResearchLineName, getClinicianResearchLines,
                    getUnitActiveRotationCount, getDaysRemaining, getDaysUntilStart,

                    // Profile helpers
                    isOnCallToday, getUpcomingOnCall, getUpcomingLeave, getRotationHistory,
                    getRotationDaysLeft, hasProfessionalCredentials, getCurrentRotationSupervisor,

                    // Status helpers
                    getStatusLocation, isStatusExpired, getStatusBadgeClass,
                    calculateTimeRemaining, refreshStatus, setQuickStatus,
                    formatAudience, showCreateStatusModal, saveClinicalStatus,
                    loadClinicalStatus, loadActiveMedicalStaff,

                    // Analytics helpers
                    loadResearchDashboard, loadResearchLinesPerformance, loadPartnerCollaborations,
                    loadTrialsTimeline, loadAnalyticsSummary, handleExport,

                    // UI helpers
                    getStaffTypeIcon, calculateCapacityPercent, getAbsenceReasonIcon,
                    getPreviewCardClass, getPreviewIcon, getPreviewReasonText,
                    getPreviewStatusClass, getPreviewStatusText, updatePreview,

                    // Auth
                    handleLogin, handleLogout,

                    // Navigation
                    switchView, toggleStatsSidebar, handleGlobalSearch, dismissAlert,

                    // Show modals
                    showAddMedicalStaffModal, showAddDepartmentModal, showAddTrainingUnitModal,
                    showAddRotationModal, showAddOnCallModal, showAddAbsenceModal,
                    showCommunicationsModal, showUserProfileModal,
                    showAddResearchLineModal, showAddTrialModal, showAddProjectModal,
                    openAssignCoordinatorModal, showExportModal,

                    // View/Edit
                    viewStaffDetails, viewUnitResidents, viewDepartmentStaff,
                    editMedicalStaff, editDepartment, editTrainingUnit, editRotation,
                    editOnCallSchedule, editAbsence,
                    editResearchLine, editTrial, editProject,

                    // Actions
                    contactPhysician, viewAnnouncement, requestFullDossier,
                    saveCoordinatorAssignment,formatResidentCategorySimple,
    formatResidentCategoryDetailed,
    getResidentCategoryIcon,
    getResidentCategoryTooltip,

                    // Save
                    saveMedicalStaff, saveDepartment, saveTrainingUnit, saveRotation,
                    saveOnCallSchedule, saveAbsence, saveCommunication, saveUserProfile,
                    saveResearchLine, saveClinicalTrial, saveInnovationProject,

                    // Delete
                    deleteMedicalStaff, deleteRotation, deleteOnCallSchedule, deleteAbsence,
                    deleteAnnouncement, deleteClinicalStatus,
                    deleteResearchLine, deleteClinicalTrial, deleteInnovationProject,

                    // Confirmation
                    showToast, removeToast, showConfirmation, confirmAction, cancelConfirmation,

                    // Permissions
                    hasPermission,

                    // Computed / filtered
                    filteredMedicalStaff, filteredMedicalStaffAll,
                    filteredOnCallSchedules, filteredOnCallAll,
                    filteredRotations, filteredRotationsAll,
                    filteredAbsences, filteredAbsencesAll,
                    filteredTrainingUnits, filteredDepartments,
                    filteredTrials, filteredTrialsAll, filteredProjects,
                    filteredResearchLines,
                    recentAnnouncements, activeAlertsCount, currentTimeFormatted,

                    // Computed lists
                    availablePhysicians, availableResidents, availableAttendings,
                    availableHeadsOfDepartment, availableReplacementStaff,
                    unreadAnnouncements, formattedExpiry,

                    // Chart helpers
                    getPhaseColor: EnhancedUtils.getPhaseColor,
                    getStageColor: EnhancedUtils.getStageColor,
                    formatPercentage: EnhancedUtils.formatPercentage
                };
            }
        });

        app.mount('#app');

    } catch (error) {
        document.body.innerHTML = `
            <div style="padding:40px;text-align:center;margin-top:100px;color:#333;font-family:Arial,sans-serif;">
                <h2 style="color:#dc3545;">⚠️ Application Error</h2>
                <p style="margin:20px 0;color:#666;">The application failed to load. Please refresh the page.</p>
                <button onclick="window.location.reload()"
                        style="padding:12px 24px;background:#007bff;color:white;border:none;border-radius:6px;cursor:pointer;">
                    🔄 Refresh Page
                </button>
            </div>`;
        throw error;
    }
});
