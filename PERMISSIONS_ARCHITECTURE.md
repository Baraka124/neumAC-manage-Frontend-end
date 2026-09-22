# neumDesk — Permissions Architecture: Current State & Proposal

## 1. Current State (as of Sept 2026)

### What exists in the database

**`app_users` table** — the login accounts:
| Email | Role | Status | Linked staff |
|---|---|---|---|
| barakaaloyce750@gmail.com | system_admin | active | Baraka Laiza |
| pedro.marcos@chuac.es | department_head | active | Pedro Jorge Marcos Rodríguez |
| department.head@hospital.com | department_head | active | — (test) |
| resident.manager@hospital.com | resident_manager | active | — (test) |
| resident.manager@test.com | resident_manager | active | — (test) |
| + 5 inactive test accounts | various | inactive | — |

**`user_permissions` table** — exists but is **completely empty**. Zero rows.

**`medical_staff` table** — 23 real people (18 attendings, 4 residents, 1 biomed engineer). No role or permission columns. Only `staff_type` and `employment_status`.

### How authentication works today

1. User submits email + password to `POST /api/auth/login`
2. Backend looks up `app_users` by email, compares bcrypt hash
3. Returns a JWT token + user object (id, email, full_name, user_role, admin_level, medical_staff_id)
4. Frontend stores token, includes it in all API requests
5. Backend middleware `authenticateToken` verifies JWT on each request
6. Backend middleware `checkPermission(module, action)` checks `user_permissions` table

### The problem

`checkPermission` queries `user_permissions` for the logged-in user + module. Since the table is **empty**, the result depends on how the middleware handles "no rows found":
- If it defaults to **deny** → every write action is blocked
- If it defaults to **allow** → there is no access control at all

In practice, the system works because `user_role` on `app_users` gives some coarse access (system_admin and department_head get through), but there is no granular module-level control.

### What `user_role` values exist
- `system_admin` — full access (Baraka)
- `department_head` — full access (Pedro)
- `resident_manager` — test accounts, unclear permissions
- `viewing_doctor` — test account, unclear permissions

These roles are strings on `app_users` with no formal definition of what each can do.

---

## 2. The Real Department

23 active staff. In practice, 2-3 people will log in regularly (Baraka, Pedro, maybe a coordinator). The rest are *subjects* of the system (their schedules, rotations, leave) but not *users* of it.

| Category | Count | Login? | What they need |
|---|---|---|---|
| System admin (Baraka) | 1 | Yes | Everything: config, sync, all modules, user management |
| Department head (Pedro) | 1 | Yes | Everything clinical + research, approve decisions |
| Coordinators (future) | 1-2 | Yes | Operations: schedules, leave, rotations, callouts |
| Attendings | 17 | Maybe later | View schedules, their own leave, publications |
| Residents | 4 | Maybe later | View their rotation, request leave |

### Key insight: two tiers of access design

**Tier 1 (now):** 2-3 power users who manage the department. They need full or near-full access. This is what you have today.

**Tier 2 (future):** 20+ staff members who view their own data. This requires per-user accounts, login flow, self-service features, and row-level filtering. This is a significant expansion.

---

## 3. Proposed Architecture

### Principle 1: Roles define access, exceptions override

Define 5 roles with fixed permission sets. Every `app_users` record has one role. The `user_permissions` table stores only exceptions (grant or deny that differs from the role default).

### Proposed roles and their permissions

```
ROLE: system_admin
  All modules: full read + write
  User management: full
  System settings: full
  Sync: full

ROLE: department_head
  All clinical modules: full read + write
  Research modules: full read + write
  User management: read (view users, not create/delete)
  System settings: read
  
ROLE: coordinator
  Clinical operations: full read + write
    (on-call, rotations, leave, callouts, units)
  Staff directory: read + write
  Research: read + write
  Publications: read + write
  System settings: read
  User management: none

ROLE: attending
  Staff directory: read
  On-call schedule: read
  Rotations: read (all) + write (own supervisees)
  Leave: read (own) + write (own)
  Research: read (own lines/trials)
  Publications: read + write (own)
  System settings: none
  User management: none

ROLE: resident
  Staff directory: read (limited)
  On-call schedule: read (own assignments)
  Rotations: read (own)
  Leave: request (pending approval)
  Research: none
  Publications: read
  System settings: none
  User management: none
```

### Principle 2: Keep it in code, not in a table (for now)

