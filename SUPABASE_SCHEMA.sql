# neumDesk — Complete Supabase Schema
# Generated: September 2026
# Project: vssmguzuvekkecbmwcjw (eu-central)
# 50 public tables


-- ════════════════════════════════════════════════════════════
-- CORE IDENTITY
-- ════════════════════════════════════════════════════════════

CREATE TABLE hospitals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text NOT NULL UNIQUE,
  city text,
  region text DEFAULT 'Galicia',
  address text,
  type text,
  parent_complex text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(255) NOT NULL,
  code varchar(50) NOT NULL UNIQUE,
  status varchar(20) DEFAULT 'active' CHECK (status IN ('active','inactive')),
  description text,
  head_of_department_id uuid REFERENCES medical_staff(id) ON DELETE SET NULL,
  contact_email text,
  contact_phone text,
  hospital_id uuid REFERENCES hospitals(id) ON DELETE SET NULL,
  contact_name text,
  service_type text CHECK (service_type IN ('home_department','rotation_service','external_institution')),
  notes text,
  is_primary boolean NOT NULL DEFAULT false,
  is_external boolean NOT NULL DEFAULT false,
  display_order integer NOT NULL DEFAULT 99,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE academic_degrees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  abbreviation text,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE medical_staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  professional_email text,
  staff_type text NOT NULL,
  staff_id text NOT NULL UNIQUE,
  resident_category text CHECK (resident_category IN ('department_internal','rotating_other_dept','external_resident')),
  training_year text,
  primary_clinic text,
  work_phone text,
  medical_license text,
  can_supervise_residents boolean DEFAULT false,
  employment_status text DEFAULT 'active' CHECK (employment_status IN ('active','on_leave','inactive')),
  special_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  resident_type varchar(50),
  home_department varchar(100),
  external_institution varchar(200),
  department_id uuid REFERENCES departments(id) ON DELETE SET NULL,
  specialization varchar(255),
  years_experience integer,
  biography text,
  date_of_birth date,
  mobile_phone varchar(50),
  office_phone varchar(50),
  training_level varchar(20),
  academic_degree varchar(100),
  certificate_status varchar(50),
  clinical_study_certificate varchar(255),
  is_research_coordinator boolean NOT NULL DEFAULT false,
  hospital_id uuid REFERENCES hospitals(id),
  home_department_id uuid REFERENCES departments(id) ON DELETE SET NULL,
  external_contact_name text,
  external_contact_email text,
  external_contact_phone text,
  academic_degree_id uuid REFERENCES academic_degrees(id) ON DELETE SET NULL,
  has_medical_license boolean DEFAULT false,
  residency_start_date date,
  residency_end_date_calc date,
  residency_year_calc text,
  residency_year_override text,
  can_be_pi boolean NOT NULL DEFAULT false,
  can_be_coi boolean NOT NULL DEFAULT false,
  has_phd boolean NOT NULL DEFAULT false,
  phd_field text,
  is_chief_of_department boolean NOT NULL DEFAULT false,
  is_resident_manager boolean NOT NULL DEFAULT false,
  is_oncall_manager boolean NOT NULL DEFAULT false,
  clinical_study_certificates text[],
  affiliation_type text NOT NULL DEFAULT 'primary' CHECK (affiliation_type IN ('primary','affiliated','visiting','honorary')),
  primary_dept_name text,
  is_public boolean NOT NULL DEFAULT false,
  public_bio text,
  public_photo_url text,
  title text CHECK (title IN ('Dr.','Dra.','Prof.','Prof. Dra.','Prof. Dr.',NULL)),
  deleted_at timestamptz,
  orcid_id text,
  scholar_url text,
  researchgate_url text,
  pubmed_query text
);

CREATE TABLE staff_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type_key text NOT NULL UNIQUE,
  display_name text NOT NULL,
  badge_class text DEFAULT 'badge-secondary',
  is_resident_type boolean DEFAULT false,
  can_supervise boolean DEFAULT false,
  is_active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE staff_certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid NOT NULL REFERENCES medical_staff(id) ON DELETE CASCADE,
  certificate_name text NOT NULL,
  issued_date date,
  renewal_months integer DEFAULT 24,
  expiry_date date,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ════════════════════════════════════════════════════════════
