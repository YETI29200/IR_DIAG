// Script to generate balanced test responses for 20 collaborators
// Target: Average 47%, Median 62%, Variety in services (red, orange, green)
import { getDb, closeDb } from './index.js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { randomBytes } from 'crypto'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const db = getDb()

// Load questionnaire data
function loadQuestionnaire() {
  const questionnairePath = join(__dirname, '../../data/questionnaire_maturite_IA.json')
  const data = JSON.parse(readFileSync(questionnairePath, 'utf-8'))
  return data.questionnaire
}

// Get all questions from questionnaire
function getAllQuestions(questionnaire) {
  const questions = []
  let questionIndex = 1
  questionnaire.dimensions.forEach(dimension => {
    dimension.questions.forEach((questionText) => {
      questions.push({
        questionId: `q${questionIndex}`,
        dimension: dimension.id,
        text: questionText
      })
      questionIndex++
    })
  })
  return questions
}

// Generate anonymous token
function generateAnonymousToken() {
  return randomBytes(16).toString('hex')
}

// Calculate global score from responses (0-3 scale, converted to 0-100%)
function calculateGlobalScore(responses) {
  if (responses.length === 0) return 0
  
  // Filter out "Ne sais pas" (value 4)
  const validResponses = responses.filter(r => r.answer_value !== 4)
  if (validResponses.length === 0) return 0
  
  const total = validResponses.reduce((sum, r) => sum + r.answer_value, 0)
  const maxPossible = validResponses.length * 3
  return Math.round((total / maxPossible) * 100)
}

// Generate balanced answer based on target global score
// Target scores for 20 respondents to achieve average 47% and median 62%:
// We need a distribution where:
// - Average = 47%
// - Median = 62%
// This means we need some low scores (to bring average down) and some high scores (to bring median up)
function generateAnswerForTargetScore(targetGlobalScore, dimension, questionIndex, allQuestions) {
  // 5% chance of "Ne sais pas" (4)
  if (Math.random() < 0.05) {
    return 4 // "Ne sais pas"
  }
  
  // Base answer (0-3 scale)
  // Convert target score (0-100%) to answer scale (0-3)
  // targetGlobalScore of 47% means average answer around 1.41 (47% of 3)
  // But we want variety, so add some randomness per dimension
  
  // Dimension-specific adjustments to create variety
  const dimensionAdjustments = {
    ambition: 0.1,
    pilotage: -0.1,
    organisation: 0.0,
    culture: 0.15,
    donnees: -0.15,
    cas_usage: 0.05,
    ecosysteme: -0.1,
    expertise: 0.1,
    technologie: -0.05,
    mise_en_oeuvre: 0.0
  }
  
  const adjustment = dimensionAdjustments[dimension] || 0
  
  // Convert target score to base answer value
  // targetGlobalScore is 0-100%, we need 0-3 scale
  const baseValue = (targetGlobalScore / 100) * 3 + adjustment
  
  // Add some randomness (±0.3) but keep it in 0-3 range
  // Reduced variability to better match target scores
  let answer = baseValue + (Math.random() - 0.5) * 0.6
  answer = Math.max(0, Math.min(3, answer))
  
  // Round to nearest integer (0, 1, 2, or 3)
  return Math.round(answer)
}

// Get mission ID from command line argument
const missionIdArg = process.argv[2]

if (!missionIdArg) {
  console.log('Usage: node server/db/generate-balanced-test-data.js <mission_id>')
  console.log('Example: node server/db/generate-balanced-test-data.js 5')
  process.exit(1)
}

const missionId = parseInt(missionIdArg)

