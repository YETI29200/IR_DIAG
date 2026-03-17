// Script de diagnostic pour vérifier que les serveurs sont démarrés
import { request } from 'http'

const PORT_BACKEND = 3000
const PORT_FRONTEND = 5173

console.log('🔍 Vérification des serveurs...\n')

// Vérifier le backend
const checkBackend = () => {
  return new Promise((resolve) => {
    const req = request({
      hostname: 'localhost',
      port: PORT_BACKEND,
      path: '/api/health',
      method: 'GET',
      timeout: 2000
    }, (res) => {
      console.log('✅ Backend (port 3000): DÉMARRÉ')
      res.on('data', () => {}) // Consume response
      res.on('end', () => resolve(true))
    })

    req.on('error', (err) => {
      if (err.code === 'ECONNREFUSED') {
        console.log('❌ Backend (port 3000): NON DÉMARRÉ')
        console.log('   → Démarrez le serveur avec: cd server && node index.js')
      } else {
        console.log('⚠️  Backend (port 3000): Erreur:', err.message)
      }
      resolve(false)
    })

    req.on('timeout', () => {
      console.log('⚠️  Backend (port 3000): Timeout')
      req.destroy()
      resolve(false)
    })

    req.end()
  })
}

// Vérifier le frontend
const checkFrontend = () => {
  return new Promise((resolve) => {
    const req = request({
      hostname: 'localhost',
      port: PORT_FRONTEND,
      path: '/',
      method: 'GET',
      timeout: 2000
    }, (res) => {
      console.log('✅ Frontend (port 5173): DÉMARRÉ')
      res.on('data', () => {}) // Consume response
      res.on('end', () => resolve(true))
    })

    req.on('error', (err) => {
      if (err.code === 'ECONNREFUSED') {
        console.log('❌ Frontend (port 5173): NON DÉMARRÉ')
        console.log('   → Démarrez le serveur avec: cd client && npx vite')
      } else {
        console.log('⚠️  Frontend (port 5173): Erreur:', err.message)
      }
      resolve(false)
    })

    req.on('timeout', () => {
      console.log('⚠️  Frontend (port 5173): Timeout')
      req.destroy()
      resolve(false)
    })

    req.end()
  })
}

// Exécuter les vérifications
Promise.all([checkBackend(), checkFrontend()]).then(([backendOk, frontendOk]) => {
  console.log('\n📋 Résumé:')
  if (backendOk && frontendOk) {
    console.log('✅ Les deux serveurs sont démarrés correctement')
  } else {
    console.log('❌ Un ou plusieurs serveurs ne sont pas démarrés')
    console.log('\n💡 Solution:')
    console.log('   1. Utilisez le script start-servers.bat pour démarrer les serveurs')
    console.log('   2. Ou démarrez manuellement:')
    console.log('      - Backend: cd server && node index.js')
    console.log('      - Frontend: cd client && npx vite')
  }
  process.exit(backendOk && frontendOk ? 0 : 1)
})