-- AUTH & PERMISSIONS
-- ════════════════════════════════════════════════════════════

CREATE TABLE app_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email varchar(255) NOT NULL UNIQUE,
  full_name varchar(255) NOT NULL,
  user_role varchar(50) NOT NULL DEFAULT 'viewing_doctor',
  password_hash varchar(255),
  admin_level integer NOT NULL DEFAULT 0,
  account_status text DEFAULT 'active' CHECK (account_status IN ('active','suspended','inactive')),
  medical_staff_id uuid REFERENCES medical_staff(id),
  department_id uuid REFERENCES departments(id) ON DELETE SET NULL,
  phone_number text,
  avatar_url text,
  job_title text,
  notifications_enabled boolean DEFAULT true,
  absence_notifications boolean DEFAULT true,
  announcement_notifications boolean DEFAULT true,
  reset_token text,
  reset_token_expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE user_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  module text NOT NULL,
  can_read boolean NOT NULL DEFAULT false,
  can_write boolean NOT NULL DEFAULT false,
  granted_by uuid REFERENCES app_users(id) ON DELETE SET NULL,
  granted_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, module)
);

CREATE TABLE system_roles (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text,
  level text NOT NULL DEFAULT 'read',
  permissions jsonb NOT NULL DEFAULT '{}',
  is_system_role boolean DEFAULT false,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE system_permissions (
  id text PRIMARY KEY DEFAULT 'permissions_config',
  permissions_data jsonb NOT NULL,
  updated_by uuid REFERENCES auth.users(id),
  updated_by_name text,
  updated_at timestamptz DEFAULT now(),
  version bigint,
  restored boolean DEFAULT false,
  redo boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- ════════════════════════════════════════════════════════════
-- CLINICAL OPERATIONS
-- ════════════════════════════════════════════════════════════

CREATE TABLE training_units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_code varchar(20) NOT NULL UNIQUE,
  unit_name varchar(100) NOT NULL,
  department_name varchar(100) NOT NULL,
  location_building varchar(100),
  location_floor varchar(50),
  maximum_residents integer NOT NULL CHECK (maximum_residents > 0),
  default_supervisor_id uuid,
  unit_description text,
  unit_status varchar(20) DEFAULT 'active' CHECK (unit_status IN ('active','under_renovation','inactive')),
  specialty varchar(100),
  department_id uuid REFERENCES departments(id) ON DELETE SET NULL,
  supervisor_id uuid REFERENCES medical_staff(id) ON DELETE SET NULL,
  unit_type varchar DEFAULT 'training_unit',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE resident_rotations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rotation_id varchar(50) NOT NULL UNIQUE,
  resident_id uuid NOT NULL REFERENCES medical_staff(id) ON DELETE CASCADE,
  training_unit_id uuid NOT NULL REFERENCES training_units(id) ON DELETE CASCADE,
  supervising_attending_id uuid NOT NULL REFERENCES medical_staff(id) ON DELETE SET NULL,
  start_date date NOT NULL,
  end_date date NOT NULL CHECK (end_date >= start_date),
  rotation_category varchar(50) DEFAULT 'clinical_rotation' CHECK (rotation_category IN ('clinical_rotation','elective_rotation','research_block','administrative_duty')),
  rotation_status varchar(20) DEFAULT 'scheduled' CHECK (rotation_status IN ('scheduled','active','completed','extended','terminated_early','cancelled')),
  clinical_notes text,
  supervisor_evaluation text,
  goals text,
  notes text,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE coverage_areas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text NOT NULL UNIQUE,
  is_active boolean DEFAULT true,
  applies_weekends boolean DEFAULT true,
  display_order integer DEFAULT 0,
  color text DEFAULT '#00b3b3',
  requires_coverage boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE oncall_schedule (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id varchar(50) NOT NULL UNIQUE,
  duty_date date NOT NULL,
  shift_type varchar(50) NOT NULL CHECK (shift_type IN ('primary_call','backup_call','float_physician','weekend_coverage','on_call_home','on_call_mixed','on_call_present')),
  primary_physician_id uuid NOT NULL REFERENCES medical_staff(id) ON DELETE SET NULL,
  backup_physician_id uuid REFERENCES medical_staff(id) ON DELETE SET NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  coverage_notes text,
  coverage_area_id uuid REFERENCES coverage_areas(id),
  has_conflict boolean NOT NULL DEFAULT false,
  created_by uuid,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE staff_absence_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_member_id uuid NOT NULL REFERENCES medical_staff(id) ON DELETE CASCADE,
  absence_type varchar(20) NOT NULL CHECK (absence_type IN ('planned','unplanned')),
  absence_reason varchar(50) NOT NULL CHECK (absence_reason IN ('vacation','conference','sick_leave','training','personal','other')),
  start_date date NOT NULL,
  end_date date NOT NULL CHECK (end_date >= start_date),
  total_days integer NOT NULL CHECK (total_days > 0),
  days_remaining integer,
  coverage_arranged boolean DEFAULT false,
  covering_staff_id uuid REFERENCES medical_staff(id) ON DELETE SET NULL,
  coverage_notes text,
  current_status varchar(30) NOT NULL CHECK (current_status IN ('planned_leave','currently_absent','returned_to_duty','cancelled')),
  hod_notes text,
  recorded_by uuid REFERENCES app_users(id),
  recorded_at timestamptz DEFAULT now(),
  last_updated timestamptz DEFAULT now(),
  is_recurring boolean NOT NULL DEFAULT false,
  recurrence_pattern text CHECK (recurrence_pattern IN ('weekly','biweekly','monthly')),
  recurrence_end_date date,
  recurrence_parent_id uuid REFERENCES staff_absence_records(id) ON DELETE SET NULL,
  deleted_at timestamptz
);

CREATE TABLE emergency_callouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid REFERENCES medical_staff(id) ON DELETE CASCADE,
  called_at timestamptz NOT NULL,
  end_time timestamptz,
  reason_category text DEFAULT 'unspecified',
  time_type text DEFAULT 'night',
  notes text,
  coverage_area_id uuid REFERENCES coverage_areas(id) ON DELETE SET NULL,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE daily_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id varchar(20) UNIQUE DEFAULT 'ASSIGN-' || substr(md5(random()::text), 1, 8),
  staff_member_id uuid NOT NULL,
  assignment_date date NOT NULL,
  assignment_type varchar(50) NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL CHECK (end_time > start_time),
  location_name varchar(100) NOT NULL,
  specific_location varchar(100),
  assignment_notes text,
  supervising_attending_id uuid,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ════════════════════════════════════════════════════════════
-- RESEARCH & INNOVATION
-- ════════════════════════════════════════════════════════════

CREATE TABLE research_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  line_number integer NOT NULL UNIQUE,
  name text NOT NULL,
  short_name text,
  description text,
  deep_content text,
  deep_content_updated_at timestamptz,
  capabilities text,
  coordinator_id uuid REFERENCES medical_staff(id) ON DELETE SET NULL,
  keywords text[] NOT NULL DEFAULT '{}',
  track_record text[],
  is_public boolean NOT NULL DEFAULT true,
  active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE research_line_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  research_line_id uuid NOT NULL REFERENCES research_lines(id) ON DELETE CASCADE,
  staff_id uuid NOT NULL REFERENCES medical_staff(id) ON DELETE CASCADE,
  role_on_line text,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE (research_line_id, staff_id)
);

CREATE TABLE clinical_trials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  protocol_id text UNIQUE,
  title text NOT NULL,
  research_line_id uuid REFERENCES research_lines(id),
  phase text NOT NULL CHECK (phase IN ('Phase I','Phase II','Phase III','Phase IV')),
  status text NOT NULL CHECK (status IN ('Reclutando','Activo','Completado','En preparación')),
  study_type text CHECK (study_type IN ('Interventional','Observational','Expanded Access')),
  description text,
  inclusion_criteria text,
  exclusion_criteria text,
  principal_investigator_id uuid REFERENCES medical_staff(id),
  co_investigators uuid[] DEFAULT '{}',
  sub_investigators uuid[] NOT NULL DEFAULT '{}',
  data_manager_id uuid REFERENCES medical_staff(id) ON DELETE SET NULL,
  team_roles jsonb NOT NULL DEFAULT '{}',
  external_team jsonb NOT NULL DEFAULT '[]',
  contact_email text,
  sponsor_name text,
  sponsor_type text CHECK (sponsor_type IN ('Pharma','MedTech','Academic','Foundation','Government')),
  start_date date,
  end_date date,
  estimated_end_date date,
  actual_end_date date,
  enrollment_target integer,
  actual_enrollment integer,
  funding_amount numeric,
  funding_currency text DEFAULT 'EUR',
  funding_status text DEFAULT 'not_applicable' CHECK (funding_status IN ('not_applicable','seeking','funded','completed')),
  ethics_status text CHECK (ethics_status IN ('pending','approved','exempt','not_required')),
  protocol_finalized boolean NOT NULL DEFAULT false,
  is_multicentre boolean NOT NULL DEFAULT false,
  participating_centres integer,
  scope_type text DEFAULT 'specific' CHECK (scope_type IN ('specific','general')),
  scope_note text CHECK (char_length(scope_note) <= 150),
  population_type text DEFAULT 'adult' CHECK (population_type IN ('adult','paediatric','mixed','not_applicable')),
  target_diseases text[] NOT NULL DEFAULT '{}',
  tags text[] DEFAULT '{}',
  milestones jsonb DEFAULT '[]',
  nct_number text,
  eudract_number text,
  registry_url text,
  research_origin text,
  delivery_model text,
  institutional_role text,
  featured_in_website boolean DEFAULT true,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE clinical_trial_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinical_trial_id uuid NOT NULL REFERENCES clinical_trials(id) ON DELETE CASCADE,
  research_line_id uuid NOT NULL REFERENCES research_lines(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE (clinical_trial_id, research_line_id)
);

CREATE TABLE innovation_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  category text NOT NULL CHECK (category IN ('Dispositivo','Salud Digital','IA / ML','Tecnología Quirúrgica')),
  development_stage text NOT NULL,
  description text NOT NULL,
  clinical_rationale text,
  research_line_id uuid REFERENCES research_lines(id),
  lead_investigator_id uuid REFERENCES medical_staff(id),
  co_investigators uuid[] NOT NULL DEFAULT '{}',
  team_roles jsonb NOT NULL DEFAULT '{}',
  external_team jsonb NOT NULL DEFAULT '[]',
  project_nature text NOT NULL DEFAULT 'clinical_innovation' CHECK (project_nature IN ('clinical_study','clinical_innovation','hybrid')),
  current_stage text CHECK (current_stage IN ('concept','development','pilot','validation','scaling','completed')),
  start_date date,
  estimated_end_date date,
  trl_level integer CHECK (trl_level BETWEEN 1 AND 9),
  funding_source text,
  budget numeric,
  budget_currency text DEFAULT 'EUR',
  funding_status text NOT NULL DEFAULT 'not_applicable' CHECK (funding_status IN ('funded','seeking','self_funded','not_applicable','closed')),
  ip_status text CHECK (ip_status IN ('Patent pending','Patent granted','Software registered','Trade secret','None')),
  scope_type text DEFAULT 'specific' CHECK (scope_type IN ('specific','general')),
  scope_note text CHECK (char_length(scope_note) <= 150),
  scope_finalized boolean NOT NULL DEFAULT false,
  population_type text DEFAULT 'adult' CHECK (population_type IN ('adult','paediatric','mixed','not_applicable')),
  regulatory_pathway text DEFAULT 'none' CHECK (regulatory_pathway IN ('none','ce_mdr','samd','aemps','fda','other')),
  target_diseases text[] NOT NULL DEFAULT '{}',
  keywords text[] NOT NULL DEFAULT '{}',
  tags text[] DEFAULT '{}',
  milestones jsonb DEFAULT '[]',
  partners jsonb DEFAULT '[]',
  partner_ids uuid[] DEFAULT '{}',
  partner_needs text[],
  partner_found boolean NOT NULL DEFAULT false,
  partner_name text,
  project_url text,
  repo_url text,
  demo_url text,
  is_featured boolean NOT NULL DEFAULT false,
  featured_in_website boolean DEFAULT true,
  display_order integer DEFAULT 0,
  research_origin text,
  delivery_model text,
  institutional_role text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE innovation_project_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  innovation_project_id uuid NOT NULL REFERENCES innovation_projects(id) ON DELETE CASCADE,
  research_line_id uuid NOT NULL REFERENCES research_lines(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE (innovation_project_id, research_line_id)
);

CREATE TABLE research_protocols (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinical_trial_id uuid REFERENCES clinical_trials(id) ON DELETE CASCADE,
  innovation_project_id uuid REFERENCES innovation_projects(id) ON DELETE CASCADE,
  protocol_code text,
  title text,
  version text,
  version_date date,
  status text DEFAULT 'draft' CHECK (status IN ('draft','final','superseded','not_required')),
  document_url text,
  is_current boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT protocol_one_parent CHECK (
    (clinical_trial_id IS NOT NULL AND innovation_project_id IS NULL) OR
    (clinical_trial_id IS NULL AND innovation_project_id IS NOT NULL)
  )
);

CREATE TABLE research_ethics_clearances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinical_trial_id uuid REFERENCES clinical_trials(id) ON DELETE CASCADE,
  innovation_project_id uuid REFERENCES innovation_projects(id) ON DELETE CASCADE,
  required boolean DEFAULT true,
  committee_name text,
  reference text,
  status text DEFAULT 'not_submitted' CHECK (status IN ('not_submitted','submitted','approved','conditional','rejected','expired','not_required')),
  submission_date date,
  decision_date date,
  expiry_date date,
  document_url text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT clearance_one_parent CHECK (
    (clinical_trial_id IS NOT NULL AND innovation_project_id IS NULL) OR
    (clinical_trial_id IS NULL AND innovation_project_id IS NOT NULL)
  )
);

