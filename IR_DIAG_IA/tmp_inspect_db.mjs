import { createRequire } from 'module'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const require = createRequire(import.meta.url)
const Database = require('better-sqlite3')

const dbPath = 'data/diagnostic.db'
const db = new Database(dbPath, { readonly: true })

const missions = db.prepare('SELECT id, organization_name, status FROM missions').all()
console.log('Missions actuelles:')
missions.forEach(m => console.log(` ID ${m.id}: "${m.organization_name}" statut="${m.status}"`))

const cols = db.prepare("PRAGMA table_info(missions)").all()
console.log('\nColonnes table missions:')
cols.forEach(c => console.log(` ${c.name} (${c.type}) default=${c.dflt_value}`))

const checkSql = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='missions'").get()
console.log('\nCHECK constraint:')
console.log(checkSql?.sql?.match(/status.*CHECK[^)]+\)/)?.[0] || 'non trouvé')

db.close()
