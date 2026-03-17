// Script to generate random test responses for all contacts in a mission
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

// Generate anonymous token
function generateAnonymousToken() {
  return randomBytes(16).toString('hex')
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

// Generate random answer with more variability
// Each respondent gets a "profile" that influences their answers
function generateRandomAnswer(respondentProfile = null) {
  // 5% chance of "Ne sais pas" (4)
  if (Math.random() < 0.05) {
    return 4 // "Ne sais pas"
  }
  
  // If no profile provided, create one based on random distribution
  // This creates more realistic variability between respondents
  if (!respondentProfile) {
    const profileRand = Math.random()
    if (profileRand < 0.15) {
      respondentProfile = 'very_low' // 15% - très pessimiste
    } else if (profileRand < 0.35) {
      respondentProfile = 'low' // 20% - plutôt pessimiste
    } else if (profileRand < 0.65) {
      respondentProfile = 'medium' // 30% - neutre
    } else if (profileRand < 0.85) {
      respondentProfile = 'high' // 20% - plutôt optimiste
    } else {
      respondentProfile = 'very_high' // 15% - très optimiste
    }
  }
  
  // Generate answer based on profile with some randomness
  const rand = Math.random()
  let answer
  
  switch (respondentProfile) {
    case 'very_low':
      // Very pessimistic: mostly 0 and 1 (faible maturité)
      if (rand < 0.60) return 0 // 60% "Pas du tout d'accord"
      if (rand < 0.90) return 1 // 30% "Plutôt pas d'accord"
      if (rand < 0.97) return 2 // 7% "Plutôt d'accord"
      return 3 // 3% "Tout à fait d'accord"
      
    case 'low':
      // Pessimistic: mostly 0, 1, and some 2 (faible à moyen-faible)
      if (rand < 0.40) return 0 // 40% "Pas du tout d'accord"
      if (rand < 0.75) return 1 // 35% "Plutôt pas d'accord"
      if (rand < 0.92) return 2 // 17% "Plutôt d'accord"
      return 3 // 8% "Tout à fait d'accord"
      
    case 'medium':
      // Neutral: balanced but slightly towards lower scores (moyen)
      if (rand < 0.30) return 0 // 30% "Pas du tout d'accord"
      if (rand < 0.55) return 1 // 25% "Plutôt pas d'accord"
      if (rand < 0.80) return 2 // 25% "Plutôt d'accord"
      return 3 // 20% "Tout à fait d'accord"
      
    case 'high':
      // Optimistic: mostly 2 and some 3 (moyen-élevé)
      if (rand < 0.20) return 0 // 20% "Pas du tout d'accord"
      if (rand < 0.40) return 1 // 20% "Plutôt pas d'accord"
      if (rand < 0.70) return 2 // 30% "Plutôt d'accord"
      return 3 // 30% "Tout à fait d'accord"
      
    case 'very_high':
      // Very optimistic: mostly 2 and 3 (élevé)
      if (rand < 0.15) return 0 // 15% "Pas du tout d'accord"
      if (rand < 0.30) return 1 // 15% "Plutôt pas d'accord"
      if (rand < 0.60) return 2 // 30% "Plutôt d'accord"
      return 3 // 40% "Tout à fait d'accord"
      
    default:
      // Default: slightly pessimistic (réaliste)
      if (rand < 0.35) return 0
      if (rand < 0.60) return 1
      if (rand < 0.85) return 2
      return 3
  }
}

// Get mission ID from command line argument
const missionIdArg = process.argv[2]

if (!missionIdArg) {
  console.log('Usage: node server/db/generate-test-responses.js <mission_id>')
  console.log('Example: node server/db/generate-test-responses.js 5')
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

  console.log(`\n🔄 Génération des réponses de test pour la mission ${missionId}: ${mission.organization_name}`)
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

  // Clean existing sessions for this mission first to avoid duplicates
  console.log(`🧹 Nettoyage des sessions existantes...`)
  const deleteSessionsStmt = db.prepare(`DELETE FROM sessions WHERE mission_id = ?`)
  const deletedCount = deleteSessionsStmt.run(missionId).changes
  if (deletedCount > 0) {
    console.log(`   ✅ ${deletedCount} session(s) supprimée(s)\n`)
  } else {
    console.log(`   ℹ️  Aucune session existante\n`)
  }

  // Prepare statements
  const insertSessionStmt = db.prepare(`
    INSERT INTO sessions (mission_id, service_id, anonymous_token, started_at, completed_at)
    VALUES (?, ?, ?, datetime('now'), datetime('now'))
  `)

  const insertResponseStmt = db.prepare(`
    INSERT INTO responses (session_id, question_id, dimension, answer_value)
    VALUES (?, ?, ?, ?)
  `)

  const insertEmailLogStmt = db.prepare(`
    INSERT INTO email_logs (mission_id, contact_id, template_name, subject, body_html, status, sent_at)
    VALUES (?, ?, ?, ?, ?, 'simulated_sent', datetime('now', '-' || ? || ' days'))
  `)

  // Process each contact
  const transaction = db.transaction(() => {
    let completedCount = 0
    let emailCount = 0

    for (const contact of contacts) {
      console.log(`  📝 Traitement de ${contact.first_name} ${contact.last_name} (${contact.email})`)
      
      if (contact.service_name) {
        console.log(`     Service: ${contact.service_name} (${contact.service_code})`)
      } else {
        console.log(`     Service: Aucun`)
      }

      // For test data, always create a new session for each contact
      // This ensures one session per contact, avoiding duplicates
      const token = generateAnonymousToken()
      const sessionResult = insertSessionStmt.run(
        missionId,
        contact.service_id,
        token
      )
      const sessionId = sessionResult.lastInsertRowid

      // Assign a profile to this respondent for consistency
      // Distribution plus réaliste: beaucoup de faible, du moyen, peu d'élevé
      const profileRand = Math.random()
      let respondentProfile
      if (profileRand < 0.40) {
        respondentProfile = 'very_low' // 40% - très pessimiste
      } else if (profileRand < 0.70) {
        respondentProfile = 'low' // 30% - plutôt pessimiste
      } else if (profileRand < 0.90) {
        respondentProfile = 'medium' // 20% - neutre
      } else if (profileRand < 0.97) {
        respondentProfile = 'high' // 7% - plutôt optimiste
      } else {
        respondentProfile = 'very_high' // 3% - très optimiste
      }
      
      // Add some dimension-specific variation (some dimensions might be better/worse)
      // This creates more nuanced results
      const dimensionProfiles = {}
      allQuestions.forEach(q => {
        if (!dimensionProfiles[q.dimension]) {
          // Each dimension gets a slight adjustment based on the respondent's base profile
          const dimRand = Math.random()
          if (dimRand < 0.2) {
            dimensionProfiles[q.dimension] = 'worse' // 20% chance dimension is worse
          } else if (dimRand < 0.4) {
            dimensionProfiles[q.dimension] = 'better' // 20% chance dimension is better
          } else {
            dimensionProfiles[q.dimension] = 'same' // 60% same as base profile
          }
        }
      })
      
      // Generate responses for all questions
      let responseCount = 0
      for (const question of allQuestions) {
        // Adjust profile for this dimension
        let questionProfile = respondentProfile
        const dimAdjustment = dimensionProfiles[question.dimension]
        
        if (dimAdjustment === 'worse') {
          // Make answers slightly more negative
          if (respondentProfile === 'very_high') questionProfile = 'high'
          else if (respondentProfile === 'high') questionProfile = 'medium'
          else if (respondentProfile === 'medium') questionProfile = 'low'
          else if (respondentProfile === 'low') questionProfile = 'very_low'
        } else if (dimAdjustment === 'better') {
          // Make answers slightly more positive
          if (respondentProfile === 'very_low') questionProfile = 'low'
          else if (respondentProfile === 'low') questionProfile = 'medium'
          else if (respondentProfile === 'medium') questionProfile = 'high'
          else if (respondentProfile === 'high') questionProfile = 'very_high'
        }
        
        // Add some random variation (10% chance of different answer)
        const finalProfile = Math.random() < 0.1 ? null : questionProfile
        
        const answerValue = generateRandomAnswer(finalProfile)
        insertResponseStmt.run(
          sessionId,
          question.questionId,
          question.dimension,
          answerValue
        )
        responseCount++
      }

      console.log(`     ✅ Session créée (ID: ${sessionId}) avec ${responseCount} réponses`)
      completedCount++

      // Simulate email send (random days ago between 0 and 7)
      const daysAgo = Math.floor(Math.random() * 8)
      const emailSubject = `Questionnaire de maturité IA - ${mission.organization_name}`
      const emailBody = `
        <p>Bonjour ${contact.first_name} ${contact.last_name},</p>
        <p>Vous êtes invité à participer au questionnaire de maturité IA pour ${mission.organization_name}.</p>
        <p>Cliquez sur le lien ci-dessous pour accéder au questionnaire :</p>
        <p><a href="/questionnaire/${mission.questionnaire_type}/${missionId}?service=${contact.service_code || ''}&token=${token}">Accéder au questionnaire</a></p>
      `
      
      insertEmailLogStmt.run(
        missionId,
        contact.id,
        'questionnaire_invitation',
        emailSubject,
        emailBody,
        daysAgo
      )
      emailCount++
      console.log(`     📧 Email simulé (envoyé il y a ${daysAgo} jour(s))`)
      console.log('')
    }

    return { completedCount, emailCount }
  })

  const result = transaction()

  console.log(`\n✅ Génération terminée avec succès!`)
  console.log(`   - ${result.completedCount} session(s) créée(s) et complétée(s)`)
  console.log(`   - ${result.emailCount} email(s) simulé(s)`)
  console.log(`   - ${allQuestions.length} questions par session`)
  console.log(`   - ${result.completedCount * allQuestions.length} réponses générées au total\n`)

  // Show statistics
  console.log(`📊 Statistiques par service:`)
  const services = db.prepare(`
    SELECT s.id, s.name, s.code,
           COUNT(DISTINCT se.id) as session_count,
           COUNT(DISTINCT c.id) as contact_count
    FROM mission_services s
    LEFT JOIN mission_contacts c ON c.service_id = s.id AND c.mission_id = ?
    LEFT JOIN sessions se ON se.service_id = s.id AND se.mission_id = ?
    WHERE s.mission_id = ?
    GROUP BY s.id, s.name, s.code
    ORDER BY s.name
  `).all(missionId, missionId, missionId)

  for (const service of services) {
    console.log(`   - ${service.name} (${service.code}): ${service.session_count} session(s), ${service.contact_count} contact(s)`)
  }

  // Show overall completion rate
  const totalContacts = contacts.length
  const totalSessions = db.prepare(`
    SELECT COUNT(*) as count
    FROM sessions
    WHERE mission_id = ? AND completed_at IS NOT NULL
  `).get(missionId).count

  const completionRate = totalContacts > 0 ? Math.round((totalSessions / totalContacts) * 100) : 0
  console.log(`\n📈 Taux de complétion: ${completionRate}% (${totalSessions}/${totalContacts})`)

} catch (error) {
  console.error('❌ Erreur:', error.message)
  console.error(error.stack)
  process.exit(1)
} finally {
  closeDb()
}

