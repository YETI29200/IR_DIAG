// Script to set up complete test data: generate contacts, assign them, and generate responses
// Usage: node server/db/setup-test-data.js <mission_id>
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

const missionIdArg = process.argv[2]

if (!missionIdArg) {
  console.log('Usage: node server/db/setup-test-data.js <mission_id>')
  console.log('Example: node server/db/setup-test-data.js 5')
  process.exit(1)
}

const missionId = parseInt(missionIdArg)

async function runCommand(command, description) {
  console.log(`\n${description}...`)
  try {
    const { stdout, stderr } = await execAsync(command)
    if (stdout) console.log(stdout)
    if (stderr) console.error(stderr)
    return true
  } catch (error) {
    console.error(`❌ Erreur lors de: ${description}`)
    console.error(error.message)
    return false
  }
}

async function main() {
  console.log(`\n🚀 Configuration des données de test pour la mission ${missionId}`)
  console.log('=' .repeat(60))

  // Step 1: Generate fake contacts (5 per service)
  const step1 = await runCommand(
    `node server/db/generate-fake-contacts.js ${missionId}`,
    '📝 Étape 1: Génération de contacts fictifs (5 par service)'
  )

  if (!step1) {
    console.log('\n❌ Échec de l\'étape 1. Arrêt.')
    process.exit(1)
  }

  // Step 2: Assign contacts to services
  const step2 = await runCommand(
    `node server/db/assign-contacts-to-services.js ${missionId}`,
    '📋 Étape 2: Affectation des contacts aux services'
  )

  if (!step2) {
    console.log('\n❌ Échec de l\'étape 2. Arrêt.')
    process.exit(1)
  }

  // Step 3: Generate test responses
  const step3 = await runCommand(
    `node server/db/generate-test-responses.js ${missionId}`,
    '📊 Étape 3: Génération des réponses de test (distribution réaliste)'
  )

  if (!step3) {
    console.log('\n❌ Échec de l\'étape 3. Arrêt.')
    process.exit(1)
  }

  console.log('\n' + '='.repeat(60))
  console.log('✅ Configuration terminée avec succès!')
  console.log(`\n📈 Résumé:`)
  console.log(`   - Contacts fictifs créés (5 par service)`)
  console.log(`   - Contacts assignés aux services`)
  console.log(`   - Réponses générées avec distribution réaliste:`)
  console.log(`     • 40% très faible`)
  console.log(`     • 30% faible`)
  console.log(`     • 20% moyen`)
  console.log(`     • 7% élevé`)
  console.log(`     • 3% très élevé`)
  console.log(`\n💡 Tu peux maintenant consulter les résultats dans l'application!\n`)
}

main().catch(error => {
  console.error('❌ Erreur fatale:', error)
  process.exit(1)
})

