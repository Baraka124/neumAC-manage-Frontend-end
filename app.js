// app.js - COMPLETE VERSION
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
    <div class="app-container">
      <!-- Login Screen -->
      <div v-if="currentView === 'login'" class="login-container">
        <div class="lc-bg">
          <div class="lc-orb lc-orb--1"></div>
          <div class="lc-orb lc-orb--2"></div>
          <div class="lc-orb lc-orb--3"></div>
          <div class="lc-grid"></div>
        </div>
        <div class="login-card">
          <div class="lc-brand">
            <div class="lc-brand-logo">
              <svg class="lc-neumax-svg" width="108" height="32" viewBox="0 0 108 32" fill="none">
                <path d="M16 0L32 16L16 32L0 16L16 0Z" fill="#00B3B3"/>
                <text x="38" y="22" fill="#04111f" font-size="14" font-weight="600">neuMAC</text>
              </svg>
              <div class="lc-brand-divider"></div>
              <div class="lc-brand-area">
                <span>Pulmonology</span>
                <span>Management System</span>
              </div>
            </div>
          </div>
          
          <div class="lc-product">
            <div class="lc-product-name">Neumo<span>Care</span></div>
            <div class="lc-product-sub">Clinical Operations Platform</div>
          </div>
          
          <div class="lc-sep"></div>
          
          <div v-if="loginError" class="login-error">
            <i class="fas fa-exclamation-circle"></i>
            <span>{{ loginError }}</span>
          </div>
          
          <form @submit.prevent="handleLogin" class="lc-form">
            <div class="lc-field" :class="{ 'lc-field--error': loginFieldErrors.email }">
              <label class="lc-label">Email address</label>
              <div class="lc-input-wrap">
                <i class="fas fa-envelope lc-input-icon"></i>
                <input type="email" class="lc-input" v-model="loginForm.email" placeholder="name@hospital.com" required />
              </div>
              <div class="lc-field-err" v-if="loginFieldErrors.email">{{ loginFieldErrors.email }}</div>
            </div>
            
            <div class="lc-field" :class="{ 'lc-field--error': loginFieldErrors.password }">
              <label class="lc-label">Password</label>
              <div class="lc-input-wrap">
                <i class="fas fa-lock lc-input-icon"></i>
                <input :type="showPassword ? 'text' : 'password'" class="lc-input" v-model="loginForm.password" placeholder="••••••••" required />
                <button type="button" class="lc-eye" @click="showPassword = !showPassword">
                  <i :class="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
                </button>
              </div>
              <div class="lc-field-err" v-if="loginFieldErrors.password">{{ loginFieldErrors.password }}</div>
            </div>
            
            <div class="lc-meta-row">
              <label class="lc-remember">
                <input type="checkbox" v-model="loginForm.remember_me" />
                <span>Remember me</span>
              </label>
              <a href="#" class="lc-forgot">Forgot password?</a>
            </div>
            
            <button type="submit" class="lc-submit" :disabled="loginLoading">
              <span>Sign in</span>
              <i class="fas fa-arrow-right lc-submit-arrow"></i>
            </button>
          </form>
        </div>
      </div>

      <!-- Main App Layout -->
      <div v-else class="app-layout">
        <!-- Sidebar -->
        <div class="sidebar" :class="{ 'sidebar-collapsed': uiStore.sidebarCollapsed }">
          <div class="sidebar-header">
            <div class="sidebar-logo">
              <svg class="sb-neumax-svg" width="80" height="28" viewBox="0 0 80 28" fill="none">
                <path d="M14 0L28 14L14 28L0 14L14 0Z" fill="#00B3B3"/>
                <text x="32" y="20" fill="white" font-size="13" font-weight="600">neuMAC</text>
              </svg>
            </div>
            <button class="sidebar-toggle" @click="uiStore.toggleSidebar()">
              <i class="fas fa-bars"></i>
            </button>
          </div>
          
          <div class="sidebar-dept-ctx" v-if="userStore.currentUser?.department">
            <div class="sidebar-dept-dot"></div>
            <div>
              <div class="sidebar-dept-name">{{ userStore.currentUser?.department?.name || 'Pulmonology' }}</div>
              <div class="sidebar-dept-sub">{{ userStore.currentUser?.department?.code || 'PULM' }}</div>
            </div>
          </div>
          
          <div class="sidebar-nav">
            <div class="sidebar-section">
              <div class="sidebar-section-title">CLINICAL</div>
              <ul class="sidebar-menu">
                <li @click="switchView('dashboard')" class="sidebar-menu-link" :class="{ active: currentView === 'dashboard' }" data-tooltip="Dashboard">
                  <i class="fas fa-chart-line"></i><span>Dashboard</span>
                </li>
                <li @click="switchView('medical_staff')" class="sidebar-menu-link" :class="{ active: currentView === 'medical_staff' }" data-tooltip="Medical Staff">
                  <i class="fas fa-user-md"></i><span>Medical Staff</span>
                </li>
                <li @click="switchView('resident_rotations')" class="sidebar-menu-link" :class="{ active: currentView === 'resident_rotations' }" data-tooltip="Rotations">
                  <i class="fas fa-exchange-alt"></i><span>Rotations</span>
                </li>
                <li @click="switchView('oncall_schedule')" class="sidebar-menu-link" :class="{ active: currentView === 'oncall_schedule' }" data-tooltip="On-Call">
                  <i class="fas fa-phone-alt"></i><span>On-Call</span>
                </li>
                <li @click="switchView('training_units')" class="sidebar-menu-link" :class="{ active: currentView === 'training_units' }" data-tooltip="Training Units">
                  <i class="fas fa-hospital"></i><span>Clinical Units</span>
                </li>
                <li @click="switchView('staff_absence')" class="sidebar-menu-link" :class="{ active: currentView === 'staff_absence' }" data-tooltip="Absences">
                  <i class="fas fa-calendar-minus"></i><span>Absences</span>
                </li>
              </ul>
            </div>
            
            <div class="sidebar-section">
              <div class="sidebar-section-title">RESEARCH</div>
              <ul class="sidebar-menu">
                <li @click="switchView('research_hub')" class="sidebar-menu-link" :class="{ active: currentView === 'research_hub' }" data-tooltip="Research Hub">
                  <i class="fas fa-flask"></i><span>Research Hub</span>
                </li>
                <li @click="switchView('news')" class="sidebar-menu-link" :class="{ active: currentView === 'news' }" data-tooltip="News">
                  <i class="fas fa-newspaper"></i><span>News & Posts</span>
                </li>
              </ul>
            </div>
          </div>
          
          <div class="sidebar-footer">
            <div class="sidebar-user" @click="showUserProfileModal">
              <div class="sidebar-user-avatar">{{ getInitials(userStore.currentUser?.full_name || 'User') }}</div>
              <div class="user-info" v-if="!uiStore.sidebarCollapsed">
                <div class="user-name">{{ userStore.currentUser?.full_name?.split(' ')[0] || 'User' }}</div>
                <div class="user-role">{{ formatUserRole(userStore.currentUser?.user_role) }}</div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Main Content -->
        <div class="main-content" :class="{ 'main-content-expanded': uiStore.sidebarCollapsed }">
          <!-- Top Navbar -->
          <div class="top-navbar">
            <div class="navbar-left">
              <button class="mobile-menu-toggle" @click="uiStore.mobileMenuOpen = !uiStore.mobileMenuOpen">
                <i class="fas fa-bars"></i>
              </button>
              <div class="navbar-title-block">
                <div class="navbar-title">{{ getCurrentViewTitle() }}</div>
                <div class="navbar-subtitle">{{ getCurrentViewSubtitle() }}</div>
              </div>
            </div>
            <div class="navbar-right">
              <div class="search-container">
                <div class="search-box">
                  <i class="fas fa-search search-icon"></i>
                  <input type="text" class="search-input" v-model="uiStore.globalSearchQuery" @input="handleGlobalSearch" placeholder="Search staff, units, research..." />
                </div>
                <div class="search-results-dropdown" v-if="uiStore.searchResultsOpen && globalSearchResults.length">
                  <div v-for="result in globalSearchResults" :key="result.label" class="search-result-item" @click="result.action">
                    <i :class="result.icon"></i>
                    <div class="search-result-text">
                      <div class="search-result-name">{{ result.label }}</div>
                      <div class="search-result-meta">{{ result.sub }}</div>
                    </div>
                  </div>
                  <div v-if="!globalSearchResults.length && uiStore.globalSearchQuery.length > 1" class="search-no-results">
                    No results found for "{{ uiStore.globalSearchQuery }}"
                  </div>
                </div>
              </div>
              
              <div class="navbar-user" style="position: relative;">
                <button class="navbar-user-btn" @click="uiStore.userMenuOpen = !uiStore.userMenuOpen">
                  <div class="navbar-user-avatar">{{ getInitials(userStore.currentUser?.full_name || 'U') }}</div>
                  <i class="fas fa-chevron-down" style="font-size: 10px; margin-left: 5px;"></i>
                </button>
                <div class="user-dropdown" v-if="uiStore.userMenuOpen">
                  <button @click="showUserProfileModal"><i class="fas fa-user"></i> Profile</button>
                  <button @click="handleLogout"><i class="fas fa-sign-out-alt"></i> Logout</button>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Content Area -->
          <div class="content-area">
            <!-- Dashboard View -->
            <div v-if="currentView === 'dashboard'" class="content-view-enter">
              <div class="db-greeting">
                <div class="db-greeting-left">
                  <div class="db-greeting-time">{{ formatTime(currentTime) }} · {{ currentTime.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) }}</div>
                  <div class="db-greeting-title">Good {{ currentTime.getHours() < 12 ? 'morning' : currentTime.getHours() < 18 ? 'afternoon' : 'evening' }}, <span>{{ userStore.currentUser?.full_name?.split(' ')[0] || 'Doctor' }}</span></div>
                  <div class="db-greeting-subtitle">Welcome to the Pulmonology Clinical Operations Platform</div>
                </div>
                <div class="db-quick-actions">
                  <button class="db-qa-btn" @click="showAddMedicalStaffModal()"><i class="fas fa-user-plus"></i> Add Staff</button>
                  <div class="db-qa-divider"></div>
                  <button class="db-qa-btn" @click="showAddRotationModal()"><i class="fas fa-calendar-plus"></i> Add Rotation</button>
                  <div class="db-qa-divider"></div>
                  <button class="db-qa-btn" @click="showAddOnCallModal()"><i class="fas fa-phone-alt"></i> Schedule On-Call</button>
                </div>
              </div>
              
              <div class="stats-grid">
                <div class="stat-card" @click="switchView('medical_staff')">
                  <div class="stat-header">
                    <h3>Medical Staff</h3>
                    <i class="fas fa-user-md"></i>
                  </div>
                  <div class="stat-main-value">{{ systemStats.activeAttending + systemStats.activeResidents }}</div>
                  <div class="stat-breakdown">
                    <div class="breakdown-item"><span class="label">Attending Physicians</span><span class="value">{{ systemStats.activeAttending }}</span></div>
                    <div class="breakdown-item"><span class="label">Medical Residents</span><span class="value">{{ systemStats.activeResidents }}</span></div>
                  </div>
                </div>
                
                <div class="stat-card" @click="switchView('oncall_schedule')">
                  <div class="stat-header">
                    <h3>On-Call Today</h3>
                    <i class="fas fa-phone-alt"></i>
                  </div>
                  <div class="stat-main-value">{{ systemStats.onCallNow }}</div>
                  <div class="stat-breakdown">
                    <div class="breakdown-item" v-for="call in todaysOnCall.slice(0, 2)" :key="call.id">
                      <span class="label">{{ call.physicianName?.split(' ').pop() || 'Physician' }}</span>
                      <span class="value">{{ call.startTime }}–{{ call.endTime }}</span>
                    </div>
                    <div v-if="!todaysOnCall.length" class="breakdown-item"><span class="label">No on-call scheduled</span><span class="value">—</span></div>
                  </div>
                </div>
                
                <div class="stat-card" @click="switchView('resident_rotations')">
                  <div class="stat-header">
                    <h3>Active Rotations</h3>
                    <i class="fas fa-exchange-alt"></i>
                  </div>
                  <div class="stat-main-value">{{ systemStats.activeRotations }}</div>
                  <div class="stat-breakdown">
                    <div class="breakdown-item"><span class="label">Ending this week</span><span class="value" :class="{ 'text-red-600': systemStats.endingThisWeek > 0 }">{{ systemStats.endingThisWeek }}</span></div>
                    <div class="breakdown-item"><span class="label">Starting next week</span><span class="value">{{ systemStats.startingNextWeek }}</span></div>
                  </div>
                </div>
                
                <div class="stat-card" @click="switchView('staff_absence')">
                  <div class="stat-header">
                    <h3>On Leave</h3>
                    <i class="fas fa-calendar-minus"></i>
                  </div>
                  <div class="stat-main-value">{{ systemStats.onLeaveStaff }}</div>
                  <div class="stat-breakdown">
                    <div class="breakdown-item"><span class="label">Currently absent</span><span class="value">{{ systemStats.onLeaveStaff }}</span></div>
                    <div class="breakdown-item"><span class="label">Coverage gaps</span><span class="value">{{ absenceStore.absences.filter(a => !a.covering_staff_id && a.current_status !== 'cancelled').length }}</span></div>
                  </div>
                </div>
              </div>
              
              <div class="dbr-strip" v-if="dailyBriefing.length">
                <div class="dbr-label"><i class="fas fa-bell"></i> Daily Briefing</div>
                <div class="dbr-items">
                  <div v-for="item in dailyBriefing" :key="item.text" class="dbr-item" :class="'dbr-item--' + item.type" @click="switchView(item.action)">
                    <i :class="item.icon"></i>
                    <span class="dbr-text">{{ item.text }}</span>
                    <i class="fas fa-arrow-right dbr-arrow"></i>
                  </div>
                </div>
              </div>
              
              <div class="db-kpi-bar">
                <div class="db-kpi db-kpi--teal" @click="switchView('training_units')">
                  <div class="db-kpi-icon db-kpi-icon--teal"><i class="fas fa-hospital"></i></div>
                  <div class="db-kpi-body">
                    <div class="db-kpi-val">{{ trainingStore.trainingUnits.length }}</div>
                    <div class="db-kpi-label">Clinical Units</div>
                    <div class="db-kpi-sub">
                      <span class="db-kpi-dot db-kpi-dot--ok"></span> {{ trainingStore.trainingUnits.filter(u => u.unit_status === 'active').length }} active
                    </div>
                  </div>
                </div>
                
                <div class="db-kpi db-kpi--navy" @click="switchView('research_hub')">
                  <div class="db-kpi-icon db-kpi-icon--navy"><i class="fas fa-flask"></i></div>
                  <div class="db-kpi-body">
                    <div class="db-kpi-val">{{ researchStore.researchLines.length }}</div>
                    <div class="db-kpi-label">Research Lines</div>
                    <div class="db-kpi-sub">
                      <span class="db-kpi-dot db-kpi-dot--blue"></span> {{ researchStore.clinicalTrials.length }} active studies
                    </div>
                  </div>
                </div>
                
                <div class="db-kpi db-kpi--amber" @click="switchView('resident_rotations')">
                  <div class="db-kpi-icon db-kpi-icon--amber"><i class="fas fa-calendar-week"></i></div>
                  <div class="db-kpi-body">
                    <div class="db-kpi-val">{{ rotationStore.scheduledRotations }}</div>
                    <div class="db-kpi-label">Scheduled Rotations</div>
                    <div class="db-kpi-sub">Next 30 days</div>
                  </div>
                </div>
                
                <div class="db-kpi db-kpi--indigo" @click="showCommunicationsModal">
                  <div class="db-kpi-icon db-kpi-icon--indigo"><i class="fas fa-bullhorn"></i></div>
                  <div class="db-kpi-body">
                    <div class="db-kpi-val">{{ announcements.length }}</div>
                    <div class="db-kpi-label">Announcements</div>
                    <div class="db-kpi-sub">
                      <span class="db-kpi-dot db-kpi-dot--purple"></span> {{ announcements.filter(a => !a.read_at).length }} unread
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="db-content-grid">
                <div class="card db-content-card">
                  <div class="db-cc-head">
                    <div class="db-cc-title"><i class="fas fa-phone-alt"></i> On-Call This Week</div>
                    <button class="db-cc-link" @click="switchView('oncall_schedule')">View all <i class="fas fa-arrow-right"></i></button>
                  </div>
                  <div class="db-oc-list">
                    <div v-for="day in onCallStore.upcomingOnCallDays.slice(0, 5)" :key="day.date" class="db-oc-row">
                      <div class="db-oc-date" :class="{ 'db-oc-date--today': day.isToday }">{{ day.label }}</div>
                      <div class="db-oc-slot" :class="{ 'db-oc-slot--gap': !day.primary }">
                        <div v-if="day.primary" class="db-oc-info">
                          <div class="db-oc-name">{{ getPhysicianName(day.primary?.primary_physician_id) }}</div>
                          <div class="db-oc-time">{{ day.primary?.start_time?.substring(0,5) }}–{{ day.primary?.end_time?.substring(0,5) }}</div>
                        </div>
                        <div v-else class="db-oc-gap">
                          <i class="fas fa-exclamation-triangle"></i> No primary assigned
                          <span class="db-oc-assign" @click.stop="showAddOnCallModal()">Assign</span>
                        </div>
                      </div>
                      <div v-if="day.backup" class="db-oc-slot db-oc-slot--backup">
                        <div class="db-oc-info">
                          <div class="db-oc-name">{{ getPhysicianName(day.backup?.backup_physician_id) }}</div>
                          <div class="db-oc-time">Backup</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div class="card db-content-card">
                  <div class="db-cc-head">
                    <div class="db-cc-title"><i class="fas fa-exchange-alt"></i> Rotations</div>
                    <button class="db-cc-link" @click="switchView('resident_rotations')">View all <i class="fas fa-arrow-right"></i></button>
                  </div>
                  <div class="db-rot-list">
                    // CORRECT - use computed property directly
                    <div v-for="rot in (rotationStore.activeRotations || []).slice(0, 4)" :key="rot.id" class="db-rot-row" @click="viewRotationDetails(rot)">
                      <div class="db-rot-avatar" :class="{ 'db-rot-avatar--start': getRotationProgress(rot).daysLeft <= 7 }">{{ getInitials(getResidentName(rot.resident_id)) }}</div>
                      <div class="db-rot-info">
                        <div class="db-rot-name">{{ getResidentShortName(rot.resident_id) }}</div>
                        <div class="db-rot-unit">{{ getTrainingUnitName(rot.training_unit_id) }}</div>
                      </div>
                      <div class="db-rot-chip" :class="{ 'db-rot-chip--ending': getRotationProgress(rot).daysLeft <= 7, 'db-rot-chip--starting': getRotationProgress(rot).daysLeft > 7 }">
                        {{ getRotationProgress(rot).label }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="card db-content-card db-content-card--full" v-if="residentGapWarnings.length">
                <div class="db-cc-head">
                  <div class="db-cc-title"><i class="fas fa-exclamation-triangle"></i> Resident Rotation Gaps</div>
                  <button class="db-cc-link" @click="switchView('resident_rotations')">Schedule rotations <i class="fas fa-arrow-right"></i></button>
                </div>
                <div class="db-gap-grid">
                  <div v-for="resident in residentGapWarnings" :key="resident.id" class="db-gap-item" @click="showAddRotationModal({ id: resident.id, full_name: resident.name })">
                    <div class="db-gap-avatar">{{ getInitials(resident.name) }}</div>
                    <div class="db-gap-info">
                      <div class="db-gap-name">{{ resident.name }}</div>
                      <div class="db-gap-year">{{ formatTrainingYear(resident.year) }}</div>
                    </div>
                    <div class="db-gap-pills">
                      <span v-for="gap in resident.gaps.slice(0, 2)" :key="gap" class="db-gap-pill">{{ gap }}</span>
                      <span v-if="resident.gaps.length > 2" class="db-gap-pill">+{{ resident.gaps.length - 2 }}</span>
                    </div>
                    <i class="fas fa-plus db-gap-add"></i>
                  </div>
                </div>
              </div>
            </div>

            <!-- Medical Staff View -->
            <div v-if="currentView === 'medical_staff'" class="content-view-enter">
              <div class="filter-bar">
                <input type="text" class="form-control" v-model="staffFilters.search" placeholder="Search by name, email, or license..." />
                <select class="form-select" v-model="staffFilters.staffType">
                  <option value="">All Types</option>
                  <option value="attending_physician">Attending Physician</option>
                  <option value="medical_resident">Medical Resident</option>
                  <option value="fellow">Fellow</option>
                  <option value="nurse_practitioner">Nurse Practitioner</option>
                </select>
                <select class="form-select" v-model="staffFilters.department">
                  <option value="">All Departments</option>
                  <option v-for="dept in departments" :key="dept.id" :value="dept.id">{{ dept.name }}</option>
                </select>
                <select class="form-select" v-model="staffFilters.status">
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="on_leave">On Leave</option>
                  <option value="inactive">Inactive</option>
                </select>
                <button class="btn btn-primary" @click="showAddMedicalStaffModal()"><i class="fas fa-plus"></i> Add Staff</button>
              </div>
              
              <div class="view-toggle" style="margin-bottom: 16px;">
                <button class="btn-pill" :class="{ active: staffView === 'table' }" @click="staffView = 'table'"><i class="fas fa-table"></i> Table</button>
                <button class="btn-pill" :class="{ active: staffView === 'compact' }" @click="staffView = 'compact'"><i class="fas fa-th"></i> Compact</button>
              </div>
              
              <!-- Table View -->
              <div v-if="staffView === 'table'" class="table-responsive">
                <table class="table table-staff">
                  <thead>
                    <tr>
                      <th @click="sortBy('medical_staff', 'full_name')">Name <i :class="sortIcon('medical_staff', 'full_name')"></i></th>
                      <th @click="sortBy('medical_staff', 'staff_type')">Type <i :class="sortIcon('medical_staff', 'staff_type')"></i></th>
                      <th>Department</th>
                      <th @click="sortBy('medical_staff', 'employment_status')">Status <i :class="sortIcon('medical_staff', 'employment_status')"></i></th>
                      <th>Rotation</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="staff in filteredMedicalStaff" :key="staff.id" class="staff-table-row" :class="{ 'row-inactive': staff.employment_status === 'inactive', 'row-on_leave': staff.employment_status === 'on_leave', 'row-active': staff.employment_status === 'active' }" @click="viewStaffDetails(staff)">
                      <td>
                        <div class="staff-name-cell">
                          <div class="staff-table-av" :class="'staff-table-av--' + (staff.employment_status === 'on_leave' ? 'leave' : (staff.staff_type === 'attending_physician' ? 'attending' : 'resident'))">
                            {{ getInitials(staff.full_name) }}
                          </div>
                          <div class="staff-name-block">
                            <div class="staff-name-primary">{{ staff.full_name }}</div>
                            <div class="staff-name-sub" v-if="staff.specialization || staff.medical_license">
                              <span v-if="staff.specialization">{{ staff.specialization }}</span>
                              <span v-if="staff.specialization && staff.medical_license"> • </span>
                              <span v-if="staff.medical_license">{{ staff.medical_license }}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td><span class="badge" :class="getStaffTypeClass(staff.staff_type)">{{ formatStaffType(staff.staff_type) }}</span></td>
                      <td>{{ getDepartmentName(staff.department_id) || '—' }}</td>
                      <td>
                        <span class="status-indicator" :class="'status-' + staff.employment_status">
                          <span class="status-active-dot" v-if="staff.employment_status === 'active'"></span>
                          {{ formatEmploymentStatus(staff.employment_status) }}
                        </span>
                      </td>
                      <td>
                        <div v-if="isResidentType(staff.staff_type) && getCurrentRotationForStaff(staff.id)" class="staff-rotation-chip" @click.stop="viewRotationDetails(getCurrentRotationForStaff(staff.id))">
                          <span class="src-dot"></span>
                          <span class="src-unit">{{ getTrainingUnitName(getCurrentRotationForStaff(staff.id).training_unit_id) }}</span>
                          <span class="src-dur">{{ getRotationDaysLeft(staff.id) }}d left</span>
                        </div>
                        <div v-else-if="isResidentType(staff.staff_type)" class="text-gray-400">—</div>
                        <div v-else class="text-gray-400">—</div>
                      </td>
                      <td class="table-actions" @click.stop>
                        <button class="btn-icon" @click="editMedicalStaff(staff)" title="Edit"><i class="fas fa-edit"></i></button>
                        <button class="btn-icon" @click="deleteMedicalStaff(staff)" title="Delete"><i class="fas fa-trash"></i></button>
                      </td>
                    </tr>
                    <tr v-if="!filteredMedicalStaff.length">
                      <td colspan="6">
                        <div class="empty-state">
                          <i class="fas fa-users empty-state-icon"></i>
                          <div class="empty-state-title">No staff members found</div>
                          <div class="empty-state-description">Try adjusting your filters or add a new staff member.</div>
                          <button class="btn btn-primary mt-2" @click="showAddMedicalStaffModal()">Add Staff Member</button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <!-- Compact View -->
              <div v-if="staffView === 'compact'" class="scc-grid">
                <template v-for="item in staffStore.compactStaffWithDividers" :key="item.id || item._divider">
                  <div v-if="item._divider" class="scc-section-divider">{{ item._divider }}</div>
                  <div v-else class="scc" :class="{ 'scc--inactive': item.employment_status === 'inactive', 'scc--leave': item.employment_status === 'on_leave' }" @click="viewStaffDetails(item)">
                    <div class="scc-avatar" :class="'scc-avatar--' + (item.employment_status === 'on_leave' ? 'leave' : item.staff_type)">
                      <span class="scc-initials">{{ getInitials(item.full_name) }}</span>
                      <span class="scc-dot" :class="'scc-dot--' + item.employment_status"></span>
                    </div>
                    <div class="scc-body">
                      <div class="scc-name-row">
                        <div class="scc-name">{{ item.full_name }}</div>
                        <i v-if="item.resident_category === 'external_resident'" class="fas fa-globe scc-warn" title="External resident"></i>
                      </div>
                      <div class="scc-meta-row">
                        <span class="badge scc-type-badge" :class="getStaffTypeClass(item.staff_type)">{{ formatStaffTypeShort(item.staff_type) }}</span>
                        <span v-if="isResidentType(item.staff_type) && item.resident_category" class="scc-cat-pill" :class="'scc-cat--' + item.resident_category.split('_')[0]">
                          {{ formatResidentCategorySimple(item.resident_category) }}
                        </span>
                        <span class="scc-dept-text">{{ getDepartmentName(item.department_id)?.split(' ').slice(0,2).join(' ') || '—' }}</span>
                      </div>
                      <div class="scc-rotation-row" v-if="isResidentType(item.staff_type)">
                        <div v-if="getCurrentRotationForStaff(item.id)" class="staff-rotation-chip" @click.stop="viewRotationDetails(getCurrentRotationForStaff(item.id))">
                          <span class="src-dot"></span>
                          <span class="src-unit">{{ getTrainingUnitName(getCurrentRotationForStaff(item.id).training_unit_id) }}</span>
                        </div>
                      </div>
                    </div>
                    <div class="scc-actions" @click.stop>
                      <button class="rot-action-btn" @click="editMedicalStaff(item)" title="Edit"><i class="fas fa-edit"></i></button>
                      <button class="rot-action-btn rot-action-btn--danger" @click="deleteMedicalStaff(item)" title="Delete"><i class="fas fa-trash"></i></button>
                    </div>
                  </div>
                </template>
              </div>
              
              <div class="pagination" v-if="staffTotalPages > 1">
                <button class="btn btn-secondary btn-sm" @click="goToPage('medical_staff', pagination.medical_staff.page - 1)" :disabled="pagination.medical_staff.page === 1">Previous</button>
                <span class="pagination-info">Page {{ pagination.medical_staff.page }} of {{ staffTotalPages }}</span>
                <button class="btn btn-secondary btn-sm" @click="goToPage('medical_staff', pagination.medical_staff.page + 1)" :disabled="pagination.medical_staff.page === staffTotalPages">Next</button>
              </div>
            </div>

            <!-- Rotations View -->
            <div v-if="currentView === 'resident_rotations'" class="content-view-enter">
              <div class="filter-bar">
                <input type="text" class="form-control" v-model="rotationFilters.search" placeholder="Search resident..." />
                <select class="form-select" v-model="rotationFilters.status">
                  <option value="">All Status</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                </select>
                <select class="form-select" v-model="rotationFilters.trainingUnit">
                  <option value="">All Units</option>
                  <option v-for="unit in trainingStore.trainingUnits" :key="unit.id" :value="unit.id">{{ unit.unit_name }}</option>
                </select>
                <button class="btn btn-primary" @click="showAddRotationModal()"><i class="fas fa-plus"></i> Add Rotation</button>
              </div>
              
              <div class="view-toggle" style="margin-bottom: 16px;">
                <button class="btn-pill" :class="{ active: rotationView === 'table' }" @click="rotationView = 'table'"><i class="fas fa-table"></i> Table</button>
                <button class="btn-pill" :class="{ active: rotationView === 'timeline' }" @click="rotationView = 'timeline'"><i class="fas fa-chart-line"></i> Timeline</button>
              </div>
              
              <!-- Table View -->
              <div v-if="rotationView === 'table'" class="table-responsive">
                <table class="table">
                  <thead>
                    <tr>
                      <th @click="sortBy('rotations', 'resident_id')">Resident <i :class="sortIcon('rotations', 'resident_id')"></i></th>
                      <th @click="sortBy('rotations', 'training_unit_id')">Unit <i :class="sortIcon('rotations', 'training_unit_id')"></i></th>
                      <th @click="sortBy('rotations', 'start_date')">Start Date <i :class="sortIcon('rotations', 'start_date')"></i></th>
                      <th @click="sortBy('rotations', 'end_date')">End Date <i :class="sortIcon('rotations', 'end_date')"></i></th>
                      <th>Status</th>
                      <th>Progress</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="rot in filteredRotations" :key="rot.id" :class="{ 'row-active': rot.rotation_status === 'active', 'row-scheduled': rot.rotation_status === 'scheduled', 'row-completed': rot.rotation_status === 'completed' }" @click="viewRotationDetails(rot)">
                      <td>{{ getResidentName(rot.resident_id) }}</td>
                      <td>{{ getTrainingUnitName(rot.training_unit_id) }}</td>
                      <td>{{ formatDate(rot.start_date) }}</td>
                      <td>{{ formatDate(rot.end_date) }}</td>
                      <td>
                        <span class="badge" :class="{ 'badge-success': rot.rotation_status === 'active', 'badge-info': rot.rotation_status === 'scheduled', 'badge-secondary': rot.rotation_status === 'completed' }">
                          {{ formatRotationStatus(rot.rotation_status) }}
                        </span>
                      </td>
                      <td>
                        <div class="rot-progress-wrap">
                          <div class="rot-progress-bar">
                            <div class="rot-progress-fill" :class="{ urgent: getRotationProgress(rot).urgent, done: getRotationProgress(rot).done }" :style="{ width: getRotationProgress(rot).pct + '%' }"></div>
                          </div>
                          <div class="rot-days-label" :class="{ urgent: getRotationProgress(rot).urgent }">{{ getRotationProgress(rot).label }}</div>
                        </div>
                      </td>
                      <td class="table-actions" @click.stop>
                        <button class="btn-icon" @click="editRotation(rot)"><i class="fas fa-edit"></i></button>
                        <button class="btn-icon" @click="deleteRotation(rot)"><i class="fas fa-trash"></i></button>
                      </td>
                    </tr>
                    <tr v-if="!filteredRotations.length">
                      <td colspan="7">
                        <div class="empty-state">
                          <i class="fas fa-exchange-alt empty-state-icon"></i>
                          <div class="empty-state-title">No rotations found</div>
                          <div class="empty-state-description">Create a new rotation to get started.</div>
                          <button class="btn btn-primary mt-2" @click="showAddRotationModal()">Add Rotation</button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <!-- Timeline View -->
              <div v-if="rotationView === 'timeline'" class="rot-compact">
                <div class="rot-legend">
                  <div class="rot-legend-item"><div class="rot-legend-dot rot-legend-dot--active"></div> Active</div>
                  <div class="rot-legend-item"><div class="rot-legend-dot rot-legend-dot--scheduled"></div> Scheduled</div>
                  <div class="rot-legend-item"><div class="rot-legend-dot rot-legend-dot--done"></div> Completed</div>
                </div>
                <div v-for="resident in rotationStore.residentsWithRotations" :key="resident.id" class="rot-row">
                  <div class="rot-who">
                    <div class="rot-who-avatar rot-who-avatar--blue"><i class="fas fa-user-graduate"></i></div>
                    <div class="rot-who-info">
                      <div class="rot-who-name">{{ resident.full_name }}</div>
                      <div class="rot-who-meta">{{ effectiveResidentYear(resident) || formatTrainingYear(resident.training_year) || 'Resident' }}</div>
                    </div>
                  </div>
                  <div class="rot-track">
                    <template v-for="(rot, idx) in resident.allRotations" :key="rot.id">
                      <div class="rot-orb" :class="{
                        'rot-orb--active': rot.rotation_status === 'active',
                        'rot-orb--scheduled': rot.rotation_status === 'scheduled',
                        'rot-orb--done': rot.rotation_status === 'completed'
                      }" @click="viewRotationDetails(rot)">
                        <span class="rot-orb-label">{{ getTrainingUnitName(rot.training_unit_id).split(' ').slice(0,2).join(' ') }}</span>
                        <div class="rot-orb-tooltip">
                          <div class="rot-tt-unit">{{ getTrainingUnitName(rot.training_unit_id) }}</div>
                          <div class="rot-tt-dates">{{ formatDateShort(rot.start_date) }} – {{ formatDateShort(rot.end_date) }}</div>
                          <div class="rot-tt-remaining" v-if="rot.rotation_status === 'active'">{{ getRotationDaysLeft(resident.id) }} days left</div>
                          <div class="rot-tt-tag" :class="'rot-tt-tag--' + rot.rotation_status">{{ rot.rotation_status }}</div>
                        </div>
                      </div>
                      <span v-if="idx < resident.allRotations.length - 1" class="rot-connector">→</span>
                    </template>
                    <div v-if="!resident.allRotations.length" class="rot-orb rot-orb--add" @click="showAddRotationModal(resident)">
                      <i class="fas fa-plus"></i>
                    </div>
                  </div>
                  <div class="rot-row-actions">
                    <button class="rot-action-btn" @click="showAddRotationModal(resident)"><i class="fas fa-plus"></i></button>
                  </div>
                </div>
              </div>
              
              <div class="pagination" v-if="rotationTotalPages > 1">
                <button class="btn btn-secondary btn-sm" @click="goToPage('rotations', pagination.rotations.page - 1)" :disabled="pagination.rotations.page === 1">Previous</button>
                <span class="pagination-info">Page {{ pagination.rotations.page }} of {{ rotationTotalPages }}</span>
                <button class="btn btn-secondary btn-sm" @click="goToPage('rotations', pagination.rotations.page + 1)" :disabled="pagination.rotations.page === rotationTotalPages">Next</button>
              </div>
            </div>

            <!-- On-Call View -->
            <div v-if="currentView === 'oncall_schedule'" class="content-view-enter">
              <div class="filter-bar">
                <input type="text" class="form-control" v-model="onCallFilters.search" placeholder="Search physician..." />
                <input type="date" class="form-control" v-model="onCallFilters.date" />
                <select class="form-select" v-model="onCallFilters.shiftType">
                  <option value="">All Shifts</option>
                  <option value="primary_call">Primary Call</option>
                  <option value="backup_call">Backup Call</option>
                </select>
                <button class="btn btn-primary" @click="showAddOnCallModal()"><i class="fas fa-plus"></i> Add Schedule</button>
              </div>
              
              <div class="table-responsive">
                <table class="table table-oncall">
                  <thead>
                    <tr>
                      <th @click="sortBy('oncall', 'duty_date')">Date <i :class="sortIcon('oncall', 'duty_date')"></i></th>
                      <th>Primary Physician</th>
                      <th>Backup Physician</th>
                      <th>Shift</th>
                      <th>Coverage Area</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="schedule in filteredOnCallSchedules" :key="schedule.id" :class="{ 'oc-row-today': isToday(schedule.duty_date), 'row-past': new Date(schedule.duty_date) < new Date() }">
                      <td>
                        <div class="oncall-shift-cell">
                          <div class="oncall-shift-date-row">
                            {{ formatDate(schedule.duty_date) }}
                            <span v-if="isToday(schedule.duty_date)" class="oc-today-tag">Today</span>
                          </div>
                          <div class="oncall-shift-time-row">
                            <span class="oncall-shift-time">{{ schedule.start_time?.substring(0,5) }}</span>
                            <i class="fas fa-arrow-right oncall-shift-arrow"></i>
                            <span class="oncall-shift-time">{{ schedule.end_time?.substring(0,5) }}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div class="oc-physician-cell">
                          <div class="oc-physician-av">{{ getInitials(getPhysicianName(schedule.primary_physician_id)) }}</div>
                          <div class="oc-physician-name">{{ getPhysicianName(schedule.primary_physician_id) }}</div>
                        </div>
                      </td>
                      <td>{{ getPhysicianName(schedule.backup_physician_id) || '—' }}</td>
                      <td>
                        <span class="oc-type-badge" :class="'oc-type-badge--' + schedule.shift_type">
                          {{ schedule.shift_type === 'primary_call' ? 'Primary' : 'Backup' }}
                        </span>
                      </td>
                      <td><span class="badge badge-secondary">{{ schedule.coverage_area || 'General' }}</span></td>
                      <td class="table-actions">
                        <button class="btn-icon" @click="editOnCallSchedule(schedule)"><i class="fas fa-edit"></i></button>
                        <button class="btn-icon" @click="deleteOnCallSchedule(schedule)"><i class="fas fa-trash"></i></button>
                      </td>
                    </tr>
                    <tr v-if="!filteredOnCallSchedules.length">
                      <td colspan="6">
                        <div class="empty-state">
                          <i class="fas fa-phone-slash empty-state-icon"></i>
                          <div class="empty-state-title">No on-call schedules found</div>
                          <div class="empty-state-description">Create a new schedule to cover shifts.</div>
                          <button class="btn btn-primary mt-2" @click="showAddOnCallModal()">Add Schedule</button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <div class="pagination" v-if="oncallTotalPages > 1">
                <button class="btn btn-secondary btn-sm" @click="goToPage('oncall', pagination.oncall.page - 1)" :disabled="pagination.oncall.page === 1">Previous</button>
                <span class="pagination-info">Page {{ pagination.oncall.page }} of {{ oncallTotalPages }}</span>
                <button class="btn btn-secondary btn-sm" @click="goToPage('oncall', pagination.oncall.page + 1)" :disabled="pagination.oncall.page === oncallTotalPages">Next</button>
              </div>
            </div>

            <!-- Training Units View -->
            <div v-if="currentView === 'training_units'" class="content-view-enter">
              <div class="filter-bar">
                <input type="text" class="form-control" v-model="trainingUnitFilters.search" placeholder="Search units by name..." />
                <select class="form-select" v-model="trainingUnitFilters.department">
                  <option value="">All Departments</option>
                  <option v-for="dept in departments" :key="dept.id" :value="dept.id">{{ dept.name }}</option>
                </select>
                <select class="form-select" v-model="trainingUnitFilters.status">
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
                <button class="btn btn-primary" @click="showAddTrainingUnitModal()"><i class="fas fa-plus"></i> Add Unit</button>
              </div>
              
              <div class="training-units-grid">
                <div v-for="unit in filteredTrainingUnits" :key="unit.id" class="tuc" :class="{ 
                  'tuc--active': getUnitActiveRotationCount(unit.id) > 0,
                  'tuc--full': getUnitActiveRotationCount(unit.id) >= unit.maximum_residents,
                  'tuc--warn': getUnitActiveRotationCount(unit.id) >= unit.maximum_residents * 0.7 && getUnitActiveRotationCount(unit.id) < unit.maximum_residents
                }" @click="openUnitDetail(unit)">
                  <div class="tuc-head">
                    <div class="tuc-name-row">
                      <i class="fas fa-hospital tuc-icon"></i>
                      <div>
                        <div class="tuc-name">{{ unit.unit_name }}</div>
                        <div class="tuc-sub">{{ unit.specialty || 'Clinical Unit' }}</div>
                      </div>
                    </div>
                    <div class="tuc-cap-block">
                      <div class="tuc-cap-nums">
                        <span class="tuc-cap-current">{{ getUnitActiveRotationCount(unit.id) }}</span>
                        <span class="tuc-cap-sep">/</span>
                        <span class="tuc-cap-max">{{ unit.maximum_residents }}</span>
                      </div>
                      <div class="tuc-cap-bar">
                        <div class="tuc-cap-fill" :style="{ width: (getUnitActiveRotationCount(unit.id) / unit.maximum_residents * 100) + '%' }"></div>
                      </div>
                    </div>
                  </div>
                  
                  <div class="tuc-meta">
                    <div class="tuc-meta-item"><i class="fas fa-building"></i> {{ getDepartmentName(unit.department_id) || 'No department' }}</div>
                    <div class="tuc-meta-item" v-if="unit.supervising_attending_id"><i class="fas fa-chalkboard-user"></i> {{ getStaffName(unit.supervising_attending_id) }}</div>
                  </div>
                  
                  <div class="tuc-resident-slots">
                    <div v-for="rot in getUnitRotations(unit.id).slice(0, 2)" :key="rot.id" class="tuc-resident-row" :class="{ 'tuc-resident-row--active': rot.rotation_status === 'active' }">
                      <div class="tuc-res-avatar">{{ getInitials(getResidentName(rot.resident_id)) }}</div>
                      <div class="tuc-res-info">
                        <div class="tuc-res-name">{{ getResidentShortName(rot.resident_id) }}</div>
                        <div class="tuc-res-dates">{{ formatDateShort(rot.start_date) }} – {{ formatDateShort(rot.end_date) }}</div>
                      </div>
                    </div>
                    <div v-if="getUnitRotations(unit.id).length === 0" class="tuc-resident-row tuc-resident-row--free">
                      <div class="tuc-res-avatar tuc-res-avatar--free"><i class="fas fa-plus"></i></div>
                      <div class="tuc-res-info">
                        <div class="tuc-res-name">Available slot</div>
                        <div class="tuc-free-chip">Click to assign</div>
                      </div>
                    </div>
                  </div>
                  
                  <div class="tuc-card-footer">
                    <div class="tuc-cap-label">Occupancy</div>
                    <div class="tuc-cap-bar" style="flex:1">
                      <div class="tuc-cap-fill" :style="{ width: (getUnitActiveRotationCount(unit.id) / unit.maximum_residents * 100) + '%' }"></div>
                    </div>
                    <button class="tuc-assign-btn" @click.stop="openAssignRotationFromUnit(unit)"><i class="fas fa-plus"></i> Assign</button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Absences View -->
            <div v-if="currentView === 'staff_absence'" class="content-view-enter">
              <div class="filter-bar">
                <input type="text" class="form-control" v-model="absenceFilters.search" placeholder="Search staff..." />
                <select class="form-select" v-model="absenceFilters.reason">
                  <option value="">All Reasons</option>
                  <option value="vacation">Vacation</option>
                  <option value="sick_leave">Sick Leave</option>
                  <option value="personal">Personal</option>
                  <option value="conference">Conference</option>
                  <option value="training">Training</option>
                </select>
                <select class="form-select" v-model="absenceFilters.status">
                  <option value="">All Status</option>
                  <option value="currently_absent">Currently Absent</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="completed">Completed</option>
                </select>
                <label class="checkbox-label" style="margin-left: auto;">
                  <input type="checkbox" v-model="absenceFilters.hideReturned" /> Hide returned
                </label>
                <button class="btn btn-primary" @click="showAddAbsenceModal()"><i class="fas fa-plus"></i> Add Absence</button>
              </div>
              
              <div class="table-responsive">
                <table class="table">
                  <thead>
                    <tr>
                      <th @click="sortBy('absences', 'staff_member_id')">Staff <i :class="sortIcon('absences', 'staff_member_id')"></i></th>
                      <th @click="sortBy('absences', 'start_date')">Start Date <i :class="sortIcon('absences', 'start_date')"></i></th>
                      <th @click="sortBy('absences', 'end_date')">End Date <i :class="sortIcon('absences', 'end_date')"></i></th>
                      <th>Duration</th>
                      <th>Reason</th>
                      <th>Coverage</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="absence in filteredAbsences" :key="absence.id" :class="{ 
                      'row-currently_absent': absence.current_status === 'currently_absent',
                      'row-upcoming': absence.current_status === 'upcoming',
                      'row-completed': absence.current_status === 'completed',
                      'row-returned': absence.current_status === 'returned_to_duty'
                    }">
                      <td>{{ getStaffName(absence.staff_member_id) }}</td>
                      <td>{{ formatDate(absence.start_date) }}</td>
                      <td>{{ formatDate(absence.end_date) }}</td>
                      <td><span class="abs-duration">{{ calculateAbsenceDuration(absence.start_date, absence.end_date) }} days</span></td>
                      <td><span class="abs-reason-chip">{{ formatAbsenceReason(absence.absence_reason) }}</span></td>
                      <td>
                        <div v-if="absence.covering_staff_id" class="abs-coverage-ok">
                          <i class="fas fa-check-circle"></i> {{ getStaffName(absence.covering_staff_id) }}
                        </div>
                        <div v-else class="abs-coverage-no">
                          <i class="fas fa-exclamation-triangle"></i> Not assigned
                        </div>
                      </td>
                      <td>
                        <span class="abs-status-badge" :class="'abs-status-badge--' + absence.current_status">
                          {{ absence.current_status === 'currently_absent' ? 'On Leave' : absence.current_status }}
                        </span>
                      </td>
                      <td class="table-actions">
                        <button class="btn-icon" @click="editAbsence(absence)"><i class="fas fa-edit"></i></button>
                        <button class="btn-icon" @click="deleteAbsence(absence)"><i class="fas fa-trash"></i></button>
                        <button v-if="absence.current_status === 'currently_absent'" class="btn-icon btn-icon--ok" @click="openResolutionModal(absence)"><i class="fas fa-check"></i></button>
                      </td>
                    </tr>
                    <tr v-if="!filteredAbsences.length">
                      <td colspan="8">
                        <div class="empty-state">
                          <i class="fas fa-calendar-check empty-state-icon"></i>
                          <div class="empty-state-title">No absences recorded</div>
                          <div class="empty-state-description">Add an absence record for staff leave.</div>
                          <button class="btn btn-primary mt-2" @click="showAddAbsenceModal()">Add Absence</button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <div class="pagination" v-if="absencesTotalPages > 1">
                <button class="btn btn-secondary btn-sm" @click="goToPage('absences', pagination.absences.page - 1)" :disabled="pagination.absences.page === 1">Previous</button>
                <span class="pagination-info">Page {{ pagination.absences.page }} of {{ absencesTotalPages }}</span>
                <button class="btn btn-secondary btn-sm" @click="goToPage('absences', pagination.absences.page + 1)" :disabled="pagination.absences.page === absencesTotalPages">Next</button>
              </div>
            </div>

            <!-- Research Hub View -->
            <div v-if="currentView === 'research_hub'" class="content-view-enter">
              <div class="research-hub">
                <div class="rhub-header">
                  <div class="rhub-header-left">
                    <div>
                      <div class="rhub-eyebrow">Research & Innovation</div>
                      <h2 class="rhub-title">Research Hub</h2>
                    </div>
                  </div>
                  <div class="rhub-header-right">
                    <button class="btn btn-primary" @click="showAddResearchLineModal()"><i class="fas fa-plus"></i> Research Line</button>
                    <button class="btn btn-outline" @click="showAddTrialModal()"><i class="fas fa-vial"></i> Add Study</button>
                    <button class="btn btn-outline" @click="showAddProjectModal()"><i class="fas fa-microchip"></i> Add Project</button>
                  </div>
                </div>
                
                <div class="rhub-tabs">
                  <button class="rhub-tab" :class="{ 'rhub-tab--active': researchHubTab === 'lines' }" @click="researchHubTab = 'lines'">
                    <i class="fas fa-chart-line"></i> Lines
                    <span class="rhub-tab-count">{{ researchStore.researchLines.length }}</span>
                  </button>
                  <button class="rhub-tab" :class="{ 'rhub-tab--active': researchHubTab === 'trials' }" @click="researchHubTab = 'trials'">
                    <i class="fas fa-flask"></i> Studies
                    <span class="rhub-tab-count">{{ researchStore.clinicalTrials.length }}</span>
                  </button>
                  <button class="rhub-tab" :class="{ 'rhub-tab--active': researchHubTab === 'projects' }" @click="researchHubTab = 'projects'">
                    <i class="fas fa-microchip"></i> Innovation
                    <span class="rhub-tab-count">{{ researchStore.innovationProjects.length }}</span>
                  </button>
                </div>
                
                <div class="rhub-panel">
                  <!-- Lines Tab -->
                  <div v-if="researchHubTab === 'lines'">
                    <div class="research-lines-grid">
                      <div v-for="line in researchStore.researchLines" :key="line.id" class="rline-card" :class="{ 'rline-card--inactive': !line.active }" @click="openLineDetail(line)">
                        <div class="rline-card-accent" :style="{ background: getLineAccent(line.line_number).bg }"></div>
                        <div class="rline-card-header">
                          <div class="rline-card-header-left">
                            <span class="rline-number-pill">L{{ line.line_number }}</span>
                            <span v-if="!line.active" class="rline-inactive-badge"><i class="fas fa-ban"></i> Inactive</span>
                          </div>
                          <div class="rline-card-actions" @click.stop>
                            <button class="rline-action-btn" @click="editResearchLine(line)"><i class="fas fa-edit"></i></button>
                            <button class="rline-action-btn rline-action-btn--danger" @click="deleteResearchLine(line)"><i class="fas fa-trash"></i></button>
                          </div>
                        </div>
                        <div class="rline-card-name">{{ line.research_line_name || line.name }}</div>
                        <div class="rline-card-description">{{ line.description }}</div>
                        <div class="rline-activity-row">
                          <div class="rline-activity-pill"><i class="fas fa-vial"></i> {{ researchStore.clinicalTrials.filter(t => t.research_line_id === line.id).length }} studies</div>
                          <div class="rline-activity-pill"><i class="fas fa-microchip"></i> {{ researchStore.innovationProjects.filter(p => p.research_line_id === line.id).length }} projects</div>
                        </div>
                        <div class="rline-coord-row">
                          <div class="rline-coord-label">Coordinator</div>
                          <div v-if="line.coordinator_id" class="rline-coord-person">
                            <div class="rline-coord-avatar">{{ getInitials(getStaffName(line.coordinator_id)) }}</div>
                            <div class="rline-coord-info">
                              <div class="rline-coord-name">{{ getStaffName(line.coordinator_id) }}</div>
                              <div class="rline-coord-email">{{ getStaffEmail(line.coordinator_id) }}</div>
                            </div>
                            <button class="rline-coord-change" @click.stop="openAssignCoordinatorModal(line)"><i class="fas fa-exchange-alt"></i></button>
                          </div>
                          <div v-else class="rline-coord-empty">
                            <i class="fas fa-user-slash"></i> Not assigned
                            <button class="rline-coord-assign" @click.stop="openAssignCoordinatorModal(line)">Assign</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <!-- Trials Tab -->
                  <div v-if="researchHubTab === 'trials'">
                    <div class="filter-bar">
                      <input type="text" class="form-control" v-model="trialFilters.search" placeholder="Search studies..." />
                      <select class="form-select" v-model="trialFilters.line">
                        <option value="">All Lines</option>
                        <option v-for="line in researchStore.researchLines" :key="line.id" :value="line.id">L{{ line.line_number }} - {{ line.research_line_name || line.name }}</option>
                      </select>
                      <select class="form-select" v-model="trialFilters.phase">
                        <option value="">All Phases</option>
                        <option value="Phase I">Phase I</option>
                        <option value="Phase II">Phase II</option>
                        <option value="Phase III">Phase III</option>
                        <option value="Phase IV">Phase IV</option>
                      </select>
                      <select class="form-select" v-model="trialFilters.status">
                        <option value="">All Status</option>
                        <option value="Reclutando">Recruiting</option>
                        <option value="Activo">Active</option>
                        <option value="Completado">Completed</option>
                        <option value="Suspendido">Suspended</option>
                      </select>
                    </div>
                    
                    <div class="rhub-trials-list">
                      <div v-for="trial in filteredTrials" :key="trial.id" class="rht-row" @click="viewTrial(trial)">
                        <div class="rht-phase-badge" :style="{ background: getPhaseColor(trial.phase) }">{{ trial.phase }}</div>
                        <div class="rht-main">
                          <div class="rht-title">{{ trial.title }}</div>
                          <div class="rht-meta">
                            <span class="rht-protocol">{{ trial.protocol_id }}</span>
                            <span class="rht-sep">•</span>
                            <span>{{ getResearchLineName(trial.research_line_id) }}</span>
                            <span class="rht-sep">•</span>
                            <span>{{ getStaffName(trial.principal_investigator_id)?.split(' ').pop() || 'No PI' }}</span>
                          </div>
                        </div>
                        <div class="rht-enrollment">
                          <div class="rht-enroll-nums">{{ trial.actual_enrollment || 0 }} / {{ trial.enrollment_target || 0 }}</div>
                          <div class="rht-enroll-bar"><div :style="{ width: ((trial.actual_enrollment || 0) / (trial.enrollment_target || 1) * 100) + '%', background: getPhaseColor(trial.phase) }"></div></div>
                        </div>
                        <div class="rht-dates">
                          <div>{{ trial.start_date ? formatDateShort(trial.start_date) : '—' }}</div>
                          <div v-if="trial.end_date">→ {{ formatDateShort(trial.end_date) }}</div>
                        </div>
                        <div class="rht-status">
                          <span class="status-recruiting" v-if="trial.status === 'Reclutando'">Recruiting</span>
                          <span class="badge badge-info" v-else-if="trial.status === 'Activo'">Active</span>
                          <span class="badge badge-secondary" v-else-if="trial.status === 'Completado'">Completed</span>
                          <span class="badge badge-warning" v-else>{{ trial.status }}</span>
                        </div>
                        <div class="rht-actions" @click.stop>
                          <button class="btn-icon" @click="editTrial(trial)"><i class="fas fa-edit"></i></button>
                          <button class="btn-icon" @click="deleteClinicalTrial(trial)"><i class="fas fa-trash"></i></button>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <!-- Projects Tab -->
                  <div v-if="researchHubTab === 'projects'">
                    <div class="filter-bar">
                      <input type="text" class="form-control" v-model="projectFilters.search" placeholder="Search projects..." />
                      <select class="form-select" v-model="projectFilters.category">
                        <option value="">All Categories</option>
                        <option value="Dispositivo">Device</option>
                        <option value="Salud Digital">Digital Health</option>
                        <option value="IA/ML">AI/ML</option>
                        <option value="Tecnología Quirúrgica">Surgical Tech</option>
                      </select>
                      <select class="form-select" v-model="projectFilters.stage">
                        <option value="">All Stages</option>
                        <option v-for="stage in PROJECT_STAGES" :key="stage.key" :value="stage.key">{{ stage.label }}</option>
                      </select>
                    </div>
                    
                    <div class="innovation-projects-grid">
                      <div v-for="project in filteredProjects" :key="project.id" class="inno-card" @click="editProject(project)">
                        <div class="inno-card-bar" :style="{ background: getStageColor(project.current_stage || project.development_stage) }"></div>
                        <div class="inno-card-top">
                          <span class="inno-cat-badge" :class="'inno-cat--' + (project.category?.toLowerCase().replace(/\\//g, '-') || 'dispositivo')">{{ project.category || 'Device' }}</span>
                          <div class="inno-card-actions" @click.stop>
                            <button class="inno-action-btn" @click="editProject(project)"><i class="fas fa-edit"></i></button>
                            <button class="inno-action-btn inno-action-btn--danger" @click="deleteInnovationProject(project)"><i class="fas fa-trash"></i></button>
                          </div>
                        </div>
                        <div class="inno-card-title">{{ project.title }}</div>
                        <div class="inno-stage-track">
                          <div v-for="stage in PROJECT_STAGES" :key="stage.key" class="inno-stage-node" :class="{ 
                            'inno-stage-node--done': (project.current_stage || project.development_stage) === stage.key,
                            'inno-stage-node--current': (project.current_stage || project.development_stage) === stage.key
                          }" :style="{ borderColor: getStageColor(stage.key) }">
                            <i v-if="(project.current_stage || project.development_stage) === stage.key" class="fas fa-check"></i>
                          </div>
                          <div class="inno-stage-label" :style="{ color: getStageColor(project.current_stage || project.development_stage) }">
                            <i class="fas fa-flag-checkered"></i> {{ getStageConfig(project.current_stage || project.development_stage).label }}
                          </div>
                        </div>
                        <div class="inno-card-description">{{ project.description }}</div>
                        <div class="inno-meta-row">
                          <div class="inno-line-badge"><i class="fas fa-flask"></i> {{ getResearchLineName(project.research_line_id) }}</div>
                          <div class="inno-funding-badge" :class="'inno-funding--' + (project.funding_status || 'not_applicable')">
                            {{ project.funding_status === 'seeking' ? 'Seeking funding' : project.funding_status === 'applied' ? 'Funding applied' : project.funding_status === 'funded' ? 'Funded' : 'Not applicable' }}
                          </div>
                        </div>
                        <div class="inno-team-section">
                          <div class="inno-team-label">Team</div>
                          <div class="inno-team-members">
                            <div v-if="project.lead_investigator_id" class="inno-team-member">
                              <div class="inno-member-avatar inno-member-avatar--lead">{{ getInitials(getStaffName(project.lead_investigator_id)) }}</div>
                              <div class="inno-member-info">
                                <div class="inno-member-name">{{ getStaffName(project.lead_investigator_id) }}</div>
                                <div class="inno-member-role">Lead Investigator</div>
                              </div>
                            </div>
                            <div v-for="coi in project.co_investigators?.slice(0, 2)" :key="coi" class="inno-team-member">
                              <div class="inno-member-avatar">{{ getInitials(getStaffName(coi)) }}</div>
                              <div class="inno-member-info">
                                <div class="inno-member-name">{{ getStaffName(coi) }}</div>
                                <div class="inno-member-role">Co-Investigator</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- News View -->
            <div v-if="currentView === 'news'" class="content-view-enter">
              <div class="filter-bar">
                <input type="text" class="form-control" v-model="newsStore.newsFilters.search" placeholder="Search news..." />
                <select class="form-select" v-model="newsStore.newsFilters.type">
                  <option value="">All Types</option>
                  <option value="article">Article</option>
                  <option value="update">Update</option>
                  <option value="publication">Publication</option>
                </select>
                <select class="form-select" v-model="newsStore.newsFilters.status">
                  <option value="">All Status</option>
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                  <option value="archived">Archived</option>
                </select>
                <button class="btn btn-primary" @click="showAddNewsModal()"><i class="fas fa-plus"></i> Write Post</button>
              </div>
              
              <div class="news-list">
                <div v-for="post in newsStore.filteredNews" :key="post.id" class="news-card" :class="'news-card--' + post.post_type" @click="openNewsDrawer(post)">
                  <div class="news-card-body">
                    <div class="news-card-title">{{ post.title }}</div>
                    <div class="news-card-excerpt">{{ post.body?.substring(0, 120) }}{{ post.body?.length > 120 ? '...' : '' }}</div>
                    <div class="news-card-meta">
                      <span class="news-meta-item"><i class="far fa-calendar-alt"></i> {{ formatNewsDate(post.created_at) }}</span>
                      <span class="news-meta-item"><i class="far fa-user"></i> {{ newsAuthorName(post.author_id) }}</span>
                      <span class="news-meta-item"><i class="far fa-clock"></i> {{ Math.ceil((post.body || '').split(/\\s+/).filter(Boolean).length / 200) }} min read</span>
                      <span v-if="post.research_line_id" class="news-meta-item"><i class="fas fa-flask"></i> {{ newsLineName(post.research_line_id) }}</span>
                    </div>
                  </div>
                  <div class="news-card-right">
                    <span class="news-status-badge" :class="'nsb--' + post.status">{{ post.status }}</span>
                    <div class="news-actions" @click.stop>
                      <button class="btn-icon" @click="editNews(post)"><i class="fas fa-edit"></i></button>
                      <button class="btn-icon" @click="deleteNews(post)"><i class="fas fa-trash"></i></button>
                      <button v-if="post.status === 'draft'" class="btn-icon btn-icon--ok" @click="publishNews(post.id, post)"><i class="fas fa-check"></i></button>
                    </div>
                  </div>
                </div>
                <div v-if="!newsStore.filteredNews.length" class="empty-state">
                  <i class="fas fa-newspaper empty-state-icon"></i>
                  <div class="empty-state-title">No posts found</div>
                  <div class="empty-state-description">Create your first news post.</div>
                  <button class="btn btn-primary mt-2" @click="showAddNewsModal()">Write Post</button>
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
    const uiStore = useUIStore()
    const userStore = useUserStore()
    const staffStore = useStaffStore()
    const rotationStore = useRotationStore()
    const trainingStore = useTrainingStore()
    const onCallStore = useOnCallStore()
    const absenceStore = useAbsenceStore()
    const researchStore = useResearchStore()
    const newsStore = useNewsStore()

    // ── Local state ─────────────────────────────────────────────────────────
    const loading = ref(false)
    const saving = ref(false)
    const showPassword = ref(false)
    const currentTime = ref(new Date())
    const currentView = ref('login')

    // View modes
    const staffView = ref('table')
    const onCallView = ref('detailed')
    const rotationView = ref('detailed')
    const researchHubTab = ref('lines')
    const analyticsActiveTab = ref('dashboard')

    // Filters
    const staffFilters = reactive({ search: '', staffType: '', department: '', status: '', residentCategory: '', hospital: '', networkType: '' })
    const rotationFilters = reactive({ resident: '', status: '', trainingUnit: '', supervisor: '', search: '' })
    const onCallFilters = reactive({ date: '', shiftType: '', physician: '', coverageArea: '', search: '' })
    const absenceFilters = reactive({ staff: '', status: '', reason: '', startDate: '', search: '', hideReturned: true })
    const trainingUnitFilters = reactive({ search: '', department: '', status: '' })
    const trialFilters = reactive({ line: '', phase: '', status: '', search: '' })
    const projectFilters = reactive({ research_line_id: '', category: '', stage: '', funding_status: '', search: '' })

    // Pagination & sort
    const pagination = reactive({
      medical_staff: { page: 1, size: 15 },
      rotations: { page: 1, size: 15 },
      oncall: { page: 1, size: 15 },
      absences: { page: 1, size: 15 }
    })
    const sortState = reactive({
      medical_staff: { field: 'full_name', dir: 'asc' },
      rotations: { field: 'start_date', dir: 'desc' },
      oncall: { field: 'duty_date', dir: 'asc' },
      absences: { field: 'start_date', dir: 'desc' }
    })

    // Modals (all the modal state objects)
    const staffProfileModal = reactive({ show: false, staff: null, activeTab: 'activity', collapsed: {}, researchProfile: null, supervisionData: null, leaveBalance: null, loadingResearch: false, loadingSupervision: false, loadingLeave: false })
    const medicalStaffModal = reactive({ show: false, mode: 'add', activeTab: 'basic', _addingHospital: false, _newHospitalName: '', _newHospitalNetwork: 'external', _certs: [], _addingCert: false, _newCert: { name: '', issued_month: '', renewal_months: 24 }, _addingStaffType: false, _newStaffTypeName: '', _newStaffTypeIsResident: false, _savingStaffType: false, form: {} })
    const rotationModal = reactive({ show: false, mode: 'add', checkingAvailability: false, availability: null, form: {} })
    const rotationViewModal = reactive({ show: false, rotation: null })
    const activationModal = reactive({ show: false, rotations: [], selectedRotation: null, notes: '', action: 'activate' })
    const onCallModal = reactive({ show: false, mode: 'add', form: {} })
    const absenceModal = reactive({ show: false, mode: 'add', form: {} })
    const absenceResolutionModal = reactive({ show: false, absence: null, action: null, saving: false, returnDate: '', returnNotes: '', extendedEndDate: '' })
    const trainingUnitModal = reactive({ show: false, mode: 'add', form: {} })
    const unitResidentsModal = reactive({ show: false, unit: null, rotations: [] })
    const unitCliniciansModal = reactive({ show: false, unit: null, clinicians: [], supervisorId: '', allStaff: [] })
    const unitDetailDrawer = reactive({ show: false, unit: null })
    const occupancyPanel = reactive({ show: false })
    const tlPopover = reactive({ show: false, unitName: '', slotIdx: 0, monthLabel: '', entries: [], x: 0, y: 0 })
    const researchLineModal = reactive({ show: false, mode: 'add', form: {} })
    const clinicalTrialModal = reactive({ show: false, mode: 'add', form: {} })
    const innovationProjectModal = reactive({ show: false, mode: 'add', form: {} })
    const assignCoordinatorModal = reactive({ show: false, lineId: null, lineName: '', selectedCoordinatorId: '' })
    const trialDetailModal = reactive({ show: false, trial: null })
    const deptPanel = reactive({ show: false, dept: null, tab: 'staff' })
    const reassignmentModal = reactive({ show: false, staff: null, saving: false, affectedShifts: [], affectedRotations: [], affectedAbsences: [], replacements: {} })
    const deptReassignModal = reactive({ show: false, dept: null, impact: { activeStaff: [], activeUnits: [], activeRotations: [] }, staffTargetDeptId: '', unitsTargetDeptId: '' })
    const staffTypeModal = reactive({ show: false, mode: 'add', saving: false, form: {} })
    const exportModal = reactive({ show: false, type: 'clinical-trials', format: 'csv', loading: false })
    const userProfileModal = reactive({ show: false, form: { full_name: '', email: '', department_id: '', linked_staff_id: null } })
    const announcementReadModal = reactive({ show: false, announcement: null })
    const communicationsModal = reactive({ show: false, activeTab: 'announcement', mode: 'add', form: {} })

    // System data
    const systemStats = reactive({ totalStaff: 0, activeAttending: 0, activeResidents: 0, onCallNow: 0, activeRotations: 0, endingThisWeek: 0, startingNextWeek: 0, onLeaveStaff: 0, departmentStatus: 'normal', activePatients: 0, icuOccupancy: 0, wardOccupancy: 0 })
    const clinicalStatus = ref(null)
    const clinicalStatusHistory = ref([])
    const isLoadingStatus = ref(false)
    const newStatusText = ref('')
    const selectedAuthorId = ref('')
    const expiryHours = ref(8)
    const liveStatsEditMode = ref(false)
    const researchDashboard = ref(null)
    const researchLinesPerformance = ref([])
    const partnerCollaborations = ref(null)
    const trialsTimeline = ref(null)
    const analyticsSummary = ref(null)
    const loadingAnalytics = ref(false)
    const dailyBriefing = ref([])
    const todaysOnCall = ref([])
    const residentGapWarnings = ref([])
    const announcements = ref([])
    const departments = ref([])
    
    // Login state
    const loginForm = ref({ email: '', password: '', remember_me: false })
    const loginLoading = ref(false)
    const loginError = ref('')
    const loginFieldErrors = reactive({ email: '', password: '' })

    // ── Formatting helpers ──────────────────────────────────────────────────
    const hasPermission = (module, action) => userStore.hasPermission(module, action)
    const formatDate = (d) => Utils.formatDate(d)
    const formatDateShort = (d) => Utils.formatDateShort(d)
    const formatRelativeDate = (d) => Utils.formatRelativeDate(d)
    const formatTime = (d) => Utils.formatTime(d)
    const formatRelativeTime = (d) => Utils.formatRelativeTime(d)
    const formatTimeAgo = (d) => Utils.formatRelativeTime(d)
    const formatNewsDate = (d) => Utils.formatNewsDate(d)
    const formatClinicalDuration = (s, e) => Utils.formatClinicalDuration(s, e)
    const normalizeDate = (d) => Utils.normalizeDate(d)
    const getInitials = (n) => Utils.getInitials(n)
    const formatPercentage = (v, t) => Utils.formatPercentage(v, t)
    const getPhaseColor = (p) => Utils.getPhaseColor(p)
    const getStageColor = (s) => Utils.getStageColor(s)
    const getStageConfig = (s) => Utils.getStageConfig(s)
    const getPartnerTypeColor = (t) => Utils.getPartnerTypeColor(t)
    const getTomorrow = () => Utils.getTomorrow ? Utils.getTomorrow() : new Date(Date.now() + 86400000)
    
    const getStaffName = (id) => staffStore.getStaffName(id)
    const getStaffEmail = (id) => staffStore.medicalStaff.find(s => s.id === id)?.professional_email || ''
    const getResidentName = (id) => staffStore.getStaffName(id)
    const getSupervisorName = (id) => staffStore.getStaffName(id)
    const getPhysicianName = (id) => staffStore.getStaffName(id)
    const getTrainingUnitName = (id) => trainingStore.getTrainingUnitName(id)
    const getDepartmentName = (id) => departments.value.find(d => d.id === id)?.name || ''
    const getResearchLineName = (id) => researchStore.getResearchLineName(id)
    const getLineAccent = (n) => researchStore.getLineAccent(n)
    
    const formatStaffType = (t) => staffStore.formatStaffType(t)
    const formatStaffTypeShort = (t) => staffStore.formatStaffTypeShort(t)
    const getStaffTypeClass = (t) => staffStore.getStaffTypeClass(t)
    const isResidentType = (t) => staffStore.isResidentType(t)
    const formatEmploymentStatus = (s) => staffStore.formatEmploymentStatus(s)
    const formatAbsenceReason = (r) => absenceStore.formatAbsenceReason(r)
    const formatRotationStatus = (s) => rotationStore.formatRotationStatus(s)
    const formatUserRole = (role) => {
      const roles = { system_admin: 'Admin', department_head: 'Dept Head', attending_physician: 'Attending', medical_resident: 'Resident' }
      return roles[role] || role
    }
    const formatStudyStatus = (s) => ({ 'Reclutando': 'Recruiting', 'Activo': 'Active', 'Completado': 'Completed', 'Suspendido': 'Suspended' }[s] || s)
    const formatAudience = (a) => ({ all_staff: 'All Staff', all: 'All (incl. admin)', residents_only: 'Residents Only', attending_only: 'Attendings Only' }[a] || a)
    const formatTrainingYear = (y) => Utils.formatTrainingYear(y)
    const formatPhone = (p) => Utils.formatPhone(p)
    const formatLicense = (l) => Utils.formatLicense(l)
    const formatSpecialization = (s) => Utils.formatSpecialization(s)
    const effectiveResidentYear = (s) => Utils.effectiveResidentYear(s)
    const getRoleInfo = (r) => Utils.getRoleInfo(r)
    const getStaffRoles = (s) => Utils.getStaffRoles(s)
    const getResidentCategoryInfo = (c, s) => Utils.getResidentCategoryInfo(c, s)
    const formatResidentCategorySimple = (c) => Utils.getResidentCategoryInfo(c).shortText
    const formatResidentCategoryDetailed = (s) => s?.resident_category ? Utils.getResidentCategoryInfo(s.resident_category, s).text : null
    const getResidentCategoryIcon = (c) => Utils.getResidentCategoryInfo(c).icon
    const getResidentCategoryTooltip = (s) => {
      if (!s?.resident_category) return ''
      const map = { department_internal: 'Department internal resident', rotating_other_dept: s.home_department ? `Rotating from ${s.home_department} department` : 'Resident from another department', external_resident: s.external_institution ? `External resident from ${s.external_institution}` : 'External resident from another institution' }
      return map[s.resident_category] || ''
    }
    
    const calculateAbsenceDuration = (s, e) => Utils.dateDiff(s, e)
    const getDaysRemaining = (d) => Utils.daysUntil(d)
    const getDaysUntilStart = (d) => Utils.daysUntil(d)
    const getDaysRemainingColor = (days) => { if (days <= 0) return '#ef4444'; if (days < 5) return '#f59e0b'; return '#10b981' }
    const isToday = (d) => onCallStore.isToday(d)
    
    // Rotation helpers
    const getHorizonMonths = (n, offset) => rotationStore.getHorizonMonths(n, offset)
    const getHorizonRangeLabel = () => rotationStore.getHorizonRangeLabel()
    const getResidentRotationsInHorizon = (r) => rotationStore.getResidentRotationsInHorizon(r)
    const getRotationBarStyle = (r) => rotationStore.getRotationBarStyle(r)
    const rotationStartsInHorizon = (r) => rotationStore.rotationStartsInHorizon(r)
    const rotationEndsInHorizon = (r) => rotationStore.rotationEndsInHorizon(r)
    const isRotationActive = (r) => r.rotation_status === 'active'
    const isShiftActive = (s) => onCallStore.isToday(s.duty_date)
    
    const getRotationProgress = (rotation) => {
      if (!rotation) return { pct: 0, label: '', urgent: false, done: false }
      const start = new Date(Utils.normalizeDate(rotation.start_date) + 'T00:00:00')
      const end = new Date(Utils.normalizeDate(rotation.end_date) + 'T23:59:59')
      const now = new Date()
      if (rotation.rotation_status === 'completed') return { pct: 100, label: 'Completed', urgent: false, done: true }
      if (isNaN(start.getTime()) || isNaN(end.getTime())) return { pct: 0, label: '', urgent: false, done: false }
      const pct = Math.min(100, Math.max(0, Math.round((now - start) / (end - start) * 100)))
      const daysLeft = Math.ceil((end - now) / 86400000)
      return { pct, label: daysLeft <= 0 ? 'Ending' : daysLeft === 1 ? '1 day left' : `${daysLeft}d left`, urgent: daysLeft <= 7 && daysLeft >= 0, done: false }
    }
    const getCurrentRotationForStaff = (id) => rotationStore.rotations.find(r => r.resident_id === id && r.rotation_status === 'active')
    const getRotationHistory = (id) => rotationStore.rotations.filter(r => r.resident_id === id && !['active', 'scheduled'].includes(r.rotation_status))
    const getUpcomingRotations = (id) => rotationStore.rotations.filter(r => r.resident_id === id && ['active', 'scheduled'].includes(r.rotation_status))
    const getRotationDaysLeft = (id) => { const r = getCurrentRotationForStaff(id); return r ? Utils.daysUntil(r.end_date) : 0 }
    const getCurrentRotationSupervisor = (id) => { const r = getCurrentRotationForStaff(id); return r?.supervising_attending_id ? getStaffName(r.supervising_attending_id) : 'Not assigned' }
    const viewRotationDetails = (rotation) => {
      rotationViewModal.rotation = { ...rotation, unitName: getTrainingUnitName(rotation.training_unit_id), residentName: getResidentName(rotation.resident_id), supervisorName: getStaffName(rotation.supervising_attending_id) || '—', clinicalDuration: Utils.formatClinicalDuration(rotation.start_date, rotation.end_date), daysTotal: Math.max(1, Math.round((new Date(rotation.end_date) - new Date(rotation.start_date)) / 86400000)), daysLeft: Math.max(0, Math.round((new Date(rotation.end_date) - new Date()) / 86400000)) }
      rotationViewModal.show = true
    }
    
    // Training unit helpers
    const getUnitActiveRotationCount = (id) => trainingStore.getUnitActiveRotationCount(id)
    const getUnitRotations = (id) => trainingStore.getUnitRotations(id)
    const getUnitScheduledCount = (id) => trainingStore.getUnitScheduledCount(id)
    const getUnitOverlapWarning = (id) => trainingStore.getUnitOverlapWarning(id)
    const getUnitMonthOccupancy = (unitId, year, month) => trainingStore.getUnitMonthOccupancy(unitId, year, month)
    const getNextFreeMonth = (unitId) => trainingStore.getNextFreeMonth(unitId)
    const getTimelineMonths = (n) => trainingStore.getTimelineMonths(n)
    const getUnitSlots = (unitId, max, horizon) => trainingStore.getUnitSlots(unitId, max, horizon)
    const getDaysUntilFree = (endDate) => trainingStore.getDaysUntilFree(endDate)
    const getResidentShortName = (id) => { const name = getStaffName(id); if (!name || name === 'Not assigned') return '—'; const parts = name.trim().split(' '); return parts.length > 1 ? `${parts[0][0]}. ${parts[parts.length - 1]}` : name }
    
    // On-call helpers
    const isOnCallToday = (staffId) => onCallStore.onCallSchedule.some(s => (s.primary_physician_id === staffId || s.backup_physician_id === staffId) && onCallStore.isToday(s.duty_date))
    const getUpcomingOnCall = (staffId) => onCallStore.onCallSchedule.filter(s => (s.primary_physician_id === staffId || s.backup_physician_id === staffId) && Utils.normalizeDate(s.duty_date) >= Utils.normalizeDate(new Date()))
    const getUpcomingLeave = (staffId) => absenceStore.absences.filter(a => a.staff_member_id === staffId && Utils.normalizeDate(a.start_date) >= Utils.normalizeDate(new Date()) && a.current_status !== 'cancelled')
    
    // Research helpers
    const addKeyword = (form) => researchStore.addKeyword(form)
    const removeKeyword = (form, idx) => researchStore.removeKeyword(form, idx)
    const handleKeywordKey = (e, form) => researchStore.handleKeywordKey(e, form)
    
    // News helpers
    const newsWordCount = computed(() => newsStore.newsWordCount)
    const newsWordLimit = 5000
    const newsAuthorName = (id) => newsStore.formatAuthorName(id)
    const newsLineName = (id) => newsStore.getLineName(id)
    
    // ── Pagination & sort ───────────────────────────────────────────────────
    const goToPage = (view, page) => { if (pagination[view]) pagination[view].page = page }
    const sortBy = (view, field) => {
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
      if (filters.department) staffFilters.department = filters.department
      if (filters.residentCategory) { staffFilters.staffType = 'medical_resident'; staffFilters.residentCategory = filters.residentCategory }
      if (filters.rotationStatus) rotationFilters.status = filters.rotationStatus
      if (filters.trainingUnit) rotationFilters.trainingUnit = filters.trainingUnit
      if (view === 'research_hub' && researchStore.researchLines.length === 0) {
        await Promise.all([researchStore.loadResearchLines(), researchStore.loadClinicalTrials(), researchStore.loadInnovationProjects()])
      }
    }
    
    const handleGlobalSearch = () => { if (uiStore.globalSearchQuery.trim()) uiStore.searchResultsOpen = true }
    const clearSearch = () => { uiStore.globalSearchQuery = ''; uiStore.searchResultsOpen = false }
    const globalSearchResults = computed(() => {
      const q = uiStore.globalSearchQuery.toLowerCase().trim(); if (!q || q.length < 2) return []
      const results = []
      staffStore.medicalStaff.filter(s => s.full_name?.toLowerCase().includes(q)).slice(0, 5).forEach(s => results.push({ type: 'staff', icon: 'fa-user-md', label: s.full_name, sub: staffStore.formatStaffType(s.staff_type), action: () => { viewStaffDetails(s); uiStore.searchResultsOpen = false } }))
      researchStore.researchLines.filter(l => (l.research_line_name || l.name)?.toLowerCase().includes(q)).slice(0, 3).forEach(l => results.push({ type: 'research', icon: 'fa-flask', label: l.research_line_name || l.name, sub: 'Research Line', action: () => { switchView('research_hub'); uiStore.searchResultsOpen = false } }))
      return results
    })
    
    // ── Auth ────────────────────────────────────────────────────────────────
    const handleLogin = async () => {
      loginFieldErrors.email = !loginForm.value.email ? 'Email required' : ''
      loginFieldErrors.password = !loginForm.value.password ? 'Password required' : ''
      if (loginFieldErrors.email || loginFieldErrors.password) {
        loginError.value = 'Please fill all required fields'
        return
      }
      loginLoading.value = true
      loginError.value = ''
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
      } finally {
        loginLoading.value = false
      }
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
      userProfileModal.show = true
      uiStore.userMenuOpen = false
    }
    
    const saveUserProfile = async () => {
      saving.value = true
      try {
        userStore.currentUser.full_name = userProfileModal.form.full_name
        localStorage.setItem('neumocare_user', JSON.stringify(userStore.currentUser))
        userProfileModal.show = false
        uiStore.showToast('Success', 'Profile updated', 'success')
      } catch {
        uiStore.showToast('Error', 'Failed to update profile', 'error')
      } finally {
        saving.value = false
      }
    }
    
    const hasProfessionalCredentials = (s) => !!(s?.medical_license || s?.clinical_certificate || s?.specialization)
    
    // ── Staff actions ───────────────────────────────────────────────────────
    const viewStaffDetails = (staff) => {
      if (!staff?.id) return
      staffProfileModal.staff = staff
      staffProfileModal.activeTab = 'activity'
      staffProfileModal.show = true
    }
    
    const showAddMedicalStaffModal = (opts = {}) => {
      medicalStaffModal.mode = 'add'
      medicalStaffModal.activeTab = 'basic'
      medicalStaffModal._addingHospital = false
      medicalStaffModal._newHospitalName = ''
      medicalStaffModal._newHospitalNetwork = 'external'
      medicalStaffModal._addingStaffType = false
      medicalStaffModal._newStaffTypeName = ''
      medicalStaffModal._newStaffTypeIsResident = false
      medicalStaffModal._savingStaffType = false
      medicalStaffModal.form = {
        full_name: '', staff_type: 'medical_resident', staff_id: `MD-${Date.now().toString().slice(-6)}`,
        employment_status: 'active', professional_email: '', department_id: opts.department_id || '',
        academic_degree: '', specialization: '', training_year: '', clinical_certificate: '', certificate_status: '',
        mobile_phone: '', office_phone: '', medical_license: '', can_supervise_residents: false, special_notes: '',
        can_be_pi: false, can_be_coi: false, other_certificate: '', resident_category: null, home_department: null,
        external_institution: null, home_department_id: null, external_contact_name: null, external_contact_email: null,
        external_contact_phone: null, academic_degree_id: null, has_medical_license: false, residency_start_date: null,
        residency_year_override: null, is_chief_of_department: false, is_research_coordinator: false,
        is_resident_manager: false, is_oncall_manager: false, clinical_study_certificates: [], hospital_id: null,
        has_phd: false, phd_field: '', years_experience: null, _networkHint: null
      }
      medicalStaffModal.show = true
    }
    
    const editMedicalStaff = (staff) => {
      medicalStaffModal.mode = 'edit'
      medicalStaffModal.activeTab = 'basic'
      medicalStaffModal.form = { ...staff }
      medicalStaffModal.show = true
    }
    
    const saveMedicalStaff = async () => {
      saving.value = true
      try {
        const f = medicalStaffModal.form
        if (medicalStaffModal.mode === 'edit') {
          await staffStore.updateStaff(f.id, f)
        } else {
          await staffStore.createStaff(f)
        }
        medicalStaffModal.show = false
      } catch (e) {
        uiStore.showToast('Error', e?.message || 'Failed to save staff', 'error')
      } finally {
        saving.value = false
      }
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
      rotationModal.form = {
        rotation_id: `ROT-${Date.now().toString().slice(-6)}`,
        resident_id: resident?.id || '',
        training_unit_id: unit?.id || '',
        start_date: Utils.localDateStr(new Date()),
        end_date: Utils.localDateStr(new Date(Date.now() + 30 * 86400000)),
        rotation_status: 'scheduled',
        rotation_category: 'clinical_rotation',
        supervising_attending_id: ''
      }
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
        if (rotationModal.mode === 'edit') {
          await rotationStore.updateRotation(f.id, f)
        } else {
          await rotationStore.createRotation(f)
        }
        rotationModal.show = false
      } catch (e) {
        uiStore.showToast('Error', e?.message || 'Failed to save rotation', 'error')
      } finally {
        saving.value = false
      }
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
      onCallModal.form = {
        duty_date: Utils.localDateStr(new Date()),
        shift_type: 'primary_call',
        start_time: '15:00',
        end_time: '08:00',
        primary_physician_id: physician?.id || '',
        backup_physician_id: '',
        coverage_area: 'emergency',
        coverage_notes: ''
      }
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
        if (onCallModal.mode === 'edit') {
          await onCallStore.updateOnCall(f.id, f)
        } else {
          await onCallStore.createOnCall(f)
        }
        onCallModal.show = false
      } catch (e) {
        uiStore.showToast('Error', e?.message || 'Failed to save on-call schedule', 'error')
      } finally {
        saving.value = false
      }
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
      absenceModal.form = {
        staff_member_id: staff?.id || '',
        absence_type: 'planned',
        absence_reason: 'vacation',
        start_date: Utils.localDateStr(new Date()),
        end_date: Utils.localDateStr(new Date(Date.now() + 7 * 86400000)),
        covering_staff_id: '',
        coverage_notes: '',
        coverage_arranged: false,
        hod_notes: ''
      }
      absenceModal.show = true
    }
    
    const editAbsence = (absence) => {
      absenceModal.mode = 'edit'
      absenceModal.form = {
        ...absence,
        start_date: Utils.normalizeDate(absence.start_date),
        end_date: Utils.normalizeDate(absence.end_date),
        covering_staff_id: absence.covering_staff_id || '',
        coverage_notes: absence.coverage_notes || '',
        coverage_arranged: absence.coverage_arranged ?? false,
        hod_notes: absence.hod_notes || ''
      }
      absenceModal.show = true
    }
    
    const saveAbsence = async () => {
      saving.value = true
      try {
        const f = absenceModal.form
        if (absenceModal.mode === 'edit') {
          await absenceStore.updateAbsence(f.id, f)
        } else {
          await absenceStore.createAbsence(f)
        }
        absenceModal.show = false
      } catch (e) {
        uiStore.showToast('Error', e?.message || 'Failed to save absence', 'error')
      } finally {
        saving.value = false
      }
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
      absenceResolutionModal.absence = absence
      absenceResolutionModal.action = 'confirm_return'
      absenceResolutionModal.returnDate = Utils.localDateStr(new Date())
      absenceResolutionModal.returnNotes = ''
      absenceResolutionModal.extendedEndDate = Utils.localDateStr(new Date(Date.now() + 7 * 86400000))
      absenceResolutionModal.show = true
    }
    
    const resolveAbsence = async () => {
      const m = absenceResolutionModal
      if (!m.absence) return
      m.saving = true
      try {
        if (m.action === 'confirm_return') {
          await absenceStore.returnToDuty(m.absence.id, m.returnDate, m.returnNotes || 'Staff confirmed returned to duty')
        } else if (m.action === 'extend') {
          await absenceStore.updateAbsence(m.absence.id, { ...m.absence, end_date: m.extendedEndDate, hod_notes: (m.absence.hod_notes ? m.absence.hod_notes + '\n' : '') + `[EXTENDED: ${new Date().toISOString()}] New end date: ${m.extendedEndDate}` + (m.returnNotes ? ` — ${m.returnNotes}` : '') })
        } else if (m.action === 'archive') {
          await absenceStore.deleteAbsence(m.absence.id)
        }
        m.show = false
        uiStore.showToast('Success', 'Absence resolved', 'success')
      } catch (e) {
        uiStore.showToast('Error', e?.message || 'Failed to resolve absence', 'error')
      } finally {
        m.saving = false
      }
    }
    
    // ── Training unit actions ───────────────────────────────────────────────
    const showAddTrainingUnitModal = () => {
      trainingUnitModal.mode = 'add'
      trainingUnitModal.form = {
        unit_name: '', unit_code: '', department_id: '', maximum_residents: 10,
        unit_status: 'active', unit_type: 'training_unit', unit_description: '',
        specialty: '', supervising_attending_id: ''
      }
      trainingUnitModal.show = true
    }
    
    const editTrainingUnit = (unit) => {
      trainingUnitModal.mode = 'edit'
      trainingUnitModal.form = { ...unit }
      trainingUnitModal.show = true
    }
    
    const saveTrainingUnit = async () => {
      saving.value = true
      try {
        const f = trainingUnitModal.form
        if (trainingUnitModal.mode === 'edit') {
          await trainingStore.updateTrainingUnit(f.id, f)
        } else {
          await trainingStore.createTrainingUnit(f)
        }
        trainingUnitModal.show = false
        uiStore.showToast('Success', 'Training unit saved', 'success')
      } catch (e) {
        uiStore.showToast('Error', e?.message || 'Failed to save unit', 'error')
      } finally {
        saving.value = false
      }
    }
    
    const deleteTrainingUnit = (unit) => {
      uiStore.showConfirmation({
        title: 'Delete Training Unit', message: `Delete "${unit.unit_name}"?`,
        icon: 'fa-trash', confirmButtonText: 'Delete Unit', confirmButtonClass: 'btn-danger',
        onConfirm: async () => {
          await trainingStore.deleteTrainingUnit(unit.id)
          uiStore.showToast('Deactivated', `${unit.unit_name} deactivated`, 'success')
        }
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
      unitCliniciansModal.show = false
      uiStore.showToast('Saved', 'Supervisor assignment updated', 'success')
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
    
    const closeCellPopover = () => {
      trainingStore.closeCellPopover()
      tlPopover.show = false
    }
    
    // ── Communications ──────────────────────────────────────────────────────
    const showCommunicationsModal = () => {
      communicationsModal.mode = 'add'
      communicationsModal.activeTab = 'announcement'
      communicationsModal.form = { id: null, title: '', content: '', priority: 'normal', target_audience: 'all_staff' }
      communicationsModal.show = true
    }
    
    const saveCommunication = async () => {
      saving.value = true
      try {
        const f = communicationsModal.form
        if (communicationsModal.activeTab === 'announcement') {
          if (communicationsModal.mode === 'edit') {
            await API.updateAnnouncement(f.id, { title: f.title, content: f.content, priority_level: f.priority, target_audience: f.target_audience })
          } else {
            await API.createAnnouncement({ title: f.title, content: f.content, priority_level: f.priority, target_audience: f.target_audience })
          }
          announcements.value = await API.getAnnouncements()
          uiStore.showToast('Success', communicationsModal.mode === 'edit' ? 'Announcement updated' : 'Announcement posted', 'success')
        }
        communicationsModal.show = false
      } catch (e) {
        uiStore.showToast('Error', e?.message || 'An unexpected error occurred', 'error')
      } finally {
        saving.value = false
      }
    }
    
    // ── Research actions ────────────────────────────────────────────────────
    const showAddResearchLineModal = () => researchStore.showAddResearchLineModal()
    const editResearchLine = (l) => researchStore.editResearchLine(l)
    const saveResearchLine = async () => {
      saving.value = true
      try {
        await researchStore.saveResearchLine()
      } catch (e) {
        uiStore.showToast('Error', e?.message || 'Failed', 'error')
      } finally {
        saving.value = false
      }
    }
    const deleteResearchLine = (l) => {
      uiStore.showConfirmation({
        title: 'Delete Research Line', message: `Delete "${l.research_line_name || l.name}"?`,
        icon: 'fa-trash', confirmButtonText: 'Delete', confirmButtonClass: 'btn-danger',
        onConfirm: () => researchStore.deleteResearchLine(l.id)
      })
    }
    const showAddTrialModal = (l = null) => researchStore.showAddTrialModal(l)
    const editTrial = (t) => researchStore.editTrial(t)
    const saveClinicalTrial = async () => {
      saving.value = true
      try {
        await researchStore.saveClinicalTrial()
      } catch (e) {
        uiStore.showToast('Error', e?.message || 'Failed', 'error')
      } finally {
        saving.value = false
      }
    }
    const deleteClinicalTrial = (t) => {
      uiStore.showConfirmation({
        title: 'Delete Study', message: `Delete "${t.title}"?`,
        icon: 'fa-trash', confirmButtonText: 'Delete', confirmButtonClass: 'btn-danger',
        onConfirm: () => researchStore.deleteClinicalTrial(t.id)
      })
    }
    const viewTrial = (t) => researchStore.viewTrial(t)
    const showAddProjectModal = (l = null) => researchStore.showAddProjectModal(l)
    const editProject = (p) => researchStore.editProject(p)
    const saveInnovationProject = async () => {
      saving.value = true
      try {
        await researchStore.saveInnovationProject()
      } catch (e) {
        uiStore.showToast('Error', e?.message || 'Failed', 'error')
      } finally {
        saving.value = false
      }
    }
    const deleteInnovationProject = (p) => {
      uiStore.showConfirmation({
        title: 'Delete Project', message: `Delete "${p.title}"?`,
        icon: 'fa-trash', confirmButtonText: 'Delete', confirmButtonClass: 'btn-danger',
        onConfirm: () => researchStore.deleteInnovationProject(p.id)
      })
    }
    const openAssignCoordinatorModal = (l) => {
      researchStore.openAssignCoordinatorModal(l)
      Object.assign(assignCoordinatorModal, researchStore.assignCoordinatorModal)
    }
    const saveCoordinatorAssignment = async () => {
      await researchStore.saveCoordinatorAssignment()
      assignCoordinatorModal.show = false
    }
    const openLineDetail = (l) => researchStore.setActiveMissionLine(l)
    const drillToTrials = (lineId) => {
      researchStore.trialFilters.line = lineId
      researchStore.researchHubTab = 'trials'
      switchView('research_hub')
    }
    const drillToProjects = (lineId) => {
      researchStore.projectFilters.research_line_id = lineId
      researchStore.researchHubTab = 'projects'
      switchView('research_hub')
    }
    const toggleCoInvestigator = (id) => {
      const arr = researchStore.clinicalTrialModal.form.co_investigators
      const i = arr.indexOf(id)
      if (i === -1) arr.push(id)
      else arr.splice(i, 1)
    }
    const toggleSubInvestigator = (id) => {
      const arr = researchStore.clinicalTrialModal.form.sub_investigators
      const i = arr.indexOf(id)
      if (i === -1) arr.push(id)
      else arr.splice(i, 1)
    }
    const toggleProjectCoInvestigator = (id) => {
      const arr = researchStore.innovationProjectModal.form.co_investigators
      const i = arr.indexOf(id)
      if (i === -1) arr.push(id)
      else arr.splice(i, 1)
    }
    const togglePartnerNeed = (need) => {
      const arr = researchStore.innovationProjectModal.form.partner_needs
      const i = arr.indexOf(need)
      if (i === -1) arr.push(need)
      else arr.splice(i, 1)
    }
    
    // ── News actions ────────────────────────────────────────────────────────
    const showAddNewsModal = () => newsStore.showAddModal()
    const editNews = (p) => newsStore.editNews(p)
    const saveNews = async () => {
      saving.value = true
      try {
        await newsStore.saveNews()
      } catch (e) {
        uiStore.showToast('Error', e?.message || 'Failed', 'error')
      } finally {
        saving.value = false
      }
    }
    const deleteNews = (p) => {
      uiStore.showConfirmation({
        title: 'Delete Post', message: `Permanently delete "${p.title}"?`,
        icon: 'fa-trash', confirmButtonText: 'Delete', confirmButtonClass: 'btn-danger',
        onConfirm: () => newsStore.deleteNews(p.id)
      })
    }
    const publishNews = (p) => newsStore.publishNews(p.id, p)
    const archiveNews = (p) => newsStore.archiveNews(p.id, p)
    const toggleNewsPublic = (p) => newsStore.togglePublic(p.id, p)
    const openNewsDrawer = (p) => newsStore.openNewsDrawer(p)
    const closeNewsDrawer = () => newsStore.closeNewsDrawer()
    const loadNews = () => newsStore.loadNews()
    const newsDrawerPrev = () => {
      const posts = newsStore.filteredNews
      const idx = posts.findIndex(p => p.id === newsStore.newsDrawer.post?.id)
      if (idx > 0) newsStore.newsDrawer.post = posts[idx - 1]
    }
    const newsDrawerNext = () => {
      const posts = newsStore.filteredNews
      const idx = posts.findIndex(p => p.id === newsStore.newsDrawer.post?.id)
      if (idx < posts.length - 1) newsStore.newsDrawer.post = posts[idx + 1]
    }
    const newsDrawerBodyParagraphs = computed(() => (newsStore.newsDrawer.post?.body || '').split('\n').filter(Boolean))
    const newsDrawerInitials = computed(() => Utils.getInitials(newsStore.newsDrawer.post?.author_name || ''))
    const newsDrawerAuthorFull = computed(() => newsStore.newsDrawer.post?.author_name || '—')
    const newsDrawerReadMins = computed(() => {
      const wc = (newsStore.newsDrawer.post?.body || '').trim().split(/\s+/).filter(Boolean).length
      return Math.max(1, Math.round(wc / 200))
    })
    const newsDrawerLineName = computed(() => newsStore.getLineName(newsStore.newsDrawer.post?.research_line_id))
    
    // ── Analytics / export ──────────────────────────────────────────────────
    const showExportModal = () => { exportModal.show = true }
    const handleExport = async () => {
      exportModal.loading = true
      try {
        const data = await API.exportData(exportModal.type, exportModal.format)
        const blob = new Blob([data], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${exportModal.type}-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
        uiStore.showToast('Success', 'Export completed', 'success')
        exportModal.show = false
      } catch (e) {
        uiStore.showToast('Error', e.message || 'Export failed', 'error')
      } finally {
        exportModal.loading = false
      }
    }
    
    // ── Clinical status ─────────────────────────────────────────────────────
    const loadClinicalStatus = async () => {
      isLoadingStatus.value = true
      try {
        const r = await API.getClinicalStatus()
        clinicalStatus.value = r?.success ? r.data : null
      } catch {
        clinicalStatus.value = null
      } finally {
        isLoadingStatus.value = false
      }
    }
    
    const loadClinicalStatusHistory = async () => {
      try {
        clinicalStatusHistory.value = await API.getClinicalStatusHistory(20)
      } catch {
        clinicalStatusHistory.value = []
      }
    }
    
    const refreshStatus = () => {
      loadClinicalStatus()
      loadClinicalStatusHistory()
    }
    
    const showCreateStatusModal = () => {
      liveStatsEditMode.value = true
      newStatusText.value = ''
      selectedAuthorId.value = ''
      expiryHours.value = 8
    }
    
    const calculateTimeRemaining = (expiry) => {
      if (!expiry) return 'N/A'
      const diff = new Date(expiry) - new Date()
      if (diff <= 0) return 'Expired'
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      return h > 0 ? `${h}h ${m}m` : `${m}m`
    }
    
    const isStatusExpired = (expiry) => !expiry || new Date() > new Date(expiry)
    
    // ── Dashboard stats ─────────────────────────────────────────────────────
    const updateDashboardStats = () => {
      const today = Utils.normalizeDate(new Date())
      const nextWeek = Utils.normalizeDate(new Date(Date.now() + 7 * 86400000))
      const twoWeeks = Utils.normalizeDate(new Date(Date.now() + 14 * 86400000))
      systemStats.totalStaff = staffStore.medicalStaff.length
      systemStats.activeAttending = staffStore.medicalStaff.filter(s => s.staff_type === 'attending_physician' && s.employment_status === 'active').length
      systemStats.activeResidents = staffStore.medicalStaff.filter(s => isResidentType(s.staff_type) && s.employment_status === 'active').length
      systemStats.onLeaveStaff = absenceStore.absences.filter(a => {
        const s = Utils.normalizeDate(a.start_date)
        const e = Utils.normalizeDate(a.end_date)
        return s <= today && today <= e && a.current_status !== 'cancelled'
      }).length
      systemStats.activeRotations = rotationStore.rotations.filter(r => r.rotation_status === 'active').length
      systemStats.endingThisWeek = rotationStore.rotations.filter(r => r.rotation_status === 'active' && Utils.normalizeDate(r.end_date) >= today && Utils.normalizeDate(r.end_date) <= nextWeek).length
      systemStats.startingNextWeek = rotationStore.rotations.filter(r => r.rotation_status === 'scheduled' && Utils.normalizeDate(r.start_date) >= nextWeek && Utils.normalizeDate(r.start_date) <= twoWeeks).length
      const unique = new Set()
      onCallStore.onCallSchedule.filter(s => Utils.normalizeDate(s.duty_date) === today).forEach(s => {
        if (s.primary_physician_id) unique.add(s.primary_physician_id)
        if (s.backup_physician_id) unique.add(s.backup_physician_id)
      })
      systemStats.onCallNow = unique.size
      todaysOnCall.value = onCallStore.todaysOnCall
      residentGapWarnings.value = rotationStore.residentGapWarnings
      
      const items = []
      const endingRots = rotationStore.rotations.filter(r => r.rotation_status === 'active' && Utils.normalizeDate(r.end_date) >= today && Utils.normalizeDate(r.end_date) <= nextWeek)
      if (endingRots.length) items.push({ type: 'warn', text: `${endingRots.length} rotation${endingRots.length > 1 ? 's' : ''} ending this week`, action: 'resident_rotations', icon: 'fa-clock' })
      const startingRots = rotationStore.rotations.filter(r => r.rotation_status === 'scheduled' && Utils.normalizeDate(r.start_date) >= today && Utils.normalizeDate(r.start_date) <= nextWeek)
      if (startingRots.length) items.push({ type: 'ok', text: `${startingRots.length} rotation${startingRots.length > 1 ? 's' : ''} starting this week`, action: 'resident_rotations', icon: 'fa-play-circle' })
      const ocGaps = []
      for (let i = 0; i < 7; i++) {
        const d = new Date(Date.now() + i * 86400000)
        const ds = Utils.normalizeDate(d)
        if (!onCallStore.onCallSchedule.some(s => Utils.normalizeDate(s.duty_date) === ds && s.shift_type === 'primary_call')) {
          ocGaps.push(d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' }))
        }
      }
      if (ocGaps.length) items.push({ type: 'danger', text: `${ocGaps.length} day${ocGaps.length > 1 ? 's' : ''} without primary on-call`, action: 'oncall_schedule', icon: 'fa-phone-slash' })
      dailyBriefing.value = items.slice(0, 3)
    }
    
    // ── Load all data ───────────────────────────────────────────────────────
const loadAllData = async () => {
  loading.value = true
  try {
    // Load each one individually with error handling
    try { await staffStore.loadStaff() } catch(e) { console.warn('Staff load failed', e) }
    try { await staffStore.loadAcademicDegrees() } catch(e) { console.warn('Degrees load failed', e) }
    try { await rotationStore.loadRotations() } catch(e) { console.warn('Rotations load failed', e) }
    try { await trainingStore.loadTrainingUnits() } catch(e) { console.warn('Training units load failed', e) }
    try { await onCallStore.loadOnCallSchedule() } catch(e) { console.warn('On-call load failed', e) }
    try { await absenceStore.loadAbsences() } catch(e) { console.warn('Absences load failed', e) }
    try { await researchStore.loadResearchLines() } catch(e) { console.warn('Research lines load failed', e) }
    try { await researchStore.loadClinicalTrials() } catch(e) { console.warn('Trials load failed', e) }
    try { await researchStore.loadInnovationProjects() } catch(e) { console.warn('Projects load failed', e) }
    try { await newsStore.loadNews() } catch(e) { console.warn('News load failed', e) }
    
    try { const depts = await API.getDepartments(); departments.value = depts } catch(e) { console.warn('Departments load failed', e) }
    await onCallStore.loadTodaysOnCall()
    
    try { announcements.value = await API.getAnnouncements() } catch(e) { console.warn('Announcements load failed', e) }
    try { await loadClinicalStatus() } catch(e) { console.warn('Clinical status load failed', e) }
    try { await loadClinicalStatusHistory() } catch(e) { console.warn('Status history load failed', e) }
    try { Object.assign(systemStats, await API.getSystemStats()) } catch(e) { console.warn('System stats load failed', e) }
    try { analyticsSummary.value = await API.getAnalyticsSummary() } catch(e) { console.warn('Analytics load failed', e) }
    try { researchDashboard.value = await API.getResearchDashboard() } catch(e) { console.warn('Research dashboard load failed', e) }
    
    updateDashboardStats()
  } catch (e) {
    console.error('Error loading data:', e)
    uiStore.showToast('Warning', 'Some data failed to load, but the app is still usable', 'warning')
  } finally {
    loading.value = false
  }
}
    
    // ── Computed filtered lists ─────────────────────────────────────────────
    const filteredMedicalStaff = computed(() => {
      let f = staffStore.medicalStaff
      if (staffFilters.search) {
        const q = staffFilters.search.toLowerCase()
        f = f.filter(x => x.full_name?.toLowerCase().includes(q) || x.professional_email?.toLowerCase().includes(q))
      }
      if (staffFilters.staffType) f = f.filter(x => x.staff_type === staffFilters.staffType)
      if (staffFilters.department) f = f.filter(x => x.department_id === staffFilters.department)
      if (staffFilters.status) f = f.filter(x => x.employment_status === staffFilters.status)
      if (staffFilters.residentCategory) f = f.filter(x => x.resident_category === staffFilters.residentCategory)
      if (staffFilters.hospital) f = f.filter(x => x.hospital_id === staffFilters.hospital)
      if (staffFilters.networkType) {
        const ids = staffStore.hospitalsList.filter(h => h.parent_complex === staffFilters.networkType).map(h => h.id)
        f = f.filter(x => ids.includes(x.hospital_id))
      }
      const { field, dir } = sortState.medical_staff
      const start = (pagination.medical_staff.page - 1) * pagination.medical_staff.size
      const sorted = [...f].sort((a, b) => {
        const cmp = String(a[field] ?? '').localeCompare(String(b[field] ?? ''), undefined, { numeric: true })
        return dir === 'asc' ? cmp : -cmp
      })
      return sorted.slice(start, start + pagination.medical_staff.size)
    })
    
    const filteredMedicalStaffAll = computed(() => {
      let f = staffStore.medicalStaff
      if (staffFilters.search) {
        const q = staffFilters.search.toLowerCase()
        f = f.filter(x => x.full_name?.toLowerCase().includes(q) || x.professional_email?.toLowerCase().includes(q))
      }
      if (staffFilters.staffType) f = f.filter(x => x.staff_type === staffFilters.staffType)
      if (staffFilters.department) f = f.filter(x => x.department_id === staffFilters.department)
      if (staffFilters.status) f = f.filter(x => x.employment_status === staffFilters.status)
      if (staffFilters.residentCategory) f = f.filter(x => x.resident_category === staffFilters.residentCategory)
      return f
    })
    
    const staffTotalPages = computed(() => Math.max(1, Math.ceil(filteredMedicalStaffAll.value.length / pagination.medical_staff.size)))
    
    const filteredRotations = computed(() => {
      let f = rotationStore.rotations
      if (rotationFilters.resident) f = f.filter(r => r.resident_id === rotationFilters.resident)
      if (rotationFilters.status) f = f.filter(r => r.rotation_status === rotationFilters.status)
      if (rotationFilters.trainingUnit) f = f.filter(r => r.training_unit_id === rotationFilters.trainingUnit)
      if (rotationFilters.search) {
        const q = rotationFilters.search.toLowerCase()
        f = f.filter(r => getResidentName(r.resident_id).toLowerCase().includes(q))
      }
      const { field, dir } = sortState.rotations
      const sorted = [...f].sort((a, b) => {
        let va = a[field] ?? '', vb = b[field] ?? ''
        if (field === 'start_date' || field === 'end_date') {
          va = Utils.normalizeDate(va)
          vb = Utils.normalizeDate(vb)
        }
        const cmp = String(va).localeCompare(String(vb), undefined, { numeric: true })
        return dir === 'asc' ? cmp : -cmp
      })
      const start = (pagination.rotations.page - 1) * pagination.rotations.size
      return sorted.slice(start, start + pagination.rotations.size)
    })
    
    const filteredRotationsAll = computed(() => {
      let f = rotationStore.rotations
      if (rotationFilters.resident) f = f.filter(r => r.resident_id === rotationFilters.resident)
      if (rotationFilters.status) f = f.filter(r => r.rotation_status === rotationFilters.status)
      if (rotationFilters.trainingUnit) f = f.filter(r => r.training_unit_id === rotationFilters.trainingUnit)
      return f
    })
    
    const rotationTotalPages = computed(() => Math.max(1, Math.ceil(filteredRotationsAll.value.length / pagination.rotations.size)))
    
    const filteredOnCallSchedules = computed(() => {
      let f = onCallStore.onCallSchedule
      const today = Utils.normalizeDate(new Date())
      if (!onCallFilters.date && !onCallFilters.search) f = f.filter(s => Utils.normalizeDate(s.duty_date) >= today)
      if (onCallFilters.date) f = f.filter(s => Utils.normalizeDate(s.duty_date) === onCallFilters.date)
      if (onCallFilters.shiftType) f = f.filter(s => s.shift_type === onCallFilters.shiftType)
      if (onCallFilters.physician) f = f.filter(s => s.primary_physician_id === onCallFilters.physician || s.backup_physician_id === onCallFilters.physician)
      if (onCallFilters.search) {
        const q = onCallFilters.search.toLowerCase()
        f = f.filter(s => getPhysicianName(s.primary_physician_id).toLowerCase().includes(q))
      }
      const { field, dir } = sortState.oncall
      const sorted = [...f].sort((a, b) => {
        let va = a[field] ?? '', vb = b[field] ?? ''
        if (field === 'duty_date') {
          va = Utils.normalizeDate(va)
          vb = Utils.normalizeDate(vb)
        }
        const cmp = String(va).localeCompare(String(vb), undefined, { numeric: true })
        return dir === 'asc' ? cmp : -cmp
      })
      const start = (pagination.oncall.page - 1) * pagination.oncall.size
      return sorted.slice(start, start + pagination.oncall.size)
    })
    
    const oncallTotalPages = computed(() => Math.max(1, Math.ceil(onCallStore.onCallSchedule.length / pagination.oncall.size)))
    
    const filteredAbsences = computed(() => {
      const deriveStatus = (a) => {
        if (a.current_status === 'cancelled') return 'cancelled'
        if (a.current_status === 'returned_to_duty') return 'returned_to_duty'
        const today = Utils.normalizeDate(new Date())
        const start = Utils.normalizeDate(a.start_date)
        const end = Utils.normalizeDate(a.end_date)
        if (end < today) return 'completed'
        if (start <= today) return 'currently_absent'
        return 'upcoming'
      }
      let f = absenceStore.absences.map(a => ({ ...a, current_status: deriveStatus(a) }))
      if (!absenceFilters.status && absenceFilters.hideReturned) f = f.filter(a => a.current_status !== 'returned_to_duty' && a.current_status !== 'cancelled')
      if (absenceFilters.staff) f = f.filter(a => a.staff_member_id === absenceFilters.staff)
      if (absenceFilters.status) f = f.filter(a => a.current_status === absenceFilters.status)
      if (absenceFilters.reason) f = f.filter(a => a.absence_reason === absenceFilters.reason)
      if (absenceFilters.startDate) f = f.filter(a => Utils.normalizeDate(a.start_date) >= absenceFilters.startDate)
      if (absenceFilters.search) {
        const q = absenceFilters.search.toLowerCase()
        f = f.filter(a => getStaffName(a.staff_member_id).toLowerCase().includes(q))
      }
      const { field, dir } = sortState.absences
      const sorted = [...f].sort((a, b) => {
        let va = a[field] ?? '', vb = b[field] ?? ''
        if (field === 'start_date' || field === 'end_date') {
          va = Utils.normalizeDate(va)
          vb = Utils.normalizeDate(vb)
        }
        const cmp = String(va).localeCompare(String(vb), undefined, { numeric: true })
        return dir === 'asc' ? cmp : -cmp
      })
      const start = (pagination.absences.page - 1) * pagination.absences.size
      return sorted.slice(start, start + pagination.absences.size)
    })
    
    const absencesTotalPages = computed(() => Math.max(1, Math.ceil(absenceStore.absences.length / pagination.absences.size)))
    
    const filteredTrainingUnits = computed(() => {
      let f = trainingStore.trainingUnits
      if (trainingUnitFilters.search) {
        const q = trainingUnitFilters.search.toLowerCase()
        f = f.filter(u => u.unit_name?.toLowerCase().includes(q))
      }
      if (trainingUnitFilters.department) f = f.filter(u => u.department_id === trainingUnitFilters.department)
      if (trainingUnitFilters.status) f = f.filter(u => u.unit_status === trainingUnitFilters.status)
      return f
    })
    
    const filteredTrials = computed(() => {
      let f = researchStore.clinicalTrials
      if (trialFilters.line) f = f.filter(t => t.research_line_id === trialFilters.line)
      if (trialFilters.phase) f = f.filter(t => t.phase === trialFilters.phase)
      if (trialFilters.status) f = f.filter(t => t.status === trialFilters.status)
      if (trialFilters.search) {
        const q = trialFilters.search.toLowerCase()
        f = f.filter(t => t.protocol_id?.toLowerCase().includes(q) || t.title?.toLowerCase().includes(q))
      }
      return f
    })
    
    const filteredProjects = computed(() => {
      let f = researchStore.innovationProjects
      if (projectFilters.research_line_id) f = f.filter(p => p.research_line_id === projectFilters.research_line_id)
      if (projectFilters.category) f = f.filter(p => p.category === projectFilters.category)
      if (projectFilters.stage) f = f.filter(p => (p.current_stage || p.development_stage) === projectFilters.stage)
      if (projectFilters.funding_status) f = f.filter(p => (p.funding_status || 'not_applicable') === projectFilters.funding_status)
      if (projectFilters.search) {
        const q = projectFilters.search.toLowerCase()
        f = f.filter(p => p.title?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q))
      }
      return f
    })
    
    // ── Lifecycle ───────────────────────────────────────────────────────────
    const intervals = []
    onMounted(async () => {
      const token = localStorage.getItem('neumocare_token')
      const user = localStorage.getItem('neumocare_user')
      if (token && user) {
        try {
          userStore.currentUser = JSON.parse(user)
          currentView.value = 'dashboard'
          API.request('/api/auth/me').then(data => {
            if (data?.id) {
              userStore.currentUser = { ...userStore.currentUser, ...data }
              loadAllData()
            } else {
              window.dispatchEvent(new CustomEvent('neumax:session-expired'))
            }
          }).catch(() => window.dispatchEvent(new CustomEvent('neumax:session-expired')))
        } catch {
          currentView.value = 'login'
        }
      } else {
        currentView.value = 'login'
      }
      
      intervals.push(setInterval(() => {
        currentTime.value = new Date()
        updateDashboardStats()
      }, 60000))
      intervals.push(setInterval(() => {
        if (userStore.currentUser && !isLoadingStatus.value) loadClinicalStatus()
      }, 60000))
      
      window.addEventListener('neumax:session-expired', () => {
        userStore.currentUser = null
        currentView.value = 'login'
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
      uiStore, userStore, staffStore, rotationStore, trainingStore, onCallStore, absenceStore, researchStore, newsStore,
      loading, saving, showPassword, currentTime, currentView,
      staffView, onCallView, rotationView, researchHubTab, analyticsActiveTab,
      staffFilters, rotationFilters, onCallFilters, absenceFilters, trainingUnitFilters, trialFilters, projectFilters,
      pagination, sortState, sortBy, sortIcon, goToPage,
      staffTotalPages, rotationTotalPages, oncallTotalPages, absencesTotalPages,
      staffProfileModal, medicalStaffModal, rotationModal, rotationViewModal, activationModal,
      onCallModal, absenceModal, absenceResolutionModal, trainingUnitModal, unitResidentsModal,
      unitCliniciansModal, unitDetailDrawer, occupancyPanel, tlPopover,
      researchLineModal, clinicalTrialModal, innovationProjectModal, assignCoordinatorModal,
      trialDetailModal, deptPanel, reassignmentModal, deptReassignModal,
      staffTypeModal, exportModal, userProfileModal, announcementReadModal, communicationsModal,
      systemStats, clinicalStatus, clinicalStatusHistory, isLoadingStatus,
      newStatusText, selectedAuthorId, expiryHours, liveStatsEditMode,
      researchDashboard, researchLinesPerformance, partnerCollaborations, trialsTimeline,
      analyticsSummary, loadingAnalytics, dailyBriefing, todaysOnCall, residentGapWarnings,
      announcements, departments,
      loginForm, loginLoading, loginError, loginFieldErrors,
      hasPermission, formatDate, formatDateShort, formatRelativeDate, formatTime,
      formatRelativeTime, formatTimeAgo, formatNewsDate, formatClinicalDuration,
      normalizeDate, getInitials, formatPercentage, getPhaseColor, getStageColor,
      getStageConfig, getPartnerTypeColor, getTomorrow,
      getStaffName, getStaffEmail, getResidentName, getSupervisorName, getPhysicianName,
      getTrainingUnitName, getDepartmentName, getResearchLineName, getLineAccent,
      formatStaffType, formatStaffTypeShort, getStaffTypeClass, isResidentType,
      formatEmploymentStatus, formatAbsenceReason, formatRotationStatus, formatUserRole,
      formatStudyStatus, formatAudience, formatTrainingYear, formatPhone,
      formatLicense, formatSpecialization, effectiveResidentYear,
      getRoleInfo, getStaffRoles, getResidentCategoryInfo, formatResidentCategorySimple,
      formatResidentCategoryDetailed, getResidentCategoryIcon, getResidentCategoryTooltip,
      calculateAbsenceDuration, getDaysRemaining, getDaysUntilStart,
      getDaysRemainingColor, isToday,
      getHorizonMonths, getHorizonRangeLabel, getResidentRotationsInHorizon,
      getRotationBarStyle, rotationStartsInHorizon, rotationEndsInHorizon,
      isRotationActive, isShiftActive, viewRotationDetails,
      getRotationProgress, getCurrentRotationForStaff, getRotationHistory,
      getUpcomingRotations, getRotationDaysLeft, getCurrentRotationSupervisor,
      getUnitActiveRotationCount, getUnitRotations, getUnitScheduledCount,
      getUnitOverlapWarning, getUnitMonthOccupancy, getNextFreeMonth,
      getTimelineMonths, getUnitSlots, getDaysUntilFree, getResidentShortName,
      isOnCallToday, getUpcomingOnCall, getUpcomingLeave,
      addKeyword, removeKeyword, handleKeywordKey,
      toggleCoInvestigator, toggleSubInvestigator, toggleProjectCoInvestigator, togglePartnerNeed,
      newsWordCount, newsWordLimit, newsAuthorName, newsLineName,
      newsDrawerPrev, newsDrawerNext, newsDrawerBodyParagraphs,
      newsDrawerInitials, newsDrawerAuthorFull, newsDrawerReadMins, newsDrawerLineName,
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
      filteredMedicalStaff, filteredRotations, filteredOnCallSchedules,
      filteredAbsences, filteredTrainingUnits, filteredTrials, filteredProjects,
      getCurrentViewTitle, getCurrentViewSubtitle, getSearchPlaceholder,
      Utils, PROJECT_STAGES
    }
  }
})

app.use(pinia)
app.mount('#app')