CREATE TABLE publications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  authors text,
  journal_name text,
  published_at date,
  doi text,
  pmid text,
  url text,
  research_line_id uuid REFERENCES research_lines(id) ON DELETE SET NULL,
  impact_factor numeric,
  citation_count integer,
  featured_in_website boolean DEFAULT false,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  type text CHECK (type IN ('Pharma','MedTech','Tech','Academic','Hospital','SME','Foundation','Government')),
  logo_url text, website text,
  main_contact_name text, main_contact_email text, main_contact_phone text, address text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE partner_needs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  need_name text NOT NULL UNIQUE,
  category text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE project_partners (
  project_id uuid NOT NULL REFERENCES innovation_projects(id) ON DELETE CASCADE,
  partner_id uuid NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  role text,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (project_id, partner_id)
);

CREATE TABLE tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  category text CHECK (category IN ('therapy_area','technology','phase','partner_type','custom')),
  created_at timestamptz DEFAULT now()
);

-- ════════════════════════════════════════════════════════════
-- COMMUNICATIONS & NEWS
-- ════════════════════════════════════════════════════════════

CREATE TABLE news_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_type text NOT NULL CHECK (post_type IN ('update','article','publication','highlight')),
  title text NOT NULL,
  body text,
  word_count integer,
  featured_image_url text,
  image_urls text[] NOT NULL DEFAULT '{}',
  author_id uuid REFERENCES medical_staff(id),
  research_line_id uuid REFERENCES research_lines(id),
  authors_text text,
  journal_name text,
  doi text,
  keywords text[] NOT NULL DEFAULT '{}',
  is_public boolean NOT NULL DEFAULT false,
  is_featured boolean NOT NULL DEFAULT false,
  show_on_homepage boolean DEFAULT false,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  expires_at timestamptz,
  published_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT news_posts_keywords_max_10 CHECK (cardinality(keywords) <= 10)
);

