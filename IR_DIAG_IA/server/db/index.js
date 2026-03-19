// Database connections
// - DMA.db      : missions, consultants, services, contacts, sessions, responses, recommandations
// - flash_diag.db : flash_diagnostics (formulaire auto-administré public)

import Database from 'better-sqlite3'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { readFileSync, existsSync } from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const DMA_DB_PATH = join(__dirname, '../../data/DMA.db')
const FLASH_DB_PATH = join(__dirname, '../../data/flash_diag.db')

let dmaDbInstance = null
let flashDbInstance = null

function initDb(dbPath, schemaFile) {
  const db = new Database(dbPath)
  db.pragma('foreign_keys = ON')
  db.pragma('journal_mode = WAL')
  const schemaPath = join(__dirname, schemaFile)
  if (existsSync(schemaPath)) {
    const schema = readFileSync(schemaPath, 'utf-8')
    db.exec(schema)
  }
  return db
}

export function getDmaDb() {
  if (!dmaDbInstance) {
    dmaDbInstance = initDb(DMA_DB_PATH, 'schema_dma.sql')
    // Migration: ajouter colonne suspended si absente
    const columns = dmaDbInstance.prepare('PRAGMA table_info(consultants)').all().map(c => c.name)
    if (!columns.includes('suspended')) {
      dmaDbInstance.exec('ALTER TABLE consultants ADD COLUMN suspended INTEGER NOT NULL DEFAULT 0')
    }
    // Migration: ajouter colonne is_referent à mission_contacts si absente
    const contactColumns = dmaDbInstance.prepare('PRAGMA table_info(mission_contacts)').all().map(c => c.name)
    if (!contactColumns.includes('is_referent')) {
      dmaDbInstance.exec('ALTER TABLE mission_contacts ADD COLUMN is_referent BOOLEAN NOT NULL DEFAULT 0')
    }
  }
  return dmaDbInstance
}

export function getFlashDb() {
  if (!flashDbInstance) {
    flashDbInstance = initDb(FLASH_DB_PATH, 'schema_flash.sql')
  }
  return flashDbInstance
}

// Alias pour la compatibilité avec le code existant (pointe vers DMA.db)
export function getDb() {
  return getDmaDb()
}

export function closeDb() {
  if (dmaDbInstance) {
    dmaDbInstance.pragma('wal_checkpoint(FULL)')
    dmaDbInstance.close()
    dmaDbInstance = null
  }
  if (flashDbInstance) {
    flashDbInstance.pragma('wal_checkpoint(FULL)')
    flashDbInstance.close()
    flashDbInstance = null
  }
}

export { DMA_DB_PATH, FLASH_DB_PATH }
