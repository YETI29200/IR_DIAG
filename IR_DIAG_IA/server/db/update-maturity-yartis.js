import { getDb, closeDb } from '../db/index.js'

const db = getDb()

// Find YARTIS mission
const mission = db.prepare(`
  SELECT id, organization_name, maturity_percent 
  FROM missions 
  WHERE organization_name LIKE '%YARTIS%' 
  LIMIT 1
`).get()

if (!mission) {
  console.log('❌ Mission YARTIS not found')
  closeDb()
  process.exit(1)
}

console.log(`\n📊 Mission trouvée: ${mission.organization_name} (ID: ${mission.id})`)

// Calculate maturity
const responses = db.prepare(`
  SELECT r.answer_value
  FROM responses r
  JOIN sessions s ON r.session_id = s.id
  WHERE s.mission_id = ? AND s.completed_at IS NOT NULL AND r.answer_value != 4
`).all(mission.id)

if (responses.length > 0) {
  const totalScore = responses.reduce((sum, r) => sum + (r.answer_value || 0), 0)
  const avgScore = totalScore / responses.length
  const maturityPercent = Math.round((avgScore / 3) * 100)
  
  console.log(`\n✅ Calcul de la maturité: ${maturityPercent}% (${responses.length} réponses)`)
  
  // Update database
  db.prepare(`
    UPDATE missions 
    SET maturity_percent = ? 
    WHERE id = ?
  `).run(maturityPercent, mission.id)
  
  console.log(`\n✅ Maturité mise à jour dans la base de données: ${maturityPercent}%`)
  
  // Verify
  const updated = db.prepare('SELECT maturity_percent FROM missions WHERE id = ?').get(mission.id)
  console.log(`✅ Vérification: maturity_percent = ${updated.maturity_percent}`)
} else {
  console.log('❌ Aucune réponse trouvée')
}

closeDb()