CREATE TABLE department_announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id varchar(255) NOT NULL UNIQUE,
  title varchar(200),
  content text,
  description text,
  type varchar(50),
  priority_level varchar(20) DEFAULT 'normal' CHECK (priority_level IN ('urgent','high','normal','low')),
  visible_to_roles varchar(50)[] DEFAULT ARRAY['viewing_doctor'],
  target_audience varchar(50) DEFAULT 'all',
  publish_start_date date NOT NULL,
  publish_end_date date,
  created_by uuid NOT NULL,
  created_by_name varchar(255),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  title varchar(255) NOT NULL,
  message text NOT NULL,
  type varchar(50) DEFAULT 'info',
  read boolean DEFAULT false,
  link text,
  action_view text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ════════════════════════════════════════════════════════════
-- GROUNDED (AI ASSISTANT PERSISTENCE)
-- ════════════════════════════════════════════════════════════

CREATE TABLE grounded_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  scope_type text,
  scope_id text,
  title text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE grounded_turns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES grounded_threads(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user','assistant','system')),
  query_text text,
  answer_type text,
  payload jsonb,
  evidence jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE grounded_watchlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  object_type text NOT NULL,
  object_id text NOT NULL,
  rule_key text,
  config jsonb,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE neumdesk_brain (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL CHECK (kind IN ('pattern','synonym','phrasing','failed_query')),
  intent text,
  content text NOT NULL,
  meta jsonb DEFAULT '{}',
  enabled boolean NOT NULL DEFAULT true,
  created_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ════════════════════════════════════════════════════════════
-- OPERATIONAL & AUDIT
-- ════════════════════════════════════════════════════════════

CREATE TABLE clinical_status_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status_text text NOT NULL,
  author_id uuid NOT NULL REFERENCES medical_staff(id),
  author_name text NOT NULL,
  department_id uuid REFERENCES departments(id),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL CHECK (expires_at > created_at)
);

CREATE TABLE live_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type varchar(50) DEFAULT 'stats_update',
  title varchar(200),
  content text,
  metrics jsonb DEFAULT '{}',
  alerts jsonb DEFAULT '{}',
  priority varchar(20) DEFAULT 'normal',
  author_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE ops_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_key text NOT NULL,
  metric_value integer,
  metric_sub text,
  metric_value2 integer,
  posted_by uuid REFERENCES app_users(id),
  posted_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  valid_for_date date DEFAULT CURRENT_DATE
);