With 5 roles, a `roles` table with a `permissions` JSONB column is over-engineering. Define the permission matrix as a constant in `index.js`:

```javascript
const ROLE_PERMISSIONS = {
  system_admin:    { medical_staff:'rw', oncall_schedule:'rw', resident_rotations:'rw', staff_absence:'rw', training_units:'rw', clinical_trials:'rw', innovation_projects:'rw', research_lines:'rw', news_posts:'rw', departments:'rw', emergency_callouts:'rw', system_settings:'rw', user_management:'rw' },
  department_head: { medical_staff:'rw', oncall_schedule:'rw', resident_rotations:'rw', staff_absence:'rw', training_units:'rw', clinical_trials:'rw', innovation_projects:'rw', research_lines:'rw', news_posts:'rw', departments:'rw', emergency_callouts:'rw', system_settings:'r', user_management:'r' },
  coordinator:     { medical_staff:'rw', oncall_schedule:'rw', resident_rotations:'rw', staff_absence:'rw', training_units:'rw', clinical_trials:'rw', innovation_projects:'rw', research_lines:'rw', news_posts:'rw', departments:'r', emergency_callouts:'rw', system_settings:'r' },
  attending:       { medical_staff:'r', oncall_schedule:'r', resident_rotations:'r', staff_absence:'r_own_w', training_units:'r', clinical_trials:'r', innovation_projects:'r', research_lines:'r', news_posts:'rw', departments:'r', emergency_callouts:'r' },
  resident:        { medical_staff:'r', oncall_schedule:'r_own', resident_rotations:'r_own', staff_absence:'r_own_req', training_units:'r', news_posts:'r' },
}
```

Where:
- `rw` = full read + write
- `r` = read only
- `r_own_w` = read all, write own records only
- `r_own` = read only own records
- `r_own_req` = read own, write creates a request (pending approval)

### Principle 3: The middleware resolves role → permissions → check

Updated `checkPermission` flow:
1. `req.user` already has `user_role` from the JWT
2. Look up `ROLE_PERMISSIONS[req.user.user_role][module]`
3. Check `user_permissions` table for any override for this user + module
4. Override wins over role default
5. If no role permission and no override → deny

### Principle 4: `app_users` is the identity, `medical_staff` is the profile

Every `app_users` record that represents a real person should have `medical_staff_id` linking to their staff profile. This is how the system knows "this login = this physician" for row-level filtering (e.g., "show only MY rotations").

Currently only Baraka and Pedro have this link. Future staff accounts need it.

### Principle 5: Don't build Tier 2 until you need it

Row-level filtering ("residents see only their own rotations"), leave approval workflows, and self-service features are Tier 2. Don't build them now. The current 2-3 users are all power users with full or near-full access.

When you're ready for Tier 2:
- Create `app_users` accounts for attendings/residents
- Set their role (attending/resident)
- The middleware automatically restricts based on role
- Add row-level filtering WHERE clauses for `r_own` permissions

---

## 4. Implementation steps

### Phase 1 (now — 30 min of backend work)
1. Add `ROLE_PERMISSIONS` constant to `index.js`
2. Update `checkPermission` to use role-based lookup + override from `user_permissions`
3. Clean up test accounts in `app_users` (delete the 5 inactive test accounts)
4. Verify Baraka (system_admin) and Pedro (department_head) work correctly

### Phase 2 (when needed — staff self-service)
1. Create `app_users` accounts for real staff (bulk invite or self-registration)
2. Link each to their `medical_staff` record via `medical_staff_id`
3. Assign roles (attending/resident)
4. Add `r_own` filtering to relevant endpoints

### Phase 3 (when needed — approval workflows)
1. Leave requests create a pending record
2. Department head/coordinator approves → status changes
3. Notification system for pending approvals

---

## 5. Open design decisions

| Decision | Options | Recommendation |
|---|---|---|
| Can attendings record leave for others? | Own only vs. anyone | Own only (coordinator handles others) |
| Can residents see the full on-call schedule? | Full vs. own only | Full read (it's a small department, transparency helps) |
| Who can publish to Research Library? | Coordinators only vs. any attending | Any attending (they write their own papers) |
| Leave approval flow? | Direct record vs. request → approve | Direct for now (Tier 1), request flow in Tier 2 |
| How many people log in? | 2-3 now | Start with 2-3, expand when ready |
| Grounded (chat) available to? | Everyone vs. coordinators | Coordinators only for now (it changes data) |
