// Database connection and utilities
import Database from 'better-sqlite3'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const dbPath = join(__dirname, '../../data/diagnostic.db')

let dbInstance = null

export function getDb() {
  if (!dbInstance) {
    dbInstance = new Database(dbPath)
    // Enable foreign keys
    dbInstance.pragma('foreign_keys = ON')
    // Enable WAL mode for better concurrency
    dbInstance.pragma('journal_mode = WAL')
    // Auto-migrations for missing columns
    const columns = dbInstance.prepare("PRAGMA table_info(consultants)").all().map(c => c.name)
    if (!columns.includes('suspended')) {
      dbInstance.exec("ALTER TABLE consultants ADD COLUMN suspended INTEGER NOT NULL DEFAULT 0")
    }
  }
  return dbInstance
}

export function closeDb() {
  if (dbInstance) {
    dbInstance.close()
    dbInstance = null
  }
}