CREATE TABLE system_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_name varchar(255) DEFAULT 'NeumoCare Hospital',
  default_department_id uuid,
  max_residents_per_unit integer DEFAULT 10,
  default_rotation_duration integer DEFAULT 12,
  enable_audit_logging boolean DEFAULT true,
  require_mfa boolean DEFAULT false,
  maintenance_mode boolean DEFAULT false,
  notifications_enabled boolean DEFAULT true,
  absence_notifications boolean DEFAULT true,
  announcement_notifications boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name text NOT NULL,
  record_id uuid NOT NULL,
  action text NOT NULL CHECK (action IN ('INSERT','UPDATE','DELETE')),
  changed_by uuid REFERENCES app_users(id) ON DELETE SET NULL,
  changed_at timestamptz NOT NULL DEFAULT now(),
  old_data jsonb,
  new_data jsonb,
  changed_fields text[]
);

CREATE TABLE absence_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  absence_record_id uuid REFERENCES staff_absence_records(id) ON DELETE CASCADE,
  changed_field varchar(50),
  old_value text,
  new_value text,
  changed_by uuid REFERENCES app_users(id),
  changed_at timestamptz DEFAULT now(),
  change_type varchar(20) CHECK (change_type IN ('created','updated','status_changed','deleted'))
);

