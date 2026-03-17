const fs = require('fs');
const path = 'client/src/pages/Results.vue';
let content = fs.readFileSync(path, 'utf8');

// 1. Fix saveEditing responseData naming conflict
content = content.replace(
    /if \(!response\.ok\) \{\s+const responseData = await response\.json\(\)\.catch\(\(\) => \(\{ error: 'Erreur inconnue' \}\)\)\s+console\.error\('Erreur lors de la sauvegarde:', responseData\)\s+alert\(`Erreur lors de la sauvegarde des recommandations: \${responseData\.error \|\| responseData\.message \|\| 'Erreur inconnue'}`\)\s+return\s+\}\s+\s+const responseData = await response\.json\(\)\s+const modifiedAt = responseData\.modifiedAt/,
    `if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Erreur inconnue' }))
      console.error('Erreur lors de la sauvegarde:', errorData)
      alert(\`Erreur lors de la sauvegarde des recommandations: \${errorData.error || errorData.message || 'Erreur inconnue'}\`)
      return
    }
    
    const successData = await response.json()
    const modifiedAt = successData.modifiedAt`
);

// 2. Fix regenerate recommendations responseData unused
content = content.replace("const responseData = await response.json()", "await response.json()");

// 3. Fix unused normalizeDimensionKey if it's there
content = content.replace(/const normalizeDimensionKey = \(value: any\) => \{[\s\S]*?\n\}/, "");

// 4. Double check for the duplicate generateSyntheticReport (if any)
const searchStr = "async function generateSyntheticReport() {\n    await generateDetailedReport();\n}";
if (content.split(searchStr).length > 2) {
    // If it appears more than once, remove the second one
    const parts = content.split(searchStr);
    content = parts[0] + searchStr + parts.slice(2).join(searchStr);
}

fs.writeFileSync(path, content, 'utf8');
console.log("Results.vue: Cleaned and fixed.");
