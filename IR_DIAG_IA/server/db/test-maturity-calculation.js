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

console.log(`\n📊 Mission trouvée:`)
console.log(`   ID: ${mission.id}`)
console.log(`   Nom: ${mission.organization_name}`)
console.log(`   Maturity dans DB: ${mission.maturity_percent} (type: ${typeof mission.maturity_percent})`)

// Count completed sessions
const completedCountResult = db.prepare(`
  SELECT COUNT(*) as count 
  FROM sessions 
  WHERE mission_id = ? AND completed_at IS NOT NULL
`).get(mission.id)

const completedSessionsCount = completedCountResult && completedCountResult.count !== null && completedCountResult.count !== undefined
  ? parseInt(completedCountResult.count, 10)
  : 0

console.log(`\n📈 Sessions complétées: ${completedSessionsCount}`)

if (completedSessionsCount > 0) {
  // Get all responses for completed sessions
  const responses = db.prepare(`
    SELECT r.answer_value
    FROM responses r
    JOIN sessions s ON r.session_id = s.id
    WHERE s.mission_id = ? AND s.completed_at IS NOT NULL AND r.answer_value != 4
  `).all(mission.id)
  
  console.log(`\n📝 Réponses trouvées (hors "Ne sais pas"): ${responses.length}`)
  
  if (responses.length > 0) {
    // Show distribution of answers
    const distribution = {}
    responses.forEach(r => {
      const val = r.answer_value || 0
      distribution[val] = (distribution[val] || 0) + 1
    })
    console.log(`   Distribution:`, distribution)
    
    // Calculate average score (0-3 scale, excluding "Ne sais pas" = 4)
    const totalScore = responses.reduce((sum, r) => sum + (r.answer_value || 0), 0)
    const avgScore = totalScore / responses.length
    // Convert to percentage (0-3 scale to 0-100%)
    const maturityPercent = Math.round((avgScore / 3) * 100)
    
    console.log(`\n✅ Calcul de la maturité:`)
    console.log(`   Score total: ${totalScore}`)
    console.log(`   Score moyen: ${avgScore.toFixed(2)}`)
    console.log(`   Maturité: ${maturityPercent}%`)
  } else {
    console.log(`\n⚠️  Aucune réponse valide trouvée (toutes sont peut-être "Ne sais pas" = 4)`)
    
    // Check if there are responses with value 4
    const nspResponses = db.prepare(`
      SELECT COUNT(*) as count
      FROM responses r
      JOIN sessions s ON r.session_id = s.id
      WHERE s.mission_id = ? AND s.completed_at IS NOT NULL AND r.answer_value = 4
    `).get(mission.id)
    
    console.log(`   Réponses "Ne sais pas" (4): ${nspResponses?.count || 0}`)
  }
} else {
  console.log(`\n⚠️  Aucune session complétée, impossible de calculer la maturité`)
}

closeDb()

