/**
 * Migration: Nouveaux statuts de mission
 * 
 * Anciens statuts     → Nouveaux statuts
 * 'draft'             → 'preparation'  (Phase de préparation avant envoi des questionnaires)
 * 'active'            → 'in_progress'  (Mission en cours de suivi)
 * (nouveau)           → 'suspended'    (Mission suspendue temporairement)
 * 'closed'            → 'closed'       (Clôturée après livrables et restitution) — inchangé
 * 
 * Correction automatique:
 * - Si une mission 'draft' a des sessions complétées → elle est en réalité 'in_progress'
 */

import { createRequire } from 'module'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { existsSync } from 'fs'

const require = createRequire(import.meta.url)
const Database = require('better-sqlite3')

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const dbPath = join(__dirname, '../../data/diagnostic.db')
if (!existsSync(dbPath)) {
  console.error('❌ Base de données non trouvée:', dbPath)
  process.exit(1)
}

const db = new Database(dbPath)
db.pragma('journal_mode = WAL')
// PREVENT SQLite from updating foreign keys in other tables during rename
db.pragma('legacy_alter_table = ON')
// Disable foreign keys check to allow dropping/recreating tables
db.pragma('foreign_keys = OFF')

console.log('🔄 Démarrage de la migration des statuts de mission...')

// ─── 3. Migration Transaction ──────────────────────────────────────────────
const migrate = db.transaction(() => {
  // Étape A: Renommer l'ancienne table
  db.prepare('ALTER TABLE missions RENAME TO missions_old').run()
  console.log('✅ Table missions renommée en missions_old')

  // Étape B: Créer la nouvelle table avec les nouveaux statuts
  db.prepare(`
    CREATE TABLE missions (
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
      -- Phase dates for working days calculation
      preparation_date TEXT,
      in_progress_date TEXT,
      suspended_date TEXT,
      -- Extended fields (added by previous migrations)
      organization_address_line TEXT,
      organization_postal_code TEXT,
      organization_city TEXT,
      organization_region TEXT,
      organization_phone TEXT,
      organization_email TEXT,
      organization_website TEXT,
      primary_contact_id INTEGER,
      FOREIGN KEY (consultant_id) REFERENCES consultants(id) ON DELETE CASCADE
    )
  `).run()
  console.log('✅ Nouvelle table missions créée')

  // Étape C: Migrer les données
  const oldMissions = db.prepare('SELECT * FROM missions_old').all()
  
  for (const m of oldMissions) {
    let newStatus
    if (m.status === 'closed') {
      newStatus = 'closed'
    } else if (m.status === 'active') {
      newStatus = 'in_progress'
    } else {
      const completedSessions = db.prepare(
        'SELECT COUNT(*) as count FROM sessions WHERE mission_id = ? AND completed_at IS NOT NULL'
      ).get(m.id)
      const hasCompleted = completedSessions && completedSessions.count > 0
      newStatus = hasCompleted ? 'in_progress' : 'preparation'
    }

    const cols = Object.keys(m)
    
    db.prepare(`
      INSERT INTO missions (
        id, consultant_id, organization_name, sector, employees, questionnaire_type,
        status, closure_date, summary, maturity_percent, respondents_percent, satisfaction_stars,
        created_at,
        organization_address_line, organization_postal_code, organization_city, organization_region,
        organization_phone, organization_email, organization_website, primary_contact_id,
        preparation_date, in_progress_date
      ) VALUES (
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?
      )
    `).run(
      m.id, m.consultant_id, m.organization_name, m.sector, m.employees, m.questionnaire_type,
      newStatus, m.closure_date, m.summary, m.maturity_percent, m.respondents_percent, m.satisfaction_stars,
      m.created_at,
      cols.includes('organization_address_line') ? m.organization_address_line : null,
      cols.includes('organization_postal_code') ? m.organization_postal_code : null,
      cols.includes('organization_city') ? m.organization_city : null,
      cols.includes('organization_region') ? m.organization_region : null,
      cols.includes('organization_phone') ? m.organization_phone : null,
      cols.includes('organization_email') ? m.organization_email : null,
      cols.includes('organization_website') ? m.organization_website : null,
      cols.includes('primary_contact_id') ? m.primary_contact_id : null,
      m.created_at,
      newStatus === 'in_progress' || newStatus === 'closed' ? m.created_at : null
    )
  }

  // Étape D: Recréer les index
  db.prepare('CREATE INDEX IF NOT EXISTS idx_missions_consultant ON missions(consultant_id)').run()
  db.prepare('CREATE INDEX IF NOT EXISTS idx_missions_status ON missions(status)').run()

  // Étape E: Supprimer l'ancienne table
  db.prepare('DROP TABLE missions_old').run()
  console.log('✅ Migration des données terminée')
})

// Execute the migration
migrate()

// Re-enable foreign keys and verify integrity
db.pragma('foreign_keys = ON')
const integrity = db.pragma('foreign_key_check')
if (integrity.length > 0) {
  console.warn('⚠️  Avertissement: Problèmes d\'intégrité détectés après migration:', integrity)
} else {
  console.log('✅ Intégrité des clés étrangères vérifiée')
}


// ─── 4. Vérification finale ──────────────────────────────────────────────────
const missionsAfter = db.prepare('SELECT id, organization_name, status FROM missions').all()
console.log('\n📋 Missions après migration:')
missionsAfter.forEach(m => console.log(`  ID ${m.id}: "${m.organization_name}" → statut: ${m.status}`))

console.log('\n🎉 Migration terminée avec succès!')
console.log('📝 Nouveaux statuts disponibles:')
console.log('   preparation → En préparation (avant envoi questionnaires)')
console.log('   in_progress → En cours (mission suivie activement)')
console.log('   suspended   → Suspendue (imprévu temporaire)')
console.log('   closed      → Clôturée (livrables et restitution réalisés)')

db.close()
