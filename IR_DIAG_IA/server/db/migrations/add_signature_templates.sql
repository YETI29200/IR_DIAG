-- Migration: Add signature templates table
-- This table stores customizable signature templates for Images & Réseaux

CREATE TABLE IF NOT EXISTS signature_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    html_content TEXT NOT NULL,
    is_default BOOLEAN NOT NULL DEFAULT 0,
    created_by INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (created_by) REFERENCES consultants(id) ON DELETE SET NULL
);

-- Insert default signature template
INSERT INTO signature_templates (name, html_content, is_default, created_at) VALUES (
    'Signature Images & Réseaux - Par défaut',
    '<p>Cordialement,<br><strong>L''équipe Images & Réseaux</strong><br>EDIH Bretagne et Pays de la Loire<br>European Digital Innovation Hub</p>',
    1,
    datetime('now')
);

CREATE INDEX IF NOT EXISTS idx_signature_templates_default ON signature_templates(is_default);

