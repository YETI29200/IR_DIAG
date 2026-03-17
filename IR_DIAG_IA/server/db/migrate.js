// Migration script to initialize SQLite database
import Database from 'better-sqlite3'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const dbPath = join(__dirname, '../../data/diagnostic.db')
const schemaPath = join(__dirname, 'schema.sql')

console.log('Initializing database at:', dbPath)

// Ensure data directory exists
import { mkdirSync } from 'fs'
try {
  mkdirSync(join(__dirname, '../../data'), { recursive: true })
} catch (err) {
  // Directory might already exist
}

const db = new Database(dbPath)

// Read and execute schema
const schema = readFileSync(schemaPath, 'utf-8')
db.exec(schema)

console.log('Database schema initialized successfully')

// Check if migration was successful
const tables = db.prepare(`
  SELECT name FROM sqlite_master 
  WHERE type='table' AND name NOT LIKE 'sqlite_%'
`).all()

console.log('Created tables:', tables.map(t => t.name).join(', '))

db.close()

