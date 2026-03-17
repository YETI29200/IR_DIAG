// Script to check what the API returns
import { getDb, closeDb } from './index.js'
import resultsRoutes from '../routes/results.js'

const db = getDb()

const missionId = process.argv[2] || 5

// Simulate API request
const mockReq = {
  method: 'GET',
  url: new URL(`http://localhost:3000/api/results?mission=${missionId}`)
}

const mockRes = {
  writeHead: (status, headers) => {
    console.log(`Status: ${status}`)
    mockRes.statusCode = status
    mockRes.headers = headers
  },
  end: (data) => {
    try {
      const json = JSON.parse(data)
      console.log('\n📊 Données retournées par l\'API:\n')
      
      if (json.services && json.services.length > 0) {
        json.services.forEach((service, idx) => {
          console.log(`\nService ${idx + 1}: ${service.name}`)
          console.log(`  Score global: ${service.globalScore}%`)
          if (service.globalMedian !== undefined) {
            console.log(`  Médiane globale: ${service.globalMedian}%`)
          }
          console.log(`  Dimensions:`)
          service.dimensionScores?.slice(0, 5).forEach(d => {
            console.log(`    ${d.dimension}: ${d.score}%`)
          })
        })
      }
    } catch (e) {
      console.log('Réponse:', data)
    }
  }
}

// Call the route handler
resultsRoutes(mockReq, mockRes, mockReq.url, null).then(() => {
  closeDb()
})

