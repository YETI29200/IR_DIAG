#!/usr/bin/env node
/**
 * Script de migration : diagnostic.db (+ WAL) → DMA.db + flash_diag.db
 *
 * À exécuter UNE SEULE FOIS sur le serveur, dans le répertoire IR_DIAG_IA/
 *
 *   node server/db/migrate_to_split_db.js
 *
 * Ce script :
 * 1. Lit diagnostic.db (inclut automatiquement diagnostic.db-wal si présent)
 * 2. Force un checkpoint WAL pour consolider toutes les données
 * 3. Copie flash_diagnostics → data/flash_diag.db
 * 4. Copie toutes les tables DMA → data/DMA.db
 */

import Database from 'better-sqlite3'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { existsSync, copyFileSync } from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const DATA_DIR = join(__dirname, '../../data')
const SOURCE_DB = join(DATA_DIR, 'diagnostic.db')
const DMA_DB    = join(DATA_DIR, 'DMA.db')
const FLASH_DB  = join(DATA_DIR, 'flash_diag.db')

// ─── Vérifications préalables ────────────────────────────────────────────────

if (!existsSync(SOURCE_DB)) {
  console.error(`❌ Fichier source introuvable : ${SOURCE_DB}`)
  process.exit(1)
}

// Si les DBs existent déjà (serveur démarré une fois avec le nouveau code),
// vérifier qu'elles sont bien vides avant de continuer
if (existsSync(DMA_DB)) {
  const check = new Database(DMA_DB, { readonly: true })
  const hasData = check.prepare("SELECT COUNT(*) as n FROM consultants").get()?.n ?? 0
  check.close()
  if (hasData > 0) {
    console.error('❌ DMA.db existe déjà et contient des données !')
    console.error('   Migration déjà effectuée ? Supprimez DMA.db si vous voulez recommencer.')
    process.exit(1)
  }
  // Vide : on supprime pour recréer proprement
  const { unlinkSync } = await import('fs')
  unlinkSync(DMA_DB)
  console.log('   DMA.db vide détecté et supprimé (recréation en cours)')
}
if (existsSync(FLASH_DB)) {
  const check = new Database(FLASH_DB, { readonly: true })
  const hasData = check.prepare("SELECT COUNT(*) as n FROM flash_diagnostics").get()?.n ?? 0
  check.close()
  if (hasData > 0) {
    console.error('❌ flash_diag.db existe déjà et contient des données !')
    console.error('   Migration déjà effectuée ? Supprimez flash_diag.db si vous voulez recommencer.')
    process.exit(1)
  }
  const { unlinkSync } = await import('fs')
  unlinkSync(FLASH_DB)
  console.log('   flash_diag.db vide détecté et supprimé (recréation en cours)')
}

console.log('━'.repeat(60))
console.log('  Migration diagnostic.db → DMA.db + flash_diag.db')
console.log('━'.repeat(60))

// ─── Ouverture source (SQLite lit le WAL automatiquement) ────────────────────

const src = new Database(SOURCE_DB)
src.pragma('foreign_keys = OFF')
src.pragma('journal_mode = WAL')

// Force checkpoint : fusionne diagnostic.db-wal dans diagnostic.db
console.log('\n[1/5] Checkpoint WAL de diagnostic.db...')
try {
  const ckpt = src.pragma('wal_checkpoint(FULL)', { simple: true })
  console.log(`      Résultat checkpoint: ${JSON.stringify(ckpt)}`)
} catch (e) {
  console.warn(`      ⚠️  Checkpoint partiel : ${e.message}`)
}

// ─── Comptage des données source ─────────────────────────────────────────────

console.log('\n[2/5] Inventaire des données source...')

const tables = src.prepare(`
  SELECT name FROM sqlite_master
  WHERE type='table' AND name NOT LIKE 'sqlite_%'
  ORDER BY name
`).all().map(r => r.name)

console.log(`      Tables trouvées : ${tables.join(', ')}`)

const counts = {}
for (const t of tables) {
  try {
    counts[t] = src.prepare(`SELECT COUNT(*) as n FROM "${t}"`).get().n
    console.log(`      ${t.padEnd(30)} : ${counts[t]} lignes`)
  } catch (e) {
    counts[t] = 0
    console.warn(`      ${t} : impossible de compter (${e.message})`)
  }
}

// ─── Création flash_diag.db ──────────────────────────────────────────────────

console.log('\n[3/5] Création de flash_diag.db...')

const flashDb = new Database(FLASH_DB)
flashDb.pragma('foreign_keys = OFF')
flashDb.pragma('journal_mode = WAL')

flashDb.exec(`
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
`)

// Copie des flash_diagnostics
const flashRows = src.prepare('SELECT * FROM flash_diagnostics').all()
console.log(`      ${flashRows.length} flash_diagnostics à migrer`)

