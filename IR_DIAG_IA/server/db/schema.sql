-- AI & Data Maturity Diagnostic Platform - SQLite Schema
-- Enforces foreign keys and cascades

PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;

-- Consultants table
CREATE TABLE IF NOT EXISTS consultants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    job_title TEXT,
    phone TEXT,
    signature_html TEXT,
    suspended INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- User roles (admin, consultant)
CREATE TABLE IF NOT EXISTS user_roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    consultant_id INTEGER NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('admin', 'consultant')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (consultant_id) REFERENCES consultants(id) ON DELETE CASCADE,
    UNIQUE(consultant_id, role)
);

-- Missions table
CREATE TABLE IF NOT EXISTS missions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    consultant_id INTEGER NOT NULL,
    organization_name TEXT NOT NULL,
    sector TEXT,
    employees INTEGER,
    questionnaire_type TEXT NOT NULL CHECK(questionnaire_type IN ('flash', 'full')),
    status TEXT NOT NULL DEFAULT 'preparation' CHECK(status IN ('preparation', 'in_progress', 'suspended', 'closed')),
    closure_date TEXT,
    summary TEXT,
    maturity_percent INTEGER,
    respondents_percent INTEGER,
    satisfaction_stars INTEGER CHECK(satisfaction_stars >= 1 AND satisfaction_stars <= 5),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    preparation_date TEXT,
    in_progress_date TEXT,
    suspended_date TEXT,
    organization_address_line TEXT,
    organization_postal_code TEXT,
    organization_city TEXT,
    organization_region TEXT,
    organization_phone TEXT,
    organization_email TEXT,
    organization_website TEXT,
    primary_contact_id INTEGER,
    FOREIGN KEY (consultant_id) REFERENCES consultants(id) ON DELETE CASCADE
);

-- Mission services (departments/units within organization)
CREATE TABLE IF NOT EXISTS mission_services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mission_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    unique_link TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (mission_id) REFERENCES missions(id) ON DELETE CASCADE,
    UNIQUE(mission_id, code)
);

-- Mission contacts
CREATE TABLE IF NOT EXISTS mission_contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mission_id INTEGER NOT NULL,
    service_id INTEGER,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    role TEXT,
    email TEXT NOT NULL,
    phone TEXT,
    is_primary BOOLEAN NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (mission_id) REFERENCES missions(id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES mission_services(id) ON DELETE SET NULL
);

-- Anonymous sessions (questionnaire responses)
CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mission_id INTEGER NOT NULL,
    service_id INTEGER,
    anonymous_token TEXT NOT NULL UNIQUE,
    started_at TEXT NOT NULL DEFAULT (datetime('now')),
    completed_at TEXT,
    FOREIGN KEY (mission_id) REFERENCES missions(id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES mission_services(id) ON DELETE SET NULL
);

-- Questionnaire responses
CREATE TABLE IF NOT EXISTS responses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL,
    question_id TEXT NOT NULL,
    dimension TEXT NOT NULL,
    answer_value INTEGER NOT NULL CHECK(answer_value >= 0 AND answer_value <= 4),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
    UNIQUE(session_id, question_id)
);

-- Recommendations
CREATE TABLE IF NOT EXISTS recommendations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mission_id INTEGER NOT NULL,
    service_id INTEGER,
    session_id INTEGER,
    payload_json TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'approved', 'rejected')),
    approved_by INTEGER,
    approved_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (mission_id) REFERENCES missions(id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES mission_services(id) ON DELETE SET NULL,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE SET NULL,
    FOREIGN KEY (approved_by) REFERENCES consultants(id) ON DELETE SET NULL
);

-- Recommendations history (audit trail)
CREATE TABLE IF NOT EXISTS recommendations_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    recommendation_id INTEGER NOT NULL,
    payload_json TEXT NOT NULL,
    version_number INTEGER NOT NULL,
    modified_by INTEGER,
    modified_at TEXT NOT NULL DEFAULT (datetime('now')),
    change_description TEXT,
    FOREIGN KEY (recommendation_id) REFERENCES recommendations(id) ON DELETE CASCADE,
    FOREIGN KEY (modified_by) REFERENCES consultants(id) ON DELETE SET NULL
);

-- Email logs (simulated sends)
CREATE TABLE IF NOT EXISTS email_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mission_id INTEGER,
    contact_id INTEGER,
    template_name TEXT,
    subject TEXT NOT NULL,
    body_html TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'simulated_sent' CHECK(status IN ('simulated_sent', 'copied')),
    sent_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (mission_id) REFERENCES missions(id) ON DELETE CASCADE,
    FOREIGN KEY (contact_id) REFERENCES mission_contacts(id) ON DELETE SET NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_consultants_email ON consultants(email);
CREATE INDEX IF NOT EXISTS idx_user_roles_consultant ON user_roles(consultant_id);
CREATE INDEX IF NOT EXISTS idx_missions_consultant ON missions(consultant_id);
CREATE INDEX IF NOT EXISTS idx_missions_status ON missions(status);
CREATE INDEX IF NOT EXISTS idx_mission_services_mission ON mission_services(mission_id);
CREATE INDEX IF NOT EXISTS idx_mission_services_link ON mission_services(unique_link);
CREATE INDEX IF NOT EXISTS idx_mission_contacts_mission ON mission_contacts(mission_id);
CREATE INDEX IF NOT EXISTS idx_mission_contacts_service ON mission_contacts(service_id);
CREATE INDEX IF NOT EXISTS idx_sessions_mission ON sessions(mission_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(anonymous_token);
CREATE INDEX IF NOT EXISTS idx_responses_session ON responses(session_id);
CREATE INDEX IF NOT EXISTS idx_responses_dimension ON responses(dimension);
CREATE INDEX IF NOT EXISTS idx_recommendations_mission ON recommendations(mission_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_session ON recommendations(session_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_mission ON email_logs(mission_id);


-- Flash diagnostics table
CREATE TABLE IF NOT EXISTS flash_diagnostics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    organization_name TEXT NOT NULL,
    contact_name TEXT NOT NULL,
    contact_email TEXT NOT NULL,
    contact_phone TEXT,
    contact_role TEXT,
    employees TEXT,
    sector TEXT,
    postal_code TEXT,
    department TEXT,
    region TEXT,
    global_score INTEGER,
    maturity_level TEXT,
    answers_json TEXT,
    dimension_scores_json TEXT,
    recommendations_json TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_flash_diagnostics_email ON flash_diagnostics(contact_email);
CREATE INDEX IF NOT EXISTS idx_flash_diagnostics_region ON flash_diagnostics(region);
