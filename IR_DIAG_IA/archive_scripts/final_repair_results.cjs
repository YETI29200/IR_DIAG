const fs = require('fs');
const path = 'client/src/pages/Results.vue';
let content = fs.readFileSync(path, 'utf8');

// 1. Remove ALL generateSyntheticReport and replace with one single implementation
content = content.replace(/async function generateSyntheticReport\(\) \{[\s\S]*?\}/g, "");
// Add back the correct one at the end of script
content = content.replace("</script>", "async function generateSyntheticReport() {\n    await generateDetailedReport();\n}\n</script>");

// 2. Fix saveEditing properly
const start = content.indexOf("async function saveEditing(dimension: string)");
const end = content.indexOf("alert('Recommandations sauvegardées avec succès (version historique créée).')");
// This is fragile. Let's use a function that finds the balanced brace.

function findBlockEnd(str, startPos) {
    let balance = 0;
    let started = false;
    for (let i = startPos; i < str.length; i++) {
        if (str[i] === '{') {
            balance++;
            started = true;
        } else if (str[i] === '}') {
            balance--;
        }
        if (started && balance === 0) return i;
    }
    return -1;
}

const functionStart = content.indexOf("async function saveEditing(dimension: string)");
if (functionStart !== -1) {
    const blockEnd = findBlockEnd(content, functionStart);
    if (blockEnd !== -1) {
        const pre = content.substring(0, functionStart);
        const post = content.substring(blockEnd + 1);
        const fixed = `async function saveEditing(dimension: string) {
  const scoresToUse = activeView.value === 'comparison' 
    ? organizationDimensionScores.value
    : selectedServiceData.value?.dimensionScores || []
  
  if (scoresToUse.length === 0) {
    console.error('Aucun score disponible pour sauvegarder')
    alert('Erreur : Aucun score disponible pour sauvegarder')
    return
  }
  
  try {
    const recommendationsToSave = scoresToUse.map((score: any) => {
      const edited = editedRecommendations.value[score.dimension]
      if (edited) {
        return {
          dimension: score.dimension,
          score: score.score,
          level: score.level,
          synthesis: edited.synthesis !== undefined ? edited.synthesis : getRecommendationSynthesis(score),
          description: edited.description !== undefined ? edited.description : getRecommendationDescription(score),
          actions: edited.actions !== undefined ? edited.actions : getRecommendationActions(score),
          services: edited.services !== undefined ? edited.services : getRecommendationServices(score)
        }
      }
      return {
        dimension: score.dimension,
        score: score.score,
        level: score.level,
        synthesis: getRecommendationSynthesis(score),
        description: getRecommendationDescription(score),
        actions: getRecommendationActions(score),
        services: getRecommendationServices(score)
      }
    })
    
    const missionId = query.mission
    if (!missionId) {
      console.error('Mission ID manquant')
      alert('Erreur : Mission ID manquant')
      return
    }
    
    const payload = {
      missionId: parseInt(missionId as string),
      serviceId: activeView.value === 'details' && selectedServiceId.value ? parseInt(selectedServiceId.value.toString()) : null,
      recommendations: recommendationsToSave
    }
    
    const response = await fetch('/api/results/recommendations', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    
    const data = await response.json()
    
    if (!response.ok) {
      console.error('Erreur lors de la sauvegarde:', data)
      alert(\`Erreur lors de la sauvegarde des recommandations: \${data.error || data.message || 'Erreur inconnue'}\`)
      return
    }
    
    const modifiedAt = data.modifiedAt
    modifiedDimensions.value.add(dimension)
    savedInCurrentSession.value.add(dimension)
    editingRecommendation.value = null
    
    if (activeView.value === 'comparison') {
      lastModified.value = modifiedAt
    } else if (selectedServiceData.value) {
      const service = missionData.value?.services.find((s: any) => s.id === selectedServiceId.value)
      if (service) {
        service.lastModified = modifiedAt
      }
    }
    
    alert('Recommandations sauvegardées avec succès (version historique créée).')
  } catch (error: any) {
    console.error('Error saving recommendations:', error)
    alert(\`Erreur lors de la sauvegarde : \${error.message}\`)
  }
}`;
        content = pre + fixed + post;
    }
}

fs.writeFileSync(path, content, 'utf8');
console.log("Results.vue: Fully cleaned up and fixed saveEditing.");
