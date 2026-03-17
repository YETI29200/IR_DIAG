// Migration script to add organization contact columns to missions table
import { getDb, closeDb } from './index.js'

const db = getDb()

try {
  const tableInfo = db.prepare("PRAGMA table_info(missions)").all()
  const columnNames = tableInfo.map(col => col.name)
  
  const columnsToAdd = [
    { name: 'organization_address', type: 'TEXT' },
    { name: 'organization_phone', type: 'TEXT' },
    { name: 'organization_email', type: 'TEXT' },
    { name: 'organization_website', type: 'TEXT' },
    { name: 'primary_contact_id', type: 'INTEGER' }
  ]
  
  columnsToAdd.forEach(col => {
    if (!columnNames.includes(col.name)) {
      db.prepare(`
        ALTER TABLE missions
        ADD COLUMN ${col.name} ${col.type}
      `).run()
      console.log(`✅ Column "${col.name}" added to missions table`)
    } else {
      console.log(`ℹ️  Column "${col.name}" already exists`)
    }
  })
  
  // Add foreign key for primary_contact_id if it doesn't exist
  if (columnNames.includes('primary_contact_id')) {
    console.log('✅ Migration completed successfully!')
  }
} catch (error) {
  console.error('❌ Migration error:', error.message)
  process.exit(1)
} finally {
  closeDb()
}
