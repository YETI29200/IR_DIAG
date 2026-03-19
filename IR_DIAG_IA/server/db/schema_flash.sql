-- Flash Diagnostics - Schema SQLite
-- Table pour les diagnostics flash publics (formulaire auto-administré)

PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;

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
CREATE INDEX IF NOT EXISTS idx_flash_diagnostics_created ON flash_diagnostics(created_at);