try {
  // Verify mission exists
  const mission = db.prepare(`
    SELECT id, organization_name, questionnaire_type
    FROM missions
    WHERE id = ?
  `).get(missionId)

  if (!mission) {
    console.log(`❌ Mission ${missionId} introuvable`)
    process.exit(1)
  }

  console.log(`\n🔄 Génération de données de test équilibrées pour la mission ${missionId}: ${mission.organization_name}`)
  console.log(`   Type de questionnaire: ${mission.questionnaire_type}\n`)

  // Load questionnaire
  const questionnaire = loadQuestionnaire()
  const allQuestions = getAllQuestions(questionnaire)
  console.log(`📋 ${allQuestions.length} questions chargées depuis le questionnaire\n`)

  // Get all contacts with their services
  const contacts = db.prepare(`
    SELECT c.id, c.first_name, c.last_name, c.email, c.service_id, s.name as service_name, s.code as service_code
    FROM mission_contacts c
    LEFT JOIN mission_services s ON c.service_id = s.id
    WHERE c.mission_id = ?
    ORDER BY c.id
  `).all(missionId)

  if (contacts.length === 0) {
    console.log(`❌ Aucun contact trouvé pour cette mission`)
    process.exit(1)
  }

  console.log(`👥 ${contacts.length} contact(s) trouvé(s)\n`)

  // Clean existing sessions for this mission first
  console.log(`🧹 Nettoyage des sessions existantes...`)
  const deleteSessionsStmt = db.prepare(`
    DELETE FROM sessions WHERE mission_id = ?
  `)
  const deletedCount = deleteSessionsStmt.run(missionId).changes
  if (deletedCount > 0) {
    console.log(`   ✅ ${deletedCount} session(s) supprimée(s)\n`)
  } else {
    console.log(`   ℹ️  Aucune session existante\n`)
  }

  // Define target global scores for 20 respondents
  // To achieve average 47% and median 62%, with more green scores:
  // - Fewer low scores (15-35%)
  // - More high scores (70-85%) to have more green
  // Distribution: 6 low (15-35%), 2 medium-high (60-65%), 12 high (70-85%)
  // Adjusted targets to account for generation variability
  const targetScores = [
    // Low scores (red) - 6 respondents
    15, 18, 20, 25, 30, 35,
    // Medium-high scores (orange/green) - 2 respondents
    60, 64,
    // High scores (green) - 12 respondents
    70, 72, 75, 73, 78, 76, 74, 77, 80, 72, 75, 78
  ]

  // Shuffle to randomize distribution
  for (let i = targetScores.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [targetScores[i], targetScores[j]] = [targetScores[j], targetScores[i]]
  }

  // Assign target scores to services for variety
  // Get unique services
  const services = [...new Set(contacts.map(c => c.service_id).filter(id => id !== null))]
  const serviceTargetScores = {}
  
  // Assign different average scores to each service for variety
  // Service 1: Low (20-35%) - Red
  // Service 2: Medium (45-55%) - Orange
  // Service 3: Medium-High (55-65%) - Orange/Green
  // Service 4: High (70-80%) - Green
  const serviceProfiles = {
    low: { min: 20, max: 35 },
    medium: { min: 45, max: 55 },
    mediumHigh: { min: 55, max: 65 },
    high: { min: 70, max: 80 }
  }
  
  services.forEach((serviceId, index) => {
    const profileKeys = Object.keys(serviceProfiles)
    const profile = serviceProfiles[profileKeys[index % profileKeys.length]]
    serviceTargetScores[serviceId] = profile
  })

  // Prepare statements
  const insertSessionStmt = db.prepare(`
    INSERT INTO sessions (mission_id, service_id, anonymous_token, started_at, completed_at)
    VALUES (?, ?, ?, datetime('now'), datetime('now'))
  `)

  const insertResponseStmt = db.prepare(`
    INSERT INTO responses (session_id, question_id, dimension, answer_value)
    VALUES (?, ?, ?, ?)
  `)

  // Process each contact
  const transaction = db.transaction(() => {
    let completedCount = 0
    const actualScores = []

    contacts.forEach((contact, contactIndex) => {
      console.log(`  📝 Traitement de ${contact.first_name} ${contact.last_name} (${contact.email})`)
      
      if (contact.service_name) {
        console.log(`     Service: ${contact.service_name} (${contact.service_code})`)
      } else {
        console.log(`     Service: Aucun`)
      }

      // Get target score for this contact
      // Prioritize predefined target scores to achieve global average 47% and median 62%
      // Only use service profiles if we have more contacts than predefined scores
      let targetScore
      if (contactIndex < targetScores.length) {
        // Use predefined target scores first (to ensure correct distribution)
        targetScore = targetScores[contactIndex]
      } else if (contact.service_id && serviceTargetScores[contact.service_id]) {
        // Use service profile with some variation for remaining contacts
        const profile = serviceTargetScores[contact.service_id]
        targetScore = profile.min + Math.random() * (profile.max - profile.min)
        targetScore = Math.round(targetScore)
      } else {
        // Fallback: use predefined scores cyclically
        targetScore = targetScores[contactIndex % targetScores.length]
      }
      
      console.log(`     Score cible: ${Math.round(targetScore)}%`)

      // Create session
      const token = generateAnonymousToken()
      const sessionResult = insertSessionStmt.run(
        missionId,
        contact.service_id,
        token
      )
      const sessionId = sessionResult.lastInsertRowid

      // Generate responses for all questions
      const responses = []
      allQuestions.forEach((question, qIndex) => {
        const answer = generateAnswerForTargetScore(
          targetScore,
          question.dimension,
          qIndex,
          allQuestions
        )
        responses.push({
          session_id: sessionId,
          question_id: question.questionId,
          dimension: question.dimension,
          answer_value: answer
        })
      })

      // Insert all responses
      responses.forEach(response => {
        insertResponseStmt.run(
          response.session_id,
          response.question_id,
          response.dimension,
          response.answer_value
        )
      })

      // Calculate actual global score
      const actualScore = calculateGlobalScore(responses)
      actualScores.push(actualScore)
      console.log(`     ✅ Score réel: ${actualScore}% (${responses.length} réponses)\n`)

      completedCount++
    })

    return { completedCount, actualScores }
  })

  const result = transaction()

  console.log(`\n✅ Génération terminée!`)
  console.log(`   ${result.completedCount} session(s) créée(s)`)
  
  // Calculate statistics
  if (result.actualScores.length > 0) {
    const sortedScores = [...result.actualScores].sort((a, b) => a - b)
    const average = result.actualScores.reduce((sum, s) => sum + s, 0) / result.actualScores.length
    const median = sortedScores.length % 2 === 0
      ? (sortedScores[sortedScores.length / 2 - 1] + sortedScores[sortedScores.length / 2]) / 2
      : sortedScores[Math.floor(sortedScores.length / 2)]
    
    console.log(`\n📊 Statistiques:`)
    console.log(`   - Moyenne: ${Math.round(average)}% (cible: 47%)`)
    console.log(`   - Médiane: ${Math.round(median)}% (cible: 62%)`)
    console.log(`   - Min: ${Math.min(...result.actualScores)}%`)
    console.log(`   - Max: ${Math.max(...result.actualScores)}%`)
    console.log(`   - Distribution:`)
    const low = result.actualScores.filter(s => s < 40).length
    const medium = result.actualScores.filter(s => s >= 40 && s < 70).length
    const high = result.actualScores.filter(s => s >= 70).length
    console.log(`     • Faible (<40%): ${low} répondants`)
    console.log(`     • Moyen (40-70%): ${medium} répondants`)
    console.log(`     • Élevé (≥70%): ${high} répondants`)
  }

  console.log(`\n💡 Tu peux maintenant consulter les résultats dans l'application!\n`)

} catch (error) {
  console.error('❌ Erreur:', error)
  console.error(error.stack)
  process.exit(1)
} finally {
  closeDb()
}