CREATE TABLE system_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  log_timestamp timestamptz NOT NULL DEFAULT now(),
  user_id uuid,
  user_role varchar(50),
  action_type varchar(50) NOT NULL CHECK (action_type IN ('user_login','user_logout','create_record','update_record','delete_record','approve_request','reject_request','system_config_change')),
  table_name varchar(50),
  record_id uuid,
  ip_address inet,
  user_agent text,
  details jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id),
  user_name text,
  user_role text,
  action text NOT NULL,
  details text,
  resource text,
  resource_id uuid,
  permission_level text,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- ════════════════════════════════════════════════════════════
-- SUPPORTING TABLES
-- ════════════════════════════════════════════════════════════

CREATE TABLE clinical_units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(255) NOT NULL,
  code varchar(50) NOT NULL UNIQUE,
  department_id uuid REFERENCES departments(id) ON DELETE SET NULL,
  unit_type varchar(50) DEFAULT 'clinical',
  status varchar(20) DEFAULT 'active',
  description text,
  supervisor_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE clinical_unit_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinical_unit_id uuid NOT NULL REFERENCES clinical_units(id) ON DELETE CASCADE,
  staff_id uuid NOT NULL REFERENCES medical_staff(id) ON DELETE CASCADE,
  assignment_type varchar(20) NOT NULL CHECK (assignment_type IN ('attending','resident')),
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  end_date date,
  status varchar(20) DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (clinical_unit_id, staff_id)
);

