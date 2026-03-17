// Migration script to add timeline_steps table for manual step validation
import { getDb, closeDb } from './index.js'

const db = getDb()

try {
  // Check if table exists
  const tableInfo = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='timeline_steps'").get()
  
  if (!tableInfo) {
    // Create timeline_steps table
    db.prepare(`
      CREATE TABLE IF NOT EXISTS timeline_steps (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        mission_id INTEGER NOT NULL,
        step_number INTEGER NOT NULL,
        step_type TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        planned_date TEXT,
        completed_date TEXT,
        notes TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        UNIQUE(mission_id, step_number, step_type),
        FOREIGN KEY (mission_id) REFERENCES missions(id) ON DELETE CASCADE
      )
    `).run()
    
    console.log('✅ Table "timeline_steps" created successfully')
  } else {
    console.log('ℹ️  Table "timeline_steps" already exists')
  }
  
  // Create index for faster queries
  try {
    db.prepare('CREATE INDEX IF NOT EXISTS idx_timeline_steps_mission ON timeline_steps(mission_id)').run()
    console.log('✅ Index created on timeline_steps')
  } catch (e) {
    console.log('ℹ️  Index may already exist')
  }
  
  console.log('✅ Migration completed successfully!')
} catch (error) {
  console.error('❌ Migration error:', error.message)
  process.exit(1)
} finally {
  closeDb()
}