if (flashRows.length > 0) {
  const insertFlash = flashDb.prepare(`
    INSERT INTO flash_diagnostics (
      id, organization_name, contact_name, contact_email, contact_phone, contact_role,
      employees, sector, postal_code, department, region,
      global_score, maturity_level, answers_json, dimension_scores_json, recommendations_json,
      created_at
    ) VALUES (
      @id, @organization_name, @contact_name, @contact_email, @contact_phone, @contact_role,
      @employees, @sector, @postal_code, @department, @region,
      @global_score, @maturity_level, @answers_json, @dimension_scores_json, @recommendations_json,
      @created_at
    )
  `)
  const insertMany = flashDb.transaction((rows) => {
    for (const row of rows) insertFlash.run(row)
  })
  insertMany(flashRows)
  const verif = flashDb.prepare('SELECT COUNT(*) as n FROM flash_diagnostics').get().n
  console.log(`      ✅ ${verif} flash_diagnostics insérés dans flash_diag.db`)
}

flashDb.pragma('wal_checkpoint(FULL)')
flashDb.close()

// ─── Création DMA.db ─────────────────────────────────────────────────────────

console.log('\n[4/5] Création de DMA.db...')

// Tables DMA à copier (tout sauf flash_diagnostics)
const DMA_TABLES = [
  'consultants',
  'user_roles',
  'missions',
  'mission_services',
  'mission_contacts',
  'sessions',
  'responses',
  'recommendations',
  'recommendations_history',
  'email_logs',
  'timeline_steps',
  'results_cache',
]

const dmaDb = new Database(DMA_DB)
dmaDb.pragma('foreign_keys = OFF')
dmaDb.pragma('journal_mode = WAL')

// Récupérer les CREATE TABLE/INDEX depuis la source
for (const table of DMA_TABLES) {
  if (!tables.includes(table)) {
    console.log(`      Pas de table "${table}" dans la source — ignorée`)
    continue
  }

  // Créer la table dans DMA.db à partir du schéma source
  const schemaSql = src.prepare(`
    SELECT sql FROM sqlite_master WHERE type='table' AND name=?
  `).get(table)?.sql

  const indexSql = src.prepare(`
    SELECT sql FROM sqlite_master WHERE type='index' AND tbl_name=? AND sql IS NOT NULL
  `).all(table).map(r => r.sql)

  if (schemaSql) {
    dmaDb.exec(schemaSql + ';')
    for (const idx of indexSql) {
      try { dmaDb.exec(idx + ';') } catch {}
    }
  }

  // Copier les données
  const rows = src.prepare(`SELECT * FROM "${table}"`).all()
  if (rows.length === 0) {
    console.log(`      ${table.padEnd(30)} : 0 lignes (table vide)`)
    continue
  }

  const cols = Object.keys(rows[0])
  const placeholders = cols.map(c => `@${c}`).join(', ')
  const insert = dmaDb.prepare(
    `INSERT OR IGNORE INTO "${table}" (${cols.map(c => `"${c}"`).join(', ')}) VALUES (${placeholders})`
  )
  const insertAll = dmaDb.transaction((r) => { for (const row of r) insert.run(row) })
  insertAll(rows)

  const verif = dmaDb.prepare(`SELECT COUNT(*) as n FROM "${table}"`).get().n
  console.log(`      ${table.padEnd(30)} : ${verif} lignes ✅`)
}

dmaDb.pragma('foreign_keys = ON')
dmaDb.pragma('wal_checkpoint(FULL)')
dmaDb.close()

// ─── Résumé ──────────────────────────────────────────────────────────────────

src.close()

console.log('\n[5/5] Vérification finale...')

const fDb = new Database(FLASH_DB, { readonly: true })
const dDb = new Database(DMA_DB, { readonly: true })

const flashCount = fDb.prepare('SELECT COUNT(*) as n FROM flash_diagnostics').get().n
const missionCount = dDb.prepare('SELECT COUNT(*) as n FROM missions').get().n
const consultantCount = dDb.prepare('SELECT COUNT(*) as n FROM consultants').get().n

fDb.close()
dDb.close()

console.log('\n' + '━'.repeat(60))
console.log('  Résultat de la migration')
console.log('━'.repeat(60))
console.log(`  flash_diag.db → flash_diagnostics : ${flashCount} enregistrements`)
console.log(`  DMA.db        → consultants        : ${consultantCount}`)
console.log(`                → missions           : ${missionCount}`)
console.log('━'.repeat(60))
console.log('\n✅ Migration terminée avec succès !')
console.log(`   Ancien fichier conservé : ${SOURCE_DB}`)
console.log('   Vous pouvez le supprimer après vérification.\n')
