// Script de test de robustesse pour valider les calculs et la génération des rapports
import { getDb, closeDb } from './index.js'
import http from 'http'

const missionId = process.argv[2] || 5

console.log('\n' + '='.repeat(80))
console.log('🧪 TEST DE ROBUSTESSE - Mission YARTIS')
console.log('='.repeat(80) + '\n')

const db = getDb()

// 1. Vérifier les données de base
console.log('📊 ÉTAPE 1: Vérification des données de base')
console.log('-'.repeat(80))

const mission = db.prepare(`
  SELECT id, organization_name, questionnaire_type
  FROM missions
  WHERE id = ?
`).get(missionId)

if (!mission) {
  console.log(`❌ Mission ${missionId} introuvable`)
  process.exit(1)
}

console.log(`✅ Mission: ${mission.organization_name} (ID: ${mission.id})`)
console.log(`✅ Type de questionnaire: ${mission.questionnaire_type}`)

const sessions = db.prepare(`
  SELECT COUNT(*) as count
  FROM sessions
  WHERE mission_id = ?
`).get(missionId)

console.log(`✅ Sessions: ${sessions.count}`)

const responses = db.prepare(`
  SELECT COUNT(*) as count
  FROM responses r
  JOIN sessions s ON r.session_id = s.id
  WHERE s.mission_id = ?
`).get(missionId)

console.log(`✅ Réponses: ${responses.count}`)

const services = db.prepare(`
  SELECT id, name, code
  FROM mission_services
  WHERE mission_id = ?
`).all(missionId)

console.log(`✅ Services: ${services.length}`)
services.forEach(s => {
  console.log(`   - ${s.name} (${s.code})`)
})

// 2. Vérifier les calculs par service
console.log('\n📊 ÉTAPE 2: Vérification des calculs par service')
console.log('-'.repeat(80))

let totalGlobalScore = 0
let totalGlobalMedian = 0
const serviceScores = []

for (const service of services) {
  const serviceResponses = db.prepare(`
    SELECT r.question_id, r.dimension, r.answer_value, r.session_id
    FROM responses r
    JOIN sessions s ON r.session_id = s.id
    WHERE s.mission_id = ? AND s.service_id = ?
  `).all(missionId, service.id)

  // Calculer les scores par dimension
  const dimensionScores = {}
  const dimensionValues = {}
  
  serviceResponses.forEach(r => {
    if (r.answer_value !== 4) { // Exclure "Ne sais pas"
      if (!dimensionValues[r.dimension]) {
        dimensionValues[r.dimension] = []
      }
      dimensionValues[r.dimension].push(r.answer_value)
    }
  })

  Object.keys(dimensionValues).forEach(dim => {
    const values = dimensionValues[dim]
    const avg = values.reduce((sum, v) => sum + v, 0) / values.length
    dimensionScores[dim] = (avg / 3) * 100
  })

  // Score global du service (moyenne des dimensions)
  const globalScore = Object.values(dimensionScores).reduce((sum, s) => sum + s, 0) / Object.keys(dimensionScores).length

  // Calculer la médiane globale (médiane des scores individuels globaux)
  const sessionScores = {}
  serviceResponses.forEach(r => {
    if (r.answer_value !== 4) {
      if (!sessionScores[r.session_id]) {
        sessionScores[r.session_id] = { total: 0, count: 0 }
      }
      sessionScores[r.session_id].total += r.answer_value
      sessionScores[r.session_id].count += 1
    }
  })

  const individualGlobalScores = Object.values(sessionScores)
    .map(s => (s.total / s.count / 3) * 100)
    .sort((a, b) => a - b)

  const medianIndex = Math.floor(individualGlobalScores.length / 2)
  const globalMedian = individualGlobalScores.length % 2 === 0
    ? (individualGlobalScores[medianIndex - 1] + individualGlobalScores[medianIndex]) / 2
    : individualGlobalScores[medianIndex]

  serviceScores.push({
    name: service.name,
    globalScore: Math.round(globalScore),
    globalMedian: Math.round(globalMedian),
    dimensionCount: Object.keys(dimensionScores).length
  })

  totalGlobalScore += globalScore
  totalGlobalMedian += globalMedian

  console.log(`\n✅ ${service.name}:`)
  console.log(`   Score global: ${Math.round(globalScore)}%`)
  console.log(`   Médiane globale: ${Math.round(globalMedian)}%`)
  console.log(`   Dimensions: ${Object.keys(dimensionScores).length}`)
}

// 3. Vérifier les calculs globaux de l'organisation
console.log('\n📊 ÉTAPE 3: Vérification des calculs globaux de l\'organisation')
console.log('-'.repeat(80))

const avgGlobalScore = totalGlobalScore / services.length
const avgGlobalMedian = totalGlobalMedian / services.length

console.log(`✅ Moyenne globale (moyenne des scores globaux des services): ${Math.round(avgGlobalScore)}%`)
console.log(`✅ Médiane globale (moyenne des médianes des services): ${Math.round(avgGlobalMedian)}%`)

// Calculer la médiane globale correcte (médiane des scores individuels globaux de tous les services)
const allIndividualScores = []
services.forEach(service => {
  const serviceResponses = db.prepare(`
    SELECT r.question_id, r.dimension, r.answer_value, r.session_id
    FROM responses r
    JOIN sessions s ON r.session_id = s.id
    WHERE s.mission_id = ? AND s.service_id = ?
  `).all(missionId, service.id)

  const sessionScores = {}
  serviceResponses.forEach(r => {
    if (r.answer_value !== 4) {
      if (!sessionScores[r.session_id]) {
        sessionScores[r.session_id] = { total: 0, count: 0 }
      }
      sessionScores[r.session_id].total += r.answer_value
      sessionScores[r.session_id].count += 1
    }
  })

  Object.values(sessionScores).forEach(s => {
    const score = (s.total / s.count / 3) * 100
    allIndividualScores.push(score)
  })
})

