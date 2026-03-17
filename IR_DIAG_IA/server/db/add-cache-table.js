// Script to add results_cache table to existing database
import Database from 'better-sqlite3'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const dbPath = join(__dirname, '../../data/diagnostic.db')
const migrationPath = join(__dirname, 'migrations/add_results_cache.sql')

console.log('Adding results_cache table to database...')
console.log('Database path:', dbPath)
console.log('Migration path:', migrationPath)

try {
  const db = new Database(dbPath)
  
  // Check if table already exists
  const tableExists = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name='results_cache'
  `).get()
  
  if (tableExists) {
    console.log('✅ Table results_cache already exists, skipping migration')
    db.close()
    process.exit(0)
  }
  
  // Read and execute migration
  const migration = readFileSync(migrationPath, 'utf-8')
  db.exec(migration)
  
  console.log('✅ Migration executed successfully')
  
  // Verify table was created
  const tables = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name='results_cache'
  `).all()
  
  if (tables.length > 0) {
    console.log('✅ Table results_cache verified')
  } else {
    console.error('❌ Table results_cache was not created')
    process.exit(1)
  }
  
  db.close()
  console.log('✅ Migration complete')
} catch (error) {
  console.error('❌ Error executing migration:', error)
  process.exit(1)
}

