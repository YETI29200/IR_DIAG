import { normalizeDimensionKey } from "./server/utils/openai.js";

function testMatch() {
    const dimensionScores = [
        { id: 'usages_de_lia', label: "Usages de l'IA" },
        { id: 'data', label: "Data" },
        { id: 'competences_culture', label: "Compétences & Culture" },
        { id: 'infrastructure', label: "Infrastructure" },
        { id: 'strategie_vision', label: "Stratégie & Vision" }
    ];

    const recommendationsAI = [
        { dimension: 'cas_usage', title: 'Title1', description: 'Desc1', actions: [] },
        { dimension: 'donnees', title: 'Title2', description: 'Desc1', actions: [] },
        { dimension: 'culture', title: 'Title3', description: 'Desc1', actions: [] },
        { dimension: 'technologie', title: 'Title4', description: 'Desc1', actions: [] },
        { dimension: 'ambition', title: 'Title5', description: 'Desc1', actions: [] }
    ];

    dimensionScores.forEach(d => {
        const normalizedId = normalizeDimensionKey(d.id);
        const rec = recommendationsAI.find(r =>
            r.dimension === d.id ||
            r.dimension === normalizedId ||
            normalizeDimensionKey(r.dimension) === normalizedId
        ) || { title: 'N/A', description: 'N/A', actions: [] };

        console.log(d.id, "=> (" + normalizedId + ") =>", rec.title);
    });
}

testMatch();
