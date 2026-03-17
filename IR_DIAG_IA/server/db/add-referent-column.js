// Migration script to add is_referent column to mission_contacts table
import { getDb, closeDb } from './index.js'

const db = getDb()

try {
  const tableInfo = db.prepare("PRAGMA table_info(mission_contacts)").all()
  const columnNames = tableInfo.map(col => col.name)
  
  if (!columnNames.includes('is_referent')) {
    db.prepare(`
      ALTER TABLE mission_contacts
      ADD COLUMN is_referent BOOLEAN NOT NULL DEFAULT 0
    `).run()
    console.log('✅ Column "is_referent" added to mission_contacts table')
  } else {
    console.log('ℹ️  Column "is_referent" already exists')
  }
  
  console.log('✅ Migration completed successfully!')
} catch (error) {
  console.error('❌ Migration error:', error.message)
  process.exit(1)
} finally {
  closeDb()
}
