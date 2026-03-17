import { normalizeDimensionKey } from "./server/utils/openai.js";

function generateStaticRecommendations(dimensionScores) {
    return dimensionScores.map(d => {
        let title = ''
        let description = ''
        let actions = []

        if (d.id === 'usages_de_lia') {
            title = "Test Use Case";
            description = "Test Desc";
        } else {
            title = `Test ${d.id}`;
            description = `Test ${d.id} ...`;
        }

        return {
            dimension: d.id,
            title,
            description,
            actions
        }
    })
}

const dimensionScores = [
    { id: 'usages_de_lia', label: "Usages de l'IA", score: 25 },
    { id: 'data', label: "Data", score: 50 },
    { id: 'competences_culture', label: "Compétences & Culture", score: 25 },
    { id: 'infrastructure', label: "Infrastructure", score: 25 },
    { id: 'strategie_vision', label: "Stratégie & Vision", score: 50 }
];

const recommendations = generateStaticRecommendations(dimensionScores);
console.log(recommendations);

dimensionScores.forEach(d => {
    const normalizedId = normalizeDimensionKey(d.id)
    const rec = recommendations.find(r => r.dimension === d.id || r.dimension === normalizedId || normalizeDimensionKey(r.dimension) === normalizedId) || { title: 'N/A', description: 'N/A', actions: [] }
    console.log(`${d.label} => Title: ${rec.title}`);
});