CREATE TABLE unit_staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id uuid NOT NULL REFERENCES training_units(id) ON DELETE CASCADE,
  staff_id uuid NOT NULL REFERENCES medical_staff(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'primary' CHECK (role IN ('primary','secondary')),
  assigned_from date DEFAULT CURRENT_DATE,
  assigned_until date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (unit_id, staff_id)
);

CREATE TABLE attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_size integer,
  mime_type text,
  uploaded_by uuid REFERENCES app_users(id) ON DELETE SET NULL,
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE contact_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  organisation text,
  email text NOT NULL,
  area_of_interest text,
  message text,
  status text DEFAULT 'new' CHECK (status IN ('new','read','replied','archived')),
  created_at timestamptz DEFAULT now()
);

-- ════════════════════════════════════════════════════════════
-- INDEXES
-- ════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_news_posts_keywords_gin ON news_posts USING gin (keywords);
CREATE INDEX IF NOT EXISTS idx_grounded_threads_user ON grounded_threads(user_id);
CREATE INDEX IF NOT EXISTS idx_grounded_turns_thread ON grounded_turns(thread_id);
CREATE INDEX IF NOT EXISTS idx_grounded_watchlist_user ON grounded_watchlist(user_id);

-- ════════════════════════════════════════════════════════════
-- KEY TRIGGERS
-- ════════════════════════════════════════════════════════════

-- Auto-update absence status from dates (respects manual 'cancelled'/'returned_to_duty')
CREATE OR REPLACE FUNCTION update_absence_status() RETURNS trigger AS $$
begin
  if new.current_status = 'cancelled' then return new; end if;
  if new.current_status = 'returned_to_duty' and old.current_status != 'returned_to_duty' then return new; end if;
  new.current_status = case
    when new.start_date > current_date then 'planned_leave'
    when new.end_date <= current_date then 'returned_to_duty'
    else 'currently_absent'
  end;
  new.total_days = (new.end_date - new.start_date) + 1;
  return new;
end;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_absence_status
  BEFORE UPDATE ON staff_absence_records
  FOR EACH ROW EXECUTE FUNCTION update_absence_status();

-- Rotation overlap check (only blocks active/scheduled/extended)
CREATE OR REPLACE FUNCTION check_no_overlapping_rotations() RETURNS trigger AS $$
begin
  if exists (
    select 1 from resident_rotations
    where resident_id = new.resident_id
    and id != new.id
    and rotation_status in ('active','scheduled','extended')
    and new.rotation_status in ('active','scheduled','extended')
    and daterange(new.start_date, new.end_date, '[]') && daterange(start_date, end_date, '[]')
  ) then
    raise exception 'Overlapping rotation exists for this resident in the given date range';
  end if;
  return new;
end;
$$ LANGUAGE plpgsql;

-- Audit trigger on oncall_schedule
CREATE TRIGGER audit_oncall_schedule
  AFTER INSERT OR UPDATE OR DELETE ON oncall_schedule
  FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger();
