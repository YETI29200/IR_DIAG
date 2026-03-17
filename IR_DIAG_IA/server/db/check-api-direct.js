// Check API response directly
import http from 'http'

const missionId = process.argv[2] || '5'

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
      
      console.log('\n📊 Données brutes de l\'API:\n')
      
      if (json.services && json.services.length > 0) {
        const service = json.services[0]
        console.log(`Service: ${service.name}`)
        console.log(`  GlobalScore: ${service.globalScore} (type: ${typeof service.globalScore})`)
        console.log(`  GlobalMedian: ${service.globalMedian} (type: ${typeof service.globalMedian})`)
        console.log(`\n  Dimensions:`)
        
        service.dimensionScores?.slice(0, 5).forEach(dim => {
          console.log(`    ${dim.dimension}: ${dim.score} (type: ${typeof dim.score})`)
        })
        
        console.log(`\n  SubDimensions:`)
        service.subDimensions?.slice(0, 5).forEach(sub => {
          console.log(`    ${sub.dimension}: ${sub.score} (type: ${typeof sub.score})`)
        })
      }
      
      console.log(`\n✅ Réponse API valide`)
    } catch (e) {
      console.error('❌ Erreur parsing JSON:', e.message)
      console.log('Raw response:', data.substring(0, 500))
    }
  })
})

req.on('error', (e) => {
  console.error(`❌ Erreur: ${e.message}`)
})

req.end()