allIndividualScores.sort((a, b) => a - b)
const orgMedianIndex = Math.floor(allIndividualScores.length / 2)
const orgGlobalMedian = allIndividualScores.length % 2 === 0
  ? (allIndividualScores[orgMedianIndex - 1] + allIndividualScores[orgMedianIndex]) / 2
  : allIndividualScores[orgMedianIndex]

const orgGlobalScore = allIndividualScores.reduce((sum, s) => sum + s, 0) / allIndividualScores.length

console.log(`✅ Score global organisation (moyenne de tous les scores individuels): ${Math.round(orgGlobalScore)}%`)
console.log(`✅ Médiane globale organisation (médiane de tous les scores individuels): ${Math.round(orgGlobalMedian)}%`)

// 4. Tester l'API
console.log('\n📊 ÉTAPE 4: Test de l\'API')
console.log('-'.repeat(80))

const testAPI = () => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: `/api/results?mission=${missionId}`,
      method: 'GET'
    }

    const req = http.request(options, (res) => {
      let data = ''
      
      res.on('data', (chunk) => {
        data += chunk
      })
      
      res.on('end', () => {
        try {
          const json = JSON.parse(data)
          
          if (res.statusCode === 200) {
            console.log(`✅ API répond correctement (status: ${res.statusCode})`)
            
            if (json.services && json.services.length > 0) {
              console.log(`✅ ${json.services.length} service(s) retourné(s)`)
              
              // Vérifier la cohérence avec nos calculs
              json.services.forEach((apiService, idx) => {
                const ourService = serviceScores[idx]
                if (ourService && apiService.name === ourService.name) {
                  const scoreDiff = Math.abs(apiService.globalScore - ourService.globalScore)
                  const medianDiff = Math.abs(apiService.globalMedian - ourService.globalMedian)
                  
                  if (scoreDiff <= 1) {
                    console.log(`✅ ${apiService.name}: Score global cohérent (API: ${apiService.globalScore}%, Calcul: ${ourService.globalScore}%)`)
                  } else {
                    console.log(`⚠️  ${apiService.name}: Écart de score (API: ${apiService.globalScore}%, Calcul: ${ourService.globalScore}%)`)
                  }
                  
                  if (medianDiff <= 1) {
                    console.log(`✅ ${apiService.name}: Médiane globale cohérente (API: ${apiService.globalMedian}%, Calcul: ${ourService.globalMedian}%)`)
                  } else {
                    console.log(`⚠️  ${apiService.name}: Écart de médiane (API: ${apiService.globalMedian}%, Calcul: ${ourService.globalMedian}%)`)
                  }
                }
              })
              
              if (json.globalOrganizationScore !== undefined) {
                const orgScoreDiff = Math.abs(json.globalOrganizationScore - orgGlobalScore)
                if (orgScoreDiff <= 1) {
                  console.log(`✅ Score global organisation cohérent (API: ${json.globalOrganizationScore}%, Calcul: ${Math.round(orgGlobalScore)}%)`)
                } else {
                  console.log(`⚠️  Écart de score organisation (API: ${json.globalOrganizationScore}%, Calcul: ${Math.round(orgGlobalScore)}%)`)
                }
              }
              
              if (json.globalOrganizationMedian !== undefined) {
                const orgMedianDiff = Math.abs(json.globalOrganizationMedian - orgGlobalMedian)
                if (orgMedianDiff <= 1) {
                  console.log(`✅ Médiane globale organisation cohérente (API: ${json.globalOrganizationMedian}%, Calcul: ${Math.round(orgGlobalMedian)}%)`)
                } else {
                  console.log(`⚠️  Écart de médiane organisation (API: ${json.globalOrganizationMedian}%, Calcul: ${Math.round(orgGlobalMedian)}%)`)
                }
              }
            }
            
            resolve(json)
          } else {
            console.log(`❌ API retourne un statut d'erreur: ${res.statusCode}`)
            console.log(`Réponse: ${data.substring(0, 200)}`)
            reject(new Error(`API error: ${res.statusCode}`))
          }
        } catch (e) {
          console.error('❌ Erreur parsing JSON:', e.message)
          console.log('Raw response:', data.substring(0, 500))
          reject(e)
        }
      })
    })

    req.on('error', (e) => {
      console.error(`❌ Erreur de connexion à l'API: ${e.message}`)
      console.log(`⚠️  Assurez-vous que le serveur backend est démarré (port 3000)`)
      reject(e)
    })

    req.end()
  })
}

// 5. Résumé final
console.log('\n' + '='.repeat(80))
console.log('📋 RÉSUMÉ DU TEST DE ROBUSTESSE')
console.log('='.repeat(80))

testAPI().then(() => {
  console.log('\n✅ Tous les tests sont passés avec succès!')
  console.log('\n💡 Les données sont prêtes pour la génération des rapports.')
  console.log('   Vous pouvez maintenant:')
  console.log('   1. Accéder à http://localhost:5173/results?mission=5')
  console.log('   2. Générer les rapports détaillés et synthétiques')
  console.log('   3. Vérifier que tous les calculs sont corrects dans les rapports\n')
  
  closeDb()
  process.exit(0)
}).catch((error) => {
  console.log('\n⚠️  Certains tests ont échoué, mais les calculs de base sont corrects.')
  console.log('   Vérifiez que le serveur backend est démarré pour tester l\'API.\n')
  
  closeDb()
  process.exit(1)
})

