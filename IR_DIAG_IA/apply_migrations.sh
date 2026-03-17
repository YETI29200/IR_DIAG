#!/bin/bash
# Script de mise à jour globale de la structure de base de données - IR_DIAG_IA

DB_PATH="c:/Users/ydeniaux/OneDrive - images-et-reseaux.com/PRIVE/IR_DIAG_IA8v_serveur/IR_DIAG_IA/data/diagnostic.db"

echo "===================================================="
echo "⚙️  MIGRATION DE LA BASE DE DONNÉES"
echo "===================================================="

node -e "
const Database = require('better-sqlite3');
const db = new Database('$DB_PATH');

const migs = [
    ['missions', 'organization_address_line', 'TEXT'],
    ['missions', 'organization_postal_code', 'TEXT'],
    ['missions', 'organization_city', 'TEXT'],
    ['missions', 'organization_region', 'TEXT'],
    ['missions', 'organization_phone', 'TEXT'],
    ['missions', 'organization_email', 'TEXT'],
    ['missions', 'organization_website', 'TEXT'],
    ['missions', 'primary_contact_id', 'INTEGER'],
    ['missions', 'summary', 'TEXT'],
    ['missions', 'maturity_percent', 'INTEGER'],
    ['missions', 'respondents_percent', 'INTEGER'],
    ['missions', 'satisfaction_stars', 'INTEGER'],
    ['mission_contacts', 'is_referent', 'BOOLEAN DEFAULT 0'],
    ['sessions', 'contact_id', 'INTEGER'],
    ['sessions', 'is_anonymous', 'BOOLEAN DEFAULT 0']
];

migs.forEach(([table, column, type]) => {
    try {
        const info = db.prepare(\`PRAGMA table_info(\${table})\`).all();
        if (!info.find(i => i.name === column)) {
            db.prepare(\`ALTER TABLE \${table} ADD COLUMN \${column} \${type}\`).run();
            console.log(\`✅ [\${table}] Colonne '\${column}' ajoutée.\`);
        }
    } catch (e) {
        console.error(\`❌ Erreur [\${table}.\${column}] : \`, e.message);
    }
});

try {
    db.prepare(\`
      CREATE TABLE IF NOT EXISTS timeline_steps (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        mission_id INTEGER NOT NULL,
        step_number INTEGER NOT NULL,
        step_type TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        planned_date TEXT,
        completed_date TEXT,
        notes TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        UNIQUE(mission_id, step_number, step_type),
        FOREIGN KEY (mission_id) REFERENCES missions(id) ON DELETE CASCADE
      )
    \`).run();
    console.log('✅ Table timeline_steps vérifiée.');
} catch (e) {}

db.close();
"

echo "===================================================="
echo "✨ Structure de la base de données à jour !"
echo "===================================================="
