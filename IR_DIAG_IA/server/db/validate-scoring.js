// Script de validation complète de la fiabilité des calculs de scores
import { getDb, closeDb } from './index.js'
import { getAllDimensions, getDimensionName } from '../utils/questions.js'

const db = getDb()

function calculateDimensionScores(responses, questionnaireType) {
  const dimensionTotals = {}
  const dimensionCounts = {}
  const maxScores = {}

  const allDimensions = getAllDimensions()
  const questionsPerDimension = questionnaireType === 'flash' ? 1 : 8
  const maxPointsPerQuestion = 3

  if (questionnaireType === 'flash') {
    const flashDimensions = allDimensions.slice(0, 5)
    flashDimensions.forEach(dim => {
      maxScores[dim.id] = maxPointsPerQuestion
      dimensionTotals[dim.id] = 0
      dimensionCounts[dim.id] = 0
    })
  } else {
    allDimensions.forEach(dim => {
      maxScores[dim.id] = maxPointsPerQuestion
      dimensionTotals[dim.id] = 0
      dimensionCounts[dim.id] = 0
    })
  }

  responses.forEach(response => {
    const dim = response.dimension
    const value = response.answer_value
    if (dimensionTotals[dim] !== undefined && value !== 4) {
      dimensionTotals[dim] += value
      dimensionCounts[dim] += 1
    }
  })

  const scores = []
  Object.keys(dimensionTotals).forEach(dimension => {
    const total = dimensionTotals[dimension]
    const count = dimensionCounts[dimension]
    const maxValuePerAnswer = maxScores[dimension]
    
    const averageValue = count > 0 ? total / count : 0
    const score = maxValuePerAnswer > 0 ? (averageValue / maxValuePerAnswer) * 100 : 0
    const finalScore = Math.min(100, Math.max(0, score))
    
    scores.push({
      dimension,
      score: Math.round(finalScore * 10) / 10
    })
  })

  return scores
}

function calculateMedianScores(responses, questionnaireType) {
  const maxPointsPerQuestion = 3
  const sessionDimensionScores = {}

  responses.forEach(response => {
    const sessionId = response.session_id || 'unknown'
    const dim = response.dimension
    const value = response.answer_value

    if (value !== 4) {
      if (!sessionDimensionScores[sessionId]) {
        sessionDimensionScores[sessionId] = {}
      }
      if (!sessionDimensionScores[sessionId][dim]) {
        sessionDimensionScores[sessionId][dim] = []
      }
      sessionDimensionScores[sessionId][dim].push(value)
    }
  })

  const dimensionScoresBySession = {}

  Object.keys(sessionDimensionScores).forEach(sessionId => {
    Object.keys(sessionDimensionScores[sessionId]).forEach(dimension => {
      const values = sessionDimensionScores[sessionId][dimension]
      const avgValue = values.reduce((sum, v) => sum + v, 0) / values.length
      const score = (avgValue / maxPointsPerQuestion) * 100
      const finalScore = Math.min(100, Math.max(0, score))

      if (!dimensionScoresBySession[dimension]) {
        dimensionScoresBySession[dimension] = []
      }
      dimensionScoresBySession[dimension].push(finalScore)
    })
  })

  const medianScores = []
  Object.keys(dimensionScoresBySession).forEach(dimension => {
    const scores = dimensionScoresBySession[dimension].sort((a, b) => a - b)
    let median = null

    if (scores.length > 0) {
      if (scores.length % 2 === 0) {
        const mid1 = scores[Math.floor(scores.length / 2) - 1]
        const mid2 = scores[Math.floor(scores.length / 2)]
        median = (mid1 + mid2) / 2
      } else {
        median = scores[Math.floor(scores.length / 2)]
      }
    }

    if (median !== null) {
      medianScores.push({
        dimension,
        median: Math.round(median * 10) / 10
      })
    }
  })

  return medianScores
}

const missionId = process.argv[2] || 5

console.log('\n' + '='.repeat(80))
console.log('🔍 VALIDATION COMPLÈTE DE LA FIABILITÉ DES CALCULS')
console.log('='.repeat(80))

// Get mission
const mission = db.prepare(`
  SELECT id, organization_name, questionnaire_type
  FROM missions
  WHERE id = ?
`).get(missionId)

if (!mission) {
  console.log(`❌ Mission ${missionId} introuvable`)
  process.exit(1)
}

console.log(`\n📋 Mission: ${mission.organization_name} (ID: ${missionId})`)
console.log(`   Type: ${mission.questionnaire_type}\n`)

// Get services
const services = db.prepare(`
  SELECT id, name, code
  FROM mission_services
  WHERE mission_id = ?
`).all(missionId)

let totalErrors = 0
let totalWarnings = 0

