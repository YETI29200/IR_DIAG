// Migration script to add address detail columns to missions table
import { getDb, closeDb } from './index.js'

const db = getDb()

try {
  const tableInfo = db.prepare("PRAGMA table_info(missions)").all()
  const columnNames = tableInfo.map(col => col.name)
  
  const columnsToAdd = [
    { name: 'organization_address_line', type: 'TEXT' },
    { name: 'organization_postal_code', type: 'TEXT' },
    { name: 'organization_city', type: 'TEXT' },
    { name: 'organization_region', type: 'TEXT' }
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
  
  console.log('✅ Migration completed successfully!')
} catch (error) {
  console.error('❌ Migration error:', error.message)
  process.exit(1)
} finally {
  closeDb()
}
