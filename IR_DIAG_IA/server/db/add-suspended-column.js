// Migration: Add suspended column to consultants table
import { getDb } from './index.js'

const db = getDb()

try {
  // Check if column already exists
  const tableInfo = db.prepare(`PRAGMA table_info(consultants)`).all()
  const hasSuspended = tableInfo.some(col => col.name === 'suspended')
  
  if (!hasSuspended) {
    db.prepare(`
      ALTER TABLE consultants
      ADD COLUMN suspended BOOLEAN NOT NULL DEFAULT 0
    `).run()
    console.log('✅ Added suspended column to consultants table')
  } else {
    console.log('ℹ️  suspended column already exists')
  }
} catch (error) {
  console.error('❌ Error adding suspended column:', error)
  process.exit(1)
}

