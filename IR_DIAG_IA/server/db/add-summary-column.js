// Migration script to add summary column to missions table
import { getDb, closeDb } from './index.js'

const db = getDb()

try {
  // Check if column already exists
  const tableInfo = db.prepare("PRAGMA table_info(missions)").all()
  const hasSummary = tableInfo.some(col => col.name === 'summary')
  
  if (hasSummary) {
    console.log('✅ Column "summary" already exists in missions table')
  } else {
    // Add summary column
    db.prepare(`
      ALTER TABLE missions
      ADD COLUMN summary TEXT
    `).run()
    
    console.log('✅ Column "summary" added to missions table')
  }
  
  // Check for other missing columns
  const hasMaturityPercent = tableInfo.some(col => col.name === 'maturity_percent')
  const hasRespondentsPercent = tableInfo.some(col => col.name === 'respondents_percent')
  const hasSatisfactionStars = tableInfo.some(col => col.name === 'satisfaction_stars')
  
  if (!hasMaturityPercent) {
    db.prepare(`
      ALTER TABLE missions
      ADD COLUMN maturity_percent INTEGER
    `).run()
    console.log('✅ Column "maturity_percent" added to missions table')
  }
  
  if (!hasRespondentsPercent) {
    db.prepare(`
      ALTER TABLE missions
      ADD COLUMN respondents_percent INTEGER
    `).run()
    console.log('✅ Column "respondents_percent" added to missions table')
  }
  
  if (!hasSatisfactionStars) {
    db.prepare(`
      ALTER TABLE missions
      ADD COLUMN satisfaction_stars INTEGER CHECK(satisfaction_stars >= 1 AND satisfaction_stars <= 5)
    `).run()
    console.log('✅ Column "satisfaction_stars" added to missions table')
  }
  
  console.log('✅ Migration completed successfully!')
} catch (error) {
  console.error('❌ Migration error:', error.message)
  process.exit(1)
} finally {
  closeDb()
}