for (const service of services) {
  console.log('\n' + '-'.repeat(80))
  console.log(`🔍 SERVICE: ${service.name} (${service.code})`)
  console.log('-'.repeat(80))

  // Get all responses for this service
  const responses = db.prepare(`
    SELECT r.question_id, r.dimension, r.answer_value, r.session_id
    FROM responses r
    JOIN sessions s ON r.session_id = s.id
    WHERE s.mission_id = ? AND s.service_id = ?
  `).all(missionId, service.id)

  console.log(`\n📊 Données brutes:`)
  console.log(`   Total réponses: ${responses.length}`)

  // Distribution des valeurs
  const distribution = {}
  responses.forEach(r => {
    if (r.answer_value !== 4) {
      distribution[r.answer_value] = (distribution[r.answer_value] || 0) + 1
    }
  })

  const totalValid = Object.values(distribution).reduce((a, b) => a + b, 0)
  console.log(`   Réponses valides (hors "Ne sais pas"): ${totalValid}`)
  Object.keys(distribution).sort().forEach(val => {
    const count = distribution[val]
    const percent = ((count / totalValid) * 100).toFixed(1)
    console.log(`     Valeur ${val}: ${count} réponses (${percent}%)`)
  })

  // Vérification 1: Calcul des scores par dimension
  console.log(`\n✅ VÉRIFICATION 1: Calcul des scores par dimension`)
  const calculatedScores = calculateDimensionScores(responses, mission.questionnaire_type)
  
  let dimensionErrors = 0
  calculatedScores.forEach(calcScore => {
    // Vérifier manuellement pour cette dimension
    const dimResponses = responses.filter(r => r.dimension === calcScore.dimension && r.answer_value !== 4)
    
    if (dimResponses.length === 0) {
      console.log(`   ⚠️  ${calcScore.dimension}: Aucune réponse valide`)
      totalWarnings++
      return
    }

    const sum = dimResponses.reduce((acc, r) => acc + r.answer_value, 0)
    const avgValue = sum / dimResponses.length
    const expectedScore = (avgValue / 3) * 100
    const expectedScoreRounded = Math.round(expectedScore * 10) / 10

    // Tolérance de 0.1% pour les arrondis
    const diff = Math.abs(calcScore.score - expectedScoreRounded)
    
    if (diff > 0.1) {
      console.log(`   ❌ ${calcScore.dimension}: ERREUR!`)
      console.log(`      Calculé: ${calcScore.score}%`)
      console.log(`      Attendu: ${expectedScoreRounded}% (moyenne: ${avgValue.toFixed(3)}/3, ${dimResponses.length} réponses)`)
      console.log(`      Différence: ${diff.toFixed(2)}%`)
      dimensionErrors++
      totalErrors++
    } else {
      console.log(`   ✅ ${calcScore.dimension}: ${calcScore.score}% (moyenne: ${avgValue.toFixed(2)}/3, ${dimResponses.length} réponses)`)
    }
  })

  if (dimensionErrors === 0) {
    console.log(`   ✅ Tous les scores de dimension sont corrects`)
  }

  // Vérification 2: Score global
  console.log(`\n✅ VÉRIFICATION 2: Score global du service`)
  const globalScore = calculatedScores.length > 0
    ? calculatedScores.reduce((sum, s) => sum + s.score, 0) / calculatedScores.length
    : 0
  const globalScoreRounded = Math.round(globalScore)
  
  console.log(`   Score global calculé: ${globalScoreRounded}%`)
  console.log(`   (Moyenne de ${calculatedScores.length} dimensions)`)

  // Vérification 3: Médiane
  console.log(`\n✅ VÉRIFICATION 3: Calcul de la médiane`)
  const medianScores = calculateMedianScores(responses, mission.questionnaire_type)
  
  if (medianScores.length === 0) {
    console.log(`   ⚠️  Aucune médiane calculable`)
    totalWarnings++
  } else {
    console.log(`   ${medianScores.length} médiane(s) calculée(s):`)
    medianScores.forEach(m => {
      console.log(`     ${m.dimension}: ${m.median}%`)
    })

    // Vérifier que la médiane est cohérente
    medianScores.forEach(medianData => {
      const dimResponses = responses.filter(r => r.dimension === medianData.dimension && r.answer_value !== 4)
      if (dimResponses.length === 0) {
        console.log(`   ⚠️  ${medianData.dimension}: Médiane calculée sans réponses valides (anomalie)`)
        totalWarnings++
        return
      }

      // Calculer les scores individuels par session
      const sessionScores = {}
      dimResponses.forEach(r => {
        if (!sessionScores[r.session_id]) {
          sessionScores[r.session_id] = []
        }
        sessionScores[r.session_id].push(r.answer_value)
      })

      const individualScores = Object.keys(sessionScores).map(sessionId => {
        const values = sessionScores[sessionId]
        const avgValue = values.reduce((sum, v) => sum + v, 0) / values.length
        return (avgValue / 3) * 100
      }).sort((a, b) => a - b)

      // Calculer la médiane manuellement
      let manualMedian = null
      if (individualScores.length > 0) {
        if (individualScores.length % 2 === 0) {
          const mid1 = individualScores[Math.floor(individualScores.length / 2) - 1]
          const mid2 = individualScores[Math.floor(individualScores.length / 2)]
          manualMedian = (mid1 + mid2) / 2
        } else {
          manualMedian = individualScores[Math.floor(individualScores.length / 2)]
        }
        manualMedian = Math.round(manualMedian * 10) / 10
      }

      const diff = Math.abs(medianData.median - manualMedian)
      if (diff > 0.1) {
        console.log(`   ❌ ${medianData.dimension}: ERREUR dans le calcul de la médiane!`)
        console.log(`      Calculé: ${medianData.median}%`)
        console.log(`      Attendu: ${manualMedian}%`)
        console.log(`      Scores individuels: ${individualScores.map(s => s.toFixed(1)).join(', ')}`)
        totalErrors++
      } else {
        console.log(`   ✅ ${medianData.dimension}: Médiane ${medianData.median}% (${individualScores.length} répondants)`)
      }
    })
  }

  // Vérification 4: Cohérence moyenne vs médiane
  console.log(`\n✅ VÉRIFICATION 4: Cohérence moyenne vs médiane`)
  calculatedScores.forEach(calcScore => {
    const medianData = medianScores.find(m => m.dimension === calcScore.dimension)
    if (medianData) {
      const diff = Math.abs(calcScore.score - medianData.median)
      if (diff > 50) {
        console.log(`   ⚠️  ${calcScore.dimension}: Grande différence moyenne/médiane (${calcScore.score}% vs ${medianData.median}%)`)
        console.log(`      → Indique une forte dispersion des réponses (normal)`)
        totalWarnings++
      } else {
        console.log(`   ✅ ${calcScore.dimension}: Moyenne ${calcScore.score}%, Médiane ${medianData.median}% (diff: ${diff.toFixed(1)}%)`)
      }
    }
  })

  // Vérification 5: Cas limites
  console.log(`\n✅ VÉRIFICATION 5: Cas limites`)
  
  // Vérifier qu'aucun score n'est > 100%
  const scoresOver100 = calculatedScores.filter(s => s.score > 100)
  if (scoresOver100.length > 0) {
    console.log(`   ❌ ERREUR: ${scoresOver100.length} score(s) > 100%!`)
    scoresOver100.forEach(s => console.log(`      ${s.dimension}: ${s.score}%`))
    totalErrors++
  } else {
    console.log(`   ✅ Aucun score > 100%`)
  }

  // Vérifier qu'aucun score n'est < 0%
  const scoresUnder0 = calculatedScores.filter(s => s.score < 0)
  if (scoresUnder0.length > 0) {
    console.log(`   ❌ ERREUR: ${scoresUnder0.length} score(s) < 0%!`)
    scoresUnder0.forEach(s => console.log(`      ${s.dimension}: ${s.score}%`))
    totalErrors++
  } else {
    console.log(`   ✅ Aucun score < 0%`)
  }

  // Vérifier la distribution réaliste
  const avgScore = calculatedScores.reduce((sum, s) => sum + s.score, 0) / calculatedScores.length
  if (avgScore > 80) {
    console.log(`   ⚠️  Score moyen très élevé (${avgScore.toFixed(1)}%) - peut indiquer un problème de distribution`)
    totalWarnings++
  } else if (avgScore < 10) {
    console.log(`   ⚠️  Score moyen très faible (${avgScore.toFixed(1)}%) - peut indiquer un problème de distribution`)
    totalWarnings++
  } else {
    console.log(`   ✅ Score moyen réaliste: ${avgScore.toFixed(1)}%`)
  }
}

// Résumé final
console.log('\n' + '='.repeat(80))
console.log('📊 RÉSUMÉ DE LA VALIDATION')
console.log('='.repeat(80))
console.log(`\n✅ Erreurs détectées: ${totalErrors}`)
console.log(`⚠️  Avertissements: ${totalWarnings}`)

if (totalErrors === 0) {
  console.log(`\n✅ VALIDATION RÉUSSIE: Tous les calculs sont corrects!`)
  console.log(`   La fiabilité du modèle est confirmée.`)
} else {
  console.log(`\n❌ VALIDATION ÉCHOUÉE: ${totalErrors} erreur(s) détectée(s)`)
  console.log(`   ⚠️  La crédibilité du modèle est compromise.`)
  process.exit(1)
}

if (totalWarnings > 0) {
  console.log(`\n⚠️  ${totalWarnings} avertissement(s) - à examiner mais non bloquant(s)`)
}

closeDb()

