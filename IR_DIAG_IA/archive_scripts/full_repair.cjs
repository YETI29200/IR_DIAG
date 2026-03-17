const fs = require('fs');
const path = 'client/src/pages/Results.vue';
let content = fs.readFileSync(path, 'utf8');

// 1. Restore loadResults function
const loadResultsImplementation = `async function loadResults() {
  loading.value = true
  error.value = ''
  
  try {
    const missionId = query.mission
    const sessionId = query.session
    
    let url = '/api/results'
    if (missionId) {
      url += \`?missionId=\${missionId}\`
    } else if (sessionId) {
      url += \`?sessionId=\${sessionId}\`
    } else {
      throw new Error('Mission ID or Session ID required')
    }
    
    const response = await fetch(url)
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Erreur lors du chargement des résultats')
    }
    
    const data = await response.json()
    mission.value = data.mission
    missionData.value = data
    dimensionScores.value = data.dimensionScores || []
    recommendations.value = data.recommendations || []
    lastModified.value = data.lastModified
    openaiConfigured.value = data.openaiConfigured
    globalOrganizationAverage.value = data.globalOrganizationAverage
    globalOrganizationMedian.value = data.globalOrganizationMedian
    globalOrganizationNSPRate.value = data.globalOrganizationNSPRate
    
    // Check if recommendations are already approved (validated status on services)
    if (data.services && data.services.length > 0) {
      recommendationsApproved.value = data.services.every((s: any) => s.status === 'validated')
    }

  } catch (err: any) {
    console.error('Error loading results:', err)
    error.value = err.message || 'Une erreur est survenue lors du chargement des résultats'
  } finally {
    loading.value = false
  }
}`;

content = content.replace(/async function loadResults\(\) \{[\s\S]*?\}/, loadResultsImplementation);

// 2. Fix encoding and triple mojibake
const replacements = [
    { from: /éƒÃ‚Â©/g, to: 'é' },
    { from: /éƒÃ‚Â /g, to: 'à' },
    { from: /éƒÃ‚Â¨/g, to: 'è' },
    { from: /éƒÃ‚Â§/g, to: 'ç' },
    { from: /éƒÃ‚Âª/g, to: 'ê' },
    { from: /éƒÃ‚Â»/g, to: 'û' },
    { from: /éƒÃ‚Â´/g, to: 'ô' },
    { from: /éƒÃ‚Â«/g, to: 'ë' },
    { from: /ÃƒÂ©/g, to: 'é' },
    { from: /ÃƒÂ¨/g, to: 'è' },
    { from: /ÃƒÂ /g, to: 'à' },
    { from: /ÃƒÂ§/g, to: 'ç' },
    { from: /ÃƒÂª/g, to: 'ê' },
    { from: /ÃƒÂ»/g, to: 'û' },
    { from: /ÃƒÂ´/g, to: 'ô' },
    { from: /ÃÂ©/g, to: 'é' },
    { from: /ÃÂ¨/g, to: 'è' },
    { from: /ÃÂ /g, to: 'à' },
    { from: /Ã©/g, to: 'é' },
    { from: /Ã¨/g, to: 'è' },
    { from: /Ã /g, to: 'à' },
    { from: /Ã§/g, to: 'ç' },
    { from: /GÃ©nÃ©ration/g, to: 'Génération' },
    { from: /SynthÃ©tique/g, to: 'Synthétique' },
    { from: /DÃ©taillÃ©/g, to: 'Détaillé' },
    { from: /PrÃ©visualiser/g, to: 'Prévisualiser' }
];

replacements.forEach(r => {
    content = content.replace(r.from, r.to);
});

// 3. Fix router inject in Landing.vue (Bonus)
// This will be done in a separate call if needed, focusing on Results.vue first.

fs.writeFileSync(path, content, 'utf8');
console.log("SUCCESS: Results.vue fully repaired");
